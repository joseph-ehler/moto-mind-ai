-- ============================================
-- ROLLBACK RLS POLICY FIX: photo_metadata
-- Generated: 2025-10-14T17:31:17.241Z
-- ============================================

DROP POLICY IF EXISTS photo_metadata_tenant_isolation ON photo_metadata;
ALTER TABLE photo_metadata DISABLE ROW LEVEL SECURITY;
