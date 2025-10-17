-- Migration: Add Geocoding Support
-- Description: Add lat/lng columns for location intelligence
-- Date: 2025-10-03

-- Add geocoding columns to vehicle_events
ALTER TABLE vehicle_events 
ADD COLUMN IF NOT EXISTS geocoded_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS geocoded_lng DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS geocoded_address TEXT;

-- Add index for geographic queries
CREATE INDEX IF NOT EXISTS idx_vehicle_events_geocoded 
ON vehicle_events(geocoded_lat, geocoded_lng) 
WHERE geocoded_lat IS NOT NULL AND geocoded_lng IS NOT NULL;

-- Add comment
COMMENT ON COLUMN vehicle_events.geocoded_lat IS 'Latitude from geocoded address (-90 to 90)';
COMMENT ON COLUMN vehicle_events.geocoded_lng IS 'Longitude from geocoded address (-180 to 180)';
COMMENT ON COLUMN vehicle_events.geocoded_at IS 'Timestamp when address was geocoded';
COMMENT ON COLUMN vehicle_events.geocoded_address IS 'Formatted address returned by geocoding service';
