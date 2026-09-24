-- ============================================================================
-- VÄNTAR PÅ MIKAELS GODKÄNNANDE — KÖRS INTE AUTOMATISKT
-- ============================================================================
-- Döp om till 20260924xxxxxx_rls_initplan.sql när den godkänts och körts.
-- Ingen data ändras. Inga policyer tas bort eller läggs till; 349 befintliga
-- policyer får samma villkor, bara skrivet så att auth.uid() räknas en gång
-- per fråga i stället för en gång per rad.
-- ============================================================================
--
-- ALLVAR: PRESTANDA — ingen säkerhetsförändring.
--
-- Vad: advisorn `auth_rls_initplan` (WARN) har 380 fynd på 132 tabeller:
-- policyer som anropar `auth.uid()` direkt. Postgres kan då inte lyfta ut
-- anropet som en InitPlan, utan utvärderar det för varje rad. Skrivet som
-- `(select auth.uid())` räknas det en gång per sats. Semantiken är identisk
-- (auth.uid() är STABLE och läser request.jwt.claims, som inte ändras inom
-- en sats). Supabase-dokumentationen:
-- https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
--
-- Nyttan är liten i dag (största tabellerna har några hundra rader), men
-- den växer linjärt med data, och det här är den enda advisorkategorin som
-- går att betala av mekaniskt i ett svep.
--
-- Hur filen togs fram (2026-09-24, mot prod — inte ur migrationsfilerna):
--   select format('ALTER POLICY %I ON public.%I …', policyname, tablename)
--     from pg_policies
--    where schemaname = 'public'
--      and (coalesce(qual,'')||coalesce(with_check,'')) ~ '(?<!SELECT )auth\.(uid|jwt|role)\(\)'
--   med regexp_replace(…, '(?<!SELECT )auth\.(uid|jwt|role)\(\)', '(select auth.\1())', 'g')
--   på USING och WITH CHECK. 380 rader (= advisorns tal exakt).
--
-- 31 av de 380 är MED FLIT utelämnade här, eftersom andra PENDING-filer från
-- samma dag tar bort eller skriver om dem:
--   * 26 i PENDING_20260924_rls_dubblettpolicyer.sql (DROP)
--   *  5 i PENDING_20260924_sak_konsulentlasning_aktiv_relation.sql (DROP/ALTER)
-- Filerna kan därför köras i valfri ordning utan att skriva över varandra.
--
-- ⚠️ FILEN ÄR GENERERAD UR PROD-TILLSTÅNDET 2026-09-24. Har någon policy på
-- tabellerna nedan ändrats sedan dess skriver den här filen tillbaka det gamla
-- villkoret. Kör därför först kontrollfrågan:
--
--   select count(*) from pg_policies
--    where schemaname='public'
--      and (coalesce(qual,'')||coalesce(with_check,'')) ~ '(?<!SELECT )auth\.(uid|jwt|role)\(\)';
--   → 380 (före rls_dubblettpolicyer/sak_konsulentlasning) eller 349 (efter).
--
-- Är talet något annat, eller har en migration mot en policy körts efter
-- 2026-09-24: generera om filen med frågan ovan i stället för att köra den.
--
-- Hela filen körs i EN transaktion — ett tolkningsfel i någon sats rullar
-- tillbaka allt. (Villkoren är återtolkade ur pg_policies-texten; de är giltig
-- SQL i sig, men satserna har inte kunnat provköras eftersom det kräver DDL.)
--
-- Risk: låg. ALTER POLICY byter villkoret atomiskt; policyn försvinner aldrig
-- under körningen.
-- ============================================================================

BEGIN;

ALTER POLICY "Users can cancel own deletion requests" ON public.account_deletion_requests
  USING (((select auth.uid()) = user_id))
  WITH CHECK ((((select auth.uid()) = user_id) AND (cancelled_at IS NOT NULL)));

ALTER POLICY "Users can create deletion requests" ON public.account_deletion_requests
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own deletion requests" ON public.account_deletion_requests
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Chef skapar katalogposter i organisationen" ON public.activity_catalog_items
  WITH CHECK (((org_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM organization_members m
  WHERE ((m.org_id = activity_catalog_items.org_id) AND (m.user_id = (select auth.uid())) AND (m.role = ANY (ARRAY['chef'::text, 'admin'::text])))))));

ALTER POLICY "Chef tar bort katalogposter i organisationen" ON public.activity_catalog_items
  USING (((org_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM organization_members m
  WHERE ((m.org_id = activity_catalog_items.org_id) AND (m.user_id = (select auth.uid())) AND (m.role = ANY (ARRAY['chef'::text, 'admin'::text])))))));

ALTER POLICY "Chef ändrar katalogposter i organisationen" ON public.activity_catalog_items
  USING (((org_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM organization_members m
  WHERE ((m.org_id = activity_catalog_items.org_id) AND (m.user_id = (select auth.uid())) AND (m.role = ANY (ARRAY['chef'::text, 'admin'::text])))))))
  WITH CHECK (((org_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM organization_members m
  WHERE ((m.org_id = activity_catalog_items.org_id) AND (m.user_id = (select auth.uid())) AND (m.role = ANY (ARRAY['chef'::text, 'admin'::text])))))));

ALTER POLICY "Medlemmar läser organisationens katalog" ON public.activity_catalog_items
  USING (((org_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM organization_members m
  WHERE ((m.org_id = activity_catalog_items.org_id) AND (m.user_id = (select auth.uid())))))));

ALTER POLICY "Ägaren hanterar sina katalogposter" ON public.activity_catalog_items
  USING ((owner_id = (select auth.uid())))
  WITH CHECK ((owner_id = (select auth.uid())));

ALTER POLICY "Deltagaren ser lämnade underlag om sig" ON public.activity_plan_handovers
  USING ((participant_id = (select auth.uid())));

ALTER POLICY "Konsulent hanterar underlag för aktiva deltagare" ON public.activity_plan_handovers
  USING (((consultant_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM consultant_participants cp
  WHERE ((cp.consultant_id = (select auth.uid())) AND (cp.participant_id = activity_plan_handovers.participant_id))))))
  WITH CHECK (((consultant_id = (select auth.uid())) AND (handed_over_by = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM consultant_participants cp
  WHERE ((cp.consultant_id = (select auth.uid())) AND (cp.participant_id = activity_plan_handovers.participant_id)))) AND (EXISTS ( SELECT 1
   FROM activity_plans p
  WHERE ((p.id = activity_plan_handovers.plan_id) AND (p.participant_id = activity_plan_handovers.participant_id) AND (p.consultant_id = (select auth.uid())))))));

