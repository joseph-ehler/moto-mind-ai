-- Complete Sessions Table Fix
-- Align with session-tracker.ts expectations
-- Created: 2025-10-17

-- Drop conflicting unique constraint if it exists (from previous migration)
DROP INDEX IF EXISTS idx_sessions_device_id;

-- Add all missing columns that session-tracker.ts needs
ALTER TABLE sessions 
  ADD COLUMN IF NOT EXISTS device_id TEXT,
  ADD COLUMN IF NOT EXISTS device_name TEXT,
  ADD COLUMN IF NOT EXISTS browser_version TEXT,
  ADD COLUMN IF NOT EXISTS os_version TEXT,
  ADD COLUMN IF NOT EXISTS location_flag TEXT,
  ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW();

-- Migrate data from old columns if they exist
DO $$
BEGIN
  -- Copy last_active_at to last_active if it exists
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'last_active_at'
  ) THEN
    UPDATE sessions SET last_active = COALESCE(last_active, last_active_at);
  END IF;
  
  -- Copy device_fingerprint to device_id if device_id is null
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'device_fingerprint'
  ) THEN
    UPDATE sessions SET device_id = COALESCE(device_id, device_fingerprint);
  END IF;
END $$;

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_sessions_user_device ON sessions(user_id, device_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON sessions(last_active);
CREATE INDEX IF NOT EXISTS idx_sessions_device_type ON sessions(device_type);

-- Add helpful comments
COMMENT ON COLUMN sessions.device_id IS 'Unique identifier for this device (browser fingerprint)';
COMMENT ON COLUMN sessions.device_name IS 'User-friendly device name (e.g., Mac, iPhone 15)';
COMMENT ON COLUMN sessions.browser IS 'Browser name (e.g., Chrome, Safari)';
COMMENT ON COLUMN sessions.browser_version IS 'Browser version number';
COMMENT ON COLUMN sessions.os IS 'Operating system (e.g., macOS, iOS)';
COMMENT ON COLUMN sessions.os_version IS 'OS version number';
COMMENT ON COLUMN sessions.location_country IS 'Country name from IP geolocation';
COMMENT ON COLUMN sessions.location_city IS 'City name from IP geolocation';
COMMENT ON COLUMN sessions.location_flag IS 'Country flag emoji';
COMMENT ON COLUMN sessions.last_active IS 'Last activity timestamp for session tracking';

-- Make session_token nullable for our custom session tracking
-- (NextAuth sessions use it, but our device sessions don't need it)
ALTER TABLE sessions ALTER COLUMN session_token DROP NOT NULL;
ALTER TABLE sessions ALTER COLUMN expires DROP NOT NULL;

-- Add a type column to differentiate NextAuth sessions from device tracking sessions
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'device';
COMMENT ON COLUMN sessions.session_type IS 'Type: nextauth (JWT sessions) or device (tracking sessions)';

-- Create index on session type
CREATE INDEX IF NOT EXISTS idx_sessions_type ON sessions(session_type);

-- Update RLS policy to allow users to read their own device sessions
DROP POLICY IF EXISTS "Service role only" ON sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON sessions;

-- Service role full access
CREATE POLICY "Service role full access" ON sessions
  FOR ALL USING (auth.role() = 'service_role');

-- Users can view their own device tracking sessions
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'email'
    OR user_id = auth.jwt() ->> 'email'
  );

-- Verify the schema is correct
DO $$
BEGIN
  -- Check required columns exist
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'device_id') THEN
    RAISE EXCEPTION '❌ device_id column missing';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'device_name') THEN
    RAISE EXCEPTION '❌ device_name column missing';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'browser') THEN
    RAISE EXCEPTION '❌ browser column missing';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'browser_version') THEN
    RAISE EXCEPTION '❌ browser_version column missing';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'os') THEN
    RAISE EXCEPTION '❌ os column missing';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'os_version') THEN
    RAISE EXCEPTION '❌ os_version column missing';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'location_country') THEN
    RAISE EXCEPTION '❌ location_country column missing';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'location_city') THEN
    RAISE EXCEPTION '❌ location_city column missing';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'location_flag') THEN
    RAISE EXCEPTION '❌ location_flag column missing';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'last_active') THEN
    RAISE EXCEPTION '❌ last_active column missing';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'ip_address') THEN
    RAISE EXCEPTION '❌ ip_address column missing';
  END IF;
  
  RAISE NOTICE '✅ Sessions table schema is correct - all columns present';
END $$;
