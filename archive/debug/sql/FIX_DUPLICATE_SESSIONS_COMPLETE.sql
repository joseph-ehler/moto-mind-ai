-- ============================================================================
-- COMPLETE FIX FOR DUPLICATE SESSIONS
-- ============================================================================
-- Run this to clean up all duplicates and prevent future duplication
-- ============================================================================

-- Step 1: See what we have NOW
SELECT 
  'BEFORE CLEANUP' as status,
  COUNT(*) as total_sessions,
  COUNT(DISTINCT device_id) as unique_devices,
  COUNT(DISTINCT user_id) as unique_users
FROM sessions
WHERE session_token IS NULL;

-- Step 2: Show all sessions for diagnosis
SELECT 
  id,
  user_id,
  device_id,
  browser,
  os,
  ip_address,
  created_at,
  last_active,
  EXTRACT(EPOCH FROM (NOW() - created_at))/60 as age_minutes
FROM sessions
WHERE session_token IS NULL
ORDER BY user_id, created_at DESC;

-- Step 3: Clean up duplicates - keep ONLY the most recent session per device_id
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
)
DELETE FROM sessions
WHERE id IN (
  SELECT id FROM ranked_sessions WHERE rn > 1
);

-- Step 4: ALSO clean up by browser/os/ip (in case device_ids are all different)
WITH ranked_by_fingerprint AS (
  SELECT 
    id,
    user_id,
    browser,
    os,
    ip_address,
    device_id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, browser, os, ip_address
      ORDER BY COALESCE(last_active, created_at) DESC
    ) as rn
  FROM sessions
  WHERE session_token IS NULL
)
DELETE FROM sessions
WHERE id IN (
  SELECT id FROM ranked_by_fingerprint WHERE rn > 1
);

-- Step 5: Show results AFTER cleanup
SELECT 
  'AFTER CLEANUP' as status,
  COUNT(*) as total_sessions,
  COUNT(DISTINCT device_id) as unique_devices,
  COUNT(DISTINCT user_id) as unique_users
FROM sessions
WHERE session_token IS NULL;

-- Step 6: Show final sessions
SELECT 
  id,
  user_id,
  device_id,
  browser,
  os,
  created_at,
  last_active
FROM sessions
WHERE session_token IS NULL
ORDER BY user_id, created_at DESC;

-- Expected result: 1 session per user
RAISE NOTICE '✅ Cleanup complete! You should have 1 session per device now.';
