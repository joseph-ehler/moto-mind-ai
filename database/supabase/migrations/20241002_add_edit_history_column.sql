-- Add edit_history column to store full edit history as an array
-- This will maintain a complete chronological log of all edits

ALTER TABLE public.vehicle_events 
ADD COLUMN edit_history JSONB NULL;

-- Add a comment explaining the structure
COMMENT ON COLUMN public.vehicle_events.edit_history IS 'Array of edit entries: [{"timestamp": "ISO", "reason": "string", "changes": {...}, "edited_by": "user_id"}]';

-- Create an index for querying edit history
CREATE INDEX IF NOT EXISTS idx_vehicle_events_edit_history ON public.vehicle_events USING GIN (edit_history) WHERE edit_history IS NOT NULL;
