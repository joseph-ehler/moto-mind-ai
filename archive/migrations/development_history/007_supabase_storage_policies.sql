-- Supabase Storage Policies for Vehicle Images
-- This migration sets up proper RLS policies for the vehicle-images bucket

-- Create the vehicle-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-images', 'vehicle-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to vehicle images
CREATE POLICY "Public read access for vehicle images"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-images');

-- Allow authenticated users to upload vehicle images
CREATE POLICY "Authenticated users can upload vehicle images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vehicle-images' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own vehicle images
CREATE POLICY "Users can update their own vehicle images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'vehicle-images' 
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'vehicle-images' 
  AND auth.role() = 'authenticated'
);

-- Allow users to delete their own vehicle images
CREATE POLICY "Users can delete their own vehicle images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vehicle-images' 
  AND auth.role() = 'authenticated'
);

-- Enable RLS on the storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
