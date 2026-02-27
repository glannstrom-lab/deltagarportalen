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
CREATE POLICY "Participants can view their shared jobs"
  ON shared_jobs FOR SELECT
  USING (participant_id = auth.uid());

-- Policy: Consultants can view jobs shared with them
CREATE POLICY "Consultants can view incoming jobs"
  ON shared_jobs FOR SELECT
  USING (consultant_id = auth.uid());

-- Policy: Participants can insert their own shared jobs
CREATE POLICY "Participants can share jobs"
  ON shared_jobs FOR INSERT
  WITH CHECK (participant_id = auth.uid());

-- Policy: Consultants can update status of jobs shared with them
CREATE POLICY "Consultants can update job status"
  ON shared_jobs FOR UPDATE
  USING (consultant_id = auth.uid())
  WITH CHECK (consultant_id = auth.uid());

-- Policy: Participants can delete their own shared jobs
CREATE POLICY "Participants can delete their shared jobs"
  ON shared_jobs FOR DELETE
  USING (participant_id = auth.uid());

-- Create trigger to auto-update updated_at (function already exists)
DROP TRIGGER IF EXISTS update_shared_jobs_updated_at ON shared_jobs;
CREATE TRIGGER update_shared_jobs_updated_at
  BEFORE UPDATE ON shared_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
