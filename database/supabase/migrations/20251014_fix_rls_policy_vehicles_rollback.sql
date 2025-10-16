-- ============================================
-- ROLLBACK RLS POLICY FIX: vehicles
-- Generated: 2025-10-14T17:31:31.788Z
-- ============================================

DROP POLICY IF EXISTS vehicles_tenant_isolation ON vehicles;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
