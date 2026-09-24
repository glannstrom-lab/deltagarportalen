-- ============================================================================
-- VÄNTAR PÅ MIKAELS GODKÄNNANDE — KÖRS INTE AUTOMATISKT
-- ============================================================================
-- Döp om till 20260924xxxxxx_index_fk_och_dubbletter.sql när den godkänts och
-- körts. Ingen data ändras.
-- ============================================================================
--
-- ALLVAR: PRESTANDA — ingen säkerhetsförändring.
--
-- 1) 37 främmande nycklar utan täckande index (advisorn
--    `unindexed_foreign_keys` har 45; de 8 på sta_*-tabellerna är utelämnade
--    med flit — STA är arkiverad 2026-09-12, tabellerna gallras av retention-sta
--    och ska inte få ny infrastruktur).
--
--    Varför det spelar roll trots att tabellerna är små i dag: varje DELETE på
--    den refererade raden (profiles vid kontoradering — jobben
--    process-deletion-requests och retention-inactive-accounts kör varje natt —
--    och organizations, articles, courses) gör en sekventiell sökning i VARJE
--    refererande tabell utan index. 23 av raderna nedan pekar på profiles,
--    organizations eller auth.users. Kostnaden växer med datan; indexen kostar nästan inget.
--
--    Framtagna ur pg_constraint mot prod 2026-09-24 (inte ur advisorns text):
--    FK vars kolumner inte är prefix i något befintligt index.
--
-- 2) Två dubblettindex (advisorn `duplicate_index`), verifierade:
--      idx_cover_letters_user    = idx_cover_letters_user_id  = btree (user_id)
--      idx_saved_jobs_user       = idx_saved_jobs_user_id     = btree (user_id)
--    Inget av dem bär en constraint (pg_constraint.conindid: 0 träffar).
--    Den med flest idx_scan behålls (sedan statistiken nollställdes 2025-12-08):
--      cover_letters: _user 5559 skanningar, _user_id 3430 → _user_id tas bort
--      saved_jobs:    _user 2771 skanningar, _user_id 214  → _user_id tas bort
--    Planeraren använder den kvarvarande identiska.
--
-- Inte CONCURRENTLY: `db query --linked` kör flera satser i en implicit
-- transaktion, där CONCURRENTLY inte är tillåtet. Största tabellen här har
-- 89 rader — låset varar millisekunder.
--
-- Risk: mycket låg.
-- ============================================================================

