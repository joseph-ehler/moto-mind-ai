-- Add notes column to vehicle_events for photo descriptions and other contextual info
ALTER TABLE vehicle_events 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add index for text search on notes
CREATE INDEX IF NOT EXISTS idx_vehicle_events_notes ON vehicle_events USING gin(to_tsvector('english', notes)) WHERE notes IS NOT NULL;

-- Add comment
COMMENT ON COLUMN vehicle_events.notes IS 'Descriptive notes for the event, used for AI-generated descriptions and user annotations';
