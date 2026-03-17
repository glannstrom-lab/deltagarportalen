-- Migration: Create job_alerts table and extend saved_jobs
-- Date: 2026-03-17
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. DROP AND RECREATE JOB_ALERTS TABLE
-- ============================================

-- Drop existing table if it exists (to ensure clean state)
DROP TABLE IF EXISTS job_alerts CASCADE;

-- Create job_alerts table
CREATE TABLE job_alerts (
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
CREATE INDEX idx_job_alerts_user_id ON job_alerts(user_id);
CREATE INDEX idx_job_alerts_active ON job_alerts(is_active);
CREATE INDEX idx_job_alerts_created_at ON job_alerts(created_at DESC);

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

-- Auto-update updated_at trigger (create function if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_job_alerts_updated_at
  BEFORE UPDATE ON job_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. EXTEND SAVED_JOBS TABLE
-- ============================================

-- Add follow-up and application tracking columns (safe to run multiple times)
DO $$
BEGIN
  -- Add follow_up_date if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'saved_jobs' AND column_name = 'follow_up_date') THEN
    ALTER TABLE saved_jobs ADD COLUMN follow_up_date DATE;
  END IF;

  -- Add application_date if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'saved_jobs' AND column_name = 'application_date') THEN
    ALTER TABLE saved_jobs ADD COLUMN application_date TIMESTAMPTZ;
  END IF;

  -- Add interview_date if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'saved_jobs' AND column_name = 'interview_date') THEN
    ALTER TABLE saved_jobs ADD COLUMN interview_date TIMESTAMPTZ;
  END IF;

  -- Add priority if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'saved_jobs' AND column_name = 'priority') THEN
    ALTER TABLE saved_jobs ADD COLUMN priority TEXT DEFAULT 'medium';
  END IF;
END $$;

-- Index for filtering by status (for applications view)
CREATE INDEX IF NOT EXISTS idx_saved_jobs_status ON saved_jobs(status);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_follow_up ON saved_jobs(follow_up_date) WHERE follow_up_date IS NOT NULL;

-- ============================================
-- 3. VERIFICATION
-- ============================================

-- Verify table was created
SELECT 'job_alerts table created successfully' AS status
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_alerts');
