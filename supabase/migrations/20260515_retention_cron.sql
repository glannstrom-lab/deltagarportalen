-- Retention Policy — Automatisk gallring enligt GDPR Art 5.1.e
-- Skapad: 2026-05-15
-- Se docs/RETENTION-POLICY.md för fullständig motivering per datatyp.
--
-- KÖRS MANUELLT (kräver pg_cron extension som måste aktiveras separat i Supabase
-- dashboard: Database → Extensions → pg_cron).
--
-- För att verifiera att jobbet körs:
--   SELECT * FROM cron.job;
--   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- ============================================================================
-- 1. AI-loggar — 90 dagar
-- ============================================================================
-- ai_usage_logs sparas för säkerhets- och missbruksanalys. Efter 90 dagar har
-- värdet sjunkit kraftigt och retention bör vara så kort som möjligt.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'retention-ai-usage-logs') THEN
    PERFORM cron.schedule(
      'retention-ai-usage-logs',
      '0 4 * * *',  -- dagligen 04:00 UTC
      $job$
        DELETE FROM ai_usage_logs
        WHERE created_at < NOW() - INTERVAL '90 days';
      $job$
    );
  END IF;
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Tabell ai_usage_logs finns inte än — hoppa över';
END $$;

-- ============================================================================
-- 2. Inaktiva konton — varning vid 18 mån, radering vid 24 mån
-- ============================================================================
-- GDPR Art 5.1.e — storage limitation. Konton som inte använts på 24 månader
-- har förlorat sitt syfte och måste raderas (om inte juridisk grund för längre
-- lagring finns, t.ex. accountability av tidigare samtycke).

-- Steg A: Skapa email_queue om den inte finns (försiktigt)
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_queue_user_template ON email_queue(user_id, template);
CREATE INDEX IF NOT EXISTS idx_email_queue_pending ON email_queue(scheduled_at) WHERE sent_at IS NULL;

-- Steg B: Cron-job
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'retention-inactive-accounts') THEN
    PERFORM cron.schedule(
      'retention-inactive-accounts',
      '0 3 * * *',  -- dagligen 03:00 UTC
      $job$
        -- Steg 1: Skicka 18-månaders inaktivitetsvarning (en gång per användare)
        INSERT INTO email_queue (user_id, template, scheduled_at)
        SELECT u.id, 'inactivity_warning_18m', NOW()
        FROM auth.users u
        WHERE u.last_sign_in_at < NOW() - INTERVAL '18 months'
          AND u.last_sign_in_at > NOW() - INTERVAL '19 months'
          AND NOT EXISTS (
            SELECT 1 FROM email_queue eq
            WHERE eq.user_id = u.id AND eq.template = 'inactivity_warning_18m'
          );

        -- Steg 2: Radera 24-månaders inaktiva konton
        -- CASCADE rensar profiles + all relaterad data (RLS-policies hanterar)
        DELETE FROM auth.users
        WHERE last_sign_in_at < NOW() - INTERVAL '24 months';
      $job$
    );
  END IF;
END $$;

-- ============================================================================
-- 3. Audit-loggar — 5 år
-- ============================================================================
-- Accountability (Art 5.2) kräver bevis för samtycken under preskriptionsfristen.
-- Svensk skadeståndspreskription är 10 år men IMY-tillsynspreskription är 5 år.
-- Vi sparar 5 år, vilket räcker för IMY-utredningar.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'retention-audit-logs') THEN
    PERFORM cron.schedule(
      'retention-audit-logs',
      '0 5 * * 0',  -- söndagar 05:00 UTC
      $job$
        -- consent_history
        DELETE FROM consent_history
        WHERE created_at < NOW() - INTERVAL '5 years';

        -- data_sharing_audit
        DELETE FROM data_sharing_audit
        WHERE created_at < NOW() - INTERVAL '5 years';

        -- admin_audit_log
        DELETE FROM admin_audit_log
        WHERE created_at < NOW() - INTERVAL '5 years';

        -- email_queue (skickade emails efter 90 dagar)
        DELETE FROM email_queue
        WHERE sent_at IS NOT NULL AND sent_at < NOW() - INTERVAL '90 days';
      $job$
    );
  END IF;
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'En eller flera audit-tabeller saknas — granska SQL och kör manuellt vid behov';
END $$;

-- ============================================================================
-- 4. Account deletion grace period — efter 14 dagar
-- ============================================================================
-- account_deletion_requests har en 14-dagars grace period. Efter det körs
-- execute_account_deletion_immediate() automatiskt.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-deletion-requests') THEN
    PERFORM cron.schedule(
      'process-deletion-requests',
      '0 2 * * *',  -- dagligen 02:00 UTC
      $job$
        -- Kör schemalagda raderingar
        SELECT execute_account_deletion_immediate(adr.user_id)
        FROM account_deletion_requests adr
        WHERE adr.scheduled_deletion_at < NOW()
          AND adr.executed_at IS NULL
          AND adr.cancelled_at IS NULL;
      $job$
    );
  END IF;
EXCEPTION WHEN undefined_function THEN
  RAISE NOTICE 'Function execute_account_deletion_immediate saknas — verifiera delete_account-migration';
END $$;

-- ============================================================================
-- VERIFIERING
-- ============================================================================
-- Lista alla schemalagda jobb:
--   SELECT jobname, schedule, command FROM cron.job;
--
-- Avbryt ett jobb om något gick fel:
--   SELECT cron.unschedule('retention-ai-usage-logs');
--
-- Kör manuellt ett jobb för test:
--   SELECT cron.schedule('test-once', '* * * * *', 'SELECT 1;');
--   -- Vänta 1 minut, avregistrera
--   SELECT cron.unschedule('test-once');

COMMENT ON SCHEMA cron IS 'pg_cron: schemaläggning av retention-jobb enligt GDPR Art 5.1.e. Se docs/RETENTION-POLICY.md';
