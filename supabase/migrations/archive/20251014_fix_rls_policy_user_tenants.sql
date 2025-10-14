-- ============================================
-- FIX RLS POLICY: user_tenants
-- Generated: 2025-10-14T17:31:18.755Z
-- ============================================

-- Drop weak policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'user_tenants'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON user_tenants';
  END LOOP;
END $$;

-- Add proper tenant isolation policy
CREATE POLICY user_tenants_tenant_isolation
ON user_tenants
FOR ALL
TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
