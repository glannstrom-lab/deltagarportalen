-- KS2 = b — prov i transaktion mot prod (rullas ALLTID tillbaka).
-- Kör: npx supabase db query --linked -f e2e/ks2-lasratt-prov.sql
-- Utfallet kommer som ett felmeddelande "PROV-RESULTAT: …" — det är avsiktligt:
-- RAISE EXCEPTION är det som garanterar rollback, och meddelandet bär raderna.
--
-- Scenario: km-konsulent skriver en journalrad och ett mål om km-deltagare.
-- Chefen överlämnar deltagaren till claude-playwright-consultant (cp-raden
-- flyttas, exakt som organization_handover gör). Sedan:
--   mottagaren: SELECT ska ge 1, UPDATE/DELETE ska ge 0 rader, INSERT i eget
--               namn ska gå, INSERT i den gamlas namn ska ge 42501
--   gamla konsulenten: SELECT ska ge 0
DO $$
DECLARE
  km_kons uuid := (SELECT id FROM auth.users WHERE email = 'km-konsulent@jobin.test');
  km_delt uuid := (SELECT id FROM auth.users WHERE email = 'km-deltagare@jobin.test');
  cpc     uuid := (SELECT id FROM auth.users WHERE email = 'claude-playwright-consultant@jobin.test');
  n int; r text := '';
  jid uuid;
BEGIN
  -- Utgångsläge: km-konsulent har km-deltagare
  DELETE FROM consultant_participants WHERE participant_id = km_delt;
  INSERT INTO consultant_participants (consultant_id, participant_id, assigned_by) VALUES (km_kons, km_delt, km_kons);
  INSERT INTO consultant_journal (consultant_id, participant_id, content, category) VALUES (km_kons, km_delt, 'KS2-prov', 'GENERAL') RETURNING id INTO jid;
  INSERT INTO consultant_goals (consultant_id, participant_id, title, status, priority) VALUES (km_kons, km_delt, 'KS2-provmål', 'NOT_STARTED', 'MEDIUM');
  INSERT INTO consultant_meetings (consultant_id, participant_id, scheduled_at, status) VALUES (km_kons, km_delt, now() + interval '1 day', 'scheduled');

  -- Överlämning: cp-raden flyttas till mottagaren
  UPDATE consultant_participants SET consultant_id = cpc WHERE participant_id = km_delt AND consultant_id = km_kons;

  -- === Som MOTTAGAREN ===
  EXECUTE 'SET LOCAL ROLE authenticated';
  PERFORM set_config('request.jwt.claims', json_build_object('sub', cpc, 'role', 'authenticated')::text, true);

  SELECT count(*) INTO n FROM consultant_journal WHERE participant_id = km_delt;  r := r || 'mottagare SELECT journal=' || n;
  SELECT count(*) INTO n FROM consultant_goals   WHERE participant_id = km_delt;  r := r || ' mål=' || n;
  SELECT count(*) INTO n FROM consultant_meetings WHERE participant_id = km_delt; r := r || ' möten=' || n;

  UPDATE consultant_journal SET content = 'ändrad av mottagaren' WHERE id = jid;  GET DIAGNOSTICS n = ROW_COUNT; r := r || ' | mottagare UPDATE gammal=' || n;
  DELETE FROM consultant_journal WHERE id = jid;                                   GET DIAGNOSTICS n = ROW_COUNT; r := r || ' DELETE gammal=' || n;

  BEGIN
    INSERT INTO consultant_journal (consultant_id, participant_id, content, category) VALUES (cpc, km_delt, 'egen rad', 'GENERAL');
    r := r || ' | mottagare INSERT egen=OK';
  EXCEPTION WHEN OTHERS THEN r := r || ' | mottagare INSERT egen=FEL ' || SQLSTATE; END;

  BEGIN
    INSERT INTO consultant_journal (consultant_id, participant_id, content, category) VALUES (km_kons, km_delt, 'i annans namn', 'GENERAL');
    r := r || ' | mottagare INSERT i annans namn=GICK IGENOM (FEL)';
  EXCEPTION WHEN OTHERS THEN r := r || ' | mottagare INSERT i annans namn=' || SQLSTATE; END;

  -- === Som GAMLA konsulenten ===
  PERFORM set_config('request.jwt.claims', json_build_object('sub', km_kons, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO n FROM consultant_journal WHERE participant_id = km_delt;  r := r || ' | gamla SELECT journal=' || n;
  SELECT count(*) INTO n FROM consultant_goals   WHERE participant_id = km_delt;  r := r || ' mål=' || n;
  SELECT count(*) INTO n FROM consultant_meetings WHERE participant_id = km_delt; r := r || ' möten=' || n;
  BEGIN
    INSERT INTO consultant_journal (consultant_id, participant_id, content, category) VALUES (km_kons, km_delt, 'efter överlämning', 'GENERAL');
    r := r || ' | gamla INSERT=GICK IGENOM (FEL)';
  EXCEPTION WHEN OTHERS THEN r := r || ' | gamla INSERT=' || SQLSTATE; END;

  EXECUTE 'RESET ROLE';
  RAISE EXCEPTION 'PROV-RESULTAT: %', r;
END $$;
