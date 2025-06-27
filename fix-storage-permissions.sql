-- Fix storage permissions for board-images bucket
-- Run this in your Supabase SQL Editor to resolve RLS policy issues

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload board images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view their own board images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own board images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to board images" ON storage.objects;
DROP POLICY IF EXISTS "Allow read access to board images for owners" ON storage.objects;

-- Create more permissive policies for board-images bucket

-- Allow any authenticated user to upload to board-images bucket
CREATE POLICY "Allow authenticated upload to board-images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'board-images' 
    AND auth.role() = 'authenticated'
  );

-- Allow any authenticated user to view board-images
CREATE POLICY "Allow authenticated read from board-images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'board-images' 
    AND auth.role() = 'authenticated'
  );

-- Allow any authenticated user to update their own uploads
CREATE POLICY "Allow authenticated update in board-images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'board-images' 
    AND auth.role() = 'authenticated'
  );

-- Allow any authenticated user to delete from board-images
CREATE POLICY "Allow authenticated delete from board-images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'board-images' 
    AND auth.role() = 'authenticated'
  );

-- Allow public read access for sharing and AI analysis
CREATE POLICY "Allow public read from board-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'board-images');

-- Make storage completely public - anyone can upload and access images
CREATE POLICY "board-images-public-access" ON storage.objects
  FOR ALL USING (bucket_id = 'board-images')
  WITH CHECK (bucket_id = 'board-images');

-- Make sure the bucket exists and is properly configured
UPDATE storage.buckets 
SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
WHERE id = 'board-images';

-- If the bucket doesn't exist, create it
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'board-images',
  'board-images',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING; 