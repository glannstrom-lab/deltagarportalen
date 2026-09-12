-- Retention: de nio lagringstider Mikael bekräftade 2026-09-12 (beslut "b":
-- alla som föreslagna, journalen 5 år efter avslutat uppdrag). Bygger på
-- 20260912150000_retention_cron_rattad.sql (pg_cron på, fyra jobb finns).
--
-- Premissgranskat mot prod 2026-09-12: alla tabellerna finns (inga fantomer —
-- user_activity_log, user_activities, email_notifications, login_attempts är riktiga).
-- Tidskolumnerna som jobben räknar från, och varför:
--   job_notifications.created_at · email_notifications.created_at ·
--   login_attempts.attempted_at · user_activity_log/user_activities.created_at ·
--   invitations.expires_at (policyn: "90 dagar efter utgång", oavsett använd) ·
--   consultant_messages.created_at ·
--   consultant_placements.start_date (tabellen har inget slutdatum; 2 år från start
--     täcker 3/6-månadersuppföljningarna) ·
--   consultant_work_placements.end_date — FAIL CLOSED: NULL = pågår, raderas aldrig;
--     followups cascadar (FK ON DELETE CASCADE) ·
--   sta_enrollments: det finns INGEN slutdatumkolumn. Avslutad = status IN
--     ('completed','cancelled'); updated_at sätts vid statusbytet (revoke_consultant_link
--     gör exakt det) och är därför slutdatumet. status 'active'/'paused' raderas aldrig.
--     Nio av tio sta_*-tabeller cascadar från sta_enrollments; sta_workplace_followups
--     via sta_workplaces. ·
--   consultant_journal/consultant_notes: "avslutat uppdrag" har ingen egen kolumn —
--     consultant_participants-raden RADERAS vid uppsägning/överlämning, och
--     consultant_consents.revoked_at sätts. Regeln: deltagaren har ingen aktiv koppling
--     alls (ingen rad i consultant_participants, profiles.consultant_id NULL), senaste
--     återkallade samtycke är äldre än 5 år, och inget samtycke har getts efter det.
--     Saknas samtyckesrad raderas ingenting (fail closed). Efter en överlämning (KS2 b)
--     har deltagaren fortfarande en aktiv koppling → inget raderas.
--
-- TORRKÖRNING 2026-09-12 (SELECT count(*) med exakt jobbens villkor, "raderas av totalt"):
--   job_notifications >90 d: 0 av 0 · email_notifications >90 d: 0 av 0 ·
--   login_attempts >30 d: 0 av 0 · user_activity_log >12 mån: 0 av 864 ·
--   user_activities >12 mån: 0 av 0 · invitations utgångna >90 d: 20 av 20 (19 använda
--   + 1 oanvänd; alla från KM-piloten/testerna, 7 dagars giltighet) ·
--   consultant_messages >2 år: 0 av 2 · consultant_placements >2 år: 0 av 0 ·
--   consultant_work_placements avslutade >2 år: 0 av 0 · sta_enrollments avslutade
--   >2 år: 0 av 31 (alla 'active') · journal/notes: 0 av 0 (20 samtycken, 0 återkallade).
--
-- Körs manuellt: npx supabase db query --linked -f <denna fil>
-- Efteråt: cd client && npm run grants:refresh (ny definer-funktion, stängd för
-- anon/authenticated).

