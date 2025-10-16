-- Fix storage RLS to explicitly allow anon role

-- Drop and recreate policies with explicit role grants
DROP POLICY IF EXISTS "Allow uploads to vehicle-events" ON storage.objects;
DROP POLICY IF EXISTS "Allow reads from vehicle-events" ON storage.objects;
DROP POLICY IF EXISTS "Allow deletes from vehicle-events" ON storage.objects;
DROP POLICY IF EXISTS "Allow updates to vehicle-events" ON storage.objects;

-- Create policies that explicitly allow PUBLIC (includes anon and authenticated)
CREATE POLICY "Allow uploads to vehicle-events"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'vehicle-events'
);

CREATE POLICY "Allow reads from vehicle-events"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'vehicle-events'
);

CREATE POLICY "Allow deletes from vehicle-events"
ON storage.objects FOR DELETE
TO public
USING (
  bucket_id = 'vehicle-events'
);

CREATE POLICY "Allow updates to vehicle-events"
ON storage.objects FOR UPDATE
TO public
USING (
  bucket_id = 'vehicle-events'
);

-- Verify the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%vehicle-events%';
