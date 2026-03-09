-- ============================================
-- MIKRO-LÄRANDE HUB - FUNKTIONER OCH VYER
-- ============================================

-- --------------------------------------------
-- FUNKTION: Hämta användarens lärandestatistik
-- --------------------------------------------
CREATE OR REPLACE FUNCTION get_user_learning_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    streak_count INTEGER := 0;
    current_streak INTEGER := 0;
    last_date DATE;
BEGIN
    -- Räkna streak (på varandra följande dagar med aktivitet)
    SELECT DATE(created_at) INTO last_date
    FROM learning_activities
    WHERE user_id = p_user_id
    AND activity_type IN ('PROGRESS_UPDATE', 'COMPLETED')
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF last_date = CURRENT_DATE OR last_date = CURRENT_DATE - 1 THEN
        -- Räkna hur många dagar i rad
        WITH daily_activity AS (
            SELECT DISTINCT DATE(created_at) as activity_date
            FROM learning_activities
            WHERE user_id = p_user_id
            AND activity_type IN ('PROGRESS_UPDATE', 'COMPLETED')
            AND created_at >= CURRENT_DATE - INTERVAL '30 days'
            ORDER BY activity_date DESC
        ),
        streak_calc AS (
            SELECT 
                activity_date,
                activity_date - (ROW_NUMBER() OVER (ORDER BY activity_date DESC))::INTEGER AS streak_group
            FROM daily_activity
        )
        SELECT COUNT(*) INTO current_streak
        FROM streak_calc
        WHERE streak_group = (SELECT streak_group FROM streak_calc ORDER BY activity_date DESC LIMIT 1);
    END IF;

    SELECT jsonb_build_object(
        'total_courses_started', COUNT(DISTINCT cr.id) FILTER (WHERE cr.status IN ('STARTED', 'COMPLETED')),
        'total_courses_completed', COUNT(DISTINCT cr.id) FILTER (WHERE cr.status = 'COMPLETED'),
        'total_time_spent_minutes', COALESCE(SUM(cr.time_spent_minutes), 0),
        'current_streak_days', COALESCE(current_streak, 0),
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------
-- VY: Rekommenderade kurser per användare
-- --------------------------------------------
-- Ta bort vyn om den finns för att undvika kolumnnamn-konflikter
DROP VIEW IF EXISTS user_recommended_courses;

CREATE VIEW user_recommended_courses AS
SELECT 
    cr.id as recommendation_id,
    cr.user_id,
    cr.status,
    cr.relevance_score,
    cr.match_reason,
    cr.energy_level,
    cr.progress_percent,
    cr.time_spent_minutes,
    cr.started_at,
    cr.completed_at,
    c.id as course_id,
    c.title,
    c.description,
    c.provider,
    c.thumbnail_url,
    c.content_url,
    c.duration_minutes,
    c.difficulty_level as difficulty,
    c.is_free,
    c.skills_tags as skills,
    c.rating,
    c.view_count,
    lp.id as learning_path_id,
    lp.target_skill,
    lp.priority
FROM course_recommendations cr
JOIN courses c ON cr.course_id = c.id
LEFT JOIN user_learning_paths lp ON cr.learning_path_id = lp.id
WHERE cr.status != 'DISMISSED';

-- --------------------------------------------
-- RLS för vyn
-- --------------------------------------------
ALTER VIEW user_recommended_courses OWNER TO postgres;

-- --------------------------------------------
-- FUNKTION: Säker vy-access
-- --------------------------------------------
CREATE OR REPLACE FUNCTION get_user_courses(p_user_id UUID)
RETURNS SETOF user_recommended_courses AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM user_recommended_courses
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------
-- FUNKTION: Skapa lärandemål från skill gap
-- --------------------------------------------
CREATE OR REPLACE FUNCTION create_learning_path_from_gap(
    p_user_id UUID,
    p_target_skill TEXT,
    p_source TEXT DEFAULT 'USER_SELECTED',
    p_priority INTEGER DEFAULT 5
)
RETURNS UUID AS $$
DECLARE
    new_id UUID;
    existing_id UUID;
BEGIN
    -- Kolla om det redan finns en aktiv path för denna skill
    SELECT id INTO existing_id
    FROM user_learning_paths
    WHERE user_id = p_user_id
    AND target_skill = p_target_skill
    AND status = 'ACTIVE';
    
    IF existing_id IS NOT NULL THEN
        -- Uppdatera befintlig path
        UPDATE user_learning_paths 
        SET priority = p_priority,
            skill_gap_source = p_source,
            updated_at = NOW()
        WHERE id = existing_id;
        
        RETURN existing_id;
    END IF;
    
    -- Skapa ny path
    INSERT INTO user_learning_paths (
        user_id,
        target_skill,
        skill_gap_source,
        priority,
        status
    ) VALUES (
        p_user_id,
        p_target_skill,
        p_source,
        p_priority,
        'ACTIVE'
    )
    RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------
-- FUNKTION: Generera kursrekommendationer
-- --------------------------------------------
CREATE OR REPLACE FUNCTION generate_course_recommendations(
    p_user_id UUID,
    p_learning_path_id UUID,
    p_max_results INTEGER DEFAULT 5
)
RETURNS INTEGER AS $$
DECLARE
    target_skill TEXT;
    rec_count INTEGER := 0;
    course_record RECORD;
BEGIN
    -- Hämta target skill från learning path
    SELECT lp.target_skill INTO target_skill
    FROM user_learning_paths lp
    WHERE lp.id = p_learning_path_id
    AND lp.user_id = p_user_id;
    
    IF target_skill IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Hitta matchande kurser som inte redan är rekommenderade
    FOR course_record IN
        SELECT 
            c.id as course_id,
            CASE 
                WHEN c.duration_minutes <= 15 THEN 'LOW'
                WHEN c.duration_minutes <= 30 THEN 'MEDIUM'
                ELSE 'HIGH'
            END as energy_level,
            CASE
                WHEN c.skills_tags @> ARRAY[target_skill] THEN 90
                WHEN c.skills_tags && ARRAY[target_skill] THEN 70
                WHEN c.title ILIKE '%' || target_skill || '%' THEN 60
                ELSE 40
            END as relevance_score
        FROM courses c
        WHERE c.is_active = TRUE
        AND c.is_free = TRUE
        AND NOT EXISTS (
            SELECT 1 FROM course_recommendations cr
            WHERE cr.user_id = p_user_id
            AND cr.course_id = c.id
        )
        AND (
            c.skills_tags && ARRAY[target_skill]
            OR c.title ILIKE '%' || target_skill || '%'
            OR c.description ILIKE '%' || target_skill || '%'
        )
        ORDER BY relevance_score DESC, c.rating DESC NULLS LAST
        LIMIT p_max_results
    LOOP
        INSERT INTO course_recommendations (
            user_id,
            learning_path_id,
            course_id,
            match_reason,
            relevance_score,
            energy_level,
            status
        ) VALUES (
            p_user_id,
            p_learning_path_id,
            course_record.course_id,
            'Matchar ditt mål: ' || target_skill,
            course_record.relevance_score,
            course_record.energy_level,
            'SUGGESTED'
        )
        ON CONFLICT (user_id, course_id) DO NOTHING;
        
        IF FOUND THEN
            rec_count := rec_count + 1;
        END IF;
    END LOOP;
    
    RETURN rec_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------
-- TRIGGER: Auto-generera rekommendationer vid nytt learning path
-- --------------------------------------------
CREATE OR REPLACE FUNCTION auto_generate_recommendations()
RETURNS TRIGGER AS $$
BEGIN
    -- Generera rekommendationer asynkront (i bakgrunden)
    PERFORM pg_notify('generate_recommendations', json_build_object(
        'user_id', NEW.user_id,
        'learning_path_id', NEW.id
    )::text);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_generate_recommendations ON user_learning_paths;
CREATE TRIGGER auto_generate_recommendations
    AFTER INSERT ON user_learning_paths
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_recommendations();

-- --------------------------------------------
-- SEED: Lägg till fler exempelkurser
-- --------------------------------------------
INSERT INTO courses (external_id, provider, title, description, content_url, duration_minutes, difficulty_level, is_free, language, skills_tags, career_fields, is_active)
VALUES 
-- Digitala kompetenser
('yt-excel-1', 'YOUTUBE', 'Excel för nybörjare - Komplett kurs', 'Lär dig allt från grunderna till pivottabeller och formler i Excel.', 'https://youtube.com/watch?v=excel-beginners', 60, 'BEGINNER', true, 'sv', ARRAY['excel', 'microsoft office', 'datahantering'], ARRAY['kontor', 'administration', 'ekonomi'], true),
('yt-word-1', 'YOUTUBE', 'Word för nybörjare', 'Grundläggande funktioner i Microsoft Word.', 'https://youtube.com/watch?v=word-beginners', 45, 'BEGINNER', true, 'sv', ARRAY['word', 'microsoft office', 'dokumenthantering'], ARRAY['kontor', 'administration'], true),
('yt-ppt-1', 'YOUTUBE', 'PowerPoint för presentationer', 'Skapa professionella presentationer.', 'https://youtube.com/watch?v=ppt-beginners', 40, 'BEGINNER', true, 'sv', ARRAY['powerpoint', 'microsoft office', 'presentationer'], ARRAY['kontor', 'sälj', 'marknadsföring'], true),

-- Kommunikation
('yt-kommunikation-1', 'YOUTUBE', 'Effektiv kommunikation på jobbet', 'Lär dig att kommunicera tydligt och professionellt.', 'https://youtube.com/watch?v=kommunikation', 30, 'BEGINNER', true, 'sv', ARRAY['kommunikation', 'samarbete', 'professionalism'], ARRAY['alla'], true),
('yt-kundservice-1', 'YOUTUBE', 'Kundservice för nybörjare', 'Grundläggande tekniker för utmärkt kundservice.', 'https://youtube.com/watch?v=kundservice', 35, 'BEGINNER', true, 'sv', ARRAY['kundservice', 'kommunikation', 'problemlösning'], ARRAY['service', 'kontor', 'försäljning'], true),

-- Jobbsökning
('yt-cv-1', 'YOUTUBE', 'Skriva CV som får resultat', 'Skapa ett CV som sticker ut från mängden.', 'https://youtube.com/watch?v=cv-skriva', 25, 'BEGINNER', true, 'sv', ARRAY['cv', 'jobbansökan', 'karriär'], ARRAY['alla'], true),
('yt-intervju-1', 'YOUTUBE', 'Jobbintervju - Så lyckas du', 'Förbered dig inför jobbintervjun.', 'https://youtube.com/watch?v=intervju-tips', 40, 'BEGINNER', true, 'sv', ARRAY['intervju', 'kommunikation', 'jobbsökning'], ARRAY['alla'], true),
('yt-linkedin-1', 'YOUTUBE', 'LinkedIn för jobbsökande', 'Optimera din LinkedIn-profil.', 'https://youtube.com/watch?v=linkedin-opt', 35, 'BEGINNER', true, 'sv', ARRAY['linkedin', 'nätverkande', 'karriär'], ARRAY['alla'], true),

-- Teknik/IT
('yt-programmering-1', 'YOUTUBE', 'Programmering för nybörjare', 'Introduktion till programmering.', 'https://youtube.com/watch?v=prog-intro', 90, 'BEGINNER', true, 'sv', ARRAY['programmering', 'it', 'teknik'], ARRAY['it', 'teknik'], true),
('yt-digital-1', 'YOUTUBE', 'Digital kompetens för alla', 'Grundläggande digital kompetens.', 'https://youtube.com/watch?v=digital-komp', 30, 'BEGINNER', true, 'sv', ARRAY['digital kompetens', 'it', 'datorvana'], ARRAY['alla'], true),

-- Vård
('yt-vard-1', 'YOUTUBE', 'Introduktion till vården', 'Om att arbeta inom vård och omsorg.', 'https://youtube.com/watch?v=varden-intro', 25, 'BEGINNER', true, 'sv', ARRAY['vård', 'omsorg', 'hälsa'], ARRAY['vård', 'omsorg'], true),
('yt-aldreomsorg-1', 'YOUTUBE', 'Arbeta inom äldreomsorg', 'Vad innebär det att jobba med äldre?', 'https://youtube.com/watch?v=aldreomsorg', 30, 'BEGINNER', true, 'sv', ARRAY['äldreomsorg', 'vård', 'omsorg'], ARRAY['vård', 'omsorg'], true),

-- Ekonomi
('yt-ekonomi-1', 'YOUTUBE', 'Ekonomi för nybörjare', 'Grundläggande ekonomiska begrepp.', 'https://youtube.com/watch?v=ekonomi-basics', 45, 'BEGINNER', true, 'sv', ARRAY['ekonomi', 'budget', 'finans'], ARRAY['ekonomi', 'kontor'], true),
('yt-bokforing-1', 'YOUTUBE', 'Bokföring för småföretagare', 'Grundläggande bokföring.', 'https://youtube.com/watch?v=bokforing', 60, 'BEGINNER', true, 'sv', ARRAY['bokföring', 'ekonomi', 'företagande'], ARRAY['ekonomi', 'företagande'], true),

-- Projektledning
('yt-projekt-1', 'YOUTUBE', 'Projektledning för nybörjare', 'Grunderna i projektledning.', 'https://youtube.com/watch?v=projekt-intro', 50, 'BEGINNER', true, 'sv', ARRAY['projektledning', 'ledarskap', 'organisation'], ARRAY['ledarskap', 'kontor', 'it'], true),
('yt-agile-1', 'YOUTUBE', 'Agila arbetsmetoder', 'Introduktion till agile och scrum.', 'https://youtube.com/watch?v=agile-intro', 40, 'BEGINNER', true, 'sv', ARRAY['agile', 'scrum', 'projektledning'], ARRAY['it', 'ledarskap'], true)
ON CONFLICT (provider, external_id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    is_active = TRUE,
    updated_at = NOW();

-- --------------------------------------------
-- Kommentarer
-- --------------------------------------------
COMMENT ON FUNCTION get_user_learning_stats IS 'Hämtar statistik om användarens lärandeaktivitet';
COMMENT ON VIEW user_recommended_courses IS 'Vy som sammanställer rekommendationer med kursdata';
COMMENT ON FUNCTION generate_course_recommendations IS 'Genererar kursrekommendationer baserat på learning path';
