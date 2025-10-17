-- Cleanup Duplicate Sessions
-- Keeps only the most recent session per device
-- Created: 2025-10-17

-- For each user + device combination, keep only the most recent session
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
),
duplicate_sessions AS (
  SELECT id FROM ranked_sessions WHERE rn > 1
)
DELETE FROM sessions
WHERE id IN (SELECT id FROM duplicate_sessions);

-- Log the cleanup
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✅ Cleaned up % duplicate sessions', deleted_count;
END $$;

-- Show remaining sessions summary
SELECT 
  user_id,
  COUNT(*) as session_count,
  MAX(last_active) as last_active
FROM sessions
WHERE session_token IS NULL
GROUP BY user_id
ORDER BY last_active DESC;
