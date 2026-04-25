-- Add updated_at column to saved_jobs table
-- This enables tracking of stale applications

-- Add column
ALTER TABLE saved_jobs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Set initial values based on most recent activity date
UPDATE saved_jobs
SET updated_at = GREATEST(
  COALESCE(created_at, NOW()),
  COALESCE(applied_at, created_at),
  COALESCE(application_date, created_at)
);

-- Auto-update trigger function
CREATE OR REPLACE FUNCTION update_saved_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS saved_jobs_updated_at ON saved_jobs;
CREATE TRIGGER saved_jobs_updated_at
  BEFORE UPDATE ON saved_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_jobs_updated_at();
