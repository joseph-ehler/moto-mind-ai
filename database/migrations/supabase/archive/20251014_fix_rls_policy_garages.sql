-- ============================================
-- FIX RLS POLICY: garages
-- Generated: 2025-10-14T17:24:43.195Z
-- ============================================

-- Enable RLS
ALTER TABLE garages ENABLE ROW LEVEL SECURITY;

-- Drop weak policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'garages'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON garages';
  END LOOP;
END $$;

-- Add proper tenant isolation policy
CREATE POLICY garages_tenant_isolation
ON garages
FOR ALL
TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
