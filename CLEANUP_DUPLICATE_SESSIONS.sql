-- ============================================================================
-- CLEANUP DUPLICATE SESSIONS
-- ============================================================================
-- Run this ONCE to remove duplicate sessions from same device
-- Keeps the MOST RECENT session per device (by last_active)
-- ============================================================================

-- Step 1: See what we're about to delete
SELECT 
  'DUPLICATES TO BE REMOVED:' as action,
  user_id,
  browser,
  os,
  ip_address,
  COUNT(*) as duplicate_count,
  array_agg(id ORDER BY COALESCE(last_active, created_at) DESC) as session_ids,
  array_agg(device_id ORDER BY COALESCE(last_active, created_at) DESC) as device_ids,
  array_agg(COALESCE(last_active, created_at) ORDER BY COALESCE(last_active, created_at) DESC) as timestamps
FROM sessions
WHERE session_token IS NULL  -- Only device tracking sessions
GROUP BY user_id, browser, os, ip_address
HAVING COUNT(*) > 1;

-- Step 2: Delete all duplicates EXCEPT the most recent one per device
WITH ranked_sessions AS (
  SELECT 
    id,
    user_id,
    device_id,
    browser,
    os,
    ip_address,
    last_active,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, browser, os, ip_address
      ORDER BY COALESCE(last_active, created_at) DESC
    ) as rn
  FROM sessions
  WHERE session_token IS NULL  -- Only device tracking sessions
)
DELETE FROM sessions
WHERE id IN (
  SELECT id 
  FROM ranked_sessions 
  WHERE rn > 1  -- Keep rn=1 (most recent), delete rest
);

-- Step 3: Verify cleanup - should return 1 row per user
SELECT 
  'AFTER CLEANUP:' as status,
  user_id,
  COUNT(*) as session_count,
  array_agg(device_id) as device_ids
FROM sessions
WHERE session_token IS NULL
GROUP BY user_id;

-- Step 4: Show remaining sessions
SELECT 
  id,
  user_id,
  device_id,
  device_name,
  browser,
  os,
  ip_address,
  last_active,
  created_at
FROM sessions
WHERE session_token IS NULL
ORDER BY user_id, last_active DESC;

-- Expected result: 1 session per user (the most recent one)
