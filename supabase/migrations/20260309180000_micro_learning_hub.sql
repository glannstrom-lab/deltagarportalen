-- ============================================
-- MIKRO-LÄRANDE HUB - DATABASSCHEMA
-- ============================================
-- Skapat: 2026-03-09
-- Team: Deltagarportalen

-- --------------------------------------------
-- 1. KURSDATA - Lokal cache av externa kurser
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Kursinformation från extern källa
    external_id TEXT NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('YOUTUBE', 'KHAN_ACADEMY', 'LINKEDIN_LEARNING', 'FUTURELEARN', 'COURSERA', 'UDEMY', 'OTHER', 'INTERNAL')),
    title TEXT NOT NULL,
    description TEXT,
    instructor TEXT,
    thumbnail_url TEXT,
    content_url TEXT NOT NULL,
    
    -- Metadata för filtrering
    duration_minutes INTEGER,
    difficulty_level TEXT CHECK (difficulty_level IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS')),
    is_free BOOLEAN DEFAULT TRUE,
    language TEXT DEFAULT 'sv',
    
    -- Kompetenskategorisering (för matchning)
    skills_tags TEXT[] DEFAULT '{}',
    career_fields TEXT[] DEFAULT '{}',
    
    -- Engagemangsdata
    view_count INTEGER DEFAULT 0,
    rating DECIMAL(2,1),
    review_count INTEGER DEFAULT 0,
    
    -- Cachning
    external_data JSONB DEFAULT '{}',
    last_synced_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(provider, external_id)
);

-- --------------------------------------------
-- 2. ANVÄNDARENS LÄRANDE - Progress & Plan
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS user_learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Identifiera vad som ska läras
    target_skill TEXT NOT NULL,
    skill_gap_source TEXT CHECK (skill_gap_source IN ('CV_ANALYSIS', 'JOB_MATCH', 'USER_SELECTED', 'CAREER_GOAL')),
    source_job_id TEXT,
    
    -- Prioritering
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    deadline DATE,
    
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partial unique index: Endast en aktiv path per skill
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_learning_path 
ON user_learning_paths(user_id, target_skill) 
WHERE status = 'ACTIVE';

-- --------------------------------------------
-- 3. KURSREKOMMENDATIONER - AI-genererade förslag
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS course_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    learning_path_id UUID REFERENCES user_learning_paths(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    
    -- Varför rekommenderas denna?
    match_reason TEXT,
    relevance_score INTEGER CHECK (relevance_score >= 0 AND relevance_score <= 100),
    energy_level TEXT CHECK (energy_level IN ('LOW', 'MEDIUM', 'HIGH')),
    
    -- Användarens interaktion
    status TEXT DEFAULT 'SUGGESTED' CHECK (status IN ('SUGGESTED', 'BOOKMARKED', 'STARTED', 'COMPLETED', 'DISMISSED')),
    
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    time_spent_minutes INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint för att undvika dubbletter
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_course_rec 
ON course_recommendations(user_id, course_id);

-- --------------------------------------------
-- 4. LÄRANDEAKTIVITETER - Spår all aktivitet
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS learning_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    recommendation_id UUID REFERENCES course_recommendations(id) ON DELETE CASCADE,
    
    activity_type TEXT NOT NULL CHECK (activity_type IN ('STARTED', 'PROGRESS_UPDATE', 'COMPLETED', 'NOTE_ADDED', 'SHARED', 'RATED', 'BOOKMARKED')),
    
    -- Data för aktiviteten
    progress_percent INTEGER,
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------
-- 5. CERTIFIERINGAR & AVSLUTADE KURSER
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS user_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Kan vara länkad till en kurs eller fristående
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    course_recommendation_id UUID REFERENCES course_recommendations(id) ON DELETE SET NULL,
    
    -- Certifikatinfo
    title TEXT NOT NULL,
    issuer TEXT NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    credential_url TEXT,
    credential_id TEXT,
    
    -- För att kunna visa i CV
    is_visible_in_cv BOOLEAN DEFAULT TRUE,
    cv_section TEXT DEFAULT 'CERTIFICATES',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------
-- 6. KUNSKAPSBANK-LÄNK - Koppla kurser till artiklar
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS article_course_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    relevance_score INTEGER DEFAULT 50,
    sort_order INTEGER DEFAULT 0,
    
    UNIQUE(article_id, course_id)
);

