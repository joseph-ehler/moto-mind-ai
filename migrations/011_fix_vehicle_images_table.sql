-- MotoMindAI: Fix Vehicle Images Table Structure
-- Ensure the table has the correct columns

-- Drop and recreate the table to ensure correct structure
DROP TABLE IF EXISTS vehicle_images CASCADE;

-- Create the table with the correct structure
CREATE TABLE vehicle_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  filename TEXT NOT NULL,
  image_type TEXT DEFAULT 'general',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE vehicle_images 
ADD CONSTRAINT fk_vehicle_images_tenant 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE vehicle_images 
ADD CONSTRAINT fk_vehicle_images_vehicle 
FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE;

-- Add indexes
CREATE INDEX idx_vehicle_images_vehicle_id ON vehicle_images(vehicle_id);
CREATE INDEX idx_vehicle_images_tenant_id ON vehicle_images(tenant_id);
CREATE INDEX idx_vehicle_images_type ON vehicle_images(image_type);

-- Enable RLS
ALTER TABLE vehicle_images ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Service role can access all vehicle images" ON vehicle_images
  FOR ALL USING (true);

CREATE POLICY "Allow all access to vehicle images" ON vehicle_images
  FOR ALL USING (true);
