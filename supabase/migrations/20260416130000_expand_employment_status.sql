-- Migration: Expand employment_status options
-- Adding more inclusive options for diverse user groups:
-- - Long-term unemployed with health challenges (rehabilitation)
-- - Newcomers to Sweden (new-to-country)
-- - Self-employed looking for employment (self-employed)

-- Drop the old constraint and add new one with expanded options
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_employment_status_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_employment_status_check
CHECK (employment_status IN (
  'unemployed',       -- Aktivt arbetssökande
  'employed',         -- Har jobb men vill byta/avancera
  'student',          -- Studerar
  'career-change',    -- Vill byta karriär helt
  'rehabilitation',   -- I rehabilitering/återgång till arbete
  'parental-leave',   -- Föräldraledig
  'sick-leave',       -- Sjukskriven
  'new-to-country',   -- Ny i Sverige (integration)
  'self-employed',    -- Egen företagare som söker anställning
  'retired',          -- Pensionär
  'other'             -- Annat
));

COMMENT ON COLUMN profiles.employment_status IS 'Current employment situation - inclusive options for diverse user groups including those in rehabilitation, newcomers to Sweden, and self-employed';