-- --------------------------------------------
-- INDEX för prestanda
-- --------------------------------------------
CREATE INDEX IF NOT EXISTS idx_courses_provider ON courses(provider);
CREATE INDEX IF NOT EXISTS idx_courses_skills ON courses USING GIN(skills_tags);
CREATE INDEX IF NOT EXISTS idx_courses_career ON courses USING GIN(career_fields);
CREATE INDEX IF NOT EXISTS idx_courses_difficulty ON courses(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_courses_duration ON courses(duration_minutes);
CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_learning_paths_user ON user_learning_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_skill ON user_learning_paths(target_skill);
CREATE INDEX IF NOT EXISTS idx_learning_paths_status ON user_learning_paths(status);

CREATE INDEX IF NOT EXISTS idx_recommendations_user ON course_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON course_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_recommendations_path ON course_recommendations(learning_path_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_score ON course_recommendations(relevance_score DESC);

CREATE INDEX IF NOT EXISTS idx_certifications_user ON user_certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_certifications_visible ON user_certifications(is_visible_in_cv) WHERE is_visible_in_cv = TRUE;

CREATE INDEX IF NOT EXISTS idx_learning_activities_user ON learning_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_activities_type ON learning_activities(activity_type);

-- --------------------------------------------
-- RLS POLICIES
-- --------------------------------------------
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_course_links ENABLE ROW LEVEL SECURITY;

-- Courses: Alla kan se aktiva kurser
DROP POLICY IF EXISTS "Anyone can view active courses" ON courses;
CREATE POLICY "Anyone can view active courses" ON courses
    FOR SELECT USING (is_active = TRUE);

-- Learning Paths: Användare hanterar egna
DROP POLICY IF EXISTS "Users manage own learning paths" ON user_learning_paths;
CREATE POLICY "Users manage own learning paths" ON user_learning_paths
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Consultants can view participant paths" ON user_learning_paths;
CREATE POLICY "Consultants can view participant paths" ON user_learning_paths
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND consultant_id = auth.uid())
    );

-- Recommendations: Användare hanterar egna
DROP POLICY IF EXISTS "Users manage own recommendations" ON course_recommendations;
CREATE POLICY "Users manage own recommendations" ON course_recommendations
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Consultants can view participant recommendations" ON course_recommendations;
CREATE POLICY "Consultants can view participant recommendations" ON course_recommendations
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND consultant_id = auth.uid())
    );

-- Activities: Användare hanterar egna
DROP POLICY IF EXISTS "Users manage own activities" ON learning_activities;
CREATE POLICY "Users manage own activities" ON learning_activities
    FOR ALL USING (auth.uid() = user_id);

-- Certifications: Användare hanterar egna
DROP POLICY IF EXISTS "Users manage own certifications" ON user_certifications;
CREATE POLICY "Users manage own certifications" ON user_certifications
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Consultants can view participant certifications" ON user_certifications;
CREATE POLICY "Consultants can view participant certifications" ON user_certifications
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND consultant_id = auth.uid())
    );

-- Article links: Alla kan se
DROP POLICY IF EXISTS "Anyone can view article links" ON article_course_links;
CREATE POLICY "Anyone can view article links" ON article_course_links
    FOR SELECT USING (TRUE);

-- --------------------------------------------
-- FUNKTION: Auto-uppdatera updated_at
-- --------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_learning_paths_updated_at ON user_learning_paths;
CREATE TRIGGER update_learning_paths_updated_at BEFORE UPDATE ON user_learning_paths
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recommendations_updated_at ON course_recommendations;
CREATE TRIGGER update_recommendations_updated_at BEFORE UPDATE ON course_recommendations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- --------------------------------------------
-- FUNKTION: Synkronisera certifikat till CV
-- --------------------------------------------
CREATE OR REPLACE FUNCTION sync_certification_to_cv()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_visible_in_cv THEN
        UPDATE cvs 
        SET certificates = COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', uc.id,
                    'name', uc.title,
                    'issuer', uc.issuer,
                    'date', uc.issue_date,
                    'url', uc.credential_url
                )
            )
            FROM user_certifications uc 
            WHERE uc.user_id = NEW.user_id AND uc.is_visible_in_cv = TRUE),
            '[]'::jsonb
        ),
        updated_at = NOW()
        WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_cert_to_cv ON user_certifications;
