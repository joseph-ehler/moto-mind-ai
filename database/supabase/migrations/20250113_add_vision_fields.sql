-- Add vision processing fields to vehicle_events table
-- These fields track AI-extracted data and confidence scores

-- Add is_manual_entry column (boolean to track if user entered manually vs AI extracted)
ALTER TABLE vehicle_events
ADD COLUMN IF NOT EXISTS is_manual_entry BOOLEAN DEFAULT true;

-- Add ocr_confidence column (0-100 score from vision AI)
ALTER TABLE vehicle_events
ADD COLUMN IF NOT EXISTS ocr_confidence INTEGER;

-- Add comment explaining these fields
COMMENT ON COLUMN vehicle_events.is_manual_entry IS 'False if data was extracted via vision AI, true if user entered manually';
COMMENT ON COLUMN vehicle_events.ocr_confidence IS 'Overall OCR confidence score (0-100) from vision processing';

-- Create index for querying AI-extracted events
CREATE INDEX IF NOT EXISTS idx_vehicle_events_is_manual_entry 
ON vehicle_events(is_manual_entry);

-- Create index for querying by confidence
CREATE INDEX IF NOT EXISTS idx_vehicle_events_ocr_confidence 
ON vehicle_events(ocr_confidence);
