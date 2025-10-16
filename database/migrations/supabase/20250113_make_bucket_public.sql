-- Make vehicle-events bucket truly public (no RLS restrictions)

-- Update bucket to be public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'vehicle-events';

-- Verify it worked
SELECT 
  id, 
  name, 
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'vehicle-events';
