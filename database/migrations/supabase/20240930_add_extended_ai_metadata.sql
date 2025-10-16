-- Add extended AI metadata columns to vehicle_images table
ALTER TABLE vehicle_images 
ADD COLUMN IF NOT EXISTS vehicle_details JSONB,
ADD COLUMN IF NOT EXISTS vehicle_match JSONB,
ADD COLUMN IF NOT EXISTS condition_data JSONB,
ADD COLUMN IF NOT EXISTS parts_visible TEXT[],
ADD COLUMN IF NOT EXISTS maintenance_indicators JSONB,
ADD COLUMN IF NOT EXISTS suggested_actions TEXT[];

-- Add indexes for querying
CREATE INDEX IF NOT EXISTS idx_vehicle_images_damage ON vehicle_images((condition_data->>'damage_detected')) WHERE condition_data IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicle_images_parts ON vehicle_images USING gin(parts_visible) WHERE parts_visible IS NOT NULL;

-- Add index for vehicle mismatches
CREATE INDEX IF NOT EXISTS idx_vehicle_images_mismatch ON vehicle_images((vehicle_match->>'matches_expected')) WHERE vehicle_match IS NOT NULL;

-- Add comments
COMMENT ON COLUMN vehicle_images.vehicle_details IS 'AI-detected vehicle details: make, model, color, year_range';
COMMENT ON COLUMN vehicle_images.vehicle_match IS 'Vehicle matching validation: matches_expected, confidence, notes';
COMMENT ON COLUMN vehicle_images.condition_data IS 'Condition assessment: damage, wear, notes';
COMMENT ON COLUMN vehicle_images.parts_visible IS 'Array of visible vehicle parts';
COMMENT ON COLUMN vehicle_images.maintenance_indicators IS 'Warning lights, fluid levels, tire condition';
COMMENT ON COLUMN vehicle_images.suggested_actions IS 'User-facing action items based on image analysis';
