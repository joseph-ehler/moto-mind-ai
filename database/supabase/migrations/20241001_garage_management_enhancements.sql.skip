-- Garage Management Enhancements
-- Adds automatic vehicle count tracking and usage timestamps

-- Create function to update garage vehicle count
CREATE OR REPLACE FUNCTION update_garage_vehicle_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update vehicle count for affected garages
  IF TG_OP = 'INSERT' THEN
    -- Vehicle added to garage
    IF NEW.garage_id IS NOT NULL THEN
      UPDATE garages 
      SET vehicle_count = (
        SELECT COUNT(*) FROM vehicles 
        WHERE garage_id = NEW.garage_id
      )
      WHERE id = NEW.garage_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Vehicle moved between garages
    IF OLD.garage_id IS DISTINCT FROM NEW.garage_id THEN
      -- Update old garage count
      IF OLD.garage_id IS NOT NULL THEN
        UPDATE garages 
        SET vehicle_count = (
          SELECT COUNT(*) FROM vehicles 
          WHERE garage_id = OLD.garage_id
        )
        WHERE id = OLD.garage_id;
      END IF;
      
      -- Update new garage count
      IF NEW.garage_id IS NOT NULL THEN
        UPDATE garages 
        SET vehicle_count = (
          SELECT COUNT(*) FROM vehicles 
          WHERE garage_id = NEW.garage_id
        )
        WHERE id = NEW.garage_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Vehicle removed from garage
    IF OLD.garage_id IS NOT NULL THEN
      UPDATE garages 
      SET vehicle_count = (
        SELECT COUNT(*) FROM vehicles 
        WHERE garage_id = OLD.garage_id
      )
      WHERE id = OLD.garage_id;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vehicle count updates
DROP TRIGGER IF EXISTS trigger_update_garage_vehicle_count ON vehicles;
CREATE TRIGGER trigger_update_garage_vehicle_count
  AFTER INSERT OR UPDATE OR DELETE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_garage_vehicle_count();

-- Create function to update garage last_used timestamp
CREATE OR REPLACE FUNCTION update_garage_last_used()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last_used when garage is selected for a vehicle
  IF TG_OP = 'INSERT' AND NEW.garage_id IS NOT NULL THEN
    UPDATE garages 
    SET last_used = NOW()
    WHERE id = NEW.garage_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.garage_id IS NOT NULL AND OLD.garage_id IS DISTINCT FROM NEW.garage_id THEN
    UPDATE garages 
    SET last_used = NOW()
    WHERE id = NEW.garage_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for last_used updates
DROP TRIGGER IF EXISTS trigger_update_garage_last_used ON vehicles;
CREATE TRIGGER trigger_update_garage_last_used
  AFTER INSERT OR UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_garage_last_used();

-- Initialize vehicle_count for existing garages
UPDATE garages 
SET vehicle_count = (
  SELECT COUNT(*) 
  FROM vehicles 
  WHERE vehicles.garage_id = garages.id
)
WHERE vehicle_count IS NULL OR vehicle_count = 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_garages_last_used ON garages(last_used DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_garages_deleted_at ON garages(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_garages_vehicle_count ON garages(vehicle_count DESC);

-- Add soft delete support for garages
CREATE OR REPLACE FUNCTION soft_delete_garage(garage_id UUID)
RETURNS JSON AS $$
DECLARE
  affected_vehicles INTEGER;
  default_garage_id UUID;
  result JSON;
BEGIN
  -- Count vehicles that will be affected
  SELECT COUNT(*) INTO affected_vehicles
  FROM vehicles 
  WHERE garage_id = soft_delete_garage.garage_id;
  
  -- Find or create default garage for orphaned vehicles
  SELECT id INTO default_garage_id
  FROM garages 
  WHERE name = 'Unassigned' 
    AND deleted_at IS NULL
  LIMIT 1;
  
  -- Create default garage if it doesn't exist
  IF default_garage_id IS NULL THEN
    INSERT INTO garages (name, address, is_default)
    VALUES ('Unassigned', 'No specific location', false)
    RETURNING id INTO default_garage_id;
  END IF;
  
  -- Move vehicles to default garage
  UPDATE vehicles 
  SET garage_id = default_garage_id,
      updated_at = NOW()
  WHERE garage_id = soft_delete_garage.garage_id;
  
  -- Soft delete the garage
  UPDATE garages 
  SET deleted_at = NOW(),
      updated_at = NOW()
  WHERE id = soft_delete_garage.garage_id;
  
  -- Return result summary
  SELECT json_build_object(
    'success', true,
    'affected_vehicles', affected_vehicles,
    'moved_to_garage_id', default_garage_id,
    'deleted_at', NOW()
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION soft_delete_garage(UUID) IS 'Safely deletes a garage by moving vehicles to default garage and setting deleted_at timestamp';
COMMENT ON FUNCTION update_garage_vehicle_count() IS 'Automatically maintains vehicle_count field when vehicles are added/removed/moved';
COMMENT ON FUNCTION update_garage_last_used() IS 'Updates last_used timestamp when garage is selected for a vehicle';
