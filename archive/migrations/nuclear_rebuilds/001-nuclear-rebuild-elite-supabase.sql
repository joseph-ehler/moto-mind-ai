-- =============================================================================
-- MotoMind Nuclear Rebuild: ELITE TIER + SUPABASE AUTH
-- =============================================================================
-- PRESERVES: All elite architecture (immutability, validation, performance)
-- ADOPTS: Supabase auth conventions (auth.users, profiles, JWT-based RLS)
-- FIXES: Extension placement, auth integration, materialized view security
-- RESULT: Production-ready, Supabase-native, enterprise-grade foundation
-- =============================================================================

-- WARNING: This destroys ALL data. Export events first!
-- Run: node scripts/export-import-events.js export

-- =============================================================================
-- STEP 1: EXTENSIONS IN PROPER SCHEMA
-- =============================================================================

-- Extensions belong in extensions schema (Supabase convention)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA extensions;

-- Create private schema for secure materialized views
CREATE SCHEMA IF NOT EXISTS private;

-- =============================================================================
-- STEP 2: UTILITY FUNCTIONS (PRESERVED ELITE ARCHITECTURE)
-- =============================================================================

-- Audit trail function - tracks who made changes (for mutable entities)
CREATE OR REPLACE FUNCTION public.track_updates() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  -- NEW.updated_by would be set by application context (auth.uid())
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Event immutability - prevents editing historical facts
CREATE OR REPLACE FUNCTION public.reject_updates() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Events are immutable facts and cannot be updated. Create a correction event instead.';
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Mileage validation - prevents decreasing odometer (with correction support)
CREATE OR REPLACE FUNCTION public.validate_mileage() RETURNS TRIGGER AS $$
BEGIN
  -- Allow corrections via payload flag
  IF COALESCE(NEW.payload->>'is_correction','false') = 'true' THEN
    RETURN NEW;
  END IF;
  
  -- Check against PRIOR dates only (not including current row)
  IF NEW.miles IS NOT NULL AND NEW.miles < (
    SELECT COALESCE(MAX(miles), 0) 
    FROM vehicle_events 
    WHERE vehicle_id = NEW.vehicle_id 
      AND (date < NEW.date OR (date = NEW.date AND created_at < NEW.created_at))
      AND miles IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Mileage cannot decrease from % to % on date %. Use payload->"is_correction" = "true" if this is a data correction.', 
      (SELECT COALESCE(MAX(miles), 0) FROM vehicle_events WHERE vehicle_id = NEW.vehicle_id AND (date < NEW.date OR (date = NEW.date AND created_at < NEW.created_at)) AND miles IS NOT NULL),
      NEW.miles, 
      NEW.date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- JSONB payload validation - enforces structure by event type
CREATE OR REPLACE FUNCTION public.validate_event_payload() RETURNS TRIGGER AS $$
BEGIN
  CASE NEW.type
    WHEN 'fuel' THEN
      IF NOT (NEW.payload ? 'total_amount' OR NEW.payload ? 'gallons') THEN
        RAISE EXCEPTION 'Fuel events require total_amount or gallons in payload';
      END IF;
      IF NEW.payload ? 'total_amount' THEN
        BEGIN
          IF (NEW.payload->>'total_amount')::numeric <= 0 THEN
            RAISE EXCEPTION 'Fuel total_amount must be positive';
          END IF;
        EXCEPTION WHEN invalid_text_representation THEN
          RAISE EXCEPTION 'Fuel total_amount must be a valid number';
        END;
      END IF;
    WHEN 'odometer' THEN
      IF NEW.miles IS NULL THEN
        RAISE EXCEPTION 'Odometer events require miles field';
      END IF;
    WHEN 'maintenance' THEN
      IF NOT (NEW.payload ? 'kind' OR NEW.payload ? 'service_type') THEN
        RAISE EXCEPTION 'Maintenance events require kind or service_type in payload';
      END IF;
    WHEN 'document' THEN
      IF NOT (NEW.payload ? 'doc_type') THEN
        RAISE EXCEPTION 'Document events require doc_type in payload';
      END IF;
  END CASE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Tenant ID helper - reads from JWT claim or profiles lookup (FIXED SYNTAX)
CREATE OR REPLACE FUNCTION public.current_tenant_id() RETURNS UUID AS $$
DECLARE
  jwt_tenant_id UUID;
BEGIN
  -- Try JWT claim first (fastest)
  BEGIN
    jwt_tenant_id := NULLIF((auth.jwt() ->> 'tenant_id')::UUID, NULL);
    IF jwt_tenant_id IS NOT NULL THEN
      RETURN jwt_tenant_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- JWT parsing failed, fall through to profile lookup
    NULL; -- Explicit no-op
  END;
  
  -- Fallback to profiles lookup
  RETURN (
    SELECT p.tenant_id 
    FROM public.profiles p 
    WHERE p.id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = '';

-- =============================================================================
-- STEP 3: CORE TABLES WITH SUPABASE AUTH INTEGRATION
-- =============================================================================

-- NUCLEAR REBUILD: Drop all existing tables to ensure clean schema
-- Cannot use CREATE TABLE IF NOT EXISTS because:
-- 1. Existing tables may have different column definitions
-- 2. Partitioning cannot be added to existing non-partitioned tables
-- 3. Schema changes require complete recreation for consistency

-- 1. TENANTS - Root entity (no circular dependencies)
DROP TABLE IF EXISTS public.tenants CASCADE;

CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  -- NO created_by - tenants are root entities, bootstrap problem solved
);

-- 2. PROFILES - Supabase auth integration (replaces public.users)
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL, -- Synced from auth.users.email
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id), -- Can be NULL for first user
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id)
);

