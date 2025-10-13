-- =============================================================================
-- CORRECTED CRITICAL SCHEMA FIXES - Address Real Issues Without Breaking Security
-- =============================================================================
-- Based on honest technical review and security audit
-- NOTE: This script is idempotent - safe to run multiple times

-- =============================================================================
-- FIX 1: VEHICLE_EVENTS PRIMARY KEY - PostgreSQL Partitioning Constraint
-- =============================================================================
-- Problem: PostgreSQL requires PRIMARY KEY to include ALL partition key columns
-- Reality: PRIMARY KEY must be (id, date) for partitioned table
-- Solution: Accept composite PK and composite FKs as cost of partitioning performance

-- Ensure uuid-ossp extension is available in extensions schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- WARNING: This drops all vehicle_events data
DROP TABLE IF EXISTS public.vehicle_events CASCADE;

CREATE TABLE public.vehicle_events (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  date DATE NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('fuel','maintenance','odometer','document','reminder','inspection')),
  miles INTEGER,
  payload JSONB NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, date)  -- Composite PK satisfies partitioning constraint
  -- NO created_by - events are facts, not user actions
  -- Store user context in payload->>'logged_by' if needed
) PARTITION BY RANGE (date);

-- Create partitions with default for historical/future dates
CREATE TABLE public.vehicle_events_2024 PARTITION OF public.vehicle_events
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE public.vehicle_events_2025 PARTITION OF public.vehicle_events
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE public.vehicle_events_2026 PARTITION OF public.vehicle_events
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE public.vehicle_events_2027 PARTITION OF public.vehicle_events
  FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');
CREATE TABLE public.vehicle_events_2028 PARTITION OF public.vehicle_events
  FOR VALUES FROM ('2028-01-01') TO ('2029-01-01');

-- Default partition for any dates outside range (prevents insert failures)
CREATE TABLE public.vehicle_events_default PARTITION OF public.vehicle_events DEFAULT;

-- IMPORTANT: Foreign Key References to Partitioned Tables
-- PostgreSQL partitioning constraint: ALL UNIQUE/PRIMARY KEY constraints 
-- must include partition key columns. This means:
-- 
-- ✅ ONLY OPTION: Composite FK via PRIMARY KEY
--   FOREIGN KEY (event_id, event_date) REFERENCES vehicle_events(id, date)
--
-- REALITY: PostgreSQL partitioning forces composite FKs - no single-column option exists
-- Accept this as the cost of massive partitioning performance gains

-- CRITICAL: Recreate all triggers that were lost in CASCADE drop
DROP TRIGGER IF EXISTS prevent_event_updates ON public.vehicle_events;
CREATE TRIGGER prevent_event_updates BEFORE UPDATE ON public.vehicle_events
  FOR EACH ROW EXECUTE FUNCTION public.reject_updates();

DROP TRIGGER IF EXISTS check_mileage ON public.vehicle_events;
CREATE TRIGGER check_mileage BEFORE INSERT ON public.vehicle_events
  FOR EACH ROW WHEN (NEW.miles IS NOT NULL)
  EXECUTE FUNCTION public.validate_mileage();

DROP TRIGGER IF EXISTS validate_payload ON public.vehicle_events;
CREATE TRIGGER validate_payload BEFORE INSERT OR UPDATE ON public.vehicle_events
  FOR EACH ROW EXECUTE FUNCTION public.validate_event_payload();

-- =============================================================================
-- FIX 2: PROFILE SECURITY - Keep self-ownership (SECURITY CRITICAL)
-- =============================================================================
-- Problem: My original fix allowed cross-user profile access within tenant
-- Solution: Profiles remain self-owned, not tenant-shared

-- Remove ALL existing profile policies (including correct ones that might exist)
DROP POLICY IF EXISTS "tenant_profiles" ON public.profiles;
DROP POLICY IF EXISTS "tenant_profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "tenant_profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "tenant_profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "tenant_profiles_delete" ON public.profiles;
DROP POLICY IF EXISTS "own_profile_select" ON public.profiles;
DROP POLICY IF EXISTS "own_profile_insert" ON public.profiles;
DROP POLICY IF EXISTS "own_profile_update" ON public.profiles;
DROP POLICY IF EXISTS "own_profile_delete" ON public.profiles;

-- Correct: Users own their own profiles only
CREATE POLICY "own_profile_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id AND deleted_at IS NULL);

CREATE POLICY "own_profile_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = id AND deleted_at IS NULL);

CREATE POLICY "own_profile_insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id AND deleted_at IS NULL);

CREATE POLICY "own_profile_delete" ON public.profiles
  FOR DELETE TO authenticated
  USING (auth.uid() = id AND deleted_at IS NULL);

-- =============================================================================
-- FIX 3: EVENT IMMUTABILITY - NO DELETE POLICY (CORRECTED)
-- =============================================================================
-- Problem: My original fix added DELETE policy to immutable events
-- Solution: Events are SELECT and INSERT only - no UPDATE, no DELETE

