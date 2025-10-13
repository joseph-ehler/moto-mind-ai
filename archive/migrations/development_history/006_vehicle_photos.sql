-- Add photo URL field to vehicles table
-- This will store the Supabase Storage URL for user-uploaded vehicle photos

ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Update existing vehicles to have nickname from label if not set
UPDATE vehicles 
SET nickname = label 
WHERE nickname IS NULL OR nickname = '';

-- Add index for faster photo queries
CREATE INDEX IF NOT EXISTS idx_vehicles_photo_url ON vehicles(photo_url) WHERE photo_url IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN vehicles.photo_url IS 'URL to user-uploaded vehicle photo stored in Supabase Storage';
COMMENT ON COLUMN vehicles.nickname IS 'User-friendly name for the vehicle (separate from label)';
