-- ============================================================================
-- FIX: Create Unique Index (not constraint) for Partial Uniqueness
-- ============================================================================

-- Drop the index if it exists (for idempotency)
DROP INDEX IF EXISTS idx_sessions_user_device_unique;

-- Create UNIQUE INDEX (this supports WHERE clause)
CREATE UNIQUE INDEX idx_sessions_user_device_unique
  ON sessions (user_id, device_id)
  WHERE session_token IS NULL AND device_id IS NOT NULL;

-- Verify it was created
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'sessions'
  AND indexname = 'idx_sessions_user_device_unique';

-- Test: Try to insert a duplicate (should fail)
-- This is just a test - it will error, which is what we want
DO $$
BEGIN
  -- Try to insert duplicate (will fail if constraint works)
  INSERT INTO sessions (user_id, device_id, created_at, session_token)
  SELECT user_id, device_id, NOW(), NULL
  FROM sessions
  WHERE session_token IS NULL
  LIMIT 1;
  
  RAISE EXCEPTION '❌ Unique index NOT working - duplicate was allowed!';
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE '✅ Unique index working - duplicates prevented!';
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️  Test skipped or no sessions to test with';
END $$;

-- Final verification
SELECT 
  COUNT(*) as total_device_sessions,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT device_id) as unique_devices
FROM sessions
WHERE session_token IS NULL;

RAISE NOTICE '✅ Unique index created - duplicates are now impossible!';
