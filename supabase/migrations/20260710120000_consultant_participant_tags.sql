-- ============================================
-- Taggar på konsulent-deltagar-kopplingen (R2b/B3)
-- Date: 2026-07-10
-- Context: BulkActionsDialog hade en tagg-knapp utan backend.
--   Taggar lagras per relation (konsulentens taggar på sin deltagare),
--   inte på profilen — olika konsulenter ska kunna tagga oberoende.
--   Vyn consultant_dashboard_participants återskapas med tags-kolumnen
--   (behåller security_invoker + WHERE-filtret från 20260523120000).
-- Körs manuellt: npx supabase db query --linked -f supabase/migrations/20260710120000_consultant_participant_tags.sql
-- ============================================

ALTER TABLE consultant_participants
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

DROP VIEW IF EXISTS public.consultant_dashboard_participants;

CREATE VIEW public.consultant_dashboard_participants
WITH (security_invoker = true) AS
SELECT
  cp.consultant_id,
  p.id AS participant_id,
  p.id AS user_id,
  p.email,
  p.first_name,
  p.last_name,
  p.phone,
  p.avatar_url,
  p.status,
  p.created_at AS registered_at,
  cp.assigned_at,
  cp.priority,
  cp.tags,
  cp.last_contact_at,
  cp.next_meeting_scheduled,
  cp.notes AS consultant_notes,
  CASE WHEN c.id IS NOT NULL THEN true ELSE false END AS has_cv,
  c.ats_score,
  c.updated_at AS cv_updated_at,
  CASE WHEN ir.id IS NOT NULL THEN true ELSE false END AS completed_interest_test,
  ir.holland_code,
  COALESCE((SELECT count(*) FROM saved_jobs WHERE saved_jobs.user_id = p.id), 0::bigint) AS saved_jobs_count,
  COALESCE((SELECT count(*) FROM consultant_notes WHERE consultant_notes.participant_id = p.id), 0::bigint) AS notes_count,
  (SELECT max(consultant_notes.created_at) FROM consultant_notes WHERE consultant_notes.participant_id = p.id) AS last_note_date,
  p.updated_at AS last_login
FROM consultant_participants cp
JOIN profiles p ON cp.participant_id = p.id
LEFT JOIN cvs c ON c.user_id = p.id
LEFT JOIN interest_results ir ON ir.user_id = p.id
WHERE cp.consultant_id = auth.uid()
   OR is_admin_or_superadmin();

COMMENT ON VIEW public.consultant_dashboard_participants IS
  'Participants assigned to the calling consultant (SECURITY INVOKER, filtered by consultant_id = auth.uid() OR admin). Relies on RLS policies on consultant_participants, profiles, cvs, interest_results, saved_jobs, consultant_notes.';

GRANT SELECT ON public.consultant_dashboard_participants TO authenticated;
