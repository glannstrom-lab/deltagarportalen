-- Phase 5 Plan 01 — additive: profiles.linkedin_url. Idempotent.
-- Task 1 DB discovery confirmed linkedin_url was ABSENT from profiles table.
-- Apply: npx supabase db query --linked -f supabase/migrations/20260429_phase5_linkedin_url.sql

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

COMMENT ON COLUMN profiles.linkedin_url IS
  'User-supplied LinkedIn profile URL. Read by Karriär LinkedIn widget and applicationsApi.';
