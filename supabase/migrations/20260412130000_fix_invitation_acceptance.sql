-- ============================================
-- FIX: Trigger för att koppla deltagare till konsulent vid inbjudningsacceptans
-- ============================================

-- Funktion som körs när en ny profil skapas
-- Kollar om det finns en väntande inbjudan och skapar kopplingen
CREATE OR REPLACE FUNCTION handle_invitation_acceptance()
RETURNS TRIGGER AS $$
DECLARE
    invite_record RECORD;
BEGIN
    -- Hitta en väntande inbjudan för denna e-postadress
    SELECT * INTO invite_record
    FROM invitations
    WHERE email = NEW.email
      AND status = 'PENDING'
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;

    -- Om inbjudan finns, skapa kopplingen
    IF invite_record.id IS NOT NULL THEN
        -- Uppdatera inbjudans status
        UPDATE invitations
        SET status = 'ACCEPTED',
            used_at = NOW(),
            used_by = NEW.id,
            updated_at = NOW()
        WHERE id = invite_record.id;

        -- Sätt consultant_id på profilen
        IF invite_record.consultant_id IS NOT NULL THEN
            UPDATE profiles
            SET consultant_id = invite_record.consultant_id
            WHERE id = NEW.id;
        END IF;

        -- Skapa koppling i consultant_participants
        IF invite_record.consultant_id IS NOT NULL THEN
            INSERT INTO consultant_participants (
                consultant_id,
                participant_id,
                assigned_by,
                notes
            ) VALUES (
                invite_record.consultant_id,
                NEW.id,
                invite_record.invited_by,
                'Inbjuden via länk'
            )
            ON CONFLICT (consultant_id, participant_id) DO NOTHING;
        END IF;

        -- Logga händelsen
        INSERT INTO audit_logs (
            user_id,
            action,
            resource_type,
            resource_id,
            new_value
        ) VALUES (
            NEW.id,
            'INVITATION_ACCEPTED',
            'invitation',
            invite_record.id,
            jsonb_build_object(
                'email', NEW.email,
                'consultant_id', invite_record.consultant_id,
                'invited_by', invite_record.invited_by
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ta bort gammal trigger om den finns
DROP TRIGGER IF EXISTS on_profile_created_handle_invitation ON profiles;

-- Skapa trigger som körs efter profil skapas
CREATE TRIGGER on_profile_created_handle_invitation
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_invitation_acceptance();

-- ============================================
-- Lägg till status-kolumn om den saknas
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'invitations' AND column_name = 'status'
    ) THEN
        ALTER TABLE invitations ADD COLUMN status TEXT DEFAULT 'PENDING'
            CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'));
    END IF;
END $$;

-- ============================================
-- Policy för att användare kan läsa inbjudningar via token (för validering)
-- ============================================
DROP POLICY IF EXISTS "Anyone can read invitations by token" ON invitations;

CREATE POLICY "Anyone can read invitations by token" ON invitations
    FOR SELECT
    USING (true);  -- Behövs för att validera token innan användare är inloggad

-- ============================================
-- Fixa befintliga inbjudningar som redan accepterats
-- (kör detta en gång för att koppla användare som redan registrerat sig)
-- ============================================
DO $$
DECLARE
    inv RECORD;
    user_id UUID;
BEGIN
    FOR inv IN
        SELECT i.*, p.id as profile_id
        FROM invitations i
        JOIN profiles p ON p.email = i.email
        WHERE i.status = 'PENDING'
          AND i.consultant_id IS NOT NULL
    LOOP
        -- Uppdatera inbjudan
        UPDATE invitations
        SET status = 'ACCEPTED',
            used_at = NOW(),
            used_by = inv.profile_id
        WHERE id = inv.id;

        -- Sätt consultant_id
        UPDATE profiles
        SET consultant_id = inv.consultant_id
        WHERE id = inv.profile_id;

        -- Skapa koppling
        INSERT INTO consultant_participants (
            consultant_id,
            participant_id,
            assigned_by,
            notes
        ) VALUES (
            inv.consultant_id,
            inv.profile_id,
            inv.invited_by,
            'Retroaktivt kopplad'
        )
        ON CONFLICT (consultant_id, participant_id) DO NOTHING;
    END LOOP;
END $$;
