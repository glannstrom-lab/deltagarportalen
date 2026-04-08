-- ============================================
-- Fix function_search_path_mutable warnings
-- Date: 2026-04-08
-- ============================================
-- This migration adds explicit search_path to all SECURITY DEFINER functions
-- to prevent search path injection attacks.
-- Setting search_path = 'public' ensures functions only look in the public schema.
-- ============================================

-- Helper function to safely set search_path on existing functions
CREATE OR REPLACE FUNCTION pg_temp.set_function_search_path(
  func_schema TEXT,
  func_name TEXT,
  func_args TEXT DEFAULT ''
) RETURNS VOID AS $$
DECLARE
  full_name TEXT;
BEGIN
  full_name := func_schema || '.' || func_name;
  IF func_args != '' THEN
    full_name := full_name || '(' || func_args || ')';
  ELSE
    full_name := full_name || '()';
  END IF;

  BEGIN
    EXECUTE format('ALTER FUNCTION %s SET search_path = ''public''', full_name);
  EXCEPTION WHEN undefined_function THEN
    -- Function doesn't exist, skip silently
    NULL;
  WHEN OTHERS THEN
    RAISE WARNING 'Could not alter %: %', full_name, SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1. Critical Auth/User Management Functions
-- ============================================

SELECT pg_temp.set_function_search_path('public', 'handle_new_user');
SELECT pg_temp.set_function_search_path('public', 'get_current_user_role');
SELECT pg_temp.set_function_search_path('public', 'is_admin_user');
SELECT pg_temp.set_function_search_path('public', 'is_admin_or_superadmin');
SELECT pg_temp.set_function_search_path('public', 'can_view_profile', 'uuid');
SELECT pg_temp.set_function_search_path('public', 'can_assign_role', 'text');
SELECT pg_temp.set_function_search_path('public', 'log_profile_change');
SELECT pg_temp.set_function_search_path('public', 'log_profile_changes');
SELECT pg_temp.set_function_search_path('public', 'check_role_limit');
SELECT pg_temp.set_function_search_path('public', 'check_role_change_allowed', 'uuid, text, text[], text');
SELECT pg_temp.set_function_search_path('public', 'update_last_login');

-- ============================================
-- 2. GDPR Consent Functions (Critical)
-- ============================================

SELECT pg_temp.set_function_search_path('public', 'record_consent_change');
SELECT pg_temp.set_function_search_path('public', 'grant_consent', 'text');
SELECT pg_temp.set_function_search_path('public', 'withdraw_consent', 'text');
SELECT pg_temp.set_function_search_path('public', 'update_consent', 'text, boolean');
SELECT pg_temp.set_function_search_path('public', 'revoke_consent', 'text');

-- ============================================
-- 3. GDPR Art. 9 - Health Data Functions (Critical)
-- ============================================

SELECT pg_temp.set_function_search_path('public', 'grant_health_consent', 'text');
SELECT pg_temp.set_function_search_path('public', 'revoke_health_consent', 'text');
SELECT pg_temp.set_function_search_path('public', 'has_health_consent');
SELECT pg_temp.set_function_search_path('public', 'has_wellness_consent');
SELECT pg_temp.set_function_search_path('public', 'check_health_consent', 'uuid');
SELECT pg_temp.set_function_search_path('public', 'check_wellness_consent', 'uuid');
SELECT pg_temp.set_function_search_path('public', 'record_health_consent_change');

-- ============================================
-- 4. GDPR Account Deletion Functions (Critical)
-- ============================================

SELECT pg_temp.set_function_search_path('public', 'request_account_deletion', 'text, integer');
SELECT pg_temp.set_function_search_path('public', 'request_account_deletion');
SELECT pg_temp.set_function_search_path('public', 'cancel_deletion_request');
SELECT pg_temp.set_function_search_path('public', 'cancel_account_deletion');
SELECT pg_temp.set_function_search_path('public', 'get_deletion_status');
SELECT pg_temp.set_function_search_path('public', 'process_pending_deletions');
SELECT pg_temp.set_function_search_path('public', 'execute_account_deletion_immediate');
SELECT pg_temp.set_function_search_path('public', 'export_user_data');

-- ============================================
-- 5. Rate Limiting Functions
-- ============================================

SELECT pg_temp.set_function_search_path('public', 'check_rate_limit', 'text, text, integer, integer');
SELECT pg_temp.set_function_search_path('public', 'check_login_rate_limit', 'text, text, integer, integer');
SELECT pg_temp.set_function_search_path('public', 'cleanup_rate_limits');

-- ============================================
-- 6. Learning/Education Functions
-- ============================================

SELECT pg_temp.set_function_search_path('public', 'get_user_learning_stats', 'uuid');
SELECT pg_temp.set_function_search_path('public', 'get_module_progress', 'uuid');
SELECT pg_temp.set_function_search_path('public', 'record_learning_attempt', 'uuid, uuid, integer, integer, boolean, jsonb');
SELECT pg_temp.set_function_search_path('public', 'sync_lesson_progress', 'integer');
SELECT pg_temp.set_function_search_path('public', 'cleanup_old_activities');
SELECT pg_temp.set_function_search_path('public', 'create_learning_path_from_gap', 'uuid, text, text, integer');
SELECT pg_temp.set_function_search_path('public', 'generate_course_recommendations', 'uuid, uuid, integer');
SELECT pg_temp.set_function_search_path('public', 'get_user_courses', 'uuid');

