-- EJ KÖRD — väntar på ja (FN13, gemensamt arbetsgivarregister).
--
-- Varför en funktion: consultant_work_placements har bara två SELECT-policyer —
-- deltagaren själv och har_aktiv_relation(participant_id), som kräver en rad i
-- consultant_participants för den INLOGGADE konsulenten. En kollegas platser syns
-- alltså inte (mätt mot pg_policies 2026-10-31). Funktionen ger organisationens
-- personal en vy över FIRMAUPPGIFTER och inget annat:
--   * ingen deltagare, ingen kontaktperson/telefon/e-post (DP1),
--   * org.nr bara för organisationsnummer — aldrig för enskild firma, vars org.nr
--     är innehavarens personnummer (DP2). Allt som inte med säkerhet är ett
--     organisationsnummer (3:e siffran >= 2, tio siffror) lämnas som NULL,
--   * "senast ändrad" = platsens updated_at (det finns inget eget kontaktdatum).
-- Regeln speglar client/src/lib/arbetsgivarregister.ts — ändra dem tillsammans.
--
-- Anroparen måste vara personal (konsulent/handlaggare/chef/admin) i p_org.
-- Platser räknas bara för konsulenter som själva är personal i samma organisation.
--
-- Efter körning: npm run schema:refresh och npm run grants:refresh i client/,
-- committa snapshotarna i SAMMA commit, byt RPC_NAMN till literalen i
-- client/src/services/arbetsgivarregisterApi.ts och sätt ARBETSGIVARREGISTER_FINNS
-- = true. OBS lint:grants har ett fryst tak för authenticated (26): en ny anropbar
-- definer-funktion höjer det — ta beslutet medvetet.
--
-- REVOKE FROM PUBLIC räcker inte: Supabase ger anon ett eget grant på nya
-- funktioner. Därför revokeras anon explicit och utfallet mäts i slutet.

begin;

create or replace function public.arbetsgivarregister(p_org uuid)
returns table (
  foretag_namn text,
  org_nr text,
  antal_platser integer,
  senast_andrad timestamptz,
  agare_id uuid,
  agare_namn text
)
language plpgsql
security definer
set search_path = public
stable
as $fn$
begin
  if auth.uid() is null then
    raise exception 'Inte inloggad' using errcode = '42501';
  end if;

  if not exists (
    select 1 from organization_members me
    where me.org_id = p_org
      and me.user_id = auth.uid()
      and me.role in ('konsulent', 'handlaggare', 'chef', 'admin')
  ) then
    raise exception 'Bara personal i organisationen får se arbetsgivarregistret' using errcode = '42501';
  end if;

  return query
  with personal as (
    select m.user_id from organization_members m
    where m.org_id = p_org and m.role in ('konsulent', 'handlaggare', 'chef', 'admin')
  ),
  plats as (
    select
      pl.consultant_id,
      pl.company_name,
      pl.updated_at,
      -- tio siffror; tolvsiffrigt (19xx/20xx) kortas
      case
        when length(regexp_replace(coalesce(pl.org_number, ''), '\D', '', 'g')) = 12
          then substr(regexp_replace(pl.org_number, '\D', '', 'g'), 3)
        else regexp_replace(coalesce(pl.org_number, ''), '\D', '', 'g')
      end as siffror,
      -- namnnyckel: gemener, utan bolagsform och skiljetecken
      regexp_replace(
        regexp_replace(
          regexp_replace(lower(trim(pl.company_name)), '[.,]', ' ', 'g'),
          '(^(aktiebolaget|aktiebolag|ab)\s+)|(\s+(aktiebolag|ab|hb|kb|handelsbolag|kommanditbolag|ekonomisk\s+förening)$)',
          '', 'g'),
        '[^[:alnum:]]', '', 'g') as namnkey
    from consultant_work_placements pl
    where pl.consultant_id in (select user_id from personal)
      and pl.company_name is not null and btrim(pl.company_name) <> ''
  ),
  med_nyckel as (
    select p.*,
      -- giltigt organisationsnummer: tio siffror, 3:e siffran >= 2, namnet säger inte enskild firma
      case
        when length(p.siffror) = 10
         and substr(p.siffror, 3, 1) >= '2'
         and p.company_name !~* '\m(enskild\s+firma|firma)\M'
        then p.siffror
      end as orgnr_ok,
      case when length(p.siffror) = 10 then 'org:' || p.siffror else 'namn:' || p.namnkey end as grupp
    from plats p
    where length(p.siffror) = 10 or p.namnkey <> ''
  ),
  grupperat as (
    select
      m.grupp,
      count(*)::integer as antal,
      max(m.updated_at) as senast,
      -- visas bara om VARJE rad i gruppen är ett giltigt organisationsnummer (en enda enskild-firma-rad släcker det)
      case when count(m.orgnr_ok) = count(*) then max(m.orgnr_ok) end as orgnr
    from med_nyckel m
    group by m.grupp
  ),
  senaste as (
    select distinct on (m.grupp)
      m.grupp, m.company_name, m.consultant_id
    from med_nyckel m
    order by m.grupp, m.updated_at desc
  )
  select
    s.company_name,
    case when g.orgnr is not null then substr(g.orgnr, 1, 6) || '-' || substr(g.orgnr, 7) end,
    g.antal,
    g.senast,
    s.consultant_id,
    nullif(btrim(coalesce(pr.first_name, '') || ' ' || coalesce(pr.last_name, '')), '')
  from grupperat g
  join senaste s on s.grupp = g.grupp
  left join profiles pr on pr.id = s.consultant_id
  order by g.senast desc;
end;
$fn$;

revoke all on function public.arbetsgivarregister(uuid) from public;
revoke all on function public.arbetsgivarregister(uuid) from anon;
grant execute on function public.arbetsgivarregister(uuid) to authenticated;

-- Mät utfallet, inte kommandot (ska ge false / true):
--   select has_function_privilege('anon', 'public.arbetsgivarregister(uuid)', 'EXECUTE'),
--          has_function_privilege('authenticated', 'public.arbetsgivarregister(uuid)', 'EXECUTE');

commit;
