-- ============================================
-- FIX ALL RLS POLICIES & TABLES
-- ============================================
-- Kör denna i Supabase SQL Editor för att fixa alla RLS-problem

-- ============================================
-- 1. PROFILES TABELL - Lägg till saknade kolumner
-- ============================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ============================================
-- 2. DASHBOARD_PREFERENCES - Skapa om tabell med rätt struktur
-- ============================================
-- Droppa om den redan finns
DROP TABLE IF EXISTS dashboard_preferences CASCADE;

-- Skapa ny tabell
CREATE TABLE dashboard_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  visible_widgets TEXT[] DEFAULT ARRAY['welcome', 'daily-tasks', 'job-search', 'applications', 'mood', 'calendar', 'tips', 'interview-prep'],
  widget_sizes JSONB DEFAULT '{}',
  widget_order TEXT[] DEFAULT ARRAY['welcome', 'daily-tasks', 'job-search', 'applications', 'mood', 'calendar', 'tips', 'interview-prep'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE dashboard_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own dashboard preferences" ON dashboard_preferences;
DROP POLICY IF EXISTS "Users can create own dashboard preferences" ON dashboard_preferences;
DROP POLICY IF EXISTS "Users can update own dashboard preferences" ON dashboard_preferences;
DROP POLICY IF EXISTS "Users can delete own dashboard preferences" ON dashboard_preferences;
DROP POLICY IF EXISTS "Users can CRUD own dashboard preferences" ON dashboard_preferences;
DROP POLICY IF EXISTS "Enable all operations for users based on user_id" ON dashboard_preferences;

-- Create comprehensive RLS policy
CREATE POLICY "Enable all operations for users based on user_id" 
ON dashboard_preferences
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow anonymous to see nothing (security)
CREATE POLICY "Anonymous users cannot access dashboard_preferences" 
ON dashboard_preferences
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- ============================================
-- 3. USER_PREFERENCES - Skapa om tabell med rätt struktur
-- ============================================
DROP TABLE IF EXISTS user_preferences CASCADE;

CREATE TABLE user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  dark_mode BOOLEAN DEFAULT false,
  font_size TEXT DEFAULT 'medium',
  language TEXT DEFAULT 'sv',
  energy_level TEXT DEFAULT 'medium',
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_skipped BOOLEAN DEFAULT false,
  onboarding_progress JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Enable all operations for users based on user_id" ON user_preferences;

CREATE POLICY "Enable all operations for users based on user_id" 
ON user_preferences
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anonymous users cannot access user_preferences" 
ON user_preferences
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- ============================================
-- 4. ARTICLE_BOOKMARKS - Skapa om tabell med rätt struktur
-- ============================================
DROP TABLE IF EXISTS article_bookmarks CASCADE;

CREATE TABLE article_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  article_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

-- Enable RLS
ALTER TABLE article_bookmarks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Enable all operations for users based on user_id" ON article_bookmarks;

CREATE POLICY "Enable all operations for users based on user_id" 
ON article_bookmarks
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 5. JOB_APPLICATIONS
-- ============================================
DROP TABLE IF EXISTS job_applications CASCADE;

CREATE TABLE job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_id TEXT,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  description TEXT,
  url TEXT,
  source TEXT DEFAULT 'manual',
  status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'interview', 'offer', 'rejected', 'withdrawn')),
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Enable all operations for users based on user_id" ON job_applications;

CREATE POLICY "Enable all operations for users based on user_id" 
ON job_applications
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 6. INTERVIEW_SESSIONS
-- ============================================
DROP TABLE IF EXISTS interview_sessions CASCADE;

CREATE TABLE interview_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_title TEXT NOT NULL,
  company TEXT,
  type TEXT DEFAULT 'general',
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  questions JSONB DEFAULT '[]',
  current_question_index INTEGER DEFAULT 0,
  answers JSONB DEFAULT '[]',
  feedback JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Enable all operations for users based on user_id" ON interview_sessions;

CREATE POLICY "Enable all operations for users based on user_id" 
ON interview_sessions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 7. DAILY_TASKS
-- ============================================
DROP TABLE IF EXISTS daily_tasks CASCADE;