ALTER POLICY "Organisationens chef läser underlag" ON public.activity_plan_handovers
  USING (((org_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM organization_members m
  WHERE ((m.org_id = activity_plan_handovers.org_id) AND (m.user_id = (select auth.uid())) AND (m.role = ANY (ARRAY['chef'::text, 'admin'::text])))))));

ALTER POLICY "Deltagaren ser sin aktivitetsplan" ON public.activity_plans
  USING ((participant_id = (select auth.uid())));

ALTER POLICY "Konsulent har access till aktiva deltagares aktivitetsplan" ON public.activity_plans
  USING (((consultant_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM consultant_participants cp
  WHERE ((cp.consultant_id = (select auth.uid())) AND (cp.participant_id = activity_plans.participant_id))))))
  WITH CHECK (((consultant_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM consultant_participants cp
  WHERE ((cp.consultant_id = (select auth.uid())) AND (cp.participant_id = activity_plans.participant_id))))));

ALTER POLICY "Organisationens chef läser planer" ON public.activity_plans
  USING (((org_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM organization_members m
  WHERE ((m.org_id = activity_plans.org_id) AND (m.user_id = (select auth.uid())) AND (m.role = ANY (ARRAY['chef'::text, 'admin'::text])))))));

ALTER POLICY "Deltagaren checkar in på sina pass" ON public.activity_sessions
  USING ((participant_id = (select auth.uid())))
  WITH CHECK ((participant_id = (select auth.uid())));

ALTER POLICY "Deltagaren ser sina pass" ON public.activity_sessions
  USING ((participant_id = (select auth.uid())));

ALTER POLICY "Konsulent har access till aktiva deltagares pass" ON public.activity_sessions
  USING ((EXISTS ( SELECT 1
   FROM (activity_plans p
     JOIN consultant_participants cp ON (((cp.consultant_id = p.consultant_id) AND (cp.participant_id = p.participant_id))))
  WHERE ((p.id = activity_sessions.plan_id) AND (p.consultant_id = (select auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (activity_plans p
     JOIN consultant_participants cp ON (((cp.consultant_id = p.consultant_id) AND (cp.participant_id = p.participant_id))))
  WHERE ((p.id = activity_sessions.plan_id) AND (p.consultant_id = (select auth.uid()))))));

ALTER POLICY "Organisationens chef läser pass" ON public.activity_sessions
  USING ((EXISTS ( SELECT 1
   FROM (activity_plans p
     JOIN organization_members m ON ((m.org_id = p.org_id)))
  WHERE ((p.id = activity_sessions.plan_id) AND (m.user_id = (select auth.uid())) AND (m.role = ANY (ARRAY['chef'::text, 'admin'::text]))))));

ALTER POLICY "Ägaren hanterar mallens rader" ON public.activity_template_items
  USING ((EXISTS ( SELECT 1
   FROM activity_templates t
  WHERE ((t.id = activity_template_items.template_id) AND (t.owner_id = (select auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM activity_templates t
  WHERE ((t.id = activity_template_items.template_id) AND (t.owner_id = (select auth.uid()))))));

ALTER POLICY "Publika och organisationens schemamallar går att läsa" ON public.activity_templates
  USING (((is_public = true) OR ((org_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM organization_members m
  WHERE ((m.org_id = activity_templates.org_id) AND (m.user_id = (select auth.uid()))))))));

ALTER POLICY "Ägaren hanterar sina schemamallar" ON public.activity_templates
  USING ((owner_id = (select auth.uid())))
  WITH CHECK ((owner_id = (select auth.uid())));

ALTER POLICY "Superadmins can view audit logs" ON public.admin_audit_log
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'SUPERADMIN'::text)))));

ALTER POLICY "Users can delete own sessions" ON public.ai_team_sessions
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert own sessions" ON public.ai_team_sessions
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can update own sessions" ON public.ai_team_sessions
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own sessions" ON public.ai_team_sessions
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own AI logs" ON public.ai_usage_logs
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can CRUD own application contacts" ON public.application_contacts
  USING (((select auth.uid()) = user_id))
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert own application history" ON public.application_history
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own application history" ON public.application_history
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can CRUD own application reminders" ON public.application_reminders
  USING (((select auth.uid()) = user_id))
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Enable all operations for users based on user_id" ON public.application_templates
  USING (((select auth.uid()) = user_id))
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can delete own bookmarks" ON public.article_bookmarks
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert own bookmarks" ON public.article_bookmarks
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can select own bookmarks" ON public.article_bookmarks
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can CRUD own checklists" ON public.article_checklists
  USING (((select auth.uid()) = user_id))
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can CRUD own reading progress" ON public.article_reading_progress
  USING (((select auth.uid()) = user_id))
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Aktör loggar egna handlingar" ON public.audit_logs
  WITH CHECK (((user_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['SUPERADMIN'::text, 'ADMIN'::text, 'CONSULTANT'::text])))))));

ALTER POLICY "Deltagaren ser vem som öppnat hens uppgifter" ON public.audit_logs
  USING (((participant_id = (select auth.uid())) AND (action = 'VIEWED_PARTICIPANT_DATA'::text)));

ALTER POLICY "Endast admins ser audit logs" ON public.audit_logs
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['SUPERADMIN'::text, 'ADMIN'::text]))))));

ALTER POLICY "Users can delete their own events" ON public.calendar_events
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert their own events" ON public.calendar_events
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can update their own events" ON public.calendar_events
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can view their own events" ON public.calendar_events
  USING ((((select auth.uid()) = user_id) OR ((select auth.uid()) = ANY (shared_with))));

ALTER POLICY "Users can manage their own goals" ON public.calendar_goals
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can manage their own mood entries" ON public.calendar_mood_entries
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can delete their own milestones" ON public.career_milestones
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert their own milestones" ON public.career_milestones
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can update their own milestones" ON public.career_milestones
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can view their own milestones" ON public.career_milestones
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can delete own career paths" ON public.career_paths
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert own career paths" ON public.career_paths
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can update own career paths" ON public.career_paths
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own career paths" ON public.career_paths
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can delete their own career plans" ON public.career_plans
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert their own career plans" ON public.career_plans
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can update their own career plans" ON public.career_plans
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can view their own career plans" ON public.career_plans
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Admins can view all consent history" ON public.consent_history
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['ADMIN'::text, 'SUPERADMIN'::text]))))));

