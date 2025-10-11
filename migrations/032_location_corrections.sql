-- Location Corrections Tracking
-- Allows users to correct wrong addresses/coordinates
-- Helps improve geocoding accuracy over time

CREATE TABLE IF NOT EXISTS location_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Source data (what we extracted)
  source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('fuel_receipt', 'service_receipt', 'manual_entry')),
  source_id UUID, -- Reference to fuel_logs, service_records, etc.
  
  extracted_address TEXT,
  extracted_latitude DECIMAL(10, 7),
  extracted_longitude DECIMAL(10, 7),
  extraction_method VARCHAR(50) CHECK (extraction_method IN ('vision_structured', 'vision_ocr', 'geocoding', 'gps', 'manual')),
  extraction_confidence VARCHAR(20) CHECK (extraction_confidence IN ('high', 'medium', 'low', 'none')),
  
  -- Corrected data (what the user confirmed)
  corrected_address TEXT NOT NULL,
  corrected_latitude DECIMAL(10, 7) NOT NULL,
  corrected_longitude DECIMAL(10, 7) NOT NULL,
  correction_method VARCHAR(50) CHECK (correction_method IN ('manual_entry', 'nearby_search', 'map_pin')),
  
  -- Metrics
  correction_distance_km DECIMAL(10, 2), -- Distance between extracted and corrected coords
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT valid_extracted_latitude CHECK (extracted_latitude IS NULL OR (extracted_latitude >= -90 AND extracted_latitude <= 90)),
  CONSTRAINT valid_extracted_longitude CHECK (extracted_longitude IS NULL OR (extracted_longitude >= -180 AND extracted_longitude <= 180)),
  CONSTRAINT valid_corrected_latitude CHECK (corrected_latitude >= -90 AND corrected_latitude <= 90),
  CONSTRAINT valid_corrected_longitude CHECK (corrected_longitude >= -180 AND corrected_longitude <= 180)
);

-- Indexes for performance
CREATE INDEX idx_location_corrections_user_id ON location_corrections(user_id);
CREATE INDEX idx_location_corrections_source ON location_corrections(source_type, source_id);
CREATE INDEX idx_location_corrections_created_at ON location_corrections(created_at DESC);
CREATE INDEX idx_location_corrections_extraction_method ON location_corrections(extraction_method);

-- RLS Policies
ALTER TABLE location_corrections ENABLE ROW LEVEL SECURITY;

-- Users can only see their own corrections
CREATE POLICY location_corrections_select_own 
  ON location_corrections 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can only insert their own corrections
CREATE POLICY location_corrections_insert_own 
  ON location_corrections 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own corrections
CREATE POLICY location_corrections_update_own 
  ON location_corrections 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own corrections
CREATE POLICY location_corrections_delete_own 
  ON location_corrections 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger to calculate distance on insert/update
CREATE OR REPLACE FUNCTION calculate_correction_distance()
RETURNS TRIGGER AS $$
BEGIN
  -- Only calculate if both extracted and corrected coordinates exist
  IF NEW.extracted_latitude IS NOT NULL 
     AND NEW.extracted_longitude IS NOT NULL 
     AND NEW.corrected_latitude IS NOT NULL 
     AND NEW.corrected_longitude IS NOT NULL THEN
    
    -- Haversine formula for distance calculation
    NEW.correction_distance_km := (
      6371 * acos(
        cos(radians(NEW.extracted_latitude)) 
        * cos(radians(NEW.corrected_latitude)) 
        * cos(radians(NEW.corrected_longitude) - radians(NEW.extracted_longitude)) 
        + sin(radians(NEW.extracted_latitude)) 
        * sin(radians(NEW.corrected_latitude))
      )
    );
  ELSE
    NEW.correction_distance_km := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER location_corrections_calculate_distance
  BEFORE INSERT OR UPDATE ON location_corrections
  FOR EACH ROW
  EXECUTE FUNCTION calculate_correction_distance();

-- Analytics view for tracking correction patterns
CREATE OR REPLACE VIEW location_correction_stats AS
SELECT 
  extraction_method,
  extraction_confidence,
  COUNT(*) as correction_count,
  AVG(correction_distance_km) as avg_distance_km,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY correction_distance_km) as median_distance_km,
  MIN(correction_distance_km) as min_distance_km,
  MAX(correction_distance_km) as max_distance_km
FROM location_corrections
WHERE correction_distance_km IS NOT NULL
GROUP BY extraction_method, extraction_confidence
ORDER BY correction_count DESC;

COMMENT ON TABLE location_corrections IS 'User corrections to improve location accuracy';
COMMENT ON COLUMN location_corrections.correction_distance_km IS 'Calculated distance between extracted and corrected coordinates (km)';
