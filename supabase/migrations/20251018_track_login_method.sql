-- ============================================================================
-- ENHANCED LOGIN METHOD TRACKING
-- ============================================================================
-- Created: 2025-10-18
-- Purpose: Track last login method for better UX
-- ============================================================================

-- ============================================================================
-- 1. UPDATE LOGIN PREFERENCES FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_login_preferences(
  p_user_id TEXT,
  p_method TEXT -- 'google', 'email', 'sms'
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
    last_login_method,
    last_login_at,
    login_count,
    updated_at
  ) VALUES (
    p_user_id,
    p_method,
    NOW(),
    1,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
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
  'Update user login preferences with method tracking. Creates record if not exists.';

-- ============================================================================
-- 2. GET LOGIN PREFERENCES FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_login_preferences(p_user_id TEXT)
RETURNS TABLE(
  last_method TEXT,
  preferred_method TEXT,
  login_count INTEGER,
  last_login_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ulp.last_login_method,
    ulp.preferred_method,
    ulp.login_count,
    ulp.last_login_at
  FROM user_login_preferences ulp
  WHERE ulp.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

COMMENT ON FUNCTION get_login_preferences IS 
  'Get user login preferences including last method used.';

-- ============================================================================
-- 3. GET LOGIN PREFERENCES BY EMAIL (for pre-auth lookup)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_login_preferences_by_email(p_email TEXT)
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
  -- Join with users table to find by email
  INNER JOIN users u ON u.id = ulp.user_id
  WHERE u.email = p_email
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

COMMENT ON FUNCTION get_login_preferences_by_email IS 
  'Get user login preferences by email (for showing last method before auth).';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  -- Test functions exist
  IF EXISTS (SELECT FROM pg_proc WHERE proname = 'update_login_preferences') THEN
    RAISE NOTICE '✅ update_login_preferences function created';
  ELSE
    RAISE EXCEPTION '❌ update_login_preferences function creation failed';
  END IF;
  
  IF EXISTS (SELECT FROM pg_proc WHERE proname = 'get_login_preferences') THEN
    RAISE NOTICE '✅ get_login_preferences function created';
  ELSE
    RAISE EXCEPTION '❌ get_login_preferences function creation failed';
  END IF;
  
  IF EXISTS (SELECT FROM pg_proc WHERE proname = 'get_login_preferences_by_email') THEN
    RAISE NOTICE '✅ get_login_preferences_by_email function created';
  ELSE
    RAISE EXCEPTION '❌ get_login_preferences_by_email function creation failed';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Login method tracking enhanced!';
  RAISE NOTICE '📊 Now tracking: google, email, sms';
  RAISE NOTICE '✨ UI can show last used method for better UX';
END $$;
