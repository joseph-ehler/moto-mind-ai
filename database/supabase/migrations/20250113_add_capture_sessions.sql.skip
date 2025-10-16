-- Migration: Add Capture Session Tracking
-- Description: Track capture sessions to detect abandonment and measure UX
-- Priority: P1 - IMPORTANT (enables analytics and orphan cleanup)

-- ============================================================================
-- 1. CAPTURE_SESSIONS TABLE
-- ============================================================================
-- Tracks each capture session from start to completion/abandonment
-- NOTE: Run 20250113_fix_vehicle_events_pk.sql FIRST if you get foreign key errors

CREATE TABLE IF NOT EXISTS capture_sessions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Session Info
  event_type VARCHAR(50) NOT NULL,     -- 'fuel' | 'service' | 'damage' | 'parking' | etc.
  capture_path VARCHAR(20) NOT NULL CHECK (capture_path IN ('quick', 'guided')),
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  
  -- Progress Tracking
  total_steps INTEGER,                 -- 4 (for fuel guided flow)
  completed_steps INTEGER DEFAULT 0,   -- 2 (if user captured 2 photos)
  photos_captured INTEGER DEFAULT 0,   -- Number of photos uploaded
  
  -- Step History (which steps were completed)
  completed_step_ids TEXT[],           -- ['receipt', 'odometer']
  
  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  abandoned_at TIMESTAMPTZ,
  
  -- Duration Metrics
  total_duration_ms INTEGER,           -- Time from start to complete/abandon
  avg_step_duration_ms INTEGER,        -- Average time per step
  
  -- Result
  event_id UUID REFERENCES vehicle_events(id) ON DELETE SET NULL,  -- If session completed
  
  -- Abandonment Context
  abandoned_at_step VARCHAR(50),       -- Which step user was on when they abandoned
  abandonment_reason VARCHAR(100),     -- 'back_button' | 'closed_tab' | 'timeout' | etc.
  
  -- Device & Location
  platform VARCHAR(20),                -- 'iOS' | 'Android' | 'Web'
  user_agent TEXT,
  gps_latitude DECIMAL(10,8),          -- Where session started
  gps_longitude DECIMAL(11,8),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX idx_capture_sessions_vehicle_id ON capture_sessions(vehicle_id);
CREATE INDEX idx_capture_sessions_tenant_id ON capture_sessions(tenant_id);
CREATE INDEX idx_capture_sessions_status ON capture_sessions(status);
CREATE INDEX idx_capture_sessions_event_type ON capture_sessions(event_type);
CREATE INDEX idx_capture_sessions_started_at ON capture_sessions(started_at);
CREATE INDEX idx_capture_sessions_abandoned ON capture_sessions(status, abandoned_at) WHERE status = 'abandoned';

-- ============================================================================
-- 3. COMMENTS
-- ============================================================================

COMMENT ON TABLE capture_sessions IS 'Tracks capture sessions to detect abandonment and measure UX';
COMMENT ON COLUMN capture_sessions.status IS 'active = in progress, completed = saved event, abandoned = user quit';
COMMENT ON COLUMN capture_sessions.capture_path IS 'quick = single photo, guided = multi-step flow';
COMMENT ON COLUMN capture_sessions.total_steps IS 'Expected number of steps in guided flow';
COMMENT ON COLUMN capture_sessions.completed_steps IS 'Number of steps user completed';
COMMENT ON COLUMN capture_sessions.photos_captured IS 'Number of photos uploaded (may be > steps if retakes)';
COMMENT ON COLUMN capture_sessions.total_duration_ms IS 'Time from start to completion/abandonment';
COMMENT ON COLUMN capture_sessions.abandoned_at_step IS 'Which step user was on when they abandoned';
COMMENT ON COLUMN capture_sessions.abandonment_reason IS 'Why session was abandoned: back_button, closed_tab, timeout';

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

-- Auto-update updated_at and last_activity_at timestamps
CREATE OR REPLACE FUNCTION update_capture_sessions_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_activity_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER capture_sessions_timestamps
BEFORE UPDATE ON capture_sessions
FOR EACH ROW
EXECUTE FUNCTION update_capture_sessions_timestamps();

-- Auto-calculate total_duration_ms on completion/abandonment
CREATE OR REPLACE FUNCTION calculate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('completed', 'abandoned') AND OLD.status = 'active' THEN
    NEW.total_duration_ms = EXTRACT(EPOCH FROM (NOW() - NEW.started_at)) * 1000;
    
    IF NEW.completed_steps > 0 THEN
      NEW.avg_step_duration_ms = NEW.total_duration_ms / NEW.completed_steps;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_session_duration_trigger
BEFORE UPDATE ON capture_sessions
FOR EACH ROW
WHEN (NEW.status IN ('completed', 'abandoned') AND OLD.status = 'active')
EXECUTE FUNCTION calculate_session_duration();

-- Auto-mark sessions as abandoned after 30 minutes of inactivity
CREATE OR REPLACE FUNCTION auto_abandon_inactive_sessions()
RETURNS void AS $$
BEGIN
  UPDATE capture_sessions
  SET 
    status = 'abandoned',
    abandoned_at = NOW(),
    abandonment_reason = 'timeout'
  WHERE status = 'active'
    AND last_activity_at < NOW() - INTERVAL '30 minutes';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_abandon_inactive_sessions IS 'Run this periodically (cron job) to mark inactive sessions as abandoned';

-- ============================================================================
-- 5. RLS POLICIES
-- ============================================================================

ALTER TABLE capture_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see sessions for their tenant
CREATE POLICY capture_sessions_tenant_isolation ON capture_sessions
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- ============================================================================
-- 6. GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON capture_sessions TO authenticated;
-- Note: UUID primary keys don't use sequences, so no sequence grant needed

-- ============================================================================
-- 7. ANALYTICS VIEWS
-- ============================================================================

-- View: Session completion rate by event type
CREATE OR REPLACE VIEW capture_session_analytics AS
SELECT 
  event_type,
  capture_path,
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_sessions,
  COUNT(*) FILTER (WHERE status = 'abandoned') as abandoned_sessions,
  ROUND(COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*) * 100, 2) as completion_rate,
  AVG(total_duration_ms) FILTER (WHERE status = 'completed') as avg_completion_time_ms,
  AVG(photos_captured) FILTER (WHERE status = 'completed') as avg_photos_per_session
FROM capture_sessions
WHERE started_at > NOW() - INTERVAL '30 days'
GROUP BY event_type, capture_path
ORDER BY total_sessions DESC;

COMMENT ON VIEW capture_session_analytics IS 'Capture session metrics: completion rate, avg time, photos per session';

-- View: Abandonment analysis
CREATE OR REPLACE VIEW capture_abandonment_analysis AS
SELECT 
  event_type,
  abandoned_at_step,
  abandonment_reason,
  COUNT(*) as abandonment_count,
  AVG(completed_steps) as avg_steps_before_abandon,
  AVG(total_duration_ms) as avg_time_before_abandon_ms
FROM capture_sessions
WHERE status = 'abandoned'
  AND started_at > NOW() - INTERVAL '30 days'
GROUP BY event_type, abandoned_at_step, abandonment_reason
ORDER BY abandonment_count DESC;

COMMENT ON VIEW capture_abandonment_analysis IS 'Analyzes where and why users abandon capture sessions';
