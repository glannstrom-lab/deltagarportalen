-- KÖRD mot prod 2026-09-22 kväll (Mikaels ja). Verifierad — se commit och 20260922_handle_new_user_inbjudan_fk.sql.
-- Förslag från databaspasset 2026-09-22.
--
-- PROBLEM 1 — profiles.email går att skriva om av användaren själv.
--   Policyn "Users can update own profile safely" har
--   WITH CHECK check_role_change_allowed(id, role, roles, active_role) — den
--   vaktar bara rollfälten. authenticated har UPDATE på alla 46 kolumner
--   (information_schema.column_privileges 2026-09-22). Ingen trigger vaktar
--   email eller consultant_id.
--   profiles.email är det tre SECURITY DEFINER-funktioner slår upp personer på:
--     employer_invitations_insert   (lower(p.email) = lower(NEW.email) → blir medlem i företagskontot)
--     organization_colleagues_iud    (samma → blir medlem i kommunens/leverantörens organisation)
--     sta_bulk_smart_add             (samma → kopplas till konsulent)
--   Scenario: X sätter sin profiles.email till 'kontakt@foretaget.se' innan
--   konsulenten bjuder in företagets riktiga kontakt. Triggern hittar X:s konto
--   ("Finns kontot redan? Då blir personen medlem direkt") och X blir
--   organization_members i företagskontot → läser vyn employer_proposals
--   (deltagares CV-sammanfattning, erfarenhet, kontaktuppgifter).
--   Bieffekt: den riktiga personen kan sedan inte få någon profilrad alls —
--   profiles_email_key (unik) gör att handle_new_user faller, och fallbacken
--   faller på samma unika index (bara en RAISE WARNING).
--   Idag avviker 0 av 112 profiler från auth.users.email — ingen har gjort det.
--
-- PROBLEM 2 — profiles.consultant_id går att sätta till valfri konsulent.
--   Följd: get_my_consultant() lämnar ut den konsulentens e-post och telefon,
--   grant_consultant_consent skriver en samtyckesrad mot en konsulent som
--   aldrig haft relationen, och reset_demo_org raderar varje natt auth-kontot
--   för den som pekar på demokonsulenten.
--
-- PROBLEM 3 — consultant_consents: deltagaren kan skriva om beviset.
--   UPDATE-policyn "Deltagaren uppdaterar revoked_at på sina samtycken" har
--   bara USING (auth.uid() = participant_id) — alla kolumner, även
--   granted_text, granted_at, scope och consultant_id, går att ändra. Namnet
--   lovar revoked_at. Klienten skriver aldrig direkt (allt går via
--   revoke_consultant_link / grant_consultant_consent, båda SECURITY DEFINER).
--
-- Lösningen använder current_user: inne i en SECURITY DEFINER-funktion är det
-- ägaren (postgres), vid ett direkt PostgREST-anrop 'authenticated'. Legitima
-- serverflöden (revoke_consultant_link, handle_new_user, seed_demo_org,
-- organization_handover_insert, accept_consultant_request) påverkas därför inte.

BEGIN;

CREATE OR REPLACE FUNCTION public.profiles_skyddade_kolumner()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;               -- definer-funktioner, service_role, cron
  END IF;
  IF is_admin_or_superadmin() THEN
    RETURN NEW;
  END IF;

  IF NEW.email IS DISTINCT FROM OLD.email
     AND lower(coalesce(NEW.email, '')) IS DISTINCT FROM lower(coalesce(auth.jwt() ->> 'email', '')) THEN
    RAISE EXCEPTION 'E-postadressen ändras via kontoinställningarna, inte i profilen'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.consultant_id IS DISTINCT FROM OLD.consultant_id THEN
    RAISE EXCEPTION 'Konsulentkopplingen ändras bara via inbjudan eller återkallelse'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.profiles_skyddade_kolumner() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_profiles_skyddade_kolumner ON public.profiles;
CREATE TRIGGER trg_profiles_skyddade_kolumner
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_skyddade_kolumner();

-- Samtyckesraden är bevisning. Deltagaren återkallar via revoke_consultant_link.
DROP POLICY IF EXISTS "Deltagaren uppdaterar revoked_at på sina samtycken" ON public.consultant_consents;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.consultant_consents FROM anon;

COMMIT;

-- VERIFIERING:
--   select tgname from pg_trigger where tgrelid='public.profiles'::regclass and tgname='trg_profiles_skyddade_kolumner'; → 1 rad
--   select count(*) from pg_policy where polrelid='public.consultant_consents'::regclass and polcmd='w'; → 0
-- RÖKTEST mot prod (testkonto):
--   PATCH /rest/v1/profiles?id=eq.<eget id> {"email":"annan@example.com"}  → 403/42501
--   PATCH samma med {"first_name":"X"}                                    → 204 (oförändrat beteende)
--   Konsulentvyn: "ändra status" på deltagare                              → fungerar (consultant_id orört)
--   Min konsulent → "Avsluta kopplingen" (revoke_consultant_link)          → fungerar (definer)
-- EFTERÅT: npm run grants:refresh, committa snapshoten.
