-- Fix schema_migrations table to include filename column
-- This ensures our migration tracking works correctly

-- Add filename column if it doesn't exist
ALTER TABLE schema_migrations 
ADD COLUMN IF NOT EXISTS filename TEXT;

-- Backfill filename from existing migrations if possible
-- For now, just ensure the column exists for future migrations
