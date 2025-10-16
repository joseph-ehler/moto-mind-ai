-- Migration: Fix vehicle_events Primary Key
-- Description: Change composite PK (id, date) to single column PK (id)
-- Priority: P0 - Run BEFORE event_photos and capture_sessions migrations
-- Issue: Current PK is on (id, date) but foreign keys need unique constraint on just (id)

-- ============================================================================
-- FIX COMPOSITE PRIMARY KEY
-- ============================================================================

-- The current primary key is: PRIMARY KEY (id, date)
-- We need: PRIMARY KEY (id)
-- This requires dropping the existing composite PK and creating a new one

DO $$ 
BEGIN
  -- Step 1: Drop dependent foreign key from vehicle_event_audit_logs
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'vehicle_event_audit_logs_event_id_event_date_fkey'
    AND conrelid = 'vehicle_event_audit_logs'::regclass
  ) THEN
    ALTER TABLE vehicle_event_audit_logs 
      DROP CONSTRAINT vehicle_event_audit_logs_event_id_event_date_fkey;
    RAISE NOTICE 'Dropped foreign key from vehicle_event_audit_logs';
  END IF;
  
  -- Step 2: Drop the existing composite primary key (id, date)
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'vehicle_events_pkey'
    AND conrelid = 'vehicle_events'::regclass
  ) THEN
    ALTER TABLE vehicle_events DROP CONSTRAINT vehicle_events_pkey;
    RAISE NOTICE 'Dropped composite primary key (id, date)';
  END IF;
  
  -- Step 3: Add new primary key on just (id)
  ALTER TABLE vehicle_events ADD CONSTRAINT vehicle_events_pkey PRIMARY KEY (id);
  RAISE NOTICE 'Created new primary key on (id)';
  
  -- Step 4: Recreate foreign key from vehicle_event_audit_logs (only on event_id now)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'vehicle_event_audit_logs'
  ) THEN
    ALTER TABLE vehicle_event_audit_logs 
      ADD CONSTRAINT vehicle_event_audit_logs_event_id_fkey 
      FOREIGN KEY (event_id) 
      REFERENCES vehicle_events(id) 
      ON DELETE CASCADE;
    RAISE NOTICE 'Recreated foreign key from vehicle_event_audit_logs (event_id only)';
  END IF;
  
  -- Step 5: Create index on date for query performance (since we removed it from PK)
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'vehicle_events' 
    AND indexname = 'idx_vehicle_events_date'
  ) THEN
    CREATE INDEX idx_vehicle_events_date ON vehicle_events(date);
    RAISE NOTICE 'Created index on date column';
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error: %', SQLERRM;
  RAISE;
END $$;

-- ============================================================================
-- VERIFY THE FIX
-- ============================================================================

-- Verify single-column primary key exists
DO $$ 
DECLARE
  pk_columns TEXT;
BEGIN
  SELECT string_agg(a.attname, ', ' ORDER BY a.attnum)
  INTO pk_columns
  FROM pg_index i
  JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
  WHERE i.indrelid = 'vehicle_events'::regclass
  AND i.indisprimary;
  
  IF pk_columns = 'id' THEN
    RAISE NOTICE 'SUCCESS: Primary key is now on (id) only';
  ELSE
    RAISE EXCEPTION 'FAILED: Primary key is on (%) instead of (id)', pk_columns;
  END IF;
END $$;
