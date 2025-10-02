-- Migration: Add keyset pagination index for vehicle_events
-- This index supports efficient cursor-based pagination and filtering

-- Add composite index for keyset pagination
-- Supports queries: WHERE tenant_id = ? AND vehicle_id = ? ORDER BY date DESC, id DESC
CREATE INDEX IF NOT EXISTS idx_events_tenant_vehicle_date_id
  ON vehicle_events (tenant_id, vehicle_id, date DESC, id DESC)
  WHERE deleted_at IS NULL;

-- Add index for type filtering
-- Supports queries: WHERE vehicle_id = ? AND type IN (?)
CREATE INDEX IF NOT EXISTS idx_events_vehicle_type
  ON vehicle_events (vehicle_id, type)
  WHERE deleted_at IS NULL;

-- Comments for documentation
COMMENT ON INDEX idx_events_tenant_vehicle_date_id IS 
  'Keyset pagination index for vehicle events. Supports efficient cursor-based queries with date DESC, id DESC ordering.';
  
COMMENT ON INDEX idx_events_vehicle_type IS 
  'Type filter index for vehicle events. Supports efficient filtering by event type.';
