-- A17 (SEC-02): 18 SECURITY DEFINER-funktioner tar p_user_id utan att kontrollera
-- auth.uid(), och `anon` har EXECUTE på samtliga.
--
-- Mekanismen: funktionsägare = postgres, tabellägare = postgres,
-- relforcerowsecurity = false → en SECURITY DEFINER-funktion kör som tabellägaren,
-- som per default är undantagen från RLS. Funktionen tar dessutom emot vems data
-- den ska röra som argument. Resultatet är en RLS-bypass som ingen policy kan rädda.
--
-- Bevis (kört som anon mot prod 2026-08-04):
--   set local role anon;
--   select (select count(*) from saved_jobs) as direkt,                       -- 0  (RLS håller)
--          get_application_stats('<annans uuid>') as via_rpc;                 -- {"total":8,...}
--
-- Nio av funktionerna läser andras data, nio skriver i andras namn —
-- post_to_community_feed(p_user_id, …) låter en oautentiserad anropare publicera
-- i valfri användares namn.
--
-- ÅTGÄRD I TVÅ LAGER
--
-- Lager 1 — grinden (de tre funktioner som faktiskt anropas):
--   IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() → 42501.
--   Villkoret `auth.uid() IS NOT NULL` är medvetet: service_role har ingen
--   auth.uid(), och `learning-progress`-edgefunktionen anropar
--   get_user_learning_stats med service role. Anon skulle också passera det
--   villkoret — därför är lager 2 den bindande grinden mot oautentiserade.
--
-- Lager 2 — REVOKE:
--   * anon förlorar EXECUTE på alla 18. Inloggade användare går som
--     `authenticated`; ingen av funktionerna har någon publik användning.
--   * De 15 som saknar anropare i kodbasen (verifierat 2026-08-04 mot client/src,
--     supabase/functions, client/api och api) förlorar EXECUTE även för
--     `authenticated`. De ligger kvar orörda i övrigt.
--
-- ÅTERINFÖRANDE: den som behöver en av de 15 igen ska lägga in samma grind som
-- lager 1 FÖRST och därefter GRANTa till authenticated. Grinden är inte valfri —
-- utan den återskapas hålet den här migrationen stänger.
--
-- Kör med:
--   npx supabase db query --linked -f supabase/migrations/20260804110000_fix_security_definer_user_id_bypass.sql

-- ---------------------------------------------------------------------------
-- LAGER 1: grind i de tre funktioner som har anropare
-- Kropparna är oförändrade — bara grinden är tillagd överst.
-- ---------------------------------------------------------------------------

