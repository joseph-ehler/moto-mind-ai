-- MotoMindAI: Add missing fields for vehicle onboarding
-- This migration adds fields that the vehicle onboarding API expects

-- First, create garages table if it doesn't exist
CREATE TABLE IF NOT EXISTS garages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add missing fields to vehicles table
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS garage_id UUID REFERENCES garages(id),
ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
ADD COLUMN IF NOT EXISTS enrichment JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS smart_defaults JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS service_intervals JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_garage_id ON vehicles(garage_id) WHERE garage_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_hero_image_url ON vehicles(hero_image_url) WHERE hero_image_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_deleted_at ON vehicles(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_garages_tenant_id ON garages(tenant_id);

-- Add comments for documentation
COMMENT ON COLUMN vehicles.garage_id IS 'Reference to the garage where this vehicle is primarily located';
COMMENT ON COLUMN vehicles.hero_image_url IS 'URL to the main vehicle photo (replaces photo_url)';
COMMENT ON COLUMN vehicles.enrichment IS 'Additional vehicle data from VIN decoding (year, trim, engine specs, etc.)';
COMMENT ON COLUMN vehicles.smart_defaults IS 'AI-generated maintenance schedules and recommendations';
COMMENT ON COLUMN vehicles.service_intervals IS 'Custom service interval settings for this vehicle';
COMMENT ON COLUMN vehicles.deleted_at IS 'Soft delete timestamp for vehicles';

COMMENT ON TABLE garages IS 'Physical locations where vehicles are stored/maintained';
COMMENT ON COLUMN garages.name IS 'User-friendly name for the garage location';
COMMENT ON COLUMN garages.address IS 'Full address of the garage';
COMMENT ON COLUMN garages.lat IS 'Latitude coordinate for the garage location';
COMMENT ON COLUMN garages.lng IS 'Longitude coordinate for the garage location';
COMMENT ON COLUMN garages.timezone IS 'Timezone for the garage location (for scheduling)';

-- Create a default garage for existing tenants that don't have one
INSERT INTO garages (tenant_id, name, address)
SELECT DISTINCT t.id, 'My Garage', 'Default Location'
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM garages g WHERE g.tenant_id = t.id
)
ON CONFLICT DO NOTHING;
