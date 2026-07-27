-- =============================================================================
-- Schemadrift: skapa det som koden redan förutsätter  (ROADMAP H1/H2/H6)
-- Datum: 2026-07-27
-- =============================================================================
--
-- Granskningen 2026-07-27 jämförde koden mot prod-schemat i stället för mot
-- migrationsfilerna och hittade 11 tabeller + ett antal kolumner som koden
-- läser/skriver men som inte finns. Rotorsaken: migrationsrutinen är manuell
-- (`db query --linked`, se CLAUDE.md) och tre migrationsfiler kördes aldrig.
--
-- Den här filen skapar ENBART det som en levande kodväg faktiskt behöver.
-- Allt är additivt — inga DROP, inga ändrade typer, inga borttagna policyer.
-- Fantomreferenser som hörde till dödkod hanteras genom att koden raderas
-- (H5), inte genom att skapa tabeller åt den.
--
-- Körs med:
--   npx supabase db query --linked -f supabase/migrations/20260727120000_fix_schema_drift.sql
-- Kör därefter:
--   node client/scripts/refresh-schema-snapshot.cjs
-- och committa snapshoten i samma commit.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. job_notifications  (H2)
-- -----------------------------------------------------------------------------
-- DDL:en kommer från `20260412110000_job_notifications.sql` som skrevs
-- 2026-04-12 men aldrig kördes. `jobAlertEmailService` har fem läs/skriv mot
-- tabellen och `client/api/job-alerts.js` upsertar i den — jobbevakningen har
-- därför varit ur funktion sedan dess. `email_logs` ur originalfilen skapas
-- INTE: ingen kod refererar den (koden loggar till email_notifications nedan).
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS job_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES job_alerts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL,
  job_title TEXT NOT NULL,
  employer TEXT NOT NULL,
  location TEXT,
  publication_date TIMESTAMPTZ,
  read BOOLEAN DEFAULT false,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(alert_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_job_notifications_user_id ON job_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_notifications_alert_id ON job_notifications(alert_id);
CREATE INDEX IF NOT EXISTS idx_job_notifications_unread ON job_notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_job_notifications_created_at ON job_notifications(created_at DESC);

ALTER TABLE job_notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_notifications' AND policyname = 'Users can view their own notifications') THEN
    CREATE POLICY "Users can view their own notifications"
      ON job_notifications FOR SELECT USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_notifications' AND policyname = 'Users can update their own notifications') THEN
    CREATE POLICY "Users can update their own notifications"
      ON job_notifications FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_notifications' AND policyname = 'Users can delete their own notifications') THEN
    CREATE POLICY "Users can delete their own notifications"
      ON job_notifications FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

-- Originalfilen hade en INSERT-policy med `WITH CHECK (true)`, vilket hade
-- låtit vilken inloggad användare som helst skapa aviseringar åt någon annan.
-- Aviseringar skapas av cron-jobbet med service role, som ändå går förbi RLS —
-- alltså ingen INSERT-policy alls, och inga rättigheter till anon.
REVOKE ALL ON job_notifications FROM anon;


-- -----------------------------------------------------------------------------
-- 2. user_preferences: jobbaviseringsinställningar  (H2)
-- -----------------------------------------------------------------------------
-- `jobAlertEmailService.getNotificationPreferences/updateNotificationPreferences`
-- läser och skriver de här två kolumnerna. De saknades, så inställningen
-- kunde aldrig sparas — och `AlertsTab` kastade returvärdet, så modalen
-- stängdes som om det gått bra (falsk framgång).
-- -----------------------------------------------------------------------------

ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS job_alert_email_enabled BOOLEAN DEFAULT true;

ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS job_alert_frequency TEXT DEFAULT 'daily';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_preferences_job_alert_frequency_check'
  ) THEN
    ALTER TABLE user_preferences
      ADD CONSTRAINT user_preferences_job_alert_frequency_check
      CHECK (job_alert_frequency IN ('instant', 'daily', 'weekly', 'none'));
  END IF;
END $$;


-- -----------------------------------------------------------------------------
-- 3. user_preferences.integration_checklist  (H1-fynd)
-- -----------------------------------------------------------------------------
-- `integrationChecklistApi` (live — pages/international/IntegrationTab) läser
-- och upsertar den här kolumnen. Utan den föll allt tillbaka på localStorage:
-- checklistan fungerade på en enhet men syncade aldrig, och en deltagare som
-- bytte enhet tappade sina framsteg utan att få veta det.
-- -----------------------------------------------------------------------------

ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS integration_checklist JSONB;


-- -----------------------------------------------------------------------------
-- 4. email_notifications  (H2)
-- -----------------------------------------------------------------------------
-- `client/api/job-alerts.js` loggar varje utskick här (leveransspårning +
-- fallback-kö). Kolumnnamnen följer koden, inte den aldrig körda
-- `email_logs`-tabellen som hade en helt annan form.
--
-- OBS: tabellen innehåller mottagaradresser och mejltexter = persondata, men
-- har ingen user_id och kan därför inte scopas per användare. Den är
-- avsiktligt SERVICE-ROLE-ONLY: RLS på utan en enda policy innebär att varken
-- anon eller authenticated kommer åt något (service role går förbi RLS).
-- Ska tas upp i retention-arbetet (H7) — utskickslogg ska gallras.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_notifications_created_at ON email_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status);

ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON email_notifications FROM anon, authenticated;


-- -----------------------------------------------------------------------------
-- 5. email_queue  (H6)
-- -----------------------------------------------------------------------------
-- Definierad i `20260515_retention_cron.sql` som aldrig kördes (= A6).
-- `supabase/functions/send-inactivity-warning` köar mejl här. Tabellen skapas
-- nu så driften mot koden är noll; SCHEMALÄGGNINGEN (pg_cron) återstår som
-- Mikaels åtgärd i A6 — utan den körs varken gallring eller inaktivitetsmejl.
-- Samma service-role-only-resonemang som email_notifications ovan.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  template TEXT,
  payload JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON email_queue(created_at DESC);

ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON email_queue FROM anon, authenticated;


-- -----------------------------------------------------------------------------
-- 6. Verifiering
-- -----------------------------------------------------------------------------

SELECT
  (SELECT count(*) FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('job_notifications', 'email_notifications', 'email_queue')) AS nya_tabeller,
  (SELECT count(*) FROM information_schema.columns
    WHERE table_name = 'user_preferences'
      AND column_name IN ('job_alert_email_enabled', 'job_alert_frequency', 'integration_checklist')) AS nya_kolumner;
