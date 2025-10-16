-- Add edit_changes column to track what actually changed in each edit
-- This will store a JSON object with before/after values for each field

ALTER TABLE public.vehicle_events 
ADD COLUMN edit_changes JSONB NULL;

-- Add a comment explaining the structure
COMMENT ON COLUMN public.vehicle_events.edit_changes IS 'JSON object tracking field changes: {"field": {"from": oldValue, "to": newValue}}';

-- Create an index for querying edit changes
CREATE INDEX IF NOT EXISTS idx_vehicle_events_edit_changes ON public.vehicle_events USING GIN (edit_changes) WHERE edit_changes IS NOT NULL;
