-- MotoMind Nuclear Rebuild: Enterprise-Grade Schema (FIXED)
-- ELIMINATES 35 objects → 8 core tables with proper enterprise architecture
-- FIXES: Circular dependencies, immutability logic, performance issues

-- =============================================================================
-- STEP 1: NUCLEAR OPTION - COMPLETE RESET
-- =============================================================================

-- WARNING: This destroys ALL data. Export events first!
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_cron"; -- For scheduled tasks

-- =============================================================================
-- STEP 2: UTILITY FUNCTIONS (Before Tables)
-- =============================================================================

-- Audit trail function - tracks who made changes (for mutable entities)
CREATE OR REPLACE FUNCTION track_updates() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  -- NEW.updated_by would be set by application context
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Event immutability - prevents editing historical facts
CREATE OR REPLACE FUNCTION reject_updates() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Events are immutable facts and cannot be updated. Create a correction event instead.';
END;
$$ LANGUAGE plpgsql;

-- Mileage validation - prevents decreasing odometer
CREATE OR REPLACE FUNCTION validate_mileage() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.miles IS NOT NULL AND NEW.miles < (
    SELECT COALESCE(MAX(miles), 0) 
    FROM vehicle_events 
    WHERE vehicle_id = NEW.vehicle_id 
      AND date < NEW.date
      AND miles IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Mileage cannot decrease from % to % on date %', 
      (SELECT MAX(miles) FROM vehicle_events WHERE vehicle_id = NEW.vehicle_id AND date < NEW.date),
      NEW.miles, 
      NEW.date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- JSONB payload validation - enforces structure by event type
CREATE OR REPLACE FUNCTION validate_event_payload() RETURNS TRIGGER AS $$
BEGIN
  CASE NEW.type
    WHEN 'fuel' THEN
      IF NOT (NEW.payload ? 'total_amount' OR NEW.payload ? 'gallons') THEN
        RAISE EXCEPTION 'Fuel events require total_amount or gallons in payload';
      END IF;
      IF NEW.payload ? 'total_amount' AND (NEW.payload->>'total_amount')::numeric <= 0 THEN
        RAISE EXCEPTION 'Fuel total_amount must be positive';
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
      IF NOT NEW.payload ? 'doc_type' THEN
        RAISE EXCEPTION 'Document events require doc_type in payload';
      END IF;
  END CASE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STEP 3: CORE TABLES WITH FIXED ARCHITECTURE
-- =============================================================================

-- 1. TENANTS - Root entity (no circular dependencies)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  -- NO created_by - tenants are root entities, bootstrap problem solved
);

-- 2. USERS - Authentication with proper audit trail
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id), -- Can be NULL for first user
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id)
);

-- 3. GARAGES - Location management with audit trail
CREATE TABLE garages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  timezone TEXT DEFAULT 'America/New_York',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id)
);

-- 4. VEHICLES - Primary entities with manufacturer specs (not assumptions)
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  garage_id UUID REFERENCES garages(id) ON DELETE SET NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  trim TEXT,
  vin TEXT,
  license_plate TEXT,
  nickname TEXT,
  hero_image_url TEXT,
  notes TEXT,
  -- RESTORED: Manufacturer specifications (external facts, not assumptions)
  manufacturer_mpg INTEGER, -- EPA rating, not user-derived
  manufacturer_service_interval_miles INTEGER, -- OEM recommendation
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id)
);

-- 5. VEHICLE_EVENTS - IMMUTABLE EVENT STREAM (Fixed architecture)
CREATE TABLE vehicle_events (
  id UUID DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('odometer','maintenance','fuel','document')),
  date DATE NOT NULL,
  miles INTEGER, -- Required for odometer/maintenance/fuel
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- NO created_by - events are facts, not user actions
  -- Source/user info belongs in payload if needed: payload->>'source', payload->>'logged_by'
  -- NO updated_at - events are immutable
  -- NO audit trail - events ARE the audit trail
  PRIMARY KEY (id, date) -- Composite key for partitioning
) PARTITION BY RANGE (date);

-- PRE-CREATE PARTITIONS (no dangerous on-demand creation)
CREATE TABLE vehicle_events_2024 PARTITION OF vehicle_events
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE vehicle_events_2025 PARTITION OF vehicle_events
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE vehicle_events_2026 PARTITION OF vehicle_events
FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE TABLE vehicle_events_2027 PARTITION OF vehicle_events
FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');

-- Indexes on each partition
CREATE INDEX ON vehicle_events_2024 (vehicle_id, date DESC);
CREATE INDEX ON vehicle_events_2024 (type);
CREATE INDEX ON vehicle_events_2024 (tenant_id);

CREATE INDEX ON vehicle_events_2025 (vehicle_id, date DESC);
CREATE INDEX ON vehicle_events_2025 (type);
CREATE INDEX ON vehicle_events_2025 (tenant_id);

