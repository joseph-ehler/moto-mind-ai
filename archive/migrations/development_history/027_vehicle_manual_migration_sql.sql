-- Manual Migration SQL - Run this in Supabase SQL Editor
-- This adds the display_name column and populates it from existing data

-- Step 1: Add display_name column to vehicles table
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Step 2: Add year column for structured identity
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS year INTEGER;

-- Step 3: Backfill display_name from existing label field
UPDATE vehicles 
SET display_name = COALESCE(
  display_name,
  label,
  CONCAT_WS(' ', make, model),
  'Unknown Vehicle'
)
WHERE display_name IS NULL;

-- Step 4: Backfill year from enrichment data if available
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

-- Step 5: Make display_name required
ALTER TABLE vehicles 
ALTER COLUMN display_name SET NOT NULL;

-- Step 6: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_display_name ON vehicles(display_name);
CREATE INDEX IF NOT EXISTS idx_vehicles_year ON vehicles(year) WHERE year IS NOT NULL;

-- Step 7: Add validation constraint for year
ALTER TABLE vehicles 
ADD CONSTRAINT chk_vehicles_year_range 
CHECK (year IS NULL OR (year >= 1900 AND year <= EXTRACT(YEAR FROM NOW()) + 2));

-- Step 8: Fix schema_migrations table
ALTER TABLE schema_migrations 
ADD COLUMN IF NOT EXISTS filename TEXT;

-- Verification queries (run these to check results):
-- SELECT COUNT(*) FROM vehicles WHERE display_name IS NULL; -- Should be 0
-- SELECT id, display_name, label, make, model FROM vehicles LIMIT 10;
-- SELECT COUNT(*) FROM vehicles WHERE display_name = 'Unknown Vehicle';

-- If you need to rollback:
-- ALTER TABLE vehicles DROP COLUMN IF EXISTS display_name;
-- ALTER TABLE vehicles DROP COLUMN IF EXISTS year;
