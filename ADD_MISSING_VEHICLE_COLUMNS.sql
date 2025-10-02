-- Add all missing columns to vehicles table for onboarding API
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS trim TEXT,
ADD COLUMN IF NOT EXISTS license_plate TEXT,
ADD COLUMN IF NOT EXISTS nickname TEXT,
ADD COLUMN IF NOT EXISTS manufacturer_mpg INTEGER,
ADD COLUMN IF NOT EXISTS manufacturer_service_interval_miles INTEGER;

-- Verify all columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
AND table_schema = 'public'
ORDER BY column_name;
