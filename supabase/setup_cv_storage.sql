-- Setup for CV Image Storage
-- Run this in Supabase SQL Editor or Dashboard

-- Enable RLS on storage.objects (if not already enabled)
-- This is handled in the Supabase dashboard

-- Create bucket "cv-images" via Supabase Dashboard or API:
-- Go to: Storage → New Bucket → Name: "cv-images" → Public: true

-- Set bucket policies (run in SQL Editor or configure in Dashboard)

-- Policy: Allow authenticated users to upload to their own folder
-- Path pattern: profiles/{user_id}/*

-- Policy: Allow public read access to all images
-- Path pattern: *

-- Alternative: Set up using Supabase JS client
-- See: client/src/hooks/useImageUpload.ts for upload logic

-- Note: Bucket creation and policies are typically managed via:
-- 1. Supabase Dashboard → Storage
-- 2. Supabase CLI
-- 3. Management API

-- Example policy SQL (for reference):
/*
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'cv-images');

-- Allow users to update their own files
CREATE POLICY "Allow own file updates" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'cv-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own files
CREATE POLICY "Allow own file deletes" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'cv-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access
CREATE POLICY "Allow public read" ON storage.objects
FOR SELECT TO anon
USING (bucket_id = 'cv-images');
*/
