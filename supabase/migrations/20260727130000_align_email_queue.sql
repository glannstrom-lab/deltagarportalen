-- =============================================================================
-- Rättelse: email_queue till kanonisk form  (ROADMAP H6)
-- Datum: 2026-07-27
-- =============================================================================
--
-- `20260727120000_fix_schema_drift.sql` skapade email_queue med en form jag
-- hittade på (recipient/subject/body/payload/status/attempts/scheduled_for).
-- Den kanoniska formen står i `20260515_retention_cron.sql` — den migration
-- som PRODUCERAR raderna via cron — och den använder `user_id` + `template` +
-- `scheduled_at`. Konsumenten (`supabase/functions/send-inactivity-warning`)
-- läser `id, user_id, scheduled_at` och filtrerar på `template` och `sent_at`.
--
-- Lärdomen: jag härledde formen ur namnet i stället för ur producenten och
-- konsumenten. Schemadriftgrinden fångade det direkt — kolumnkontrollen
-- flaggade `email_queue.user_id` och `email_queue.scheduled_at` som saknade.
--
-- SÄKERHET: tabellen skapades för några minuter sedan i samma session, är tom
-- och har aldrig haft en läsare. DO-blocket vägrar köra om den innehåller
-- rader, så migrationen kan inte förstöra data om förutsättningen ändrats.
-- =============================================================================

DO $$
DECLARE
  row_count BIGINT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'email_queue'
  ) THEN
    RAISE NOTICE 'email_queue finns inte — inget att rätta.';
    RETURN;
  END IF;

  EXECUTE 'SELECT count(*) FROM email_queue' INTO row_count;

  IF row_count > 0 THEN
    RAISE EXCEPTION 'email_queue innehåller % rader — vägrar skapa om. Migrera manuellt.', row_count;
  END IF;

  DROP TABLE email_queue;

  CREATE TABLE email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    template TEXT NOT NULL,
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX idx_email_queue_user_template ON email_queue(user_id, template);
  CREATE INDEX idx_email_queue_pending ON email_queue(scheduled_at) WHERE sent_at IS NULL;

  -- Service-role-only: RLS på utan policyer, inga rättigheter till anon/authenticated.
  -- Kön fylls av cron (A6) och läses av edge-funktionen — båda med service role.
  ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
  REVOKE ALL ON email_queue FROM anon, authenticated;

  RAISE NOTICE 'email_queue skapad om i kanonisk form.';
END $$;

SELECT string_agg(column_name, ', ' ORDER BY column_name) AS email_queue_kolumner
FROM information_schema.columns
WHERE table_name = 'email_queue';
