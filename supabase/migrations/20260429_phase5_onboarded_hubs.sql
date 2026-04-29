-- Phase 5 Plan 01 — additive: profiles.onboarded_hubs for Översikt onboarding detection.
-- Idempotent: safe to re-run. INVIOLABLE per CONTEXT.md: ADD COLUMN IF NOT EXISTS only.
-- Apply: npx supabase db query --linked -f supabase/migrations/20260429_phase5_onboarded_hubs.sql

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarded_hubs TEXT[] DEFAULT '{}';

COMMENT ON COLUMN profiles.onboarded_hubs IS
  'Hub IDs the user has visited at least once. Used by Översikt for onboarding detection. Appended by hub-page mount effect. Values: jobb, karriar, resurser, min-vardag, oversikt.';
