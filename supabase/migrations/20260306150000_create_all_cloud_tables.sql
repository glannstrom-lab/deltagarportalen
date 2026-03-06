-- ============================================
-- CREATE ALL CLOUD TABLES
-- ============================================
-- Skapar alla tabeller som behövs för att ersätta localStorage

-- ============================================
-- 1. ARTICLE_READING_PROGRESS
-- ============================================
CREATE TABLE IF NOT EXISTS article_reading_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  article_id TEXT NOT NULL,
  progress_percent INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

ALTER TABLE article_reading_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own reading progress" ON article_reading_progress;
CREATE POLICY "Users can CRUD own reading progress" ON article_reading_progress
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 2. ARTICLE_CHECKLISTS
-- ============================================
CREATE TABLE IF NOT EXISTS article_checklists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  article_id TEXT NOT NULL,
  checked_items TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

ALTER TABLE article_checklists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own checklists" ON article_checklists;
CREATE POLICY "Users can CRUD own checklists" ON article_checklists
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. MOOD_HISTORY
-- ============================================
-- Om gammal tabell finns med 'recorded_at', lägg till 'created_at'
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mood_history' AND column_name = 'recorded_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mood_history' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE mood_history ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS mood_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mood_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own mood history" ON mood_history;
CREATE POLICY "Users can CRUD own mood history" ON mood_history
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. JOURNAL_ENTRIES
-- ============================================
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  mood INTEGER CHECK (mood >= 1 AND mood <= 5),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own journal entries" ON journal_entries;
CREATE POLICY "Users can CRUD own journal entries" ON journal_entries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 5. INTEREST_GUIDE_PROGRESS
-- ============================================
CREATE TABLE IF NOT EXISTS interest_guide_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_step INTEGER DEFAULT 1,
  answers JSONB DEFAULT '{}',
  energy_level TEXT,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE interest_guide_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own interest guide progress" ON interest_guide_progress;
CREATE POLICY "Users can CRUD own interest guide progress" ON interest_guide_progress
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 6. NOTIFICATION_PREFERENCES
-- ============================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  daily_reminder BOOLEAN DEFAULT true,
  weekly_summary BOOLEAN DEFAULT true,
  job_alerts BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own notification preferences" ON notification_preferences;
CREATE POLICY "Users can CRUD own notification preferences" ON notification_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 7. USER_DRAFTS
-- ============================================
CREATE TABLE IF NOT EXISTS user_drafts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  draft_type TEXT NOT NULL,
  draft_key TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, draft_type, draft_key)
);

ALTER TABLE user_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own drafts" ON user_drafts;
CREATE POLICY "Users can CRUD own drafts" ON user_drafts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 8. DAILY_TASKS
-- ============================================
CREATE TABLE IF NOT EXISTS daily_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  due_date DATE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own daily tasks" ON daily_tasks;
CREATE POLICY "Users can CRUD own daily tasks" ON daily_tasks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 9. PLATSBANKEN_SAVED_JOBS
-- ============================================
CREATE TABLE IF NOT EXISTS platsbanken_saved_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_id TEXT NOT NULL,
  job_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

ALTER TABLE platsbanken_saved_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own saved jobs" ON platsbanken_saved_jobs;
CREATE POLICY "Users can CRUD own saved jobs" ON platsbanken_saved_jobs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 10. PLATSBANKEN_SAVED_SEARCHES
-- ============================================
CREATE TABLE IF NOT EXISTS platsbanken_saved_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  query TEXT,
  municipality TEXT,
  employment_type TEXT,
  remote BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE platsbanken_saved_searches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own saved searches" ON platsbanken_saved_searches;
CREATE POLICY "Users can CRUD own saved searches" ON platsbanken_saved_searches
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 11. SAVED_JOBS (för CoverLetterGenerator)
-- ============================================
CREATE TABLE IF NOT EXISTS saved_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_id TEXT NOT NULL,
  job_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own saved jobs" ON saved_jobs;
CREATE POLICY "Users can CRUD own saved jobs" ON saved_jobs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_article_progress_user_article ON article_reading_progress(user_id, article_id);
CREATE INDEX IF NOT EXISTS idx_article_checklists_user_article ON article_checklists(user_id, article_id);
-- Index för mood_history - använd recorded_at om created_at inte finns
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mood_history' AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_mood_history_user_created ON mood_history(user_id, created_at);
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mood_history' AND column_name = 'recorded_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_mood_history_user_recorded ON mood_history(user_id, recorded_at);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_created ON journal_entries(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date ON daily_tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_completed ON daily_tasks(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_user_drafts_user_type ON user_drafts(user_id, draft_type);
CREATE INDEX IF NOT EXISTS idx_platsbanken_jobs_user ON platsbanken_saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_platsbanken_searches_user ON platsbanken_saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user ON saved_jobs(user_id);

-- ============================================
-- TRIGGER FUNCTION för updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at
DROP TRIGGER IF EXISTS update_article_reading_progress_updated_at ON article_reading_progress;
CREATE TRIGGER update_article_reading_progress_updated_at
  BEFORE UPDATE ON article_reading_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_article_checklists_updated_at ON article_checklists;
CREATE TRIGGER update_article_checklists_updated_at
  BEFORE UPDATE ON article_checklists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON journal_entries;
CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_interest_guide_progress_updated_at ON interest_guide_progress;
CREATE TRIGGER update_interest_guide_progress_updated_at
  BEFORE UPDATE ON interest_guide_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_drafts_updated_at ON user_drafts;
CREATE TRIGGER update_user_drafts_updated_at
  BEFORE UPDATE ON user_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_tasks_updated_at ON daily_tasks;
CREATE TRIGGER update_daily_tasks_updated_at
  BEFORE UPDATE ON daily_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_platsbanken_saved_searches_updated_at ON platsbanken_saved_searches;
CREATE TRIGGER update_platsbanken_saved_searches_updated_at
  BEFORE UPDATE ON platsbanken_saved_searches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'Tables created successfully' as status;
