-- ============================================
-- Migration: Enhanced Applications Tracking System
-- Date: 2026-04-08
-- Description: Extends saved_jobs and creates supporting tables
-- for comprehensive job application tracking
-- ============================================

-- ============================================
-- 1. EXTEND SAVED_JOBS TABLE
-- ============================================

-- Add new columns for enhanced tracking
ALTER TABLE saved_jobs ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'job_search';
ALTER TABLE saved_jobs ADD COLUMN IF NOT EXISTS application_method TEXT;
ALTER TABLE saved_jobs ADD COLUMN IF NOT EXISTS cv_version_id UUID;
ALTER TABLE saved_jobs ADD COLUMN IF NOT EXISTS cover_letter_id UUID;
ALTER TABLE saved_jobs ADD COLUMN IF NOT EXISTS salary_info JSONB DEFAULT '{}'::jsonb;
ALTER TABLE saved_jobs ADD COLUMN IF NOT EXISTS offer_deadline TIMESTAMPTZ;
ALTER TABLE saved_jobs ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE saved_jobs ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE saved_jobs ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE saved_jobs ADD COLUMN IF NOT EXISTS job_url TEXT;
ALTER TABLE saved_jobs ADD COLUMN IF NOT EXISTS location TEXT;

-- Update existing status constraint to include all new statuses
-- First, update any existing status values to uppercase if needed
UPDATE saved_jobs SET status = UPPER(status) WHERE status != UPPER(status);

-- Drop old constraint if exists and add new one with all statuses
DO $$
BEGIN
  -- Try to drop the existing constraint
  BEGIN
    ALTER TABLE saved_jobs DROP CONSTRAINT IF EXISTS saved_jobs_status_check;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore if doesn't exist
  END;

  -- Add new constraint with all status values
  ALTER TABLE saved_jobs ADD CONSTRAINT saved_jobs_status_check
    CHECK (status IS NULL OR status IN (
      'INTERESTED', 'SAVED', 'APPLIED', 'SCREENING',
      'PHONE', 'INTERVIEW', 'ASSESSMENT', 'OFFER',
      'ACCEPTED', 'REJECTED', 'WITHDRAWN'
    ));
EXCEPTION WHEN OTHERS THEN
  -- If constraint already exists with different definition, that's ok
  RAISE NOTICE 'Could not update status constraint: %', SQLERRM;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN saved_jobs.source IS 'Where the job came from: job_search, job_alert, manual, import';
COMMENT ON COLUMN saved_jobs.application_method IS 'How application was submitted: email, portal, linkedin, referral, other';
COMMENT ON COLUMN saved_jobs.cv_version_id IS 'Reference to CV version used for this application';
COMMENT ON COLUMN saved_jobs.cover_letter_id IS 'Reference to cover letter used for this application';
COMMENT ON COLUMN saved_jobs.salary_info IS 'JSON with offered, currency, negotiated fields';
COMMENT ON COLUMN saved_jobs.offer_deadline IS 'Deadline to respond to job offer';
COMMENT ON COLUMN saved_jobs.archived_at IS 'When application was archived (null = active)';

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_saved_jobs_source ON saved_jobs(user_id, source);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_archived ON saved_jobs(user_id, archived_at) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_saved_jobs_cv_version ON saved_jobs(cv_version_id) WHERE cv_version_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_saved_jobs_cover_letter ON saved_jobs(cover_letter_id) WHERE cover_letter_id IS NOT NULL;

-- ============================================
-- 2. CREATE APPLICATION_HISTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS application_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES saved_jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'status_change', 'note_added', 'note_updated', 'document_attached',
    'reminder_set', 'reminder_completed', 'contact_added', 'contact_updated',
    'interview_scheduled', 'offer_received', 'created', 'archived'
  )),
  old_value TEXT,
  new_value TEXT,
  note TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for application_history
