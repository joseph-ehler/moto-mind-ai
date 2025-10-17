-- Migration: Add API-Friendly RLS Policies
-- Generated: 2025-10-16
-- Purpose: Add RLS policies for API routes that use user_tenants lookup
-- Note: Tables already have RLS enabled with current_setting pattern
--       We're adding COMPLEMENTARY policies for API access

-- ============================================================================
-- DROP CONFLICTING POLICIES (from previous migration attempts)
-- ============================================================================

-- Drop any policies we might have tried to create before
DROP POLICY IF EXISTS "Users can view vehicles in their tenants" ON vehicles;
DROP POLICY IF EXISTS "Users can insert vehicles to their tenants" ON vehicles;
DROP POLICY IF EXISTS "Users can update vehicles in their tenants" ON vehicles;
DROP POLICY IF EXISTS "Users can delete vehicles in their tenants" ON vehicles;
DROP POLICY IF EXISTS "Service role has full access to vehicles" ON vehicles;

DROP POLICY IF EXISTS "Users can view events in their tenants" ON vehicle_events;
DROP POLICY IF EXISTS "Users can insert events to their tenants" ON vehicle_events;
DROP POLICY IF EXISTS "Users can update events in their tenants" ON vehicle_events;
DROP POLICY IF EXISTS "Users can soft delete events in their tenants" ON vehicle_events;
DROP POLICY IF EXISTS "Service role has full access to vehicle_events" ON vehicle_events;

DROP POLICY IF EXISTS "Users can view garages in their tenants" ON garages;
DROP POLICY IF EXISTS "Users can insert garages to their tenants" ON garages;
DROP POLICY IF EXISTS "Users can update garages in their tenants" ON garages;
DROP POLICY IF EXISTS "Users can delete garages in their tenants" ON garages;
DROP POLICY IF EXISTS "Service role has full access to garages" ON garages;

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Service role has full access to profiles" ON profiles;

DROP POLICY IF EXISTS "Users can view their own maintenance preferences" ON user_maintenance_preferences;
DROP POLICY IF EXISTS "Users can insert their own maintenance preferences" ON user_maintenance_preferences;
DROP POLICY IF EXISTS "Users can update their own maintenance preferences" ON user_maintenance_preferences;
DROP POLICY IF EXISTS "Users can delete their own maintenance preferences" ON user_maintenance_preferences;
DROP POLICY IF EXISTS "Service role has full access to user_maintenance_preferences" ON user_maintenance_preferences;

-- ============================================================================
-- ADD COMPLEMENTARY POLICIES FOR API ROUTES
-- ============================================================================
-- These work ALONGSIDE existing current_setting policies
-- They allow API routes that don't set app.current_tenant_id to still work

-- VEHICLES: API access via user_tenants
CREATE POLICY "api_vehicles_user_tenants"
  ON vehicles FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()::text
    )
  );

-- VEHICLE_EVENTS: API access via user_tenants  
CREATE POLICY "api_vehicle_events_user_tenants"
  ON vehicle_events FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()::text
    )
  );

-- GARAGES: API access via user_tenants
CREATE POLICY "api_garages_user_tenants"
  ON garages FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()::text
    )
  );

-- PROFILES: API access by user ID
CREATE POLICY "api_profiles_own_profile"
  ON profiles FOR ALL
  TO authenticated
  USING (id = auth.uid()::uuid)
  WITH CHECK (id = auth.uid()::uuid);

-- USER_MAINTENANCE_PREFERENCES: API access by user ID + vehicle's tenant
-- Note: This table doesn't have tenant_id, so we check through vehicle
CREATE POLICY "api_user_maintenance_prefs"
  ON user_maintenance_preferences FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()::uuid
    AND vehicle_id IN (
      SELECT id FROM vehicles WHERE tenant_id IN (
        SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()::text
      )
    )
  )
  WITH CHECK (
    user_id = auth.uid()::uuid
    AND vehicle_id IN (
      SELECT id FROM vehicles WHERE tenant_id IN (
        SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()::text
      )
    )
  );

-- ============================================================================
-- SERVICE ROLE POLICIES
-- ============================================================================
-- Service role gets unrestricted access for migrations, background jobs, etc.

CREATE POLICY "service_role_vehicles"
  ON vehicles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_vehicle_events"
  ON vehicle_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_garages"
  ON garages FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_profiles"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_user_maintenance_prefs"
  ON user_maintenance_preferences FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ API-friendly RLS policies added successfully';
  RAISE NOTICE 'ℹ️  Tables now have DUAL policy support:';
  RAISE NOTICE '   1. current_setting pattern (for app context)';
  RAISE NOTICE '   2. user_tenants pattern (for API routes)';
END $$;
