-- Migration: Add profile_image column to CVs table
-- Created: 2026-03-07

-- Add profile_image column to cvs table
ALTER TABLE IF EXISTS cvs
ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_cvs_profile_image ON cvs(profile_image) 
WHERE profile_image IS NOT NULL;

-- Create storage bucket for CV images if not exists
-- Note: This needs to be run in Supabase dashboard or via storage API
-- as it's not directly supported in SQL migrations

-- Add comment for documentation
COMMENT ON COLUMN cvs.profile_image IS 'URL to profile image stored in cv-images bucket';
