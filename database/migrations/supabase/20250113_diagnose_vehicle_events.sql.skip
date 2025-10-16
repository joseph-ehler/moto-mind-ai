-- Diagnostic: Check vehicle_events table structure
-- Run this to understand why foreign keys are failing

-- ============================================================================
-- 1. CHECK TABLE EXISTS
-- ============================================================================
SELECT 'vehicle_events table exists' as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'vehicle_events';

-- ============================================================================
-- 2. CHECK ALL CONSTRAINTS ON vehicle_events
-- ============================================================================
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'vehicle_events'::regclass
ORDER BY contype, conname;

-- Constraint types:
-- p = primary key
-- f = foreign key
-- c = check constraint
-- u = unique constraint

-- ============================================================================
-- 3. CHECK COLUMNS IN vehicle_events
-- ============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'vehicle_events'
  AND column_name = 'id';

-- ============================================================================
-- 4. CHECK INDEXES ON vehicle_events.id
-- ============================================================================
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'vehicle_events'
  AND indexdef LIKE '%id%';

-- ============================================================================
-- 5. TRY TO MANUALLY ADD PRIMARY KEY (will show what's wrong)
-- ============================================================================
-- This will either succeed or give us a detailed error
DO $$ 
BEGIN
  BEGIN
    ALTER TABLE vehicle_events ADD CONSTRAINT vehicle_events_pkey PRIMARY KEY (id);
    RAISE NOTICE 'SUCCESS: Primary key added';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAILED: %', SQLERRM;
  END;
END $$;
