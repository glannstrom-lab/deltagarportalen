-- Migration: Create interview_recordings table for saving interview practice sessions
-- Date: 2026-04-12

-- ============================================
-- 1. INTERVIEW_RECORDINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS interview_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 0, -- in seconds
  segments JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  -- Optional fields
  role TEXT,
  company TEXT,
  questions_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Prevent duplicate sessions
  UNIQUE(user_id, session_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_interview_recordings_user_id ON interview_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_recordings_created_at ON interview_recordings(created_at DESC);

-- Enable Row Level Security
ALTER TABLE interview_recordings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own recordings
CREATE POLICY "Users can view their own recordings"
  ON interview_recordings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own recordings"
  ON interview_recordings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own recordings"
  ON interview_recordings FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own recordings"
  ON interview_recordings FOR DELETE
  USING (user_id = auth.uid());

-- Auto-update updated_at trigger
CREATE TRIGGER update_interview_recordings_updated_at
  BEFORE UPDATE ON interview_recordings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. STORAGE BUCKET (if not exists)
-- ============================================

-- Note: Storage bucket 'user-files' should already exist
-- If not, create it via Supabase dashboard or storage API
-- with appropriate policies for authenticated users

-- ============================================
-- 3. VERIFICATION
-- ============================================

SELECT 'interview_recordings table created successfully' AS status
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interview_recordings');
