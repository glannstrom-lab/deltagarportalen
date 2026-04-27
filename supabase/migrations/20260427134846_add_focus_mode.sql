-- Add focus_mode column to user_preferences
-- NPF-adapted mode for users with ADHD, autism, etc.

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS focus_mode BOOLEAN DEFAULT false;

COMMENT ON COLUMN user_preferences.focus_mode IS 'NPF-adapted focus mode - shows one step at a time, reduces visual noise';
