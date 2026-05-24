-- =============================================================================
-- STA — Sanningsenlig link_status
-- Date: 2026-05-24
--
-- Bugg som fixas: 18 av 30 STA-enrollments hade link_status='linked' trots att
-- personen aldrig signat in på Jobin. Orsaken är att handle_invitation_acceptance
-- (på profiles INSERT) flippade link_status så snart en profile-rad fanns —
-- vilket händer redan när send-invite-email kör auth.admin.inviteUserByEmail
-- (skapar auth.users + profile + invitation används), långt innan personen
-- faktiskt klickar magic-länken och loggar in.
--
-- Ny sanning: link_status='linked' betyder "personen har loggat in på Jobin
-- minst en gång". Innan dess är link_status='invited' (eller 'unlinked' för
-- rent manuella).
--
-- Migrationen gör fyra saker:
--   1. Backfill: rader med participant_id satt men auth.users.last_sign_in_at
--      IS NULL → flippa link_status från 'linked' till 'invited'.
--   2. Skriver om handle_invitation_acceptance så den INTE sätter 'linked'
--      vid profile-creation, och INTE loggar consent där. Den kopplar bara
--      participant_id på enrollment och flyttar consultant_id på profilen.
--   3. Ny trigger handle_first_signin på auth.users UPDATE — när
--      last_sign_in_at flippar från NULL till NOT NULL: sätt link_status='linked'
--      på användarens STA-enrollments + skapa consultant_consents om
--      metadata.consent_text fanns i deras invitation.
--   4. sta_bulk_smart_add: om matchande profile saknar last_sign_in_at,
--      hamna i 'invited'-spåret istället för 'linked'. Default-link_status
--      på sta_enrollments ändras till 'unlinked'.
-- =============================================================================

-- 1. BACKFILL ----------------------------------------------------------------

UPDATE sta_enrollments e
SET link_status = 'invited',
    updated_at = NOW()
WHERE e.link_status = 'linked'
  AND e.participant_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = e.participant_id
      AND u.last_sign_in_at IS NOT NULL
  );

-- 2. SCHEMA DEFAULT ----------------------------------------------------------

ALTER TABLE sta_enrollments
  ALTER COLUMN link_status SET DEFAULT 'unlinked';

-- 3. handle_invitation_acceptance — slopa 'linked'-flippen och consent-loggen
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_invitation_acceptance()
RETURNS TRIGGER AS $$
DECLARE
  invite_record RECORD;
  v_program TEXT;
  v_sta_enrollment_id UUID;
BEGIN
  SELECT * INTO invite_record
  FROM invitations
  WHERE email = NEW.email
    AND used_at IS NULL
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  IF invite_record.id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Markera inbjudan som använd
  UPDATE invitations
  SET used_at = NOW(),
      used_by = NEW.id,
      updated_at = NOW()
  WHERE id = invite_record.id;

  IF invite_record.consultant_id IS NOT NULL THEN
    UPDATE profiles
    SET consultant_id = invite_record.consultant_id
    WHERE id = NEW.id;

    INSERT INTO consultant_participants (
      consultant_id, participant_id, assigned_by, notes
    ) VALUES (
      invite_record.consultant_id, NEW.id, invite_record.invited_by, 'Inbjuden via länk'
    ) ON CONFLICT (consultant_id, participant_id) DO NOTHING;
  END IF;

  v_program := invite_record.metadata->>'program';
  v_sta_enrollment_id := NULLIF(invite_record.metadata->>'sta_enrollment_id', '')::UUID;

  IF v_program IS NOT NULL AND v_program IN ('steg_till_arbete', 'rusta_och_matcha') THEN
    UPDATE profiles
    SET program = v_program
    WHERE id = NEW.id
      AND program IS NULL;
  END IF;

  -- Koppla förskapad STA-enrollment till nya kontot — men behåll link_status='invited'
  -- tills personen faktiskt loggar in. Första-sign-in-triggern flippar till 'linked'.
  IF v_sta_enrollment_id IS NOT NULL AND invite_record.consultant_id IS NOT NULL THEN
    UPDATE sta_enrollments
    SET participant_id = NEW.id,
        external_email = NULL,
        updated_at = NOW()
    WHERE id = v_sta_enrollment_id
      AND consultant_id = invite_record.consultant_id
      AND participant_id IS NULL;
  END IF;

  -- Consent loggas INTE här — det görs av handle_first_signin när personen
  -- faktiskt slutfört inloggningen.

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- 4. handle_first_signin — flippa link_status + logga consent vid första inlogg
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_first_signin()
RETURNS TRIGGER AS $$
DECLARE
  v_invite RECORD;
  v_program TEXT;
  v_consent_text TEXT;
  v_consent_scope JSONB;
  v_consultant_id UUID;
