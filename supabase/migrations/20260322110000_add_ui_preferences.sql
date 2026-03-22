-- ============================================
-- Migration: Add UI preferences columns to user_preferences
-- Migrate localStorage items to cloud for cross-device sync
-- ============================================

DO $$
BEGIN
    -- Checklist dismissed flag
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'user_preferences' AND column_name = 'checklist_dismissed') THEN
        ALTER TABLE user_preferences ADD COLUMN checklist_dismissed BOOLEAN DEFAULT false;
    END IF;

    -- Last login timestamp (for streak tracking)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'user_preferences' AND column_name = 'last_login_at') THEN
        ALTER TABLE user_preferences ADD COLUMN last_login_at TIMESTAMPTZ;
    END IF;

    -- Last login date string (for quick comparison)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'user_preferences' AND column_name = 'last_login_date') THEN
        ALTER TABLE user_preferences ADD COLUMN last_login_date DATE;
    END IF;
END $$;

-- Comments
COMMENT ON COLUMN user_preferences.checklist_dismissed IS 'User has dismissed the getting started checklist';
COMMENT ON COLUMN user_preferences.last_login_at IS 'Timestamp of last login for streak tracking';
COMMENT ON COLUMN user_preferences.last_login_date IS 'Date of last login for quick comparison';

-- ============================================
-- Function to update last login on authentication
-- ============================================
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert user preferences with last login
  INSERT INTO user_preferences (user_id, last_login_at, last_login_date)
  VALUES (NEW.id, NOW(), CURRENT_DATE)
  ON CONFLICT (user_id)
  DO UPDATE SET
    last_login_at = NOW(),
    last_login_date = CURRENT_DATE,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
