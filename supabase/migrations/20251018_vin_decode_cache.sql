/**
 * VIN Decode Cache & Vehicle Enhancement
 * 
 * Purpose: Store decoded VIN data to avoid redundant API calls
 * Features:
 * - NHTSA API data caching
 * - Mock enrichment data (until real DBs purchased)
 * - AI-generated insights
 * - Vehicle table enhancement
 */

-- ============================================================================
-- VIN DECODE CACHE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS vin_decode_cache (
  -- Primary key
  vin TEXT PRIMARY KEY CHECK (length(vin) = 17),
  
  -- NHTSA decoded data
  year INTEGER NOT NULL CHECK (year >= 1900 AND year <= 2100),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  trim TEXT,
  body_type TEXT,
  engine TEXT,
  transmission TEXT,
  drive_type TEXT,
  fuel_type TEXT,
  
  -- Computed display name
  display_name TEXT NOT NULL, -- e.g., "2019 Honda Civic LX Sedan"
  
  -- Mock enrichment data (until databases purchased in Week 3)
  mock_mpg_city INTEGER CHECK (mock_mpg_city >= 0),
  mock_mpg_highway INTEGER CHECK (mock_mpg_highway >= 0),
  mock_maintenance_interval INTEGER CHECK (mock_maintenance_interval > 0), -- miles
  mock_annual_cost INTEGER CHECK (mock_annual_cost >= 0), -- dollars
  
  -- AI insights (OpenAI generated)
  ai_summary TEXT,
  ai_reliability_score DECIMAL(3,2) CHECK (ai_reliability_score >= 0 AND ai_reliability_score <= 1),
  ai_maintenance_tip TEXT,
  ai_cost_tip TEXT,
  
  -- Metadata
  decoded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'nhtsa',
  raw_data JSONB, -- Full NHTSA API response
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX idx_vin_cache_make_model ON vin_decode_cache(make, model);
CREATE INDEX idx_vin_cache_year ON vin_decode_cache(year);
CREATE INDEX idx_vin_cache_decoded_at ON vin_decode_cache(decoded_at);
CREATE UNIQUE INDEX idx_vin_cache_year_make_model_trim ON vin_decode_cache(year, make, model, COALESCE(trim, ''));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_vin_cache_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vin_cache_updated_at
  BEFORE UPDATE ON vin_decode_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_vin_cache_timestamp();

-- ============================================================================
-- ENHANCE VEHICLES TABLE
-- ============================================================================

-- Add VIN-related columns to vehicles table
ALTER TABLE vehicles 
  ADD COLUMN IF NOT EXISTS vin TEXT CHECK (length(vin) = 17 OR vin IS NULL),
  ADD COLUMN IF NOT EXISTS vin_decoded BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS vin_decode_data JSONB,
  ADD COLUMN IF NOT EXISTS ai_insights JSONB;

-- Index on VIN for fast lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON vehicles(vin) WHERE vin IS NOT NULL;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE vin_decode_cache ENABLE ROW LEVEL SECURITY;

-- Permissive policy (service role bypasses, auth in API)
CREATE POLICY "Allow all operations on vin_decode_cache"
  ON vin_decode_cache FOR ALL
  USING (true) WITH CHECK (true);

COMMENT ON POLICY "Allow all operations on vin_decode_cache" ON vin_decode_cache IS 
  'Permissive - auth handled in API via NextAuth. Service role used for all queries.';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

/**
 * Get or decode VIN
 * Returns cached data if available, otherwise indicates need to decode
 */
CREATE OR REPLACE FUNCTION get_vin_data(p_vin TEXT)
RETURNS TABLE (
  found BOOLEAN,
  data JSONB
) AS $$
BEGIN
  -- Check cache
  RETURN QUERY
  SELECT 
    true AS found,
    jsonb_build_object(
      'vin', vin,
      'vehicle', jsonb_build_object(
        'year', year,
        'make', make,
        'model', model,
        'trim', trim,
        'displayName', display_name
      ),
      'specs', jsonb_build_object(
        'bodyType', body_type,
        'engine', engine,
        'transmission', transmission,
        'driveType', drive_type,
        'fuelType', fuel_type
      ),
      'mockData', jsonb_build_object(
        'mpgCity', mock_mpg_city,
        'mpgHighway', mock_mpg_highway,
        'maintenanceInterval', mock_maintenance_interval,
        'annualCost', mock_annual_cost
      ),
      'aiInsights', jsonb_build_object(
        'summary', ai_summary,
        'reliabilityScore', ai_reliability_score,
        'maintenanceTip', ai_maintenance_tip,
        'costTip', ai_cost_tip
      )
    ) AS data
  FROM vin_decode_cache
  WHERE vin = p_vin;
  
  -- If not found, return false
  IF NOT FOUND THEN
    RETURN QUERY SELECT false AS found, NULL::JSONB AS data;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE vin_decode_cache IS 'Cache for decoded VIN data from NHTSA API + AI insights';
COMMENT ON COLUMN vin_decode_cache.vin IS 'Vehicle Identification Number (17 characters)';
COMMENT ON COLUMN vin_decode_cache.display_name IS 'Human-readable vehicle name for UI display';
COMMENT ON COLUMN vin_decode_cache.mock_mpg_city IS 'Estimated city MPG (mock data until real DB purchased)';
COMMENT ON COLUMN vin_decode_cache.ai_summary IS 'AI-generated 2-sentence summary about vehicle';
COMMENT ON COLUMN vin_decode_cache.ai_reliability_score IS 'AI-predicted reliability score (0.0 to 1.0)';
COMMENT ON COLUMN vin_decode_cache.raw_data IS 'Full NHTSA API response for reference';
