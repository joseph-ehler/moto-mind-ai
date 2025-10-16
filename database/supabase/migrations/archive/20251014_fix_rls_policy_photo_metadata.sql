-- ============================================
-- FIX RLS POLICY: photo_metadata
-- Generated: 2025-10-14T17:31:17.241Z
-- ============================================

-- Drop weak policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'photo_metadata'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON photo_metadata';
  END LOOP;
END $$;

-- Add proper tenant isolation policy
CREATE POLICY photo_metadata_tenant_isolation
ON photo_metadata
FOR ALL
TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
