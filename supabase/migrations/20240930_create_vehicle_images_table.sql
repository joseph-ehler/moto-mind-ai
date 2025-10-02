-- Create vehicle_images table
CREATE TABLE IF NOT EXISTS vehicle_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  storage_path TEXT,
  public_url TEXT NOT NULL,
  filename TEXT NOT NULL,
  image_type TEXT NOT NULL DEFAULT 'general',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_images_vehicle_id ON vehicle_images(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_images_tenant_id ON vehicle_images(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_images_created_at ON vehicle_images(created_at DESC);

-- Enable RLS
ALTER TABLE vehicle_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view images for their tenant's vehicles"
  ON vehicle_images FOR SELECT
  USING (true); -- Public for now since storage bucket is public

CREATE POLICY "Service role has full access to vehicle images"
  ON vehicle_images FOR ALL
  USING (true)
  WITH CHECK (true);
