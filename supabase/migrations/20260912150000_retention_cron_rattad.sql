-- Retention: gallringsjobben på riktigt (A6, beslut Mikael 2026-09-12 "slå på nu")
--
-- Ersätter körningen av 20260515_retention_cron.sql, som aldrig kördes (pg_cron var
-- inte aktiverat förrän 2026-09-12) och som har två fel som en torrkörning mot prod
-- avslöjade innan något schemalades:
--
--   1. Jobb 4 anropade execute_account_deletion_immediate(uuid). Funktionen tar inga
--      argument och läser auth.uid(), som är NULL under cron — jobbet hade fallit
--      varje natt. En raderingsbegäran (testkonto, förfallen 2026-08-06) låg och
--      väntade i fem veckor utan att något hände.
--   2. Jobb 2 raderade auth.users rakt av. Nio FK:er till profiles saknar CASCADE
--      (audit_logs.user_id NO ACTION, sta_enrollments.consultant_id RESTRICT, m.fl.):
--      första kontot med en auditrad hade avbrutit hela jobbet, utan auditspår.
--
-- Nu: två SECURITY DEFINER-funktioner utan argument som cron anropar. Per konto:
-- auditrad i admin_audit_log FÖRE raderingen, audit_logs.user_id nullas
-- (pseudonymisering — raden är själv en auditpost och ska finnas kvar), sedan
-- DELETE FROM auth.users (CASCADE tar profiles och allt under). Ett konto som ändå
-- blockeras loggas med felet och hoppas över; nästa konto körs.
--
-- Torrkörning 2026-09-12 (SELECT count(*) med exakt jobbens villkor):
--   ai_usage_logs äldre än 90 d: 25 av 159 · konton inaktiva >24 mån: 0 (äldsta
--   inloggning 2026-02-23) · varning 18–19 mån: 0 · audit >5 år: 0 · förfallna
--   raderingsbegäranden: 1 (testkonto).
--
-- Verifierat i prod 2026-09-12 14:10 UTC: manuell körning av
-- execute_scheduled_account_deletions() raderade det förfallna testkontot; auditraden
-- ACCOUNT_DELETION/deletion_request_grace_expired finns. OBS: account_deletion_requests
-- har CASCADE från auth.users, så begäran-raden försvinner med kontot — auditraden
-- (med request_id) är spåret, inte executed_at.
--
-- Körs manuellt: npx supabase db query --linked -f <denna fil>
-- Efteråt: cd client && npm run grants:refresh (funktionerna är definer utan EXECUTE
-- för anon/authenticated — lint:grants ska se dem som stängda).

