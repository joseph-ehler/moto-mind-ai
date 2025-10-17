-- Vehicle Tracking Tables
-- Creates tables for GPS tracking sessions and location points

-- =====================================================
-- TRACKING SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tracking_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE, -- Client-generated session ID
  user_id TEXT NOT NULL, -- NextAuth user ID (not a foreign key)
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  
  -- Session metadata
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'completed', 'error')),
  
  -- Trip statistics
  distance_meters NUMERIC(10, 2) DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  max_speed_mps NUMERIC(6, 2) DEFAULT 0, -- meters per second
  avg_speed_mps NUMERIC(6, 2) DEFAULT 0,
  points_recorded INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- LOCATION POINTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS location_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES tracking_sessions(id) ON DELETE CASCADE,
  
  -- GPS coordinates
  latitude NUMERIC(10, 8) NOT NULL, -- 8 decimal places = ~1mm accuracy
  longitude NUMERIC(11, 8) NOT NULL,
  altitude NUMERIC(8, 2), -- meters
  accuracy NUMERIC(8, 2) NOT NULL, -- meters
  
  -- Movement data
  speed NUMERIC(6, 2) NOT NULL DEFAULT 0, -- meters per second
  heading NUMERIC(5, 2) DEFAULT 0, -- degrees (0-360)
  
  -- Timestamps
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TRACKING EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES tracking_sessions(id) ON DELETE CASCADE,
  
  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'start', 'stop', 'pause', 'resume', 'crash', 'speeding', 'low-battery'
  )),
  
  -- Location at event time (optional)
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  
  -- Event metadata
  event_data JSONB,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Tracking sessions indexes
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_user_id 
  ON tracking_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_tracking_sessions_vehicle_id 
  ON tracking_sessions(vehicle_id);

CREATE INDEX IF NOT EXISTS idx_tracking_sessions_session_id 
  ON tracking_sessions(session_id);

CREATE INDEX IF NOT EXISTS idx_tracking_sessions_start_time 
  ON tracking_sessions(start_time DESC);

CREATE INDEX IF NOT EXISTS idx_tracking_sessions_status 
  ON tracking_sessions(status);

-- Location points indexes
CREATE INDEX IF NOT EXISTS idx_location_points_session_id 
  ON location_points(session_id);

CREATE INDEX IF NOT EXISTS idx_location_points_recorded_at 
  ON location_points(recorded_at DESC);

-- Geospatial index for location queries
CREATE INDEX IF NOT EXISTS idx_location_points_coords 
  ON location_points(latitude, longitude);

-- Tracking events indexes
CREATE INDEX IF NOT EXISTS idx_tracking_events_session_id 
  ON tracking_events(session_id);

CREATE INDEX IF NOT EXISTS idx_tracking_events_type 
  ON tracking_events(event_type);

CREATE INDEX IF NOT EXISTS idx_tracking_events_occurred_at 
  ON tracking_events(occurred_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE tracking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;

-- Tracking sessions policies
CREATE POLICY "Users can view their own tracking sessions"
  ON tracking_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own tracking sessions"
  ON tracking_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tracking sessions"
  ON tracking_sessions FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own tracking sessions"
  ON tracking_sessions FOR DELETE
  USING (user_id = auth.uid());

-- Location points policies (through session)
CREATE POLICY "Users can view location points from their sessions"
  ON location_points FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tracking_sessions
      WHERE tracking_sessions.id = location_points.session_id
      AND tracking_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert location points to their sessions"
  ON location_points FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tracking_sessions
      WHERE tracking_sessions.id = location_points.session_id
      AND tracking_sessions.user_id = auth.uid()
    )
  );

-- Tracking events policies (through session)
CREATE POLICY "Users can view events from their sessions"
  ON tracking_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tracking_sessions
      WHERE tracking_sessions.id = tracking_events.session_id
      AND tracking_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create events for their sessions"
  ON tracking_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tracking_sessions
      WHERE tracking_sessions.id = tracking_events.session_id
      AND tracking_sessions.user_id = auth.uid()
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Update tracking session statistics
CREATE OR REPLACE FUNCTION update_tracking_session_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update point count
  UPDATE tracking_sessions
  SET 
    points_recorded = (
      SELECT COUNT(*) 
      FROM location_points 
      WHERE session_id = NEW.session_id
    ),
    updated_at = NOW()
  WHERE id = NEW.session_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update stats on location point insert
CREATE TRIGGER trigger_update_session_stats
  AFTER INSERT ON location_points
  FOR EACH ROW
  EXECUTE FUNCTION update_tracking_session_stats();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tracking_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tracking_sessions_updated_at
  BEFORE UPDATE ON tracking_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_tracking_session_timestamp();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE tracking_sessions IS 'GPS tracking sessions for vehicle trips';
COMMENT ON TABLE location_points IS 'Individual GPS location points recorded during tracking';
COMMENT ON TABLE tracking_events IS 'Events that occurred during tracking (crashes, speeding, etc)';

COMMENT ON COLUMN tracking_sessions.session_id IS 'Client-generated unique session identifier';
COMMENT ON COLUMN tracking_sessions.distance_meters IS 'Total distance traveled in meters';
COMMENT ON COLUMN tracking_sessions.duration_seconds IS 'Total trip duration in seconds';
COMMENT ON COLUMN tracking_sessions.max_speed_mps IS 'Maximum speed recorded in meters per second';
COMMENT ON COLUMN tracking_sessions.avg_speed_mps IS 'Average speed in meters per second';

COMMENT ON COLUMN location_points.latitude IS 'GPS latitude (8 decimal places = ~1mm accuracy)';
COMMENT ON COLUMN location_points.longitude IS 'GPS longitude (8 decimal places = ~1mm accuracy)';
COMMENT ON COLUMN location_points.accuracy IS 'GPS accuracy radius in meters';
COMMENT ON COLUMN location_points.speed IS 'Speed in meters per second from GPS';
COMMENT ON COLUMN location_points.heading IS 'Compass heading in degrees (0-360)';
