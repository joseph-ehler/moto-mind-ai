-- ============================================
-- ROLLBACK RLS POLICY FIX: vehicle_events
-- Generated: 2025-10-14T17:31:30.265Z
-- ============================================

DROP POLICY IF EXISTS vehicle_events_tenant_isolation ON vehicle_events;
ALTER TABLE vehicle_events DISABLE ROW LEVEL SECURITY;
