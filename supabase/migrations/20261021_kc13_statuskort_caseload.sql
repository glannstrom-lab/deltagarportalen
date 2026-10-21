-- PENDING (Mikaels ja krävs) — KC13 2026-10-21: statuskort i chefsvyn.
--
-- Carriera visar "krav godkänt, andel aktiverade, dokumentation klar" per
-- organisation. Jobin har datan men räknar den bara per deltagare. Tre nya
-- kolumner i organization_caseload, SIST (CREATE OR REPLACE VIEW tillåter bara
-- tillägg i slutet). Resten av vyn är oförändrad (avskriven ur
-- 20261011b_uppfoljning_caseload.sql, som är körd — antal_uppfoljning finns i
-- schema-snapshot.json).
--
-- Bara tal per konsulent, inga deltagaruppgifter, inga hälsodata. Vyn körs som
-- ägaren och filtrerar på att anroparen är chef/admin i organisationen, precis
-- som i dag.
--
-- DEFINITIONERNA speglar klientens regler, så att chefens tal och konsulentens
-- vecka aldrig säger olika saker:
--
--   antal_veckomal_underlag  aktiva planer med minst ett ANVISAT pass förra
--                            veckan (måndag–söndag). Planer utan pass räknas
--                            inte — veckoampel() visar dem som "inga pass", inte
--                            som missat mål.
--   antal_veckomal_nadda     av dem: bekräftad närvaro (present/external) i
--                            anvisade pass ≥ anvisat veckomål − 0,05 h, och
--                            ingen ogiltig frånvaro. = veckoampel() === 'pa_mal'
--                            (aktivitetSchema.ts), anvisatVeckomal() =
--                            weekly_hours_target − jobsearch_hours_per_week.
--   antal_dokumentation_klar aktiva planer där deltagaren bekräftat GÄLLANDE
--                            version (KF5: plan_updated_at = ap.updated_at) OCH
--                            ett underlag för förra kalendermånaden är lämnat
--                            och inte återkallat (activity_plan_handovers).

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
            and dp.status = 'FOLLOW_UP'))::integer as antal_uppfoljning,
    (( select count(*)
           from activity_plans ap
          where ap.consultant_id = m.user_id
            and ap.status = 'active'
            and exists (select 1 from activity_sessions s
                         where s.plan_id = ap.id
                           and s.activity_type <> 'jobsearch_own'
                           and s.date >= date_trunc('week', current_date)::date - 7
                           and s.date <  date_trunc('week', current_date)::date)))::integer as antal_veckomal_underlag,
    (( select count(*)
           from activity_plans ap
          cross join lateral (
            select count(*) as pass,
                   count(*) filter (where s.attendance = 'absent_invalid') as ogiltig,
                   coalesce(sum(extract(epoch from (s.end_time::time - s.start_time::time)) / 3600.0)
                            filter (where s.attendance in ('present', 'external')), 0) as narvaro_h
              from activity_sessions s
             where s.plan_id = ap.id
               and s.activity_type <> 'jobsearch_own'
               and s.date >= date_trunc('week', current_date)::date - 7
               and s.date <  date_trunc('week', current_date)::date) v
          where ap.consultant_id = m.user_id
            and ap.status = 'active'
            and v.pass > 0
            and v.ogiltig = 0
            and v.narvaro_h + 0.05 >= greatest(0, coalesce(ap.weekly_hours_target, 0) - coalesce(ap.jobsearch_hours_per_week, 0))))::integer as antal_veckomal_nadda,
    (( select count(*)
           from activity_plans ap
          where ap.consultant_id = m.user_id
            and ap.status = 'active'
            and exists (select 1 from activity_plan_confirmations c
                         where c.plan_id = ap.id and c.plan_updated_at = ap.updated_at)
            and exists (select 1 from activity_plan_handovers h
                         where h.plan_id = ap.id
                           and h.withdrawn_at is null
                           and h.period_from <= (date_trunc('month', current_date) - interval '1 day')::date
                           and h.period_to   >= (date_trunc('month', current_date) - interval '1 month')::date)))::integer as antal_dokumentation_klar
   from ((organization_members m
     join organizations o on ((o.id = m.org_id)))
     join profiles p on ((p.id = m.user_id)))
  where ((m.role = any (array['konsulent'::text, 'handlaggare'::text, 'chef'::text, 'admin'::text])) and (exists ( select 1
           from organization_members me
          where ((me.org_id = m.org_id) and (me.user_id = auth.uid()) and (me.role = any (array['chef'::text, 'admin'::text]))))));

commit;

-- Ingen flagga i klienten: vyn läses med select('*'), och ChefsVy visar "—"
-- med en rad om varför när kolumnerna saknas (före migrationen).
--
-- Efter körning:
--   cd client && npm run schema:refresh && npm run grants:refresh
--   committa snapshotarna.
