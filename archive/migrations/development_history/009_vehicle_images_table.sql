-- MotoMindAI: Vehicle Images Table
-- Support for multiple images per vehicle with metadata

-- Create vehicle_images table for storing multiple images per vehicle
CREATE TABLE IF NOT EXISTS vehicle_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  
  -- Image storage and metadata
  storage_path TEXT NOT NULL, -- Path in Supabase storage
  public_url TEXT NOT NULL,   -- Public URL for the image
  filename TEXT NOT NULL,     -- Original filename
  file_size INTEGER,          -- File size in bytes
  mime_type TEXT,             -- MIME type (image/jpeg, image/png, etc.)
  
  -- Image categorization
  image_type TEXT DEFAULT 'general' CHECK (image_type IN (
    'hero',           -- Main vehicle photo (replaces hero_image_url)
    'front',          -- Front view
    'rear',           -- Rear view  
    'side_left',      -- Left side view
    'side_right',     -- Right side view
    'interior',       -- Interior shots
    'engine',         -- Engine bay
    'odometer',       -- Odometer reading
    'damage',         -- Damage documentation
    'maintenance',    -- Maintenance/repair photos
    'general'         -- General/other photos
  )),
  
  -- Image properties
  width INTEGER,              -- Image width in pixels
  height INTEGER,             -- Image height in pixels
  is_primary BOOLEAN DEFAULT false, -- Is this the primary image for its type?
  
  -- Metadata
  description TEXT,           -- User-provided description
  tags JSONB DEFAULT '[]',    -- Searchable tags
  taken_at TIMESTAMPTZ,       -- When the photo was taken (if available)
  location JSONB,             -- GPS coordinates if available
  
  -- Audit fields
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ      -- Soft delete
);

-- Indexes for performance (created after table exists)
CREATE INDEX IF NOT EXISTS idx_vehicle_images_vehicle_id ON vehicle_images(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_images_tenant_id ON vehicle_images(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_images_type ON vehicle_images(image_type);
CREATE INDEX IF NOT EXISTS idx_vehicle_images_primary ON vehicle_images(vehicle_id, image_type, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_vehicle_images_created_at ON vehicle_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_images_deleted_at ON vehicle_images(deleted_at) WHERE deleted_at IS NOT NULL;

-- Ensure only one primary image per type per vehicle
CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicle_images_unique_primary 
ON vehicle_images(vehicle_id, image_type) 
WHERE is_primary = true;

-- Comments for documentation
COMMENT ON TABLE vehicle_images IS 'Multiple images per vehicle with categorization and metadata';
COMMENT ON COLUMN vehicle_images.storage_path IS 'Path in Supabase storage bucket';
COMMENT ON COLUMN vehicle_images.public_url IS 'Public URL for direct image access';
COMMENT ON COLUMN vehicle_images.image_type IS 'Category of image for organization and display';
COMMENT ON COLUMN vehicle_images.is_primary IS 'Whether this is the primary image for its type';
COMMENT ON COLUMN vehicle_images.tags IS 'JSON array of searchable tags';
COMMENT ON COLUMN vehicle_images.location IS 'GPS coordinates where photo was taken';

-- Function to automatically set updated_at
CREATE OR REPLACE FUNCTION update_vehicle_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_vehicle_images_updated_at
  BEFORE UPDATE ON vehicle_images
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_images_updated_at();

-- Migrate existing hero_image_url to vehicle_images table
-- (This will be done after the table is created and indexes are in place)

-- Add RLS (Row Level Security) policies
ALTER TABLE vehicle_images ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see images for vehicles in their tenant
CREATE POLICY "Users can view vehicle images in their tenant" ON vehicle_images
  FOR SELECT USING (
    tenant_id IN (
      SELECT m.tenant_id FROM memberships m 
      WHERE m.user_id = auth.uid()
    )
  );

-- Policy: Users can insert images for vehicles in their tenant
CREATE POLICY "Users can upload vehicle images in their tenant" ON vehicle_images
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT m.tenant_id FROM memberships m 
      WHERE m.user_id = auth.uid()
    )
  );

-- Policy: Users can update images for vehicles in their tenant
CREATE POLICY "Users can update vehicle images in their tenant" ON vehicle_images
  FOR UPDATE USING (
    tenant_id IN (
      SELECT m.tenant_id FROM memberships m 
      WHERE m.user_id = auth.uid()
    )
  );

-- Policy: Users can soft delete images for vehicles in their tenant
CREATE POLICY "Users can delete vehicle images in their tenant" ON vehicle_images
  FOR UPDATE USING (
    tenant_id IN (
      SELECT m.tenant_id FROM memberships m 
      WHERE m.user_id = auth.uid()
    )
  );
