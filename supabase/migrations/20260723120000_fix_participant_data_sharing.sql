-- ============================================
-- Fix Participant Data Sharing (UX7)
-- Date: 2026-07-23
-- ============================================
-- ROOT CAUSE (verified against code + prod error log):
-- The reported error was:
--   400 / 42703 column participant_data_sharing.share_health_data_with_consultant
--   does not exist
--
-- 42703 = undefined_column, NOT undefined_table — so `participant_data_sharing`
-- already exists (created by 20260328100000_health_data_consent.sql) with
-- columns `share_health_data` and `share_wellness_data` (no "_with_consultant"
-- suffix). Those are also the exact column names used by the existing RLS
-- helper functions/policies (check_health_consent/check_wellness_consent,
-- consultant_has_access, and the consultant SELECT policies on
-- interest_results / mood_logs).
--
-- The frontend (client/src/components/consent/DataSharingSettings.tsx) was
-- reading/writing `share_health_data_with_consultant` /
-- `share_wellness_data_with_consultant` — column names that were never
-- created by any migration. This was a frontend column-name bug, not a
-- missing migration. The fix has been made in DataSharingSettings.tsx
-- (now reads/writes `share_health_data` / `share_wellness_data`, and the
-- upsert now targets the table's real UNIQUE(participant_id, consultant_id)
-- key instead of participant_id alone).
--
-- This migration is a defensive, idempotent safety net only — it re-asserts
-- the correct columns exist with the correct names/defaults in case any
-- environment's schema has drifted from 20260328100000. It is a no-op on any
-- database where that migration already ran cleanly.
-- ============================================

ALTER TABLE participant_data_sharing
ADD COLUMN IF NOT EXISTS share_health_data BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS share_wellness_data BOOLEAN DEFAULT false;

COMMENT ON COLUMN participant_data_sharing.share_health_data IS 'Participant grants consultant access to health data (ICF results, medical notes)';
COMMENT ON COLUMN participant_data_sharing.share_wellness_data IS 'Participant grants consultant access to wellness data (mood logs, diary entries)';