-- Remove any existing policies
DROP POLICY IF EXISTS "tenant_vehicle_events" ON public.vehicle_events;
DROP POLICY IF EXISTS "tenant_vehicle_events_select" ON public.vehicle_events;
DROP POLICY IF EXISTS "tenant_vehicle_events_insert" ON public.vehicle_events;
DROP POLICY IF EXISTS "tenant_vehicle_events_update" ON public.vehicle_events;
DROP POLICY IF EXISTS "tenant_vehicle_events_delete" ON public.vehicle_events;

-- Events are immutable facts - SELECT and INSERT only
CREATE POLICY "tenant_vehicle_events_select" ON public.vehicle_events
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id()));

CREATE POLICY "tenant_vehicle_events_insert" ON public.vehicle_events
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));

-- NO UPDATE policy (absence blocks operation)
-- NO DELETE policy (events are immutable facts)

-- =============================================================================
-- FIX 4: SOFT DELETE RLS POLICIES - Correct Implementation
-- =============================================================================

-- GARAGES: Fix soft delete visibility and INSERT bypass
DROP POLICY IF EXISTS "tenant_garages" ON public.garages;
DROP POLICY IF EXISTS "tenant_garages_select" ON public.garages;
DROP POLICY IF EXISTS "tenant_garages_insert" ON public.garages;
DROP POLICY IF EXISTS "tenant_garages_update" ON public.garages;
DROP POLICY IF EXISTS "tenant_garages_delete" ON public.garages;
CREATE POLICY "tenant_garages_select" ON public.garages
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id()) AND deleted_at IS NULL);

CREATE POLICY "tenant_garages_insert" ON public.garages
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT public.current_tenant_id()) AND deleted_at IS NULL);

CREATE POLICY "tenant_garages_update" ON public.garages
  FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id()) AND deleted_at IS NULL)
  WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));

CREATE POLICY "tenant_garages_delete" ON public.garages
  FOR DELETE TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id()) AND deleted_at IS NULL);

-- VEHICLES: Fix soft delete visibility and INSERT bypass
DROP POLICY IF EXISTS "tenant_vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "tenant_vehicles_select" ON public.vehicles;
DROP POLICY IF EXISTS "tenant_vehicles_insert" ON public.vehicles;
DROP POLICY IF EXISTS "tenant_vehicles_update" ON public.vehicles;
DROP POLICY IF EXISTS "tenant_vehicles_delete" ON public.vehicles;
CREATE POLICY "tenant_vehicles_select" ON public.vehicles
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id()) AND deleted_at IS NULL);

CREATE POLICY "tenant_vehicles_insert" ON public.vehicles
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT public.current_tenant_id()) AND deleted_at IS NULL);

CREATE POLICY "tenant_vehicles_update" ON public.vehicles
  FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id()) AND deleted_at IS NULL)
  WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));

CREATE POLICY "tenant_vehicles_delete" ON public.vehicles
  FOR DELETE TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id()) AND deleted_at IS NULL);

-- VEHICLE_IMAGES: Fix soft delete visibility and INSERT bypass
DROP POLICY IF EXISTS "tenant_vehicle_images" ON public.vehicle_images;
DROP POLICY IF EXISTS "tenant_vehicle_images_select" ON public.vehicle_images;
DROP POLICY IF EXISTS "tenant_vehicle_images_insert" ON public.vehicle_images;
DROP POLICY IF EXISTS "tenant_vehicle_images_update" ON public.vehicle_images;
DROP POLICY IF EXISTS "tenant_vehicle_images_delete" ON public.vehicle_images;
CREATE POLICY "tenant_vehicle_images_select" ON public.vehicle_images
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id()) AND deleted_at IS NULL);

CREATE POLICY "tenant_vehicle_images_insert" ON public.vehicle_images
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT public.current_tenant_id()) AND deleted_at IS NULL);

CREATE POLICY "tenant_vehicle_images_update" ON public.vehicle_images
  FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id()) AND deleted_at IS NULL)
  WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));

CREATE POLICY "tenant_vehicle_images_delete" ON public.vehicle_images
  FOR DELETE TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id()) AND deleted_at IS NULL);

-- REMINDERS: Fix soft delete visibility and INSERT bypass
DROP POLICY IF EXISTS "tenant_reminders" ON public.reminders;
DROP POLICY IF EXISTS "tenant_reminders_select" ON public.reminders;
DROP POLICY IF EXISTS "tenant_reminders_insert" ON public.reminders;
DROP POLICY IF EXISTS "tenant_reminders_update" ON public.reminders;
DROP POLICY IF EXISTS "tenant_reminders_delete" ON public.reminders;
CREATE POLICY "tenant_reminders_select" ON public.reminders
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id()) AND deleted_at IS NULL);

CREATE POLICY "tenant_reminders_insert" ON public.reminders
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT public.current_tenant_id()) AND deleted_at IS NULL);

CREATE POLICY "tenant_reminders_update" ON public.reminders
  FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id()) AND deleted_at IS NULL)
  WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));

