-- F3 påminnelse kvällen innan — prov i transaktion mot prod (rullas ALLTID tillbaka).
-- Kör: npx supabase db query --linked -f e2e/f3-paminnelse-prov.sql
-- Utfallet kommer som "PROV-RESULTAT: …" i ett felmeddelande — RAISE EXCEPTION är
-- det som garanterar rollback. Filen bär migrationens funktions-DDL ordagrant
-- (20260913010000_f3_pass_paminnelse.sql) så att just den bevisas; cron-raden
-- utelämnas (den är inte transaktionell).
--
-- Scenario: ett seedat pass i morgon för km-deltagare i hennes aktiva plan.
--   körning 1 → exakt 1 notis (typ aktivitet_paminnelse, action_url /min-vecka, data.session_id)
--   körning 2 → 0 nya (idempotent)
--   pass med anmäld frånvaro (F1) → ingen påminnelse
--   pass redan markerat av konsulenten → ingen påminnelse
BEGIN;

CREATE OR REPLACE FUNCTION public.skicka_passpaminnelser()
RETURNS TABLE (session_id uuid, participant_id uuid, utfall text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_plats text;
BEGIN
  FOR r IN
    SELECT s.id, s.participant_id, s.plan_id, s.title, s.date, s.start_time, s.end_time, s.location
    FROM activity_sessions s
    WHERE s.date = CURRENT_DATE + 1
      AND s.participant_id IS NOT NULL
      AND s.attendance IS NULL
      AND s.absence_reported_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.user_id = s.participant_id
          AND n.type = 'aktivitet_paminnelse'
          AND n.data->>'session_id' = s.id::text
      )
    ORDER BY s.start_time
  LOOP
    BEGIN
      v_plats := NULLIF(btrim(coalesce(r.location, '')), '');
      INSERT INTO notifications (user_id, type, title, message, action_url, data)
      VALUES (
        r.participant_id,
        'aktivitet_paminnelse',
        'I morgon: ' || coalesce(r.title, 'Pass') || ' kl ' || to_char(r.start_time, 'HH24:MI'),
        'Du har ett pass i morgon '
          || to_char(r.date, 'DD') || '/' || to_char(r.date, 'MM')
          || ' kl ' || to_char(r.start_time, 'HH24:MI')
          || CASE WHEN r.end_time IS NOT NULL THEN '–' || to_char(r.end_time, 'HH24:MI') ELSE '' END
          || CASE WHEN v_plats IS NOT NULL THEN ' på ' || v_plats ELSE '' END
          || '. Kan du inte komma? Anmäl det i Min vecka.',
        '/min-vecka',
        jsonb_build_object(
          'session_id', r.id, 'plan_id', r.plan_id, 'date', r.date,
          'start_time', to_char(r.start_time, 'HH24:MI'),
          'end_time', CASE WHEN r.end_time IS NOT NULL THEN to_char(r.end_time, 'HH24:MI') END,
          'location', v_plats, 'paminnelse', true
        )
      );
      session_id := r.id; participant_id := r.participant_id; utfall := 'skickad'; RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      session_id := r.id; participant_id := r.participant_id; utfall := 'misslyckades: ' || SQLERRM; RETURN NEXT;
    END;
  END LOOP;
  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.skicka_passpaminnelser() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  v_deltagare uuid := (SELECT id FROM auth.users WHERE email = 'km-deltagare@jobin.test');
  v_plan uuid;
  v_pass uuid;
  v_pass_franvaro uuid;
  v_pass_markerat uuid;
  v_fore int;
  v_k1 int;
  v_k2 int;
  v_notis RECORD;
  v_franvaro_notiser int;
  v_markerat_notiser int;
  v_anon boolean;
  v_auth boolean;
BEGIN
  SELECT id INTO v_plan FROM activity_plans WHERE participant_id = v_deltagare AND status = 'active' LIMIT 1;
  IF v_plan IS NULL THEN RAISE EXCEPTION 'PROV-RESULTAT: km-deltagare saknar aktiv plan'; END IF;

  SELECT count(*) INTO v_fore FROM notifications WHERE user_id = v_deltagare AND type = 'aktivitet_paminnelse';

  -- Pass 1: vanligt pass i morgon (ska få påminnelse)
  INSERT INTO activity_sessions (plan_id, participant_id, date, start_time, end_time, title, activity_type, location)
  VALUES (v_plan, v_deltagare, CURRENT_DATE + 1, '09:00', '12:00', 'F3-provpass', 'jobsearch', 'Hjernet, Malmgatan 4')
  RETURNING id INTO v_pass;
  -- Pass 2: anmäld frånvaro (F1) — ska INTE få påminnelse
  INSERT INTO activity_sessions (plan_id, participant_id, date, start_time, end_time, title, activity_type, absence_reported_at, absence_reason)
  VALUES (v_plan, v_deltagare, CURRENT_DATE + 1, '13:00', '15:00', 'F3-provpass frånvaro', 'jobsearch', now(), 'sick')
  RETURNING id INTO v_pass_franvaro;
  -- Pass 3: redan markerat — ska INTE få påminnelse
  INSERT INTO activity_sessions (plan_id, participant_id, date, start_time, end_time, title, activity_type, attendance, marked_by, marked_at)
  VALUES (v_plan, v_deltagare, CURRENT_DATE + 1, '15:00', '16:00', 'F3-provpass markerat', 'jobsearch', 'present', (SELECT consultant_id FROM activity_plans WHERE id = v_plan), now())
  RETURNING id INTO v_pass_markerat;

  SELECT count(*) INTO v_k1 FROM public.skicka_passpaminnelser() WHERE utfall = 'skickad';
  SELECT * INTO v_notis FROM notifications WHERE user_id = v_deltagare AND type = 'aktivitet_paminnelse' AND data->>'session_id' = v_pass::text;
  SELECT count(*) INTO v_franvaro_notiser FROM notifications WHERE data->>'session_id' = v_pass_franvaro::text;
  SELECT count(*) INTO v_markerat_notiser FROM notifications WHERE data->>'session_id' = v_pass_markerat::text;
  SELECT count(*) INTO v_k2 FROM public.skicka_passpaminnelser() WHERE utfall = 'skickad';

  SELECT has_function_privilege('anon', 'public.skicka_passpaminnelser()', 'EXECUTE'),
         has_function_privilege('authenticated', 'public.skicka_passpaminnelser()', 'EXECUTE')
    INTO v_anon, v_auth;

  RAISE EXCEPTION 'PROV-RESULTAT: notiser före=% | körning1 skickade=% (väntat 1 + antalet riktiga pass i morgon i prod) | notis: title="%", action_url=%, plats=%, session_id stämmer=% | frånvaropass fick=% (väntat 0) | markerat pass fick=% (väntat 0) | körning2 skickade=% (väntat 0) | anon_exec=% auth_exec=% (väntat f/f)',
    v_fore, v_k1, v_notis.title, v_notis.action_url, v_notis.data->>'location', (v_notis.data->>'session_id' = v_pass::text),
    v_franvaro_notiser, v_markerat_notiser, v_k2, v_anon, v_auth;
END $$;

ROLLBACK;
