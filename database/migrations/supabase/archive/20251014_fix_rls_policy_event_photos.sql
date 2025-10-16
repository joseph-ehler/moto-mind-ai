-- ============================================
-- FIX RLS POLICY: event_photos
-- Generated: 2025-10-14T17:31:06.904Z
-- ============================================

-- Drop weak policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'event_photos'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON event_photos';
  END LOOP;
END $$;

-- Add proper tenant isolation policy
CREATE POLICY event_photos_tenant_isolation
ON event_photos
FOR ALL
TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