-- ============================================================================
-- Funktion: förfallna raderingsbegäranden (grace period 14 dagar)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.execute_scheduled_account_deletions()
RETURNS TABLE (user_id uuid, utfall text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  r RECORD;
  v_email text;
BEGIN
  FOR r IN
    SELECT adr.id, adr.user_id
    FROM account_deletion_requests adr
    WHERE adr.scheduled_deletion_at < NOW()
      AND adr.executed_at IS NULL
      AND adr.cancelled_at IS NULL
  LOOP
    BEGIN
      SELECT p.email INTO v_email FROM profiles p WHERE p.id = r.user_id;

      INSERT INTO admin_audit_log (admin_id, action, target_table, target_id, old_value)
      VALUES (NULL, 'ACCOUNT_DELETION', 'profiles', r.user_id,
              jsonb_build_object('email', v_email, 'deleted_by', 'retention_cron',
                                 'reason', 'deletion_request_grace_expired',
                                 'request_id', r.id));

      UPDATE audit_logs SET user_id = NULL WHERE audit_logs.user_id = r.user_id;

      UPDATE account_deletion_requests
      SET executed_at = NOW(), executed_by = 'retention_cron'
      WHERE id = r.id;

      DELETE FROM auth.users u WHERE u.id = r.user_id;

      user_id := r.user_id; utfall := 'raderad'; RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      -- Kontot står kvar; felet syns i auditloggen och i nästa körning igen.
      INSERT INTO admin_audit_log (admin_id, action, target_table, target_id, new_value)
      VALUES (NULL, 'ACCOUNT_DELETION_FAILED', 'profiles', r.user_id,
              jsonb_build_object('deleted_by', 'retention_cron', 'error', SQLERRM));
      user_id := r.user_id; utfall := 'misslyckades: ' || SQLERRM; RETURN NEXT;
    END;
  END LOOP;
  RETURN;
END;
$$;

-- ============================================================================
-- Funktion: inaktiva konton — varning vid 18 mån, radering vid 24 mån
-- ============================================================================
CREATE OR REPLACE FUNCTION public.execute_inactive_account_retention()
RETURNS TABLE (user_id uuid, utfall text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  r RECORD;
  v_email text;
BEGIN
  -- Steg 1: 18-månadersvarning, en gång per konto (konsumeras av
  -- send-inactivity-warning, som läser email_queue).
  INSERT INTO email_queue (user_id, template, scheduled_at)
  SELECT u.id, 'inactivity_warning_18m', NOW()
  FROM auth.users u
  WHERE u.last_sign_in_at < NOW() - INTERVAL '18 months'
    AND u.last_sign_in_at > NOW() - INTERVAL '19 months'
    AND NOT EXISTS (
      SELECT 1 FROM email_queue eq
      WHERE eq.user_id = u.id AND eq.template = 'inactivity_warning_18m'
    );

  -- Steg 2: radering vid 24 månader, per konto med auditrad.
  -- Konton som aldrig loggat in (last_sign_in_at IS NULL) rörs inte här —
  -- de är inbjudningar som inte fullföljts och har en egen livscykel.
  FOR r IN
    SELECT u.id FROM auth.users u
    WHERE u.last_sign_in_at < NOW() - INTERVAL '24 months'
  LOOP
    BEGIN
      SELECT p.email INTO v_email FROM profiles p WHERE p.id = r.id;

      INSERT INTO admin_audit_log (admin_id, action, target_table, target_id, old_value)
      VALUES (NULL, 'ACCOUNT_DELETION', 'profiles', r.id,
              jsonb_build_object('email', v_email, 'deleted_by', 'retention_cron',
                                 'reason', 'inactive_24_months'));

      UPDATE audit_logs SET user_id = NULL WHERE audit_logs.user_id = r.id;

      DELETE FROM auth.users u WHERE u.id = r.id;

      user_id := r.id; utfall := 'raderad'; RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO admin_audit_log (admin_id, action, target_table, target_id, new_value)
      VALUES (NULL, 'ACCOUNT_DELETION_FAILED', 'profiles', r.id,
              jsonb_build_object('deleted_by', 'retention_cron', 'error', SQLERRM));
      user_id := r.id; utfall := 'misslyckades: ' || SQLERRM; RETURN NEXT;
    END;
  END LOOP;
  RETURN;
END;
$$;

-- Bara cron (postgres) får köra dem. Postgres ger EXECUTE till PUBLIC som default —
-- REVOKE FROM PUBLIC är det som faktiskt stänger (lärdom 2026-08-04).
REVOKE ALL ON FUNCTION public.execute_scheduled_account_deletions() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.execute_inactive_account_retention() FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- Schemaläggning (idempotent: hoppar över jobb som redan finns)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'retention-ai-usage-logs') THEN
    PERFORM cron.schedule('retention-ai-usage-logs', '0 4 * * *',
      $job$ DELETE FROM public.ai_usage_logs WHERE created_at < NOW() - INTERVAL '90 days'; $job$);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'retention-inactive-accounts') THEN
    PERFORM cron.schedule('retention-inactive-accounts', '0 3 * * *',
      $job$ SELECT * FROM public.execute_inactive_account_retention(); $job$);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'retention-audit-logs') THEN
    PERFORM cron.schedule('retention-audit-logs', '0 5 * * 0',
      $job$
        DELETE FROM public.consent_history    WHERE created_at < NOW() - INTERVAL '5 years';
        DELETE FROM public.data_sharing_audit WHERE created_at < NOW() - INTERVAL '5 years';
        DELETE FROM public.admin_audit_log    WHERE created_at < NOW() - INTERVAL '5 years';
        DELETE FROM public.email_queue        WHERE sent_at IS NOT NULL AND sent_at < NOW() - INTERVAL '90 days';
      $job$);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-deletion-requests') THEN
    PERFORM cron.schedule('process-deletion-requests', '0 2 * * *',
      $job$ SELECT * FROM public.execute_scheduled_account_deletions(); $job$);
  END IF;
END $$;

-- (Ingen COMMENT ON SCHEMA cron: schemat ägs av supabase_admin, inte postgres — 42501.
--  Originalmigrationen hade den raden; den hade fällt hela körningen.)
