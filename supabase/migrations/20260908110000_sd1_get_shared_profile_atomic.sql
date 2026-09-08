-- SD1 (projektgenomgången 2026-09-07): get_shared_profile — atomärt visningstak,
-- och lösenordskolumnen som aldrig gjorde något tas bort.
--
-- INTE KÖRD ÄN. Rör en SECURITY DEFINER-funktion som anon kan köra och
-- droppar en kolumn — kräver Mikaels ja (CLAUDE.md). Kör manuellt:
--   npx supabase db query --linked -f supabase/migrations/20260908110000_sd1_get_shared_profile_atomic.sql
-- Uppdatera sedan BÅDA snapshotarna i SAMMA commit som körningen:
--   cd client && npm run schema:refresh && npm run grants:refresh
-- (schema-snapshot.json bär i dag password_hash på profile_shares — utan
-- refresh blir lint:schema inte röd, för ingen kod refererar kolumnen, men
-- snapshoten ljuger.)
--
-- PREMISSEN, MÄTT MOT PROD 2026-09-08
-- ----------------------------------
-- Funktionskroppen (pg_get_functiondef) gör i ordning:
--   SELECT * INTO v_share … WHERE share_code = p_share_code;
--   IF view_count >= max_views THEN RETURN NULL;   -- läser
--   UPDATE profile_shares SET view_count = view_count + 1 …;  -- skriver
-- Två samtidiga anrop läser samma view_count (t.ex. 4 av max 5), båda
-- passerar jämförelsen, båda skriver — 6 visningar av en länk som lovade 5.
-- Taket är det enda skydd användaren har mot att en länk sprids vidare,
-- och det håller inte under samtidighet. Grants: anon=X, authenticated=X,
-- prosecdef=true. profile_shares: 0 rader i prod.
--
-- password_hash: kolumnen finns (text, nullable) och funktionen läser den
-- aldrig. Klienten skriver den aldrig heller: profileShareApi.create()
-- skickar inte fältet, ProfileShare-typen saknar det, och ProfileSharing.tsx
-- har inget lösenordsfält. Det finns alltså inget UI-löfte att verkställa —
-- bara en kolumn som ser ut som en funktion. Den minsta ärliga lösningen
-- är att ta bort den. (Alternativet — att bygga lösenordsskydd — vore en
-- ny funktion, inte en rättelse, och ska i så fall beslutas som en sådan.)
--
-- FORMEN
-- ------
-- En enda UPDATE med villkoren i WHERE och RETURNING * i stället för
-- SELECT → jämför → UPDATE. Under READ COMMITTED väntar den andra
-- transaktionen på radlåset och utvärderar WHERE på nytt mot den
-- uppdaterade raden — den femte visningen släpps in, den sjätte får NOT
-- FOUND. Utgång och tak ligger i samma WHERE, så en utgången länk räknas
-- inte upp (samma som förut). Radlåset tas för alla samtidiga läsare av
-- samma kod; det är avsiktligt och kostar ingenting i den här volymen.

ALTER TABLE profile_shares DROP COLUMN IF EXISTS password_hash;

