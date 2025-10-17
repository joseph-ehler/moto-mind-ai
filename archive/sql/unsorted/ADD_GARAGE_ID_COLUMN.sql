-- Add missing garage_id column to vehicles table
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS garage_id UUID REFERENCES garages(id);

-- Update existing vehicles to use the default garage
UPDATE vehicles 
SET garage_id = '550e8400-e29b-41d4-a716-446655440001'
WHERE garage_id IS NULL;

-- Verify the column was added
SELECT id, make, model, garage_id FROM vehicles LIMIT 5;