-- 3. GARAGES - Location management with audit trail
DROP TABLE IF EXISTS public.garages CASCADE;

CREATE TABLE public.garages (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  timezone TEXT DEFAULT 'America/New_York',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id)
);

-- 4. VEHICLES - Primary entities with manufacturer specs
-- Drop existing table to ensure schema consistency
DROP TABLE IF EXISTS public.vehicles CASCADE;

CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  garage_id UUID REFERENCES public.garages(id) ON DELETE SET NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  trim TEXT,
  vin TEXT, -- Uniqueness enforced by index below
  license_plate TEXT, -- Uniqueness enforced by index below
  nickname TEXT,
  hero_image_url TEXT,
  notes TEXT,
  -- Manufacturer specifications (external facts, not assumptions)
  manufacturer_mpg INTEGER, -- EPA rating, not user-derived
  manufacturer_service_interval_miles INTEGER, -- OEM recommendation
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id)
);

-- 5. VEHICLE_EVENTS - IMMUTABLE EVENT STREAM (Partitioned, Elite Architecture Preserved)
-- CRITICAL: Drop existing table if it exists (may not be partitioned)
-- Cannot use CREATE TABLE IF NOT EXISTS because existing non-partitioned table
-- would prevent creation of partitioned table with same name
DROP TABLE IF EXISTS public.vehicle_events CASCADE;

CREATE TABLE public.vehicle_events (
  id UUID DEFAULT extensions.uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('odometer','maintenance','fuel','document')),
  date DATE NOT NULL,
  miles INTEGER, -- Required for odometer/maintenance/fuel
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- NO created_by - events are facts, not user actions (ELITE ARCHITECTURE PRESERVED)
  -- User info belongs in payload: payload->>'logged_by' (auth.uid() as string)
  -- NO updated_at - events are immutable
  -- NO audit trail - events ARE the audit trail
  PRIMARY KEY (id, date) -- Composite key for partitioning
) PARTITION BY RANGE (date);

-- PRE-CREATE PARTITIONS (fixed years, consistent with elite architecture)
DO $$
DECLARE
  current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
  FOR year_offset IN 0..3 LOOP
    EXECUTE format('CREATE TABLE public.vehicle_events_%s PARTITION OF public.vehicle_events FOR VALUES FROM (%L) TO (%L)',
      current_year + year_offset,
      (current_year + year_offset) || '-01-01',
      (current_year + year_offset + 1) || '-01-01'
    );
  END LOOP;
END $$;

-- 6. VEHICLE_IMAGES - Photo management with audit trail
DROP TABLE IF EXISTS public.vehicle_images CASCADE;

CREATE TABLE public.vehicle_images (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  image_type TEXT CHECK (image_type IN ('hero','gallery','document')) DEFAULT 'gallery',
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id)
);

-- 7. REMINDERS - Maintenance scheduling with audit trail
DROP TABLE IF EXISTS public.reminders CASCADE;

CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  garage_id UUID REFERENCES public.garages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  due_mileage INTEGER,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','completed','dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id)
);

