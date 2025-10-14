-- ============================================
-- FIX RLS POLICY: vehicle_event_audit_logs
-- Generated: 2025-10-14T17:31:29.510Z
-- ============================================

-- Drop weak policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'vehicle_event_audit_logs'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON vehicle_event_audit_logs';
  END LOOP;
END $$;

-- Add proper tenant isolation policy
CREATE POLICY vehicle_event_audit_logs_tenant_isolation
ON vehicle_event_audit_logs
FOR ALL
TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
