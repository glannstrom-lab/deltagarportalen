-- ============================================
-- KV4: notes_count/last_note_date räknar fel tabell
-- Date: 2026-08-31
-- Context: consultant_dashboard_participants (senast omskapad i
--   20260710120000_consultant_participant_tags.sql) räknar notes_count och
--   last_note_date från `consultant_notes`. Klienten skriver aldrig till den
--   tabellen — samtliga nio skrivvägar för konsulentanteckningar går till
--   `consultant_journal` (consultantService.addJournalEntry m.fl., se
--   client/src/services/consultantService.ts). Mätt: noll
--   `.from('consultant_notes')`-anrop i hela client/src.
--
--   Effekt i drift: notes_count visar 0 på deltagarkortet oavsett hur mycket
--   konsulenten dokumenterat i journalen — vilket kan läsas som att ingen
--   dokumentation gjorts alls.
--
--   Bieffekt (positiv, oavsiktlig fram tills nu): den gamla frågan mot
--   consultant_notes filtrerade INTE på konsulent — den räknade alla
--   konsulenters anteckningar om deltagaren, inte bara den inloggades. Vyn är
--   `WITH (security_invoker = true)`, och consultant_journal har policyn
--   "Consultants can manage their journal entries" (auth.uid() =
--   consultant_id, ALL). Så länge subqueryn körs som den anropande
--   konsulenten filtrerar RLS automatiskt bort andra konsulenters
--   journalposter — notes_count blir alltså rätt scopead på köpet, utan att
--   vyn behöver ändras för det.
--
-- Ändring: enda skillnaden mot 20260710120000 är att notes_count/
--   last_note_date räknas från consultant_journal i stället för
--   consultant_notes. Allt annat (kolumner, JOIN-logik, WHERE-filter,
--   security_invoker, grants) är oförändrat.
--
-- KÖRD (notes_count finns på vyn i schema-snapshot, mätt 2026-09-02). Huvudet sa "INTE KÖRD ÄN" till 2026-09-02.
-- (Ursprunglig text:) Körs manuellt av Mikael (migrationer mot prod kräver hans
-- ja):
--   npx supabase db query --linked -f supabase/migrations/20260831140000_kv4_notes_count_consultant_journal.sql
-- Verifiera efteråt:
--   npx supabase db query --linked "select pg_get_viewdef('consultant_dashboard_participants', true);"
-- ============================================

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
  -- KV4: consultant_journal (INTE consultant_notes — se rubriken ovan).
  COALESCE((SELECT count(*) FROM consultant_journal WHERE consultant_journal.participant_id = p.id), 0::bigint) AS notes_count,
  (SELECT max(consultant_journal.created_at) FROM consultant_journal WHERE consultant_journal.participant_id = p.id) AS last_note_date,
  p.updated_at AS last_login
FROM consultant_participants cp
JOIN profiles p ON cp.participant_id = p.id
LEFT JOIN cvs c ON c.user_id = p.id
LEFT JOIN interest_results ir ON ir.user_id = p.id
WHERE cp.consultant_id = auth.uid()
   OR is_admin_or_superadmin();

COMMENT ON VIEW public.consultant_dashboard_participants IS
  'Participants assigned to the calling consultant (SECURITY INVOKER, filtered by consultant_id = auth.uid() OR admin). notes_count/last_note_date read consultant_journal (KV4, 2026-08-31) — consultant_notes is written to by nobody. Relies on RLS policies on consultant_participants, profiles, cvs, interest_results, saved_jobs, consultant_journal.';

GRANT SELECT ON public.consultant_dashboard_participants TO authenticated;
