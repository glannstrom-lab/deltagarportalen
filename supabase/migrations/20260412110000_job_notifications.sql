-- Migration: Create job_notifications table for email alerts
-- Date: 2026-04-12

-- ============================================
-- 1. JOB_NOTIFICATIONS TABLE
-- ============================================

-- Create job_notifications table
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

  -- Prevent duplicate notifications for same job
  UNIQUE(alert_id, job_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_notifications_user_id ON job_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_notifications_alert_id ON job_notifications(alert_id);
CREATE INDEX IF NOT EXISTS idx_job_notifications_read ON job_notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_job_notifications_created_at ON job_notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE job_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
  ON job_notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON job_notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- System can insert (via service role)
CREATE POLICY "Service role can insert notifications"
  ON job_notifications FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 2. ADD EMAIL PREFERENCES TO USER_PREFERENCES
-- ============================================

-- Add job alert email columns to user_preferences
DO $$
BEGIN
  -- Add job_alert_email_enabled if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'user_preferences' AND column_name = 'job_alert_email_enabled') THEN
    ALTER TABLE user_preferences ADD COLUMN job_alert_email_enabled BOOLEAN DEFAULT true;
  END IF;

  -- Add job_alert_frequency if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'user_preferences' AND column_name = 'job_alert_frequency') THEN
    ALTER TABLE user_preferences ADD COLUMN job_alert_frequency TEXT DEFAULT 'daily' CHECK (job_alert_frequency IN ('instant', 'daily', 'weekly', 'none'));
  END IF;
END $$;

-- ============================================
-- 3. EMAIL_LOGS TABLE (for tracking sent emails)
-- ============================================

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL, -- 'job_alert', 'daily_digest', 'weekly_digest'
  subject TEXT NOT NULL,
  job_count INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(email_type);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own email logs"
  ON email_logs FOR SELECT
  USING (user_id = auth.uid());

-- Service role can insert
CREATE POLICY "Service role can insert email logs"
  ON email_logs FOR INSERT
  WITH CHECK (true);

-- Service role can update
CREATE POLICY "Service role can update email logs"
  ON email_logs FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 4. VERIFICATION
-- ============================================

SELECT 'job_notifications table created successfully' AS status
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_notifications');

SELECT 'email_logs table created successfully' AS status
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_logs');
