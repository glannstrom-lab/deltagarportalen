-- KÖRD mot prod 2026-10-31 (Mikaels ja) (FN7, utfall för hela enheten).
--
-- Varför en funktion: chef/admin läser organisationens planer (aal2), men inte
-- consultant_placements (bara konsulenten med aktiv koppling) och inte
-- consultant_participants (bara konsulenten eller superadmin). Utan funktionen
-- går varken "i arbete eller studier" eller "tid till plan" att räkna för
-- enheten. Funktionen returnerar BARA aggregat (fem tal), aldrig en rad per
-- person, och kontrollerar själv:
--   1. att anroparen är chef/admin i organisationen,
--   2. att sessionen är aal2 (tvåstegsinloggning) — demoorganisationer undantas,
--      precis som i policyn "Organisationens chef läser planer".
-- Celler under 5 undertrycks också här (NULL), inte bara i klienten.
--
-- Efter körning: npm run schema:refresh och npm run grants:refresh i client/,
-- committa snapshotarna i SAMMA commit, och sätt ENHETENS_UTFALL_RPC_FINNS = true
-- i client/src/services/enhetensUtfall.ts (byt gärna RPC_NAMN till literalen så
-- lint:schema vaktar namnet). OBS lint:grants har ett fryst tak för authenticated
-- (26): en ny anropbar definer-funktion höjer det — ta beslutet medvetet.
--
-- "I arbete eller studier" = deltagare med en placering som har börjat och inte
-- slutat (typ permanent/temp/trial/studies). "Avslut" = deltagare vars alla
-- planer är avslutade. "Tid till plan" = snitt av dagar från koppling
-- (consultant_participants.assigned_at) till planens startdatum, per deltagare
-- med minst en plan som startat efter kopplingen.

begin;

create or replace function public.enhetens_utfall(p_org uuid)
returns table (
  deltagare_totalt integer,
  i_arbete_eller_studier integer,
  avslutade_deltagare integer,
  tid_till_plan_dagar numeric,
  tid_till_plan_n integer
)
language plpgsql
security definer
set search_path = public
stable
as $fn$
declare
  v_demo boolean;
begin
  if auth.uid() is null then
    raise exception 'Inte inloggad' using errcode = '42501';
  end if;

  if not exists (
    select 1 from organization_members me
    where me.org_id = p_org and me.user_id = auth.uid() and me.role in ('chef', 'admin')
  ) then
    raise exception 'Bara chef eller admin i organisationen får se enhetens utfall' using errcode = '42501';
  end if;

  select coalesce(o.is_demo, false) into v_demo from organizations o where o.id = p_org;
  if not v_demo and coalesce(auth.jwt() ->> 'aal', '') <> 'aal2' then
    raise exception 'Kräver tvåstegsinloggning (aal2)' using errcode = '42501';
  end if;

  return query
  with personal as (
    select m.user_id from organization_members m
    where m.org_id = p_org and m.role in ('konsulent', 'handlaggare', 'chef', 'admin')
  ),
  delt as (
    select cp.participant_id, min(cp.assigned_at) as kopplad
    from consultant_participants cp
    where cp.consultant_id in (select user_id from personal)
    group by cp.participant_id
  ),
  arbete as (
    select distinct pl.participant_id
    from consultant_placements pl
    where pl.consultant_id in (select user_id from personal)
      and pl.placement_type in ('permanent', 'temp', 'trial', 'studies')
      and pl.start_date <= current_date
      and (pl.end_date is null or pl.end_date >= current_date)
  ),
  plan_per_delt as (
    select ap.participant_id,
           bool_and(ap.status = 'ended') as alla_avslutade,
           min(ap.start_date) as forsta_start
    from activity_plans ap
    where ap.org_id = p_org
    group by ap.participant_id
  ),
  tid as (
    select (p.forsta_start - d.kopplad::date) as dagar
    from delt d join plan_per_delt p on p.participant_id = d.participant_id
    where p.forsta_start >= d.kopplad::date
  ),
  summa as (
    select
      (select count(*) from delt)::integer as totalt,
      (select count(*) from arbete a where a.participant_id in (select participant_id from delt))::integer as arb,
      (select count(*) from plan_per_delt where alla_avslutade)::integer as avsl,
      (select avg(dagar) from tid) as snitt,
      (select count(*) from tid)::integer as n
  )
  select
    case when s.totalt < 5 then null else s.totalt end,
    case when s.totalt < 5 or (s.arb > 0 and s.arb < 5) then null else s.arb end,
    case when s.totalt < 5 or (s.avsl > 0 and s.avsl < 5) then null else s.avsl end,
    case when s.n < 5 then null else round(s.snitt, 0) end,
    case when s.n < 5 then null else s.n end
  from summa s;
end;
$fn$;

-- Postgres ger PUBLIC execute som standard, och Supabase ger anon ett eget grant:
-- återkalla båda uttryckligen, ge sedan bara authenticated.
revoke all on function public.enhetens_utfall(uuid) from public;
revoke all on function public.enhetens_utfall(uuid) from anon;
grant execute on function public.enhetens_utfall(uuid) to authenticated;

commit;
