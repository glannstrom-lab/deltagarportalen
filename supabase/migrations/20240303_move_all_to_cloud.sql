-- ============================================
-- FLYTTA ALLT INNEHÅLL TILL MOLNET
-- ============================================

-- 1. Artikel-bokmärken och läsprogress
CREATE TABLE IF NOT EXISTS article_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  article_id TEXT NOT NULL,
  bookmarked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

CREATE TABLE IF NOT EXISTS article_reading_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  article_id TEXT NOT NULL,
  progress_percent INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  paused_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

CREATE TABLE IF NOT EXISTS article_checklists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  article_id TEXT NOT NULL,
  checked_items TEXT[] DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

-- 2. Dashboard-widget-inställningar
CREATE TABLE IF NOT EXISTS dashboard_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  visible_widgets TEXT[] DEFAULT '{}',
  widget_sizes JSONB DEFAULT '{}',
  widget_order TEXT[] DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 3. Användarinställningar (tema, etc)
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dark_mode BOOLEAN DEFAULT FALSE,
  font_size TEXT DEFAULT 'normal',
  language TEXT DEFAULT 'sv',
  energy_level TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_skipped BOOLEAN DEFAULT FALSE,
  onboarding_progress JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 4. Humörhistorik (wellness)
CREATE TABLE IF NOT EXISTS mood_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
  note TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Dagbok/journal (wellness)
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  mood INTEGER,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Intresseguide-framsteg och resultat
CREATE TABLE IF NOT EXISTS interest_guide_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_step INTEGER DEFAULT 0,
  answers JSONB DEFAULT '{}',
  energy_level TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 7. Notifikationer och aviseringar
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  reminder_frequency TEXT DEFAULT 'daily',
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 8. Jobbsökningsspårning (utöka befintlig saved_jobs)
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_id TEXT,
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  job_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'SAVED' CHECK (status IN ('SAVED', 'APPLIED', 'INTERVIEW', 'REJECTED', 'ACCEPTED')),
  applied_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  cover_letter_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Intervjuförberedelser
CREATE TABLE IF NOT EXISTS interview_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_application_id UUID REFERENCES job_applications(id) ON DELETE SET NULL,
  session_type TEXT NOT NULL,
  answers JSONB DEFAULT '{}',
  ai_feedback JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Autosave-data (drafts)
CREATE TABLE IF NOT EXISTS user_drafts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  draft_type TEXT NOT NULL,
  draft_key TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, draft_type, draft_key)
);

-- ============================================
-- INDEX FÖR BÄTTRE PRESTANDA
-- ============================================
CREATE INDEX IF NOT EXISTS idx_article_bookmarks_user_id ON article_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_article_progress_user_id ON article_reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_article_checklists_user_id ON article_checklists(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_history_user_id ON mood_history(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_history_recorded_at ON mood_history(recorded_at);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_drafts_user_id ON user_drafts(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE article_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE interest_guide_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_drafts ENABLE ROW LEVEL SECURITY;

-- Skapa policies för alla tabeller (användare ser bara sina egna data)
CREATE POLICY "Users can manage own article bookmarks" ON article_bookmarks
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own article progress" ON article_reading_progress
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own article checklists" ON article_checklists
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own dashboard preferences" ON dashboard_preferences
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own mood history" ON mood_history
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own journal entries" ON journal_entries
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own interest guide progress" ON interest_guide_progress
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own notifications" ON user_notifications
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own notification preferences" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own job applications" ON job_applications
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own interview sessions" ON interview_sessions
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own drafts" ON user_drafts
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- FUNKTIONER OCH TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Skapa triggers för alla tabeller som har updated_at
CREATE TRIGGER update_article_reading_progress_updated_at
  BEFORE UPDATE ON article_reading_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_article_checklists_updated_at
  BEFORE UPDATE ON article_checklists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dashboard_preferences_updated_at
  BEFORE UPDATE ON dashboard_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_interest_guide_progress_updated_at
  BEFORE UPDATE ON interest_guide_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON job_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_interview_sessions_updated_at
  BEFORE UPDATE ON interview_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_drafts_updated_at
  BEFORE UPDATE ON user_drafts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- KOMMENTARER
-- ============================================
COMMENT ON TABLE article_bookmarks IS 'User bookmarks for knowledge base articles';
COMMENT ON TABLE article_reading_progress IS 'Reading progress tracking for articles';
COMMENT ON TABLE article_checklists IS 'Checklist completion for articles';
COMMENT ON TABLE dashboard_preferences IS 'User dashboard widget preferences';
COMMENT ON TABLE user_preferences IS 'General user preferences (theme, etc)';
COMMENT ON TABLE mood_history IS 'Daily mood tracking for wellness feature';
COMMENT ON TABLE journal_entries IS 'Journal/diary entries for wellness';
COMMENT ON TABLE interest_guide_progress IS 'Progress in the interest guide';
COMMENT ON TABLE user_notifications IS 'User notifications and alerts';
COMMENT ON TABLE notification_preferences IS 'Notification settings per user';
COMMENT ON TABLE job_applications IS 'Extended job application tracking';
COMMENT ON TABLE interview_sessions IS 'Interview preparation sessions';
COMMENT ON TABLE user_drafts IS 'Auto-saved drafts for various features';
