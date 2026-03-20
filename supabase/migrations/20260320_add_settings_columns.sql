-- ============================================
-- Migration: Add all settings columns to user_preferences
-- For cloud sync of user settings across devices
-- ============================================

-- Add new columns for settings (if they don't exist)
DO $$
BEGIN
    -- Calm mode (accessibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'user_preferences' AND column_name = 'calm_mode') THEN
        ALTER TABLE user_preferences ADD COLUMN calm_mode BOOLEAN DEFAULT false;
    END IF;

    -- Push notifications
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'user_preferences' AND column_name = 'push_notifications') THEN
        ALTER TABLE user_preferences ADD COLUMN push_notifications BOOLEAN DEFAULT true;
    END IF;

    -- Weekly summary
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'user_preferences' AND column_name = 'weekly_summary') THEN
        ALTER TABLE user_preferences ADD COLUMN weekly_summary BOOLEAN DEFAULT false;
    END IF;

    -- High contrast mode (accessibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'user_preferences' AND column_name = 'high_contrast') THEN
        ALTER TABLE user_preferences ADD COLUMN high_contrast BOOLEAN DEFAULT false;
    END IF;

    -- Large text (accessibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'user_preferences' AND column_name = 'large_text') THEN
        ALTER TABLE user_preferences ADD COLUMN large_text BOOLEAN DEFAULT false;
    END IF;

    -- Onboarding completed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'user_preferences' AND column_name = 'has_completed_onboarding') THEN
        ALTER TABLE user_preferences ADD COLUMN has_completed_onboarding BOOLEAN DEFAULT false;
    END IF;

    -- Energy level (from energyStoreWithSync)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'user_preferences' AND column_name = 'energy_level') THEN
        ALTER TABLE user_preferences ADD COLUMN energy_level VARCHAR(10) DEFAULT 'medium';
    END IF;

    -- Energy updated at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'user_preferences' AND column_name = 'energy_updated_at') THEN
        ALTER TABLE user_preferences ADD COLUMN energy_updated_at TIMESTAMPTZ;
    END IF;
END $$;

-- Comment on columns
COMMENT ON COLUMN user_preferences.calm_mode IS 'Enable calm mode for reduced visual stimulation';
COMMENT ON COLUMN user_preferences.push_notifications IS 'Enable push notifications';
COMMENT ON COLUMN user_preferences.weekly_summary IS 'Enable weekly summary emails';
COMMENT ON COLUMN user_preferences.high_contrast IS 'Enable high contrast mode for accessibility';
COMMENT ON COLUMN user_preferences.large_text IS 'Enable larger text for accessibility';
COMMENT ON COLUMN user_preferences.has_completed_onboarding IS 'User has completed onboarding flow';
COMMENT ON COLUMN user_preferences.energy_level IS 'Daily energy level: low, medium, high';
COMMENT ON COLUMN user_preferences.energy_updated_at IS 'When energy level was last updated';
