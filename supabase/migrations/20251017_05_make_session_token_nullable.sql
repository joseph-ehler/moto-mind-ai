-- Make session_token nullable for custom session tracking
-- NextAuth stores tokens differently, so we need to allow null for our tracking

ALTER TABLE sessions 
  ALTER COLUMN session_token DROP NOT NULL;

-- Add comment
COMMENT ON COLUMN sessions.session_token IS 'NextAuth session token (nullable for custom session tracking)';

-- Verify
DO $$
BEGIN
  RAISE NOTICE '✅ session_token is now nullable - custom session tracking will work';
END $$;
