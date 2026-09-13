-- F6-prov: dagbok utan hälsosamtycke, skild från mood/energy_level. Körs i en
-- transaktion som ALLTID rullas tillbaka (RAISE EXCEPTION garanterar det, och
-- meddelandet bär resultatraderna). Kör:
--   npx supabase db query --linked -f e2e/f6-dagbok-prov.sql
--
-- Migrationstexten nedan (fram till "-- ---- slut migration ----") är en kopia
-- av supabase/migrations/20260913150000_f6_dagbok_utan_halsosamtycke.sql.
--
-- Scenario: claude-playwright-test@jobin.se, tillfälligt utan wellness-samtycke.
--   1. Ren textrad (mood=NULL, energy_level=NULL) UTAN samtycke  → ska gå igenom
--   2. Rad med mood satt                          UTAN samtycke  → 42501
--   3. Rad med bara energy_level satt              UTAN samtycke  → 42501
--   4. UPDATE av den rena raden (fortfarande ingen hälsodata)     → 1 rad
--   5. UPDATE som lägger till mood på den rena raden, UTAN samtycke → 42501
--   6. Rad med mood satt, MED samtycke (beviljat i provet)        → ska gå igenom
--
-- Profilens ursprungliga wellness_consent_at återställs automatiskt av
-- ROLLBACK längst ned — provet skriver inget varaktigt.

BEGIN;

-- ---- migrationen (kopia) ----
DROP POLICY IF EXISTS "Users can create own diary entries with wellness consent" ON diary_entries;

CREATE POLICY "Users can create own diary entries unless health data"
  ON diary_entries FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      (mood IS NULL AND energy_level IS NULL)
      OR check_wellness_consent(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own diary entries with wellness consent" ON diary_entries;

CREATE POLICY "Users can update own diary entries unless health data"
  ON diary_entries FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (
      (mood IS NULL AND energy_level IS NULL)
      OR check_wellness_consent(auth.uid())
    )
  );
-- ---- slut migration ----

-- Policyuppsättningen efter ändringen (hela, inte bara de nya) — ska vara
-- EXAKT fyra rader, samma som före: SELECT/DELETE oförändrade.
DO $$
DECLARE r text := '';
BEGIN
  SELECT string_agg(policyname || ' (' || cmd || ')', ' | ' ORDER BY cmd) INTO r
  FROM pg_policies WHERE tablename = 'diary_entries';
  RAISE NOTICE 'F6 policyuppsättning: %', r;
END $$;

DO $$
DECLARE
  v_user uuid := (SELECT id FROM auth.users WHERE email = 'claude-playwright-test@jobin.se');
  v_had_consent boolean;
  n int;
  r text := '';
  id_ren uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'F6-PROV: testkontot claude-playwright-test@jobin.se hittades inte';
  END IF;

  SELECT wellness_consent_at IS NOT NULL INTO v_had_consent FROM profiles WHERE id = v_user;
  r := r || format('utgångsläge: hade_samtycke_fore_prov=%s | ', v_had_consent);

  -- Simulera: inget wellness-samtycke
  UPDATE profiles SET wellness_consent_at = NULL WHERE id = v_user;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;

  -- 1. Ren textrad (mood och energy_level NULL) UTAN samtycke ska gå igenom
  BEGIN
    INSERT INTO diary_entries (user_id, content, entry_date, entry_type)
    VALUES (v_user, 'F6-prov: ren textrad utan mood/energy', CURRENT_DATE, 'diary')
    RETURNING id INTO id_ren;
    r := r || 'ren textrad UTAN samtycke: OK (väntat) | ';
  EXCEPTION WHEN insufficient_privilege THEN
    r := r || 'ren textrad UTAN samtycke: 42501 (FEL, väntade OK) | ';
  END;

  -- 2. Rad med mood satt UTAN samtycke ska nekas
  BEGIN
    INSERT INTO diary_entries (user_id, content, mood, entry_date, entry_type)
    VALUES (v_user, 'F6-prov: med mood', 3, CURRENT_DATE, 'diary');
    r := r || 'mood-rad UTAN samtycke: GICK IGENOM (FEL) | ';
  EXCEPTION WHEN insufficient_privilege THEN
    r := r || 'mood-rad UTAN samtycke: 42501 (väntat) | ';
  END;

  -- 3. Rad med bara energy_level satt UTAN samtycke ska också nekas
  BEGIN
    INSERT INTO diary_entries (user_id, content, energy_level, entry_date, entry_type)
    VALUES (v_user, 'F6-prov: med energy', 4, CURRENT_DATE, 'diary');
    r := r || 'energy-rad UTAN samtycke: GICK IGENOM (FEL) | ';
  EXCEPTION WHEN insufficient_privilege THEN
    r := r || 'energy-rad UTAN samtycke: 42501 (väntat) | ';
  END;

  IF id_ren IS NOT NULL THEN
    -- 4. Uppdatera den rena raden UTAN att lägga till hälsodata ska gå igenom
    UPDATE diary_entries SET content = 'F6-prov: uppdaterad ren text' WHERE id = id_ren;
    GET DIAGNOSTICS n = ROW_COUNT;
    r := r || format('UPDATE ren rad (fortsatt null) UTAN samtycke: %s rad (väntat 1) | ', n);

    -- 5. Försöka lägga till mood på den rena raden UTAN samtycke ska nekas
    BEGIN
      UPDATE diary_entries SET mood = 2 WHERE id = id_ren;
      r := r || 'UPDATE lägg till mood UTAN samtycke: GICK IGENOM (FEL) | ';
    EXCEPTION WHEN insufficient_privilege THEN
      r := r || 'UPDATE lägg till mood UTAN samtycke: 42501 (väntat) | ';
    END;
  ELSE
    r := r || 'id_ren saknas (steg 1 misslyckades) — kunde inte köra steg 4/5 | ';
  END IF;

  RESET ROLE;

  -- Bevilja samtycke och pröva igen — den nödvändiga POSITIVA kontrollen:
  -- en grind som nekar ALLT hade också gett 42501 ovan och sett "rätt" ut.
  UPDATE profiles SET wellness_consent_at = now() WHERE id = v_user;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;

  BEGIN
    INSERT INTO diary_entries (user_id, content, mood, entry_date, entry_type)
    VALUES (v_user, 'F6-prov: med mood OCH samtycke', 3, CURRENT_DATE, 'diary');
    r := r || 'mood-rad MED samtycke: OK (väntat)';
  EXCEPTION WHEN insufficient_privilege THEN
    r := r || 'mood-rad MED samtycke: 42501 (FEL, väntade OK)';
  END;

  RESET ROLE;

  RAISE EXCEPTION 'F6-PROV: %', r;
END $$;

ROLLBACK;
