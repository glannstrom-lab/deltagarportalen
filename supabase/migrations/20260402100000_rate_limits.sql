-- Rate Limiting Table
-- Replaces Redis-based rate limiting with Supabase

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL,  -- IP address or user ID
  endpoint TEXT NOT NULL,    -- e.g., 'ai' for AI endpoints
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
  ON rate_limits(identifier, endpoint, window_start);

-- Auto-cleanup: delete old entries (older than 1 hour)
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup
  ON rate_limits(window_start);

-- RLS: Only service role can access (API uses service role)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- No policies needed - we'll use service role key in the API

-- Function to check and update rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 20,
  p_window_minutes INTEGER DEFAULT 15
)
RETURNS TABLE(
  allowed BOOLEAN,
  remaining INTEGER,
  reset_at TIMESTAMPTZ
) AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_current_count INTEGER;
  v_reset_at TIMESTAMPTZ;
BEGIN
  -- Calculate window start
  v_window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;

  -- Get current count in window
  SELECT COALESCE(SUM(request_count), 0)
  INTO v_current_count
  FROM rate_limits
  WHERE identifier = p_identifier
    AND endpoint = p_endpoint
    AND window_start > v_window_start;

  -- Check if limit exceeded
  IF v_current_count >= p_max_requests THEN
    -- Get reset time (oldest entry in window + window duration)
    SELECT MIN(window_start) + (p_window_minutes || ' minutes')::INTERVAL
    INTO v_reset_at
    FROM rate_limits
    WHERE identifier = p_identifier
      AND endpoint = p_endpoint
      AND window_start > v_window_start;

    RETURN QUERY SELECT FALSE, 0, v_reset_at;
    RETURN;
  END IF;

  -- Insert new request record
  INSERT INTO rate_limits (identifier, endpoint, window_start)
  VALUES (p_identifier, p_endpoint, NOW());

  -- Return success
  RETURN QUERY SELECT
    TRUE,
    p_max_requests - v_current_count - 1,
    NULL::TIMESTAMPTZ;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup function (call periodically or via cron)
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < NOW() - INTERVAL '1 hour';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (the function handles security)
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit TO anon;