-- =============================================================================
-- STEP 4: UNIQUE CONSTRAINTS & DATA INTEGRITY (ELITE ARCHITECTURE PRESERVED)
-- =============================================================================

-- Email uniqueness (case-insensitive, per tenant)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_tenant_email_unique
  ON public.profiles(tenant_id, lower(email))
  WHERE deleted_at IS NULL;

-- VIN uniqueness (per tenant, when present)
CREATE UNIQUE INDEX IF NOT EXISTS vehicles_tenant_vin_unique
  ON public.vehicles(tenant_id, vin)
  WHERE vin IS NOT NULL AND deleted_at IS NULL;

-- License plate uniqueness (per tenant, when present)
CREATE UNIQUE INDEX IF NOT EXISTS vehicles_tenant_plate_unique
  ON public.vehicles(tenant_id, license_plate)
  WHERE license_plate IS NOT NULL AND deleted_at IS NULL;

-- Only one default garage per tenant
CREATE UNIQUE INDEX IF NOT EXISTS garages_tenant_default_unique
  ON public.garages(tenant_id)
  WHERE is_default = true AND deleted_at IS NULL;

-- =============================================================================
-- STEP 5: PERFORMANCE INDEXES (TENANT-FIRST FOR RLS)
-- =============================================================================

-- Multi-tenancy indexes (filtered for performance)
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON public.profiles(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_garages_tenant ON public.garages(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant ON public.vehicles(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reminders_tenant ON public.reminders(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_vehicle_images_tenant ON public.vehicle_images(tenant_id) WHERE deleted_at IS NULL;

-- Relationship indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_garage ON public.vehicles(garage_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reminders_vehicle ON public.reminders(vehicle_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_vehicle_images_vehicle ON public.vehicle_images(vehicle_id) WHERE deleted_at IS NULL;

-- Event partition indexes (tenant-first for RLS performance)
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
    -- Add GIN index for payload on each existing partition
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I_payload_gin ON public.%I USING GIN (payload)', partition_name, partition_name);
  END LOOP;
END $$;

-- JSONB payload search
CREATE INDEX IF NOT EXISTS idx_vehicle_events_payload_gin ON public.vehicle_events USING GIN (payload);

-- Reminder status and due date queries
CREATE INDEX IF NOT EXISTS idx_reminders_status_due ON public.reminders(tenant_id, status, due_date) WHERE deleted_at IS NULL;

-- =============================================================================
-- STEP 6: SUPABASE AUTH AUTOMATION (CRITICAL FOR USER ONBOARDING)
-- =============================================================================

-- Profile creation automation - creates profile when user signs up (BULLETPROOF)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  -- Validate that default tenant exists
  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = '550e8400-e29b-41d4-a716-446655440000') THEN
    RAISE EXCEPTION 'Default tenant does not exist';
  END IF;
  
  INSERT INTO public.profiles (id, tenant_id, email, name)
  VALUES (
    NEW.id,
    '550e8400-e29b-41d4-a716-446655440000', -- Default tenant
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate key errors
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail auth signup (critical for user onboarding)
  RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Email sync automation - keeps profiles.email in sync with auth.users.email (BULLETPROOF)
CREATE OR REPLACE FUNCTION public.handle_user_email_change() RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    email = NEW.email,
    updated_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail auth update (critical for data consistency)
  RAISE WARNING 'Failed to sync email for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Triggers for Supabase auth integration (BULLETPROOF)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created 
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_email_change ON auth.users;
CREATE TRIGGER on_auth_user_email_change 
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW 
  WHEN (OLD.email IS DISTINCT FROM NEW.email) -- Only fire when email actually changes
  EXECUTE FUNCTION public.handle_user_email_change();

-- CRITICAL SECURITY: Revoke execute permissions on SECURITY DEFINER functions
-- These functions should only be called by triggers, not directly by users
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_user_email_change() FROM anon, authenticated;

-- CRITICAL SECURITY: Secure private schema access
-- Prevent direct access to private materialized views, force use of security-invoker views
REVOKE USAGE ON SCHEMA private FROM PUBLIC, anon, authenticated;

-- =============================================================================
-- STEP 7: TRIGGERS FOR DATA INTEGRITY (ELITE ARCHITECTURE PRESERVED)
-- =============================================================================

-- Auto-update timestamps and audit trails (for mutable entities only)
DROP TRIGGER IF EXISTS set_updated_profiles ON public.profiles;
CREATE TRIGGER set_updated_profiles BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.track_updates();

DROP TRIGGER IF EXISTS set_updated_garages ON public.garages;
CREATE TRIGGER set_updated_garages BEFORE UPDATE ON public.garages
  FOR EACH ROW EXECUTE FUNCTION public.track_updates();

DROP TRIGGER IF EXISTS set_updated_vehicles ON public.vehicles;
CREATE TRIGGER set_updated_vehicles BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.track_updates();

DROP TRIGGER IF EXISTS set_updated_vehicle_images ON public.vehicle_images;
CREATE TRIGGER set_updated_vehicle_images BEFORE UPDATE ON public.vehicle_images
  FOR EACH ROW EXECUTE FUNCTION public.track_updates();

DROP TRIGGER IF EXISTS set_updated_reminders ON public.reminders;
CREATE TRIGGER set_updated_reminders BEFORE UPDATE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION public.track_updates();

-- Event immutability - prevent updates to historical facts
DROP TRIGGER IF EXISTS prevent_event_updates ON public.vehicle_events;
CREATE TRIGGER prevent_event_updates BEFORE UPDATE ON public.vehicle_events
  FOR EACH ROW EXECUTE FUNCTION public.reject_updates();

-- Mileage validation - prevent decreasing odometer (with correction support)
DROP TRIGGER IF EXISTS check_mileage ON public.vehicle_events;
CREATE TRIGGER check_mileage BEFORE INSERT ON public.vehicle_events
  FOR EACH ROW WHEN (NEW.miles IS NOT NULL)
  EXECUTE FUNCTION public.validate_mileage();

-- JSONB payload validation - enforce structure
DROP TRIGGER IF EXISTS validate_payload ON public.vehicle_events;
CREATE TRIGGER validate_payload BEFORE INSERT OR UPDATE ON public.vehicle_events
  FOR EACH ROW EXECUTE FUNCTION public.validate_event_payload();

-- =============================================================================
-- STEP 7: SECURE MATERIALIZED VIEW (PRIVATE SCHEMA)
-- =============================================================================

-- Materialized view in private schema (secure from direct access)
CREATE MATERIALIZED VIEW IF NOT EXISTS private.timeline_feed AS
SELECT 
  e.id,
  e.tenant_id,  -- CRITICAL: Include for RLS
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

-- Unique index for concurrent refresh (include date for true uniqueness)
CREATE UNIQUE INDEX IF NOT EXISTS timeline_feed_unique_idx ON private.timeline_feed (id, date);

-- Performance indexes
CREATE INDEX IF NOT EXISTS timeline_feed_tenant_vehicle_idx ON private.timeline_feed (tenant_id, vehicle_id, date DESC);
CREATE INDEX IF NOT EXISTS timeline_feed_tenant_type_idx ON private.timeline_feed (tenant_id, type, date DESC);

-- =============================================================================
-- STEP 8: SECURE VIEWS WITH SUPABASE AUTH
-- =============================================================================

-- Public timeline view with security_invoker (tenant-filtered)
CREATE OR REPLACE VIEW public.timeline_feed 
WITH (security_invoker=on) AS
SELECT * FROM private.timeline_feed 
WHERE tenant_id = public.current_tenant_id();

-- Current mileage view with security_invoker
CREATE OR REPLACE VIEW public.vehicle_current_mileage 
WITH (security_invoker=on) AS
SELECT DISTINCT ON (vehicle_id)
  vehicle_id, 
  miles, 
  date, 
  created_at,
  tenant_id
FROM public.vehicle_events
WHERE type IN ('odometer','maintenance','fuel') 
  AND miles IS NOT NULL
  AND tenant_id = public.current_tenant_id()
ORDER BY vehicle_id, date DESC, created_at DESC;

-- =============================================================================
-- STEP 9: ROW LEVEL SECURITY (SUPABASE AUTH INTEGRATION)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.garages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT SELECT, INSERT ON public.vehicle_events TO authenticated; -- No UPDATE/DELETE (immutable)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_images TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminders TO authenticated;

-- COMPLETE RLS POLICIES WITH SUPABASE AUTH

-- Profiles: users can manage their own profile
CREATE POLICY "own_profile_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "own_profile_insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "own_profile_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Tenant-scoped policies using current_tenant_id()

-- Garages policy
CREATE POLICY "tenant_garages" ON public.garages
  FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- Vehicles policy
CREATE POLICY "tenant_vehicles" ON public.vehicles
  FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- Vehicle events policy (NO DELETE - events are immutable facts)
CREATE POLICY "tenant_vehicle_events_select" ON public.vehicle_events
  FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "tenant_vehicle_events_insert" ON public.vehicle_events
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.current_tenant_id());

-- Vehicle images policy
CREATE POLICY "tenant_vehicle_images" ON public.vehicle_images
  FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- Reminders policy
CREATE POLICY "tenant_reminders" ON public.reminders
  FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- =============================================================================
-- STEP 10: SCHEDULED MAINTENANCE FUNCTIONS (FIXED NESTED DOLLAR-QUOTING BUG)
-- =============================================================================

-- Function to refresh timeline materialized view
CREATE OR REPLACE FUNCTION public.refresh_timeline() 
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY private.timeline_feed;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Function to create next year's partition (2 years ahead)
CREATE OR REPLACE FUNCTION public.create_next_year_partition() 
RETURNS VOID AS $$
DECLARE
  next_year INTEGER := EXTRACT(YEAR FROM now() + interval '2 years');
  partition_name TEXT := 'vehicle_events_' || next_year;
  start_date DATE := (next_year || '-01-01')::DATE;
  end_date DATE := ((next_year + 1) || '-01-01')::DATE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = partition_name) THEN
    EXECUTE format('CREATE TABLE %I PARTITION OF public.vehicle_events FOR VALUES FROM (%L) TO (%L)',
      partition_name, start_date, end_date);
    EXECUTE format('CREATE INDEX ON %I (tenant_id, vehicle_id, date DESC)', partition_name);
    EXECUTE format('CREATE INDEX ON %I (tenant_id, type, date DESC)', partition_name);
    EXECUTE format('CREATE INDEX ON %I (tenant_id, date DESC)', partition_name);
    EXECUTE format('CREATE INDEX ON %I (vehicle_id, date DESC)', partition_name);
    -- Add GIN index for payload on each partition
    EXECUTE format('CREATE INDEX ON %I USING GIN (payload)', partition_name);
    RAISE NOTICE 'Created partition % for year %', partition_name, next_year;
  END IF;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Schedule the functions (eliminates nested dollar-quoting issues)
SELECT cron.schedule_in_database(
  'refresh-timeline',
  '*/5 * * * *',
  'SELECT public.refresh_timeline();',
  'postgres'
);

SELECT cron.schedule_in_database(
  'create-partitions',
  '0 0 1 * *',
  'SELECT public.create_next_year_partition();',
  'postgres'
);

-- =============================================================================
-- STEP 11: MONITORING & OBSERVABILITY (ELITE FEATURES PRESERVED)
-- =============================================================================

-- Database health monitoring view
CREATE OR REPLACE VIEW public.db_health_stats AS
SELECT 
  'tables' as category,
  schemaname,
  relname as name,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  last_vacuum,
  last_autovacuum,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as total_size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
UNION ALL
SELECT 
  'materialized_views' as category,
  schemaname,
  matviewname as name,
  NULL as live_rows,
  NULL as dead_rows,
  NULL as last_vacuum,
  NULL as last_autovacuum,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) as total_size
FROM pg_matviews
WHERE schemaname IN ('public', 'private')
ORDER BY category, name;

-- Partition coverage check
CREATE OR REPLACE VIEW public.partition_coverage AS
SELECT 
  tablename,
  CASE 
    WHEN tablename ~ '_(\d{4})$' THEN 
      EXTRACT(YEAR FROM CURRENT_DATE) - (regexp_match(tablename, '_(\d{4})$'))[1]::integer
    ELSE NULL
  END as years_from_now
FROM pg_tables 
WHERE tablename LIKE 'vehicle_events_%'
  AND tablename ~ '_\d{4}$'
ORDER BY tablename;

-- Materialized view freshness (using pg_stat_all_tables)
CREATE OR REPLACE VIEW public.mv_freshness AS
WITH mv AS (
  SELECT 
    schemaname, 
    matviewname, 
    (schemaname || '.' || matviewname) AS fqname
  FROM pg_matviews 
  WHERE schemaname IN ('public', 'private')
), 
stats AS (
  SELECT 
    c.oid AS relid,
    n.nspname AS schemaname,
    c.relname AS relname,
    s.last_vacuum,
    s.last_autovacuum,
    s.last_analyze,
    s.last_autoanalyze
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_stat_all_tables s ON s.relid = c.oid
)
SELECT 
  mv.matviewname,
  pg_size_pretty(pg_relation_size(mv.fqname)) AS size,
  CASE 
    WHEN stats.last_vacuum IS NULL THEN 'Never refreshed'
    WHEN stats.last_vacuum < now() - interval '10 minutes' THEN 'Stale (>10min)'
    WHEN stats.last_vacuum < now() - interval '5 minutes' THEN 'Warning (>5min)'
    ELSE 'Fresh'
  END AS freshness_status,
  stats.last_vacuum AS last_refresh
FROM mv
LEFT JOIN stats ON stats.schemaname = mv.schemaname AND stats.relname = mv.matviewname
ORDER BY mv.matviewname;

-- =============================================================================
-- STEP 12: SEED DATA (DEVELOPMENT)
-- =============================================================================

-- Default tenant (no circular dependency)
INSERT INTO public.tenants (id, name) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'Development Tenant')
ON CONFLICT (id) DO NOTHING;

-- Note: Profiles will be created via Supabase auth triggers or application logic
-- when users sign up. No seed profile needed.

-- =============================================================================
-- STEP 13: JWT CLAIM CONFIGURATION DOCUMENTATION
-- =============================================================================

/*
CRITICAL: JWT CLAIM SETUP FOR OPTIMAL PERFORMANCE

For best performance, configure Supabase to include tenant_id in JWT claims.
Without this, every RLS check requires a database lookup to profiles table.

DEPLOYMENT CHECKLIST:
[ ] Backup existing database
[ ] Export any existing events: node scripts/export-import-events.js export
[ ] Run this migration (will validate all critical functions)
[ ] Test authentication: SELECT public.current_tenant_id();
[ ] Test user signup: Create test user, verify profile exists
[ ] Test email sync: Change user email, verify profile updates
[ ] Check scheduled jobs: SELECT * FROM cron.job;
[ ] Configure JWT claims for performance (optional but recommended)

VALIDATION QUERIES (Run after deployment):
-- 1. Test current_tenant_id function
SELECT public.current_tenant_id(); -- Should not error

-- 2. Check triggers exist
SELECT tgname FROM pg_trigger WHERE tgname IN ('on_auth_user_created', 'on_auth_user_email_change');

-- 3. Verify partitions
SELECT tablename FROM pg_tables WHERE tablename LIKE 'vehicle_events_%' ORDER BY tablename;

-- 4. Check materialized view
SELECT * FROM pg_matviews WHERE matviewname = 'timeline_feed';

-- 5. Test scheduled maintenance functions
SELECT public.refresh_timeline(); -- Should not error and update pg_stat_all_tables
SELECT public.create_next_year_partition(); -- Should not error (creates partition if needed)

-- 6. Check scheduled jobs
SELECT * FROM cron.job WHERE jobname IN ('refresh-timeline', 'create-partitions');

-- 7. Verify refresh tracking works (using pg_stat_all_tables)
SELECT * FROM public.mv_freshness; -- Should show refresh status based on last_vacuum

OPTION 1: Custom Access Token Hook (Recommended)
In Supabase Dashboard: Authentication > Hooks > Custom Access Token

```javascript
export const handler = async (event) => {
  const { user } = event;
  
  // Fetch tenant_id from profiles
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();
  
  return {
    ...event,
    claims: {
      ...event.claims,
      tenant_id: data?.tenant_id
    }
  };
};
```

OPTION 2: Database Function Hook
Configure in Supabase Dashboard:
Authentication > Hooks > Custom Claims Hook
Hook Type: SQL Function
Function: public.get_custom_claims(auth.uid())

```sql
CREATE OR REPLACE FUNCTION public.get_custom_claims(user_id UUID)
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_build_object('tenant_id', tenant_id)
    FROM public.profiles
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

OPTION 3: No Custom Claims (Fallback - Works but Slower)
If custom claims aren't configured, current_tenant_id() automatically
falls back to profiles table lookup. Functional but slower performance.

TESTING JWT CLAIMS:
After setup, verify JWT contains tenant_id:
```sql
SELECT auth.jwt() ->> 'tenant_id' as tenant_id_from_jwt;
```

Should return the user's tenant_id, not NULL.

TROUBLESHOOTING:
- If RLS fails: Check current_tenant_id() returns valid UUID
- If signup fails: Check profile creation trigger exists
- If email sync fails: Check email sync trigger exists
- If performance is slow: Configure JWT claims (Option 1 or 2)
*/

-- =============================================================================
-- STEP 14: VALIDATION & SUMMARY
-- =============================================================================

-- Validate schema integrity
DO $$
BEGIN
  -- Check that profiles table exists (not public.users)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'profiles' AND table_schema = 'public'
  ) THEN
    RAISE EXCEPTION 'Profiles table not found - Supabase auth integration failed';
  END IF;
  
  -- Check that events don't have audit trail (elite architecture preserved)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicle_events' AND column_name = 'created_by'
  ) THEN
    RAISE EXCEPTION 'Events should not have audit trail - they ARE the audit trail';
  END IF;
  
  -- Check that partitions are pre-created
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE tablename LIKE 'vehicle_events_%'
  ) THEN
    RAISE EXCEPTION 'Event partitions not pre-created';
  END IF;
  
  -- Check that manufacturer specs are restored
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicles' AND column_name = 'manufacturer_mpg'
  ) THEN
    RAISE EXCEPTION 'Manufacturer specifications not restored';
  END IF;
  
  -- Check that timeline_feed is in private schema
  IF NOT EXISTS (
    SELECT 1 FROM pg_matviews 
    WHERE schemaname = 'private' AND matviewname = 'timeline_feed'
  ) THEN
    RAISE EXCEPTION 'Timeline feed not secured in private schema';
  END IF;
  
  -- Check that auth triggers exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    RAISE EXCEPTION 'Profile creation trigger not found - user onboarding will fail';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_email_change'
  ) THEN
    RAISE EXCEPTION 'Email sync trigger not found - profile data will become stale';
  END IF;
  
  -- Check that current_tenant_id function exists and is callable
  BEGIN
    PERFORM public.current_tenant_id();
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'current_tenant_id() function failed - RLS will not work: %', SQLERRM;
  END;
  
  -- Check that scheduled maintenance functions exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'refresh_timeline' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    RAISE EXCEPTION 'refresh_timeline() function not found - materialized view refresh will fail';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'create_next_year_partition' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    RAISE EXCEPTION 'create_next_year_partition() function not found - partition creation will fail';
  END IF;
  
  RAISE NOTICE 'ELITE + SUPABASE SCHEMA VALIDATION PASSED - ALL CHECKS SUCCESSFUL';
  RAISE NOTICE 'NEXT STEPS: Configure JWT custom claims for optimal performance (see documentation above)';
