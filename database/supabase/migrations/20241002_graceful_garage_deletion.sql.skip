-- Migration: Graceful Garage Deletion Strategy
-- Created: 2025-10-02
-- Purpose: Handle garage deletion with proper vehicle reassignment and user notification

-- Add soft delete column to garages if not exists
ALTER TABLE garages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create function to handle graceful garage deletion
CREATE OR REPLACE FUNCTION graceful_delete_garage(
  garage_id_to_delete UUID,
  reassign_to_garage_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  vehicle_count INTEGER;
  default_garage_id UUID;
  result JSONB;
BEGIN
  -- Check if garage exists and is not already deleted
  IF NOT EXISTS (SELECT 1 FROM garages WHERE id = garage_id_to_delete AND deleted_at IS NULL) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Garage not found or already deleted'
    );
  END IF;

  -- Count vehicles in this garage
  SELECT COUNT(*) INTO vehicle_count 
  FROM vehicles 
  WHERE garage_id = garage_id_to_delete AND deleted_at IS NULL;

  -- If no vehicles, simple soft delete
  IF vehicle_count = 0 THEN
    UPDATE garages 
    SET deleted_at = NOW() 
    WHERE id = garage_id_to_delete;
    
    RETURN jsonb_build_object(
      'success', true,
      'vehicles_moved', 0,
      'target_garage', NULL,
      'message', 'Garage deleted successfully (no vehicles affected)'
    );
  END IF;

  -- Determine target garage for reassignment
  IF reassign_to_garage_id IS NOT NULL THEN
    -- Use provided garage
    IF NOT EXISTS (SELECT 1 FROM garages WHERE id = reassign_to_garage_id AND deleted_at IS NULL) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Target garage for reassignment not found'
      );
    END IF;
    default_garage_id := reassign_to_garage_id;
  ELSE
    -- Find user's default garage (excluding the one being deleted)
    SELECT id INTO default_garage_id 
    FROM garages 
    WHERE tenant_id = (SELECT tenant_id FROM garages WHERE id = garage_id_to_delete)
      AND id != garage_id_to_delete
      AND deleted_at IS NULL
      AND is_default = true
    LIMIT 1;
    
    -- If no default garage, find any other garage
    IF default_garage_id IS NULL THEN
      SELECT id INTO default_garage_id 
      FROM garages 
      WHERE tenant_id = (SELECT tenant_id FROM garages WHERE id = garage_id_to_delete)
        AND id != garage_id_to_delete
        AND deleted_at IS NULL
      ORDER BY created_at ASC
      LIMIT 1;
    END IF;
  END IF;

  -- If we have a target garage, reassign vehicles
  IF default_garage_id IS NOT NULL THEN
    UPDATE vehicles 
    SET garage_id = default_garage_id,
        updated_at = NOW()
    WHERE garage_id = garage_id_to_delete AND deleted_at IS NULL;
    
    -- Soft delete the garage
    UPDATE garages 
    SET deleted_at = NOW() 
    WHERE id = garage_id_to_delete;
    
    RETURN jsonb_build_object(
      'success', true,
      'vehicles_moved', vehicle_count,
      'target_garage_id', default_garage_id,
      'target_garage_name', (SELECT name FROM garages WHERE id = default_garage_id),
      'message', format('%s vehicles moved to %s', vehicle_count, (SELECT name FROM garages WHERE id = default_garage_id))
    );
  ELSE
    -- No other garage available, set vehicles to NULL garage_id
    UPDATE vehicles 
    SET garage_id = NULL,
        updated_at = NOW()
    WHERE garage_id = garage_id_to_delete AND deleted_at IS NULL;
    
    -- Soft delete the garage
    UPDATE garages 
    SET deleted_at = NOW() 
    WHERE id = garage_id_to_delete;
    
    RETURN jsonb_build_object(
      'success', true,
      'vehicles_moved', vehicle_count,
      'target_garage_id', NULL,
      'target_garage_name', 'Unassigned',
      'message', format('%s vehicles moved to Unassigned (no other garages available)', vehicle_count)
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to restore deleted garage (undo within 30 days)
CREATE OR REPLACE FUNCTION restore_deleted_garage(garage_id_to_restore UUID) 
RETURNS JSONB AS $$
DECLARE
  garage_deleted_at TIMESTAMPTZ;
  result JSONB;
BEGIN
  -- Check if garage exists and is deleted
  SELECT deleted_at INTO garage_deleted_at 
  FROM garages 
  WHERE id = garage_id_to_restore;
  
  IF garage_deleted_at IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Garage is not deleted or does not exist'
    );
  END IF;
  
  -- Check if deletion was within 30 days
  IF garage_deleted_at < NOW() - INTERVAL '30 days' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Garage was deleted more than 30 days ago and cannot be restored'
    );
  END IF;
  
  -- Restore the garage
  UPDATE garages 
  SET deleted_at = NULL 
  WHERE id = garage_id_to_restore;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Garage restored successfully'
  );
END;
$$ LANGUAGE plpgsql;

-- Create function for permanent deletion (after 30 days)
CREATE OR REPLACE FUNCTION permanent_delete_old_garages() 
RETURNS JSONB AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Permanently delete garages that were soft-deleted more than 30 days ago
  WITH deleted_garages AS (
    DELETE FROM garages 
    WHERE deleted_at IS NOT NULL 
      AND deleted_at < NOW() - INTERVAL '30 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted_garages;
  
  RETURN jsonb_build_object(
    'success', true,
    'permanently_deleted', deleted_count,
    'message', format('%s garages permanently deleted', deleted_count)
  );
END;
$$ LANGUAGE plpgsql;

-- Add index for soft-deleted garages
CREATE INDEX IF NOT EXISTS idx_garages_deleted_at ON garages(deleted_at) WHERE deleted_at IS NOT NULL;

-- Add index for garage tenant lookups (for finding alternative garages)
CREATE INDEX IF NOT EXISTS idx_garages_tenant_active ON garages(tenant_id, deleted_at) WHERE deleted_at IS NULL;

-- Update existing queries to exclude soft-deleted garages
-- Note: This should be handled in application code, but we can create a view for convenience
CREATE OR REPLACE VIEW active_garages AS
SELECT * FROM garages WHERE deleted_at IS NULL;

-- Add comments for documentation
COMMENT ON FUNCTION graceful_delete_garage IS 'Safely deletes a garage by reassigning vehicles to another garage or unassigned status';
COMMENT ON FUNCTION restore_deleted_garage IS 'Restores a soft-deleted garage within 30 days of deletion';
COMMENT ON FUNCTION permanent_delete_old_garages IS 'Permanently removes garages that were soft-deleted more than 30 days ago';
COMMENT ON COLUMN garages.deleted_at IS 'Soft delete timestamp - NULL means active, timestamp means deleted';
