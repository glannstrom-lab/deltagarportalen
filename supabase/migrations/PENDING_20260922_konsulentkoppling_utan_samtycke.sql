-- PENDING — KÖRS INTE UTAN MIKAELS JA (RLS + GRANT/REVOKE mot prod).
-- Förslag från databaspasset 2026-09-22 (agent: "det som körs inne i Postgres").
--
-- PROBLEM (verifierat mot pg_policies/has_table_privilege 2026-09-22):
--   consultant_participants har policyn "Konsulenter kan hantera kopplingar"
--   FOR ALL USING (consultant_id = auth.uid() OR admin) utan WITH CHECK.
--   För ALL/INSERT används USING då som WITH CHECK — alltså får VILKEN
--   inloggad användare som helst (ingen rollkontroll, roles={public},
--   authenticated har INSERT) skapa raden
--       (consultant_id = sig själv, participant_id = godtycklig uuid).
--   Raden ÄR "aktiv relation" (har_aktiv_relation + 21 policyer, KS2b) och
--   öppnar: consultant_journal (ALLA konsulenters rader om personen), cvs,
--   saved_jobs, consultant_work_placements, activity_plans/-sessions,
--   consultant_messages (skicka som "konsulent"), notifications (INSERT
--   aktivitetsnotiser), profiles.status.
--   Konkret: en konsulent vars koppling deltagaren ÅTERKALLAT via
--   revoke_consultant_link (som raderar cp-raden) känner deltagarens uuid
--   (URL:en /consultant/participants/<uuid>) och kan lägga tillbaka raden
--   med ett enda PostgREST-anrop — återkallelsen går inte att upprätthålla.
--   Samma sak efter en överlämning (organization_handover).
--   Samma UPDATE-policy låter konsulenten byta participant_id på sin egen
--   rad till någon annan.
--
--   Klienten skriver ALDRIG INSERT mot tabellen (grep client/src 2026-09-22):
--   bara SELECT och UPDATE av last_contact_at / priority / tags.
--   Legitima skapare är SECURITY DEFINER-funktioner (handle_invitation_acceptance,
--   organization_handover_insert, seed_demo_org) som inte berörs av RLS.
--
--   Dessutom: sta_bulk_smart_add (STA arkiverad 2026-09-12, noll anropare)
--   är fortfarande EXECUTE för authenticated och kopplar VARJE befintligt
--   konto vars e-post konsulenten anger — profiles.consultant_id + cp-rad —
--   utan deltagarens samtycke.

BEGIN;

DROP POLICY IF EXISTS "Konsulenter kan hantera kopplingar" ON public.consultant_participants;

-- Admin behåller full hantering.
CREATE POLICY "Admin hanterar kopplingar" ON public.consultant_participants
  FOR ALL TO authenticated
  USING (is_admin_or_superadmin())
  WITH CHECK (is_admin_or_superadmin());

-- Konsulenten får ändra och avsluta sina egna kopplingar — inte skapa nya.
CREATE POLICY "Konsulent ändrar egen koppling" ON public.consultant_participants
  FOR UPDATE TO authenticated
  USING (consultant_id = auth.uid())
  WITH CHECK (consultant_id = auth.uid());

CREATE POLICY "Konsulent avslutar egen koppling" ON public.consultant_participants
  FOR DELETE TO authenticated
  USING (consultant_id = auth.uid());

-- Nycklarna (consultant_id, participant_id) ska inte gå att skriva om.
REVOKE UPDATE ON public.consultant_participants FROM authenticated, anon;
GRANT UPDATE (notes, priority, last_contact_at, next_meeting_scheduled, tags)
  ON public.consultant_participants TO authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.consultant_participants FROM anon;

-- STA-funktionerna har noll anropare sedan arkiveringen.
REVOKE EXECUTE ON FUNCTION public.sta_bulk_invite(jsonb, date, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sta_bulk_smart_add(jsonb, date, integer, text, jsonb, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sta_sign_assessment(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sta_get_consultant_for_participant(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sta_participant_mark_doa_done(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sta_participant_save_doa_score(uuid, integer, integer, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sta_participant_update_self(uuid, date, smallint, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sta_participant_update_start_date(uuid, date) FROM PUBLIC, anon, authenticated;

COMMIT;

-- VERIFIERING (förväntat svar):
--   select polname, polcmd from pg_policy where polrelid='public.consultant_participants'::regclass;
--     → "Admin hanterar kopplingar"(*), "Konsulent ändrar egen koppling"(w),
--       "Konsulent avslutar egen koppling"(d), "Konsulenter ser sina deltagare"(r)
--   select has_column_privilege('authenticated','public.consultant_participants','participant_id','UPDATE'); → false
--   select has_function_privilege('authenticated','public.sta_bulk_smart_add(jsonb,date,integer,text,jsonb,boolean)','EXECUTE'); → false
-- EFTERÅT: npm run grants:refresh + schema:refresh, committa snapshots i samma commit.
-- RÖKTEST: konsulentvyn — logga kontakt, sätt taggar, prioritet (UPDATE ska gå),
--   och ett INSERT som vanlig deltagare ska ge 42501.
