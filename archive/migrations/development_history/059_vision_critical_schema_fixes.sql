-- =============================================================================
-- ⚠️  DEPRECATED - USE CORRECTED-SCHEMA-FIXES.sql INSTEAD
-- =============================================================================
-- This file contains the BROKEN version with single-column PK
-- PostgreSQL will reject this with partitioning constraint error
-- 
-- USE: CORRECTED-SCHEMA-FIXES.sql (has proper composite PK)

-- =============================================================================
-- FIX 1: COMPOSITE PK TRAP - Fix vehicle_events primary key
-- =============================================================================
-- Problem: PRIMARY KEY (id, date) makes FK references impossible
-- Solution: Use id as sole PK, keep unique constraint for partitioning

-- This requires recreating the partitioned table structure
-- WARNING: This will drop all vehicle_events data

-- Drop existing partitioned structure
DROP TABLE IF EXISTS public.vehicle_events CASCADE;

-- Recreate with proper PK structure
CREATE TABLE public.vehicle_events (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  date DATE NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('fuel','maintenance','odometer','document','reminder','inspection')),
  miles INTEGER,
  payload JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE (id, date)  -- Partition constraint, not PK
) PARTITION BY RANGE (date);

-- Recreate partitions with new structure
CREATE TABLE public.vehicle_events_2025 PARTITION OF public.vehicle_events
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE public.vehicle_events_2026 PARTITION OF public.vehicle_events
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE public.vehicle_events_2027 PARTITION OF public.vehicle_events
  FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');
CREATE TABLE public.vehicle_events_2028 PARTITION OF public.vehicle_events
  FOR VALUES FROM ('2028-01-01') TO ('2029-01-01');

-- =============================================================================
-- FIX 2: DATE vs TIMESTAMPTZ CONSISTENCY
-- =============================================================================
-- Problem: Mixing DATE and TIMESTAMPTZ causes timezone bugs
-- Decision: Use TIMESTAMPTZ everywhere for accuracy

-- Fix reminders table
ALTER TABLE public.reminders 
ALTER COLUMN due_date TYPE TIMESTAMPTZ;

-- Fix vehicle_events table (already recreated above with DATE - consider changing to TIMESTAMPTZ)
-- Note: Keeping DATE for now as it's semantically correct for "event date"
-- but document the timezone handling requirement

-- =============================================================================
-- FIX 3: SOFT DELETE VISIBILITY IN RLS POLICIES
-- =============================================================================
-- Problem: RLS policies don't filter deleted_at IS NULL
-- Solution: Add deleted_at filter to all RLS policies

-- Fix profiles policies
DROP POLICY IF EXISTS "tenant_profiles" ON public.profiles;
CREATE POLICY "tenant_profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id()) AND deleted_at IS NULL);

CREATE POLICY "tenant_profiles_insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));

CREATE POLICY "tenant_profiles_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id()) AND deleted_at IS NULL)
  WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));

CREATE POLICY "tenant_profiles_delete" ON public.profiles
  FOR DELETE TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id()) AND deleted_at IS NULL);

-- Fix garages policies
DROP POLICY IF EXISTS "tenant_garages" ON public.garages;
CREATE POLICY "tenant_garages_select" ON public.garages
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id()) AND deleted_at IS NULL);

CREATE POLICY "tenant_garages_insert" ON public.garages
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));

CREATE POLICY "tenant_garages_update" ON public.garages
  FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id()) AND deleted_at IS NULL)
  WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));

CREATE POLICY "tenant_garages_delete" ON public.garages
  FOR DELETE TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id()) AND deleted_at IS NULL);

-- Fix vehicles policies
DROP POLICY IF EXISTS "tenant_vehicles" ON public.vehicles;
CREATE POLICY "tenant_vehicles_select" ON public.vehicles
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id()) AND deleted_at IS NULL);

CREATE POLICY "tenant_vehicles_insert" ON public.vehicles
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));

