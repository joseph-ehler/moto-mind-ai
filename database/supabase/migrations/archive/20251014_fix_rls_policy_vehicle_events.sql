-- ============================================
-- FIX RLS POLICY: vehicle_events
-- Generated: 2025-10-14T17:31:30.264Z
-- ============================================

-- Drop weak policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'vehicle_events'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON vehicle_events';
  END LOOP;
END $$;

-- Add proper tenant isolation policy
CREATE POLICY vehicle_events_tenant_isolation
ON vehicle_events
FOR ALL
TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
