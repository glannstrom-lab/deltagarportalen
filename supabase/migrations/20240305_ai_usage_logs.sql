-- Migration: Create AI usage logs table
-- This table tracks AI function usage for analytics and cost monitoring

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name TEXT NOT NULL,
  model TEXT,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON ai_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_function ON ai_usage_logs(function_name);

-- Enable RLS (Row Level Security)
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own logs
CREATE POLICY "Users can view own AI usage logs"
  ON ai_usage_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Only service role can insert logs
-- (This is handled by the Edge Function using service_role key)

-- Grant necessary permissions
GRANT SELECT ON ai_usage_logs TO authenticated;
GRANT ALL ON ai_usage_logs TO service_role;

-- Add comment
COMMENT ON TABLE ai_usage_logs IS 'Tracks AI function usage for analytics and cost monitoring';
