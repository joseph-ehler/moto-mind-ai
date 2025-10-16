-- Add AI processing columns to vehicle_images table
ALTER TABLE vehicle_images 
ADD COLUMN IF NOT EXISTS ai_category TEXT,
ADD COLUMN IF NOT EXISTS ai_description TEXT,
ADD COLUMN IF NOT EXISTS detected_text JSONB,
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- Add index for filtering by category
CREATE INDEX IF NOT EXISTS idx_vehicle_images_category ON vehicle_images(ai_category) WHERE ai_category IS NOT NULL;

-- Add index for processing status
CREATE INDEX IF NOT EXISTS idx_vehicle_images_processing_status ON vehicle_images(processing_status);

-- Add comments
COMMENT ON COLUMN vehicle_images.ai_category IS 'AI-detected category: exterior, interior, engine, damage, document, other';
COMMENT ON COLUMN vehicle_images.ai_description IS 'AI-generated one-line description of the photo';
COMMENT ON COLUMN vehicle_images.detected_text IS 'Detected text from image (VIN, plate, odometer, etc)';
COMMENT ON COLUMN vehicle_images.processing_status IS 'Status: pending, processing, completed, failed';
COMMENT ON COLUMN vehicle_images.processed_at IS 'Timestamp when AI processing completed';
