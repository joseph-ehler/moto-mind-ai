-- ============================================
-- ROLLBACK RLS POLICY FIX: garages
-- Generated: 2025-10-14T17:24:43.196Z
-- ============================================

DROP POLICY IF EXISTS garages_tenant_isolation ON garages;
ALTER TABLE garages DISABLE ROW LEVEL SECURITY;
