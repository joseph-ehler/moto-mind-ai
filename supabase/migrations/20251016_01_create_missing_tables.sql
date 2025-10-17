-- Migration: Create Missing Tables
-- Generated: 2025-10-16
-- Purpose: Create tables required by API routes but missing from database

-- ============================================================================
-- 1. LOGS TABLE
-- ============================================================================
-- Purpose: System and application logs
-- Used by: /api/logs

CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  level VARCHAR(20) NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  source VARCHAR(100), -- e.g., 'api', 'background-job', 'webhook'
  request_id VARCHAR(100), -- For tracing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for logs
CREATE INDEX idx_logs_tenant_id ON logs(tenant_id);
CREATE INDEX idx_logs_user_id ON logs(user_id);
CREATE INDEX idx_logs_level ON logs(level);
CREATE INDEX idx_logs_created_at ON logs(created_at DESC);
CREATE INDEX idx_logs_request_id ON logs(request_id);

-- RLS for logs
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant's logs"
  ON logs FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "Service role can manage all logs"
  ON logs FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

COMMENT ON TABLE logs IS 'System and application logs with tenant isolation';

-- ============================================================================
-- 2. FAVORITE_STATIONS TABLE
-- ============================================================================
-- Purpose: User favorite fuel stations
-- Used by: /api/stations/favorites, /api/stations/[stationId]/favorite

CREATE TABLE IF NOT EXISTS favorite_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  station_id VARCHAR(255) NOT NULL, -- Format: vendor_lat_lng
  station_name VARCHAR(255),
  station_address TEXT,
  vendor VARCHAR(100),
  lat DECIMAL(10, 7),
  lng DECIMAL(10, 7),
  notes TEXT,
  favorited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_visited_at TIMESTAMP WITH TIME ZONE,
  visit_count INTEGER DEFAULT 0,
  
  -- Prevent duplicate favorites
  UNIQUE(user_id, station_id)
);

-- Indexes for favorite_stations
CREATE INDEX idx_favorite_stations_tenant_id ON favorite_stations(tenant_id);
CREATE INDEX idx_favorite_stations_user_id ON favorite_stations(user_id);
CREATE INDEX idx_favorite_stations_station_id ON favorite_stations(station_id);
CREATE INDEX idx_favorite_stations_favorited_at ON favorite_stations(favorited_at DESC);

-- Geospatial index for location-based queries
CREATE INDEX idx_favorite_stations_location ON favorite_stations(lat, lng);

-- RLS for favorite_stations
ALTER TABLE favorite_stations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites"
  ON favorite_stations FOR SELECT
  USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can insert their own favorites"
  ON favorite_stations FOR INSERT
  WITH CHECK (
    user_id = auth.uid()::uuid
    AND tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update their own favorites"
  ON favorite_stations FOR UPDATE
  USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can delete their own favorites"
  ON favorite_stations FOR DELETE
  USING (user_id = auth.uid()::uuid);

COMMENT ON TABLE favorite_stations IS 'User favorite fuel stations with geospatial support';

-- ============================================================================
-- 3. USERS TABLE (Extend existing profiles)
-- ============================================================================
-- Note: We already have a 'profiles' table, but the API expects 'users'
-- Option 1: Create a VIEW that aliases profiles -> users
-- Option 2: Add preferences column to profiles table
-- We'll use Option 2 and create a view for compatibility

-- Add preferences column to profiles if it doesn't exist
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN profiles.preferences IS 'User preferences (units, notifications, display settings)';

-- Create a view for API compatibility
CREATE OR REPLACE VIEW users AS
  SELECT 
    id,
    email,
    full_name,
    preferences,
    created_at
  FROM profiles;

COMMENT ON VIEW users IS 'Compatibility view for user preferences API';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  -- Verify all tables exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'logs') THEN
    RAISE EXCEPTION 'logs table not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'favorite_stations') THEN
    RAISE EXCEPTION 'favorite_stations table not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'users') THEN
    RAISE EXCEPTION 'users view not created';
  END IF;
  
  RAISE NOTICE '✅ All missing tables created successfully';
END $$;
