-- ============================================
-- ENFORCE TENANT ID CONSTRAINTS
-- Migration: 20251014_enforce_tenant_constraints.sql
-- 
-- Purpose: Add NOT NULL constraints and indexes for tenant_id
-- to ensure data integrity and performance
-- ============================================

-- Add indexes for tenant_id if they don't exist
-- (Improves query performance for tenant isolation)

CREATE INDEX IF NOT EXISTS vehicles_tenant_id_idx 
ON vehicles(tenant_id);

CREATE INDEX IF NOT EXISTS vehicle_events_tenant_id_idx 
ON vehicle_events(tenant_id);

CREATE INDEX IF NOT EXISTS vehicle_images_tenant_id_idx 
ON vehicle_images(tenant_id);

CREATE INDEX IF NOT EXISTS photo_metadata_tenant_id_idx 
ON photo_metadata(tenant_id);

-- Add foreign key constraints to ensure referential integrity
-- (Prevents orphaned data with invalid tenant_ids)

DO $$ 
BEGIN
  -- vehicles.tenant_id -> tenants.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'vehicles_tenant_id_fkey'
  ) THEN
    ALTER TABLE vehicles
    ADD CONSTRAINT vehicles_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    ON DELETE CASCADE;
  END IF;

  -- vehicle_events.tenant_id -> tenants.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'vehicle_events_tenant_id_fkey'
  ) THEN
    ALTER TABLE vehicle_events
    ADD CONSTRAINT vehicle_events_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    ON DELETE CASCADE;
  END IF;

  -- vehicle_images.tenant_id -> tenants.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'vehicle_images_tenant_id_fkey'
  ) THEN
    ALTER TABLE vehicle_images
    ADD CONSTRAINT vehicle_images_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    ON DELETE CASCADE;
  END IF;

  -- photo_metadata.tenant_id -> tenants.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'photo_metadata_tenant_id_fkey'
  ) THEN
    ALTER TABLE photo_metadata
    ADD CONSTRAINT photo_metadata_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Make tenant_id NOT NULL (after verifying all rows have values)
-- IMPORTANT: Only run this after confirming 100% of rows have tenant_id

-- Uncomment these lines ONLY if you've verified all data has tenant_id:
-- ALTER TABLE vehicles ALTER COLUMN tenant_id SET NOT NULL;
-- ALTER TABLE vehicle_events ALTER COLUMN tenant_id SET NOT NULL;
-- ALTER TABLE vehicle_images ALTER COLUMN tenant_id SET NOT NULL;
-- ALTER TABLE photo_metadata ALTER COLUMN tenant_id SET NOT NULL;

-- Add check to prevent future NULL inserts via RLS
-- (Belt and suspenders - RLS + application layer + constraints)

-- Note: RLS policies should already enforce tenant_id, but this adds another layer

COMMENT ON COLUMN vehicles.tenant_id IS 'Required: Every vehicle must belong to a tenant for data isolation';
COMMENT ON COLUMN vehicle_events.tenant_id IS 'Required: Every event must belong to a tenant for data isolation';
COMMENT ON COLUMN vehicle_images.tenant_id IS 'Required: Every image must belong to a tenant for data isolation';
COMMENT ON COLUMN photo_metadata.tenant_id IS 'Required: Every photo must belong to a tenant for data isolation';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Tenant constraints migration complete';
  RAISE NOTICE 'Indexes created: vehicles_tenant_id_idx, vehicle_events_tenant_id_idx, vehicle_images_tenant_id_idx, photo_metadata_tenant_id_idx';
  RAISE NOTICE 'Foreign keys added: All tenant_id columns now reference tenants(id)';
  RAISE NOTICE 'IMPORTANT: Review data audit before uncommenting NOT NULL constraints';
END $$;
