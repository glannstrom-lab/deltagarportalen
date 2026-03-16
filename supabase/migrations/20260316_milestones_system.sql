-- ============================================
-- Migration: Milestones & Enhanced Gamification System
-- Created: 2026-03-16
-- ============================================

-- ============================================
-- 1. MILESTONES TABLE
-- Tracks progress towards larger goals
-- ============================================
CREATE TABLE IF NOT EXISTS milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE, -- e.g., 'cv_master', 'job_hunter'
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL, -- Lucide icon name
    color TEXT NOT NULL DEFAULT 'violet', -- Tailwind color
    category TEXT NOT NULL CHECK (category IN ('cv', 'jobs', 'knowledge', 'interview', 'linkedin', 'wellness', 'community')),
    max_progress INTEGER NOT NULL DEFAULT 100, -- Target value
    reward_points INTEGER NOT NULL DEFAULT 100,
    badge_id UUID REFERENCES achievements(id), -- Badge to unlock when complete
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. USER MILESTONES PROGRESS
-- Tracks each user's progress on milestones
-- ============================================
CREATE TABLE IF NOT EXISTS user_milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
    current_progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, milestone_id)
);

-- ============================================
-- 3. ACTIVITY LOG (for timeline)
-- ============================================
CREATE TABLE IF NOT EXISTS user_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'cv_updated', 'job_saved', 'article_read', etc.
    title TEXT NOT NULL,
    description TEXT,
    points_earned INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. ENABLE RLS
-- ============================================
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- Milestones are readable by everyone
CREATE POLICY "Milestones are public" ON milestones FOR SELECT USING (is_active = true);

-- User milestones - users can only see their own
CREATE POLICY "Users can view own milestones" ON user_milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own milestones" ON user_milestones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own milestones" ON user_milestones FOR UPDATE USING (auth.uid() = user_id);

-- Activity log - users can only see their own
CREATE POLICY "Users can view own activity" ON user_activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity" ON user_activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 5. INSERT MILESTONES
-- ============================================
INSERT INTO milestones (key, name, description, icon, color, category, max_progress, reward_points, sort_order) VALUES
-- CV Milestones
('cv_master', 'CV-Mästare', 'Fyll i alla sektioner i ditt CV', 'FileText', 'violet', 'cv', 100, 150, 1),
('cv_versions', 'Versionshanterare', 'Skapa 3 olika CV-versioner', 'Copy', 'violet', 'cv', 3, 75, 2),
('cv_ats_pro', 'ATS-Expert', 'Få 80+ i ATS-analys', 'CheckCircle', 'emerald', 'cv', 80, 100, 3),

-- Job Search Milestones
('job_hunter', 'Jobbsökare', 'Spara 10 intressanta jobb', 'Briefcase', 'blue', 'jobs', 10, 100, 4),
('application_pro', 'Ansökningsproffs', 'Skicka 5 jobbansökningar', 'Send', 'blue', 'jobs', 5, 150, 5),
('job_organizer', 'Organisatören', 'Håll koll på 20 jobb i trackern', 'FolderKanban', 'blue', 'jobs', 20, 125, 6),

-- Knowledge Milestones
('knowledge_seeker', 'Kunskapssökare', 'Läs 10 artiklar', 'BookOpen', 'amber', 'knowledge', 10, 100, 7),
('bookworm', 'Bokmal', 'Läs 25 artiklar', 'Library', 'amber', 'knowledge', 25, 200, 8),
('saver', 'Samlaren', 'Spara 5 artiklar', 'Bookmark', 'amber', 'knowledge', 5, 50, 9),

-- Interview Milestones
('interview_starter', 'Intervjunybörjare', 'Genomför 3 intervjuträningar', 'MessageSquare', 'indigo', 'interview', 3, 75, 10),
('interview_pro', 'Intervjuproffs', 'Genomför 10 intervjuträningar', 'Award', 'indigo', 'interview', 10, 150, 11),
('interview_master', 'Intervjumästare', 'Nå 80% snittbetyg i träningen', 'Trophy', 'indigo', 'interview', 80, 200, 12),

-- LinkedIn Milestones
('linkedin_starter', 'LinkedIn-Nybörjare', 'Analysera din LinkedIn-profil', 'Linkedin', 'sky', 'linkedin', 1, 50, 13),
('linkedin_optimized', 'LinkedIn-Optimerad', 'Nå 80% profilstyrka', 'TrendingUp', 'sky', 'linkedin', 80, 150, 14),

-- Wellness Milestones
('mood_tracker', 'Humörloggare', 'Logga ditt mående 7 dagar', 'Heart', 'rose', 'wellness', 7, 75, 15),
('wellness_streak', 'Välmående-Streak', 'Logga mående 14 dagar i rad', 'Flame', 'rose', 'wellness', 14, 150, 16),
('reflection_pro', 'Reflekteraren', 'Skriv 5 dagboksanteckningar', 'PenLine', 'rose', 'wellness', 5, 100, 17),

