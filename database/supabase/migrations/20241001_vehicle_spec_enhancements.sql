-- Vehicle Specification Enhancement System
-- Tracks progressive background enhancement of vehicle specs using NHTSA + AI

CREATE TABLE IF NOT EXISTS vehicle_spec_enhancements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('engine', 'drivetrain', 'dimensions', 'fuel_economy', 'safety', 'features')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  data JSONB,
  sources TEXT[], -- ['nhtsa', 'openai_search', 'user_override']
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  processing_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vehicle_id, category)
);

-- Index for efficient status queries
CREATE INDEX IF NOT EXISTS idx_vehicle_spec_status 
  ON vehicle_spec_enhancements(vehicle_id, status);

-- Index for polling queries
CREATE INDEX IF NOT EXISTS idx_vehicle_spec_pending 
  ON vehicle_spec_enhancements(status) 
  WHERE status IN ('pending', 'processing');

-- Add spec enhancement status to vehicles table
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS specs_enhancement_status TEXT DEFAULT 'pending' 
  CHECK (specs_enhancement_status IN ('pending', 'processing', 'completed', 'partial', 'failed')),
ADD COLUMN IF NOT EXISTS specs_last_enhanced TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS specs_categories_completed INTEGER DEFAULT 0;

-- NOTE: Vehicle status is updated manually by the background job after all categories complete
-- This avoids race conditions from simultaneous category updates triggering multiple vehicle updates

-- Add comments for documentation
COMMENT ON TABLE vehicle_spec_enhancements IS 'Tracks progressive background enhancement of vehicle specifications using NHTSA API and AI web search';
COMMENT ON COLUMN vehicle_spec_enhancements.category IS 'Specification category being enhanced (engine, drivetrain, dimensions, fuel_economy, safety, features)';
COMMENT ON COLUMN vehicle_spec_enhancements.status IS 'Processing status: pending → processing → completed/failed';
COMMENT ON COLUMN vehicle_spec_enhancements.data IS 'Enhanced specification data for this category';
COMMENT ON COLUMN vehicle_spec_enhancements.sources IS 'Data sources used: nhtsa, openai_search, user_override';
COMMENT ON COLUMN vehicle_spec_enhancements.confidence IS 'Confidence level based on source agreement: high (2+ sources agree), medium (1 source), low (conflicting data)';
