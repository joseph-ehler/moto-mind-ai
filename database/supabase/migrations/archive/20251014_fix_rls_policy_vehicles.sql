-- ============================================
-- FIX RLS POLICY: vehicles
-- Generated: 2025-10-14T17:31:31.787Z
-- ============================================

-- Drop weak policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'vehicles'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON vehicles';
  END LOOP;
END $$;

-- Add proper tenant isolation policy
CREATE POLICY vehicles_tenant_isolation
ON vehicles
FOR ALL
TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
