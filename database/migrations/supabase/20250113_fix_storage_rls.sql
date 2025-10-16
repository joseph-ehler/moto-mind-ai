-- Fix storage RLS policies to work with anon key for development

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;

-- Create permissive policies for development (allow both authenticated AND anon)
CREATE POLICY "Allow uploads to vehicle-events"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vehicle-events'
);

CREATE POLICY "Allow reads from vehicle-events"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'vehicle-events'
);

CREATE POLICY "Allow deletes from vehicle-events"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vehicle-events'
);

CREATE POLICY "Allow updates to vehicle-events"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'vehicle-events'
);

COMMENT ON POLICY "Allow uploads to vehicle-events" ON storage.objects IS 'Allow all uploads to vehicle-events bucket (development)';
COMMENT ON POLICY "Allow reads from vehicle-events" ON storage.objects IS 'Allow all reads from vehicle-events bucket (development)';
COMMENT ON POLICY "Allow deletes from vehicle-events" ON storage.objects IS 'Allow all deletes from vehicle-events bucket (development)';
COMMENT ON POLICY "Allow updates to vehicle-events" ON storage.objects IS 'Allow all updates to vehicle-events bucket (development)';