CREATE INDEX IF NOT EXISTS idx_application_history_app ON application_history(application_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_application_history_user ON application_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_application_history_type ON application_history(event_type);

-- Enable RLS
ALTER TABLE application_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for application_history
DROP POLICY IF EXISTS "Users can view own application history" ON application_history;
CREATE POLICY "Users can view own application history" ON application_history
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own application history" ON application_history;
CREATE POLICY "Users can insert own application history" ON application_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. CREATE APPLICATION_CONTACTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS application_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES saved_jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  notes TEXT,
  is_primary BOOLEAN DEFAULT false,
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for application_contacts
CREATE INDEX IF NOT EXISTS idx_application_contacts_app ON application_contacts(application_id);
CREATE INDEX IF NOT EXISTS idx_application_contacts_user ON application_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_application_contacts_primary ON application_contacts(application_id) WHERE is_primary = true;

-- Enable RLS
ALTER TABLE application_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for application_contacts
DROP POLICY IF EXISTS "Users can CRUD own application contacts" ON application_contacts;
CREATE POLICY "Users can CRUD own application contacts" ON application_contacts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. CREATE APPLICATION_REMINDERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS application_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES saved_jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN (
    'follow_up', 'interview', 'deadline', 'phone_screen', 'assessment', 'custom'
  )),
  reminder_date DATE NOT NULL,
  reminder_time TIME,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for application_reminders
CREATE INDEX IF NOT EXISTS idx_application_reminders_app ON application_reminders(application_id);
CREATE INDEX IF NOT EXISTS idx_application_reminders_user_date ON application_reminders(user_id, reminder_date) WHERE is_completed = false;
CREATE INDEX IF NOT EXISTS idx_application_reminders_upcoming ON application_reminders(reminder_date, reminder_time) WHERE is_completed = false;

-- Enable RLS
ALTER TABLE application_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for application_reminders
DROP POLICY IF EXISTS "Users can CRUD own application reminders" ON application_reminders;
CREATE POLICY "Users can CRUD own application reminders" ON application_reminders
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 5. CREATE TRIGGERS FOR AUTOMATIC HISTORY LOGGING
-- ============================================

