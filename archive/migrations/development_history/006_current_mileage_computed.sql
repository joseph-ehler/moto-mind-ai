-- Migration: Current Mileage Auto-Computation
-- Add override field and trigger to keep current_mileage in sync

-- 1. Add mileage-related columns
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS current_mileage INTEGER,
ADD COLUMN IF NOT EXISTS current_mileage_override INTEGER,
ADD COLUMN IF NOT EXISTS mileage_last_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS mileage_computed_from TEXT; -- 'event', 'override', 'manual'

-- 2. Add comment
COMMENT ON COLUMN vehicles.current_mileage_override IS 'Manual override for current mileage (e.g., after odometer replacement). Takes precedence over computed value.';

-- 3. Function to compute current mileage from latest event
CREATE OR REPLACE FUNCTION compute_vehicle_current_mileage(p_vehicle_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_latest_mileage INTEGER;
BEGIN
  -- Find the most recent event with mileage, sorted by event DATE (not insert order)
  SELECT miles INTO v_latest_mileage
  FROM vehicle_events
  WHERE vehicle_id = p_vehicle_id
    AND miles IS NOT NULL
    AND miles > 0
  ORDER BY date DESC, created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(v_latest_mileage, 0);
END;
$$;

-- 4. Function to update vehicle's current_mileage
CREATE OR REPLACE FUNCTION update_vehicle_current_mileage()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_vehicle_id UUID;
  v_computed_mileage INTEGER;
  v_override_mileage INTEGER;
  v_final_mileage INTEGER;
  v_source TEXT;
BEGIN
  -- Skip if miles column not involved (optimization)
  IF TG_OP = 'UPDATE' THEN
    IF (NEW.miles IS NOT DISTINCT FROM OLD.miles) AND (NEW.date IS NOT DISTINCT FROM OLD.date) THEN
      RETURN NULL; -- No change to miles or date, skip processing
    END IF;
  END IF;
  
  IF TG_OP = 'INSERT' AND NEW.miles IS NULL THEN
    RETURN NULL; -- No miles in new record, skip
  END IF;
  
  IF TG_OP = 'DELETE' AND OLD.miles IS NULL THEN
    RETURN NULL; -- Deleted record had no miles, skip
  END IF;
  
  -- Determine which vehicle to update
  IF TG_OP = 'DELETE' THEN
    v_vehicle_id := OLD.vehicle_id;
  ELSE
    v_vehicle_id := NEW.vehicle_id;
  END IF;
  
  -- Get override value if exists
  SELECT current_mileage_override INTO v_override_mileage
  FROM vehicles
  WHERE id = v_vehicle_id;
  
  -- Compute from events
  v_computed_mileage := compute_vehicle_current_mileage(v_vehicle_id);
  
  -- Determine final value (override takes precedence)
  IF v_override_mileage IS NOT NULL THEN
    v_final_mileage := v_override_mileage;
    v_source := 'override';
  ELSE
    v_final_mileage := v_computed_mileage;
    v_source := 'event';
  END IF;
  
  -- Update vehicle
  UPDATE vehicles
  SET 
    current_mileage = v_final_mileage,
    mileage_last_updated_at = NOW(),
    mileage_computed_from = v_source
  WHERE id = v_vehicle_id;
  
  -- Log significant changes (optional - uncomment if you want audit trail)
  -- RAISE NOTICE 'Updated vehicle % mileage to % (source: %)', v_vehicle_id, v_final_mileage, v_source;
  
  RETURN NULL; -- For AFTER trigger
END;
$$;

-- 5. Create trigger on vehicle_events table
DROP TRIGGER IF EXISTS trigger_update_vehicle_mileage ON vehicle_events;

CREATE TRIGGER trigger_update_vehicle_mileage
AFTER INSERT OR UPDATE OR DELETE ON vehicle_events
FOR EACH ROW
EXECUTE FUNCTION update_vehicle_current_mileage();

-- 6. Backfill current_mileage for existing vehicles
DO $$
DECLARE
  v_vehicle RECORD;
  v_computed_mileage INTEGER;
BEGIN
  FOR v_vehicle IN 
    SELECT id FROM vehicles WHERE current_mileage IS NULL OR current_mileage = 0
  LOOP
    v_computed_mileage := compute_vehicle_current_mileage(v_vehicle.id);
    
    UPDATE vehicles
    SET 
      current_mileage = v_computed_mileage,
      mileage_last_updated_at = NOW(),
      mileage_computed_from = 'event'
    WHERE id = v_vehicle.id;
    
    RAISE NOTICE 'Backfilled vehicle % with mileage %', v_vehicle.id, v_computed_mileage;
  END LOOP;
END $$;

-- 7. Create index for performance
CREATE INDEX IF NOT EXISTS idx_vehicle_events_vehicle_date_miles 
ON vehicle_events(vehicle_id, date DESC, miles) 
WHERE miles IS NOT NULL AND miles > 0;

-- 8. Add constraint to prevent negative mileage
ALTER TABLE vehicles
ADD CONSTRAINT chk_current_mileage_positive 
CHECK (current_mileage IS NULL OR current_mileage >= 0);

ALTER TABLE vehicles
ADD CONSTRAINT chk_current_mileage_override_positive 
CHECK (current_mileage_override IS NULL OR current_mileage_override >= 0);
