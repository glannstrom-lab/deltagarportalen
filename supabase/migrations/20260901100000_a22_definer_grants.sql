-- A22 — de 36 SECURITY DEFINER-funktioner som `anon` kunde köra
--
-- Mätt mot prod 2026-09-01: 36 av 65 definer-funktioner i `public` var anropbara av anon.
-- A17 (2026-08-04) tog 18 av dåvarande 53; både totalen och den öppna mängden har vuxit sedan dess.
--
-- Lärdomen från A17 gäller fortfarande: `REVOKE ... FROM anon` gör INGENTING när PUBLIC har
-- EXECUTE (Postgres default, syns som `=X/postgres` i proacl). Därför revokas PUBLIC här,
-- och rättigheterna delas sedan ut explicit.
--
-- Klassificeringen är gjord per funktion, inte som ett svep. Tre mätningar styr den:
--
--  1. TRIGGERFUNKTIONER behöver ingen EXECUTE. Postgres kontrollerar rättigheten när triggern
--     SKAPAS, inte när den fyrar. Bevisat 2026-09-01 i en rollad transaktion: efter
--     `REVOKE EXECUTE ON log_profile_changes() FROM public, anon, authenticated` gick
--     `UPDATE profiles` igenom som `authenticated`, och triggern `audit_profile_changes`
--     (AFTER UPDATE, ingen WHEN-klausul) körde.
--
--  2. POLICYFUNKTIONER behöver EXECUTE av den roll vars sats utlöser policyn. Fem funktioner
--     står i `pg_policies.qual/with_check` och behåller därför `authenticated`.
--
--  3. `check_rate_limit` MÅSTE behålla anon. Både `api/_utils/rate-limiter.js:19` och
--     `supabase/functions/_shared/rateLimit.ts:54` bygger sin klient med ANON-nyckeln
--     ("uses anon key, function handles security"), och båda **faller tillbaka på en
--     in-memory-limiter vid fel** utan att larma. Ett svep hade alltså tyst degraderat
--     den distribuerade rate-limiten till per-instans-minne — vilket på serverless är
--     ingen gräns alls — för /api/ai, cv-pdf, job-alerts, upload-image, bolagsverket
--     och alla sju proxy-guards.

DO $$
DECLARE
  f record;

  -- Anon behövs på riktigt (verifierat anropsställe för var och en)
  anon_ok text[] := array[
    'check_rate_limit',        -- se punkt 3 ovan
    'get_invitation_by_token', -- inbjudningslänk öppnas före inloggning (A10)
    'get_shared_profile'       -- publik delningslänk (A7)
  ];

  -- Authenticated: policyhjälpare + RPC:er med levande anropare i klientkoden
  auth_ok text[] := array[
    'check_health_consent',                  -- policy: interest_results INSERT
    'check_wellness_consent',                -- policy: mood_logs m.fl. (3 st)
    'check_role_change_allowed',             -- policy: profiles UPDATE (2 st)
    'is_admin_or_superadmin',                -- policy: 3 st
    'profiles_consultant_status_only_check', -- policy: profiles UPDATE (KS10)
    'get_my_consultant',                     -- 2 anropare
    'get_deletion_status',                   -- 1 anropare
    'export_user_data',                      -- 1 anropare (art. 15)
    'sta_get_consultant_for_participant',    -- STA är avstängd men koden anropar dem;
    'sta_participant_mark_doa_done',         -- slås flaggan på ska de fungera direkt
    'sta_participant_save_doa_score',
    'sta_participant_update_self',
    'sta_participant_update_start_date',
    'sta_sign_assessment'
  ];

  -- Allt annat i den mätta mängden: bara service_role. Noll anropare i hela kodbasen
  -- (kontrollerat med grep över client/src, client/api, supabase/functions):
  --   trigger: audit_data_sharing_change, handle_first_signin, log_application_created,
  --            log_application_status_change, log_profile_changes,
  --            update_ai_team_sessions_updated_at, update_calendar_updated_at,
  --            update_career_plan_progress, update_shared_resources_updated_at
  --   underhåll: cleanup_old_activities, cleanup_rate_limits, check_login_rate_limit
  --   hjälpare utan anropare: can_assign_role, consultant_has_access
  --   omonterade: accept_consultant_request, decline_consultant_request, increment_template_usage
  --   trasiga: join_community_group, leave_community_group (community_*-tabellerna droppades 27 juli)
  mangd text[] := array[
    'accept_consultant_request','audit_data_sharing_change','can_assign_role',
    'check_health_consent','check_login_rate_limit','check_rate_limit',
    'check_role_change_allowed','check_wellness_consent','cleanup_old_activities',
    'cleanup_rate_limits','consultant_has_access','decline_consultant_request',
    'export_user_data','get_deletion_status','get_invitation_by_token','get_my_consultant',
    'get_shared_profile','handle_first_signin','increment_template_usage',
    'is_admin_or_superadmin','join_community_group','leave_community_group',
    'log_application_created','log_application_status_change','log_profile_changes',
    'profiles_consultant_status_only_check','sta_get_consultant_for_participant',
    'sta_participant_mark_doa_done','sta_participant_save_doa_score',
    'sta_participant_update_self','sta_participant_update_start_date','sta_sign_assessment',
    'update_ai_team_sessions_updated_at','update_calendar_updated_at',
    'update_career_plan_progress','update_shared_resources_updated_at'
  ];
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef AND p.proname = ANY(mangd)
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', f.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', f.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', f.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f.sig);

    IF f.proname = ANY(anon_ok) THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon, authenticated', f.sig);
    ELSIF f.proname = ANY(auth_ok) THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f.sig);
    END IF;
  END LOOP;
END $$;
