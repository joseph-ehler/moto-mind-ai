-- ADD COMPUTED COLUMNS TO EXTRACT PAYLOAD DATA FOR UI
-- This will make the timeline UI work by exposing payload data as top-level columns

-- Add computed columns for UI compatibility
ALTER TABLE public.vehicle_events 
ADD COLUMN IF NOT EXISTS vendor TEXT 
  GENERATED ALWAYS AS (payload->>'vendor') STORED;

ALTER TABLE public.vehicle_events 
ADD COLUMN IF NOT EXISTS station TEXT 
  GENERATED ALWAYS AS (payload->>'station') STORED;

ALTER TABLE public.vehicle_events 
ADD COLUMN IF NOT EXISTS gallons DECIMAL(10,2) 
  GENERATED ALWAYS AS (CASE 
    WHEN payload->>'gallons' ~ '^[0-9]+\.?[0-9]*$' 
    THEN (payload->>'gallons')::DECIMAL(10,2) 
    ELSE NULL 
  END) STORED;

ALTER TABLE public.vehicle_events 
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) 
  GENERATED ALWAYS AS (CASE 
    WHEN payload->>'total_amount' ~ '^[0-9]+\.?[0-9]*$' 
    THEN (payload->>'total_amount')::DECIMAL(10,2) 
    ELSE NULL 
  END) STORED;

ALTER TABLE public.vehicle_events 
ADD COLUMN IF NOT EXISTS kind TEXT 
  GENERATED ALWAYS AS (payload->>'kind') STORED;

ALTER TABLE public.vehicle_events 
ADD COLUMN IF NOT EXISTS summary TEXT 
  GENERATED ALWAYS AS (payload->>'summary') STORED;

ALTER TABLE public.vehicle_events 
ADD COLUMN IF NOT EXISTS doc_type TEXT 
  GENERATED ALWAYS AS (COALESCE(payload->>'doc_type', payload->>'document_type')) STORED;

ALTER TABLE public.vehicle_events 
ADD COLUMN IF NOT EXISTS confidence INTEGER 
  GENERATED ALWAYS AS (CASE 
    WHEN payload->>'confidence' ~ '^[0-9]+$' 
    THEN (payload->>'confidence')::INTEGER 
    ELSE NULL 
  END) STORED;

-- Verify the computed columns are working
SELECT 
    type,
    vendor,
    station,
    total_amount,
    gallons,
    kind,
    summary,
    doc_type,
    confidence,
    created_at
FROM public.vehicle_events ve
JOIN public.vehicles v ON ve.vehicle_id = v.id
WHERE v.vin = '1HGBH41JXMN109186'
ORDER BY created_at DESC
LIMIT 10;