BEGIN
  -- Bara intresserade när last_sign_in_at flippar från NULL → NOT NULL
  IF OLD.last_sign_in_at IS NOT NULL OR NEW.last_sign_in_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Flippa alla användarens 'invited'-enrollments till 'linked'
  UPDATE sta_enrollments
  SET link_status = 'linked',
      updated_at = NOW()
  WHERE participant_id = NEW.id
    AND link_status = 'invited';

  -- Hitta invitation:en som användes (used_by = NEW.id) för att skapa consent.
  -- Om personen kom in via en STA-invitation med consent_text i metadata,
  -- logga consultant_consents nu.
  SELECT * INTO v_invite
  FROM public.invitations
  WHERE used_by = NEW.id
    AND metadata->>'consent_text' IS NOT NULL
    AND consultant_id IS NOT NULL
  ORDER BY used_at DESC NULLS LAST, created_at DESC
  LIMIT 1;

  IF v_invite.id IS NOT NULL THEN
    v_program := v_invite.metadata->>'program';
    v_consent_text := v_invite.metadata->>'consent_text';
    v_consent_scope := COALESCE(v_invite.metadata->'consent_scope', '{}'::jsonb);
    v_consultant_id := v_invite.consultant_id;

    -- Idempotent: skapa bara om det inte redan finns ett aktivt samtycke
    IF NOT EXISTS (
      SELECT 1 FROM public.consultant_consents
      WHERE participant_id = NEW.id
        AND consultant_id = v_consultant_id
        AND COALESCE(program, '') = COALESCE(v_program, '')
        AND revoked_at IS NULL
    ) THEN
      INSERT INTO public.consultant_consents (
        participant_id, consultant_id, program, scope, granted_text, granted_via
      ) VALUES (
        NEW.id, v_consultant_id, v_program,
        v_consent_scope, v_consent_text, 'invitation'
      );
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Logga men låt inte sign-in falla
  RAISE WARNING 'handle_first_signin failed for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

DROP TRIGGER IF EXISTS on_auth_user_first_signin ON auth.users;
CREATE TRIGGER on_auth_user_first_signin
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS NULL AND NEW.last_sign_in_at IS NOT NULL)
  EXECUTE FUNCTION handle_first_signin();

COMMENT ON FUNCTION handle_first_signin IS
  'Flippar STA-enrollments från invited→linked vid första inloggningen och loggar consent från invitations.metadata.';

-- 5. sta_bulk_smart_add — matchad-profile-utan-signin hamnar som invited
-- ----------------------------------------------------------------------------
-- Logik:
--   - Profil existerar OCH last_sign_in_at IS NOT NULL → linked (riktig användare)
--   - Profil existerar men aldrig signat in → invited (skicka mail, vänta på inloggning)
--   - Ingen profil → invited (skapa invitation som tidigare)

CREATE OR REPLACE FUNCTION sta_bulk_smart_add(
  p_rows JSONB,
  p_default_started_at DATE DEFAULT CURRENT_DATE,
  p_current_part INTEGER DEFAULT 1,
  p_consent_text TEXT DEFAULT NULL,
  p_consent_scope JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  email TEXT,
  invitation_id UUID,
  sta_enrollment_id UUID,
  linked_participant_id UUID,
  status TEXT,
  error TEXT
) AS $$
DECLARE
  v_consultant_id UUID;
  v_consultant_role TEXT;
  v_consultant_first TEXT;
  v_consultant_last TEXT;
  v_consultant_email TEXT;
  v_row JSONB;
  v_email TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
  v_started_at DATE;
  v_part INTEGER;
  v_invitation_id UUID;
  v_enrollment_id UUID;
  v_existing_user_id UUID;
  v_existing_has_signin BOOLEAN;
  v_full_name TEXT;
  v_metadata JSONB;
