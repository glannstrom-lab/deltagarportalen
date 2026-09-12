-- F3 Påminnelse kvällen innan ett pass (persona-genomgång 2026-09-12, förslag F3).
-- INTE KÖRD MOT PROD — väntar på Mikaels ja. Bevisad i rollback: e2e/f3-paminnelse-prov.sql.
--
-- Premiss mätt i prod 2026-09-13 (db query, inte migrationsfiler):
--   · notifications: id, user_id, type (text, ingen CHECK), title, message, read, read_at,
--     action_url, data jsonb, created_at. INSERT-policy: bara konsulent → deltagare för
--     aktivitet_plan/aktivitet_pass/aktivitet_franvaro. Deltagaren kan alltså inte få en
--     notis från "ingen" via klienten — samma skäl som F1: notisen skrivs i databasen.
--   · activity_sessions: date, start_time, end_time, title, location, participant_id,
--     plan_id, attendance, absence_reported_at (F1). 1 pass "i morgon" i prod vid mätningen.
--   · user_preferences.email_notifications (boolean) är huvudbrytaren för mejl
--     (minnet notisstacken: fail open — saknad rad = aldrig rört reglaget).
--   · pg_cron: 14 jobb. pg_net: AV — databasen kan inte anropa Resend själv, så mejlet
--     går via client/api/pass-paminnelse.js (Vercel-cron, kräver en rad i vercel.json).
--
-- Vad den här gör: en definer-funktion som lägger EN notis per pass i morgon till
-- deltagaren (typ aktivitet_paminnelse), idempotent via befintlig notis på samma
-- session_id — ingen ny kolumn på activity_sessions, det stör konsulentens flöde minst.
-- Passet hoppas över om det redan är markerat, om deltagaren anmält frånvaro (F1), eller
-- om det saknar deltagare. Cron 17:00 UTC = 19:00 svensk sommartid / 18:00 vintertid:
-- "kvällen innan" utan att träffa middagen, och tidigt nog för att mejlfunktionen
-- (Vercel-cron, föreslagen 17:30 UTC) ska hinna samma kväll. `current_date` i jobbet
-- är UTC-datum; klockan 17 UTC är det samma kalenderdag i Sverige, så date + 1 = i morgon.
--
-- action_url UTAN brädgård (HashRouter + navigate(), minnet notisstacken-och-lanskoderna).

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
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'pass-paminnelse') THEN
    PERFORM cron.schedule('pass-paminnelse', '0 17 * * *',
      $job$ SELECT * FROM public.skicka_passpaminnelser(); $job$);
  END IF;
END $$;
