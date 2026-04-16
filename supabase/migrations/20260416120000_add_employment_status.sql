-- Migration: Add employment_status to profiles
-- This field tracks the user's current employment situation
-- Used by: Career onboarding, AI Team context, Dashboard, Job recommendations

-- Add employment_status column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS employment_status TEXT
  CHECK (employment_status IN ('unemployed', 'employed', 'student', 'career-change', 'parental-leave', 'sick-leave', 'retired', 'other'));

-- Add career_goals to profiles (previously only in unified_profiles)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS career_goals JSONB DEFAULT '{}';

-- career_goals structure:
-- {
--   shortTerm: string,  -- What they want to achieve in 3-6 months
--   longTerm: string,   -- What they want to achieve in 1-2 years
--   preferredRoles: string[],  -- Job titles they're interested in
--   targetIndustries: string[],  -- Industries they want to work in
--   updatedAt: string (ISO date)
-- }

COMMENT ON COLUMN profiles.employment_status IS 'Current employment situation: unemployed, employed, student, career-change, parental-leave, sick-leave, retired, other';
COMMENT ON COLUMN profiles.career_goals IS 'Career goals including short/long term objectives and preferred roles';

-- Create index for filtering by employment status (useful for consultant views)
CREATE INDEX IF NOT EXISTS idx_profiles_employment_status ON profiles(employment_status);
