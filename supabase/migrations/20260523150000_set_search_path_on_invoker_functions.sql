-- ============================================
-- Set search_path on 21 SECURITY INVOKER functions
-- Date: 2026-05-23
--
-- Closes the remaining function_search_path_mutable linter warnings.
-- For INVOKER functions there is no privilege-escalation vector
-- (caller's rights apply), but explicit search_path is Postgres best
-- practice — it makes function behaviour deterministic regardless of
-- caller's session SET search_path, and silences the linter.
--
-- All 21 are either trigger helpers (update_*_updated_at, sync_*, etc.)
-- or utility lookups (get_article_by_slug_or_id, get_exercise_*).
-- None reach outside the public schema, so 'public' is sufficient.
-- ============================================

ALTER FUNCTION public.audit_data_sharing_change() SET search_path = 'public';
ALTER FUNCTION public.auto_generate_recommendations() SET search_path = 'public';
ALTER FUNCTION public.calculate_profile_completeness(unified_profiles, cvs, interest_results) SET search_path = 'public';
ALTER FUNCTION public.cleanup_old_login_attempts() SET search_path = 'public';
ALTER FUNCTION public.create_daily_quests(uuid) SET search_path = 'public';
ALTER FUNCTION public.get_article_by_slug_or_id(text) SET search_path = 'public';
ALTER FUNCTION public.get_exercise_by_slug_or_id(text) SET search_path = 'public';
ALTER FUNCTION public.get_exercise_with_content(text) SET search_path = 'public';
ALTER FUNCTION public.prevent_last_superadmin_removal() SET search_path = 'public';
ALTER FUNCTION public.sync_ai_enabled_on_consent_withdrawal() SET search_path = 'public';
ALTER FUNCTION public.sync_certification_to_cv() SET search_path = 'public';
ALTER FUNCTION public.sync_cv_to_unified_profile() SET search_path = 'public';
ALTER FUNCTION public.update_application_contacts_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_consultant_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_saved_jobs_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_sta_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_topic_reply_count() SET search_path = 'public';
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';
ALTER FUNCTION public.update_user_adaptations_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_user_preferences_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_uwl_timestamp() SET search_path = 'public';
