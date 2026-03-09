-- Fix: Skapa get_user_learning_stats funktionen
-- Kör detta i Supabase SQL Editor om du får 404-fel

-- Skapa funktionen för att hämta användarens lärandestatistik
CREATE OR REPLACE FUNCTION get_user_learning_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    v_started INTEGER := 0;
    v_completed INTEGER := 0;
    v_time_spent INTEGER := 0;
    v_streak INTEGER := 0;
    v_skills INTEGER := 0;
    v_certs INTEGER := 0;
BEGIN
    -- Räkna påbörjade och avslutade kurser
    SELECT 
        COUNT(*) FILTER (WHERE status IN ('STARTED', 'COMPLETED')),
        COUNT(*) FILTER (WHERE status = 'COMPLETED'),
        COALESCE(SUM(time_spent_minutes), 0)
    INTO v_started, v_completed, v_time_spent
    FROM course_recommendations
    WHERE user_id = p_user_id;
    
    -- Räkna aktiva skills
    SELECT COUNT(DISTINCT target_skill)
    INTO v_skills
    FROM user_learning_paths
    WHERE user_id = p_user_id
    AND status = 'ACTIVE';
    
    -- Räkna certifieringar
    SELECT COUNT(*)
    INTO v_certs
    FROM user_certifications
    WHERE user_id = p_user_id;
    
    result := jsonb_build_object(
        'total_courses_started', COALESCE(v_started, 0),
        'total_courses_completed', COALESCE(v_completed, 0),
        'total_time_spent_minutes', COALESCE(v_time_spent, 0),
        'current_streak_days', v_streak,
        'skills_in_progress', COALESCE(v_skills, 0),
        'certifications_count', COALESCE(v_certs, 0)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ge execute-rättigheter till alla
GRANT EXECUTE ON FUNCTION get_user_learning_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_learning_stats(UUID) TO anon;

-- Verifiera att funktionen finns
SELECT 
    proname as function_name,
    proargnames as arguments,
    prorettype::regtype as return_type
FROM pg_proc 
WHERE proname = 'get_user_learning_stats';