-- Community/Engagement Milestones
('first_steps', 'Första Stegen', 'Slutför introduktionen', 'Footprints', 'teal', 'community', 1, 25, 18),
('explorer', 'Utforskaren', 'Besök alla huvudsidor', 'Compass', 'teal', 'community', 8, 50, 19),
('streak_7', 'Veckokämpe', 'Logga in 7 dagar i rad', 'Zap', 'orange', 'community', 7, 100, 20),
('streak_30', 'Månadsmästare', 'Logga in 30 dagar i rad', 'Crown', 'orange', 'community', 30, 300, 21);

-- ============================================
-- 6. SEED MORE ACHIEVEMENTS/BADGES
-- ============================================
INSERT INTO achievements (name, description, icon, category, points, requirement_type, requirement_value) VALUES
-- Milkstone completion badges
('CV Komplett', 'Alla CV-sektioner ifyllda', 'Award', 'CV', 100, 'score', 100),
('Jobbmagnet', 'Sparat 10 jobb', 'Magnet', 'JOBS', 50, 'count', 10),
('Läsmästare', 'Läst 25 artiklar', 'GraduationCap', 'SKILL', 100, 'count', 25),
('Intervjuguru', 'Klarat 10 intervjuträningar', 'Mic', 'SKILL', 100, 'count', 10)
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. FUNCTIONS FOR MILESTONE TRACKING
-- ============================================

-- Initialize milestones for a user
CREATE OR REPLACE FUNCTION initialize_user_milestones(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_milestones (user_id, milestone_id, current_progress)
    SELECT p_user_id, id, 0
    FROM milestones
    WHERE is_active = true
    ON CONFLICT (user_id, milestone_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Update milestone progress
CREATE OR REPLACE FUNCTION update_milestone_progress(
    p_user_id UUID,
    p_milestone_key TEXT,
    p_new_progress INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_milestone_id UUID;
    v_max_progress INTEGER;
    v_current_completed BOOLEAN;
    v_reward_points INTEGER;
BEGIN
    -- Get milestone details
    SELECT id, max_progress, reward_points INTO v_milestone_id, v_max_progress, v_reward_points
    FROM milestones WHERE key = p_milestone_key AND is_active = true;

    IF v_milestone_id IS NULL THEN
        RETURN;
    END IF;

    -- Check if already completed
    SELECT is_completed INTO v_current_completed
    FROM user_milestones
    WHERE user_id = p_user_id AND milestone_id = v_milestone_id;

    IF v_current_completed THEN
        RETURN; -- Already completed
    END IF;

    -- Upsert progress
    INSERT INTO user_milestones (user_id, milestone_id, current_progress, is_completed, completed_at, updated_at)
    VALUES (
        p_user_id,
        v_milestone_id,
        LEAST(p_new_progress, v_max_progress),
        p_new_progress >= v_max_progress,
        CASE WHEN p_new_progress >= v_max_progress THEN NOW() ELSE NULL END,
        NOW()
    )
    ON CONFLICT (user_id, milestone_id)
    DO UPDATE SET
        current_progress = LEAST(EXCLUDED.current_progress, v_max_progress),
        is_completed = EXCLUDED.current_progress >= v_max_progress,
        completed_at = CASE WHEN EXCLUDED.current_progress >= v_max_progress AND user_milestones.completed_at IS NULL THEN NOW() ELSE user_milestones.completed_at END,
        updated_at = NOW();

    -- Award points if just completed
    IF p_new_progress >= v_max_progress THEN
        UPDATE user_gamification
        SET total_points = total_points + v_reward_points,
            updated_at = NOW()
        WHERE user_id = p_user_id;

        -- Log activity
        INSERT INTO user_activity_log (user_id, activity_type, title, points_earned, metadata)
        VALUES (
            p_user_id,
            'milestone_completed',
            (SELECT name FROM milestones WHERE id = v_milestone_id),
            v_reward_points,
            jsonb_build_object('milestone_key', p_milestone_key)
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID,
    p_activity_type TEXT,
    p_title TEXT,
    p_description TEXT DEFAULT NULL,
    p_points INTEGER DEFAULT 0,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_activity_id UUID;
BEGIN
    INSERT INTO user_activity_log (user_id, activity_type, title, description, points_earned, metadata)
    VALUES (p_user_id, p_activity_type, p_title, p_description, p_points, p_metadata)
    RETURNING id INTO v_activity_id;

    -- Add points to gamification
    IF p_points > 0 THEN
        INSERT INTO user_gamification (user_id, total_points)
        VALUES (p_user_id, p_points)
        ON CONFLICT (user_id)
        DO UPDATE SET total_points = user_gamification.total_points + p_points, updated_at = NOW();
    END IF;

    RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_milestones_user ON user_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_user_milestones_completed ON user_milestones(user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user ON user_activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_type ON user_activity_log(user_id, activity_type);
CREATE INDEX IF NOT EXISTS idx_milestones_category ON milestones(category, is_active);
