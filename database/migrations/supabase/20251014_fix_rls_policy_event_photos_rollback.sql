-- ============================================
-- ROLLBACK RLS POLICY FIX: event_photos
-- Generated: 2025-10-14T17:31:06.904Z
-- ============================================

DROP POLICY IF EXISTS event_photos_tenant_isolation ON event_photos;
ALTER TABLE event_photos DISABLE ROW LEVEL SECURITY;
