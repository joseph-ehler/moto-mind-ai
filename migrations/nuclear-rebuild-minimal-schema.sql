-- MotoMind Nuclear Rebuild: Minimal Schema
-- ELIMINATES 35 objects → 7 core tables
-- Aligns database with "Capture → Log → Done" architecture

-- =============================================================================
-- STEP 1: NUCLEAR OPTION - COMPLETE RESET
-- =============================================================================

-- WARNING: This destroys ALL data. Export events first!
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- STEP 2: CORE TABLES ONLY - 7 TABLES TOTAL
-- =============================================================================

-- 1. TENANTS - Multi-tenancy foundation
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. USERS - Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. GARAGES - Location management
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
  deleted_at TIMESTAMPTZ
);

-- 4. VEHICLES - Primary entities
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
  nickname TEXT, -- Single naming field (no display_name confusion)
  hero_image_url TEXT,
  baseline_fuel_mpg INTEGER,
  baseline_service_interval_miles INTEGER DEFAULT 5000,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 5. VEHICLE_EVENTS - ⭐ UNIFIED EVENT STREAM (Your core table)
CREATE TABLE vehicle_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('odometer','maintenance','fuel','document')),
  date DATE NOT NULL,
  miles INTEGER, -- Required for odometer/maintenance/fuel
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. VEHICLE_IMAGES - Photo management
CREATE TABLE vehicle_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  image_type TEXT CHECK (image_type IN ('hero','gallery','document')) DEFAULT 'gallery',
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 7. REMINDERS - Maintenance scheduling
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
  deleted_at TIMESTAMPTZ
);

-- =============================================================================
-- STEP 3: ESSENTIAL INDEXES ONLY
-- =============================================================================

-- Vehicle events (your primary query patterns)
CREATE INDEX idx_vehicle_events_vehicle_date ON vehicle_events(vehicle_id, date DESC);
CREATE INDEX idx_vehicle_events_type ON vehicle_events(type);
CREATE INDEX idx_vehicle_events_tenant ON vehicle_events(tenant_id);

-- Multi-tenancy indexes
CREATE INDEX idx_vehicles_tenant ON vehicles(tenant_id);
CREATE INDEX idx_garages_tenant ON garages(tenant_id);
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_reminders_tenant ON reminders(tenant_id);
CREATE INDEX idx_vehicle_images_tenant ON vehicle_images(tenant_id);

-- Performance indexes
CREATE INDEX idx_vehicles_garage ON vehicles(garage_id);
CREATE INDEX idx_reminders_vehicle ON reminders(vehicle_id);
CREATE INDEX idx_vehicle_images_vehicle ON vehicle_images(vehicle_id);

-- =============================================================================
-- STEP 4: ESSENTIAL VIEW - CURRENT MILEAGE (Used by events API)
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
-- STEP 5: ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE garages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Basic tenant isolation policies (customize as needed)
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
-- STEP 6: SEED DATA (Development)
-- =============================================================================

-- Default tenant
INSERT INTO tenants (id, name) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'Development Tenant');

-- Default user
INSERT INTO users (tenant_id, email, name) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'dev@motomind.ai', 'Development User');

-- Default garage
INSERT INTO garages (tenant_id, name, is_default) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'My Garage', true);

-- =============================================================================
-- SUMMARY
-- =============================================================================

SELECT 
  'NUCLEAR REBUILD COMPLETE' as status,
  '7 core tables created' as tables,
  '1 essential view created' as views,
  'RLS policies enabled' as security,
  'Ready for event import' as next_step;

-- =============================================================================
-- WHAT WAS ELIMINATED
-- =============================================================================

/*
REMOVED (28 objects):
- vehicle_health_scores (materialized view)
- vehicle_generations (14 rows - AI features)
- vehicle_metrics (empty)
- image_generation_queue (empty)
- provider_integrations (empty)
- vin_cache (10 rows - performance cache)
- memberships (1 row - SaaS features)
- plan_limits (3 rows - SaaS features)
- usage_counters (empty)
- audit_log (empty)
- vehicle_onboarding (1 row)
- vehicles_naming_backup (5 rows)
- odometer_readings (4 rows - MIGRATED to vehicle_events)
- fuel_logs (2 rows - MIGRATED to vehicle_events)
- service_records (6 rows - MIGRATED to vehicle_events)
- manual_events (empty)
- uploads (empty)
- explanations (unknown)
- schema_migrations (metadata)
- + 9 analytical views

KEPT (7 core tables):
✅ tenants, users, garages, vehicles
✅ vehicle_events (your unified event stream)
✅ vehicle_images, reminders
✅ vehicle_current_mileage view (used by API)

RESULT:
- 35 objects → 8 objects (-77% complexity)
- 4 event systems → 1 unified system
- Clean architecture aligned with simplified approach
- Zero technical debt
- Ready for "Capture → Log → Done" workflow
*/
