-- Link photos to timeline events
ALTER TABLE vehicle_events
ADD COLUMN IF NOT EXISTS image_id UUID REFERENCES vehicle_images(id) ON DELETE SET NULL;

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_vehicle_events_image ON vehicle_events(image_id) WHERE image_id IS NOT NULL;

-- Add reverse lookup index on images
CREATE INDEX IF NOT EXISTS idx_vehicle_images_vehicle ON vehicle_images(vehicle_id);

-- Add comment
COMMENT ON COLUMN vehicle_events.image_id IS 'Reference to photo that triggered or documents this event';
