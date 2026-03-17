-- Migration: Create job_alerts table and extend saved_jobs
-- Date: 2026-03-17

-- ============================================
-- 1. CREATE JOB_ALERTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS job_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  -- Search criteria
  query TEXT,
  municipality TEXT,
  region TEXT,
  employment_type TEXT,
  published_within TEXT DEFAULT 'week',
  remote BOOLEAN DEFAULT false,
  -- Alert settings
  is_active BOOLEAN DEFAULT true,
  notification_frequency TEXT DEFAULT 'daily' CHECK (notification_frequency IN ('instant', 'daily', 'weekly')),
  last_checked_at TIMESTAMPTZ,
  new_jobs_count INTEGER DEFAULT 0,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_alerts_user_id ON job_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_job_alerts_active ON job_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_job_alerts_created_at ON job_alerts(created_at DESC);

-- Enable Row Level Security
ALTER TABLE job_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own alerts
CREATE POLICY "Users can view their own alerts"
  ON job_alerts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own alerts"
  ON job_alerts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own alerts"
  ON job_alerts FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own alerts"
  ON job_alerts FOR DELETE
  USING (user_id = auth.uid());

-- Auto-update updated_at trigger
DROP TRIGGER IF EXISTS update_job_alerts_updated_at ON job_alerts;
CREATE TRIGGER update_job_alerts_updated_at
  BEFORE UPDATE ON job_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. EXTEND SAVED_JOBS TABLE
-- ============================================

-- Add follow-up and application tracking columns
ALTER TABLE saved_jobs
  ADD COLUMN IF NOT EXISTS follow_up_date DATE,
  ADD COLUMN IF NOT EXISTS application_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS interview_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'));

-- Index for filtering by status (for applications view)
CREATE INDEX IF NOT EXISTS idx_saved_jobs_status ON saved_jobs(status);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_follow_up ON saved_jobs(follow_up_date) WHERE follow_up_date IS NOT NULL;

-- ============================================
-- 3. COMMENTS
-- ============================================

COMMENT ON TABLE job_alerts IS 'Stores saved job search criteria for alerts/notifications';
COMMENT ON COLUMN job_alerts.query IS 'Search text query';
COMMENT ON COLUMN job_alerts.municipality IS 'Municipality code filter';
COMMENT ON COLUMN job_alerts.region IS 'Region code filter';
COMMENT ON COLUMN job_alerts.new_jobs_count IS 'Number of new jobs since last check';
COMMENT ON COLUMN saved_jobs.follow_up_date IS 'Date to follow up on application';
COMMENT ON COLUMN saved_jobs.priority IS 'User-defined priority: low, medium, high';
