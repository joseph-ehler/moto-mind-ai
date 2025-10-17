-- Keep only the NEWEST session, delete all others
DELETE FROM sessions
WHERE id IN (
  SELECT id FROM sessions
  WHERE session_token IS NULL
    AND user_id = 'joseph.ehler@gmail.com'
  ORDER BY COALESCE(last_active, created_at) DESC
  OFFSET 1  -- Skip the first (newest) one
);

-- Verify - should only have 1 session now
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
