-- SK3 (genomgången 2026-08-17): SECURITY DEFINER-funktioner anropbara av `anon`.
--
-- ============================================================================
-- KRÄVER MIKAELS JA FÖRE KÖRNING — ändrar rättigheter i prod.
-- Kör med:  npx supabase db query --linked -f <den här filen>
-- ============================================================================
--
-- FYNDET
-- ------
-- 35 av 64 `SECURITY DEFINER`-funktioner i `public` är körbara av `anon`
-- (mätt 2026-08-17 med has_function_privilege). De flesta gatear internt på
-- `auth.uid()` och är därför ofarliga trots grantet. 18 gör det inte, och av
-- dem är två skarpa:
--
--   cleanup_rate_limits()     DELETE FROM rate_limits WHERE window_start < now() - '1 hour'
--   cleanup_old_activities()  DELETE FROM user_activities WHERE created_at < now() - '2 years'
--
-- Ingen av dem har någon behörighetskontroll alls. Anon-nyckeln ligger i
-- klartext i varje sidladdning, så vem som helst kan anropa dem i loop.
-- `cleanup_rate_limits` är den värsta: den tömmer ALLA användares
-- rate-limit-fönster, alltså underminerar den brute-force-skyddet för hela
-- portalen — inte bara för den som anropar.
--
-- VARFÖR "REVOKE FROM anon" INTE RÄCKER
-- -------------------------------------
-- Postgres ger EXECUTE till PUBLIC som default på nya funktioner. `anon` är
-- medlem i PUBLIC, så ett REVOKE mot just `anon` tar bort ett grant som aldrig
-- fanns — och lyckas tyst. Det var precis vad som hände i A17 (2026-08-04),
-- där 18 funktioner "stängdes" utan att rättigheten försvann.
-- Därför: REVOKE FROM PUBLIC, sedan explicita GRANT till de roller som ska ha
-- funktionen.
--
-- AVGRÄNSNING — vad den här migrationen medvetet INTE rör
-- -------------------------------------------------------
-- Följande är anropbara av anon MED AVSIKT och lämnas orörda. Att stänga dem
-- hade brutit inloggning respektive inbjudningsflödet:
--
--   check_login_rate_limit()   anropas FÖRE inloggning — anon måste nå den
--   get_invitation_by_token()  inbjudningslänk öppnas utan konto
--   get_shared_profile()       publik delningslänk, by design
--   check_rate_limit()         används av ytor som anon når
--
-- De åtta triggerfunktionerna (returnerar `trigger`) tas också med: de kan inte
-- nås via PostgREST, men trigger-exekvering kontrollerar inte EXECUTE-rättighet,
-- så ett revoke är riskfritt och stänger dörren om någon senare gör om dem.
--
-- KONSUMENTSPÅRNING (gjord 2026-08-17, inte antagen)
-- ---------------------------------------------------
-- Ingen av de sex icke-trigger-funktionerna nedan anropas från applikationskod
-- överhuvudtaget — noll träffar i `client/src`, `client/api` och
-- `supabase/functions`. De två samtyckesgrindarna används **enbart** inuti RLS
-- INSERT-policyer:
--
--   interest_results  "Users can insert interest results with health consent"
--   mood_logs         "Users can insert mood logs with wellness consent"
--
-- Båda körs i den frågande rollens kontext, alltså som `authenticated` när en
-- användare sparar sin egen rad. Därför grantet till `authenticated` nedan —
-- utan det hade den här migrationen låst ute alla från att spara måendeloggar
-- och intresseresultat, vilket vore ett värre fel än det den stänger.
-- `consultant_has_access` och `increment_template_usage` har noll konsumenter
-- någonstans; att stänga dem för anon kan inte bryta något som körs i dag.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. De två som raderar rader. Bara service_role ska nå dem — de är avsedda
--    som städjobb och anropas av schemaläggaren (se DR2), inte av en klient.
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits()    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_activities() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.cleanup_rate_limits()    TO service_role;
GRANT  EXECUTE ON FUNCTION public.cleanup_old_activities() TO service_role;