BEGIN
  v_consultant_id := auth.uid();
  IF v_consultant_id IS NULL THEN
    RAISE EXCEPTION 'Inte inloggad' USING ERRCODE = '42501';
  END IF;

  SELECT role, first_name, last_name, profiles.email
    INTO v_consultant_role, v_consultant_first, v_consultant_last, v_consultant_email
    FROM profiles WHERE id = v_consultant_id;
  IF v_consultant_role NOT IN ('CONSULTANT', 'ADMIN', 'SUPERADMIN', 'ARBETSTERAPEUT') THEN
    RAISE EXCEPTION 'Endast konsulenter får lägga till deltagare' USING ERRCODE = '42501';
  END IF;

  v_part := COALESCE(p_current_part, 1);
  IF v_part < 1 OR v_part > 4 THEN
    v_part := 1;
  END IF;

  FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
    v_email := LOWER(TRIM(v_row->>'email'));
    v_first_name := NULLIF(TRIM(COALESCE(v_row->>'first_name', '')), '');
    v_last_name := NULLIF(TRIM(COALESCE(v_row->>'last_name', '')), '');
    BEGIN
      v_started_at := COALESCE(NULLIF(v_row->>'started_at', '')::DATE, p_default_started_at);
    EXCEPTION WHEN OTHERS THEN
      v_started_at := p_default_started_at;
    END;

    v_invitation_id := NULL;
    v_enrollment_id := NULL;
    v_existing_user_id := NULL;
    v_existing_has_signin := FALSE;

    BEGIN
      IF v_email IS NULL OR v_email NOT LIKE '%_@_%.__%' THEN
        email := v_email;
        invitation_id := NULL;
        sta_enrollment_id := NULL;
        linked_participant_id := NULL;
        status := 'error';
        error := 'Ogiltig e-postadress';
        RETURN NEXT;
        CONTINUE;
      END IF;

      v_full_name := TRIM(CONCAT_WS(' ', v_first_name, v_last_name));
      IF v_full_name = '' THEN
        v_full_name := v_email;
      END IF;

      -- Sök befintlig profil OCH om personen faktiskt signat in
      SELECT p.id, (u.last_sign_in_at IS NOT NULL)
        INTO v_existing_user_id, v_existing_has_signin
        FROM profiles p
        LEFT JOIN auth.users u ON u.id = p.id
        WHERE LOWER(p.email) = v_email
        LIMIT 1;

      IF v_existing_user_id IS NOT NULL AND COALESCE(v_existing_has_signin, FALSE) THEN
        -- LINKED — riktig användare med signin-historik
        INSERT INTO sta_enrollments (
          consultant_id, participant_id, external_name, external_email,
          started_at, part_started_at, current_part,
          link_status, status, language_support, communication_support, weekly_hours
        ) VALUES (
          v_consultant_id, v_existing_user_id, NULL, NULL,
          v_started_at, v_started_at, v_part,
          'linked', 'active', '{}', '{}', 25
        )
        RETURNING id INTO v_enrollment_id;

        UPDATE profiles
        SET consultant_id = v_consultant_id
        WHERE id = v_existing_user_id AND consultant_id IS NULL;

        INSERT INTO consultant_participants AS cp (
          consultant_id, participant_id, assigned_by, notes
        ) VALUES (
          v_consultant_id, v_existing_user_id, v_consultant_id, 'Tillagd via CSV/Excel-import'
        ) ON CONFLICT (consultant_id, participant_id) DO NOTHING;

        email := v_email;
        invitation_id := NULL;
        sta_enrollment_id := v_enrollment_id;
        linked_participant_id := v_existing_user_id;
        status := 'linked';
        error := NULL;
        RETURN NEXT;

      ELSIF v_existing_user_id IS NOT NULL THEN
        -- INVITED — profil finns men personen har aldrig loggat in.
        -- Koppla participant_id (vi vet vem hen är), men håll status='invited'
        -- tills första-sign-in-triggern flippar till 'linked'.
        INSERT INTO sta_enrollments (
          consultant_id, participant_id, external_name, external_email,
          started_at, part_started_at, current_part,
          link_status, status, language_support, communication_support, weekly_hours
        ) VALUES (
          v_consultant_id, v_existing_user_id, v_full_name, v_email,
          v_started_at, v_started_at, v_part,
          'invited', 'active', '{}', '{}', 25
        )
        RETURNING id INTO v_enrollment_id;

        UPDATE profiles
        SET consultant_id = v_consultant_id
        WHERE id = v_existing_user_id AND consultant_id IS NULL;

        INSERT INTO consultant_participants AS cp (
          consultant_id, participant_id, assigned_by, notes
        ) VALUES (
          v_consultant_id, v_existing_user_id, v_consultant_id, 'Tillagd via CSV/Excel-import (väntar på inloggning)'
        ) ON CONFLICT (consultant_id, participant_id) DO NOTHING;

        -- Skapa även en invitation med ny token så konsulenten kan skicka ny länk
        v_metadata := jsonb_build_object(
          'first_name', v_first_name,
          'last_name', v_last_name,
          'program', 'steg_till_arbete',
          'sta_enrollment_id', v_enrollment_id::text,
          'consent_text', p_consent_text,
          'consent_scope', p_consent_scope,
          'consultant_first_name', v_consultant_first,
          'consultant_last_name', v_consultant_last,
          'consultant_email', v_consultant_email,
          'resend_for_existing_user', true
        );

        INSERT INTO invitations (
          email, role, invited_by, consultant_id, metadata
        ) VALUES (
          v_email, 'USER', v_consultant_id, v_consultant_id, v_metadata
        )
        RETURNING id INTO v_invitation_id;

        email := v_email;
        invitation_id := v_invitation_id;
        sta_enrollment_id := v_enrollment_id;
        linked_participant_id := v_existing_user_id;
        status := 'invited';
        error := NULL;
        RETURN NEXT;

      ELSE
        -- INVITED — ingen profil alls, vanlig invitation-flow
        INSERT INTO sta_enrollments (
          consultant_id, external_name, external_email,
          started_at, part_started_at, current_part,
          link_status, status, language_support, communication_support, weekly_hours
        ) VALUES (
          v_consultant_id, v_full_name, v_email,
          v_started_at, v_started_at, v_part,
          'invited', 'active', '{}', '{}', 25
        )
        RETURNING id INTO v_enrollment_id;

        v_metadata := jsonb_build_object(
          'first_name', v_first_name,
          'last_name', v_last_name,
          'program', 'steg_till_arbete',
          'sta_enrollment_id', v_enrollment_id::text,
          'consent_text', p_consent_text,
          'consent_scope', p_consent_scope,
          'consultant_first_name', v_consultant_first,
          'consultant_last_name', v_consultant_last,
          'consultant_email', v_consultant_email
        );

        INSERT INTO invitations (
          email, role, invited_by, consultant_id, metadata
        ) VALUES (
          v_email, 'USER', v_consultant_id, v_consultant_id, v_metadata
        )
        RETURNING id INTO v_invitation_id;

        email := v_email;
        invitation_id := v_invitation_id;
        sta_enrollment_id := v_enrollment_id;
        linked_participant_id := NULL;
        status := 'invited';
        error := NULL;
        RETURN NEXT;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      IF v_enrollment_id IS NOT NULL AND v_invitation_id IS NULL AND v_existing_user_id IS NULL THEN
        DELETE FROM sta_enrollments WHERE id = v_enrollment_id;
      END IF;
      email := v_email;
      invitation_id := v_invitation_id;
      sta_enrollment_id := v_enrollment_id;
      linked_participant_id := v_existing_user_id;
      status := 'error';
      error := SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

COMMENT ON FUNCTION sta_bulk_smart_add(JSONB, DATE, INTEGER, TEXT, JSONB) IS
  'CSV/Excel-import: linked = matchad profile MED signin-historik. Invited = matchad profile utan signin ELLER ingen profile alls. First-sign-in-triggern flippar invited→linked när personen faktiskt loggar in.';

REVOKE EXECUTE ON FUNCTION sta_bulk_smart_add(JSONB, DATE, INTEGER, TEXT, JSONB) FROM anon, public;
GRANT EXECUTE ON FUNCTION sta_bulk_smart_add(JSONB, DATE, INTEGER, TEXT, JSONB) TO authenticated;