ALTER POLICY "Users can insert own consent records" ON public.consent_history
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own consent history" ON public.consent_history
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Deltagaren ser sina samtycken" ON public.consultant_consents
  USING (((select auth.uid()) = participant_id));

ALTER POLICY "Konsulent ser samtycken som rör hen" ON public.consultant_consents
  USING (((select auth.uid()) = consultant_id));

ALTER POLICY "Consultants can manage their templates" ON public.consultant_goal_templates
  USING ((((select auth.uid()) = consultant_id) OR (is_public = true)));

ALTER POLICY "KS2b: konsulent raderar bara eget mål" ON public.consultant_goals
  USING (((consultant_id = (select auth.uid())) AND har_aktiv_relation(participant_id)));

ALTER POLICY "KS2b: konsulent skapar eget mål" ON public.consultant_goals
  WITH CHECK (((consultant_id = (select auth.uid())) AND har_aktiv_relation(participant_id)));

ALTER POLICY "KS2b: konsulent ändrar bara eget mål" ON public.consultant_goals
  USING (((consultant_id = (select auth.uid())) AND har_aktiv_relation(participant_id)))
  WITH CHECK (((consultant_id = (select auth.uid())) AND har_aktiv_relation(participant_id)));

ALTER POLICY "Participants can view their goals" ON public.consultant_goals
  USING (((select auth.uid()) = participant_id));

ALTER POLICY "Consultants can manage their collections" ON public.consultant_job_collections
  USING ((((select auth.uid()) = consultant_id) OR ((select auth.uid()) = ANY (shared_with))));

ALTER POLICY "Deltagaren ser sina journalanteckningar" ON public.consultant_journal
  USING ((participant_id = (select auth.uid())));

ALTER POLICY "KS2b: konsulent raderar bara egen journalrad" ON public.consultant_journal
  USING (((consultant_id = (select auth.uid())) AND har_aktiv_relation(participant_id)));

ALTER POLICY "KS2b: konsulent skriver egen journalrad" ON public.consultant_journal
  WITH CHECK (((consultant_id = (select auth.uid())) AND har_aktiv_relation(participant_id)));

ALTER POLICY "KS2b: konsulent ändrar bara egen journalrad" ON public.consultant_journal
  USING (((consultant_id = (select auth.uid())) AND har_aktiv_relation(participant_id)))
  WITH CHECK (((consultant_id = (select auth.uid())) AND har_aktiv_relation(participant_id)));

ALTER POLICY "KS2b: konsulent bokar eget möte" ON public.consultant_meetings
  WITH CHECK (((consultant_id = (select auth.uid())) AND har_aktiv_relation(participant_id)));

ALTER POLICY "KS2b: konsulent raderar bara eget möte" ON public.consultant_meetings
  USING (((consultant_id = (select auth.uid())) AND har_aktiv_relation(participant_id)));

ALTER POLICY "KS2b: konsulent ändrar bara eget möte" ON public.consultant_meetings
  USING (((consultant_id = (select auth.uid())) AND har_aktiv_relation(participant_id)))
  WITH CHECK (((consultant_id = (select auth.uid())) AND har_aktiv_relation(participant_id)));

ALTER POLICY "Participants can view their meetings" ON public.consultant_meetings
  USING (((select auth.uid()) = participant_id));

ALTER POLICY "Receivers can update read status" ON public.consultant_messages
  USING (((select auth.uid()) = receiver_id));

ALTER POLICY "Users can send messages to an active counterpart" ON public.consultant_messages
  WITH CHECK ((((select auth.uid()) = sender_id) AND (EXISTS ( SELECT 1
   FROM consultant_participants cp
  WHERE (((cp.consultant_id = consultant_messages.sender_id) AND (cp.participant_id = consultant_messages.receiver_id)) OR ((cp.consultant_id = consultant_messages.receiver_id) AND (cp.participant_id = consultant_messages.sender_id)))))));

ALTER POLICY "Users can view their own messages" ON public.consultant_messages
  USING ((((select auth.uid()) = sender_id) OR ((select auth.uid()) = receiver_id)));

ALTER POLICY "Consultants can CRUD own notes" ON public.consultant_notes
  USING (((select auth.uid()) = consultant_id));

ALTER POLICY "Participants can view notes about themselves" ON public.consultant_notes
  USING (((select auth.uid()) = participant_id));

ALTER POLICY "Konsulent avslutar egen koppling" ON public.consultant_participants
  USING ((consultant_id = (select auth.uid())));

ALTER POLICY "Konsulent ändrar egen koppling" ON public.consultant_participants
  USING ((consultant_id = (select auth.uid())))
  WITH CHECK ((consultant_id = (select auth.uid())));

ALTER POLICY "Konsulenter ser sina deltagare" ON public.consultant_participants
  USING (((consultant_id = (select auth.uid())) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['SUPERADMIN'::text, 'ADMIN'::text])))))));

ALTER POLICY "Konsulent har access till aktiva deltagares placeringar" ON public.consultant_placements
  USING (((consultant_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM consultant_participants cp
  WHERE ((cp.consultant_id = (select auth.uid())) AND (cp.participant_id = consultant_placements.participant_id))))))
  WITH CHECK (((consultant_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM consultant_participants cp
  WHERE ((cp.consultant_id = (select auth.uid())) AND (cp.participant_id = consultant_placements.participant_id))))));

ALTER POLICY "Consultants can create requests" ON public.consultant_requests
  WITH CHECK ((consultant_id = (select auth.uid())));

ALTER POLICY "Consultants can view own requests" ON public.consultant_requests
  USING ((consultant_id = (select auth.uid())));

ALTER POLICY "Participants can respond to requests" ON public.consultant_requests
  USING (((participant_id = (select auth.uid())) AND (status = 'PENDING'::text)));

ALTER POLICY "Participants can view requests to them" ON public.consultant_requests
  USING ((participant_id = (select auth.uid())));

ALTER POLICY "Consultants can manage their settings" ON public.consultant_settings
  USING (((select auth.uid()) = consultant_id));

ALTER POLICY "Deltagaren ser uppföljningar på sin plats" ON public.consultant_work_placement_followups
  USING ((EXISTS ( SELECT 1
   FROM consultant_work_placements p
  WHERE ((p.id = consultant_work_placement_followups.placement_id) AND (p.participant_id = (select auth.uid()))))));

ALTER POLICY "KS2b: konsulent raderar bara egen uppföljning" ON public.consultant_work_placement_followups
  USING (((consultant_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM consultant_work_placements p
  WHERE ((p.id = consultant_work_placement_followups.placement_id) AND har_aktiv_relation(p.participant_id))))));

