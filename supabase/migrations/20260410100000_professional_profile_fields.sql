-- Migration: Add professional profile fields for arbetskonsulent and arbetsterapeut
-- These fields enable better participant support and integration across the portal

-- Add new JSONB columns for professional support data
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS consultant_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS therapist_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS support_goals JSONB DEFAULT '{}';

-- consultant_data structure:
-- {
--   cvStatus: 'complete' | 'needs_update' | 'missing',
--   activityLevel: {
--     applicationsSent: number,
--     interviews: number,
--     employerContacts: number,
--     lastActivityDate: string (ISO date)
--   },
--   references: 'available' | 'missing' | 'needs_contact',
--   internship: {
--     active: boolean,
--     company: string,
--     supervisor: string,
--     startDate: string,
--     endDate: string,
--     evaluation: string
--   },
--   workBarriers: string[], -- ['language', 'license', 'validation', 'experience', 'health', 'other']
--   barrierDetails: string,
--   nextSteps: [{
--     activity: string,
--     date: string,
--     completed: boolean
--   }],
--   geographicScope: string[], -- regions/cities willing to work in
--   targetIndustries: string[]
-- }

-- therapist_data structure:
-- {
--   workCapacityAssessment: {
--     date: string,
--     result: string,
--     recommendations: string
--   },
--   functionalLevel: {
--     physical: 'full' | 'limited' | 'significantly_limited',
--     cognitive: 'full' | 'limited' | 'significantly_limited',
--     social: 'full' | 'limited' | 'significantly_limited',
--     details: string
--   },
--   adaptationNeeds: string[], -- ['ergonomic', 'parttime', 'breaks', 'quiet', 'flexible_hours', 'remote', 'reduced_pace', 'written_instructions', 'other']
--   adaptationDetails: string,
--   energyLevel: {
--     sustainableHoursPerDay: number,
--     sustainableDaysPerWeek: number,
--     bestTimeOfDay: 'morning' | 'afternoon' | 'varies',
--     notes: string
--   },
--   rehabilitationPhase: 'early' | 'ongoing' | 'late' | 'completed',
--   assistiveTools: {
--     granted: string[],
--     applied: string[],
--     recommended: string[]
--   },
--   followUpDate: string,
--   followUpNotes: string
-- }

-- support_goals structure:
-- {
--   shortTerm: {
--     goal: string,
--     deadline: string,
--     progress: number (0-100)
--   },
--   longTerm: {
--     goal: string,
--     deadline: string,
--     progress: number (0-100)
--   },
--   notes: string
-- }

COMMENT ON COLUMN profiles.consultant_data IS 'Arbetskonsulent tracking data for job search support';
COMMENT ON COLUMN profiles.therapist_data IS 'Arbetsterapeut assessment and adaptation data';
COMMENT ON COLUMN profiles.support_goals IS 'Short and long term goals for the participant';
