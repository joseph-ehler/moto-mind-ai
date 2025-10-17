-- Quick check: What sessions exist right now?
SELECT 
  id,
  device_id,
  created_at,
  last_active,
  EXTRACT(EPOCH FROM (NOW() - created_at))/60 as age_minutes
FROM sessions
WHERE session_token IS NULL
  AND user_id = 'joseph.ehler@gmail.com'
ORDER BY created_at DESC;

-- Are they the SAME device_id or different?
SELECT 
  device_id,
  COUNT(*) as count
FROM sessions
WHERE session_token IS NULL
  AND user_id = 'joseph.ehler@gmail.com'
GROUP BY device_id;
