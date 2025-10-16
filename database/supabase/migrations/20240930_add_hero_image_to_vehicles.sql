-- Add hero_image_url column to vehicles table
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS hero_image_url TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_hero_image ON vehicles(hero_image_url) WHERE hero_image_url IS NOT NULL;

-- Add comment
COMMENT ON COLUMN vehicles.hero_image_url IS 'URL to the hero/primary image for this vehicle';
