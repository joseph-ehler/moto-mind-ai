-- Debug: See ALL session data
SELECT 
  id,
  user_id,
  device_id,
  device_name,
  browser,
  os,
  ip_address,
  location_city,
  location_country,
  last_active,
  created_at,
  session_token,
  session_type
FROM sessions
ORDER BY created_at DESC;

-- Check for duplicates by device characteristics
SELECT 
  user_id,
  browser,
  os,
  ip_address,
  COUNT(*) as duplicate_count,
  array_agg(id) as session_ids,
  array_agg(device_id) as device_ids,
  array_agg(created_at) as created_times
FROM sessions
WHERE session_token IS NULL  -- Only device tracking sessions
GROUP BY user_id, browser, os, ip_address
HAVING COUNT(*) > 1;