ALTER POLICY "KS2b: konsulent skriver egen uppföljning" ON public.consultant_work_placement_followups
  WITH CHECK (((consultant_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM consultant_work_placements p
  WHERE ((p.id = consultant_work_placement_followups.placement_id) AND har_aktiv_relation(p.participant_id))))));

ALTER POLICY "KS2b: konsulent ändrar bara egen uppföljning" ON public.consultant_work_placement_followups
  USING (((consultant_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM consultant_work_placements p
  WHERE ((p.id = consultant_work_placement_followups.placement_id) AND har_aktiv_relation(p.participant_id))))))
  WITH CHECK (((consultant_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM consultant_work_placements p
  WHERE ((p.id = consultant_work_placement_followups.placement_id) AND har_aktiv_relation(p.participant_id))))));

ALTER POLICY "Deltagaren ser sina platser" ON public.consultant_work_placements
  USING ((participant_id = (select auth.uid())));

ALTER POLICY "KS2b: konsulent raderar bara egen plats" ON public.consultant_work_placements
  USING (((consultant_id = (select auth.uid())) AND har_aktiv_relation(participant_id)));

ALTER POLICY "KS2b: konsulent skapar egen plats" ON public.consultant_work_placements
  WITH CHECK (((consultant_id = (select auth.uid())) AND har_aktiv_relation(participant_id)));

ALTER POLICY "KS2b: konsulent ändrar bara egen plats" ON public.consultant_work_placements
  USING (((consultant_id = (select auth.uid())) AND har_aktiv_relation(participant_id)))
  WITH CHECK (((consultant_id = (select auth.uid())) AND har_aktiv_relation(participant_id)));

ALTER POLICY "Users can delete own content calendar" ON public.content_calendar
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert own content calendar" ON public.content_calendar
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can update own content calendar" ON public.content_calendar
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own content calendar" ON public.content_calendar
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users manage own recommendations" ON public.course_recommendations
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can CRUD own cover letters" ON public.cover_letters
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can CRUD own CV analyses" ON public.cv_analyses
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can create own CV shares" ON public.cv_shares
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own CV shares" ON public.cv_shares
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can create own CV versions" ON public.cv_versions
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can delete own CV versions" ON public.cv_versions
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can update own CV versions" ON public.cv_versions
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own CV versions" ON public.cv_versions
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can delete own CV" ON public.cvs
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert own CV" ON public.cvs
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can update own CV" ON public.cvs
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own CV" ON public.cvs
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can CRUD own daily tasks" ON public.daily_tasks
  USING (((select auth.uid()) = user_id))
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can delete own dashboard preferences" ON public.dashboard_preferences
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert own dashboard preferences" ON public.dashboard_preferences
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can select own dashboard preferences" ON public.dashboard_preferences
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can update own dashboard preferences" ON public.dashboard_preferences
  USING (((select auth.uid()) = user_id))
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own export logs" ON public.data_export_logs
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Admins can view all data sharing audits" ON public.data_sharing_audit
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['ADMIN'::text, 'SUPERADMIN'::text]))))));

ALTER POLICY "Participants can view own data sharing audit" ON public.data_sharing_audit
  USING (((select auth.uid()) = participant_id));

ALTER POLICY "Users can create own diary entries with wellness consent" ON public.diary_entries
  WITH CHECK (((user_id = (select auth.uid())) AND check_wellness_consent((select auth.uid()))));

ALTER POLICY "Users can delete own diary entries" ON public.diary_entries
  USING ((user_id = (select auth.uid())));

ALTER POLICY "Users can update own diary entries with wellness consent" ON public.diary_entries
  USING ((user_id = (select auth.uid())))
  WITH CHECK (((user_id = (select auth.uid())) AND check_wellness_consent((select auth.uid()))));

ALTER POLICY "Users can view own diary entries" ON public.diary_entries
  USING ((user_id = (select auth.uid())));

ALTER POLICY "Users can create own diary streaks" ON public.diary_streaks
  WITH CHECK ((user_id = (select auth.uid())));

ALTER POLICY "Users can update own diary streaks" ON public.diary_streaks
  USING ((user_id = (select auth.uid())))
  WITH CHECK ((user_id = (select auth.uid())));

ALTER POLICY "Users can view own diary streaks" ON public.diary_streaks
  USING ((user_id = (select auth.uid())));

ALTER POLICY "Users can delete own pitches" ON public.elevator_pitches
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert own pitches" ON public.elevator_pitches
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can update own pitches" ON public.elevator_pitches
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own pitches" ON public.elevator_pitches
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Företaget skriver avstämning på synlig placering" ON public.employer_checkins
  WITH CHECK ((ar_foretagsmedlem(org_id) AND (author_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM employer_placements ep
  WHERE ((ep.id = employer_checkins.placement_id) AND (ep.org_id = employer_checkins.org_id))))));

ALTER POLICY "Konsulent läser företagets avstämningar på egna placeringar" ON public.employer_checkins
  USING ((EXISTS ( SELECT 1
   FROM consultant_work_placements p
  WHERE ((p.id = employer_checkins.placement_id) AND (p.consultant_id = (select auth.uid()))))));

ALTER POLICY "Företaget skriver i tråden" ON public.employer_messages
  WITH CHECK (((sender_id = (select auth.uid())) AND (sender_kind = 'foretag'::text) AND (EXISTS ( SELECT 1
   FROM employer_proposals ep
  WHERE (ep.id = employer_messages.proposal_id)))));

ALTER POLICY "Konsulent läser trådar på egna förslag" ON public.employer_messages
  USING ((EXISTS ( SELECT 1
   FROM employer_share_proposals e
  WHERE ((e.id = employer_messages.proposal_id) AND (e.consultant_id = (select auth.uid()))))));

ALTER POLICY "Konsulent skriver i tråden" ON public.employer_messages
  WITH CHECK (((sender_id = (select auth.uid())) AND (sender_kind = 'konsulent'::text) AND (EXISTS ( SELECT 1
   FROM employer_share_proposals e
  WHERE ((e.id = employer_messages.proposal_id) AND (e.consultant_id = (select auth.uid())) AND (e.status = 'accepted'::text))))));

ALTER POLICY "Mottagaren markerar läst" ON public.employer_messages
  USING (((sender_id <> (select auth.uid())) AND ((EXISTS ( SELECT 1
   FROM employer_proposals ep
  WHERE (ep.id = employer_messages.proposal_id))) OR (EXISTS ( SELECT 1
   FROM employer_share_proposals e
  WHERE ((e.id = employer_messages.proposal_id) AND (e.consultant_id = (select auth.uid()))))))));

