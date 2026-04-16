-- AI Team Sessions - Stores chat history per user per agent
-- This enables session memory so AI remembers previous conversations

CREATE TABLE IF NOT EXISTS ai_team_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL CHECK (agent_id IN ('arbetskonsulent', 'arbetsterapeut', 'studievagledare', 'motivationscoach', 'digitalcoach')),
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint for upsert functionality
  UNIQUE(user_id, agent_id)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ai_team_sessions_user_agent
ON ai_team_sessions(user_id, agent_id);

-- Enable RLS
ALTER TABLE ai_team_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own sessions
CREATE POLICY "Users can view own sessions"
ON ai_team_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
ON ai_team_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
ON ai_team_sessions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
ON ai_team_sessions FOR DELETE
USING (auth.uid() = user_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_team_sessions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER ai_team_sessions_updated_at
  BEFORE UPDATE ON ai_team_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_team_sessions_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_team_sessions TO authenticated;
