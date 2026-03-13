-- Migration: Create Quest System Tables
-- Created: 2026-03-13

-- ============================================
-- Quest Templates (Predefined quests)
-- ============================================
CREATE TABLE IF NOT EXISTS quest_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('cv', 'apply', 'network', 'wellness')),
    energy_level TEXT NOT NULL CHECK (energy_level IN ('low', 'medium', 'high')),
    points INTEGER NOT NULL DEFAULT 10,
    estimated_minutes INTEGER NOT NULL DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE quest_templates ENABLE ROW LEVEL SECURITY;

-- Everyone can read active quest templates
CREATE POLICY "Anyone can read active quest templates" 
    ON quest_templates FOR SELECT 
    USING (is_active = true);

-- Only admins can modify (you'll need to set this up separately)
CREATE POLICY "Only admins can modify quest templates" 
    ON quest_templates FOR ALL 
    USING (false); -- Restrict all modifications for now

-- ============================================
-- User Daily Quests (Assigned to users)
-- ============================================
CREATE TABLE IF NOT EXISTS user_daily_quests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quest_template_id UUID NOT NULL REFERENCES quest_templates(id),
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, quest_template_id, assigned_date)
);

-- Enable RLS
ALTER TABLE user_daily_quests ENABLE ROW LEVEL SECURITY;

-- Users can only see their own quests
CREATE POLICY "Users can view own daily quests" 
    ON user_daily_quests FOR SELECT 
    USING (auth.uid() = user_id);

-- Users can insert their own quests (for the assignment function)
CREATE POLICY "Users can insert own daily quests" 
    ON user_daily_quests FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own quests (to mark as complete)
CREATE POLICY "Users can update own daily quests" 
    ON user_daily_quests FOR UPDATE 
    USING (auth.uid() = user_id);

