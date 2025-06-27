-- Create storage bucket for board images
-- Run this in your Supabase SQL Editor

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'board-images',
  'board-images',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
);

-- Create RLS policy for the storage bucket
-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload board images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'board-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to view their own images
CREATE POLICY "Allow users to view their own board images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'board-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own images
CREATE POLICY "Allow users to delete their own board images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'board-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public access to read images (for sharing and AI analysis)
CREATE POLICY "Allow public read access to board images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'board-images'
  );

-- Alternative: If you want to restrict public access, use this instead:
-- CREATE POLICY "Allow read access to board images for owners" ON storage.objects
--   FOR SELECT USING (
--     bucket_id = 'board-images' 
--     AND auth.role() = 'authenticated'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   ); 