-- ============================================
-- Migration: Gamification, Grupper, Stöd-funktioner
-- Sprint 6-7: Alla features från teammötet
-- ============================================

-- ============================================
-- 1. GAMIFICATION - Poäng & Badges (D1)
-- ============================================

-- Tabell för achievements/badges
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL, -- Lucide icon name
    category TEXT NOT NULL CHECK (category IN ('CV', 'JOBS', 'LOGIN', 'NETWORK', 'SKILL')),
    points INTEGER NOT NULL DEFAULT 10,
    requirement_type TEXT NOT NULL, -- 'count', 'streak', 'score'
    requirement_value INTEGER NOT NULL, -- t.ex. 10 (logins), 7 (dagar i rad)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabell för användarens earned achievements
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Tabell för poäng och streaks
CREATE TABLE IF NOT EXISTS user_gamification (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
    total_points INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0, -- Antal dagar i rad med login
    longest_streak INTEGER DEFAULT 0,
    last_login_date DATE,
    weekly_goal INTEGER DEFAULT 5,
    weekly_progress INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabell för dagliga uppgifter (Daily Goals)
CREATE TABLE IF NOT EXISTS daily_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    task_type TEXT NOT NULL CHECK (task_type IN ('UPDATE_CV', 'SEARCH_JOBS', 'APPLY_JOB', 'COMPLETE_PROFILE', 'READ_ARTICLE', 'NETWORK')),
    title TEXT NOT NULL,
    description TEXT,
    points INTEGER DEFAULT 5,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    assigned_date DATE DEFAULT CURRENT_DATE,
    UNIQUE(user_id, task_type, assigned_date)
);

-- ============================================
-- 2. GRUPP-HANTERING (F1)
-- ============================================

-- Tabell för konsulentens grupper
CREATE TABLE IF NOT EXISTS consultant_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultant_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#4f46e5', -- Hex-färg
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Koppling mellan grupper och deltagare
CREATE TABLE IF NOT EXISTS group_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES consultant_groups(id) ON DELETE CASCADE NOT NULL,
    participant_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    added_by UUID REFERENCES profiles(id),
    UNIQUE(group_id, participant_id)
);

-- ============================================
-- 3. STÖD VID AVSLAG (E1)
-- ============================================

-- Tabell för jobbansökningar med status
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    job_id TEXT NOT NULL,
    job_title TEXT NOT NULL,
    company_name TEXT,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'APPLIED' CHECK (status IN ('APPLIED', 'INTERVIEW', 'REJECTED', 'ACCEPTED', 'WITHDRAWN')),
    rejection_received_at TIMESTAMPTZ,
    support_message_sent BOOLEAN DEFAULT FALSE,
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mallar för stödmeddelanden vid avslag
CREATE TABLE IF NOT EXISTS rejection_support_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL CHECK (category IN ('EMPATHY', 'MOTIVATION', 'ACTION', 'PERSPECTIVE')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
);

-- ============================================
-- 4. MÖTESBOKNING (F3)
-- ============================================

-- Tabell för mötestider
CREATE TABLE IF NOT EXISTS meeting_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultant_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_booked BOOLEAN DEFAULT FALSE,
    booked_by UUID REFERENCES profiles(id),
    booked_at TIMESTAMPTZ,
    meeting_type TEXT DEFAULT 'INDIVIDUAL' CHECK (meeting_type IN ('INDIVIDUAL', 'GROUP', 'PHONE', 'VIDEO')),
    location TEXT, -- Fysisk plats eller video-länk
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. AI KARRIÄRCOACH (C1) - Konversationer
-- ============================================

-- Tabell för AI-chat-konversationer
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT DEFAULT 'Ny konversation',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabell för AI-chat-meddelanden
CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. ONBOARDING (I1)
-- ============================================

-- Tabell för onboarding-progress
CREATE TABLE IF NOT EXISTS user_onboarding (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
    current_step INTEGER DEFAULT 0,
    total_steps INTEGER DEFAULT 5,
    completed BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    skipped_at TIMESTAMPTZ,
    goals JSONB DEFAULT '[]'::jsonb -- Användarens valda mål
);

-- ============================================
-- 7. SEED DATA - Achievements
-- ============================================

INSERT INTO achievements (name, description, icon, category, points, requirement_type, requirement_value) VALUES
-- CV-achievements
('CV-mästare', 'Fyll i hela ditt CV', 'FileText', 'CV', 50, 'score', 100),
('Profilproffs', 'Ladda upp en profilbild', 'User', 'CV', 20, 'count', 1),
('Sammanfattningsstjärna', 'Skriv en sammanfattning på minst 100 tecken', 'Edit', 'CV', 30, 'count', 1),

-- Jobb-achievements
('Jobbjägare', 'Sök 10 jobb', 'Briefcase', 'JOBS', 50, 'count', 10),
('Aktiv sökare', 'Sök minst 3 jobb i veckan', 'Target', 'JOBS', 30, 'count', 3),
('Intervjukungen', 'Få 5 intervjuer', 'Award', 'JOBS', 100, 'count', 5),

