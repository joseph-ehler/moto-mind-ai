-- ============================================
-- FIX RLS POLICY: profiles
-- Generated: 2025-10-14T17:31:18.045Z
-- ============================================

-- Drop weak policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON profiles';
  END LOOP;
END $$;

-- Add proper tenant isolation policy
CREATE POLICY profiles_tenant_isolation
ON profiles
FOR ALL
TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
