-- VIN Cache Table for NHTSA API results
CREATE TABLE IF NOT EXISTS vin_cache (
  vin VARCHAR(17) PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_vin_cache_created_at ON vin_cache(created_at);

-- Garages table for multi-location vehicle management
CREATE TABLE IF NOT EXISTS garages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Home Garage", "Sacramento Shop"
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  timezone TEXT DEFAULT 'America/Los_Angeles',
  meta JSONB DEFAULT '{}', -- Store additional garage info
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for garages
ALTER TABLE garages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage garages in their tenant" ON garages
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Index for tenant-based queries
CREATE INDEX IF NOT EXISTS idx_garages_tenant_id ON garages(tenant_id);

-- Add VIN and garage columns to vehicles table
ALTER TABLE vehicles 
  ADD COLUMN IF NOT EXISTS vin VARCHAR(17),
  ADD COLUMN IF NOT EXISTS nickname TEXT,
  ADD COLUMN IF NOT EXISTS garage_id UUID REFERENCES garages(id),
  ADD COLUMN IF NOT EXISTS enrichment JSONB DEFAULT '{}', -- Store NHTSA decode results
  ADD COLUMN IF NOT EXISTS service_intervals JSONB DEFAULT '{}', -- Oil change, tire rotation, etc.
  ADD COLUMN IF NOT EXISTS smart_defaults JSONB DEFAULT '{}'; -- AI-generated defaults

-- Index for VIN lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON vehicles(vin) WHERE vin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_garage_id ON vehicles(garage_id) WHERE garage_id IS NOT NULL;

-- Vehicle onboarding tracking table
CREATE TABLE IF NOT EXISTS vehicle_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vin VARCHAR(17),
  step TEXT NOT NULL, -- 'vin_capture', 'decode', 'garage_select', 'review', 'complete'
  data JSONB DEFAULT '{}',
  time_spent_seconds INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for onboarding tracking
ALTER TABLE vehicle_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can track onboarding in their tenant" ON vehicle_onboarding
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_vehicle_onboarding_tenant_step ON vehicle_onboarding(tenant_id, step);
CREATE INDEX IF NOT EXISTS idx_vehicle_onboarding_created_at ON vehicle_onboarding(created_at);

-- Function to auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_garages_updated_at 
  BEFORE UPDATE ON garages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for development
INSERT INTO tenants (id, name, kind, plan_name) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Demo Fleet Operations', 'org', 'team')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, name) 
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'demo@motomind.ai', 'Demo User')
ON CONFLICT (id) DO NOTHING;

INSERT INTO memberships (tenant_id, user_id, role) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'owner')
ON CONFLICT (tenant_id, user_id) DO NOTHING;

-- Sample garage
INSERT INTO garages (id, tenant_id, name, address, lat, lng, timezone) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440000',
  'Demo Garage',
  '123 Main St, San Francisco, CA 94102',
  37.7749,
  -122.4194,
  'America/Los_Angeles'
) ON CONFLICT (id) DO NOTHING;

-- Update existing demo vehicle to use garage
UPDATE vehicles 
SET 
  garage_id = '550e8400-e29b-41d4-a716-446655440003',
  vin = 'DEMO123456789ABCD',
  nickname = 'Demo Truck #47'
WHERE id = '550e8400-e29b-41d4-a716-446655440002';

-- Comments for documentation
COMMENT ON TABLE vin_cache IS 'Cache NHTSA VIN decode results to avoid repeated API calls';
COMMENT ON TABLE garages IS 'Physical locations where vehicles are stored/operated';
COMMENT ON TABLE vehicle_onboarding IS 'Track user onboarding flow metrics and completion rates';

COMMENT ON COLUMN vehicles.vin IS 'Vehicle Identification Number (17 characters)';
COMMENT ON COLUMN vehicles.nickname IS 'User-friendly name for the vehicle';
COMMENT ON COLUMN vehicles.enrichment IS 'Raw NHTSA decode data, recalls, specifications';
COMMENT ON COLUMN vehicles.service_intervals IS 'Maintenance schedule (oil, tires, brakes)';
COMMENT ON COLUMN vehicles.smart_defaults IS 'AI-generated baseline MPG and maintenance recommendations';