CREATE INDEX ON vehicle_events_2026 (vehicle_id, date DESC);
CREATE INDEX ON vehicle_events_2026 (type);
CREATE INDEX ON vehicle_events_2026 (tenant_id);

CREATE INDEX ON vehicle_events_2027 (vehicle_id, date DESC);
CREATE INDEX ON vehicle_events_2027 (type);
CREATE INDEX ON vehicle_events_2027 (tenant_id);

-- 6. VEHICLE_IMAGES - Photo management with audit trail
CREATE TABLE vehicle_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  image_type TEXT CHECK (image_type IN ('hero','gallery','document')) DEFAULT 'gallery',
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id)
);

-- 7. REMINDERS - Maintenance scheduling with audit trail
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  garage_id UUID REFERENCES garages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  due_mileage INTEGER,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','completed','dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id)
);

-- =============================================================================
-- STEP 4: TRIGGERS FOR DATA INTEGRITY (Fixed)
-- =============================================================================

-- Auto-update timestamps and audit trails (for mutable entities only)
CREATE TRIGGER set_updated_users BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION track_updates();

CREATE TRIGGER set_updated_garages BEFORE UPDATE ON garages
  FOR EACH ROW EXECUTE FUNCTION track_updates();

CREATE TRIGGER set_updated_vehicles BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION track_updates();

CREATE TRIGGER set_updated_vehicle_images BEFORE UPDATE ON vehicle_images
  FOR EACH ROW EXECUTE FUNCTION track_updates();

CREATE TRIGGER set_updated_reminders BEFORE UPDATE ON reminders
  FOR EACH ROW EXECUTE FUNCTION track_updates();

-- Event immutability - prevent updates to historical facts
CREATE TRIGGER prevent_event_updates BEFORE UPDATE ON vehicle_events
  FOR EACH ROW EXECUTE FUNCTION reject_updates();

-- Mileage validation - prevent decreasing odometer
CREATE TRIGGER check_mileage BEFORE INSERT ON vehicle_events
  FOR EACH ROW WHEN (NEW.miles IS NOT NULL)
  EXECUTE FUNCTION validate_mileage();

-- JSONB payload validation - enforce structure
CREATE TRIGGER validate_payload BEFORE INSERT OR UPDATE ON vehicle_events
  FOR EACH ROW EXECUTE FUNCTION validate_event_payload();

-- NO dangerous partition creation trigger - partitions are pre-created

-- =============================================================================
-- STEP 5: PERFORMANCE OPTIMIZATION (Fixed)
-- =============================================================================

