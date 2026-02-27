-- =====================================================
-- DEPLOY NEW FEATURES TO SUPABASE
-- Run this in Supabase Studio SQL Editor
-- https://supabase.com/dashboard/project/odcvrdkvzyrbdzvdrhkz/sql/new
-- =====================================================

-- ============================================
-- 1. SHARED JOBS TABLE (A3: Dela med konsulent)
-- ============================================

-- Create shared_jobs table for job sharing between participants and consultants
CREATE TABLE IF NOT EXISTS shared_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL,
  job_data JSONB NOT NULL,
  participant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consultant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
  consultant_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_shared_jobs_participant ON shared_jobs(participant_id);
CREATE INDEX IF NOT EXISTS idx_shared_jobs_consultant ON shared_jobs(consultant_id);
CREATE INDEX IF NOT EXISTS idx_shared_jobs_status ON shared_jobs(status);
CREATE INDEX IF NOT EXISTS idx_shared_jobs_created_at ON shared_jobs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE shared_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Participants can view their own shared jobs
DROP POLICY IF EXISTS "Participants can view their shared jobs" ON shared_jobs;
CREATE POLICY "Participants can view their shared jobs"
  ON shared_jobs FOR SELECT
  USING (participant_id = auth.uid());

-- Policy: Consultants can view jobs shared with them
DROP POLICY IF EXISTS "Consultants can view incoming jobs" ON shared_jobs;
CREATE POLICY "Consultants can view incoming jobs"
  ON shared_jobs FOR SELECT
  USING (consultant_id = auth.uid());

-- Policy: Participants can insert their own shared jobs
DROP POLICY IF EXISTS "Participants can share jobs" ON shared_jobs;
CREATE POLICY "Participants can share jobs"
  ON shared_jobs FOR INSERT
  WITH CHECK (participant_id = auth.uid());

-- Policy: Consultants can update status of jobs shared with them
DROP POLICY IF EXISTS "Consultants can update job status" ON shared_jobs;
CREATE POLICY "Consultants can update job status"
  ON shared_jobs FOR UPDATE
  USING (consultant_id = auth.uid())
  WITH CHECK (consultant_id = auth.uid());

-- Policy: Participants can delete their own shared jobs
DROP POLICY IF EXISTS "Participants can delete their shared jobs" ON shared_jobs;
CREATE POLICY "Participants can delete their shared jobs"
  ON shared_jobs FOR DELETE
  USING (participant_id = auth.uid());

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_shared_jobs_updated_at ON shared_jobs;
CREATE TRIGGER update_shared_jobs_updated_at
  BEFORE UPDATE ON shared_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. INTERVIEW SESSIONS TABLE (B6: Intervjuförberedelse)
-- ============================================

-- Create interview_sessions table for tracking mock interview practice
CREATE TABLE IF NOT EXISTS interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_interview_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  answers JSONB NOT NULL DEFAULT '[]',
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user ON interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_completed ON interview_sessions(completed);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_created_at ON interview_sessions(created_at DESC);

-- Enable RLS
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own sessions
DROP POLICY IF EXISTS "Users can view their interview sessions" ON interview_sessions;
CREATE POLICY "Users can view their interview sessions"
  ON interview_sessions FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can only insert their own sessions
DROP POLICY IF EXISTS "Users can create interview sessions" ON interview_sessions;
CREATE POLICY "Users can create interview sessions"
  ON interview_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can only update their own sessions
DROP POLICY IF EXISTS "Users can update their interview sessions" ON interview_sessions;
CREATE POLICY "Users can update their interview sessions"
  ON interview_sessions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can only delete their own sessions
DROP POLICY IF EXISTS "Users can delete their interview sessions" ON interview_sessions;
CREATE POLICY "Users can delete their interview sessions"
  ON interview_sessions FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'shared_jobs table created' as status;
SELECT COUNT(*) as column_count FROM information_schema.columns WHERE table_name = 'shared_jobs';

SELECT 'interview_sessions table created' as status;
SELECT COUNT(*) as column_count FROM information_schema.columns WHERE table_name = 'interview_sessions';
