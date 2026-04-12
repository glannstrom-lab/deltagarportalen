-- ============================================
-- FIX: Trigger för att koppla deltagare till konsulent vid inbjudningsacceptans
-- ============================================

-- Skapa consultant_participants tabellen om den inte finns
CREATE TABLE IF NOT EXISTS consultant_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES profiles(id),
    notes TEXT,
    priority INTEGER DEFAULT 0,
    last_contact_at TIMESTAMP WITH TIME ZONE,
    next_meeting_scheduled TIMESTAMP WITH TIME ZONE,
    UNIQUE(consultant_id, participant_id)
);

CREATE INDEX IF NOT EXISTS idx_consultant_participants_consultant ON consultant_participants(consultant_id);
CREATE INDEX IF NOT EXISTS idx_consultant_participants_participant ON consultant_participants(participant_id);

ALTER TABLE consultant_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Konsulenter ser sina deltagare" ON consultant_participants;
CREATE POLICY "Konsulenter ser sina deltagare"
    ON consultant_participants FOR SELECT
    USING (consultant_id = auth.uid() OR
           EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'ADMIN')));

DROP POLICY IF EXISTS "Konsulenter kan hantera kopplingar" ON consultant_participants;
CREATE POLICY "Konsulenter kan hantera kopplingar"
    ON consultant_participants FOR ALL
    USING (consultant_id = auth.uid() OR
           EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'ADMIN')));

-- Skapa/uppdatera vyn för konsultens deltagare
CREATE OR REPLACE VIEW consultant_dashboard_participants AS
SELECT
    cp.consultant_id,
    p.id as participant_id,
    p.id as user_id,
    p.email,
    p.first_name,
    p.last_name,
    p.phone,
    p.avatar_url,
    p.status,
    p.created_at as registered_at,
    cp.assigned_at,
    cp.priority,
    cp.last_contact_at,
    cp.next_meeting_scheduled,
    cp.notes as consultant_notes,
    CASE WHEN c.id IS NOT NULL THEN true ELSE false END as has_cv,
    c.ats_score,
    c.updated_at as cv_updated_at,
    CASE WHEN ir.id IS NOT NULL THEN true ELSE false END as completed_interest_test,
    ir.holland_code,
    COALESCE((SELECT COUNT(*) FROM saved_jobs WHERE user_id = p.id), 0) as saved_jobs_count,
    COALESCE((SELECT COUNT(*) FROM consultant_notes WHERE participant_id = p.id), 0) as notes_count,
    (SELECT MAX(created_at) FROM consultant_notes WHERE participant_id = p.id) as last_note_date,
    p.updated_at as last_login
FROM consultant_participants cp
JOIN profiles p ON cp.participant_id = p.id
LEFT JOIN cvs c ON c.user_id = p.id
LEFT JOIN interest_results ir ON ir.user_id = p.id;

-- Funktion som körs när en ny profil skapas
-- Kollar om det finns en väntande inbjudan och skapar kopplingen
CREATE OR REPLACE FUNCTION handle_invitation_acceptance()
RETURNS TRIGGER AS $$
DECLARE
    invite_record RECORD;
BEGIN
    -- Hitta en väntande inbjudan för denna e-postadress (used_at IS NULL = ej använd)
    SELECT * INTO invite_record
    FROM invitations
    WHERE email = NEW.email
      AND used_at IS NULL
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;

    -- Om inbjudan finns, skapa kopplingen
    IF invite_record.id IS NOT NULL THEN
        -- Markera inbjudan som använd
        UPDATE invitations
        SET used_at = NOW(),
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
BEGIN
    FOR inv IN
        SELECT i.*, p.id as profile_id
        FROM invitations i
        JOIN profiles p ON p.email = i.email
        WHERE i.used_at IS NULL
          AND i.consultant_id IS NOT NULL
    LOOP
        -- Markera inbjudan som använd
        UPDATE invitations
        SET used_at = NOW(),
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
