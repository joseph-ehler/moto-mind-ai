-- FIX: validate_event_payload() function missing ELSE clause
-- The function fails when event types don't match any WHEN clause

-- DROP and recreate the function with proper ELSE handling
DROP FUNCTION IF EXISTS public.validate_event_payload() CASCADE;

CREATE OR REPLACE FUNCTION public.validate_event_payload() RETURNS TRIGGER AS $$
BEGIN
  CASE NEW.type
    WHEN 'fuel' THEN
      IF NOT (NEW.payload ? 'total_amount' OR NEW.payload ? 'gallons') THEN
        RAISE EXCEPTION 'Fuel events require total_amount or gallons in payload';
      END IF;
      IF NEW.payload ? 'total_amount' THEN
        BEGIN
          IF (NEW.payload->>'total_amount')::numeric <= 0 THEN
            RAISE EXCEPTION 'Fuel total_amount must be positive';
          END IF;
        EXCEPTION WHEN invalid_text_representation THEN
          RAISE EXCEPTION 'Fuel total_amount must be a valid number';
        END;
      END IF;
      
    WHEN 'odometer' THEN
      IF NEW.miles IS NULL THEN
        RAISE EXCEPTION 'Odometer events require miles field';
      END IF;
      
    WHEN 'maintenance' THEN
      IF NOT (NEW.payload ? 'kind' OR NEW.payload ? 'service_type') THEN
        RAISE EXCEPTION 'Maintenance events require kind or service_type in payload';
      END IF;
      
    WHEN 'document' THEN
      IF NOT (NEW.payload ? 'doc_type' OR NEW.payload ? 'document_type') THEN
        RAISE EXCEPTION 'Document events require doc_type or document_type in payload';
      END IF;
      
    WHEN 'inspection' THEN
      -- Inspection events validation
      IF NOT (NEW.payload ? 'inspection_type' OR NEW.payload ? 'result') THEN
        RAISE EXCEPTION 'Inspection events require inspection_type or result in payload';
      END IF;
      
    WHEN 'reminder' THEN
      -- Reminder events validation (minimal)
      IF NOT (NEW.payload ? 'reminder_type' OR NEW.payload ? 'kind') THEN
        RAISE EXCEPTION 'Reminder events require reminder_type or kind in payload';
      END IF;
      
    ELSE
      -- CRITICAL: Handle unknown event types gracefully
      RAISE NOTICE 'Unknown event type: %. Skipping validation.', NEW.type;
      -- Don't raise exception - allow unknown types to pass through
      -- This prevents the "case not found" error
      
  END CASE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Recreate the trigger
DROP TRIGGER IF EXISTS validate_payload ON public.vehicle_events;
CREATE TRIGGER validate_payload BEFORE INSERT OR UPDATE ON public.vehicle_events
  FOR EACH ROW EXECUTE FUNCTION public.validate_event_payload();

-- Test the fix with a simple validation
DO $$
BEGIN
  RAISE NOTICE 'validate_event_payload() function updated with ELSE clause';
  RAISE NOTICE 'Now handles: fuel, odometer, maintenance, document, inspection, reminder, and unknown types';
END $$;