-- Index på främmande nycklar
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_user_id ON public.account_deletion_requests (user_id);  -- account_deletion_requests_user_id_fkey -> profiles, 0 rader
CREATE INDEX IF NOT EXISTS idx_activity_plan_handovers_consultant_id ON public.activity_plan_handovers (consultant_id);  -- activity_plan_handovers_consultant_id_fkey -> profiles, 1 rader
CREATE INDEX IF NOT EXISTS idx_activity_plan_handovers_handed_over_by ON public.activity_plan_handovers (handed_over_by);  -- activity_plan_handovers_handed_over_by_fkey -> profiles, 1 rader
CREATE INDEX IF NOT EXISTS idx_activity_plan_handovers_org_id ON public.activity_plan_handovers (org_id);  -- activity_plan_handovers_org_id_fkey -> organizations, 1 rader
CREATE INDEX IF NOT EXISTS idx_activity_plans_org_id ON public.activity_plans (org_id);  -- activity_plans_org_id_fkey -> organizations, 3 rader
CREATE INDEX IF NOT EXISTS idx_activity_plans_template_id ON public.activity_plans (template_id);  -- activity_plans_template_id_fkey -> activity_templates, 3 rader
CREATE INDEX IF NOT EXISTS idx_activity_sessions_marked_by ON public.activity_sessions (marked_by);  -- activity_sessions_marked_by_fkey -> auth.users, 89 rader
CREATE INDEX IF NOT EXISTS idx_activity_templates_org_id ON public.activity_templates (org_id);  -- activity_templates_org_id_fkey -> organizations, 2 rader
CREATE INDEX IF NOT EXISTS idx_article_checklists_article_uuid ON public.article_checklists (article_uuid);  -- article_checklists_article_uuid_fkey -> articles, 18 rader
CREATE INDEX IF NOT EXISTS idx_article_course_links_course_id ON public.article_course_links (course_id);  -- article_course_links_course_id_fkey -> courses, 0 rader
CREATE INDEX IF NOT EXISTS idx_article_reading_progress_article_uuid ON public.article_reading_progress (article_uuid);  -- article_reading_progress_article_uuid_fkey -> articles, 39 rader
CREATE INDEX IF NOT EXISTS idx_calendar_events_parent_event_id ON public.calendar_events (parent_event_id);  -- calendar_events_parent_event_id_fkey -> calendar_events, 2 rader
CREATE INDEX IF NOT EXISTS idx_consultant_notes_consultant_id ON public.consultant_notes (consultant_id);  -- consultant_notes_consultant_id_fkey -> profiles, 0 rader
CREATE INDEX IF NOT EXISTS idx_consultant_participants_assigned_by ON public.consultant_participants (assigned_by);  -- consultant_participants_assigned_by_fkey -> profiles, 38 rader
CREATE INDEX IF NOT EXISTS idx_consultant_requests_participant_id ON public.consultant_requests (participant_id);  -- consultant_requests_participant_id_fkey -> profiles, 1 rader
CREATE INDEX IF NOT EXISTS idx_consultant_work_placement_followups_consultant_id ON public.consultant_work_placement_followups (consultant_id);  -- consultant_work_placement_followups_consultant_id_fkey -> profiles, 0 rader
CREATE INDEX IF NOT EXISTS idx_consultant_work_placements_place_id ON public.consultant_work_placements (place_id);  -- consultant_work_placements_place_id_fkey -> employer_places, 2 rader
CREATE INDEX IF NOT EXISTS idx_course_recommendations_course_id ON public.course_recommendations (course_id);  -- course_recommendations_course_id_fkey -> courses, 0 rader
CREATE INDEX IF NOT EXISTS idx_cv_analyses_user_id ON public.cv_analyses (user_id);  -- cv_analyses_user_id_fkey -> profiles, 0 rader
CREATE INDEX IF NOT EXISTS idx_cv_shares_user_id ON public.cv_shares (user_id);  -- cv_shares_user_id_fkey -> profiles, 6 rader
CREATE INDEX IF NOT EXISTS idx_data_export_logs_user_id ON public.data_export_logs (user_id);  -- data_export_logs_user_id_fkey -> profiles, 2 rader
CREATE INDEX IF NOT EXISTS idx_employer_checkins_author_id ON public.employer_checkins (author_id);  -- employer_checkins_author_id_fkey -> profiles, 0 rader
CREATE INDEX IF NOT EXISTS idx_employer_checkins_org_id ON public.employer_checkins (org_id);  -- employer_checkins_org_id_fkey -> organizations, 0 rader
CREATE INDEX IF NOT EXISTS idx_employer_messages_sender_id ON public.employer_messages (sender_id);  -- employer_messages_sender_id_fkey -> profiles, 3 rader
CREATE INDEX IF NOT EXISTS idx_employer_places_created_by ON public.employer_places (created_by);  -- employer_places_created_by_fkey -> profiles, 2 rader
CREATE INDEX IF NOT EXISTS idx_employer_profiles_updated_by ON public.employer_profiles (updated_by);  -- employer_profiles_updated_by_fkey -> profiles, 1 rader
CREATE INDEX IF NOT EXISTS idx_exercise_answers_exercise_uuid ON public.exercise_answers (exercise_uuid);  -- exercise_answers_exercise_uuid_fkey -> exercises, 20 rader
CREATE INDEX IF NOT EXISTS idx_invitations_consultant_id ON public.invitations (consultant_id);  -- invitations_consultant_id_fkey -> profiles, 0 rader
CREATE INDEX IF NOT EXISTS idx_invitations_invited_by ON public.invitations (invited_by);  -- invitations_invited_by_fkey -> profiles, 0 rader
CREATE INDEX IF NOT EXISTS idx_invitations_used_by ON public.invitations (used_by);  -- invitations_used_by_fkey -> profiles, 0 rader
CREATE INDEX IF NOT EXISTS idx_learning_activities_recommendation_id ON public.learning_activities (recommendation_id);  -- learning_activities_recommendation_id_fkey -> course_recommendations, 0 rader
CREATE INDEX IF NOT EXISTS idx_milestones_badge_id ON public.milestones (badge_id);  -- milestones_badge_id_fkey -> achievements, 21 rader
CREATE INDEX IF NOT EXISTS idx_spontaneous_companies_company_account_id ON public.spontaneous_companies (company_account_id);  -- spontaneous_companies_company_account_id_fkey -> organizations, 1 rader
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements (achievement_id);  -- user_achievements_achievement_id_fkey -> achievements, 0 rader
CREATE INDEX IF NOT EXISTS idx_user_certifications_course_id ON public.user_certifications (course_id);  -- user_certifications_course_id_fkey -> courses, 0 rader
CREATE INDEX IF NOT EXISTS idx_user_certifications_course_recommendation_id ON public.user_certifications (course_recommendation_id);  -- user_certifications_course_recommendation_id_fkey -> course_recommendations, 0 rader
CREATE INDEX IF NOT EXISTS idx_user_milestones_milestone_id ON public.user_milestones (milestone_id);  -- user_milestones_milestone_id_fkey -> milestones, 33 rader

-- Dubblettindex
DROP INDEX IF EXISTS public.idx_cover_letters_user_id;
DROP INDEX IF EXISTS public.idx_saved_jobs_user_id;

-- ----------------------------------------------------------------------------
-- VERIFIERING
-- ----------------------------------------------------------------------------
-- Omindexerade FK (utom sta_*):
-- select c.conrelid::regclass, c.conname
--   from pg_constraint c
--  where c.contype = 'f' and c.connamespace = 'public'::regnamespace
--    and c.conrelid::regclass::text not like 'sta\_%'
--    and not exists (select 1 from pg_index i where i.indrelid = c.conrelid
--          and (i.indkey::int2[])[0:cardinality(c.conkey)-1] @> c.conkey
--          and (i.indkey::int2[])[0:cardinality(c.conkey)-1] <@ c.conkey);
--   → 0 rader
--
-- select indexrelid::regclass from pg_index
--  where indrelid in ('public.cover_letters'::regclass, 'public.saved_jobs'::regclass)
--    and pg_get_indexdef(indexrelid) ~ '\(user_id\)$';
--   → idx_cover_letters_user, idx_saved_jobs_user (en per tabell)
--
-- Advisorn: unindexed_foreign_keys → 8 (bara sta_*), duplicate_index → 0.
-- ============================================================================
