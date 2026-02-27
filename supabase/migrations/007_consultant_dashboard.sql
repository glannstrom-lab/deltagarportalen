-- Migration: Konsulent Dashboard & Rollhantering
-- Skapar rollbaserat system med Superadmin, Konsulent, och Deltagare

-- ============================================
-- 1. UPPDATERA EXISTERANDE TABELLER
-- ============================================

-- Lägg till roll-kolumn i profiles (om den inte finns)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'USER';
    END IF;
END $$;

-- Uppdatera roll-kolumnen med constraint
ALTER TABLE profiles 
    DROP CONSTRAINT IF EXISTS valid_roles;

ALTER TABLE profiles 
    ADD CONSTRAINT valid_roles 
    CHECK (role IN ('SUPERADMIN', 'ADMIN', 'CONSULTANT', 'USER'));

-- Lägg till konsulent-referens i profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'consultant_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN consultant_id UUID REFERENCES profiles(id);
    END IF;
END $$;

-- Lägg till status för deltagare
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'status'
    ) THEN
        ALTER TABLE profiles ADD COLUMN status TEXT DEFAULT 'ACTIVE';
    END IF;
END $$;

ALTER TABLE profiles 
    ADD CONSTRAINT valid_status 
    CHECK (status IN ('ACTIVE', 'INACTIVE', 'COMPLETED', 'ON_HOLD'));

-- ============================================
-- 2. NY TABELL: KONSULENT-DELTAGARE KOPPLING
-- ============================================

CREATE TABLE IF NOT EXISTS consultant_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES profiles(id),
    notes TEXT,
    priority INTEGER DEFAULT 0, -- 0=Normal, 1=Hög, 2=Kritisk
    last_contact_at TIMESTAMP WITH TIME ZONE,
    next_meeting_scheduled TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(consultant_id, participant_id)
);

-- Index för snabba queries
CREATE INDEX IF NOT EXISTS idx_consultant_participants_consultant 
    ON consultant_participants(consultant_id);
CREATE INDEX IF NOT EXISTS idx_consultant_participants_participant 
    ON consultant_participants(participant_id);

-- ============================================
-- 3. NY TABELL: INBJUDNINGAR
-- ============================================

CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('CONSULTANT', 'USER')),
    invited_by UUID NOT NULL REFERENCES profiles(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')),
    metadata JSONB DEFAULT '{}', -- {first_name, last_name, phone, message}
    
    -- Om det är en deltagarinbjudan, vem är konsulenten?
    consultant_id UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

-- ============================================
-- 4. NY TABELL: KONSULENT-INSTÄLLNINGAR
-- ============================================

CREATE TABLE IF NOT EXISTS consultant_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultant_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Notifikationer
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    daily_summary BOOLEAN DEFAULT true,
    participant_activity_alerts BOOLEAN DEFAULT true,
    
    -- Visningsinställningar
    default_view TEXT DEFAULT 'grid' CHECK (default_view IN ('grid', 'list', 'calendar')),
    participants_per_page INTEGER DEFAULT 20,
    
    -- Automatiska påminnelser
    auto_reminder_days INTEGER DEFAULT 7, -- Påminnelse om ej kontakt på X dagar
    
    -- Signatur för meddelanden
    message_signature TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. NY TABELL: SYSTEM-LOGG (för audit)
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL, -- 'LOGIN', 'ROLE_CHANGE', 'INVITE_SENT', etc.
    resource_type TEXT, -- 'profile', 'invitation', 'cv', etc.
    resource_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- ============================================
-- 6. UPPDATERA CONSULTANT_NOTES
-- ============================================

-- Lägg till typ av anteckning
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'consultant_notes' AND column_name = 'note_type'
    ) THEN
        ALTER TABLE consultant_notes ADD COLUMN note_type TEXT DEFAULT 'GENERAL';
    END IF;
END $$;

ALTER TABLE consultant_notes 
    DROP CONSTRAINT IF EXISTS valid_note_types;