-- Login-achievements  
('Första steget', 'Logga in för första gången', 'LogIn', 'LOGIN', 10, 'count', 1),
('Veckovis vana', 'Logga in 7 dagar i rad', 'Flame', 'LOGIN', 50, 'streak', 7),
('Månadens kämpe', 'Logga in 30 dagar i rad', 'Crown', 'LOGIN', 200, 'streak', 30),

-- Nätverk
('Konsulentkontakt', 'Ha ditt första möte med konsulent', 'Users', 'NETWORK', 30, 'count', 1),
('Regelbunden kontakt', 'Träffa din konsulent 4 gånger', 'Calendar', 'NETWORK', 50, 'count', 4),

-- Kompetens
('Intresseguide-klar', 'Gör klart intresseguiden', 'Compass', 'SKILL', 40, 'count', 1),
('Karriärexpert', 'Läs 10 artiklar i kunskapsbanken', 'BookOpen', 'SKILL', 40, 'count', 10);

-- Stödmeddelanden vid avslag
INSERT INTO rejection_support_templates (category, title, message, sort_order) VALUES
('EMPATHY', 'Det är inte personligt', 'Att få avslag på en jobbansökan kan kännas tufft, men kom ihåg: Det är inte en reflektion av ditt värde som människa. Rekryterare gör snabba bedömningar baserat på många faktorer du inte kan kontrollera.', 1),
('MOTIVATION', 'Varje nej är ett steg närmare ja', 'Statistiskt sett behöver man söka 10-20 jobb för att få ett ja. Detta nej betyder att du är ett steg närmare rätt jobb!', 2),
('ACTION', 'Låt oss analysera tillsammans', 'Vill du gå igenom din ansökan med din konsulent? Tillsammans kan vi se om det finns något att justera inför nästa ansökan.', 3),
('PERSPECTIVE', 'Marknaden är tuff just nu', 'Arbetsmarknaden är utmanande för många just nu. Det betyder inte att du inte är kompetent - det betyder att du behöver hålla ut.', 4);

-- ============================================
-- 8. RLS POLICIES
-- ============================================

-- Gamification
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gamification" ON user_gamification FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own achievements" ON user_achievements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own tasks" ON daily_tasks FOR ALL USING (auth.uid() = user_id);

-- Grupper (konsulenter kan hantera, deltagare kan se sina)
ALTER TABLE consultant_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultants can manage own groups" ON consultant_groups FOR ALL USING (auth.uid() = consultant_id);
CREATE POLICY "Participants can view their groups" ON consultant_groups FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_participants WHERE group_id = id AND participant_id = auth.uid())
);

CREATE POLICY "Consultants can manage group participants" ON group_participants FOR ALL USING (
    EXISTS (SELECT 1 FROM consultant_groups WHERE id = group_id AND consultant_id = auth.uid())
);

-- Jobbansökningar
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own applications" ON job_applications FOR ALL USING (auth.uid() = user_id);

-- AI-konversationer
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own conversations" ON ai_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own messages" ON ai_messages FOR ALL USING (
    EXISTS (SELECT 1 FROM ai_conversations WHERE id = conversation_id AND user_id = auth.uid())
);

-- Möten
ALTER TABLE meeting_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Consultants can manage own slots" ON meeting_slots FOR ALL USING (auth.uid() = consultant_id);
CREATE POLICY "Users can view and book available slots" ON meeting_slots FOR SELECT USING (is_booked = FALSE OR booked_by = auth.uid());
CREATE POLICY "Users can book slots" ON meeting_slots FOR UPDATE USING (is_booked = FALSE);

-- Onboarding
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own onboarding" ON user_onboarding FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 9. FUNKTIONER FÖR GAMIFICATION
-- ============================================

-- Uppdatera streak vid login
CREATE OR REPLACE FUNCTION update_login_streak()
RETURNS TRIGGER AS $$
DECLARE
    last_date DATE;
    current_streak INTEGER;
BEGIN
    -- Hämta nuvarande streak
    SELECT ug.last_login_date, ug.current_streak 
    INTO last_date, current_streak
    FROM user_gamification ug
    WHERE ug.user_id = NEW.id;
    
    -- Om ingen post finns, skapa en
    IF NOT FOUND THEN
        INSERT INTO user_gamification (user_id, last_login_date, current_streak, total_points)
        VALUES (NEW.id, CURRENT_DATE, 1, 10);
    ELSE
        -- Kolla om det är en ny dag
        IF last_date IS NULL OR last_date < CURRENT_DATE THEN
            -- Kolla om det är dagen efter (fortsätt streak) eller senare (bryt streak)
            IF last_date = CURRENT_DATE - 1 THEN
                -- Fortsätt streak
                UPDATE user_gamification 
                SET current_streak = current_streak + 1,
                    longest_streak = GREATEST(longest_streak, current_streak + 1),
                    last_login_date = CURRENT_DATE,
                    total_points = total_points + 5 -- Daily login bonus
                WHERE user_id = NEW.id;
            ELSE
                -- Bryt streak, börja om
                UPDATE user_gamification 
                SET current_streak = 1,
                    last_login_date = CURRENT_DATE,
                    total_points = total_points + 5
                WHERE user_id = NEW.id;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigga vid login (via auth.users uppdatering)
CREATE OR REPLACE TRIGGER on_user_login_update_streak
    AFTER UPDATE OF last_sign_in_at ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION update_login_streak();
