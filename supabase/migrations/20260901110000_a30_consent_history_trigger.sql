-- A30 — samtyckesregistret härleds ur kolumnen, inte ur den som råkar anropa rätt funktion
--
-- MÄTT MOT PROD 2026-09-01. Planen sa "samtyckesregistret har noll rader för hälsa och
-- wellness". Det stämde inte: `consent_history` har 53 rader (terms 18, privacy 18,
-- ai_processing 16, marketing 1), och `grant_consent` HAR grenar för `health_data` och
-- `wellness_data`. Det verkliga felet är ett annat och mindre — men skarpare:
--
--   Två konton bär art. 9-samtycken direkt på `profiles` (`wellness_consent_at`,
--   `health_consent_at`) med NOLL rader i `consent_history`. Tidsstämpeln finns,
--   revisionsspåret inte. Skrivvägen som satte dem gick förbi `grant_consent` —
--   `services/consentApi.ts:33` varnar redan ordagrant för exakt det.
--
-- ÅTGÄRDEN ÄR PLACERINGEN, INTE KONTROLLEN. Så länge historikraden skrivs av den som
-- råkar anropa rätt funktion kan varje ny skrivväg tappa den, tyst. Efter den här
-- migrationen härleds raden ur KOLUMNÖVERGÅNGEN på `profiles`, vilket är det enda stället
-- alla skrivvägar måste passera. Samma grepp som REGELVERKSREGEL i `ai-team-chat`: lägg
-- regeln på sammansättningsstället, inte i varje gren.
--
-- Det betyder att `grant_consent` och `withdraw_consent` måste SLUTA logga själva —
-- annars dubbelloggas varje samtycke. Båda skrivs om nedan.
--
-- IP OCH USER AGENT LÄMNAS NULL. `profiles` har `consent_ip`/`consent_user_agent`, men de
-- sattes vid registreringen och säger ingenting om ett samtycke som ges två månader senare.
-- Att kopiera in dem hade gett en revisionsrad som ser fullständig ut och är osann — precis
-- den vanan som är portalens felklass. NULL är ärligt; ett gammalt IP-nummer är det inte.

-- ============================================================
-- 1. Triggerfunktionen
-- ============================================================

CREATE OR REPLACE FUNCTION public.log_consent_column_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $trigger$
DECLARE
  -- Kolumn -> samtyckestyp. Samma sex par som `grant_consent`s CASE-sats och
  -- `consentApi.ts`. Läggs en sjunde typ till måste den in på alla tre ställena.
  kolumner text[][] := ARRAY[
    ['terms_accepted_at',     'terms'],
    ['privacy_accepted_at',   'privacy'],
    ['ai_consent_at',         'ai_processing'],
    ['marketing_consent_at',  'marketing'],
    ['health_consent_at',     'health_data'],
    ['wellness_consent_at',   'wellness_data']
  ];
  i int;
  kol text;
  typ text;
  gammalt text;
  nytt text;
  gammal_rad jsonb;
  ny_rad jsonb;
BEGIN
  ny_rad := to_jsonb(NEW);
  -- Vid INSERT finns ingen OLD. Ett konto som skapas med `terms_accepted_at` satt har
  -- gett samtycket i det ögonblicket och ska få sin rad.
  gammal_rad := CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE '{}'::jsonb END;

  FOR i IN 1 .. array_length(kolumner, 1) LOOP
    kol := kolumner[i][1];
    typ := kolumner[i][2];
    gammalt := gammal_rad ->> kol;
    nytt := ny_rad ->> kol;

    IF nytt IS NOT NULL AND nytt IS DISTINCT FROM gammalt THEN
      -- NULL -> värde (nytt samtycke) och värde -> annat värde (förnyat samtycke).
      INSERT INTO consent_history (user_id, consent_type, action)
      VALUES (NEW.id, typ, 'granted');
    ELSIF nytt IS NULL AND gammalt IS NOT NULL THEN
      INSERT INTO consent_history (user_id, consent_type, action)
      VALUES (NEW.id, typ, 'withdrawn');
    END IF;
  END LOOP;

  RETURN NULL;  -- AFTER-trigger, returvärdet används inte
END;
$trigger$;

-- Ingen WHEN-klausul med flit. Den hade sparat några mikrosekunder på 93 rader och samtidigt
-- gjort varje framtida prov av triggern otillförlitligt: en WHEN som inte uppfylls ser exakt
-- ut som en trigger som inte fungerar (lärdomen ur A22:s triggerprov).
DROP TRIGGER IF EXISTS log_consent_changes ON public.profiles;
CREATE TRIGGER log_consent_changes
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_consent_column_change();

-- Triggerfunktioner behöver ingen EXECUTE (Postgres kontrollerar när triggern SKAPAS, inte
-- när den fyrar — bevisat i A22). Håll den utanför anon och authenticated från början,
-- annars fäller `npm run lint:grants` nästa `grants:refresh`.
REVOKE ALL ON FUNCTION public.log_consent_column_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_consent_column_change() FROM anon;
REVOKE ALL ON FUNCTION public.log_consent_column_change() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.log_consent_column_change() TO service_role;

-- ============================================================
-- 2. De två RPC:erna slutar logga själva
-- ============================================================

