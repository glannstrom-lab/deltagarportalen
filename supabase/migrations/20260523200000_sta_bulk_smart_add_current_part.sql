-- ============================================
-- sta_bulk_smart_add: lägg till p_current_part-parameter
-- Date: 2026-05-23
--
-- Tidigare bug: bulk-import hardkodade current_part=1 vilket är fel om
-- konsulenten importerar deltagare som redan är i Del 2-4. Mikael
-- rapporterade att alla importerade deltagare visades som Del 1 trots
-- att verkligheten varierade.
--
-- Fix: lägg till valfri p_current_part-parameter (default 1).
-- Använd nytt funktions-namn för att inte krocka med befintlig signatur.
-- ============================================

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

  -- Validera del (default 1, accepterar 1-4)
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

      SELECT id INTO v_existing_user_id
        FROM profiles
        WHERE LOWER(profiles.email) = v_email
        LIMIT 1;

      IF v_existing_user_id IS NOT NULL THEN
        -- LINKED — direkt koppling
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

      ELSE
        -- INVITED — placeholder + invitation
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

-- Den nya signaturen ersätter den gamla 4-arg-versionen
DROP FUNCTION IF EXISTS sta_bulk_smart_add(JSONB, DATE, TEXT, JSONB);

COMMENT ON FUNCTION sta_bulk_smart_add(JSONB, DATE, INTEGER, TEXT, JSONB) IS
  'CSV/Excel-import: per rad försök koppla befintlig Jobin-user direkt, annars skapa invitation. Returnerar linked|invited|error per rad. p_current_part styr vilken del nya deltagare startas i (default 1).';

REVOKE EXECUTE ON FUNCTION sta_bulk_smart_add(JSONB, DATE, INTEGER, TEXT, JSONB) FROM anon, public;
GRANT EXECUTE ON FUNCTION sta_bulk_smart_add(JSONB, DATE, INTEGER, TEXT, JSONB) TO authenticated;
