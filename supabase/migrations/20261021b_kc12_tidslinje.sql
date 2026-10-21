-- PENDING (Mikaels ja krävs) — KC12 2026-10-21: aktivitetstidslinje.
--
-- Carriera journalför deltagarens aktiviteter automatiskt. Jobin loggar redan
-- (user_activity_log, via log_user_activity från CV, sparade jobb, ansökningar,
-- artiklar och intervjuträningen — mätt 2026-10-21: cv_updated 935,
-- article_read 92, job_saved 43, job_applied 8, interview_completed 6), men
-- bara ägaren kan läsa loggen (RLS "Users can view own activity").
--
-- Den här vyn ger konsulenten, och deltagaren själv, EN gemensam lista:
--   * bara TYP och DAG (plus antal och senaste tid) — aldrig title,
--     description eller metadata, som kan bära jobbtitlar och artikelnamn;
--   * bara en VITLISTA av typer. Loggen har också mood_logged och diary_entry
--     (mående, dagbok — art. 9 respektive privat). De får aldrig synas här;
--   * plan bekräftad (activity_plan_confirmations, KF5) läggs till som typ;
--   * 90 dagar bakåt.
--
-- Åtkomst: deltagaren ser sina egna rader; en konsulent ser rader för de
-- deltagare som har en rad i consultant_participants för hen. Återkallar
-- deltagaren kopplingen tas raden bort (KS2) och tidslinjen slutar synas —
-- samma regel som journalen. Vyn körs som ägaren (definer-vy, samma mönster
-- som organization_caseload) eftersom konsulenten saknar RLS-väg till loggen;
-- därför filtrerar den själv på auth.uid(), och anon har ingen rättighet alls.
--
-- Ingen ny definer-FUNKTION, så lint:grants AUTH_TAK (27) påverkas inte.

begin;

create or replace view public.deltagare_tidslinje as
  select l.user_id as participant_id,
         (l.created_at at time zone 'Europe/Stockholm')::date as dag,
         l.activity_type as typ,
         count(*)::integer as antal,
         max(l.created_at) as senast
    from public.user_activity_log l
   where l.activity_type in ('cv_updated', 'job_saved', 'job_applied', 'article_read', 'interview_completed')
     and l.created_at >= now() - interval '90 days'
     and (l.user_id = auth.uid()
          or exists (select 1 from public.consultant_participants cp
                      where cp.participant_id = l.user_id and cp.consultant_id = auth.uid()))
   group by 1, 2, 3
  union all
  select c.participant_id,
         (c.confirmed_at at time zone 'Europe/Stockholm')::date,
         'plan_confirmed',
         count(*)::integer,
         max(c.confirmed_at)
    from public.activity_plan_confirmations c
   where c.confirmed_at >= now() - interval '90 days'
     and (c.participant_id = auth.uid()
          or exists (select 1 from public.consultant_participants cp
                      where cp.participant_id = c.participant_id and cp.consultant_id = auth.uid()))
   group by 1, 2, 3;

revoke all on public.deltagare_tidslinje from public;
revoke all on public.deltagare_tidslinje from anon;
revoke all on public.deltagare_tidslinje from authenticated;
grant select on public.deltagare_tidslinje to authenticated;

commit;

-- Kontroll efter körning (förväntat: anon_sel false, auth_sel true, auth_ins false):
--   select has_table_privilege('anon', 'public.deltagare_tidslinje', 'SELECT') anon_sel,
--          has_table_privilege('authenticated', 'public.deltagare_tidslinje', 'SELECT') auth_sel,
--          has_table_privilege('authenticated', 'public.deltagare_tidslinje', 'INSERT') auth_ins;
--
-- Efter körning:
--   cd client && npm run schema:refresh && npm run grants:refresh
--   committa snapshotarna.
