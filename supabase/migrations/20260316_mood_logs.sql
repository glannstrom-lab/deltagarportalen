-- ============================================
-- Mood Logs Table - Track daily mood entries
-- ============================================

-- Add wellness_data column to user_preferences for activities/reflections
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS wellness_data JSONB DEFAULT NULL;

COMMENT ON COLUMN user_preferences.wellness_data IS
'Wellness data including daily activities and reflections. Format: { activities: {}, reflections: [] }';

CREATE TABLE IF NOT EXISTS mood_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood VARCHAR(20) NOT NULL CHECK (mood IN ('great', 'good', 'okay', 'bad', 'terrible')),
  note TEXT,
  logged_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One mood entry per user per day
  UNIQUE(user_id, logged_at)
);

-- Enable RLS
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;

-- Users can only access their own mood logs
CREATE POLICY "Users can read own mood logs"
  ON mood_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood logs"
  ON mood_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood logs"
  ON mood_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mood logs"
  ON mood_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_mood_logs_user_date ON mood_logs(user_id, logged_at DESC);

-- Function to get mood streak (consecutive days with mood logged)
CREATE OR REPLACE FUNCTION get_mood_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  streak INTEGER := 0;
  current_date DATE := CURRENT_DATE;
  check_date DATE;
BEGIN
  LOOP
    check_date := current_date - streak;

    IF EXISTS (
      SELECT 1 FROM mood_logs
      WHERE user_id = p_user_id AND logged_at = check_date
    ) THEN
      streak := streak + 1;
    ELSE
      EXIT;
    END IF;

    -- Max 365 days to prevent infinite loop
    EXIT WHEN streak >= 365;
  END LOOP;

  RETURN streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
