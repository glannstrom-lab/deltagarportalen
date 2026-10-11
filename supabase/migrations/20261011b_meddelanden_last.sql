-- PENDING (Mikaels ja krävs) — beslut 2026-10-11: deltagarens meddelanden markeras
-- lästa och konsulenten ser "Läst HH:MM".
--
-- PREMISSEN (mätt i prod 2026-10-11):
--  * consultant_messages har is_read men ingen tidpunkt för läsningen.
--  * UPDATE-policyn "Receivers can update read status" är USING (auth.uid() = receiver_id)
--    utan WITH CHECK. Namnet lovar läsmarkering, men policyn släpper igenom ALLA kolumner:
--    mottagaren kan skriva om innehållet (content) och avsändaren (sender_id) i ett
--    meddelande hen fått — en deltagare kan ändra vad konsulenten "skrev". Kolumnrättigheter
--    hjälper inte (authenticated är samma roll för alla).
--  * Ingen annan UPDATE-väg finns (ingen admin-policy), så en trigger täcker allt.
--
-- VAD FILEN GÖR:
--  1. Ny kolumn read_at.
--  2. BEFORE UPDATE-trigger (INTE definer — den läser inga andra tabeller):
--     · read_at sätts av SERVERN när is_read går false → true, nollas om is_read går
--       tillbaka. Klienten kan inte ange en egen lästid.
--     · När anroparen är en inloggad användare (current_user authenticated/anon) får
--       bara is_read/read_at/updated_at skilja sig mellan gammal och ny rad — annars
--       42501. Definer-funktioner, service_role och cron passerar (samma mönster som
--       profiles_skyddade_kolumner).
--  Policyn lämnas orörd: konsulentvyns markMessagesAsRead och deltagarens nya
--  markering använder den, och triggern gör den smal.
--
-- PRÖVA (rollback) — se kommandot längst ned i den här filen.

begin;

alter table public.consultant_messages
  add column if not exists read_at timestamptz;

create or replace function public.consultant_messages_lasfalt()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $fn$
begin
  -- Lästiden är serverns, aldrig klientens.
  if NEW.is_read is true and OLD.is_read is not true then
    NEW.read_at := now();
  elsif NEW.is_read is not true then
    NEW.read_at := null;
  else
    NEW.read_at := OLD.read_at;
  end if;

  if current_user not in ('authenticated', 'anon') then
    return NEW;
  end if;

  if (to_jsonb(NEW) - 'is_read' - 'read_at' - 'updated_at')
     is distinct from (to_jsonb(OLD) - 'is_read' - 'read_at' - 'updated_at') then
    raise exception 'Bara läsmarkeringen kan ändras på ett meddelande'
      using errcode = '42501';
  end if;

  return NEW;
end;
$fn$;

revoke all on function public.consultant_messages_lasfalt() from public;
revoke all on function public.consultant_messages_lasfalt() from anon;
revoke all on function public.consultant_messages_lasfalt() from authenticated;

drop trigger if exists trg_consultant_messages_lasfalt on public.consultant_messages;
create trigger trg_consultant_messages_lasfalt
  before update on public.consultant_messages
  for each row execute function public.consultant_messages_lasfalt();

commit;

-- Efter körning:
--   cd client && npm run schema:refresh && npm run grants:refresh
--   committa snapshotarna. Ingen flagga: klienten skriver bara is_read och läser
--   read_at via select('*') — före migrationen står "Läst" utan tid, efter "Läst 14:32"
--   (client/src/components/consultant/meddelandeLast.ts).
--
-- Rollback-prov (kördes 2026-10-11 före commit, se slutrapporten):
--   km-deltagare markerar läst → read_at satt av servern; skriver om content → 42501;
--   test@example.com (annan deltagare) uppdaterar → 0 rader; km-konsulent markerar
--   ett meddelande hen SKICKAT → 0 rader (RLS), ett hen fått → read_at satt.