-- ============================================
-- User Quest Stats (Progress tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS user_quest_stats (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    quests_completed INTEGER DEFAULT 0,
    last_completed_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_quest_stats ENABLE ROW LEVEL SECURITY;

-- Users can only see their own stats
CREATE POLICY "Users can view own quest stats" 
    ON user_quest_stats FOR SELECT 
    USING (auth.uid() = user_id);

-- Users can upsert their own stats
CREATE POLICY "Users can modify own quest stats" 
    ON user_quest_stats FOR ALL 
    USING (auth.uid() = user_id);

-- ============================================
-- Insert Default Quest Templates
-- ============================================
INSERT INTO quest_templates (title, description, category, energy_level, points, estimated_minutes) VALUES
-- CV & Profil (Low energy)
('Uppdatera din sammanfattning', 'Lägg till ett nytt ord eller mening som beskriver dig', 'cv', 'low', 10, 5),
('Lägg till en kompetens', 'Skriv in en färdighet du glömde bort', 'cv', 'low', 10, 3),
('Uppdatera profilbild', 'Byt till en ny eller bättre bild på din profil', 'cv', 'low', 15, 5),

-- CV & Profil (Medium energy)
('Granska ditt CV', 'Läs igenom och fixa 2-3 småfel', 'cv', 'medium', 20, 15),
('Be om feedback', 'Skicka ditt CV till en vän eller mentor', 'cv', 'medium', 25, 10),

-- Jobbsökning (Low energy)
('Spara 3 intressanta jobb', 'Hitta och spara jobb som verkar intressanta', 'apply', 'low', 10, 5),
('Skriv ner drömföretag', 'Lista 2 företag du vill jobba på', 'apply', 'low', 10, 5),

-- Jobbsökning (Medium energy)
('Anpassa CV för ett jobb', 'Gör små ändringar för ett specifikt jobb', 'apply', 'medium', 25, 20),
('Skriv en hälsningsfras', 'Förbered en personlig inledning', 'apply', 'medium', 20, 15),

-- Jobbsökning (High energy)
('Skicka 1 ansökan', 'Slutför och skicka in en jobbansökan', 'apply', 'high', 40, 30),

-- Nätverkande (Low energy)
('Gå med i en LinkedIn-grupp', 'Hitta en grupp i din bransch', 'network', 'low', 10, 3),
('Spara en kontakt', 'Hitta en intressant person att följa', 'network', 'low', 10, 5),

-- Nätverkande (Medium energy)
('Skicka ett meddelande', 'Kontakta en gammal kollega', 'network', 'medium', 25, 15),
('Kommentera ett inlägg', 'Engagera dig i ett samtal', 'network', 'medium', 20, 10),

-- Välmående (Low energy)
('Registrera ditt mående', 'Hur mår du idag? Ta 10 sekunder att reflektera', 'wellness', 'low', 10, 2),
('Skriv 3 styrkor', 'Vad är du bra på? Skriv ner dem', 'wellness', 'low', 10, 5),
('5 minuter stretching', 'Gör några enkla stretchövningar', 'wellness', 'low', 15, 5),

-- Välmående (Medium energy)
('Gå en promenad', '20 minuter frisk luft', 'wellness', 'medium', 25, 20),
('Skriv i dagboken', 'Reflektera över veckan', 'wellness', 'medium', 20, 15);

-- ============================================
-- Function: Assign Daily Quests
-- ============================================
CREATE OR REPLACE FUNCTION assign_daily_quests(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_quest_count INTEGER;
BEGIN
    -- Check if user already has quests for today
    SELECT COUNT(*) INTO v_quest_count
    FROM user_daily_quests
    WHERE user_id = p_user_id 
    AND assigned_date = CURRENT_DATE;
    
    -- Only assign if no quests exist for today
    IF v_quest_count = 0 THEN
        -- Assign 1 random quest from each category
        INSERT INTO user_daily_quests (user_id, quest_template_id, assigned_date)
        SELECT p_user_id, id, CURRENT_DATE
        FROM (
            SELECT id, category,
                ROW_NUMBER() OVER (PARTITION BY category ORDER BY RANDOM()) as rn
            FROM quest_templates
            WHERE is_active = true
            AND energy_level = 'low' -- Start with low energy quests
        ) ranked
        WHERE rn = 1;
        
        -- Also assign 1 medium energy quest
        INSERT INTO user_daily_quests (user_id, quest_template_id, assigned_date)
        SELECT p_user_id, id, CURRENT_DATE
        FROM quest_templates
        WHERE is_active = true
        AND energy_level = 'medium'
        AND category NOT IN (SELECT category FROM user_daily_quests WHERE user_id = p_user_id AND assigned_date = CURRENT_DATE)
        ORDER BY RANDOM()
        LIMIT 1;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Function: Complete Quest
-- ============================================
CREATE OR REPLACE FUNCTION complete_quest(p_quest_id UUID, p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_points INTEGER;
    v_was_completed BOOLEAN;
BEGIN
    -- Check if already completed
    SELECT is_completed INTO v_was_completed
    FROM user_daily_quests
    WHERE id = p_quest_id AND user_id = p_user_id;
    
    IF v_was_completed THEN
        RETURN; -- Already completed, do nothing
    END IF;
    
    -- Get points for this quest
    SELECT qt.points INTO v_points
    FROM user_daily_quests udq
    JOIN quest_templates qt ON udq.quest_template_id = qt.id
    WHERE udq.id = p_quest_id;
    
    -- Mark as completed
    UPDATE user_daily_quests
    SET is_completed = true,
        completed_at = NOW()
    WHERE id = p_quest_id
    AND user_id = p_user_id;
    
    -- Update user stats
    INSERT INTO user_quest_stats (user_id, total_points, quests_completed, last_completed_date)
    VALUES (p_user_id, v_points, 1, CURRENT_DATE)
    ON CONFLICT (user_id) 
    DO UPDATE SET
        total_points = user_quest_stats.total_points + v_points,
        quests_completed = user_quest_stats.quests_completed + 1,
        last_completed_date = CURRENT_DATE,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_daily_quests_user_date ON user_daily_quests(user_id, assigned_date);
CREATE INDEX IF NOT EXISTS idx_user_daily_quests_completed ON user_daily_quests(user_id, is_completed, assigned_date);
CREATE INDEX IF NOT EXISTS idx_quest_templates_category ON quest_templates(category, energy_level, is_active);
