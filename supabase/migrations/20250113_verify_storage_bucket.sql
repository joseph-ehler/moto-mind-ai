-- Migration: Verify and Configure Storage Bucket
-- Description: Ensures vehicle-events bucket exists with proper permissions
-- Priority: P0 - Required before capture system can upload photos

-- ============================================================================
-- 1. VERIFY BUCKET EXISTS
-- ============================================================================

DO $$ 
BEGIN
  -- Check if bucket exists
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'vehicle-events'
  ) THEN
    -- Create bucket if it doesn't exist
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('vehicle-events', 'vehicle-events', true);
    
    RAISE NOTICE 'Created vehicle-events bucket';
  ELSE
    RAISE NOTICE 'vehicle-events bucket already exists';
  END IF;
END $$;

-- ============================================================================
-- 2. CONFIGURE BUCKET POLICIES (RLS on storage.objects)
-- ============================================================================

-- Note: storage.objects already has RLS enabled by Supabase
-- We just need to create our policies

-- Drop existing policies if they exist (to avoid duplicates)
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;

-- Policy 1: Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vehicle-events'
);

-- Policy 2: Allow authenticated users to read files
CREATE POLICY "Allow authenticated reads"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vehicle-events'
);

-- Policy 3: Allow authenticated users to delete their files
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vehicle-events'
);

-- Policy 4: Allow authenticated users to update files (for editing)
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vehicle-events'
);

-- ============================================================================
-- 3. VERIFY CONFIGURATION
-- ============================================================================

-- Show bucket configuration
DO $$ 
DECLARE
  bucket_count INTEGER;
  policy_count INTEGER;
BEGIN
  -- Count buckets
  SELECT COUNT(*) INTO bucket_count
  FROM storage.buckets 
  WHERE name = 'vehicle-events';
  
  -- Count policies on storage.objects table
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND policyname LIKE 'Allow authenticated%';
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'STORAGE BUCKET VERIFICATION';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Bucket exists: %', CASE WHEN bucket_count > 0 THEN 'YES' ELSE 'NO' END;
  RAISE NOTICE 'RLS policies configured: % policies', policy_count;
  RAISE NOTICE '============================================';
  
  IF bucket_count = 0 THEN
    RAISE EXCEPTION 'FAILED: vehicle-events bucket does not exist';
  END IF;
  
  IF policy_count < 4 THEN
    RAISE WARNING 'Only % policies found, expected 4. Upload permissions may be incomplete.', policy_count;
  ELSE
    RAISE NOTICE 'SUCCESS: All 4 storage policies configured correctly';
  END IF;
END $$;

-- Show all RLS policies for storage.objects
SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING clause defined'
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK clause defined'
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE 'Allow authenticated%'
ORDER BY cmd;