ALTER POLICY "Deltagaren ser sina delningsförslag" ON public.employer_share_proposals
  USING ((participant_id = (select auth.uid())));

ALTER POLICY "Konsulent hanterar förslag för aktiva deltagare" ON public.employer_share_proposals
  USING (((consultant_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM consultant_participants cp
  WHERE ((cp.consultant_id = (select auth.uid())) AND (cp.participant_id = employer_share_proposals.participant_id))))))
  WITH CHECK (((consultant_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM consultant_participants cp
  WHERE ((cp.consultant_id = (select auth.uid())) AND (cp.participant_id = employer_share_proposals.participant_id)))) AND (EXISTS ( SELECT 1
   FROM consultant_work_placements p
  WHERE ((p.id = employer_share_proposals.placement_id) AND (p.participant_id = employer_share_proposals.participant_id))))));

ALTER POLICY "Users can delete own exercise answers" ON public.exercise_answers
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert own exercise answers" ON public.exercise_answers
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can update own exercise answers" ON public.exercise_answers
  USING (((select auth.uid()) = user_id))
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own exercise answers" ON public.exercise_answers
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can delete their own favorites" ON public.favorite_occupations
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert their own favorites" ON public.favorite_occupations
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can view their own favorites" ON public.favorite_occupations
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can create own gratitude entries" ON public.gratitude_entries
  WITH CHECK ((user_id = (select auth.uid())));

ALTER POLICY "Users can delete own gratitude entries" ON public.gratitude_entries
  USING ((user_id = (select auth.uid())));

ALTER POLICY "Users can update own gratitude entries" ON public.gratitude_entries
  USING ((user_id = (select auth.uid())))
  WITH CHECK ((user_id = (select auth.uid())));

ALTER POLICY "Users can view own gratitude entries" ON public.gratitude_entries
  USING ((user_id = (select auth.uid())));

ALTER POLICY "Consultants can view participant history" ON public.interest_guide_history
  USING (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND ((p.role = 'consultant'::text) OR (p.role = 'superadmin'::text) OR (p.roles @> ARRAY['consultant'::text]) OR (p.roles @> ARRAY['superadmin'::text]))))) AND (EXISTS ( SELECT 1
   FROM profiles participant
  WHERE ((participant.id = interest_guide_history.user_id) AND (participant.consultant_id = (select auth.uid()))))) AND (EXISTS ( SELECT 1
   FROM participant_data_sharing s
  WHERE ((s.consultant_id = (select auth.uid())) AND (s.participant_id = interest_guide_history.user_id) AND (s.share_health_data = true))))));

ALTER POLICY "Users can insert own interest guide history" ON public.interest_guide_history
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can read own interest guide history" ON public.interest_guide_history
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can CRUD own interest guide progress" ON public.interest_guide_progress
  USING (((select auth.uid()) = user_id))
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Consultants can read shared interest results" ON public.interest_results
  USING ((EXISTS ( SELECT 1
   FROM participant_data_sharing
  WHERE ((participant_data_sharing.consultant_id = (select auth.uid())) AND (participant_data_sharing.participant_id = interest_results.user_id) AND (participant_data_sharing.share_health_data = true)))));

ALTER POLICY "Users can delete own interest results" ON public.interest_results
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert interest results with health consent" ON public.interest_results
  WITH CHECK ((((select auth.uid()) = user_id) AND check_health_consent((select auth.uid()))));

ALTER POLICY "Users can read own interest results" ON public.interest_results
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can update own interest results" ON public.interest_results
  USING (((select auth.uid()) = user_id))
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Enable all operations for users based on user_id" ON public.interview_sessions
  USING (((select auth.uid()) = user_id))
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Authorized users can create invitations" ON public.invitations
  WITH CHECK ((((select auth.uid()) = invited_by) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['CONSULTANT'::text, 'ADMIN'::text, 'SUPERADMIN'::text]))))) AND ((role = 'USER'::text) OR ((role = 'CONSULTANT'::text) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['ADMIN'::text, 'SUPERADMIN'::text])))))) OR ((role = 'ADMIN'::text) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'SUPERADMIN'::text))))))));

ALTER POLICY "Consultants can view their own invitations" ON public.invitations
  USING (((select auth.uid()) = invited_by));

ALTER POLICY "Users can create their own alerts" ON public.job_alerts
  WITH CHECK ((user_id = (select auth.uid())));

ALTER POLICY "Users can delete their own alerts" ON public.job_alerts
  USING ((user_id = (select auth.uid())));

ALTER POLICY "Users can update their own alerts" ON public.job_alerts
  USING ((user_id = (select auth.uid())))
  WITH CHECK ((user_id = (select auth.uid())));

ALTER POLICY "Users can view their own alerts" ON public.job_alerts
  USING ((user_id = (select auth.uid())));

ALTER POLICY "Enable all operations for users based on user_id" ON public.job_applications
  USING (((select auth.uid()) = user_id))
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can delete own job matches" ON public.job_interest_matches
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert own job matches" ON public.job_interest_matches
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own job matches" ON public.job_interest_matches
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can delete their own notifications" ON public.job_notifications
  USING ((user_id = (select auth.uid())));

ALTER POLICY "Users can update their own notifications" ON public.job_notifications
  USING ((user_id = (select auth.uid())))
  WITH CHECK ((user_id = (select auth.uid())));

ALTER POLICY "Users can view their own notifications" ON public.job_notifications
  USING ((user_id = (select auth.uid())));

ALTER POLICY "Users can CRUD own journal entries" ON public.journal_entries
  USING (((select auth.uid()) = user_id))
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users manage own activities" ON public.learning_activities
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Admins can view login attempts" ON public.login_attempts
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['ADMIN'::text, 'SUPERADMIN'::text]))))));

ALTER POLICY "Users can CRUD own mood history" ON public.mood_history
  USING (((select auth.uid()) = user_id))
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Consultants can read shared mood logs" ON public.mood_logs
  USING ((EXISTS ( SELECT 1
   FROM participant_data_sharing
  WHERE ((participant_data_sharing.consultant_id = (select auth.uid())) AND (participant_data_sharing.participant_id = mood_logs.user_id) AND (participant_data_sharing.share_wellness_data = true)))));

