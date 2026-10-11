-- PENDING (Mikaels ja krävs) — beslut 2026-10-11: läget "Uppföljning" för en placerad
-- deltagare räknas inte mot taket 50 per handledare (FFU §4.5.2).
--
-- PREMISSEN (mätt i prod 2026-10-11):
--  * Statusen bor i profiles.status (text, default 'ACTIVE', INGET check-villkor —
--    127 rader, alla ACTIVE). Värdet 'FOLLOW_UP' kräver alltså ingen schemaändring;
--    konsulenten sätter det via policyn "Konsulent kan ändra status på sin tilldelade
--    deltagare" (profiles_consultant_status_only_check släpper bara status/updated_at).
--  * consultant_participants har INGEN status-kolumn.
--  * Taket räknas ur vyn organization_caseload.antal_deltagare = alla rader i
--    consultant_participants för konsulenten. Vyn körs som ägaren (ingen
--    security_invoker) och kan därför läsa deltagarnas profiles.status.
--
-- VAD FILEN GÖR: en ny kolumn antal_uppfoljning (sist — CREATE OR REPLACE VIEW tillåter
-- bara tillägg i slutet). antal_deltagare lämnas ORÖRD: den används också av
-- överlämningen ("Alla N deltagare flyttas"), som flyttar även de i uppföljning.
-- Taket räknas i klienten som antal_deltagare − antal_uppfoljning
-- (client/src/components/consultant/caseloadKapacitet.ts). Resten av vyn är oförändrad
-- (avskriven ur pg_get_viewdef 2026-10-11).

begin;

create or replace view public.organization_caseload as
 select m.org_id,
    o.name as org_name,
    m.user_id as consultant_id,
    m.role,
    p.first_name,
    p.last_name,
    (( select count(*) as count
           from consultant_participants cp
          where (cp.consultant_id = m.user_id)))::integer as antal_deltagare,
    (( select count(*) as count
           from activity_plans ap
          where ((ap.consultant_id = m.user_id) and (ap.status = 'active'::text))))::integer as antal_aktiva_planer,
    (( select count(*) as count
           from (activity_sessions s
             join activity_plans ap on ((ap.id = s.plan_id)))
          where ((ap.consultant_id = m.user_id) and (s.attendance = 'absent_invalid'::text) and (s.date >= (current_date - 30)))))::integer as ogiltig_franvaro_30d,
    (( select count(*) as count
           from consultant_participants cp
           join profiles dp on dp.id = cp.participant_id
          where cp.consultant_id = m.user_id
            and dp.status = 'FOLLOW_UP'))::integer as antal_uppfoljning
   from ((organization_members m
     join organizations o on ((o.id = m.org_id)))
     join profiles p on ((p.id = m.user_id)))
  where ((m.role = any (array['konsulent'::text, 'handlaggare'::text, 'chef'::text, 'admin'::text])) and (exists ( select 1
           from organization_members me
          where ((me.org_id = m.org_id) and (me.user_id = auth.uid()) and (me.role = any (array['chef'::text, 'admin'::text]))))));

commit;

-- Ingen flagga i klienten: vyn läses med select('*'), så antal_uppfoljning saknas före
-- migrationen och räknas då som 0 — taket räknar alla, precis som i dag.
--
-- Efter körning:
--   cd client && npm run schema:refresh
--   committa snapshoten.
