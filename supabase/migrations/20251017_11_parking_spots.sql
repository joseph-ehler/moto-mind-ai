-- ================================================
-- Parking Spots Table
-- ================================================
-- Stores user parking locations with geocoding
-- Automatically remembers where user parked their car
-- Created: 2025-10-17

-- ================================================
-- TABLE: parking_spots
-- ================================================

CREATE TABLE IF NOT EXISTS parking_spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES tracking_sessions(id) ON DELETE SET NULL,
  
  -- Location data
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  accuracy NUMERIC(8, 2),
  address TEXT,
  place_name TEXT,
  
  -- User metadata
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  photo_url TEXT,
  notes TEXT,
  floor TEXT,
  section TEXT,
  spot_number TEXT,
  
  -- State
  is_active BOOLEAN DEFAULT TRUE,
  retrieved_at TIMESTAMPTZ,
  
  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_latitude CHECK (latitude >= -90 AND latitude <= 90),
  CONSTRAINT valid_longitude CHECK (longitude >= -180 AND longitude <= 180),
  CONSTRAINT valid_accuracy CHECK (accuracy IS NULL OR accuracy > 0)
);

-- ================================================
-- INDEXES
-- ================================================

CREATE INDEX idx_parking_spots_user_id ON parking_spots(user_id);
CREATE INDEX idx_parking_spots_timestamp ON parking_spots(timestamp DESC);
CREATE INDEX idx_parking_spots_session_id ON parking_spots(session_id);
CREATE INDEX idx_parking_spots_active ON parking_spots(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_parking_spots_user_active ON parking_spots(user_id, is_active) WHERE is_active = TRUE;

-- Spatial index for nearby parking spot queries
CREATE INDEX idx_parking_spots_location ON parking_spots USING btree (latitude, longitude);

-- ================================================
-- ROW LEVEL SECURITY
-- ================================================

ALTER TABLE parking_spots ENABLE ROW LEVEL SECURITY;

-- Users can view their own parking spots
CREATE POLICY "Users can view their own parking spots"
  ON parking_spots FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own parking spots
CREATE POLICY "Users can create their own parking spots"
  ON parking_spots FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own parking spots
CREATE POLICY "Users can update their own parking spots"
  ON parking_spots FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own parking spots
CREATE POLICY "Users can delete their own parking spots"
  ON parking_spots FOR DELETE
  USING (user_id = auth.uid());

-- ================================================
-- TRIGGERS
-- ================================================

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_parking_spots_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_parking_spots_updated_at
  BEFORE UPDATE ON parking_spots
  FOR EACH ROW
  EXECUTE FUNCTION update_parking_spots_timestamp();

-- Auto-deactivate old parking spots when new one is created
CREATE OR REPLACE FUNCTION deactivate_old_parking_spots()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark all other active parking spots for this user as inactive
  UPDATE parking_spots
  SET is_active = FALSE
  WHERE user_id = NEW.user_id
    AND id != NEW.id
    AND is_active = TRUE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deactivate_old_parking_spots
  AFTER INSERT ON parking_spots
  FOR EACH ROW
  EXECUTE FUNCTION deactivate_old_parking_spots();

-- ================================================
-- HELPER FUNCTIONS
-- ================================================

-- Get active parking spot for user
CREATE OR REPLACE FUNCTION get_active_parking_spot(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  latitude NUMERIC,
  longitude NUMERIC,
  address TEXT,
  place_name TEXT,
  "timestamp" TIMESTAMPTZ,
  notes TEXT,
  floor TEXT,
  section TEXT,
  spot_number TEXT,
  photo_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.id,
    ps.latitude,
    ps.longitude,
    ps.address,
    ps.place_name,
    ps.timestamp,
    ps.notes,
    ps.floor,
    ps.section,
    ps.spot_number,
    ps.photo_url
  FROM parking_spots ps
  WHERE ps.user_id = p_user_id
    AND ps.is_active = TRUE
  ORDER BY ps.timestamp DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate distance between two points (Haversine formula)
-- Returns distance in meters
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 NUMERIC,
  lon1 NUMERIC,
  lat2 NUMERIC,
  lon2 NUMERIC
)
RETURNS NUMERIC AS $$
DECLARE
  r NUMERIC := 6371000; -- Earth's radius in meters
  phi1 NUMERIC;
  phi2 NUMERIC;
  delta_phi NUMERIC;
  delta_lambda NUMERIC;
  a NUMERIC;
  c NUMERIC;
BEGIN
  phi1 := radians(lat1);
  phi2 := radians(lat2);
  delta_phi := radians(lat2 - lat1);
  delta_lambda := radians(lon2 - lon1);
  
  a := sin(delta_phi / 2) ^ 2 + 
       cos(phi1) * cos(phi2) * 
       sin(delta_lambda / 2) ^ 2;
  
  c := 2 * atan2(sqrt(a), sqrt(1 - a));
  
  RETURN r * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ================================================
-- COMMENTS
-- ================================================

COMMENT ON TABLE parking_spots IS 'User parking locations with automatic geocoding and retrieval';
COMMENT ON COLUMN parking_spots.latitude IS 'Parking latitude (8 decimal places = ~1mm accuracy)';
COMMENT ON COLUMN parking_spots.longitude IS 'Parking longitude (8 decimal places)';
COMMENT ON COLUMN parking_spots.accuracy IS 'GPS accuracy in meters';
COMMENT ON COLUMN parking_spots.address IS 'Reverse-geocoded street address';
COMMENT ON COLUMN parking_spots.place_name IS 'Business/place name if available (e.g., "Walmart Parking Lot")';
COMMENT ON COLUMN parking_spots.is_active IS 'Only one active parking spot per user at a time';
COMMENT ON COLUMN parking_spots.retrieved_at IS 'When user retrieved their car (found parking spot)';
COMMENT ON COLUMN parking_spots.floor IS 'Parking garage floor (e.g., "Level 3")';
COMMENT ON COLUMN parking_spots.section IS 'Parking section (e.g., "Section A")';
COMMENT ON COLUMN parking_spots.spot_number IS 'Specific spot number (e.g., "A-15")';

-- ================================================
-- GRANTS
-- ================================================

-- Grant execute on helper functions to authenticated users
GRANT EXECUTE ON FUNCTION get_active_parking_spot(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_distance(NUMERIC, NUMERIC, NUMERIC, NUMERIC) TO authenticated;
