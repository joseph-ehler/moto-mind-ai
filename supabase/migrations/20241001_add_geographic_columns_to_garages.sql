-- Add geographic columns to garages table
-- These columns are expected by the StreamlinedGarageSelector component

-- Add geographic location columns
ALTER TABLE garages ADD COLUMN IF NOT EXISTS lat DECIMAL(10, 8);
ALTER TABLE garages ADD COLUMN IF NOT EXISTS lng DECIMAL(11, 8);
ALTER TABLE garages ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Add is_default column for garage management
ALTER TABLE garages ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Standardize timestamp types (as recommended)
ALTER TABLE garages ALTER COLUMN last_used TYPE TIMESTAMPTZ USING last_used AT TIME ZONE 'UTC';
ALTER TABLE garages ALTER COLUMN deleted_at TYPE TIMESTAMPTZ USING deleted_at AT TIME ZONE 'UTC';

-- Add recommended indexes
CREATE INDEX IF NOT EXISTS idx_garages_tenant_id ON garages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_garages_active ON garages(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_garages_default ON garages(tenant_id, is_default) WHERE is_default = true;

-- Add comments for documentation
COMMENT ON COLUMN garages.lat IS 'Latitude coordinate for garage location (optional)';
COMMENT ON COLUMN garages.lng IS 'Longitude coordinate for garage location (optional)';
COMMENT ON COLUMN garages.timezone IS 'Timezone for garage location (e.g., America/New_York)';
COMMENT ON COLUMN garages.is_default IS 'Whether this is the default garage for the tenant';
COMMENT ON COLUMN garages.vehicle_count IS 'Number of vehicles in this garage (maintained by triggers)';
COMMENT ON COLUMN garages.last_used IS 'Last time this garage was selected for a vehicle';
COMMENT ON COLUMN garages.deleted_at IS 'Soft delete timestamp (NULL = active)';

-- Ensure at most one default garage per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_garages_one_default_per_tenant 
ON garages(tenant_id) 
WHERE is_default = true AND deleted_at IS NULL;
