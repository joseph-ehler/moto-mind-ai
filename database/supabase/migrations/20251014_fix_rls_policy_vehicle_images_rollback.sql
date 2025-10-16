-- ============================================
-- ROLLBACK RLS POLICY FIX: vehicle_images
-- Generated: 2025-10-14T17:31:31.077Z
-- ============================================

DROP POLICY IF EXISTS vehicle_images_tenant_isolation ON vehicle_images;
ALTER TABLE vehicle_images DISABLE ROW LEVEL SECURITY;