-- Anropas av client/src/services/applicationsApi.ts:355 (alltid med egen user.id)
CREATE OR REPLACE FUNCTION public.get_application_stats(p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSON;
BEGIN
  -- A17: en inloggad användare får bara fråga om sin egen data.
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Forbidden: p_user_id matchar inte den inloggade anvandaren'
      USING ERRCODE = '42501';
  END IF;

  SELECT json_build_object(
    'total', COUNT(*),
    'interested', COUNT(*) FILTER (WHERE status = 'INTERESTED'),
    'saved', COUNT(*) FILTER (WHERE status = 'SAVED'),
    'applied', COUNT(*) FILTER (WHERE status = 'APPLIED'),
    'screening', COUNT(*) FILTER (WHERE status = 'SCREENING'),
    'phone', COUNT(*) FILTER (WHERE status = 'PHONE'),
    'interview', COUNT(*) FILTER (WHERE status = 'INTERVIEW'),
    'assessment', COUNT(*) FILTER (WHERE status = 'ASSESSMENT'),
    'offer', COUNT(*) FILTER (WHERE status = 'OFFER'),
    'accepted', COUNT(*) FILTER (WHERE status = 'ACCEPTED'),
    'rejected', COUNT(*) FILTER (WHERE status = 'REJECTED'),
    'withdrawn', COUNT(*) FILTER (WHERE status = 'WITHDRAWN'),
    'active', COUNT(*) FILTER (WHERE archived_at IS NULL AND status NOT IN ('ACCEPTED', 'REJECTED', 'WITHDRAWN')),
    'this_week', COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days'),
    'this_month', COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')
  ) INTO result
  FROM saved_jobs
  WHERE user_id = p_user_id;

  RETURN result;
END;
$function$;

-- Anropas av supabase/functions/learning-progress/index.ts:24 (service role) och :290
CREATE OR REPLACE FUNCTION public.get_user_learning_stats(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    result JSONB;
    v_started INTEGER := 0;
    v_completed INTEGER := 0;
    v_time_spent INTEGER := 0;
    v_skills INTEGER := 0;
    v_certs INTEGER := 0;
BEGIN
    -- A17: en inloggad användare får bara fråga om sin egen data.
    -- service_role (auth.uid() IS NULL) passerar — edge-funktionen behöver det.
    IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Forbidden: p_user_id matchar inte den inloggade anvandaren'
        USING ERRCODE = '42501';
    END IF;

    SELECT
        COUNT(*) FILTER (WHERE status IN ('STARTED', 'COMPLETED')),
        COUNT(*) FILTER (WHERE status = 'COMPLETED'),
        COALESCE(SUM(time_spent_minutes), 0)
    INTO v_started, v_completed, v_time_spent
    FROM course_recommendations
    WHERE user_id = p_user_id;

    SELECT COUNT(DISTINCT target_skill)
    INTO v_skills
    FROM user_learning_paths
    WHERE user_id = p_user_id AND status = 'ACTIVE';

    SELECT COUNT(*) INTO v_certs
    FROM user_certifications
    WHERE user_id = p_user_id;

    result := jsonb_build_object(
        'total_courses_started', COALESCE(v_started, 0),
        'total_courses_completed', COALESCE(v_completed, 0),
        'total_time_spent_minutes', COALESCE(v_time_spent, 0),
        'current_streak_days', 0,
        'skills_in_progress', COALESCE(v_skills, 0),
        'certifications_count', COALESCE(v_certs, 0)
    );

    RETURN result;
END;
$function$;

-- Anropas av client/src/hooks/useAchievementTracker.ts:80 (alltid med egen user.id),
-- som i sin tur används av useApplications, useSavedJobs, useCVAutoSave, MoodTracker.
CREATE OR REPLACE FUNCTION public.log_user_activity(
    p_user_id uuid,
    p_activity_type text,
    p_title text,
    p_description text DEFAULT NULL::text,
    p_points integer DEFAULT 0,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_activity_id UUID;
BEGIN
    -- A17: en inloggad användare får bara skriva i sitt eget namn.
    IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Forbidden: p_user_id matchar inte den inloggade anvandaren'
        USING ERRCODE = '42501';
    END IF;

    INSERT INTO user_activity_log (user_id, activity_type, title, description, points_earned, metadata)
    VALUES (p_user_id, p_activity_type, p_title, p_description, p_points, p_metadata)
    RETURNING id INTO v_activity_id;

    -- Add points to gamification
    IF p_points > 0 THEN
        INSERT INTO user_gamification (user_id, total_points, current_streak, level)
        VALUES (p_user_id, p_points, 0, 1)
        ON CONFLICT (user_id)
        DO UPDATE SET total_points = user_gamification.total_points + p_points, updated_at = NOW();
    END IF;

    RETURN v_activity_id;
END;
$function$;

-- ---------------------------------------------------------------------------
-- LAGER 2a: anon förlorar EXECUTE på alla 18
-- ---------------------------------------------------------------------------

REVOKE EXECUTE ON FUNCTION public.create_learning_path_from_gap(uuid, text, text, integer)         FROM anon;
REVOKE EXECUTE ON FUNCTION public.find_buddy_matches(uuid, integer)                                FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_course_recommendations(uuid, uuid, integer)             FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_application_stats(uuid)                                      FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_mood_streak(uuid)                                            FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_or_create_user_preferences(uuid)                             FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_stale_applications(uuid, integer)                            FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_upcoming_reminders(uuid, integer)                            FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_courses(uuid)                                           FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_learning_stats(uuid)                                    FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_user_points(uuid, integer)                             FROM anon;
REVOKE EXECUTE ON FUNCTION public.initialize_user_milestones(uuid)                                 FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_user_activity(uuid, text, text, text, integer, jsonb)        FROM anon;
REVOKE EXECUTE ON FUNCTION public.post_to_community_feed(uuid, text, text, text, jsonb, boolean)   FROM anon;
REVOKE EXECUTE ON FUNCTION public.react_to_feed_item(uuid, uuid, text)                             FROM anon;
REVOKE EXECUTE ON FUNCTION public.remove_reaction(uuid, uuid, text)                                FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_milestone_progress(uuid, text, integer)                   FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_user_streak(uuid)                                         FROM anon;

-- ---------------------------------------------------------------------------
-- LAGER 2b: de 15 utan anropare förlorar EXECUTE även för authenticated
-- (get_application_stats, get_user_learning_stats och log_user_activity behålls
--  för authenticated — de har grinden ovan och används av appen.)
-- ---------------------------------------------------------------------------

REVOKE EXECUTE ON FUNCTION public.create_learning_path_from_gap(uuid, text, text, integer)         FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.find_buddy_matches(uuid, integer)                                FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_course_recommendations(uuid, uuid, integer)             FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_mood_streak(uuid)                                            FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_or_create_user_preferences(uuid)                             FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_stale_applications(uuid, integer)                            FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_upcoming_reminders(uuid, integer)                            FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_courses(uuid)                                           FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_user_points(uuid, integer)                             FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.initialize_user_milestones(uuid)                                 FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.post_to_community_feed(uuid, text, text, text, jsonb, boolean)   FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.react_to_feed_item(uuid, uuid, text)                             FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.remove_reaction(uuid, uuid, text)                                FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_milestone_progress(uuid, text, integer)                   FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_user_streak(uuid)                                         FROM authenticated;