CREATE POLICY "tenant_vehicles_update" ON public.vehicles
  FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id()) AND deleted_at IS NULL)
  WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));

CREATE POLICY "tenant_vehicles_delete" ON public.vehicles
  FOR DELETE TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id()) AND deleted_at IS NULL);

-- Fix vehicle_images policies
DROP POLICY IF EXISTS "tenant_vehicle_images" ON public.vehicle_images;
CREATE POLICY "tenant_vehicle_images_select" ON public.vehicle_images
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id()) AND deleted_at IS NULL);

CREATE POLICY "tenant_vehicle_images_insert" ON public.vehicle_images
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));

CREATE POLICY "tenant_vehicle_images_update" ON public.vehicle_images
  FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id()) AND deleted_at IS NULL)
  WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));

CREATE POLICY "tenant_vehicle_images_delete" ON public.vehicle_images
  FOR DELETE TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id()) AND deleted_at IS NULL);

-- Fix reminders policies
DROP POLICY IF EXISTS "tenant_reminders" ON public.reminders;
CREATE POLICY "tenant_reminders_select" ON public.reminders
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id()) AND deleted_at IS NULL);

CREATE POLICY "tenant_reminders_insert" ON public.reminders
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));

CREATE POLICY "tenant_reminders_update" ON public.reminders
  FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id()) AND deleted_at IS NULL)
  WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));

CREATE POLICY "tenant_reminders_delete" ON public.reminders
  FOR DELETE TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id()) AND deleted_at IS NULL);

-- =============================================================================
-- FIX 4: VEHICLE_EVENTS IMMUTABILITY - Remove UPDATE grant entirely
-- =============================================================================
-- Problem: UPDATE policy missing, relies only on trigger
-- Solution: No UPDATE policy = no updates possible

-- Ensure no UPDATE policy exists (absence blocks operation)
DROP POLICY IF EXISTS "tenant_vehicle_events_update" ON public.vehicle_events;

-- Keep other policies but no UPDATE
CREATE POLICY "tenant_vehicle_events_select" ON public.vehicle_events
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id()));

CREATE POLICY "tenant_vehicle_events_insert" ON public.vehicle_events
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));

CREATE POLICY "tenant_vehicle_events_delete" ON public.vehicle_events
  FOR DELETE TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id()));

-- =============================================================================
-- FIX 5: ADD MISSING INDEXES ON AUDIT COLUMNS
-- =============================================================================
-- Problem: created_by/updated_by/deleted_by have no indexes
-- Solution: Add indexes if we ever plan to query by these

-- Only add if you plan to query "what did user X create/update"
-- Otherwise, accept they're write-only fields

-- Uncomment if needed:
-- CREATE INDEX IF NOT EXISTS idx_profiles_created_by ON public.profiles(created_by) WHERE deleted_at IS NULL;
-- CREATE INDEX IF NOT EXISTS idx_vehicles_created_by ON public.vehicles(created_by) WHERE deleted_at IS NULL;
-- CREATE INDEX IF NOT EXISTS idx_garages_created_by ON public.garages(created_by) WHERE deleted_at IS NULL;
-- etc.

-- =============================================================================
-- FIX 6: RECREATE PARTITION INDEXES (after table recreation)
-- =============================================================================

-- Recreate indexes on all partitions
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

-- Verify PK structure
SELECT 
  table_name,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'vehicle_events' AND constraint_type = 'PRIMARY KEY';

-- Verify RLS policies include deleted_at filter
SELECT 
  tablename,
  policyname,
  cmd,
  qual  -- Should include "deleted_at IS NULL" for SELECT/UPDATE/DELETE
FROM pg_policies 
WHERE tablename IN ('profiles', 'vehicles', 'garages', 'vehicle_images', 'reminders')
ORDER BY tablename, cmd;

-- Verify no UPDATE policy on vehicle_events
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'vehicle_events' AND cmd = 'UPDATE';
-- Should return 0 rows
