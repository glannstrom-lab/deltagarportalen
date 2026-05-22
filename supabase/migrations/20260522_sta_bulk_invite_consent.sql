-- =============================================================================
-- STA — Bulk-invite, samtycke och uppsägning av konsulent-koppling
-- =============================================================================
-- Lägger till:
--   1. consultant_consents — informerat samtycke vid kopplingsacceptans
--   2. sta_bulk_invite() — RPC som skapar invitations + sta_enrollments i en batch
--   3. revoke_consultant_link() — deltagaren säger upp kopplingen själv
--   4. Utökad handle_invitation_acceptance — STA-aktivering via metadata.program
--      och uppdatering av redan skapad sta_enrollment via metadata.sta_enrollment_id
-- =============================================================================

-- =============================================================================
-- TABELL: consultant_consents
-- =============================================================================
-- En rad per gång deltagaren samtycker till en koppling. revoked_at sätts vid
-- uppsägning. scope beskriver vilken data deltagaren godkänt att dela.
CREATE TABLE IF NOT EXISTS consultant_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  consultant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program TEXT,                         -- 'steg_till_arbete' om STA-specifikt samtycke
  scope JSONB NOT NULL DEFAULT '{}',    -- { data_categories: [...], purposes: [...] }
  granted_text TEXT,                    -- exakt UI-text som visades vid samtycke (juridiskt bevis)
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_via TEXT NOT NULL DEFAULT 'invitation'
    CHECK (granted_via IN ('invitation', 'consultant_request', 'manual_link')),
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,                  -- valfri kommentar från deltagaren
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultant_consents_participant ON consultant_consents(participant_id);
CREATE INDEX IF NOT EXISTS idx_consultant_consents_consultant ON consultant_consents(consultant_id);
CREATE INDEX IF NOT EXISTS idx_consultant_consents_active
  ON consultant_consents(participant_id, consultant_id)
  WHERE revoked_at IS NULL;

ALTER TABLE consultant_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deltagaren ser sina samtycken" ON consultant_consents;
CREATE POLICY "Deltagaren ser sina samtycken"
  ON consultant_consents FOR SELECT
  USING (auth.uid() = participant_id);

DROP POLICY IF EXISTS "Konsulent ser samtycken som rör hen" ON consultant_consents;
CREATE POLICY "Konsulent ser samtycken som rör hen"
  ON consultant_consents FOR SELECT
  USING (auth.uid() = consultant_id);

DROP POLICY IF EXISTS "Deltagaren uppdaterar revoked_at på sina samtycken" ON consultant_consents;
CREATE POLICY "Deltagaren uppdaterar revoked_at på sina samtycken"
  ON consultant_consents FOR UPDATE
  USING (auth.uid() = participant_id);

COMMENT ON TABLE consultant_consents IS
  'Informerat samtycke från deltagare till konsulent. En aktiv rad (revoked_at IS NULL) per (deltagare, konsulent, program). granted_text bevarar exakt UI-text för juridiskt bevis.';

