-- ============================================
-- Fix SECURITY DEFINER views (round 2)
-- Date: 2026-05-23
-- Context: Supabase linter flagged user_consent_status and
--   consultant_dashboard_participants as SECURITY DEFINER views.
--   Previous fix (20260408130000) did DROP+CREATE but forgot the
--   WITH (security_invoker = true) clause, leaving reloptions = NULL
--   which defaults to DEFINER behaviour.
--
-- consultant_dashboard_participants was the more serious case: it
-- had no WHERE-clause and authenticated role had SELECT on it, so
-- any logged-in user could SELECT all participants for all consultants
-- (RLS on profiles/cvs/etc was bypassed by the view owner privileges).
-- App code happened to always filter by consultant_id, but the DB
-- never enforced it.
--
-- Strategy chosen: A+B-minimum
--   - WHERE consultant_id = auth.uid() OR is_admin_or_superadmin() inside the view
--     (defence in depth — view never returns other consultants' rows)
--   - SECURITY INVOKER on the view
--   - Add the two minimum RLS policies needed for the view to function as
--     INVOKER: consultants reading their assigned participants' profiles + CVs
--     (interest_results, saved_jobs, consultant_notes already have policies
--     covering consultant reads).
--   - Relation used: consultant_participants table (matches view JOIN logic)
-- ============================================

-- ---------- 1. user_consent_status ----------
-- Definition is already safe (WHERE id = auth.uid()).
-- Just flip to SECURITY INVOKER.
ALTER VIEW public.user_consent_status SET (security_invoker = true);

COMMENT ON VIEW public.user_consent_status IS
  'Current consent status for authenticated user (SECURITY INVOKER, self-filtered by auth.uid())';


-- ---------- 2. Minimum RLS policies for consultant view to work as INVOKER ----------

-- profiles: consultant may read profiles of participants assigned to them
DROP POLICY IF EXISTS "Consultants can view assigned participant profiles" ON public.profiles;
CREATE POLICY "Consultants can view assigned participant profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.consultant_participants cp
      WHERE cp.consultant_id = auth.uid()
        AND cp.participant_id = profiles.id
    )
  );

-- cvs: consultant may read CVs of participants assigned to them
DROP POLICY IF EXISTS "Consultants can view assigned participant CVs" ON public.cvs;
CREATE POLICY "Consultants can view assigned participant CVs"
  ON public.cvs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.consultant_participants cp
      WHERE cp.consultant_id = auth.uid()
        AND cp.participant_id = cvs.user_id
    )
  );


-- ---------- 3. consultant_dashboard_participants ----------
-- Recreate with security_invoker + WHERE-filter (defence in depth).
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
