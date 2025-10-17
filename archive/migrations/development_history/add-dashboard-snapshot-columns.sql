-- Dashboard Snapshot: Add generated columns and indexes
-- Generated columns for efficient querying of dashboard snapshot data

-- Add generated columns for dashboard snapshot events
ALTER TABLE vehicle_events
  ADD COLUMN IF NOT EXISTS event_summary TEXT GENERATED ALWAYS AS (payload->>'summary') STORED,
  ADD COLUMN IF NOT EXISTS odometer_miles INT GENERATED ALWAYS AS ((payload->'key_facts'->>'odometer_miles')::int) STORED,
  ADD COLUMN IF NOT EXISTS fuel_eighths INT GENERATED ALWAYS AS ((payload->'key_facts'->>'fuel_level_eighths')::int) STORED;

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_events_tenant_type ON vehicle_events(tenant_id, type);
CREATE INDEX IF NOT EXISTS idx_events_tenant_odometer ON vehicle_events(tenant_id, odometer_miles) WHERE odometer_miles IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_summary ON vehicle_events(tenant_id, event_summary) WHERE event_summary IS NOT NULL;

-- Add index for dashboard snapshots specifically
CREATE INDEX IF NOT EXISTS idx_dashboard_snapshots ON vehicle_events(tenant_id, vehicle_id, created_at) WHERE type = 'dashboard_snapshot';

-- Comment for documentation
COMMENT ON COLUMN vehicle_events.event_summary IS 'Generated column: Human-readable summary from payload.summary';
COMMENT ON COLUMN vehicle_events.odometer_miles IS 'Generated column: Odometer reading from dashboard snapshots';
COMMENT ON COLUMN vehicle_events.fuel_eighths IS 'Generated column: Fuel level in eighths (0-8) from dashboard snapshots';
