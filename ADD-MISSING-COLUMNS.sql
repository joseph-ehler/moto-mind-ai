-- ADD MISSING COLUMNS that the API expects

-- Add deleted_at column for soft deletes
ALTER TABLE public.vehicle_events 
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- Add any other columns the API might expect
ALTER TABLE public.vehicle_events 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Update the RLS policy to handle deleted_at
DROP POLICY IF EXISTS "allow_all_events" ON public.vehicle_events;
CREATE POLICY "allow_all_events" ON public.vehicle_events 
FOR ALL TO authenticated 
USING (deleted_at IS NULL);

-- Verify the fix
SELECT 'Columns added successfully' as status;
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'vehicle_events' 
AND column_name IN ('deleted_at', 'updated_at');
