-- ============================================
-- ROLLBACK RLS POLICY FIX: user_tenants
-- Generated: 2025-10-14T17:31:18.755Z
-- ============================================

DROP POLICY IF EXISTS user_tenants_tenant_isolation ON user_tenants;
ALTER TABLE user_tenants DISABLE ROW LEVEL SECURITY;
