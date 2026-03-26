-- ============================================
-- Add extended profile preferences columns
-- For availability, mobility, salary, labor market status,
-- work preferences, and physical requirements
-- ============================================

-- Add new JSONB columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS availability JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS mobility JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS salary JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS labor_market_status JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS work_preferences JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS physical_requirements JSONB DEFAULT '{}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN profiles.availability IS 'Availability preferences: status, availableFrom, noticePeriod, employmentTypes, remoteWork';
COMMENT ON COLUMN profiles.mobility IS 'Mobility info: driversLicense array, hasCar, maxCommuteMinutes, willingToRelocate, willingToTravel';
COMMENT ON COLUMN profiles.salary IS 'Salary expectations: expectationMin, expectationMax, importantBenefits array';
COMMENT ON COLUMN profiles.labor_market_status IS 'Labor market status: registeredAtAF, participatingInProgram, programName, hasActivitySupport';
COMMENT ON COLUMN profiles.work_preferences IS 'Work preferences: sectors array, companySizes array, importantValues array';
COMMENT ON COLUMN profiles.physical_requirements IS 'Physical requirements: hasAdaptationNeeds, adaptationDescription';

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_availability ON profiles USING gin (availability);
CREATE INDEX IF NOT EXISTS idx_profiles_labor_market ON profiles USING gin (labor_market_status);