ALTER TABLE consultant_notes 
    ADD CONSTRAINT valid_note_types 
    CHECK (note_type IN ('GENERAL', 'PROGRESS', 'CONCERN', 'GOAL', 'MEETING', 'CONTACT_ATTEMPT'));

-- ============================================
-- 7. VIEWS FÖR DASHBOARD
-- ============================================

-- Konsulentens deltagare med aggregerad info
CREATE OR REPLACE VIEW consultant_dashboard_participants AS
SELECT 
    cp.consultant_id,
    p.id as participant_id,
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
    
    -- CV-status
    CASE WHEN c.id IS NOT NULL THEN true ELSE false END as has_cv,
    c.ats_score,
    c.updated_at as cv_updated_at,
    
    -- Intresseguide
    CASE WHEN ir.id IS NOT NULL THEN true ELSE false END as completed_interest_test,
    ir.holland_code,
    
    -- Sparade jobb
    (SELECT COUNT(*) FROM saved_jobs WHERE user_id = p.id) as saved_jobs_count,
    
    -- Anteckningar
    (SELECT COUNT(*) FROM consultant_notes WHERE participant_id = p.id) as notes_count,
    (SELECT MAX(created_at) FROM consultant_notes WHERE participant_id = p.id) as last_note_date,
    
    -- Aktivitet
    (SELECT MAX(last_sign_in_at) FROM auth.users WHERE id = p.id) as last_login
    
FROM consultant_participants cp
JOIN profiles p ON cp.participant_id = p.id
LEFT JOIN cvs c ON c.user_id = p.id
LEFT JOIN interest_results ir ON ir.user_id = p.id
WHERE p.status != 'COMPLETED';

-- ============================================
-- 8. RLS POLICIES
-- ============================================

-- Aktivera RLS på nya tabeller
ALTER TABLE consultant_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Konsulent-Deltagare koppling
CREATE POLICY "Konsulenter ser sina deltagare"
    ON consultant_participants FOR SELECT
    USING (consultant_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'ADMIN')));

CREATE POLICY "Konsulenter kan skapa kopplingar"
    ON consultant_participants FOR INSERT
    WITH CHECK (consultant_id = auth.uid() OR 
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'ADMIN')));

CREATE POLICY "Konsulenter kan uppdatera sina kopplingar"
    ON consultant_participants FOR UPDATE
    USING (consultant_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'ADMIN')));

-- Inbjudningar
CREATE POLICY "Användare ser sina egna inbjudningar"
    ON invitations FOR SELECT
    USING (invited_by = auth.uid() OR 
           EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'ADMIN')));

CREATE POLICY "Konsulenter och admins kan skapa inbjudningar"
    ON invitations FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() 
                        AND role IN ('SUPERADMIN', 'ADMIN', 'CONSULTANT')));

-- Konsulent-inställningar
CREATE POLICY "Konsulenter hanterar sina inställningar"
    ON consultant_settings FOR ALL
    USING (consultant_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'ADMIN')));

-- Audit logs (endast admins)
CREATE POLICY "Endast admins ser audit logs"
    ON audit_logs FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() 
                   AND role IN ('SUPERADMIN', 'ADMIN')));

-- ============================================
-- 9. FUNKTIONER/TRIGGERS
-- ============================================

-- Uppdatera updated_at automatiskt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_consultant_settings_updated_at
    BEFORE UPDATE ON consultant_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Logga rolländringar
CREATE OR REPLACE FUNCTION log_role_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_value, new_value)
        VALUES (auth.uid(), 'ROLE_CHANGE', 'profile', NEW.id, 
                jsonb_build_object('role', OLD.role), 
                jsonb_build_object('role', NEW.role));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_profile_role_changes
    AFTER UPDATE ON profiles
    FOR EACH ROW
    WHEN (OLD.role IS DISTINCT FROM NEW.role)
    EXECUTE FUNCTION log_role_change();

-- ============================================
-- 10. SEED DATA (skapa superadmin om ej finns)
-- ============================================

-- OBS: Kör detta manuellt efter att ha skapat första användaren
-- UPDATE profiles SET role = 'SUPERADMIN' WHERE email = 'din-email@example.com';
