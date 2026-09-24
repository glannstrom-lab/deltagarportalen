-- ============================================================================
-- VÄNTAR PÅ MIKAELS GODKÄNNANDE — KÖRS INTE AUTOMATISKT
-- ============================================================================
-- Döp om till 20260924xxxxxx_rls_dubblettpolicyer.sql när den godkänts och
-- körts. Ingen data ändras; 27 RLS-policyer som är EXAKTA dubbletter tas bort.
-- ============================================================================
--
-- ALLVAR: PRESTANDA/HYGIEN — ingen säkerhetsförändring.
--
-- Vad: advisorn `multiple_permissive_policies` har 483 fynd. De flesta är
-- legitima (ägaren + konsulenten + chefen läser samma tabell på olika villkor,
-- och de ska OR:as). Men 27 policyer är ren dubblering — två eller fler
-- policyer med SAMMA villkor för samma kommando, lagda av olika migrationer
-- genom åren. Postgres utvärderar alla permissiva policyer per rad; en
-- dubblett kostar en extra utvärdering och gör varje granskning ("finns det en
-- svagare policy här?") svårare att läsa.
--
-- Säkerhetsgenomgången (samma dag) läste varje grupp med flera permissiva
-- policyer per tabell/kommando/roll och frågade: finns en policy som ensam
-- släpper igenom mer än de andra? Fynden där ligger i egna PENDING-filer
-- (sak_konsulentlasning_aktiv_relation, sak_cv_shares_publik_lasning). Den här
-- filen rör BARA par där villkoren är identiska:
--
--   * ALL {public} utan WITH CHECK  ≡  ALL {authenticated} med WITH CHECK = USING
--     (utan WITH CHECK används USING som kontroll; för anon är auth.uid() NULL
--      så {public} ger inget extra). Den {authenticated}-varianten behålls.
--   * Per-kommando-policy med samma villkor som en ALL-policy på tabellen.
--     ALL-policyn behålls.
--   * Två per-kommando-policyer med samma villkor (auth.uid() = user_id och
--     user_id = auth.uid() räknas som samma). Den ena behålls.
--   * calendar_events "view_own_events" (auth.uid() = user_id) är en delmängd
--     av "Users can view their own events" (… OR auth.uid() = ANY(shared_with)).
--
-- Inget i den här filen rör mood_logs INSERT-grinden
-- ("Users can insert mood logs with wellness consent", MV2/art. 9) — den
-- har ingen dubblett och står kvar orörd.
--
-- Bevis: se policylistan i verifieringen nedan; varje borttagen policy har
-- en kvarvarande tvilling med samma roll-täckning och samma villkor.
--
-- Ordning: kan köras före eller efter PENDING_20260924_rls_initplan.sql —
-- initplan-filen rör inte de här 27 policyerna.
--
-- Risk: låg. Om en migration någon gång i framtiden ÅTERSKAPAR en av de
-- borttagna policyerna blir det bara en dubblett igen, inte ett fel.
-- ============================================================================

BEGIN;
DROP POLICY IF EXISTS "Anyone can view achievements" ON public.achievements;
DROP POLICY IF EXISTS "Users can manage own article checklists" ON public.article_checklists;
DROP POLICY IF EXISTS "Users can manage own article progress" ON public.article_reading_progress;
DROP POLICY IF EXISTS "Users can manage own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can manage own mood history" ON public.mood_history;
DROP POLICY IF EXISTS "Users can manage own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can manage own drafts" ON public.user_drafts;
DROP POLICY IF EXISTS "Enable all operations for users based on user_id" ON public.daily_tasks;
DROP POLICY IF EXISTS "view_own_events" ON public.calendar_events;
DROP POLICY IF EXISTS "delete_own_events" ON public.calendar_events;
DROP POLICY IF EXISTS "insert_own_events" ON public.calendar_events;
DROP POLICY IF EXISTS "update_own_events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can delete own cover letters" ON public.cover_letters;
DROP POLICY IF EXISTS "Users can create own cover letters" ON public.cover_letters;
DROP POLICY IF EXISTS "Users can view own cover letters" ON public.cover_letters;
DROP POLICY IF EXISTS "Users can update own cover letters" ON public.cover_letters;
DROP POLICY IF EXISTS "Users can delete own saved jobs" ON public.saved_jobs;
DROP POLICY IF EXISTS "Users can insert own saved jobs" ON public.saved_jobs;
DROP POLICY IF EXISTS "Users can view own saved jobs" ON public.saved_jobs;
DROP POLICY IF EXISTS "Users can update own saved jobs" ON public.saved_jobs;
DROP POLICY IF EXISTS "Users can create own gamification" ON public.user_gamification;
DROP POLICY IF EXISTS "Users can view own gamification" ON public.user_gamification;
DROP POLICY IF EXISTS "Users can update own gamification" ON public.user_gamification;
DROP POLICY IF EXISTS "Users can view own mood logs" ON public.mood_logs;
DROP POLICY IF EXISTS "Users can unlock achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can log own activity" ON public.user_activity_log;
DROP POLICY IF EXISTS "Users can create own milestones" ON public.user_milestones;
COMMIT;

-- ----------------------------------------------------------------------------
-- VERIFIERING
-- ----------------------------------------------------------------------------
-- select count(*) from pg_policies where schemaname = 'public';
--   → 27 färre än före körningen (mät före, mät efter).
--
-- select tablename, cmd, string_agg(policyname, ' | ' order by policyname) policyer
--   from pg_policies
--  where tablename in ('achievements','article_checklists','article_reading_progress','journal_entries',
--                      'mood_history','notification_preferences','user_drafts','daily_tasks',
--                      'calendar_events','cover_letters','saved_jobs','user_gamification','mood_logs',
--                      'user_achievements','user_activity_log','user_milestones')
--  group by 1,2 order by 1,2;
--   → cover_letters, user_gamification, article_checklists, article_reading_progress,
--     journal_entries, mood_history, notification_preferences, user_drafts, daily_tasks:
--     en enda ALL-policy vardera.
--   → saved_jobs: ALL "Users can CRUD own saved jobs" + SELECT
--     "Konsulent läser aktiva deltagares sparade jobb" (+ den profilbaserade
--     konsulentpolicyn tills sak_konsulentlasning_aktiv_relation körts).
--   → calendar_events: en policy per kommando ("Users can … their own events").
--   → achievements SELECT: "Achievements are public".
--   → mood_logs: DELETE, INSERT (med samtycke), UPDATE, två SELECT
--     (egen + "Consultants can read shared mood logs").
--
-- Advisorn (MCP get_advisors type=performance): multiple_permissive_policies
--   ska sjunka från 483.
--
-- Funktionellt röktest (inloggad deltagare i prod): spara ett jobb, skriv ett
-- personligt brev, lägg en kalenderhändelse, logga mående (med samtycke),
-- bocka en artikelchecklista. Allt ska spara och synas som förut.
-- ============================================================================
