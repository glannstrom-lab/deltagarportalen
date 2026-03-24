-- ============================================
-- Add profile preferences columns for cloud sync
-- Stores desired jobs, interests, and onboarding progress
-- ============================================

-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS desired_jobs JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS interests JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS onboarding_progress JSONB DEFAULT '{}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN profiles.desired_jobs IS 'Array of up to 3 desired job titles';
COMMENT ON COLUMN profiles.interests IS 'Array of up to 3 personal interests';
COMMENT ON COLUMN profiles.onboarding_progress IS 'Object tracking onboarding step completion: {profile: bool, interest: bool, cv: bool, career: bool, jobSearch: bool, coverLetter: bool}';

-- Create index for faster lookups on onboarding progress
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON profiles USING gin (onboarding_progress);
