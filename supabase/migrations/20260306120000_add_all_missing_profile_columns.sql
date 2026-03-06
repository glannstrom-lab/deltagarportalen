-- ============================================
-- Migration: Lägg till alla saknade kolumner i profiles
-- och verifiera att alla nödvändiga tabeller finns
-- ============================================

-- ============================================
-- 1. UPPDATERA PROFILES-TABELLEN
-- ============================================

-- Lägg till bio-kolumn
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'bio'
    ) THEN
        ALTER TABLE profiles ADD COLUMN bio TEXT;
        RAISE NOTICE '✅ Lade till bio-kolumn';
    END IF;
END $$;

-- Lägg till location-kolumn
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'location'
    ) THEN
        ALTER TABLE profiles ADD COLUMN location TEXT;
        RAISE NOTICE '✅ Lade till location-kolumn';
    END IF;
END $$;

-- Lägg till avatar_url om den saknas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
        RAISE NOTICE '✅ Lade till avatar_url-kolumn';
    END IF;
END $$;

-- Lägg till phone om den saknas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'phone'
    ) THEN
        ALTER TABLE profiles ADD COLUMN phone TEXT;
        RAISE NOTICE '✅ Lade till phone-kolumn';
    END IF;
END $$;

-- ============================================
-- 2. VERIFIERA ATT ALLA TABELLER FINNS
-- ============================================

-- Lista över tabeller som ska finnas
DO $$
DECLARE
    tables_list TEXT[] := ARRAY[
        'profiles',
        'cvs',
        'cv_versions',
        'cover_letters',
        'interest_results',
        'saved_jobs',
        'articles',
        'consultant_notes',
        'ai_usage_logs',
        'cv_analyses',
        'user_activities',
        'cv_shares',
        'consultant_participants',
        'invitations',
        'consultant_settings',
        'audit_logs',
        'achievements',
        'user_achievements',
        'user_gamification',
        'daily_tasks',
        'consultant_groups',
        'group_participants',
        'job_applications',
        'rejection_support_templates',
        'meeting_slots',
        'ai_conversations',
        'ai_messages',
        'user_onboarding',
        'exercise_answers',
        'article_bookmarks',
        'article_reading_progress',
        'article_checklists',
        'dashboard_preferences',
        'user_preferences',
        'mood_history',
        'journal_entries',
        'interest_guide_progress',
        'user_notifications',
        'notification_preferences',
        'interview_sessions',
        'user_drafts',
        'shared_jobs'
    ];
    t TEXT;
    missing_tables TEXT[] := '{}';
BEGIN
    FOREACH t IN ARRAY tables_list
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = t
        ) THEN
            missing_tables := array_append(missing_tables, t);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE NOTICE '⚠️  SAKNADE TABELLER: %', missing_tables;
    ELSE
        RAISE NOTICE '✅ Alla nödvändiga tabeller finns!';
    END IF;
END $$;

-- ============================================
-- 3. RAPPORTERA NUVARANDE KOLUMNER I PROFILES
-- ============================================

SELECT 
    'PROFILES KOLUMNER:' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