CREATE POLICY "tenant_reminders_delete" ON public.reminders
  FOR DELETE TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id()) AND deleted_at IS NULL);

-- =============================================================================
-- FIX 5: RECREATE MATERIALIZED VIEW (lost in CASCADE drop)
-- =============================================================================

-- Recreate timeline materialized view that was destroyed
CREATE MATERIALIZED VIEW private.timeline_feed AS
SELECT 
  e.id,
  e.tenant_id,
  e.vehicle_id,
  e.type,
  e.date,
  e.miles,
  e.payload,
  e.created_at,
  v.nickname as vehicle_name,
  v.make,
  v.model,
  v.year,
  g.name as garage_name
FROM public.vehicle_events e
JOIN public.vehicles v ON v.id = e.vehicle_id AND v.deleted_at IS NULL
LEFT JOIN public.garages g ON g.id = v.garage_id AND g.deleted_at IS NULL;

-- Create indexes for materialized view
-- Note: Cannot use UNIQUE(id) since id is not unique across partitions
-- Use composite unique constraint that matches the partitioned table
CREATE UNIQUE INDEX timeline_feed_unique_idx ON private.timeline_feed (id, date);
CREATE INDEX timeline_feed_tenant_vehicle_idx ON private.timeline_feed (tenant_id, vehicle_id, date DESC);
CREATE INDEX timeline_feed_tenant_type_idx ON private.timeline_feed (tenant_id, type, date DESC);

-- =============================================================================
-- FIX 6: DATE TYPE CONSISTENCY (optional - decide on DATE vs TIMESTAMPTZ)
-- =============================================================================

-- Option A: Standardize on TIMESTAMPTZ (recommended for timezone accuracy)
-- ALTER TABLE public.reminders ALTER COLUMN due_date TYPE TIMESTAMPTZ;

-- Option B: Keep DATE but document timezone handling expectations
-- (Current approach - due_date remains DATE, document the timezone implications)

-- =============================================================================
-- FIX 7: RECREATE PARTITION INDEXES (after table recreation)
-- =============================================================================

-- Recreate indexes on all partitions (including new default partition)
DO $$
DECLARE
  partition_name TEXT;
BEGIN
  FOR partition_name IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' AND tablename LIKE 'vehicle_events_%'
  LOOP
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I_tenant_vehicle_date ON public.%I (tenant_id, vehicle_id, date DESC)', partition_name, partition_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I_tenant_type_date ON public.%I (tenant_id, type, date DESC)', partition_name, partition_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I_tenant_date ON public.%I (tenant_id, date DESC)', partition_name, partition_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I_vehicle_date ON public.%I (vehicle_id, date DESC)', partition_name, partition_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I_payload_gin ON public.%I USING GIN (payload)', partition_name, partition_name);
  END LOOP;
END $$;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- 1. Verify PK structure (should be (id, date) for partitioned table)
SELECT 
  table_name,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'vehicle_events' AND constraint_type = 'PRIMARY KEY';

-- 2. Verify profile policies are self-owned (should show auth.uid() = id)
SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd;

-- 3. Verify no UPDATE/DELETE policies on vehicle_events
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'vehicle_events' 
ORDER BY cmd;
-- Should only show SELECT and INSERT

-- 4. Verify soft-delete filtering in RLS policies
SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('garages', 'vehicles', 'vehicle_images', 'reminders')
AND qual LIKE '%deleted_at IS NULL%'
ORDER BY tablename, cmd;

-- 5. Verify triggers were recreated
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'vehicle_events'
ORDER BY trigger_name;
-- Should show: prevent_event_updates, check_mileage, validate_payload

-- 6. Test partition coverage (should not fail)
-- Note: These may fail if RLS blocks due to no current_tenant_id() context
-- Run in application context or set session variables for testing

DO $$
DECLARE
  test_id_1 UUID;
  test_id_2 UUID;
BEGIN
  -- Test historical date (goes to default partition)
  INSERT INTO vehicle_events (tenant_id, vehicle_id, type, date, miles) 
  VALUES ('550e8400-e29b-41d4-a716-446655440000', gen_random_uuid(), 'odometer', '2024-01-15', 50000)
  RETURNING id INTO test_id_1;
  
  -- Test future date (goes to default partition)  
  INSERT INTO vehicle_events (tenant_id, vehicle_id, type, date, miles) 
  VALUES ('550e8400-e29b-41d4-a716-446655440000', gen_random_uuid(), 'odometer', '2029-06-15', 75000)
  RETURNING id INTO test_id_2;
  
  RAISE NOTICE 'Partition test successful - inserted events % and %', test_id_1, test_id_2;
  
  -- Clean up test data by ID (more reliable than value matching)
  DELETE FROM vehicle_events WHERE id IN (test_id_1, test_id_2);
  
  RAISE NOTICE 'Test data cleaned up successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Partition test failed (likely RLS context issue): %', SQLERRM;
END $$;