-- ============================================================================
-- Funktion: konsulentjournal 5 år efter avslutat uppdrag (per deltagare, med audit)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.execute_consultant_journal_retention()
RETURNS TABLE (participant_id uuid, journal_rader int, notes_rader int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_j int;
  v_n int;
BEGIN
  FOR r IN
    SELECT p.id AS pid, MAX(cc.revoked_at) AS avslutat
    FROM profiles p
    JOIN consultant_consents cc ON cc.participant_id = p.id
    WHERE p.consultant_id IS NULL
      AND NOT EXISTS (SELECT 1 FROM consultant_participants cp WHERE cp.participant_id = p.id)
      AND (EXISTS (SELECT 1 FROM consultant_journal j WHERE j.participant_id = p.id)
        OR EXISTS (SELECT 1 FROM consultant_notes n WHERE n.participant_id = p.id))
    GROUP BY p.id
    HAVING MAX(cc.revoked_at) IS NOT NULL
       AND MAX(cc.revoked_at) < NOW() - INTERVAL '5 years'
       AND MAX(cc.granted_at) <= MAX(cc.revoked_at)
  LOOP
    DELETE FROM consultant_journal j WHERE j.participant_id = r.pid;
    GET DIAGNOSTICS v_j = ROW_COUNT;
    DELETE FROM consultant_notes n WHERE n.participant_id = r.pid;
    GET DIAGNOSTICS v_n = ROW_COUNT;

    INSERT INTO admin_audit_log (admin_id, action, target_table, target_id, old_value)
    VALUES (NULL, 'RETENTION_JOURNAL_DELETED', 'consultant_journal', r.pid,
            jsonb_build_object('deleted_by', 'retention_cron', 'ended_at', r.avslutat,
                               'journal_rows', v_j, 'notes_rows', v_n));

    participant_id := r.pid; journal_rader := v_j; notes_rader := v_n; RETURN NEXT;
  END LOOP;
  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.execute_consultant_journal_retention() FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- Schemaläggning (idempotent). Tiderna ligger spridda efter 04:00-jobbet.
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'retention-job-notifications') THEN
    PERFORM cron.schedule('retention-job-notifications', '10 4 * * *',
      $job$ DELETE FROM public.job_notifications WHERE created_at < NOW() - INTERVAL '90 days'; $job$);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'retention-email-notifications') THEN
    PERFORM cron.schedule('retention-email-notifications', '15 4 * * *',
      $job$ DELETE FROM public.email_notifications WHERE created_at < NOW() - INTERVAL '90 days'; $job$);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'retention-login-attempts') THEN
    PERFORM cron.schedule('retention-login-attempts', '20 4 * * *',
      $job$ DELETE FROM public.login_attempts WHERE attempted_at < NOW() - INTERVAL '30 days'; $job$);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'retention-activity-logs') THEN
    PERFORM cron.schedule('retention-activity-logs', '25 4 * * *',
      $job$
        DELETE FROM public.user_activity_log WHERE created_at < NOW() - INTERVAL '12 months';
        DELETE FROM public.user_activities   WHERE created_at < NOW() - INTERVAL '12 months';
      $job$);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'retention-invitations') THEN
    PERFORM cron.schedule('retention-invitations', '30 4 * * *',
      $job$ DELETE FROM public.invitations WHERE expires_at < NOW() - INTERVAL '90 days'; $job$);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'retention-consultant-messages') THEN
    PERFORM cron.schedule('retention-consultant-messages', '35 4 * * *',
      $job$ DELETE FROM public.consultant_messages WHERE created_at < NOW() - INTERVAL '2 years'; $job$);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'retention-placements') THEN
    PERFORM cron.schedule('retention-placements', '40 4 * * *',
      $job$
        DELETE FROM public.consultant_placements
          WHERE start_date < NOW() - INTERVAL '2 years';
        DELETE FROM public.consultant_work_placements
          WHERE end_date IS NOT NULL AND end_date < NOW() - INTERVAL '2 years';
      $job$);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'retention-consultant-journal') THEN
    PERFORM cron.schedule('retention-consultant-journal', '45 4 * * *',
      $job$ SELECT * FROM public.execute_consultant_journal_retention(); $job$);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'retention-sta') THEN
    PERFORM cron.schedule('retention-sta', '10 5 * * *',
      $job$
        DELETE FROM public.sta_enrollments
          WHERE status IN ('completed', 'cancelled')
            AND updated_at < NOW() - INTERVAL '2 years';
      $job$);
  END IF;
END $$;