CREATE OR REPLACE FUNCTION public.grant_consent(p_consent_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  column_name TEXT;
BEGIN
  CASE p_consent_type
    WHEN 'terms' THEN column_name := 'terms_accepted_at';
    WHEN 'privacy' THEN column_name := 'privacy_accepted_at';
    WHEN 'ai_processing' THEN column_name := 'ai_consent_at';
    WHEN 'marketing' THEN column_name := 'marketing_consent_at';
    WHEN 'health_data' THEN column_name := 'health_consent_at';
    WHEN 'wellness_data' THEN column_name := 'wellness_consent_at';
    ELSE RAISE EXCEPTION 'Invalid consent type: %', p_consent_type;
  END CASE;

  EXECUTE format('UPDATE profiles SET %I = NOW() WHERE id = $1', column_name)
  USING auth.uid();

  -- Historikraden skrivs av triggern `log_consent_changes` på profiles (A30).
  -- Lägg inte tillbaka ett INSERT här — då loggas varje samtycke två gånger.
  RETURN TRUE;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.withdraw_consent(consent_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  column_name TEXT;
BEGIN
  CASE consent_type
    WHEN 'terms' THEN column_name := 'terms_accepted_at';
    WHEN 'privacy' THEN column_name := 'privacy_accepted_at';
    WHEN 'ai_processing' THEN column_name := 'ai_consent_at';
    WHEN 'marketing' THEN column_name := 'marketing_consent_at';
    WHEN 'health_data' THEN column_name := 'health_consent_at';
    WHEN 'wellness_data' THEN column_name := 'wellness_consent_at';
    ELSE RAISE EXCEPTION 'Invalid consent type: %', consent_type;
  END CASE;

  EXECUTE format('UPDATE profiles SET %I = NULL WHERE id = $1', column_name)
  USING auth.uid();

  -- Se kommentaren i grant_consent. Triggern loggar 'withdrawn'.
  RETURN TRUE;
END;
$fn$;

-- ============================================================
-- 3. SKARP BUGG, hittad under A30: authenticated kunde inte kora dem alls
-- ============================================================
-- Matt mot prod 2026-09-01:
--
--   grant_consent(text)     proacl = {postgres=X/postgres,service_role=X/postgres}
--   withdraw_consent(text)  proacl = {postgres=X/postgres,service_role=X/postgres}
--
-- has_function_privilege('authenticated', ...) = FALSE for bada. PostgREST kor
-- webblasarens anrop som `authenticated`, sa varje `supabase.rpc('grant_consent')`
-- fran portalen far 42501 permission denied.
--
-- HUR DET GICK TILL. A17 (2026-08-04) revokade EXECUTE fran de 15 definer-funktioner
-- som da hade noll anropare. grant_consent och withdraw_consent var tva av dem — det
-- var korrekt just da. Sjutton dagar senare, 2026-08-21, byggdes `consentApi.ts` (MV1)
-- som portalens ENDA vag till samtycken, och den anropar precis de tva funktionerna.
-- Ingen gav tillbaka rattigheten.
--
-- FOLJDEN I DRIFT: sedan 21 augusti kan ingen anvandare ge eller aterkalla ett samtycke.
-- `consentApi` fail:ar closed och KASTAR, sa felet ar inte tyst — men samtyckesgrindarna
-- gar inte att anvanda. Belagg: nyaste raden i `consent_history` ar 2026-07-23, alltsa
-- fyra veckor FORE den "enda vagen in" byggdes.
--
-- Bada funktionerna anvander auth.uid() internt och kan darfor bara rora anroparens egen
-- rad. Grant till authenticated ar ratt niva.
--
-- Lardomen ar inte "A17 hade fel" utan att en REVOKE aldrig ar klar: koden runt omkring
-- ror sig. `npm run lint:grants` far darfor i samma commit en kontroll at andra hallet —
-- varje `.rpc('...')` i klientkoden maste peka pa en funktion `authenticated` kan kora.

GRANT EXECUTE ON FUNCTION public.grant_consent(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.withdraw_consent(text) TO authenticated;

-- ============================================================
-- 4. Backfill av de konton som saknar historik
-- ============================================================
-- Raderna är HÄRLEDDA ur `profiles`, inte observerade. Det står utskrivet i `user_agent`
-- så att den som läser registret ser skillnaden — annars hade backfillen sett ut som en
-- loggad händelse, vilket den inte är. `created_at` sätts till samtyckets faktiska
-- tidsstämpel på profilen; det är den uppgift vi verkligen har.

INSERT INTO consent_history (user_id, consent_type, action, created_at, user_agent)
SELECT p.id, 'wellness_data', 'granted', p.wellness_consent_at,
       'backfill A30 2026-09-01 - harledd ur profiles.wellness_consent_at, ingen observerad handelse'
FROM profiles p
WHERE p.wellness_consent_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM consent_history h
    WHERE h.user_id = p.id AND h.consent_type = 'wellness_data'
  );

INSERT INTO consent_history (user_id, consent_type, action, created_at, user_agent)
SELECT p.id, 'health_data', 'granted', p.health_consent_at,
       'backfill A30 2026-09-01 - harledd ur profiles.health_consent_at, ingen observerad handelse'
FROM profiles p
WHERE p.health_consent_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM consent_history h
    WHERE h.user_id = p.id AND h.consent_type = 'health_data'
  );