-- ============================================
-- 7. Milestone/Achievement Functions
-- ============================================

SELECT pg_temp.set_function_search_path('public', 'init_user_milestones', 'uuid');
SELECT pg_temp.set_function_search_path('public', 'initialize_user_milestones', 'uuid');
SELECT pg_temp.set_function_search_path('public', 'update_milestone_progress', 'uuid, text, integer');
SELECT pg_temp.set_function_search_path('public', 'log_user_activity', 'uuid, text, text, jsonb');
SELECT pg_temp.set_function_search_path('public', 'log_user_activity', 'uuid, text, text, text, integer, jsonb');
SELECT pg_temp.set_function_search_path('public', 'update_goal_progress');
SELECT pg_temp.set_function_search_path('public', 'update_streak', 'uuid');
SELECT pg_temp.set_function_search_path('public', 'update_user_streak', 'uuid');
SELECT pg_temp.set_function_search_path('public', 'increment_user_points', 'uuid, integer');

-- ============================================
-- 8. Community Functions
-- ============================================

SELECT pg_temp.set_function_search_path('public', 'publish_to_feed', 'uuid, text, text, jsonb');
SELECT pg_temp.set_function_search_path('public', 'post_to_community_feed', 'uuid, text, text, text, jsonb, boolean');
SELECT pg_temp.set_function_search_path('public', 'add_feed_reaction', 'uuid, text');
SELECT pg_temp.set_function_search_path('public', 'react_to_feed_item', 'uuid, uuid, text');
SELECT pg_temp.set_function_search_path('public', 'remove_feed_reaction', 'uuid, text');
SELECT pg_temp.set_function_search_path('public', 'remove_reaction', 'uuid, uuid, text');
SELECT pg_temp.set_function_search_path('public', 'join_group', 'uuid');
SELECT pg_temp.set_function_search_path('public', 'join_community_group', 'uuid');
SELECT pg_temp.set_function_search_path('public', 'leave_group', 'uuid');
SELECT pg_temp.set_function_search_path('public', 'leave_community_group', 'uuid');
SELECT pg_temp.set_function_search_path('public', 'get_personalized_feed', 'integer');
SELECT pg_temp.set_function_search_path('public', 'find_buddy_matches', 'uuid, integer');

-- ============================================
-- 9. Consultant Functions
-- ============================================

SELECT pg_temp.set_function_search_path('public', 'use_message_template', 'uuid');
SELECT pg_temp.set_function_search_path('public', 'increment_template_usage', 'uuid');
SELECT pg_temp.set_function_search_path('public', 'approve_consultant_request', 'uuid, uuid');
SELECT pg_temp.set_function_search_path('public', 'accept_consultant_request', 'uuid');
SELECT pg_temp.set_function_search_path('public', 'deny_consultant_request', 'uuid');
SELECT pg_temp.set_function_search_path('public', 'decline_consultant_request', 'uuid');
SELECT pg_temp.set_function_search_path('public', 'consultant_has_access', 'uuid, uuid, text');

-- ============================================
-- 10. User Preference Functions
-- ============================================

SELECT pg_temp.set_function_search_path('public', 'get_user_preferences');
SELECT pg_temp.set_function_search_path('public', 'get_or_create_user_preferences', 'uuid');
SELECT pg_temp.set_function_search_path('public', 'get_widget_config');
SELECT pg_temp.set_function_search_path('public', 'ensure_ui_preferences');
SELECT pg_temp.set_function_search_path('public', 'get_user_mood_streak', 'uuid');
SELECT pg_temp.set_function_search_path('public', 'get_mood_streak', 'uuid');

-- ============================================
-- 11. Application Tracking Functions
-- ============================================

SELECT pg_temp.set_function_search_path('public', 'calculate_match_score');
SELECT pg_temp.set_function_search_path('public', 'update_application_status_history');
SELECT pg_temp.set_function_search_path('public', 'log_application_created');
SELECT pg_temp.set_function_search_path('public', 'log_application_status_change');
SELECT pg_temp.set_function_search_path('public', 'get_application_stats', 'uuid');
SELECT pg_temp.set_function_search_path('public', 'get_upcoming_reminders', 'uuid, integer');
SELECT pg_temp.set_function_search_path('public', 'get_follow_up_needed', 'uuid, integer');
SELECT pg_temp.set_function_search_path('public', 'get_stale_applications', 'uuid, integer');

-- ============================================
-- Verification
-- ============================================
DO $$
DECLARE
  func_count INTEGER;
  fixed_count INTEGER;
BEGIN
  -- Count all SECURITY DEFINER functions in public schema
  SELECT COUNT(*) INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.prosecdef = true;

  -- Count functions that now have search_path set
  SELECT COUNT(*) INTO fixed_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND p.proconfig IS NOT NULL
    AND 'search_path=public' = ANY(p.proconfig);

  RAISE NOTICE '✅ Fixed search_path on % of % SECURITY DEFINER functions', fixed_count, func_count;

  IF fixed_count < func_count THEN
    RAISE NOTICE '⚠️ Some functions may have different signatures - run query to check remaining';
  END IF;
END $$;
