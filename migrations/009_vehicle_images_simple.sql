-- MotoMindAI: Vehicle Images Table (Simplified)
-- Support for multiple images per vehicle

-- Create vehicle_images table for storing multiple images per vehicle
CREATE TABLE IF NOT EXISTS vehicle_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  
  -- Image storage and metadata
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  
  -- Image categorization
  image_type TEXT DEFAULT 'general' CHECK (image_type IN (
    'hero', 'front', 'rear', 'side_left', 'side_right', 
    'interior', 'engine', 'odometer', 'damage', 'maintenance', 'general'
  )),
  
  -- Image properties
  width INTEGER,
  height INTEGER,
  is_primary BOOLEAN DEFAULT false,
  
  -- Metadata
  description TEXT,
  tags JSONB DEFAULT '[]',
  taken_at TIMESTAMPTZ,
  
  -- Audit fields
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_images_vehicle_id ON vehicle_images(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_images_tenant_id ON vehicle_images(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_images_type ON vehicle_images(image_type);

-- Enable RLS
ALTER TABLE vehicle_images ENABLE ROW LEVEL SECURITY;
