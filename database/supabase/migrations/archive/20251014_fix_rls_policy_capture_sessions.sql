-- ============================================
-- FIX RLS POLICY: capture_sessions
-- Generated: 2025-10-14T17:30:57.172Z
-- ============================================

-- Drop weak policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'capture_sessions'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON capture_sessions';
  END LOOP;
END $$;

-- Add proper tenant isolation policy
CREATE POLICY capture_sessions_tenant_isolation
ON capture_sessions
FOR ALL
TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
