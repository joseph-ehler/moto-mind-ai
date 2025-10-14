-- ============================================
-- MASTER MIGRATION: Fix All RLS Policies
-- Generated: 2025-10-14
-- 
-- This combines all 10 RLS policy fixes into one file
-- for easy application in Supabase SQL Editor
-- 
-- Tables Fixed:
-- 1. garages (CRITICAL - RLS disabled)
-- 2. capture_sessions
-- 3. event_photos
-- 4. photo_metadata
-- 5. profiles
-- 6. user_tenants
-- 7. vehicle_event_audit_logs
-- 8. vehicle_events
-- 9. vehicle_images
-- 10. vehicles
-- ============================================

-- ============================================
-- 1. GARAGES (CRITICAL FIX)
-- ============================================

-- Enable RLS
ALTER TABLE garages ENABLE ROW LEVEL SECURITY;

-- Drop any existing weak policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'garages'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON garages';
  END LOOP;
END $$;

-- Add proper tenant isolation policy
CREATE POLICY garages_tenant_isolation
ON garages
FOR ALL
TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

RAISE NOTICE '✅ Fixed: garages';

-- ============================================
-- 2. CAPTURE_SESSIONS
-- ============================================

-- Drop weak policies
DROP POLICY IF EXISTS capture_sessions_delete ON capture_sessions;
DROP POLICY IF EXISTS capture_sessions_insert ON capture_sessions;
DROP POLICY IF EXISTS capture_sessions_select ON capture_sessions;
DROP POLICY IF EXISTS capture_sessions_update ON capture_sessions;
DROP POLICY IF EXISTS capture_sessions_tenant_isolation ON capture_sessions;

-- Add strong tenant isolation
CREATE POLICY capture_sessions_tenant_isolation
ON capture_sessions
FOR ALL
TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

RAISE NOTICE '✅ Fixed: capture_sessions';

-- ============================================
-- 3. EVENT_PHOTOS
-- ============================================

DROP POLICY IF EXISTS event_photos_delete ON event_photos;
DROP POLICY IF EXISTS event_photos_insert ON event_photos;
DROP POLICY IF EXISTS event_photos_select ON event_photos;
DROP POLICY IF EXISTS event_photos_update ON event_photos;
DROP POLICY IF EXISTS event_photos_tenant_isolation ON event_photos;

CREATE POLICY event_photos_tenant_isolation
ON event_photos
FOR ALL
TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

RAISE NOTICE '✅ Fixed: event_photos';

-- ============================================
-- 4. PHOTO_METADATA
-- ============================================

DROP POLICY IF EXISTS photo_metadata_delete ON photo_metadata;
DROP POLICY IF EXISTS photo_metadata_insert ON photo_metadata;
DROP POLICY IF EXISTS photo_metadata_select ON photo_metadata;
DROP POLICY IF EXISTS photo_metadata_update ON photo_metadata;
DROP POLICY IF EXISTS photo_metadata_tenant_isolation ON photo_metadata;

CREATE POLICY photo_metadata_tenant_isolation
ON photo_metadata
FOR ALL
TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

RAISE NOTICE '✅ Fixed: photo_metadata';

-- ============================================
-- 5. PROFILES
-- ============================================

DROP POLICY IF EXISTS allow_all_profiles ON profiles;
DROP POLICY IF EXISTS profiles_tenant_isolation ON profiles;

CREATE POLICY profiles_tenant_isolation
ON profiles
FOR ALL
TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

RAISE NOTICE '✅ Fixed: profiles';

-- ============================================
-- 6. USER_TENANTS
-- ============================================

DROP POLICY IF EXISTS user_tenants_select ON user_tenants;
DROP POLICY IF EXISTS "Service role can insert user_tenants" ON user_tenants;
DROP POLICY IF EXISTS user_tenants_tenant_isolation ON user_tenants;

CREATE POLICY user_tenants_tenant_isolation
ON user_tenants
FOR ALL
TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Re-add service role policy for tenant creation
CREATE POLICY user_tenants_service_role_insert
ON user_tenants
FOR INSERT
TO service_role
WITH CHECK (true);

RAISE NOTICE '✅ Fixed: user_tenants';

-- ============================================
-- 7. VEHICLE_EVENT_AUDIT_LOGS
-- ============================================

DROP POLICY IF EXISTS allow_all_audit ON vehicle_event_audit_logs;
DROP POLICY IF EXISTS vehicle_event_audit_logs_tenant_isolation ON vehicle_event_audit_logs;

CREATE POLICY vehicle_event_audit_logs_tenant_isolation
ON vehicle_event_audit_logs
FOR ALL
TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

RAISE NOTICE '✅ Fixed: vehicle_event_audit_logs';

-- ============================================
-- 8. VEHICLE_EVENTS
-- ============================================

DROP POLICY IF EXISTS allow_all_events ON vehicle_events;
DROP POLICY IF EXISTS vehicle_events_delete ON vehicle_events;
DROP POLICY IF EXISTS vehicle_events_insert ON vehicle_events;
DROP POLICY IF EXISTS vehicle_events_select ON vehicle_events;
DROP POLICY IF EXISTS vehicle_events_update ON vehicle_events;
DROP POLICY IF EXISTS vehicle_events_tenant_isolation ON vehicle_events;

CREATE POLICY vehicle_events_tenant_isolation
ON vehicle_events
FOR ALL
TO authenticated
USING (
  tenant_id = current_setting('app.current_tenant_id', true)::uuid
  AND deleted_at IS NULL
)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

RAISE NOTICE '✅ Fixed: vehicle_events';

-- ============================================
-- 9. VEHICLE_IMAGES
-- ============================================

DROP POLICY IF EXISTS "Service role has full access to vehicle images" ON vehicle_images;
DROP POLICY IF EXISTS "Users can view images for their tenant's vehicles" ON vehicle_images;
DROP POLICY IF EXISTS vehicle_images_tenant_isolation ON vehicle_images;

CREATE POLICY vehicle_images_tenant_isolation
ON vehicle_images
FOR ALL
TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

RAISE NOTICE '✅ Fixed: vehicle_images';

-- ============================================
-- 10. VEHICLES
-- ============================================

DROP POLICY IF EXISTS allow_all_vehicles ON vehicles;
DROP POLICY IF EXISTS vehicles_tenant_isolation ON vehicles;

CREATE POLICY vehicles_tenant_isolation
ON vehicles
FOR ALL
TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

RAISE NOTICE '✅ Fixed: vehicles';

-- ============================================
-- FINAL VERIFICATION
-- ============================================

DO $$
DECLARE
  tables_fixed text[] := ARRAY[
    'garages',
    'capture_sessions',
    'event_photos',
    'photo_metadata',
    'profiles',
    'user_tenants',
    'vehicle_event_audit_logs',
    'vehicle_events',
    'vehicle_images',
    'vehicles'
  ];
  tbl text;
  rls_enabled boolean;
  policy_count int;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'VERIFICATION SUMMARY';
  RAISE NOTICE '============================================';
  
  FOREACH tbl IN ARRAY tables_fixed
  LOOP
    SELECT rowsecurity INTO rls_enabled
    FROM pg_tables
    WHERE tablename = tbl AND schemaname = 'public';
    
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = tbl AND schemaname = 'public';
    
    RAISE NOTICE '% - RLS: %, Policies: %', tbl, rls_enabled, policy_count;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'ALL RLS POLICIES FIXED ✅';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Next: Run npm run db:validate to confirm';
END $$;
