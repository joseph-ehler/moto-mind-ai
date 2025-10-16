-- ============================================
-- CREATE SESSION CONTEXT FUNCTION
-- Migration: 20251015_create_session_context_function.sql
-- 
-- Purpose: Create PostgreSQL function to set session
-- variables for RLS policy enforcement
-- ============================================

-- Function to set session context for RLS
CREATE OR REPLACE FUNCTION set_session_context(
  tenant_id TEXT,
  user_id TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set session variables that RLS policies check
  PERFORM set_config('app.current_tenant_id', tenant_id, false);
  PERFORM set_config('app.current_user_id', user_id, false);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION set_session_context(TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION set_session_context IS 'Sets PostgreSQL session variables for RLS tenant isolation';