CREATE OR REPLACE FUNCTION public.get_shared_profile(p_share_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_share profile_shares%ROWTYPE;
  v_prof profiles%ROWTYPE;
  v_profile jsonb;
  v_cv record;
BEGIN
  -- SD1: uppslag, giltighetskontroll och räkning i EN sats. Ingen rad
  -- tillbaka = okänd kod, utgången länk eller uppnått tak — samma NULL
  -- utåt, ingen uppräkning av vilket det var.
  UPDATE profile_shares
     SET view_count = view_count + 1,
         last_viewed_at = now()
   WHERE share_code = p_share_code
     AND (expires_at IS NULL OR expires_at >= now())
     AND (max_views IS NULL OR view_count < max_views)
  RETURNING * INTO v_share;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT * INTO v_prof FROM profiles WHERE id = v_share.user_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  v_profile := jsonb_build_object(
    'first_name', v_prof.first_name,
    'last_name', v_prof.last_name,
    'profile_image_url', v_prof.profile_image_url
  );

  IF v_share.show_contact THEN
    v_profile := v_profile || jsonb_build_object(
      'email', v_prof.email,
      'phone', v_prof.phone,
      'location', v_prof.location
    );
  END IF;

  IF v_share.show_summary THEN
    v_profile := v_profile || jsonb_build_object('ai_summary', v_prof.ai_summary);
  END IF;

  IF v_share.show_skills THEN
    v_profile := v_profile || jsonb_build_object('skills',
      COALESCE(
        (SELECT jsonb_agg(to_jsonb(s)) FROM profile_skills s WHERE s.user_id = v_share.user_id),
        '[]'::jsonb
      ));
  END IF;

  IF v_share.show_experience OR v_share.show_education THEN
    SELECT work_experience, education INTO v_cv FROM cvs WHERE user_id = v_share.user_id LIMIT 1;
    IF v_share.show_experience THEN
      v_profile := v_profile || jsonb_build_object('work_experience', v_cv.work_experience);
    END IF;
    IF v_share.show_education THEN
      v_profile := v_profile || jsonb_build_object('education', v_cv.education);
    END IF;
  END IF;

  IF v_share.show_documents THEN
    v_profile := v_profile || jsonb_build_object('documents',
      COALESCE(
        (SELECT jsonb_agg(to_jsonb(d)) FROM profile_documents d WHERE d.user_id = v_share.user_id),
        '[]'::jsonb
      ));
  END IF;

  RETURN jsonb_build_object(
    'profile', v_profile,
    'share', jsonb_build_object(
      'id', v_share.id,
      'name', v_share.name,
      'show_contact', v_share.show_contact,
      'show_skills', v_share.show_skills,
      'show_experience', v_share.show_experience,
      'show_education', v_share.show_education,
      'show_documents', v_share.show_documents,
      'show_summary', v_share.show_summary,
      'expires_at', v_share.expires_at,
      -- RETURNING gav redan det uppräknade värdet — inget "+ 1" här längre.
      'view_count', v_share.view_count,
      'max_views', v_share.max_views,
      'created_at', v_share.created_at
    )
  );
END;
$function$;

-- CREATE OR REPLACE bevarar ACL:n, men skriv den ändå uttryckligen (A22-
-- mönstret): bort från PUBLIC, sedan exakt de två roller som ska ha den.
-- Publik delningslänk = anon med flit; lint:grants har den på allowlisten.
REVOKE ALL ON FUNCTION public.get_shared_profile(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_profile(text) TO anon, authenticated;

-- =============================================================================
-- VERIFIERING — kör EFTER körningen. Förväntat svar utskrivet.
-- =============================================================================
-- select column_name from information_schema.columns
--   where table_name = 'profile_shares' and column_name = 'password_hash';
--   → 0 rader
-- select has_function_privilege('anon', 'public.get_shared_profile(text)', 'EXECUTE'),
--        has_function_privilege('authenticated', 'public.get_shared_profile(text)', 'EXECUTE');
--   → true, true
-- select pg_get_functiondef('public.get_shared_profile(text)'::regprocedure) like '%RETURNING * INTO v_share%';
--   → true
--
-- Funktionellt prov i RULLAD transaktion (dashboardens SQL-editor, som postgres).
-- Tar en riktig profil-uuid (<user>) och skapar en delning med tak 1:
--   BEGIN;
--     INSERT INTO profile_shares (user_id, share_code, max_views)
--       VALUES ('<user>', 'sd1-prov', 1);
--     SELECT (get_shared_profile('sd1-prov')->'share'->>'view_count');   → 1
--     SELECT get_shared_profile('sd1-prov');                              → NULL (taket nått)
--     SELECT view_count FROM profile_shares WHERE share_code = 'sd1-prov'; → 1 (inte 2)
--     UPDATE profile_shares SET expires_at = now() - interval '1 day', max_views = NULL
--       WHERE share_code = 'sd1-prov';
--     SELECT get_shared_profile('sd1-prov');                              → NULL (utgången)
--     SELECT view_count FROM profile_shares WHERE share_code = 'sd1-prov'; → 1 (utgången räknas inte)
--   ROLLBACK;
-- Samtidighetsprovet går inte att köra i en enda editor-session. Det är
-- kört lokalt 2026-09-08 i ett PostgreSQL 18-kluster med prod-funktionen
-- ordagrant (pg_get_functiondef) som baslinje: två sessioner mot en delning
-- med max_views = 1, session A håller sin transaktion öppen 3 s medan B
-- anropar. Gamla kroppen: B fick svar, view_count = 2 av 1. Nya kroppen:
-- B fick NULL, view_count = 1 av 1. Skriptet ligger i rapporten SD1
-- 2026-09-08 (scratchpad, inte i repot).
