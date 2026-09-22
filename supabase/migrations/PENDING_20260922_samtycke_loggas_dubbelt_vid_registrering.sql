-- PENDING — KÖRS INTE UTAN MIKAELS JA (trigger på auth.users mot prod).
-- Förslag från databaspasset 2026-09-22.
--
-- PROBLEM: varje samtycke som ges vid registrering loggas TVÅ gånger i consent_history.
--   handle_new_user() (auth.users AFTER INSERT) gör INSERT INTO profiles med
--   terms_accepted_at/privacy_accepted_at/ai_consent_at satta, och skriver
--   SEDAN själv 'granted'-rader i consent_history. Men AFTER INSERT-triggern
--   log_consent_changes (log_consent_column_change) på profiles skriver redan
--   en rad per satt kolumn — "Ett konto som skapas med terms_accepted_at satt
--   har gett samtycket i det ögonblicket och ska få sin rad" (A30).
--   grant_consent har kommentaren "Lägg inte tillbaka ett INSERT här — då
--   loggas varje samtycke två gånger"; handle_new_user fick aldrig samma rättelse.
-- BELÄGG (prod 2026-09-22, aggregat): 9 av 20 konton skapade i september
--   (inga demokonton) har ≥ 2 'terms granted'-rader inom ±5 s från
--   profilens created_at; totalt 50 'granted'-rader för de nio (≈ 3 samtycken × 2).
--   Registret (art. 7.1 — kunna visa att samtycke gavs) påstår alltså två
--   samtyckeshandlingar där det fanns en.
--
-- ÄNDRING: enda skillnaden mot prod-versionen är att consent_history-blocket
-- tas bort (triggern på profiles äger loggningen), och att inbjudan slås upp
-- skiftlägesokänsligt (invitations sparas lower(trim()) av
-- employer_invitations_insert och sta_bulk_*) med den nyaste först.
-- Befintliga dubbletter rörs INTE här — det är bevisdata; beslut om ev.
-- märkning tas separat.

BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record RECORD;
  user_role TEXT DEFAULT 'USER';
  user_consultant_id UUID DEFAULT NULL;
  consent_timestamp TIMESTAMPTZ DEFAULT NOW();
BEGIN
  BEGIN
    SELECT * INTO invite_record
    FROM invitations
    WHERE lower(email) = lower(NEW.email)
      AND used_at IS NULL
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;

    IF invite_record.id IS NOT NULL THEN
      user_role := invite_record.role;
      user_consultant_id := invite_record.consultant_id;

      UPDATE invitations
      SET used_at = NOW(), used_by = NEW.id
      WHERE id = invite_record.id;
    END IF;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  INSERT INTO public.profiles (
    id, email, first_name, last_name, role, roles, active_role, consultant_id,
    terms_accepted_at, privacy_accepted_at, ai_consent_at, created_at, updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    user_role,
    ARRAY[user_role]::TEXT[],
    user_role,
    user_consultant_id,
    CASE WHEN (NEW.raw_user_meta_data->>'terms_accepted')::boolean = true THEN consent_timestamp ELSE NULL END,
    CASE WHEN (NEW.raw_user_meta_data->>'privacy_accepted')::boolean = true THEN consent_timestamp ELSE NULL END,
    CASE WHEN (NEW.raw_user_meta_data->>'ai_consent')::boolean = true THEN consent_timestamp ELSE NULL END,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    terms_accepted_at = COALESCE(profiles.terms_accepted_at, EXCLUDED.terms_accepted_at),
    privacy_accepted_at = COALESCE(profiles.privacy_accepted_at, EXCLUDED.privacy_accepted_at),
    ai_consent_at = COALESCE(profiles.ai_consent_at, EXCLUDED.ai_consent_at),
    updated_at = NOW();

  -- consent_history skrivs av triggern log_consent_changes på profiles (A30).
  -- Lägg inte tillbaka ett INSERT här — då loggas varje samtycke två gånger.

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_new_user for %: %', NEW.id, SQLERRM;
  BEGIN
    INSERT INTO public.profiles (id, email, role, created_at, updated_at)
    VALUES (NEW.id, NEW.email, 'USER', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Fallback profile creation also failed for %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

COMMIT;

-- VERIFIERING: registrera ett testkonto med terms+privacy, sedan
--   select consent_type, count(*) from consent_history where user_id=<id> group by 1; → 1 per typ
-- Kör tillsammans med PENDING_20260922_inbjudan_ratelimit_radering.sql DEL 1
-- (handle_invitation_acceptance hittar inbjudan via used_by = NEW.id).
