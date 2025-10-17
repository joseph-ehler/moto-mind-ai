-- ============================================================================
-- BULLETPROOF SESSIONS TABLE MIGRATION
-- ============================================================================
-- Created: 2025-10-17
-- Purpose: Make sessions table work for both NextAuth AND device tracking
--
-- SAFE TO RE-RUN: This migration is idempotent (can be run multiple times)
-- ============================================================================

-- Step 1: Make NextAuth columns nullable (for device tracking sessions)
DO $$
BEGIN
  -- Check if columns are NOT NULL before altering
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' 
    AND column_name = 'session_token' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE sessions ALTER COLUMN session_token DROP NOT NULL;
    RAISE NOTICE '✅ Made session_token nullable';
  ELSE
    RAISE NOTICE 'ℹ️  session_token already nullable';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' 
    AND column_name = 'expires' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE sessions ALTER COLUMN expires DROP NOT NULL;
    RAISE NOTICE '✅ Made expires nullable';
  ELSE
    RAISE NOTICE 'ℹ️  expires already nullable';
  END IF;
END $$;

-- Step 2: Add device tracking columns (only if they don't exist)
ALTER TABLE sessions 
  ADD COLUMN IF NOT EXISTS device_id TEXT,
  ADD COLUMN IF NOT EXISTS device_name TEXT,
  ADD COLUMN IF NOT EXISTS device_type TEXT,
  ADD COLUMN IF NOT EXISTS browser TEXT,
  ADD COLUMN IF NOT EXISTS browser_version TEXT,
  ADD COLUMN IF NOT EXISTS os TEXT,
  ADD COLUMN IF NOT EXISTS os_version TEXT,
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS location_country TEXT,
  ADD COLUMN IF NOT EXISTS location_city TEXT,
  ADD COLUMN IF NOT EXISTS location_flag TEXT,
  ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'device';

-- Step 3: Create indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_sessions_user_device ON sessions(user_id, device_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON sessions(last_active);
CREATE INDEX IF NOT EXISTS idx_sessions_device_type ON sessions(device_type);
CREATE INDEX IF NOT EXISTS idx_sessions_session_type ON sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_sessions_ip ON sessions(ip_address);

-- Step 4: Drop ALL existing policies (clean slate)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'sessions'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON sessions', pol.policyname);
    RAISE NOTICE '🗑️  Dropped policy: %', pol.policyname;
  END LOOP;
END $$;

-- Step 5: Create NEW policies (clean, simple, secure)
-- Policy 1: Service role has full access (for NextAuth and our code)
CREATE POLICY "sessions_service_role_all"
  ON sessions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Policy 2: Users can view their own device tracking sessions
CREATE POLICY "sessions_users_view_own"
  ON sessions
  FOR SELECT
  USING (
    -- Match by user_id (works for both NextAuth and device sessions)
    user_id = current_setting('request.jwt.claims', true)::json->>'email'
    OR user_id = auth.jwt() ->> 'email'
  );

-- Policy 3: Users can delete their own sessions (for sign out)
CREATE POLICY "sessions_users_delete_own"
  ON sessions
  FOR DELETE
  USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'email'
    OR user_id = auth.jwt() ->> 'email'
  );

-- Step 6: Add helpful column comments
COMMENT ON COLUMN sessions.session_token IS 'NextAuth JWT session token (NULL for device tracking sessions)';
COMMENT ON COLUMN sessions.expires IS 'NextAuth session expiration (NULL for device tracking sessions)';
COMMENT ON COLUMN sessions.device_id IS 'Persistent device identifier (from cookie)';
COMMENT ON COLUMN sessions.device_name IS 'User-friendly device name (e.g., Mac, iPhone)';
COMMENT ON COLUMN sessions.device_type IS 'Device category: desktop, mobile, tablet, unknown';
COMMENT ON COLUMN sessions.browser IS 'Browser name (e.g., Chrome, Safari)';
COMMENT ON COLUMN sessions.browser_version IS 'Browser version number';
COMMENT ON COLUMN sessions.os IS 'Operating system (e.g., macOS, iOS, Windows)';
COMMENT ON COLUMN sessions.os_version IS 'OS version number';
COMMENT ON COLUMN sessions.ip_address IS 'IP address of the request';
COMMENT ON COLUMN sessions.location_country IS 'Country from IP geolocation';
COMMENT ON COLUMN sessions.location_city IS 'City from IP geolocation';
COMMENT ON COLUMN sessions.location_flag IS 'Country flag emoji';
COMMENT ON COLUMN sessions.last_active IS 'Last activity timestamp for session tracking';
COMMENT ON COLUMN sessions.session_type IS 'Session type: "nextauth" or "device"';

-- Step 7: Verify everything is correct
DO $$
DECLARE
  missing_cols TEXT[] := ARRAY[]::TEXT[];
  col TEXT;
BEGIN
  -- Check all required columns exist
  FOREACH col IN ARRAY ARRAY[
    'id', 'user_id', 'session_token', 'expires', 'created_at',
    'device_id', 'device_name', 'device_type', 'browser', 'browser_version',
    'os', 'os_version', 'ip_address', 'location_country', 'location_city',
    'location_flag', 'last_active', 'session_type'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'sessions' AND column_name = col
    ) THEN
      missing_cols := array_append(missing_cols, col);
    END IF;
  END LOOP;

  IF array_length(missing_cols, 1) > 0 THEN
    RAISE EXCEPTION '❌ Missing columns: %', array_to_string(missing_cols, ', ');
  END IF;

  RAISE NOTICE '✅ All required columns present';
  RAISE NOTICE '✅ Policies configured';
  RAISE NOTICE '✅ Indexes created';
  RAISE NOTICE '🎉 Migration complete - sessions table is bulletproof!';
END $$;

-- Step 8: Show current table state
SELECT 
  'sessions' as table_name,
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN session_token IS NOT NULL THEN 1 END) as nextauth_sessions,
  COUNT(CASE WHEN session_token IS NULL THEN 1 END) as device_sessions,
  COUNT(DISTINCT user_id) as unique_users
FROM sessions;