-- Function to log status changes automatically
CREATE OR REPLACE FUNCTION log_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO application_history (
      application_id, user_id, event_type, old_value, new_value, metadata
    ) VALUES (
      NEW.id,
      NEW.user_id,
      'status_change',
      OLD.status,
      NEW.status,
      jsonb_build_object(
        'changed_at', NOW(),
        'previous_updated_at', OLD.updated_at
      )
    );
  END IF;

  -- Log note changes
  IF OLD.notes IS DISTINCT FROM NEW.notes AND NEW.notes IS NOT NULL THEN
    INSERT INTO application_history (
      application_id, user_id, event_type, old_value, new_value
    ) VALUES (
      NEW.id,
      NEW.user_id,
      CASE WHEN OLD.notes IS NULL THEN 'note_added' ELSE 'note_updated' END,
      LEFT(OLD.notes, 200),
      LEFT(NEW.notes, 200)
    );
  END IF;

  -- Log archive
  IF OLD.archived_at IS NULL AND NEW.archived_at IS NOT NULL THEN
    INSERT INTO application_history (
      application_id, user_id, event_type, new_value
    ) VALUES (
      NEW.id,
      NEW.user_id,
      'archived',
      NEW.archived_at::TEXT
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS saved_jobs_history_trigger ON saved_jobs;
CREATE TRIGGER saved_jobs_history_trigger
  AFTER UPDATE ON saved_jobs
  FOR EACH ROW
  EXECUTE FUNCTION log_application_status_change();

-- Function to log new application creation
CREATE OR REPLACE FUNCTION log_application_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO application_history (
    application_id, user_id, event_type, new_value, metadata
  ) VALUES (
    NEW.id,
    NEW.user_id,
    'created',
    NEW.status,
    jsonb_build_object(
      'source', NEW.source,
      'job_id', NEW.job_id
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new applications
DROP TRIGGER IF EXISTS saved_jobs_created_trigger ON saved_jobs;
CREATE TRIGGER saved_jobs_created_trigger
  AFTER INSERT ON saved_jobs
  FOR EACH ROW
  EXECUTE FUNCTION log_application_created();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_application_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for contacts updated_at
DROP TRIGGER IF EXISTS application_contacts_updated_at_trigger ON application_contacts;
CREATE TRIGGER application_contacts_updated_at_trigger
  BEFORE UPDATE ON application_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_application_contacts_updated_at();

-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

-- Function to get application statistics for a user
CREATE OR REPLACE FUNCTION get_application_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'interested', COUNT(*) FILTER (WHERE status = 'INTERESTED'),
    'saved', COUNT(*) FILTER (WHERE status = 'SAVED'),
    'applied', COUNT(*) FILTER (WHERE status = 'APPLIED'),
    'screening', COUNT(*) FILTER (WHERE status = 'SCREENING'),
    'phone', COUNT(*) FILTER (WHERE status = 'PHONE'),
    'interview', COUNT(*) FILTER (WHERE status = 'INTERVIEW'),
    'assessment', COUNT(*) FILTER (WHERE status = 'ASSESSMENT'),
    'offer', COUNT(*) FILTER (WHERE status = 'OFFER'),
    'accepted', COUNT(*) FILTER (WHERE status = 'ACCEPTED'),
    'rejected', COUNT(*) FILTER (WHERE status = 'REJECTED'),
    'withdrawn', COUNT(*) FILTER (WHERE status = 'WITHDRAWN'),
    'active', COUNT(*) FILTER (WHERE archived_at IS NULL AND status NOT IN ('ACCEPTED', 'REJECTED', 'WITHDRAWN')),
    'this_week', COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days'),
    'this_month', COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')
  ) INTO result
  FROM saved_jobs
  WHERE user_id = p_user_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get upcoming reminders
CREATE OR REPLACE FUNCTION get_upcoming_reminders(p_user_id UUID, p_days INTEGER DEFAULT 7)
RETURNS SETOF application_reminders AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM application_reminders
  WHERE user_id = p_user_id
    AND is_completed = false
    AND reminder_date <= CURRENT_DATE + p_days
  ORDER BY reminder_date, reminder_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get applications needing follow-up (no status change in X days)
CREATE OR REPLACE FUNCTION get_stale_applications(p_user_id UUID, p_days INTEGER DEFAULT 7)
RETURNS TABLE (
  application_id UUID,
  job_title TEXT,
  company_name TEXT,
  status TEXT,
  days_since_update INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    COALESCE(s.job_title, s.job_data->>'headline')::TEXT,
    COALESCE(s.company_name, s.job_data->'employer'->>'name')::TEXT,
    s.status,
    EXTRACT(DAY FROM NOW() - s.updated_at)::INTEGER
  FROM saved_jobs s
  WHERE s.user_id = p_user_id
    AND s.archived_at IS NULL
    AND s.status IN ('APPLIED', 'SCREENING', 'PHONE', 'INTERVIEW', 'ASSESSMENT')
    AND s.updated_at < NOW() - (p_days || ' days')::INTERVAL
  ORDER BY s.updated_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. VERIFICATION
-- ============================================

DO $$
BEGIN
  -- Check tables exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'application_history') THEN
    RAISE NOTICE 'SUCCESS: application_history table created';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'application_contacts') THEN
    RAISE NOTICE 'SUCCESS: application_contacts table created';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'application_reminders') THEN
    RAISE NOTICE 'SUCCESS: application_reminders table created';
  END IF;

  -- Check new columns on saved_jobs
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saved_jobs' AND column_name = 'source') THEN
    RAISE NOTICE 'SUCCESS: saved_jobs extended with new columns';
  END IF;
END $$;