-- ---------------------------------------------------------------------------
-- 2. Informationsläckor: de här svarar på frågor om ANDRA användare och tar
--    ett uuid som argument. Anon har ingen anledning att kunna ställa dem.
--
--    OBS: `check_health_consent` används inuti RLS-policyn på interest_results
--    (se SK2). Policyn körs i den frågande rollens kontext, så `authenticated`
--    MÅSTE behålla EXECUTE — annars slutar legitima användare kunna spara sina
--    intresseresultat. Samma sak för wellness-grinden.
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.check_health_consent(uuid)   FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_wellness_consent(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.check_health_consent(uuid)   TO authenticated, service_role;
GRANT  EXECUTE ON FUNCTION public.check_wellness_consent(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.consultant_has_access(uuid, uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.consultant_has_access(uuid, uuid, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.increment_template_usage(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.increment_template_usage(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Triggerfunktioner. Inte nåbara via PostgREST, men PUBLIC-grantet är
--    onödigt och gör bilden svårläst nästa gång någon mäter.
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.audit_data_sharing_change()          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_first_signin()                FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_application_created()            FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_application_status_change()      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_ai_team_sessions_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_calendar_updated_at()         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_career_plan_progress()        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_shared_resources_updated_at() FROM PUBLIC, anon, authenticated;

COMMIT;

-- ============================================================================
-- VERIFIERA UTFALLET — mät rättigheten, inte kommandots exitkod.
-- ============================================================================
--
-- 1) De två raderande ska vara stängda för anon OCH authenticated:
--
--    select proname,
--           has_function_privilege('anon', oid, 'EXECUTE')          as anon,
--           has_function_privilege('authenticated', oid, 'EXECUTE') as auth,
--           has_function_privilege('service_role', oid, 'EXECUTE')  as service
--    from pg_proc
--    where proname in ('cleanup_rate_limits','cleanup_old_activities');
--
--    FÖRVÄNTAT: anon = false, auth = false, service = true.  (Var true/true/true.)
--
-- 2) Samtyckesgrindarna ska vara stängda för anon men ÖPPNA för authenticated —
--    annars slutar RLS-policyn i SK2 fungera för riktiga användare:
--
--    select proname,
--           has_function_privilege('anon', oid, 'EXECUTE')          as anon,
--           has_function_privilege('authenticated', oid, 'EXECUTE') as auth
--    from pg_proc
--    where proname in ('check_health_consent','check_wellness_consent',
--                      'consultant_has_access','increment_template_usage');
--
--    FÖRVÄNTAT: anon = false, auth = true, för samtliga fyra.
--
-- 3) Totalen ska ha minskat från 35:
--
--    select count(*) from pg_proc
--    where prosecdef and pronamespace = 'public'::regnamespace
--      and has_function_privilege('anon', oid, 'EXECUTE');
--
--    FÖRVÄNTAT: 21.  (35 minus de 14 som stängs här.)
--
-- 4) De fyra avsiktligt öppna ska fortfarande vara öppna:
--
--    select proname, has_function_privilege('anon', oid, 'EXECUTE') as anon
--    from pg_proc
--    where proname in ('check_login_rate_limit','get_invitation_by_token',
--                      'get_shared_profile','check_rate_limit');
--
--    FÖRVÄNTAT: anon = true för alla fyra. Blir någon false är inloggningen
--    eller inbjudningsflödet trasigt — rulla tillbaka den raden.
--
-- 5) Skarpt: efter körning, testa att logga in och att spara ett
--    intresseresultat med ett konto som HAR hälsosamtycke. Båda ska fungera.
--
-- ROLLBACK om något går fel:
--    GRANT EXECUTE ON FUNCTION public.<namn>(<args>) TO anon;
