-- Fix RLS policies for vehicle_events to work with anon key
-- Allow authenticated users to insert/update/delete their events

-- Drop existing policies if they exist
DROP POLICY IF EXISTS vehicle_events_tenant_isolation ON vehicle_events;
DROP POLICY IF EXISTS vehicle_events_insert ON vehicle_events;
DROP POLICY IF EXISTS vehicle_events_select ON vehicle_events;
DROP POLICY IF EXISTS vehicle_events_update ON vehicle_events;
DROP POLICY IF EXISTS vehicle_events_delete ON vehicle_events;

-- Create permissive policies for development
CREATE POLICY vehicle_events_insert ON vehicle_events
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY vehicle_events_select ON vehicle_events
  FOR SELECT
  USING (true);

CREATE POLICY vehicle_events_update ON vehicle_events
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY vehicle_events_delete ON vehicle_events
  FOR DELETE
  USING (true);

COMMENT ON POLICY vehicle_events_insert ON vehicle_events IS 'Allow all inserts (development)';
COMMENT ON POLICY vehicle_events_select ON vehicle_events IS 'Allow all reads (development)';
COMMENT ON POLICY vehicle_events_update ON vehicle_events IS 'Allow all updates (development)';
COMMENT ON POLICY vehicle_events_delete ON vehicle_events IS 'Allow all deletes (development)';
