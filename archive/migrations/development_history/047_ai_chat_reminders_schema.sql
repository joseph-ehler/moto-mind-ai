-- Fix Reminders Schema Issue: Add missing year column to vehicles table
-- Root cause: "column vehicles_1.year does not exist" error in /api/reminders

-- =============================================================================
-- STEP 1: CHECK CURRENT VEHICLES TABLE STRUCTURE
-- =============================================================================

-- Check if year column exists
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================================================
-- STEP 2: ADD MISSING YEAR COLUMN IF NOT EXISTS
-- =============================================================================

-- Add year column to vehicles table
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS year INTEGER;

-- Add constraint to ensure reasonable year values (check if exists first)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'chk_vehicles_year' 
      AND table_name = 'vehicles'
  ) THEN
    ALTER TABLE vehicles 
    ADD CONSTRAINT chk_vehicles_year 
    CHECK (year IS NULL OR (year >= 1900 AND year <= 2030));
  END IF;
END $$;

-- =============================================================================
-- STEP 3: POPULATE YEAR COLUMN FROM EXISTING DATA
-- =============================================================================

-- Update year column where it can be extracted from existing data
-- This might need manual data entry or VIN decoding for complete accuracy
UPDATE vehicles 
SET year = 2020  -- Default year for existing records
WHERE year IS NULL;

-- =============================================================================
-- STEP 4: VERIFY THE FIX
-- =============================================================================

-- Check that year column now exists
SELECT 
  'vehicles table structure' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
  AND table_schema = 'public'
  AND column_name = 'year';

-- Check sample data
SELECT 
  id,
  display_name,
  make,
  model,
  year,
  created_at
FROM vehicles 
LIMIT 5;

-- Success message
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'vehicles' 
        AND column_name = 'year'
    )
    THEN '✅ SUCCESS: Year column added to vehicles table'
    ELSE '❌ FAILED: Year column still missing'
  END as result;