END $$;

-- Final summary
SELECT 
  'NUCLEAR REBUILD COMPLETE - ELITE + SUPABASE' as status,
  '7 core tables + Supabase auth integration' as tables,
  'JWT-based RLS with tenant isolation' as security,
  'Elite architecture preserved (immutability, validation)' as integrity,
  'Partitioned events, secure materialized views' as performance,
  'Production-ready, Supabase-native' as result;

-- =============================================================================
-- ELITE + SUPABASE FEATURES SUMMARY
-- =============================================================================

/*
🏆 ELITE TIER + SUPABASE AUTH FEATURES:

✅ SUPABASE INTEGRATION:
- Uses auth.users as source of truth (not custom public.users)
- public.profiles linked to auth.users(id) 
- JWT-based RLS with current_tenant_id() helper
- Extensions in extensions schema
- Materialized views in private schema for security

✅ ELITE ARCHITECTURE PRESERVED:
- Event immutability (no created_by on events)
- Mileage validation with correction support
- JSONB payload validation by event type
- Complete audit trails on mutable entities only
- Partitioned events with tenant-first indexing

✅ SECURITY (MULTI-TENANT SAFE):
- Complete RLS policies with WITH CHECK clauses
- Tenant isolation via JWT claims or profile lookup
- Events cannot be deleted (immutable facts)
- Unique constraints prevent data corruption
- Security-invoker views prevent RLS bypass

✅ PERFORMANCE AT SCALE:
- Partitioned vehicle_events by date (4 years pre-created)
- Secure materialized timeline view with scheduled refresh
- Tenant-first indexing strategy for RLS performance
- Filtered indexes for soft deletes

✅ OPERATIONAL EXCELLENCE:
- Scheduled partition creation (2 years ahead)
- Health monitoring views
- Partition coverage tracking
- Materialized view freshness monitoring

RESULT: Production-ready, Supabase-native, enterprise-grade foundation
that preserves all elite architecture while adopting Supabase auth conventions.

This is the definitive elite + Supabase database schema.
*/