CREATE TRIGGER sync_cert_to_cv
    AFTER INSERT OR UPDATE ON user_certifications
    FOR EACH ROW EXECUTE FUNCTION sync_certification_to_cv();

-- --------------------------------------------
-- FUNKTION: Hämta användarens lärandestatistik
-- --------------------------------------------
CREATE OR REPLACE FUNCTION get_user_learning_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_courses_started', COUNT(DISTINCT cr.id) FILTER (WHERE cr.status IN ('STARTED', 'COMPLETED')),
        'total_courses_completed', COUNT(DISTINCT cr.id) FILTER (WHERE cr.status = 'COMPLETED'),
        'total_time_spent_minutes', COALESCE(SUM(cr.time_spent_minutes), 0),
        'current_streak_days', (
            SELECT COUNT(*) FROM (
                SELECT DATE(created_at) as date
                FROM learning_activities
                WHERE user_id = p_user_id
                AND activity_type = 'PROGRESS_UPDATE'
                AND created_at >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY DATE(created_at)
                ORDER BY DATE(created_at) DESC
            ) recent_days
        ),
        'skills_in_progress', COUNT(DISTINCT lp.target_skill) FILTER (WHERE lp.status = 'ACTIVE'),
        'certifications_count', COUNT(DISTINCT uc.id)
    )
    INTO result
    FROM course_recommendations cr
    LEFT JOIN user_learning_paths lp ON cr.user_id = lp.user_id
    LEFT JOIN user_certifications uc ON cr.user_id = uc.user_id
    WHERE cr.user_id = p_user_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------
-- SEED-DATA: Exempelkompetenser för test
-- --------------------------------------------
INSERT INTO courses (external_id, provider, title, description, content_url, duration_minutes, difficulty_level, is_free, language, skills_tags, career_fields, is_active)
VALUES 
('sample-excel-1', 'YOUTUBE', 'Excel för nybörjare - Komplett guide', 'Lär dig grunderna i Excel med denna omfattande guide för nybörjare.', 'https://youtube.com/watch?v=sample1', 45, 'BEGINNER', true, 'sv', ARRAY['excel', 'kalkylblad', 'microsoft office'], ARRAY['kontor', 'administration', 'ekonomi'], true),
('sample-cv-1', 'YOUTUBE', 'Skriva ett vinnande CV', 'Lär dig hur du skriver ett CV som sticker ut.', 'https://youtube.com/watch?v=sample2', 20, 'BEGINNER', true, 'sv', ARRAY['cv', 'jobbansökan', 'karriär'], ARRAY['alla'], true),
('sample-interview-1', 'YOUTUBE', 'Intervjuteknik för nybörjare', 'Förbered dig för jobbintervjun med dessa tips.', 'https://youtube.com/watch?v=sample3', 30, 'BEGINNER', true, 'sv', ARRAY['intervju', 'kommunikation', 'jobbsökning'], ARRAY['alla'], true)
ON CONFLICT (provider, external_id) DO NOTHING;

-- --------------------------------------------
-- VY: Rekommenderade kurser per användare
-- --------------------------------------------
CREATE OR REPLACE VIEW user_recommended_courses AS
SELECT 
    cr.id as recommendation_id,
    cr.user_id,
    cr.status,
    cr.relevance_score,
    cr.match_reason,
    cr.energy_level,
    cr.progress_percent,
    c.id as course_id,
    c.title,
    c.description,
    c.provider,
    c.thumbnail_url,
    c.content_url,
    c.duration_minutes,
    c.difficulty_level,
    c.is_free,
    c.skills_tags,
    lp.target_skill,
    lp.priority
FROM course_recommendations cr
JOIN courses c ON cr.course_id = c.id
LEFT JOIN user_learning_paths lp ON cr.learning_path_id = lp.id
WHERE cr.status != 'DISMISSED';

COMMENT ON TABLE courses IS 'Kurskatalog med metadata för matchning';
COMMENT ON TABLE user_learning_paths IS 'Användarens lärandemål och planer';
COMMENT ON TABLE course_recommendations IS 'AI-genererade kursrekommendationer';
COMMENT ON TABLE learning_activities IS 'Spårning av all lärandeaktivitet';
COMMENT ON TABLE user_certifications IS 'Avslutade kurser och certifieringar för CV';
COMMENT ON TABLE article_course_links IS 'Koppling mellan kunskapsbank-artiklar och kurser';
