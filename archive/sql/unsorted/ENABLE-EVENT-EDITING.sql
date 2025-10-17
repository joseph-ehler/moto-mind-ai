-- ENABLE EVENT EDITING: Remove immutability constraints
-- This allows users to fix AI extraction errors and add context

-- 1. Remove the immutability trigger that prevents updates
DROP TRIGGER IF EXISTS prevent_event_updates ON public.vehicle_events;

-- 2. Add edit tracking columns
ALTER TABLE public.vehicle_events 
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS edited_by UUID REFERENCES auth.users(id);

-- 3. Add soft delete column if not exists
ALTER TABLE public.vehicle_events 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 4. Update RLS policies to handle soft deletes
DROP POLICY IF EXISTS "Users can view their vehicle events" ON public.vehicle_events;
CREATE POLICY "Users can view their vehicle events" ON public.vehicle_events
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    AND deleted_at IS NULL
  );

-- 5. Add UPDATE policy for editing events
DROP POLICY IF EXISTS "Users can update their vehicle events" ON public.vehicle_events;
CREATE POLICY "Users can update their vehicle events" ON public.vehicle_events
  FOR UPDATE USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  );

-- 6. Create index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_vehicle_events_deleted_at ON public.vehicle_events(deleted_at) 
WHERE deleted_at IS NULL;

-- 7. Create index for edit tracking
CREATE INDEX IF NOT EXISTS idx_vehicle_events_edited_at ON public.vehicle_events(edited_at) 
WHERE edited_at IS NOT NULL;

COMMENT ON COLUMN public.vehicle_events.edited_at IS 'When this event was last edited by user';
COMMENT ON COLUMN public.vehicle_events.edited_by IS 'User who last edited this event';
COMMENT ON COLUMN public.vehicle_events.deleted_at IS 'Soft delete timestamp - NULL means active';
