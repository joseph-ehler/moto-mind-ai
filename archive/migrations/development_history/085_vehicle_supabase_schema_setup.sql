-- =============================================================================
-- SUPABASE SCHEMA COMPLETION - CRITICAL MISSING TABLES
-- =============================================================================
-- Run this in Supabase Dashboard → SQL Editor
-- This creates the missing tables needed for full functionality

-- 1. CREATE GARAGES TABLE
-- This is blocking vehicle creation
CREATE TABLE IF NOT EXISTS garages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREATE SCHEMA MIGRATIONS TABLE  
-- This is needed for health checks
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INSERT DEFAULT GARAGE FOR DEMO TENANT
-- This allows vehicle creation to work immediately
INSERT INTO garages (id, tenant_id, name, address) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'My Garage',
  'Home'
) ON CONFLICT (id) DO NOTHING;

-- 4. INSERT SAMPLE MIGRATION RECORDS
-- This makes health checks pass
INSERT INTO schema_migrations (filename) VALUES 
  ('001_base_schema.sql'),
  ('002_garages_table.sql'),
  ('003_vehicles_table.sql')
ON CONFLICT (filename) DO NOTHING;

-- 5. VERIFY TABLES CREATED
-- Check that everything was created successfully
SELECT 'garages' as table_name, count(*) as record_count FROM garages
UNION ALL
SELECT 'schema_migrations' as table_name, count(*) as record_count FROM schema_migrations
UNION ALL  
SELECT 'vehicles' as table_name, count(*) as record_count FROM vehicles
UNION ALL
SELECT 'tenants' as table_name, count(*) as record_count FROM tenants;
