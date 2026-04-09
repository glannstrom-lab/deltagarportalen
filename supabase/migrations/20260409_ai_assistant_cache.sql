-- AI Assistant Cache Table
-- Caches AI responses to reduce API costs and improve response times

CREATE TABLE IF NOT EXISTS ai_assistant_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cache_key TEXT NOT NULL,
  cache_type TEXT NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,

  -- Ensure unique cache entries per user
  UNIQUE(user_id, cache_key)
);

-- Index for efficient cache lookups
CREATE INDEX IF NOT EXISTS idx_ai_cache_lookup
  ON ai_assistant_cache(user_id, cache_key, expires_at);

-- Index for cache cleanup (expired entries)
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires
  ON ai_assistant_cache(expires_at);

-- Index for analytics by cache type
CREATE INDEX IF NOT EXISTS idx_ai_cache_type
  ON ai_assistant_cache(cache_type);

-- Enable Row Level Security
ALTER TABLE ai_assistant_cache ENABLE ROW LEVEL SECURITY;

-- Users can only read their own cache entries
CREATE POLICY "Users can read own cache"
  ON ai_assistant_cache FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own cache entries
CREATE POLICY "Users can insert own cache"
  ON ai_assistant_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own cache entries
CREATE POLICY "Users can update own cache"
  ON ai_assistant_cache FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own cache entries
CREATE POLICY "Users can delete own cache"
  ON ai_assistant_cache FOR DELETE
  USING (auth.uid() = user_id);

-- Function to clean up expired cache entries
-- Run periodically via cron or pg_cron
CREATE OR REPLACE FUNCTION cleanup_expired_ai_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ai_assistant_cache
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on table
COMMENT ON TABLE ai_assistant_cache IS 'Caches AI assistant responses to reduce API costs and improve response times';

-- Comment on columns
COMMENT ON COLUMN ai_assistant_cache.cache_key IS 'Unique key identifying the cached request (hash of parameters)';
COMMENT ON COLUMN ai_assistant_cache.cache_type IS 'Type of AI function: company-analysis, industry-radar, salary-compass, etc.';
COMMENT ON COLUMN ai_assistant_cache.result IS 'Cached AI response as JSON';
COMMENT ON COLUMN ai_assistant_cache.expires_at IS 'When this cache entry should be considered stale';
