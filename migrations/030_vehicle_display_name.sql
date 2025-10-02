-- Migration 030: Add display_name and structured identity to vehicles
-- Safe, additive migration with validation and rollback plan

-- Add new columns (backward compatible)
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS year INTEGER;

-- Backfill display_name from existing data
-- Priority: nickname > constructed name from make/model > label
UPDATE vehicles 
SET display_name = COALESCE(
  display_name,
  NULLIF(TRIM(CONCAT_WS(' ', 
    CASE WHEN year IS NOT NULL THEN year::text END,
    make, 
    model
  )), ''),
  label,
  'Unknown Vehicle'
)
WHERE display_name IS NULL;

-- Backfill year from VIN decoding or manual entry (if available)
-- This is a placeholder - in practice you'd extract from existing enrichment data
UPDATE vehicles 
SET year = COALESCE(
  year,
  CASE 
    WHEN enrichment->>'year' IS NOT NULL 
    THEN (enrichment->>'year')::integer
    ELSE NULL
  END
)
WHERE year IS NULL;

-- Add constraints after backfill
ALTER TABLE vehicles 
ALTER COLUMN display_name SET NOT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_display_name ON vehicles(display_name);
CREATE INDEX IF NOT EXISTS idx_vehicles_year ON vehicles(year) WHERE year IS NOT NULL;

-- Add validation constraints
ALTER TABLE vehicles 
ADD CONSTRAINT chk_vehicles_year_range 
CHECK (year IS NULL OR (year >= 1900 AND year <= EXTRACT(YEAR FROM NOW()) + 2));

-- Migration validation queries (run these after deployment)
-- SELECT COUNT(*) FROM vehicles WHERE display_name IS NULL; -- Should be 0
-- SELECT COUNT(*) FROM vehicles WHERE display_name = ''; -- Should be 0
-- SELECT id, display_name, make, model FROM vehicles WHERE display_name = 'Unknown Vehicle' LIMIT 10;

-- Rollback plan (if needed):
-- ALTER TABLE vehicles DROP COLUMN IF EXISTS display_name;
-- ALTER TABLE vehicles DROP COLUMN IF EXISTS year;
-- DROP INDEX IF EXISTS idx_vehicles_display_name;
-- DROP INDEX IF EXISTS idx_vehicles_year;
