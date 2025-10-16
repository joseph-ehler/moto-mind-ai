-- ============================================
-- SECURE RLS POLICIES WITH TENANT ISOLATION
-- Migration: 20251015_secure_rls_policies.sql
-- Created: October 15, 2025
-- 
-- Purpose: Replace weak RLS policies with proper
-- database-level tenant isolation using PostgreSQL
-- session variables (app.current_tenant_id)
-- ============================================

-- CRITICAL ISSUE IDENTIFIED:
-- Current policies use USING (true) and WITH CHECK (true)
-- This allows ANY authenticated user to access ANY tenant's data!
-- 
-- Security Model:
-- 1. Middleware sets app.current_tenant_id session variable
-- 2. RLS policies enforce tenant_id = current_setting('app.current_tenant_id')
-- 3. Database-level enforcement (defense in depth)

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tenants ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VEHICLES TABLE
-- ============================================

-- Drop existing weak policies
DROP POLICY IF EXISTS "vehicles_tenant_isolation" ON vehicles;
DROP POLICY IF EXISTS "allow_all_vehicles" ON vehicles;

-- Create tenant-isolated policies
CREATE POLICY "vehicles_select" 
ON vehicles 
FOR SELECT 
TO authenticated
USING (
  tenant_id::text = current_setting('app.current_tenant_id', true)
);

CREATE POLICY "vehicles_insert" 
ON vehicles 
FOR INSERT 
TO authenticated
WITH CHECK (
  tenant_id::text = current_setting('app.current_tenant_id', true)
);

CREATE POLICY "vehicles_update" 
ON vehicles 
FOR UPDATE 
TO authenticated
USING (
  tenant_id::text = current_setting('app.current_tenant_id', true)
)
WITH CHECK (
  tenant_id::text = current_setting('app.current_tenant_id', true)
);

CREATE POLICY "vehicles_delete" 
ON vehicles 
FOR DELETE 
TO authenticated
USING (
  tenant_id::text = current_setting('app.current_tenant_id', true)
);

-- ============================================
-- VEHICLE_EVENTS TABLE
-- ============================================

DROP POLICY IF EXISTS "vehicle_events_tenant_isolation" ON vehicle_events;
DROP POLICY IF EXISTS "allow_all_events" ON vehicle_events;
DROP POLICY IF EXISTS "vehicle_events_select" ON vehicle_events;
DROP POLICY IF EXISTS "vehicle_events_insert" ON vehicle_events;
DROP POLICY IF EXISTS "vehicle_events_update" ON vehicle_events;
DROP POLICY IF EXISTS "vehicle_events_delete" ON vehicle_events;

CREATE POLICY "vehicle_events_select" 
ON vehicle_events 
FOR SELECT 
TO authenticated
USING (
  tenant_id::text = current_setting('app.current_tenant_id', true)
  AND deleted_at IS NULL
);

CREATE POLICY "vehicle_events_insert" 
ON vehicle_events 
FOR INSERT 
TO authenticated
WITH CHECK (
  tenant_id::text = current_setting('app.current_tenant_id', true)
);

CREATE POLICY "vehicle_events_update" 
ON vehicle_events 
FOR UPDATE 
TO authenticated
USING (
  tenant_id::text = current_setting('app.current_tenant_id', true)
)
WITH CHECK (
  tenant_id::text = current_setting('app.current_tenant_id', true)
);

CREATE POLICY "vehicle_events_delete" 
ON vehicle_events 
FOR DELETE 
TO authenticated
USING (
  tenant_id::text = current_setting('app.current_tenant_id', true)
);

-- ============================================
-- VEHICLE_IMAGES TABLE
-- ============================================

DROP POLICY IF EXISTS "vehicle_images_tenant_isolation" ON vehicle_images;
DROP POLICY IF EXISTS "Service role has full access to vehicle images" ON vehicle_images;
DROP POLICY IF EXISTS "Users can view images for their tenant's vehicles" ON vehicle_images;

CREATE POLICY "vehicle_images_select" 
ON vehicle_images 
FOR SELECT 
TO authenticated
USING (
  tenant_id::text = current_setting('app.current_tenant_id', true)
);

CREATE POLICY "vehicle_images_insert" 
ON vehicle_images 
FOR INSERT 
TO authenticated
WITH CHECK (
  tenant_id::text = current_setting('app.current_tenant_id', true)
);

CREATE POLICY "vehicle_images_update" 
ON vehicle_images 
FOR UPDATE 
TO authenticated
USING (
  tenant_id::text = current_setting('app.current_tenant_id', true)
)
WITH CHECK (
  tenant_id::text = current_setting('app.current_tenant_id', true)
);

CREATE POLICY "vehicle_images_delete" 
ON vehicle_images 
FOR DELETE 
TO authenticated
USING (
  tenant_id::text = current_setting('app.current_tenant_id', true)
);

-- ============================================
-- PHOTO_METADATA TABLE
-- ============================================

