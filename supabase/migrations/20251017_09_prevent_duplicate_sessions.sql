-- ============================================================================
-- PREVENT DUPLICATE SESSIONS - Unique Constraint
-- ============================================================================
-- This ensures only ONE session per device_id + user_id combination
-- ============================================================================

-- Step 1: Clean up any existing duplicates FIRST
WITH ranked_sessions AS (
  SELECT 
    id,
    user_id,
    device_id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, device_id
      ORDER BY COALESCE(last_active, created_at) DESC
    ) as rn
  FROM sessions
  WHERE session_token IS NULL
    AND device_id IS NOT NULL
)
DELETE FROM sessions
WHERE id IN (
  SELECT id FROM ranked_sessions WHERE rn > 1
);

-- Step 2: Add UNIQUE constraint to prevent future duplicates
-- Drop the constraint if it exists (for idempotency)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'sessions_user_device_unique'
  ) THEN
    ALTER TABLE sessions DROP CONSTRAINT sessions_user_device_unique;
  END IF;
END $$;

-- Create the unique constraint
ALTER TABLE sessions 
  ADD CONSTRAINT sessions_user_device_unique 
  UNIQUE (user_id, device_id)
  WHERE session_token IS NULL AND device_id IS NOT NULL;

-- Step 3: Verify
SELECT 
  'AFTER CONSTRAINT' as status,
  user_id,
  device_id,
  COUNT(*) as session_count
FROM sessions
WHERE session_token IS NULL
GROUP BY user_id, device_id
HAVING COUNT(*) > 1;

-- Should return 0 rows if working correctly
COMMENT ON CONSTRAINT sessions_user_device_unique ON sessions IS 
  'Ensures only one device tracking session per user+device combination';

-- Final verification
SELECT 
  COUNT(*) as total_device_sessions,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT device_id) as unique_devices
FROM sessions
WHERE session_token IS NULL;

RAISE NOTICE '✅ Unique constraint added - duplicates prevented!';
