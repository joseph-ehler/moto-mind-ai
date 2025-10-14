-- ============================================
-- ROLLBACK RLS POLICY FIX: vehicle_event_audit_logs
-- Generated: 2025-10-14T17:31:29.510Z
-- ============================================

DROP POLICY IF EXISTS vehicle_event_audit_logs_tenant_isolation ON vehicle_event_audit_logs;
ALTER TABLE vehicle_event_audit_logs DISABLE ROW LEVEL SECURITY;
