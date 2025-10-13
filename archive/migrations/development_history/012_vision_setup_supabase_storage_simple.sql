-- Simple Supabase Storage Setup (No Auth Required)
-- Run this in your Supabase SQL editor to allow uploads without authentication

-- Create the vehicle-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-images', 'vehicle-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload to vehicle-images bucket (for development)
CREATE POLICY "Allow public uploads to vehicle-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vehicle-images');

-- Allow anyone to read from vehicle-images bucket
CREATE POLICY "Allow public reads from vehicle-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-images');

-- Allow anyone to update vehicle-images
CREATE POLICY "Allow public updates to vehicle-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'vehicle-images')
WITH CHECK (bucket_id = 'vehicle-images');

-- Allow anyone to delete from vehicle-images
CREATE POLICY "Allow public deletes from vehicle-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'vehicle-images');

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
