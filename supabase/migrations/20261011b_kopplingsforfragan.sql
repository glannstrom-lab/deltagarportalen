-- PENDING (Mikaels ja krävs) — beslut 2026-10-11: kopplingsförfrågan till en deltagare
-- som redan har ett konto.
--
-- VARFÖR CR1 AVSKREVS 2026-09-29, OCH HUR DET HANTERAS HÄR
--  1. Ingen deltagarvy läste consultant_requests      → Min konsulent visar förfrågan
--     (Kopplingsforfragan.tsx) + en notis skapas.
--  2. UPDATE-policyn saknade WITH CHECK, så ett svar
--     kunde aldrig sparas                              → deltagaren svarar ENBART via
--     RPC:n besvara_kopplingsforfragan (definer). Ingen UPDATE-policy finns eller läggs till.
--  3. Den gamla accept-funktionen satte bara
--     profiles.consultant_id och kringgick
--     samtyckesloggen                                  → ett ja skriver koppling, rad i
--     consultant_participants OCH samtycke (consultant_consents, granted_via
--     'consultant_request', med texten deltagaren läste) i samma transaktion.
--  4. Spåret duplicerade consultant_consents           → förfrågan är bara ett väntrum;
--     samtycket bor där det alltid bott.
--
-- INGEN ANVÄNDARUPPRÄKNING
--  Konsulenten gör samma sak oavsett om adressen har ett konto: en rad i invitations
--  (befintlig policy, oförändrad klientkod). Triggern nedan avgör på serversidan om en
--  förfrågan ska skapas. Konsulenten kan inte se den:
--   · SELECT- och INSERT-policyerna för konsulenten på consultant_requests tas bort
--     (raden bär participant_id — att kunna läsa den vore att avslöja kontot).
--   · Inbjudningsraden ser likadan ut i båda fallen (triggern rör den inte).
--   · send-invite-email skickar ett "logga in och svara"-mejl när en väntande förfrågan
--     finns, i stället för generateLink, och svarar 200 i båda fallen.
--  Konsulenten får veta något först när deltagaren SAGT JA (notis). Ett nej meddelas inte.
--
-- PREMISSEN (mätt i prod 2026-10-11):
--  * profiles har bara SELECT för konsulenten på egna deltagare (consultant_id = uid).
--    Dialogens "finns kontot?"-uppslag hittade alltså bara egna deltagare; varje annat
--    befintligt konto fick en vanlig inbjudan, generateLink föll på "already registered"
--    och dialogen sa "mejlet kunde inte skickas" — dvs. kontot gick att räkna fram ändå,
--    och kopplingen blev aldrig av.
--  * consultant_requests: 1 rad (ACCEPTED), unik (consultant_id, participant_id),
--    status CHECK PENDING/ACCEPTED/DECLINED. Policyer: konsulentens INSERT + SELECT,
--    deltagarens SELECT.
--  * profiles_skyddade_kolumner släpper igenom consultant_id-byten bara när
--    current_user inte är authenticated/anon — dvs. från definer-funktioner.
--
-- RÄTTIGHETER: besvara_kopplingsforfragan når authenticated (+1 mot AUTH_TAK i
-- client/scripts/lint-grants.cjs — höj 26 → 27 med motiveringen: tar ett förfrågnings-id,
-- inget användar-id; kräver participant_id = auth.uid()). Triggerfunktionen revokeras från
-- alla roller — triggers avfyras ändå.

begin;

-- 1. Namnen deltagaren behöver för att kunna svara. Hon kan inte läsa konsulentens
--    profil (UX12), så de skrivs in när förfrågan skapas.
alter table public.consultant_requests
  add column if not exists konsulent_namn text,
  add column if not exists organisation_namn text;

-- 2. Konsulenten ser och skapar inte längre rader själv.
drop policy if exists "Consultants can view own requests" on public.consultant_requests;
drop policy if exists "Consultants can create requests" on public.consultant_requests;

-- 3. Triggern som skapar förfrågan när en konsulent bjuder in en befintlig deltagare.
create or replace function public.invitations_kopplingsforfragan()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_deltagare uuid;
  v_roll text;
  v_nuvarande uuid;
  v_namn text;
  v_org text;