ALTER POLICY "Users can delete own mood logs" ON public.mood_logs
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert mood logs with wellness consent" ON public.mood_logs
  WITH CHECK ((((select auth.uid()) = user_id) AND check_wellness_consent((select auth.uid()))));

ALTER POLICY "Users can read own mood logs" ON public.mood_logs
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can update own mood logs" ON public.mood_logs
  USING (((select auth.uid()) = user_id))
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can delete own network contacts" ON public.network_contacts
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert own network contacts" ON public.network_contacts
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can update own network contacts" ON public.network_contacts
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own network contacts" ON public.network_contacts
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can delete their own events" ON public.networking_events
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert their own events" ON public.networking_events
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can update their own events" ON public.networking_events
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can view their own events" ON public.networking_events
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can CRUD own notification preferences" ON public.notification_preferences
  USING (((select auth.uid()) = user_id))
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert own notification settings" ON public.notification_settings
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can update own notification settings" ON public.notification_settings
  USING (((select auth.uid()) = user_id))
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own notification settings" ON public.notification_settings
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Enable all operations for users based on user_id" ON public.notifications
  USING (((select auth.uid()) = user_id))
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Konsulent skapar aktivitetsnotis åt aktiv deltagare" ON public.notifications
  WITH CHECK (((type = ANY (ARRAY['aktivitet_plan'::text, 'aktivitet_pass'::text, 'aktivitet_franvaro'::text])) AND (EXISTS ( SELECT 1
   FROM consultant_participants cp
  WHERE ((cp.consultant_id = (select auth.uid())) AND (cp.participant_id = notifications.user_id))))));

ALTER POLICY "Användaren ser sina egna medlemskap" ON public.organization_members
  USING ((user_id = (select auth.uid())));

