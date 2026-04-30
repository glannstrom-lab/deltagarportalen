-- ============================================
-- Add job_search_filters to user_preferences
-- Persists user's last filter selection in JobSearch across devices
-- ============================================

ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS job_search_filters JSONB DEFAULT '{}'::jsonb;

-- RLS-policys ärvs från befintliga user_preferences-policys (read/insert/update own).
