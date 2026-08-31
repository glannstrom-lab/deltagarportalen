-- KS10 (uppdrag Mikael 2026-08-31): konsulenten ska kunna ändra SIN
-- deltagares `status` på `profiles` — och ingenting annat.
--
-- ============================================================================
-- INTE KÖRD ÄN. RLS mot prod kräver Mikaels uttryckliga ja (CLAUDE.md). Kör
-- manuellt när klartecken finns:
--   npx supabase db query --linked -f supabase/migrations/20260831150000_ks10_consultant_status_only_update.sql
-- Uppdatera schema-snapshoten i SAMMA commit som körningen:
--   cd client && npm run schema:refresh
-- Ta sedan bort `.fails` från testet i consultantService.test.ts (se botten
-- av den filen, testet heter "KS10 (RLS-lucka öppen …)").
-- ============================================================================
--
-- BAKGRUND
-- --------
-- `consultantService.updateParticipantStatus` skrev tidigare mot
-- `consultant_participants.status` — en kolumn som aldrig funnits. Skrivningen
-- är omdirigerad till `profiles.status`, där statusen faktiskt bor. Men
-- `profiles` har bara två UPDATE-policyer (verifierat 2026-08-31):
--
--   "Admins can update profiles with restrictions"  USING is_admin_or_superadmin()
--   "Users can update own profile safely"           USING (auth.uid() = id)
--
-- Ingen släpper in en konsulent som ändrar en TILLDELAD deltagares rad.
-- Massåtgärden "ändra status" i BulkActionsDialog kan alltså aldrig lyckas —
-- numera synligt, eftersom `.select('id').single()` kastar PGRST116 vid noll
-- träffade rader i stället för att tyst "lyckas" utan att skriva något.
--
-- Radantal vid skrivandet: `profiles` = 93 rader, `consultant_participants`
-- = 31 rader, och samtliga 31 har `profiles.consultant_id` synkat med sin
-- `consultant_participants`-rad (kontrollerat med en join — 31/31/31).
--
-- VARFÖR INTE KOLUMNRÄTTIGHETER (GRANT UPDATE (status) ...)
-- -----------------------------------------------------------
-- Kontrollerat FÖRE valet av teknik:
--   select grantee, privilege_type, column_name from information_schema.column_privileges
--   where table_name='profiles' and grantee='authenticated';
-- → `authenticated` har redan tabellbrett UPDATE (INSERT/SELECT/UPDATE/
-- REFERENCES) på VARJE kolumn i `profiles`. Postgres kolumnrättigheter är
-- inte kopplade till vilken RLS-policy som matchade — de gäller rollen som
-- helhet, för alla policyer samtidigt. Att smalna av till `GRANT UPDATE
-- (status)` hade krävt att först REVOKE:a UPDATE på alla andra kolumner från
-- `authenticated` — vilket hade brutit både "Users can update own profile
-- safely" (deltagaren redigerar namn, telefon, samtycken, ...) och
-- adminpolicyn, eftersom de delar samma databasroll. Kolumnrättigheter löser
-- alltså INTE detta när alla tre användartyper (deltagare/konsulent/admin)
-- är samma Postgres-roll. Vägen är i stället en `WITH CHECK` som jämför den
-- nya raden mot den gamla, fält för fält.
--
-- VARFÖR EN SECURITY DEFINER-FUNKTION, INTE EN RÅ SUBQUERY I POLICYN
-- --------------------------------------------------------------------
-- RLS har ingen OLD/NEW — bara den rad som just nu utvärderas (NEW för
-- WITH CHECK). Att slå upp den gamla raden kräver ett självuppslag mot
-- samma tabell. Ett sådant uppslag KAN skrivas direkt i policyn
-- (`SELECT ... FROM profiles p2 WHERE p2.id = profiles.id`), men det körs då
-- som den anropande konsulenten och är underkastat profiles EGNA
-- SELECT-policyer — här "Consultants can view assigned participant profiles"
-- USING (profiles.consultant_id = auth.uid()). Den kolumnen råkar vara synkad
-- med consultant_participants idag (31/31/31, se ovan) men den här policyn
-- ska inte vila på att den förblir det. En SECURITY DEFINER-funktion (samma
-- mönster som `check_role_change_allowed` ovanför i filträdet) slår i stället
-- upp den gamla raden med funktionsägarens rättigheter — RLS-oberoende,
-- läser alltid den verkliga gamla raden.
--
-- MVCC-grunden för att självuppslaget faktiskt ger den GAMLA raden: en
-- UPDATE-sats i Postgres kör med ett snapshot som fixeras vid satsens start.
-- Rader som satsen själv redan skrivit (samma command-id) är osynliga för
-- ytterligare uppslag inom SAMMA sats — det är därför självjoina UPDATE-satser
-- (`UPDATE t SET x = t2.x FROM t t2 …`) ger mängdbaserad, inte sekventiell,
-- semantik i Postgres. En STABLE funktion anropad inifrån samma UPDATE delar
-- det snapshotet. Uppslaget i funktionen nedan ser alltså konsekvent den rad
-- som fanns INNAN den här UPDATE-satsen körde, oavsett i vilken ordning
-- raderna behandlas.
--
-- `updated_at` MÅSTE undantas från jämförelsen
-- ---------------------------------------------
-- `update_profiles_updated_at` (BEFORE UPDATE-trigger, `update_updated_at_column()`)
-- sätter `NEW.updated_at = now()` OVILLKORLIGT, INNAN RLS WITH CHECK
-- utvärderas — även när klienten bara skickar `{ status: ... }`
-- (`consultantService.updateParticipantStatus` gör exakt det, verifierat mot
-- filen). Utan undantaget hade EVERY legitim statusändring nekats, eftersom
-- `updated_at` alltid skiljer sig från den gamla raden.
--
-- Övriga triggers på `profiles` kontrollerade och ofarliga för detta fall:
--   protect_last_superadmin       — bara vid rollnedgradering, rörs inte här
--   trg_sync_ai_enabled           — bara vid ändrat ai_consent_at, rörs inte här
--   audit_profile_changes (AFTER) — loggar bara vid ändrat role/roles, tyst no-op här
--
-- VAD SOM ÄR KONTROLLERAT FÖR ATT UTESLUTA EN VÄG FÖRBI ROLLSKYDDET
-- --------------------------------------------------------------------
-- Permissiva policyer OR:as (lärdomen från A16/2026-08-04). Den nya policyn
-- nedan är permissiv och läggs till de två befintliga. Det är säkert HÄR
-- eftersom:
--   1. Den nya policyns WITH CHECK kräver att VARJE fält utom `status` och
--      `updated_at` är identiskt med den gamla raden — inklusive `role`,
--      `roles` och `active_role`. Ett försök att smyga med en rollhöjning i
--      samma UPDATE nekas alltså av DENNA policy, oavsett vad de andra två
--      policyernas WITH CHECK (OR:ade in i samma uttryck) råkar tillåta.
--   2. De andra två policyernas WITH CHECK (`check_role_change_allowed`)
--      läses i sin helhet (se funktionsdefinitionen): för en rad där
--      `user_id <> auth.uid()` går den in i grenen "for other users" och
--      kräver `my_role IN ('ADMIN','SUPERADMIN')` — en konsulent utan den
--      rollen får FALSE där, oavsett vad hen skickar. De två befintliga
--      policyerna kan alltså inte "låna ut" en väg förbi rollskyddet till en
--      konsulent, och den nya policyn öppnar ingen egen sådan väg.
--   3. Den nya policyns USING/WITH CHECK har `profiles.id <> auth.uid()`
--      som extra spärr — en konsulent kan inte använda den här policyn på
--      sin EGEN rad, även i det (i praktiken obefintliga) fallet att någon
--      skulle ha en `consultant_participants`-rad med sig själv som både
--      konsulent och deltagare.
--
-- =============================================================================
-- Funktionen: jämför ny rad mot gammal rad, med status och updated_at borttagna
-- =============================================================================