ALTER POLICY "Chef ändrar sin organisations AI-brytare" ON public.organizations
  USING ((EXISTS ( SELECT 1
   FROM organization_members m
  WHERE ((m.org_id = organizations.id) AND (m.user_id = (select auth.uid())) AND (m.role = ANY (ARRAY['chef'::text, 'admin'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM organization_members m
  WHERE ((m.org_id = organizations.id) AND (m.user_id = (select auth.uid())) AND (m.role = ANY (ARRAY['chef'::text, 'admin'::text]))))));

ALTER POLICY "Medlem ser sin organisation" ON public.organizations
  USING ((EXISTS ( SELECT 1
   FROM organization_members m
  WHERE ((m.org_id = organizations.id) AND (m.user_id = (select auth.uid()))))));

ALTER POLICY "Consultants can view their data sharing grants" ON public.participant_data_sharing
  USING (((select auth.uid()) = consultant_id));

ALTER POLICY "Participants can manage own data sharing" ON public.participant_data_sharing
  USING (((select auth.uid()) = participant_id))
  WITH CHECK (((select auth.uid()) = participant_id));

ALTER POLICY "Users can delete own brand audit" ON public.personal_brand_audit
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert own brand audit" ON public.personal_brand_audit
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can update own brand audit" ON public.personal_brand_audit
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own brand audit" ON public.personal_brand_audit
  USING (((select auth.uid()) = user_id));

ALTER POLICY pba_delete ON public.personal_brand_audits
  USING (((select auth.uid()) = user_id));

ALTER POLICY pba_insert ON public.personal_brand_audits
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY pba_select ON public.personal_brand_audits
  USING (((select auth.uid()) = user_id));

ALTER POLICY pba_update ON public.personal_brand_audits
  USING (((select auth.uid()) = user_id))
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can CRUD own saved jobs" ON public.platsbanken_saved_jobs
  USING (((select auth.uid()) = user_id))
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can CRUD own saved searches" ON public.platsbanken_saved_searches
  USING (((select auth.uid()) = user_id))
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can delete own portfolio items" ON public.portfolio_items
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert own portfolio items" ON public.portfolio_items
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can update own portfolio items" ON public.portfolio_items
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own portfolio items" ON public.portfolio_items
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can delete own documents" ON public.profile_documents
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert own documents" ON public.profile_documents
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can update own documents" ON public.profile_documents
  USING (((select auth.uid()) = user_id))
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own documents" ON public.profile_documents
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert own history" ON public.profile_history
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own history" ON public.profile_history
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can delete own shares" ON public.profile_shares
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert own shares" ON public.profile_shares
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can update own shares" ON public.profile_shares
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own shares" ON public.profile_shares
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can delete own skills" ON public.profile_skills
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert own skills" ON public.profile_skills
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can update own skills" ON public.profile_skills
  USING (((select auth.uid()) = user_id))
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own skills" ON public.profile_skills
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Consultants can view assigned participant profiles" ON public.profiles
  USING ((consultant_id = (select auth.uid())));

ALTER POLICY "Konsulent kan ändra status på sin tilldelade deltagare" ON public.profiles
  USING (((id <> (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM consultant_participants cp
  WHERE ((cp.consultant_id = (select auth.uid())) AND (cp.participant_id = profiles.id))))))
  WITH CHECK (((id <> (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM consultant_participants cp
  WHERE ((cp.consultant_id = (select auth.uid())) AND (cp.participant_id = profiles.id)))) AND profiles_consultant_status_only_check(id, to_jsonb(profiles.*))));

ALTER POLICY "Users can update own profile safely" ON public.profiles
  USING (((select auth.uid()) = id))
  WITH CHECK (check_role_change_allowed(id, role, roles, active_role));

ALTER POLICY "Users can view own profile" ON public.profiles
  USING (((select auth.uid()) = id));

ALTER POLICY delete_own_quests ON public.quests
  USING (((select auth.uid()) = user_id));

ALTER POLICY insert_own_quests ON public.quests
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY update_own_quests ON public.quests
  USING (((select auth.uid()) = user_id));

ALTER POLICY view_own_quests ON public.quests
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can delete own relocation preferences" ON public.relocation_preferences
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert own relocation preferences" ON public.relocation_preferences
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can update own relocation preferences" ON public.relocation_preferences
  USING (((select auth.uid()) = user_id))
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own relocation preferences" ON public.relocation_preferences
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can delete own salary searches" ON public.salary_searches
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert own salary searches" ON public.salary_searches
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can update own salary searches" ON public.salary_searches
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own salary searches" ON public.salary_searches
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can delete own saved educations" ON public.saved_educations
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert own saved educations" ON public.saved_educations
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can update own saved educations" ON public.saved_educations
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own saved educations" ON public.saved_educations
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Konsulent läser aktiva deltagares sparade jobb" ON public.saved_jobs
  USING ((EXISTS ( SELECT 1
   FROM consultant_participants cp
  WHERE ((cp.consultant_id = (select auth.uid())) AND (cp.participant_id = saved_jobs.user_id)))));

ALTER POLICY "Users can CRUD own saved jobs" ON public.saved_jobs
  USING (((select auth.uid()) = user_id))
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Consultants can update job status" ON public.shared_jobs
  USING ((consultant_id = (select auth.uid())))
  WITH CHECK ((consultant_id = (select auth.uid())));

ALTER POLICY "Consultants can view incoming jobs" ON public.shared_jobs
  USING ((consultant_id = (select auth.uid())));

ALTER POLICY "Participants can delete their shared jobs" ON public.shared_jobs
  USING ((participant_id = (select auth.uid())));

ALTER POLICY "Participants can share jobs" ON public.shared_jobs
  WITH CHECK ((participant_id = (select auth.uid())));

ALTER POLICY "Participants can view their shared jobs" ON public.shared_jobs
  USING ((participant_id = (select auth.uid())));

ALTER POLICY "Users can delete own shared resources" ON public.shared_resources
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert own shared resources" ON public.shared_resources
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can update own shared resources" ON public.shared_resources
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own shared resources" ON public.shared_resources
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can delete their own analyses" ON public.skills_analyses
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert their own analyses" ON public.skills_analyses
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can update their own analyses" ON public.skills_analyses
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can view their own analyses" ON public.skills_analyses
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can CRUD own spontaneous companies" ON public.spontaneous_companies
  USING (((select auth.uid()) = user_id))
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Deltagaren ser och hanterar sina frånvaroanmälningar" ON public.sta_absences
  USING ((EXISTS ( SELECT 1
   FROM sta_enrollments e
  WHERE ((e.id = sta_absences.enrollment_id) AND (e.participant_id = (select auth.uid()))))));

ALTER POLICY "Konsulent har full access till sina deltagares frånvaro" ON public.sta_absences
  USING ((EXISTS ( SELECT 1
   FROM sta_enrollments e
  WHERE ((e.id = sta_absences.enrollment_id) AND (e.consultant_id = (select auth.uid()))))));

ALTER POLICY "Deltagaren ser sina aktiviteter" ON public.sta_activities
  USING ((EXISTS ( SELECT 1
   FROM sta_enrollments e
  WHERE ((e.id = sta_activities.enrollment_id) AND (e.participant_id = (select auth.uid()))))));

ALTER POLICY "Deltagaren skapar/uppdaterar sina egna aktiviteter" ON public.sta_activities
  WITH CHECK ((EXISTS ( SELECT 1
   FROM sta_enrollments e
  WHERE ((e.id = sta_activities.enrollment_id) AND (e.participant_id = (select auth.uid()))))));

ALTER POLICY "Deltagaren uppdaterar sina egna aktiviteter" ON public.sta_activities
  USING ((EXISTS ( SELECT 1
   FROM sta_enrollments e
  WHERE ((e.id = sta_activities.enrollment_id) AND (e.participant_id = (select auth.uid()))))));

ALTER POLICY "Konsulent har full access till sina deltagares aktiviteter" ON public.sta_activities
  USING ((EXISTS ( SELECT 1
   FROM sta_enrollments e
  WHERE ((e.id = sta_activities.enrollment_id) AND (e.consultant_id = (select auth.uid()))))));

ALTER POLICY "Deltagaren ser sina skattningar" ON public.sta_assessments
  USING ((EXISTS ( SELECT 1
   FROM sta_enrollments e
  WHERE ((e.id = sta_assessments.enrollment_id) AND (e.participant_id = (select auth.uid()))))));

ALTER POLICY "Deltagaren skapar egen DOA Del 1" ON public.sta_assessments
  WITH CHECK (((instrument = 'DOA'::text) AND (part = 1) AND (status = 'draft'::text) AND (EXISTS ( SELECT 1
   FROM sta_enrollments e
  WHERE ((e.id = sta_assessments.enrollment_id) AND (e.participant_id = (select auth.uid())))))));

ALTER POLICY "Konsulent har full access" ON public.sta_assessments
  USING ((EXISTS ( SELECT 1
   FROM sta_enrollments e
  WHERE ((e.id = sta_assessments.enrollment_id) AND (e.consultant_id = (select auth.uid()))))));

ALTER POLICY "Deltagaren ser inskickade dokument" ON public.sta_documents
  USING (((status = ANY (ARRAY['approved'::text, 'submitted'::text])) AND (EXISTS ( SELECT 1
   FROM sta_enrollments e
  WHERE ((e.id = sta_documents.enrollment_id) AND (e.participant_id = (select auth.uid())))))));

ALTER POLICY "Konsulent har full access" ON public.sta_documents
  USING ((EXISTS ( SELECT 1
   FROM sta_enrollments e
  WHERE ((e.id = sta_documents.enrollment_id) AND (e.consultant_id = (select auth.uid()))))));

ALTER POLICY "Deltagaren ser sin egen enrollment" ON public.sta_enrollments
  USING (((select auth.uid()) = participant_id));

ALTER POLICY "Konsulent ser sina deltagares enrollments" ON public.sta_enrollments
  USING (((select auth.uid()) = consultant_id));

ALTER POLICY "Deltagaren ser och hanterar sin pulse" ON public.sta_pulse_checks
  USING ((EXISTS ( SELECT 1
   FROM sta_enrollments e
  WHERE ((e.id = sta_pulse_checks.enrollment_id) AND (e.participant_id = (select auth.uid()))))));

ALTER POLICY "Konsulent ser sina deltagares pulse" ON public.sta_pulse_checks
  USING ((EXISTS ( SELECT 1
   FROM sta_enrollments e
  WHERE ((e.id = sta_pulse_checks.enrollment_id) AND (e.consultant_id = (select auth.uid()))))));

ALTER POLICY "Deltagaren ser delade anteckningar" ON public.sta_quick_notes
  USING (((visibility = 'shared_with_participant'::text) AND (EXISTS ( SELECT 1
   FROM sta_enrollments e
  WHERE ((e.id = sta_quick_notes.enrollment_id) AND (e.participant_id = (select auth.uid())))))));

ALTER POLICY "Konsulent ser och hanterar quick notes" ON public.sta_quick_notes
  USING ((EXISTS ( SELECT 1
   FROM sta_enrollments e
  WHERE ((e.id = sta_quick_notes.enrollment_id) AND (e.consultant_id = (select auth.uid()))))));

ALTER POLICY "Deltagaren ser och hanterar sina veckoavslutningar" ON public.sta_weekly_checkins
  USING ((EXISTS ( SELECT 1
   FROM sta_enrollments e
  WHERE ((e.id = sta_weekly_checkins.enrollment_id) AND (e.participant_id = (select auth.uid()))))));

ALTER POLICY "Konsulent ser sina deltagares veckoavslutningar" ON public.sta_weekly_checkins
  USING ((EXISTS ( SELECT 1
   FROM sta_enrollments e
  WHERE ((e.id = sta_weekly_checkins.enrollment_id) AND (e.consultant_id = (select auth.uid()))))));

ALTER POLICY "Deltagaren ser uppföljningar på sin arbetsplats" ON public.sta_workplace_followups
  USING ((EXISTS ( SELECT 1
   FROM (sta_workplaces w
     JOIN sta_enrollments e ON ((e.id = w.enrollment_id)))
  WHERE ((w.id = sta_workplace_followups.workplace_id) AND (e.participant_id = (select auth.uid()))))));

ALTER POLICY "Konsulent full access till uppföljningar" ON public.sta_workplace_followups
  USING ((EXISTS ( SELECT 1
   FROM (sta_workplaces w
     JOIN sta_enrollments e ON ((e.id = w.enrollment_id)))
  WHERE ((w.id = sta_workplace_followups.workplace_id) AND (e.consultant_id = (select auth.uid()))))));

ALTER POLICY "Deltagaren ser sin arbetsplats" ON public.sta_workplaces
  USING ((EXISTS ( SELECT 1
   FROM sta_enrollments e
  WHERE ((e.id = sta_workplaces.enrollment_id) AND (e.participant_id = (select auth.uid()))))));

ALTER POLICY "Konsulent har full access" ON public.sta_workplaces
  USING ((EXISTS ( SELECT 1
   FROM sta_enrollments e
  WHERE ((e.id = sta_workplaces.enrollment_id) AND (e.consultant_id = (select auth.uid()))))));

ALTER POLICY "Users can insert own unified profile" ON public.unified_profiles
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can update own unified profile" ON public.unified_profiles
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own unified profile" ON public.unified_profiles
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert own achievements" ON public.user_achievements
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own achievements" ON public.user_achievements
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert their own activities" ON public.user_activities
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can view their own activities" ON public.user_activities
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert own activity" ON public.user_activity_log
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own activity" ON public.user_activity_log
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can delete own adaptations" ON public.user_adaptations
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert own adaptations" ON public.user_adaptations
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can update own adaptations" ON public.user_adaptations
  USING (((select auth.uid()) = user_id))
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own adaptations" ON public.user_adaptations
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users manage own certifications" ON public.user_certifications
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can delete their own credentials" ON public.user_credentials
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert their own credentials" ON public.user_credentials
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can update their own credentials" ON public.user_credentials
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can view their own credentials" ON public.user_credentials
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can CRUD own drafts" ON public.user_drafts
  USING (((select auth.uid()) = user_id))
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can modify own gamification" ON public.user_gamification
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can create own goals" ON public.user_goals
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can delete own goals" ON public.user_goals
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can update own goals" ON public.user_goals
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own goals" ON public.user_goals
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can create own interests" ON public.user_interests
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can update own interests" ON public.user_interests
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own interests" ON public.user_interests
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users manage own learning paths" ON public.user_learning_paths
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert own milestones" ON public.user_milestones
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can update own milestones" ON public.user_milestones
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own milestones" ON public.user_milestones
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can manage own notifications" ON public.user_notifications
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can delete own preferences" ON public.user_preferences
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert own preferences" ON public.user_preferences
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can read own preferences" ON public.user_preferences
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can update own preferences" ON public.user_preferences
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can revoke own sessions" ON public.user_sessions
  USING (((select auth.uid()) = user_id))
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own sessions" ON public.user_sessions
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can delete own skills" ON public.user_skills
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert own skills" ON public.user_skills
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can update own skills" ON public.user_skills
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own skills" ON public.user_skills
  USING (((select auth.uid()) = user_id));

ALTER POLICY insert_own_streaks ON public.user_streaks
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY update_own_streaks ON public.user_streaks
  USING (((select auth.uid()) = user_id));

ALTER POLICY view_own_streaks ON public.user_streaks
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can delete own visibility progress" ON public.visibility_progress
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert own visibility progress" ON public.visibility_progress
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can update own visibility progress" ON public.visibility_progress
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own visibility progress" ON public.visibility_progress
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can insert own visibility settings" ON public.visibility_settings
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can update own visibility settings" ON public.visibility_settings
  USING (((select auth.uid()) = user_id))
  WITH CHECK (((select auth.uid()) = user_id));

ALTER POLICY "Users can view own visibility settings" ON public.visibility_settings
  USING (((select auth.uid()) = user_id));

ALTER POLICY "Users can create own weekly goals" ON public.weekly_goals
  WITH CHECK ((user_id = (select auth.uid())));

ALTER POLICY "Users can delete own weekly goals" ON public.weekly_goals
  USING ((user_id = (select auth.uid())));

ALTER POLICY "Users can update own weekly goals" ON public.weekly_goals
  USING ((user_id = (select auth.uid())))
  WITH CHECK ((user_id = (select auth.uid())));

ALTER POLICY "Users can view own weekly goals" ON public.weekly_goals
  USING ((user_id = (select auth.uid())));

ALTER POLICY "Admins can manage writing prompts" ON public.writing_prompts
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['ADMIN'::text, 'SUPERADMIN'::text]))))));

COMMIT;

-- ----------------------------------------------------------------------------
-- VERIFIERING
-- ----------------------------------------------------------------------------
-- select count(*) from pg_policies
--  where schemaname='public'
--    and (coalesce(qual,'')||coalesce(with_check,'')) ~ '(?<!SELECT )auth\.(uid|jwt|role)\(\)';
--   → 0 (om de två andra RLS-filerna också körts), annars bara deras 31 policyer.
--
-- select count(*) from pg_policies where schemaname='public';
--   → oförändrat av DEN HÄR filen (den lägger inte till och tar inte bort).
--
-- Advisorn (MCP get_advisors type=performance): auth_rls_initplan → 0.
--
-- Funktionellt röktest: e2e mot prod (TEST_*-kontona) + e2e/km-aktivitetskrav-prod.cjs.
-- Deltagare, konsulent och företagskonto ska se exakt samma data som före.
-- ============================================================================
