-- Fix event audit trail to ensure proper tracking of edits
-- This migration ensures that updated_at is properly managed and audit fields work correctly

-- First, let's make sure updated_at doesn't have a default that interferes with manual updates
ALTER TABLE public.vehicle_events 
ALTER COLUMN updated_at DROP DEFAULT;

-- Add a trigger to automatically update updated_at on any change (except when we explicitly set it)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update updated_at if it wasn't explicitly set in the UPDATE
    IF OLD.updated_at = NEW.updated_at THEN
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_vehicle_events_updated_at ON public.vehicle_events;

-- Create the trigger
CREATE TRIGGER update_vehicle_events_updated_at
    BEFORE UPDATE ON public.vehicle_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add some helpful comments
COMMENT ON COLUMN public.vehicle_events.edited_at IS 'Timestamp when the event was last manually edited by a user';
COMMENT ON COLUMN public.vehicle_events.edited_by IS 'ID of the user who last edited this event (future: auth.users.id)';
COMMENT ON COLUMN public.vehicle_events.edit_reason IS 'User-provided reason for the last edit, for audit trail';
COMMENT ON COLUMN public.vehicle_events.updated_at IS 'Timestamp when any field was last updated (automatic or manual)';

-- Create an index on edited_at for performance when querying edit history
CREATE INDEX IF NOT EXISTS idx_vehicle_events_edited_at ON public.vehicle_events(edited_at) WHERE edited_at IS NOT NULL;

-- Create an index on updated_at for performance
CREATE INDEX IF NOT EXISTS idx_vehicle_events_updated_at ON public.vehicle_events(updated_at);
