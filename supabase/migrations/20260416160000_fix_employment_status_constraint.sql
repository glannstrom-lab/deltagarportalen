-- Fix employment_status constraint to allow NULL values
-- This is needed when users want to retake the career onboarding

ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_employment_status_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_employment_status_check
CHECK (employment_status IS NULL OR employment_status IN (
  'unemployed', 'employed', 'student', 'career-change',
  'rehabilitation', 'parental-leave', 'sick-leave',
  'new-to-country', 'self-employed', 'retired', 'other'
));
