-- A20 (SEC-10): dataexporten (GDPR art. 15.3 / 20) saknade exakt art. 9-datan.
--
-- Den gamla `export_user_data()` räknade upp sju källor för hand: profiles, cvs,
-- cover_letters, interest_results, user_activities (max 1000), saved_jobs,
-- consent_history.
--
-- Saknades bl.a.: `diary_entries`, `mood_logs`, `user_adaptations`,
-- `unified_profiles`, `exercise_answers`, `skills_analyses`, `cv_versions`,
-- `interest_guide_history`, `user_activity_log` (736 rader i prod!),
-- `participant_data_sharing`, `data_sharing_audit`. Alltså dagbok, mående och
-- anpassningsbehov — det känsligaste portalen lagrar. En registerutdrags-
-- begäran har hittills besvarats med en ofullständig kopia.
--
-- Dessutom var `user_activities` en av de sju — den tabellen har **0 rader** i
-- prod (ingen skriver till den, se H14), medan den faktiska aktivitetsloggen
-- ligger i `user_activity_log` och aldrig exporterades.
--
-- ROTORSAKEN ÄR HANDPÅLÄGGNINGEN, INTE DE SAKNADE RADERNA.
-- En handskriven lista driftar isär från schemat varje gång en tabell läggs
-- till — samma klass som fantomtabellerna i H-spåret. Den här versionen
-- **härleder** tabellerna ur `information_schema` vid varje anrop:
--
--   * varje BASE TABLE i `public` med en uuid-kolumn `user_id`
--   * varje BASE TABLE i `public` med en uuid-kolumn `participant_id`
--     (deltagarens rad i konsulentkopplingar, datadelning och auditlogg)
--   * `profiles` via `id`
--
-- Nya tabeller kommer alltså med automatiskt. Tomma tabeller tas med som `[]`
-- med flit: en export som utelämnar dem går inte att skilja från en export som
-- glömt dem, och art. 15 handlar om att kunna visa vad som finns *och* inte finns.
--
-- Skydd mot patologiska fall: max 5 000 rader per tabell (`_truncated: true`
-- sätts när taket slår i), och tabellnamn interpoleras med %I.
--
-- Kör med:
--   npx supabase db query --linked -f supabase/migrations/20260804140000_complete_data_export.sql

CREATE OR REPLACE FUNCTION public.export_user_data()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id      UUID;
  v_profile      RECORD;
  v_data         JSONB := '{}'::JSONB;
  v_truncated    TEXT[] := ARRAY[]::TEXT[];
  v_tbl          RECORD;
  v_rows         JSONB;
  v_limit        CONSTANT INT := 5000;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = v_user_id;

  -- ---------------------------------------------------------------------
  -- Alla tabeller som pekar ut användaren med `user_id` (uuid)
  -- ---------------------------------------------------------------------
  FOR v_tbl IN
    SELECT c.table_name
      FROM information_schema.columns c
      JOIN information_schema.tables t
        ON t.table_schema = c.table_schema
       AND t.table_name   = c.table_name
       AND t.table_type   = 'BASE TABLE'
     WHERE c.table_schema = 'public'
       AND c.column_name  = 'user_id'
       AND c.data_type    = 'uuid'
     ORDER BY c.table_name
  LOOP
    EXECUTE format(
      'SELECT COALESCE(jsonb_agg(to_jsonb(x)), ''[]''::jsonb)
         FROM (SELECT * FROM public.%I WHERE user_id = $1 LIMIT %s) x',
      v_tbl.table_name, v_limit + 1
    ) INTO v_rows USING v_user_id;

    IF jsonb_array_length(v_rows) > v_limit THEN
      v_truncated := v_truncated || v_tbl.table_name;
      v_rows := (SELECT jsonb_agg(e) FROM (
                   SELECT e FROM jsonb_array_elements(v_rows) e LIMIT v_limit
                 ) s);
    END IF;

    v_data := v_data || jsonb_build_object(v_tbl.table_name, v_rows);
  END LOOP;

  -- ---------------------------------------------------------------------
  -- Tabeller där deltagaren pekas ut som `participant_id` — datadelning,
  -- konsulentkoppling och samtyckets auditlogg. Utan dessa kan användaren
  -- inte se vad som delats om hen, vilket är kärnan i art. 15.
  -- ---------------------------------------------------------------------
  FOR v_tbl IN
    SELECT c.table_name
      FROM information_schema.columns c
      JOIN information_schema.tables t
        ON t.table_schema = c.table_schema
       AND t.table_name   = c.table_name
       AND t.table_type   = 'BASE TABLE'
     WHERE c.table_schema = 'public'
       AND c.column_name  = 'participant_id'
       AND c.data_type    = 'uuid'
     ORDER BY c.table_name
  LOOP
    EXECUTE format(
      'SELECT COALESCE(jsonb_agg(to_jsonb(x)), ''[]''::jsonb)
         FROM (SELECT * FROM public.%I WHERE participant_id = $1 LIMIT %s) x',
      v_tbl.table_name, v_limit
    ) INTO v_rows USING v_user_id;

    v_data := v_data || jsonb_build_object(v_tbl.table_name, v_rows);
  END LOOP;

  -- Profilen sist så att nyckeln alltid finns även om loopen inte rörde den.
  v_data := v_data || jsonb_build_object('profile', COALESCE(to_jsonb(v_profile), 'null'::jsonb));

  INSERT INTO data_export_logs (user_id, user_email, export_type)
  VALUES (v_user_id, v_profile.email, 'full');

  RETURN json_build_object(
    'success', true,
    'exported_at', NOW(),
    'schema_version', '2026-08-04',
    'note', 'Tabellistan härleds ur databasens schema vid varje export. Tomma tabeller redovisas som [] med flit.',
    'truncated_tables', to_json(v_truncated),
    'row_limit_per_table', v_limit,
    'data', v_data
  );
END;
$function$;

-- Exporten ska bara kunna köras av den inloggade användaren själv
-- (funktionen läser auth.uid() och tar inga argument).
REVOKE EXECUTE ON FUNCTION public.export_user_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.export_user_data() TO authenticated, service_role;
