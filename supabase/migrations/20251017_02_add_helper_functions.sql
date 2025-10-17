-- ============================================================================
-- HELPER FUNCTIONS FOR AUTH ENHANCEMENTS
-- ============================================================================
-- Created: 2025-10-17
-- Purpose: Add utility functions for auth features
-- ============================================================================

-- ============================================================================
-- 1. INCREMENT LOGIN COUNT
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_login_count(p_user_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE user_login_preferences
  SET login_count = COALESCE(login_count, 0) + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- If no row was updated, insert a new one
  IF NOT FOUND THEN
    INSERT INTO user_login_preferences (
      user_id,
      last_login_method,
      last_login_at,
      login_count
    ) VALUES (
      p_user_id,
      'credentials', -- Default
      NOW(),
      1
    )
    ON CONFLICT (user_id) DO UPDATE
    SET login_count = user_login_preferences.login_count + 1,
        updated_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

COMMENT ON FUNCTION increment_login_count IS 'Increment login count for a user. Creates record if not exists.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  -- Test the function exists
  IF EXISTS (
    SELECT FROM pg_proc 
    WHERE proname = 'increment_login_count'
  ) THEN
    RAISE NOTICE '✅ increment_login_count function created';
  ELSE
    RAISE EXCEPTION '❌ increment_login_count function creation failed';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Helper functions added successfully!';
END $$;
