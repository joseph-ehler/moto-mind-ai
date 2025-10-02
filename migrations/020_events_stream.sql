-- MotoMind: Unified Vehicle Events Stream
-- Single source of truth for odometer, maintenance, fuel, and documents
-- Eliminates 3 separate mileage tracking systems

-- Main events table (append-only)
CREATE TABLE IF NOT EXISTS vehicle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('odometer','maintenance','fuel','document')) NOT NULL,
  date DATE NOT NULL,
  miles INTEGER,                -- required for odometer/maintenance/fuel
  payload JSONB NOT NULL,       -- typed event data
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- View for current mileage (latest miles by date, then created_at)
CREATE OR REPLACE VIEW vehicle_current_mileage AS
SELECT DISTINCT ON (vehicle_id)
  vehicle_id, 
  miles, 
  date, 
  created_at
FROM vehicle_events
WHERE type IN ('odometer','maintenance','fuel') 
  AND miles IS NOT NULL
ORDER BY vehicle_id, date DESC, created_at DESC;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_vehicle_type_date
  ON vehicle_events(vehicle_id, type, date DESC);

CREATE INDEX IF NOT EXISTS idx_events_vehicle_miles
  ON vehicle_events(vehicle_id, miles) 
  WHERE miles IS NOT NULL;

-- Comments for documentation
COMMENT ON TABLE vehicle_events IS 'Unified event stream for all vehicle activities';
COMMENT ON COLUMN vehicle_events.type IS 'Event type: odometer, maintenance, fuel, or document';
COMMENT ON COLUMN vehicle_events.miles IS 'Odometer reading at time of event (required for odometer/maintenance/fuel)';
COMMENT ON COLUMN vehicle_events.payload IS 'Event-specific data: maintenance details, fuel info, document metadata';
COMMENT ON VIEW vehicle_current_mileage IS 'Latest mileage reading per vehicle from event stream';