CREATE OR REPLACE FUNCTION public.profiles_consultant_status_only_check(
  target_id uuid,
  new_row jsonb
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  old_row jsonb;
BEGIN
  -- SECURITY DEFINER med avsikt: uppslaget ska INTE bero på att den
  -- anropande konsulentens egna SELECT-policyer råkar täcka raden (se
  -- resonemanget i migrationens header). Bypassar RLS, läser alltid den
  -- verkliga gamla raden.
  SELECT to_jsonb(p) - 'status' - 'updated_at' INTO old_row
  FROM public.profiles p
  WHERE p.id = target_id;

  IF old_row IS NULL THEN
    -- Raden fanns inte vid uppslaget — ska vara omöjligt givet att UPDATE:en
    -- redan pekar på en existerande rad, men fail closed om det ändå händer.
    RETURN FALSE;
  END IF;

  RETURN old_row = (new_row - 'status' - 'updated_at');
END;
$function$;

-- Precis som SK3: Postgres ger EXECUTE till PUBLIC som default. REVOKE:a det
-- explicit och GRANT:a bara till authenticated (funktionen anropas enbart
-- från RLS-policyn nedan, som körs i den inloggade konsulentens kontext).
REVOKE ALL ON FUNCTION public.profiles_consultant_status_only_check(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.profiles_consultant_status_only_check(uuid, jsonb) TO authenticated;

-- =============================================================================
-- Policyn
-- =============================================================================

CREATE POLICY "Konsulent kan ändra status på sin tilldelade deltagare"
  ON public.profiles FOR UPDATE
  USING (
    profiles.id <> auth.uid()
    AND EXISTS (
      SELECT 1 FROM consultant_participants cp
      WHERE cp.consultant_id = auth.uid()
        AND cp.participant_id = profiles.id
    )
  )
  WITH CHECK (
    profiles.id <> auth.uid()
    AND EXISTS (
      SELECT 1 FROM consultant_participants cp
      WHERE cp.consultant_id = auth.uid()
        AND cp.participant_id = profiles.id
    )
    AND public.profiles_consultant_status_only_check(profiles.id, to_jsonb(profiles))
  );

-- =============================================================================
-- VERIFIERING — kör EFTER körningen. Ett kommando som "gick bra" är inget
-- bevis (lärdomen 2026-08-04: ett REVOKE kan lyckas tyst utan effekt).
-- Varje block har både ett NEKANDE och ett GODKÄNNANDE prov.
-- =============================================================================

-- 1) Strukturell kontroll — tre UPDATE-policyer ska synas på profiles.
--   SELECT policyname, cmd, permissive, qual, with_check
--   FROM pg_policies WHERE tablename = 'profiles' AND cmd = 'UPDATE'
--   ORDER BY policyname;

-- 2) Funktionens rättigheter — ska INTE vara körbar av anon eller PUBLIC.
--   SELECT has_function_privilege('anon', 'public.profiles_consultant_status_only_check(uuid,jsonb)', 'EXECUTE') AS anon_exec,
--          has_function_privilege('authenticated', 'public.profiles_consultant_status_only_check(uuid,jsonb)', 'EXECUTE') AS authenticated_exec;
--   → anon_exec = false, authenticated_exec = true

