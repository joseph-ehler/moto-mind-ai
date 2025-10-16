-- ============================================
-- ROLLBACK RLS POLICY FIX: capture_sessions
-- Generated: 2025-10-14T17:30:57.173Z
-- ============================================

DROP POLICY IF EXISTS capture_sessions_tenant_isolation ON capture_sessions;
ALTER TABLE capture_sessions DISABLE ROW LEVEL SECURITY;