DROP POLICY IF EXISTS "photo_metadata_select" ON photo_metadata;
DROP POLICY IF EXISTS "photo_metadata_insert" ON photo_metadata;
DROP POLICY IF EXISTS "photo_metadata_update" ON photo_metadata;
DROP POLICY IF EXISTS "photo_metadata_delete" ON photo_metadata;

CREATE POLICY "photo_metadata_select" 
ON photo_metadata 
FOR SELECT 
TO authenticated
USING (
  tenant_id::text = current_setting('app.current_tenant_id', true)
);

CREATE POLICY "photo_metadata_insert" 
ON photo_metadata 
FOR INSERT 
TO authenticated
WITH CHECK (
  tenant_id::text = current_setting('app.current_tenant_id', true)
);

CREATE POLICY "photo_metadata_update" 
ON photo_metadata 
FOR UPDATE 
TO authenticated
USING (
  tenant_id::text = current_setting('app.current_tenant_id', true)
)
WITH CHECK (
  tenant_id::text = current_setting('app.current_tenant_id', true)
);

CREATE POLICY "photo_metadata_delete" 
ON photo_metadata 
FOR DELETE 
TO authenticated
USING (
  tenant_id::text = current_setting('app.current_tenant_id', true)
);

-- ============================================
-- TENANTS TABLE
-- Users can only see tenants they belong to
-- ============================================

DROP POLICY IF EXISTS "tenants_select" ON tenants;
DROP POLICY IF EXISTS "tenants_update" ON tenants;

CREATE POLICY "tenants_select" 
ON tenants 
FOR SELECT 
TO authenticated
USING (
  id::text = current_setting('app.current_tenant_id', true)
  OR
  -- Allow viewing if user is member
  id IN (
    SELECT tenant_id 
    FROM user_tenants 
    WHERE user_id = current_setting('app.current_user_id', true)
  )
);

CREATE POLICY "tenants_update" 
ON tenants 
FOR UPDATE 
TO authenticated
USING (
  id::text = current_setting('app.current_tenant_id', true)
)
WITH CHECK (
  id::text = current_setting('app.current_tenant_id', true)
);

-- ============================================
-- USER_TENANTS TABLE
-- Users can see their own tenant memberships
-- ============================================

DROP POLICY IF EXISTS "user_tenants_select" ON user_tenants;

CREATE POLICY "user_tenants_select" 
ON user_tenants 
FOR SELECT 
TO authenticated
USING (
  user_id = current_setting('app.current_user_id', true)
  OR
  tenant_id::text = current_setting('app.current_tenant_id', true)
);

-- ============================================
-- NOTES FOR MIDDLEWARE
-- ============================================

-- The application middleware MUST set these session variables:
-- 
-- 1. app.current_tenant_id (UUID as string)
--    SET LOCAL app.current_tenant_id = 'tenant-uuid-here';
-- 
-- 2. app.current_user_id (email as string)
--    SET LOCAL app.current_user_id = 'user@example.com';
--
-- These should be set at the start of each request transaction
-- using the authenticated user's session data from NextAuth.

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Test 1: Set a tenant context
-- SET LOCAL app.current_tenant_id = 'b9281da3-16c4-4370-83ad-4672cf928065';
-- SELECT * FROM vehicles;
-- Should only return vehicles for that tenant

-- Test 2: Without tenant context
-- RESET app.current_tenant_id;
-- SELECT * FROM vehicles;
-- Should return 0 rows (no access)

-- Test 3: Cross-tenant test
-- SET LOCAL app.current_tenant_id = 'different-tenant-id';
-- SELECT * FROM vehicles;
-- Should return 0 rows (no cross-tenant access)

-- ============================================
-- ROLLBACK (IF NEEDED)
-- ============================================

-- To revert to weak policies (NOT RECOMMENDED):
-- 
-- DROP POLICY IF EXISTS "vehicles_select" ON vehicles;
-- DROP POLICY IF EXISTS "vehicles_insert" ON vehicles;
-- DROP POLICY IF EXISTS "vehicles_update" ON vehicles;
-- DROP POLICY IF EXISTS "vehicles_delete" ON vehicles;
-- 
-- CREATE POLICY "vehicles_tenant_isolation" 
-- ON vehicles FOR ALL TO authenticated
-- USING (true) WITH CHECK (true);

-- ============================================
-- SECURITY AUDIT LOG
-- ============================================

-- Before: USING (true) - Allows ANY authenticated user
-- After:  USING (tenant_id = current_setting(...)) - Enforces tenant isolation
-- 
-- Impact: Database now enforces tenant boundaries
-- Benefit: Even if application middleware fails, DB protects data
-- Trade-off: Middleware must set session variables correctly

COMMENT ON TABLE vehicles IS 'RLS enabled with tenant isolation via app.current_tenant_id';
COMMENT ON TABLE vehicle_events IS 'RLS enabled with tenant isolation via app.current_tenant_id';
COMMENT ON TABLE vehicle_images IS 'RLS enabled with tenant isolation via app.current_tenant_id';
COMMENT ON TABLE photo_metadata IS 'RLS enabled with tenant isolation via app.current_tenant_id';