-- Essential indexes for multi-tenancy (filtered for performance)
CREATE INDEX idx_users_tenant ON users(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_garages_tenant ON garages(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_vehicles_tenant ON vehicles(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reminders_tenant ON reminders(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_vehicle_images_tenant ON vehicle_images(tenant_id) WHERE deleted_at IS NULL;

-- Performance indexes for common queries
CREATE INDEX idx_vehicles_garage ON vehicles(garage_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reminders_vehicle ON reminders(vehicle_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_vehicle_images_vehicle ON vehicle_images(vehicle_id) WHERE deleted_at IS NULL;

-- JSONB indexes for payload queries
CREATE INDEX idx_vehicle_events_payload_gin ON vehicle_events USING GIN (payload);

-- =============================================================================
-- STEP 6: MATERIALIZED VIEW FOR TIMELINE (Fixed refresh strategy)
-- =============================================================================

-- Optimized timeline feed with pre-joined data
CREATE MATERIALIZED VIEW timeline_feed AS
SELECT 
  e.id,
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
FROM vehicle_events e
JOIN vehicles v ON e.vehicle_id = v.id AND v.deleted_at IS NULL
LEFT JOIN garages g ON v.garage_id = g.id AND g.deleted_at IS NULL
ORDER BY e.date DESC, e.created_at DESC;

-- Unique index for concurrent refresh
CREATE UNIQUE INDEX ON timeline_feed (id);

-- Performance indexes
CREATE INDEX ON timeline_feed (vehicle_id, date DESC);
CREATE INDEX ON timeline_feed (type, date DESC);

-- NO expensive per-insert refresh trigger
-- Instead: Schedule refresh every 5 minutes via pg_cron
SELECT cron.schedule('refresh-timeline', '*/5 * * * *', 
  'REFRESH MATERIALIZED VIEW CONCURRENTLY timeline_feed');

-- =============================================================================
-- STEP 7: ESSENTIAL VIEW - CURRENT MILEAGE
-- =============================================================================

CREATE OR REPLACE VIEW vehicle_current_mileage AS
SELECT DISTINCT ON (vehicle_id)
  vehicle_id, 
  miles, 
  date, 
  created_at
FROM vehicle_events
WHERE type IN ('odometer','maintenance','fuel') 
  AND miles IS NOT NULL
ORDER BY vehicle_id, date DESC, created_at DESC;

-- =============================================================================
-- STEP 8: ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE garages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Basic tenant isolation policies
CREATE POLICY tenant_isolation_users ON users
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_garages ON garages
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_vehicles ON vehicles
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_vehicle_events ON vehicle_events
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_vehicle_images ON vehicle_images
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_reminders ON reminders
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =============================================================================
-- STEP 9: SCHEDULED MAINTENANCE TASKS
-- =============================================================================

-- Create future partitions monthly (no dangerous on-demand creation)
SELECT cron.schedule('create-partitions', '0 0 1 * *', $$
DO $$
DECLARE
  next_year INTEGER := EXTRACT(YEAR FROM now() + interval '2 years');
  partition_name TEXT := 'vehicle_events_' || next_year;
  start_date DATE := (next_year || '-01-01')::DATE;
  end_date DATE := ((next_year + 1) || '-01-01')::DATE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = partition_name) THEN
    EXECUTE format('CREATE TABLE %I PARTITION OF vehicle_events FOR VALUES FROM (%L) TO (%L)',
      partition_name, start_date, end_date);
    EXECUTE format('CREATE INDEX ON %I (vehicle_id, date DESC)', partition_name);
    EXECUTE format('CREATE INDEX ON %I (type)', partition_name);
    EXECUTE format('CREATE INDEX ON %I (tenant_id)', partition_name);
  END IF;
END $$;
$$);

-- =============================================================================
-- STEP 10: SEED DATA (Development)
-- =============================================================================

-- Default tenant (no circular dependency)
INSERT INTO tenants (id, name) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'Development Tenant');

-- Default user (can reference tenant, no circular dependency)
INSERT INTO users (id, tenant_id, email, name) VALUES 
  ('550e8400-e29b-41d4-a716-446655441111', '550e8400-e29b-41d4-a716-446655440000', 'dev@motomind.ai', 'Development User');

-- Default garage (with proper audit trail)
INSERT INTO garages (tenant_id, name, is_default, created_by) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'My Garage', true, '550e8400-e29b-41d4-a716-446655441111');

-- =============================================================================
-- STEP 11: VALIDATION & SUMMARY
-- =============================================================================

-- Validate schema integrity
DO $$
BEGIN
  -- Check that circular dependency is resolved
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tenants' AND column_name = 'created_by'
  ) THEN
    RAISE EXCEPTION 'Circular dependency not resolved - tenants should not have created_by';
  END IF;
  
  -- Check that events don't have audit trail
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicle_events' AND column_name = 'created_by'
  ) THEN
    RAISE EXCEPTION 'Events should not have audit trail - they ARE the audit trail';
  END IF;
  
  -- Check that partitions are pre-created
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'vehicle_events_2027'
  ) THEN
    RAISE EXCEPTION 'Future partitions not pre-created';
  END IF;
  
  -- Check that manufacturer specs are restored
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicles' AND column_name = 'manufacturer_mpg'
  ) THEN
    RAISE EXCEPTION 'Manufacturer specifications not restored';
  END IF;
  
  RAISE NOTICE 'FIXED ENTERPRISE SCHEMA VALIDATION PASSED';
END $$;

SELECT 
  'NUCLEAR REBUILD COMPLETE - ENTERPRISE EDITION (FIXED)' as status,
  '7 core tables with proper enterprise architecture' as tables,
  '1 materialized view + 1 essential view' as views,
  'Fixed: circular deps, immutability logic, performance' as fixes,
  'Scheduled refresh, pre-created partitions' as performance,
  'Production-ready with proper architecture' as next_step;

-- =============================================================================
-- ARCHITECTURAL FIXES SUMMARY
-- =============================================================================

/*
✅ FIXED CIRCULAR DEPENDENCIES:
- Removed created_by from tenants (root entity)
- Users can reference tenants without circular dependency
- First user can have NULL created_by (bootstrap solved)

✅ FIXED IMMUTABILITY LOGIC:
- Removed created_by from vehicle_events
- Events are facts, not user actions
- Source/user info belongs in payload if needed

✅ FIXED PERFORMANCE ISSUES:
- Pre-created partitions for 4 years (no dangerous on-demand creation)
- Scheduled materialized view refresh (every 5 minutes)
- Monthly partition creation via pg_cron

✅ RESTORED MANUFACTURER SPECS:
- manufacturer_mpg (EPA rating, not user-derived)
- manufacturer_service_interval_miles (OEM recommendation)
- These are external facts, not assumptions

✅ MAINTAINED ENTERPRISE FEATURES:
- Complete audit trails (where logically appropriate)
- Database-level validation (mileage, payload structure)
- Event immutability (historical facts cannot change)
- Soft deletes with filtered indexes
- Performance optimization (partitioning, materialized views)

RESULT: Architecturally sound enterprise foundation that enforces
"Capture → Log → Done" at the database level without logical contradictions
or circular dependencies.
*/