-- 3) NEKANDE prov — konsulent UTAN aktiv relation till deltagaren.
--    Byt ut UUID:erna mot en konsulent utan rad i consultant_participants
--    för det participant-id:t.
--   BEGIN;
--     SET LOCAL ROLE authenticated;
--     SET LOCAL request.jwt.claim.sub = '<konsulent-uuid-utan-relation>';
--     UPDATE profiles SET status = 'ON_HOLD' WHERE id = '<participant-uuid>';
--     -- Förväntat: 0 rader påverkade (RLS USING filtrerar bort raden), inget fel.
--   ROLLBACK;

-- 4) NEKANDE prov — konsulent MED aktiv relation, men försöker ändra ETT
--    annat fält samtidigt (rollhöjningsförsöket denna migration ska stoppa).
--   BEGIN;
--     SET LOCAL ROLE authenticated;
--     SET LOCAL request.jwt.claim.sub = '<konsulent-uuid-med-aktiv-relation>';
--     -- Förväntat: fel ("new row violates row-level security policy"), 0 rader.
--     UPDATE profiles SET status = 'ON_HOLD', role = 'SUPERADMIN' WHERE id = '<participant-uuid>';
--   ROLLBACK;
--   -- Upprepa med first_name/email/roles i stället för role — samma förväntan.

-- 5) GODKÄNNANDE prov — konsulent MED aktiv relation, bara status ändras.
--   BEGIN;
--     SET LOCAL ROLE authenticated;
--     SET LOCAL request.jwt.claim.sub = '<konsulent-uuid-med-aktiv-relation>';
--     UPDATE profiles SET status = 'ON_HOLD' WHERE id = '<participant-uuid>'
--       RETURNING id, status, updated_at;
--     -- Förväntat: 1 rad, status = 'ON_HOLD', updated_at ändrad, alla andra
--     -- fält oförändrade jämfört med före.
--   ROLLBACK; -- rulla alltid tillbaka testskrivningen, committa aldrig den

-- 6) Regressionsprov — deltagaren och adminflödet ska fungera precis som förut.
--   BEGIN;
--     SET LOCAL ROLE authenticated;
--     SET LOCAL request.jwt.claim.sub = '<deltagarens-egen-uuid>';
--     UPDATE profiles SET first_name = 'Test' WHERE id = '<deltagarens-egen-uuid>';
--     -- Förväntat: lyckas som innan (opåverkat av den nya policyn).
--   ROLLBACK;
