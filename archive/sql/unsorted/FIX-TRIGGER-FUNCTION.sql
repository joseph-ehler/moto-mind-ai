-- =============================================================================
-- FIX: Update validate_mileage() function to use correct schema reference
-- =============================================================================

-- The trigger function is looking for 'vehicle_events' but the table is 'public.vehicle_events'
-- This causes "relation does not exist" error

-- Drop and recreate the function with correct schema reference
DROP FUNCTION IF EXISTS public.validate_mileage() CASCADE;

CREATE OR REPLACE FUNCTION public.validate_mileage()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate mileage is not decreasing (with rollover allowance)
  IF NEW.miles IS NOT NULL AND NEW.miles < (
    SELECT COALESCE(MAX(miles), 0) 
    FROM public.vehicle_events  -- ← FIXED: Added 'public.' schema prefix
    WHERE vehicle_id = NEW.vehicle_id 
      AND (date < NEW.date OR (date = NEW.date AND created_at < NEW.created_at))
      AND miles IS NOT NULL
  ) THEN
    -- Check if rollover is explicitly allowed
    IF NOT (NEW.payload ? 'allow_rollover' AND (NEW.payload->>'allow_rollover')::boolean = true) THEN
      RAISE EXCEPTION 'Mileage cannot decrease. Current: %, Previous max: %. Set allow_rollover: true if intentional (e.g., odometer rollover).', 
        NEW.miles, 
        (SELECT COALESCE(MAX(miles), 0) FROM public.vehicle_events WHERE vehicle_id = NEW.vehicle_id AND miles IS NOT NULL);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS check_mileage ON public.vehicle_events;
CREATE TRIGGER check_mileage 
  BEFORE INSERT ON public.vehicle_events
  FOR EACH ROW 
  WHEN (NEW.miles IS NOT NULL)
  EXECUTE FUNCTION public.validate_mileage();

-- Test the fix with the same insert that was failing
INSERT INTO public.vehicle_events (
  tenant_id, 
  vehicle_id, 
  type, 
  date, 
  miles, 
  payload,
  notes
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'dfa33260-a922-45d9-a649-3050377a7a62',
  'odometer',
  '2025-09-27',
  125432,
  '{"source": "trigger_fix_test"}',
  'Test event to verify trigger function works'
);

-- Verify it worked
SELECT 
  id,
  type,
  date,
  miles,
  payload->>'source' as source,
  created_at
FROM public.vehicle_events 
WHERE vehicle_id = 'dfa33260-a922-45d9-a649-3050377a7a62'
ORDER BY created_at DESC
LIMIT 5;