-- =============================================================================
-- UTÖKA handle_invitation_acceptance — STA-program + sta_enrollment-koppling
-- =============================================================================
CREATE OR REPLACE FUNCTION handle_invitation_acceptance()
RETURNS TRIGGER AS $$
DECLARE
  invite_record RECORD;
  v_program TEXT;
  v_sta_enrollment_id UUID;
  v_consent_text TEXT;
  v_consent_scope JSONB;
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
    -- Sätt consultant_id på profilen
    UPDATE profiles
    SET consultant_id = invite_record.consultant_id
    WHERE id = NEW.id;

    -- Lägg in koppling i consultant_participants (idempotent)
    INSERT INTO consultant_participants (
      consultant_id, participant_id, assigned_by, notes
    ) VALUES (
      invite_record.consultant_id, NEW.id, invite_record.invited_by, 'Inbjuden via länk'
    ) ON CONFLICT (consultant_id, participant_id) DO NOTHING;
  END IF;

  -- STA-aktivering: läs metadata.program och eventuell förskapad enrollment
  v_program := invite_record.metadata->>'program';
  v_sta_enrollment_id := NULLIF(invite_record.metadata->>'sta_enrollment_id', '')::UUID;
  v_consent_text := invite_record.metadata->>'consent_text';
  v_consent_scope := COALESCE(invite_record.metadata->'consent_scope', '{}'::jsonb);

  IF v_program IS NOT NULL AND v_program IN ('steg_till_arbete', 'rusta_och_matcha') THEN
    -- Aktivera programmet på profilen direkt
    UPDATE profiles
    SET program = v_program
    WHERE id = NEW.id
      AND program IS NULL;  -- skriv inte över om deltagaren redan har ett program
  END IF;

  -- Koppla den förskapade STA-enrollment till nya användarkontot
  IF v_sta_enrollment_id IS NOT NULL AND invite_record.consultant_id IS NOT NULL THEN
    UPDATE sta_enrollments
    SET participant_id = NEW.id,
        link_status = 'linked',
        external_email = NULL,  -- vi har riktigt konto nu, ta bort intermediär e-post
        updated_at = NOW()
    WHERE id = v_sta_enrollment_id
      AND consultant_id = invite_record.consultant_id
      AND participant_id IS NULL;
  END IF;

  -- Logga samtycke om deltagaren godkände STA-specifik datadelning
  -- (samtyckes-text + scope skickas via invitation.metadata.consent_text/scope)
  IF invite_record.consultant_id IS NOT NULL AND v_consent_text IS NOT NULL THEN
    INSERT INTO consultant_consents (
      participant_id, consultant_id, program, scope, granted_text, granted_via
    ) VALUES (
      NEW.id, invite_record.consultant_id, v_program,
      v_consent_scope, v_consent_text, 'invitation'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- RPC: sta_bulk_invite — skapa flera invitations + sta_enrollments i en batch
-- =============================================================================
-- Input: invites JSONB array av { email, first_name?, last_name?, phone? }
-- Output: tabell med (email, invitation_id, sta_enrollment_id, status, error)
--
-- Den anropande konsulenten måste själv köra send-invite-email edge function
-- för varje invitation_id efteråt (eller använda bulk-läget i den funktionen).
CREATE OR REPLACE FUNCTION sta_bulk_invite(
  p_invites JSONB,
  p_started_at DATE DEFAULT CURRENT_DATE,
  p_consent_text TEXT DEFAULT NULL,
  p_consent_scope JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  email TEXT,
  invitation_id UUID,
  sta_enrollment_id UUID,
  status TEXT,
  error TEXT
) AS $$
DECLARE
  v_consultant_id UUID;
  v_consultant_role TEXT;
  v_consultant_first TEXT;
  v_consultant_last TEXT;
  v_consultant_email TEXT;
  v_invite JSONB;
  v_email TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
  v_phone TEXT;
  v_invitation_id UUID;
  v_enrollment_id UUID;
  v_full_name TEXT;
  v_metadata JSONB;
BEGIN
  v_consultant_id := auth.uid();
  IF v_consultant_id IS NULL THEN
    RAISE EXCEPTION 'Inte inloggad' USING ERRCODE = '42501';
  END IF;

  -- Verifiera att den som anropar är konsulent/admin + hämta namn för metadata
  SELECT role, first_name, last_name, email
    INTO v_consultant_role, v_consultant_first, v_consultant_last, v_consultant_email
    FROM profiles WHERE id = v_consultant_id;
  IF v_consultant_role NOT IN ('CONSULTANT', 'ADMIN', 'SUPERADMIN', 'ARBETSTERAPEUT') THEN
    RAISE EXCEPTION 'Endast konsulenter får bjuda in deltagare' USING ERRCODE = '42501';
  END IF;

  -- Iterera över array
  FOR v_invite IN SELECT * FROM jsonb_array_elements(p_invites) LOOP
    v_email := LOWER(TRIM(v_invite->>'email'));
    v_first_name := NULLIF(TRIM(COALESCE(v_invite->>'first_name', '')), '');
    v_last_name := NULLIF(TRIM(COALESCE(v_invite->>'last_name', '')), '');
    v_phone := NULLIF(TRIM(COALESCE(v_invite->>'phone', '')), '');
    v_invitation_id := NULL;
    v_enrollment_id := NULL;

    BEGIN
      -- Bygg fullt namn för external_name
      v_full_name := TRIM(CONCAT_WS(' ', v_first_name, v_last_name));
      IF v_full_name = '' THEN
        v_full_name := v_email;
      END IF;

      -- Validera e-post (enkel kontroll)
      IF v_email IS NULL OR v_email NOT LIKE '%_@_%.__%' THEN
        email := v_email;
        invitation_id := NULL;
        sta_enrollment_id := NULL;
        status := 'error';
        error := 'Ogiltig e-postadress';
        RETURN NEXT;
        CONTINUE;
      END IF;

      -- Skapa sta_enrollment först (så vi kan koppla via metadata)
      INSERT INTO sta_enrollments (
        consultant_id, external_name, external_email, external_phone,
        started_at, part_started_at, current_part,
        link_status, status, language_support, communication_support, weekly_hours
      ) VALUES (
        v_consultant_id, v_full_name, v_email, v_phone,
        p_started_at, p_started_at, 1,
        'invited', 'active', '{}', '{}', 25
      )
      RETURNING id INTO v_enrollment_id;

      -- Bygg metadata för invitation (inkl. konsulent-info så InviteHandler
      -- kan visa "X har bjudit in dig" utan att läsa profiles-tabellen)
      v_metadata := jsonb_build_object(
        'first_name', v_first_name,
        'last_name', v_last_name,
        'phone', v_phone,
        'program', 'steg_till_arbete',
        'sta_enrollment_id', v_enrollment_id::text,
        'consent_text', p_consent_text,
        'consent_scope', p_consent_scope,
        'consultant_first_name', v_consultant_first,
        'consultant_last_name', v_consultant_last,
        'consultant_email', v_consultant_email
      );

      -- Skapa invitation
      INSERT INTO invitations (
        email, role, invited_by, consultant_id, metadata
      ) VALUES (
        v_email, 'USER', v_consultant_id, v_consultant_id, v_metadata
      )
      RETURNING id INTO v_invitation_id;

      email := v_email;
      invitation_id := v_invitation_id;
      sta_enrollment_id := v_enrollment_id;
      status := 'created';
      error := NULL;
      RETURN NEXT;

    EXCEPTION WHEN OTHERS THEN
      -- Rulla tillbaka enrollment om invitation misslyckas
      IF v_enrollment_id IS NOT NULL AND v_invitation_id IS NULL THEN
        DELETE FROM sta_enrollments WHERE id = v_enrollment_id;
      END IF;
      email := v_email;
      invitation_id := v_invitation_id;
      sta_enrollment_id := v_enrollment_id;
      status := 'error';
      error := SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION sta_bulk_invite IS
  'Skapa flera STA-inbjudningar i en transaktion. Returnerar per-rad-status. Anropas av konsulent från StaConsultant-vyn.';

-- =============================================================================
-- RPC: revoke_consultant_link — deltagaren säger upp kopplingen själv
-- =============================================================================
-- Mjuk uppsägning enligt designval:
--   - profiles.consultant_id = NULL
--   - sta_enrollments.status = 'cancelled' (för aktiva)
--   - consultant_participants raderas
--   - consultant_consents.revoked_at = NOW()
--   - Inskickade dokument (sta_documents.status IN ('submitted','approved')) lämnas
--     orörda för AF-arkivkrav. Utkast raderas.
CREATE OR REPLACE FUNCTION revoke_consultant_link(
  p_consultant_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_participant_id UUID;
  v_cancelled_enrollments INT;
  v_drafts_deleted INT;
  v_consents_revoked INT;
BEGIN
  v_participant_id := auth.uid();
  IF v_participant_id IS NULL THEN
    RAISE EXCEPTION 'Inte inloggad' USING ERRCODE = '42501';
  END IF;

  -- Verifiera att kopplingen faktiskt existerar
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = v_participant_id AND consultant_id = p_consultant_id
  ) THEN
    RAISE EXCEPTION 'Du har ingen aktiv koppling till denna konsulent' USING ERRCODE = 'P0002';
  END IF;

  -- Sätt consultant_id till NULL
  UPDATE profiles
  SET consultant_id = NULL
  WHERE id = v_participant_id AND consultant_id = p_consultant_id;

  -- Avbryt aktiva STA-enrollments (lämna completed/cancelled orörda)
  UPDATE sta_enrollments
  SET status = 'cancelled', updated_at = NOW()
  WHERE participant_id = v_participant_id
    AND consultant_id = p_consultant_id
    AND status IN ('active', 'paused');
  GET DIAGNOSTICS v_cancelled_enrollments = ROW_COUNT;

  -- Radera utkast — inskickade dokument lämnas för AF-arkiv
  DELETE FROM sta_documents
  WHERE enrollment_id IN (
    SELECT id FROM sta_enrollments
    WHERE participant_id = v_participant_id
      AND consultant_id = p_consultant_id
  )
    AND status = 'draft';
  GET DIAGNOSTICS v_drafts_deleted = ROW_COUNT;

  -- Ta bort consultant_participants-raden
  DELETE FROM consultant_participants
  WHERE participant_id = v_participant_id
    AND consultant_id = p_consultant_id;

  -- Markera aktiva samtycken som återkallade
  UPDATE consultant_consents
  SET revoked_at = NOW(), revoked_reason = p_reason
  WHERE participant_id = v_participant_id
    AND consultant_id = p_consultant_id
    AND revoked_at IS NULL;
  GET DIAGNOSTICS v_consents_revoked = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'cancelled_enrollments', v_cancelled_enrollments,
    'drafts_deleted', v_drafts_deleted,
    'consents_revoked', v_consents_revoked
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION revoke_consultant_link IS
  'Deltagaren säger upp kopplingen till konsulent. Mjuk uppsägning — inskickade dokument bevaras för AF-arkivkrav.';

-- =============================================================================
-- GRANTS
-- =============================================================================
GRANT EXECUTE ON FUNCTION sta_bulk_invite(JSONB, DATE, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_consultant_link(UUID, TEXT) TO authenticated;
