-- Fix Sessions Table Schema
-- Add missing columns that session-tracker.ts expects

-- Add all missing columns
ALTER TABLE sessions 
  ADD COLUMN IF NOT EXISTS device_id TEXT,
  ADD COLUMN IF NOT EXISTS device_name TEXT,
  ADD COLUMN IF NOT EXISTS browser_version TEXT,
  ADD COLUMN IF NOT EXISTS os_version TEXT,
  ADD COLUMN IF NOT EXISTS location_flag TEXT,
  ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW();

-- Update existing last_active_at to last_active if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'last_active_at'
  ) THEN
    UPDATE sessions SET last_active = last_active_at WHERE last_active IS NULL;
  END IF;
END $$;

-- Create unique index on device_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_device_id ON sessions(device_id);

-- Create index for user lookups
CREATE INDEX IF NOT EXISTS idx_sessions_user_device ON sessions(user_id, device_id);

-- Add comments
COMMENT ON COLUMN sessions.device_id IS 'Unique identifier for this device';
COMMENT ON COLUMN sessions.device_name IS 'User-friendly device name (e.g., Mac, iPhone)';
COMMENT ON COLUMN sessions.browser_version IS 'Browser version number';
COMMENT ON COLUMN sessions.os_version IS 'Operating system version';
COMMENT ON COLUMN sessions.location_flag IS 'Country flag emoji';
COMMENT ON COLUMN sessions.last_active IS 'Last activity timestamp';

-- Verify columns exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'device_id') THEN
    RAISE NOTICE '✅ Sessions table schema fixed';
  ELSE
    RAISE EXCEPTION 'Failed to add device_id column';
  END IF;
END $$;
