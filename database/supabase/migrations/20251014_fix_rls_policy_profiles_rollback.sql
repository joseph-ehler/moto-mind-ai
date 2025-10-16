-- ============================================
-- ROLLBACK RLS POLICY FIX: profiles
-- Generated: 2025-10-14T17:31:18.046Z
-- ============================================

DROP POLICY IF EXISTS profiles_tenant_isolation ON profiles;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
