-- ============================================================================
-- FIX: Login Preferences Lookup Without Users Table Dependency
-- ============================================================================
-- Created: 2025-10-18
-- Purpose: Allow lookup by email even if users table doesn't have the record
-- ============================================================================

-- Drop the old function
DROP FUNCTION IF EXISTS get_login_preferences_by_email(TEXT);

-- Create a simpler version that checks both patterns:
-- 1. user_id is email (old pattern)
-- 2. Join with users table (new pattern)
CREATE OR REPLACE FUNCTION get_login_preferences_by_email(p_email TEXT)
RETURNS TABLE(
  user_id TEXT,
  last_method TEXT,
  preferred_method TEXT,
  login_count INTEGER,
  last_login_at TIMESTAMPTZ
) AS $$
BEGIN
  -- First try: Check if user_id IS the email (backward compatibility)
  RETURN QUERY
  SELECT 
    ulp.user_id,
    ulp.last_login_method,
    ulp.preferred_method,
    ulp.login_count,
    ulp.last_login_at
  FROM user_login_preferences ulp
  WHERE ulp.user_id = p_email
  LIMIT 1;
  
  -- If found, return
  IF FOUND THEN
    RETURN;
  END IF;
  
  -- Second try: Check via users table join (if users table exists)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
    RETURN QUERY
    SELECT 
      ulp.user_id,
      ulp.last_login_method,
      ulp.preferred_method,
      ulp.login_count,
      ulp.last_login_at
    FROM user_login_preferences ulp
    INNER JOIN users u ON u.id::TEXT = ulp.user_id  -- Cast UUID to TEXT
    WHERE u.email = p_email
    LIMIT 1;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

COMMENT ON FUNCTION get_login_preferences_by_email IS 
  'Get user login preferences by email. Handles both old pattern (email as user_id) and new pattern (UUID with users table join).';

-- ============================================================================
-- ALTERNATIVE: Store email directly in user_login_preferences
-- ============================================================================

-- Add email column to user_login_preferences for faster lookups
ALTER TABLE user_login_preferences 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index on email
CREATE INDEX IF NOT EXISTS idx_login_prefs_email 
ON user_login_preferences(email);

-- Update existing records with email from users table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
    UPDATE user_login_preferences ulp
    SET email = u.email
    FROM users u
    WHERE u.id::TEXT = ulp.user_id  -- Cast UUID to TEXT for comparison
    AND ulp.email IS NULL;
  END IF;
END $$;

-- Update existing records where user_id IS the email (old pattern)
UPDATE user_login_preferences
SET email = user_id
WHERE email IS NULL
AND user_id LIKE '%@%';

-- ============================================================================
-- NEW FUNCTION: Simple lookup by email column
-- ============================================================================

CREATE OR REPLACE FUNCTION get_login_preferences_by_email_simple(p_email TEXT)
RETURNS TABLE(
  user_id TEXT,
  last_method TEXT,
  preferred_method TEXT,
  login_count INTEGER,
  last_login_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ulp.user_id,
    ulp.last_login_method,
    ulp.preferred_method,
    ulp.login_count,
    ulp.last_login_at
  FROM user_login_preferences ulp
  WHERE ulp.email = p_email
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

COMMENT ON FUNCTION get_login_preferences_by_email_simple IS 
  'Get user login preferences by email using direct email column lookup (fastest).';

-- ============================================================================
-- UPDATE: update_login_preferences to also store email
-- ============================================================================

-- Drop the old version first (with 2 parameters)
DROP FUNCTION IF EXISTS update_login_preferences(TEXT, TEXT);

-- Create new version with 3 parameters
CREATE OR REPLACE FUNCTION update_login_preferences(
  p_user_id TEXT,
  p_method TEXT,
  p_email TEXT DEFAULT NULL
)
RETURNS TABLE(
  last_method TEXT,
  login_count INTEGER,
  last_login_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Insert or update login preferences
  INSERT INTO user_login_preferences (
    user_id,
    email,
    last_login_method,
    last_login_at,
    login_count,
    updated_at
  ) VALUES (
    p_user_id,
    p_email,
    p_method,
    NOW(),
    1,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    email = COALESCE(p_email, user_login_preferences.email),
    last_login_method = p_method,
    last_login_at = NOW(),
    login_count = user_login_preferences.login_count + 1,
    updated_at = NOW();
  
  -- Return updated preferences
  RETURN QUERY
  SELECT 
    ulp.last_login_method,
    ulp.login_count,
    ulp.last_login_at
  FROM user_login_preferences ulp
  WHERE ulp.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

COMMENT ON FUNCTION update_login_preferences IS 
  'Update user login preferences with method tracking. Now also stores email for faster lookups.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Login preferences lookup fixed!';
  RAISE NOTICE '📊 Added email column to user_login_preferences';
  RAISE NOTICE '🔍 Created faster lookup function';
  RAISE NOTICE '📝 Updated update_login_preferences to store email';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Test with: SELECT * FROM get_login_preferences_by_email(''your@email.com'');';
END $$;
