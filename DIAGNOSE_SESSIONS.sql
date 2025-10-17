-- Diagnose duplicate sessions issue
-- Run this to see what's happening

-- 1. Show all sessions with device_ids
SELECT 
  id,
  device_id,
  browser,
  os,
  ip_address,
  created_at,
  last_active,
  CASE 
    WHEN device_id IS NULL THEN '❌ NULL'
    WHEN device_id = '' THEN '❌ EMPTY'
    ELSE '✅ HAS ID'
  END as device_id_status
FROM sessions
WHERE session_token IS NULL
ORDER BY created_at DESC;

-- 2. Count sessions per device_id
SELECT 
  device_id,
  COUNT(*) as session_count,
  array_agg(id) as session_ids,
  MIN(created_at) as first_created,
  MAX(last_active) as last_active
FROM sessions
WHERE session_token IS NULL
GROUP BY device_id
ORDER BY session_count DESC;

-- 3. Find sessions that should be merged (same user, browser, OS, IP but different device_id)
SELECT 
  user_id,
  browser,
  os,
  ip_address,
  COUNT(*) as duplicate_count,
  array_agg(device_id) as different_device_ids,
  array_agg(id) as session_ids
FROM sessions
WHERE session_token IS NULL
GROUP BY user_id, browser, os, ip_address
HAVING COUNT(*) > 1;