CREATE TABLE daily_tasks (
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

-- Enable RLS
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Enable all operations for users based on user_id" ON daily_tasks;

CREATE POLICY "Enable all operations for users based on user_id" 
ON daily_tasks
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 8. NOTIFICATIONS
-- ============================================
DROP TABLE IF EXISTS notifications CASCADE;

CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  action_url TEXT,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Enable all operations for users based on user_id" ON notifications;

CREATE POLICY "Enable all operations for users based on user_id" 
ON notifications
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 9. JOB_ALERTS
-- ============================================
DROP TABLE IF EXISTS job_alerts CASCADE;

CREATE TABLE job_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  query TEXT NOT NULL,
  municipality TEXT,
  employment_type TEXT,
  remote BOOLEAN DEFAULT false,
  last_checked TIMESTAMPTZ DEFAULT NOW(),
  last_job_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE job_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Enable all operations for users based on user_id" ON job_alerts;

CREATE POLICY "Enable all operations for users based on user_id" 
ON job_alerts
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 10. APPLICATION_TEMPLATES
-- ============================================
DROP TABLE IF EXISTS application_templates CASCADE;

CREATE TABLE application_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE application_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Enable all operations for users based on user_id" ON application_templates;

CREATE POLICY "Enable all operations for users based on user_id" 
ON application_templates
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 11. AI_USAGE_LOGS (för statistik)
-- ============================================
DROP TABLE IF EXISTS ai_usage_logs CASCADE;

CREATE TABLE ai_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  function_name TEXT NOT NULL,
  model TEXT,
  tokens_used INTEGER,
  cost_estimate NUMERIC,
  duration_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view their own logs
CREATE POLICY "Users can view own AI logs" 
ON ai_usage_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only service role can insert (via edge functions)
CREATE POLICY "Service role can insert AI logs" 
ON ai_usage_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- ============================================
-- 12. INDEXES för prestanda
-- ============================================
CREATE INDEX IF NOT EXISTS idx_dashboard_preferences_user_id ON dashboard_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_article_bookmarks_user_id ON article_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_article_bookmarks_article_id ON article_bookmarks(article_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_id ON daily_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_completed ON daily_tasks(completed);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_job_alerts_user_id ON job_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_application_templates_user_id ON application_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON ai_usage_logs(created_at);

-- ============================================
-- 13. TRIGGER för updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at
DROP TRIGGER IF EXISTS update_dashboard_preferences_updated_at ON dashboard_preferences;
CREATE TRIGGER update_dashboard_preferences_updated_at
  BEFORE UPDATE ON dashboard_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_applications_updated_at ON job_applications;
CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_interview_sessions_updated_at ON interview_sessions;
CREATE TRIGGER update_interview_sessions_updated_at
  BEFORE UPDATE ON interview_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_tasks_updated_at ON daily_tasks;
CREATE TRIGGER update_daily_tasks_updated_at
  BEFORE UPDATE ON daily_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_alerts_updated_at ON job_alerts;
CREATE TRIGGER update_job_alerts_updated_at
  BEFORE UPDATE ON job_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_application_templates_updated_at ON application_templates;
CREATE TRIGGER update_application_templates_updated_at
  BEFORE UPDATE ON application_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 14. VERIFICATION: Kontrollera att allt är på plats
-- ============================================
SELECT 
  'dashboard_preferences' as table_name,
  EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'dashboard_preferences') as exists,
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dashboard_preferences') as has_rls
UNION ALL
SELECT 
  'user_preferences',
  EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_preferences'),
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences')
UNION ALL
SELECT 
  'article_bookmarks',
  EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'article_bookmarks'),
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'article_bookmarks')
UNION ALL
SELECT 
  'job_applications',
  EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'job_applications'),
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_applications')
UNION ALL
SELECT 
  'interview_sessions',
  EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'interview_sessions'),
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'interview_sessions')
UNION ALL
SELECT 
  'daily_tasks',
  EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'daily_tasks'),
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'daily_tasks')
UNION ALL
SELECT 
  'notifications',
  EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notifications'),
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications')
UNION ALL
SELECT 
  'job_alerts',
  EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'job_alerts'),
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_alerts')
UNION ALL
SELECT 
  'application_templates',
  EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'application_templates'),
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'application_templates');
