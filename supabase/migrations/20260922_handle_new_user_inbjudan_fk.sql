-- KÖRD mot prod 2026-09-22 kväll (Mikaels ja till BP3/BP4 — detta är rättelsen som fick dem att fungera).
--
-- PROBLEM (hittat vid röktestet av BP3/BP4 i en återrullad transaktion):
--   handle_new_user() gjorde UPDATE invitations SET used_by = NEW.id INNAN profilen
--   skapats. invitations_used_by_fkey pekar på profiles(id) → 23503, huvudblocket
--   rullades tillbaka och EXCEPTION WHEN OTHERS skapade en minimal profil.
--   Följd för VARJE registrering via inbjudan: för-/efternamn saknas, samtyckena
--   (terms/privacy/ai) loggas inte och sätts inte på profilen, och inbjudans roll
--   ignoreras (alltid USER). Konsulentkopplingen fungerade bara för att
--   handle_invitation_acceptance råkade hitta den omarkerade inbjudan.
--
-- ÄNDRING: handle_new_user läser inbjudan men markerar den inte. Allt annat är
-- identiskt med 20260922_samtycke_loggas_dubbelt_vid_registrering.sql.

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
      -- Inbjudan markeras INTE här. invitations.used_by har FK mot profiles, och
      -- profilen finns inte än: UPDATE:n gav 23503, hela huvudblocket rullades
      -- tillbaka och varje inbjuden registrering tog reservvägen (inga namn,
      -- inga samtycken, alltid rollen USER). handle_invitation_acceptance
      -- (AFTER INSERT på profiles) markerar den och skapar konsulentkopplingen.
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
