-- ============================================
-- User Preferences Table - Save widget configuration and user settings
-- ============================================

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Dashboard widget configuration
  dashboard_widgets JSONB DEFAULT '[]'::jsonb,
  
  -- Other preferences (for future use)
  theme VARCHAR(20) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'sv',
  email_notifications BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one record per user
  UNIQUE(user_id)
);

-- Add RLS policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only read their own preferences
CREATE POLICY "Users can read own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own preferences
CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own preferences
CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_user_preferences_timestamp ON user_preferences;
CREATE TRIGGER update_user_preferences_timestamp
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- ============================================
-- Create function to get or create user preferences
-- ============================================
CREATE OR REPLACE FUNCTION get_or_create_user_preferences(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  prefs JSONB;
BEGIN
  -- Try to get existing preferences
  SELECT dashboard_widgets INTO prefs
  FROM user_preferences
  WHERE user_id = p_user_id;
  
  -- If not found, create default preferences
  IF prefs IS NULL THEN
    INSERT INTO user_preferences (user_id, dashboard_widgets)
    VALUES (p_user_id, '["cv", "jobSearch", "wellness", "quests"]'::jsonb)
    RETURNING dashboard_widgets INTO prefs;
  END IF;
  
  RETURN prefs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