begin
  -- Bara deltagarinbjudningar som konsulenten gör åt sig själv (inte kollega/företag,
  -- och inte en inbjudan där consultant_id pekar på någon annan än inbjudaren).
  if NEW.role is distinct from 'USER'
     or NEW.consultant_id is null
     or NEW.consultant_id is distinct from NEW.invited_by
     or coalesce(NEW.metadata->>'kind', '') <> '' then
    return NEW;
  end if;

  -- Demokontot delas öppet — det får aldrig nå en riktig persons notiser.
  if exists (
    select 1 from organization_members m join organizations o on o.id = m.org_id
     where m.user_id = NEW.consultant_id and coalesce(o.is_demo, false)
  ) then
    return NEW;
  end if;

  select p.id, p.role, p.consultant_id
    into v_deltagare, v_roll, v_nuvarande
    from profiles p
   where lower(p.email) = lower(btrim(NEW.email))
   limit 1;

  -- Inget konto, ett personalkonto, eller redan kopplad till den här konsulenten:
  -- inbjudan går som vanligt och ingen förfrågan skapas.
  if v_deltagare is null
     or v_roll is distinct from 'USER'
     or v_deltagare = NEW.consultant_id
     or v_nuvarande is not distinct from NEW.consultant_id then
    return NEW;
  end if;

  select nullif(btrim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')), '')
    into v_namn
    from profiles where id = NEW.consultant_id;

  select string_agg(distinct o.name, ', ')
    into v_org
    from organization_members m join organizations o on o.id = m.org_id
   where m.user_id = NEW.consultant_id;

  insert into consultant_requests
    (consultant_id, participant_id, status, message, created_at, responded_at, konsulent_namn, organisation_namn)
  values
    (NEW.consultant_id, v_deltagare, 'PENDING',
     nullif(btrim(coalesce(NEW.metadata->>'message', '')), ''),
     now(), null, v_namn, v_org)
  on conflict (consultant_id, participant_id) do update
     set status = 'PENDING',
         message = excluded.message,
         created_at = now(),
         responded_at = null,
         konsulent_namn = excluded.konsulent_namn,
         organisation_namn = excluded.organisation_namn;

  insert into notifications (user_id, type, title, message, action_url, data)
  values (
    v_deltagare,
    'kopplingsforfragan',
    'En konsulent vill koppla dig',
    coalesce(v_namn, 'En konsulent') || ' vill bli din konsulent i Jobin. Inget delas förrän du har sagt ja.',
    '/my-consultant',
    jsonb_build_object('consultant_id', NEW.consultant_id)
  );

  return NEW;
end;
$fn$;

revoke all on function public.invitations_kopplingsforfragan() from public;
revoke all on function public.invitations_kopplingsforfragan() from anon;
revoke all on function public.invitations_kopplingsforfragan() from authenticated;

drop trigger if exists trg_invitations_kopplingsforfragan on public.invitations;
create trigger trg_invitations_kopplingsforfragan
  after insert on public.invitations
  for each row execute function public.invitations_kopplingsforfragan();

-- 4. Deltagarens svar — den enda vägen.
create or replace function public.besvara_kopplingsforfragan(
  p_id uuid,
  p_ja boolean,
  p_samtyckestext text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  v_uid uuid := auth.uid();
  r consultant_requests%rowtype;
  v_tidigare uuid;
  v_samtycke uuid;
  v_epost text;
  v_namn text;
begin
  if v_uid is null then
    raise exception 'Inte inloggad' using errcode = '42501';
  end if;

  select * into r
    from consultant_requests
   where id = p_id and participant_id = v_uid
   for update;

  -- Samma svar för "finns inte" och "inte din" — ingen ska kunna pröva id:n.
  if r.id is null then
    raise exception 'Förfrågan finns inte' using errcode = 'P0002';
  end if;
  if r.status <> 'PENDING' then
    raise exception 'Förfrågan är redan besvarad' using errcode = '22023';
  end if;

  if not p_ja then
    update consultant_requests set status = 'DECLINED', responded_at = now() where id = r.id;
    return jsonb_build_object('status', 'DECLINED');
  end if;

  if r.consultant_id is null or not exists (
    select 1 from profiles where id = r.consultant_id and role in ('CONSULTANT', 'ADMIN', 'SUPERADMIN')
  ) then
    raise exception 'Konsulenten finns inte längre i Jobin' using errcode = '22023';
  end if;

  -- Texten är bevisningen (art. 7.1) — samma regel som grant_consultant_consent.
  if p_samtyckestext is null or btrim(p_samtyckestext) = '' then
    raise exception 'Samtyckestexten maste sparas med samtycket' using errcode = '22023';
  end if;

  -- Har hon en annan konsulent avslutas den kopplingen först, med samma funktion som
  -- "Säg upp kopplingen" (tar bort raden i consultant_participants och återkallar samtycket).
  select consultant_id, email, nullif(btrim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')), '')
    into v_tidigare, v_epost, v_namn
    from profiles where id = v_uid;

  if v_tidigare is not null and v_tidigare <> r.consultant_id then
    perform public.revoke_consultant_link(v_tidigare, 'Bytte konsulent: sa ja till en kopplingsförfrågan');
  end if;

  update profiles set consultant_id = r.consultant_id where id = v_uid;

  insert into consultant_participants (consultant_id, participant_id, assigned_by, notes)
  values (r.consultant_id, v_uid, r.consultant_id, 'Kopplad via kopplingsförfrågan')
  on conflict (consultant_id, participant_id) do nothing;

  select id into v_samtycke
    from consultant_consents
   where participant_id = v_uid and consultant_id = r.consultant_id and revoked_at is null
   limit 1;

  if v_samtycke is null then
    insert into consultant_consents
      (participant_id, consultant_id, program, scope, granted_text, granted_via)
    values
      (v_uid, r.consultant_id,
       (select program from profiles where id = v_uid),
       jsonb_build_object('kalla', 'kopplingsforfragan', 'version', '2026-10-11', 'request_id', r.id),
       p_samtyckestext, 'consultant_request')
    returning id into v_samtycke;
  end if;

  update consultant_requests set status = 'ACCEPTED', responded_at = now() where id = r.id;

  -- Inbjudningen som bar förfrågan räknas som använd.
  update invitations
     set used_at = coalesce(used_at, now()), used_by = v_uid, updated_at = now()
   where consultant_id = r.consultant_id
     and lower(email) = lower(v_epost)
     and used_at is null;

  insert into notifications (user_id, type, title, message, action_url, data)
  values (
    r.consultant_id,
    'kopplingsforfragan_ja',
    'Kopplingen är klar',
    coalesce(v_namn, 'Deltagaren') || ' har sagt ja till din kopplingsförfrågan.',
    '/consultant/participants/' || v_uid::text,
    jsonb_build_object('participant_id', v_uid)
  );

  return jsonb_build_object('status', 'ACCEPTED', 'consent_id', v_samtycke);
end;
$fn$;

revoke all on function public.besvara_kopplingsforfragan(uuid, boolean, text) from public;
revoke all on function public.besvara_kopplingsforfragan(uuid, boolean, text) from anon;
grant execute on function public.besvara_kopplingsforfragan(uuid, boolean, text) to authenticated;

commit;

-- Efter körning:
--   cd client && npm run schema:refresh && npm run grants:refresh
--   höj AUTH_TAK 26 → 27 i client/scripts/lint-grants.cjs med motiveringen ovan
--   sätt KOPPLINGSFORFRAGAN_FINNS = true i client/src/services/kopplingsforfraganApi.ts
--   mät: select has_function_privilege('anon', 'public.besvara_kopplingsforfragan(uuid,boolean,text)', 'EXECUTE');  -> false
--        select has_function_privilege('authenticated', 'public.besvara_kopplingsforfragan(uuid,boolean,text)', 'EXECUTE'); -> true
--        select has_function_privilege('authenticated', 'public.invitations_kopplingsforfragan()', 'EXECUTE');  -> false
