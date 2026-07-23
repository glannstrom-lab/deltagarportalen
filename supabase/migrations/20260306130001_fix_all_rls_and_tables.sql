-- ============================================
-- MIGRATION: Fixa alla RLS-problem och skapa saknade tabeller
-- ============================================

-- ============================================
-- 1. Lägg till saknade kolumner i profiles
-- ============================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ============================================
-- 2. Skapa dashboard_preferences tabell
-- ============================================
CREATE TABLE IF NOT EXISTS dashboard_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  visible_widgets TEXT[] DEFAULT '{}',
  widget_sizes JSONB DEFAULT '{}',
  widget_order TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- 3. Skapa user_preferences tabell
-- ============================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dark_mode BOOLEAN DEFAULT false,
  font_size TEXT DEFAULT 'normal',
  language TEXT DEFAULT 'sv',
  energy_level TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_skipped BOOLEAN DEFAULT false,
  onboarding_progress JSONB DEFAULT '{}',
  daily_task_state JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- 4. Skapa job_alerts tabell
-- ============================================
CREATE TABLE IF NOT EXISTS job_alerts (
  id TEXT PRIMARY KEY,
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

-- ============================================
-- 5. Skapa application_templates tabell
-- ============================================
CREATE TABLE IF NOT EXISTS application_templates (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. Aktivera RLS på alla tabeller
-- ============================================
ALTER TABLE dashboard_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_templates ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. RLS Policies för dashboard_preferences
-- ============================================
DROP POLICY IF EXISTS "Enable read access for own dashboard preferences" ON dashboard_preferences;
CREATE POLICY "Enable read access for own dashboard preferences"
  ON dashboard_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable insert access for own dashboard preferences" ON dashboard_preferences;
CREATE POLICY "Enable insert access for own dashboard preferences"
  ON dashboard_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable update access for own dashboard preferences" ON dashboard_preferences;
CREATE POLICY "Enable update access for own dashboard preferences"
  ON dashboard_preferences FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable delete access for own dashboard preferences" ON dashboard_preferences;
CREATE POLICY "Enable delete access for own dashboard preferences"
  ON dashboard_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 8. RLS Policies för user_preferences
-- ============================================
DROP POLICY IF EXISTS "Enable read access for own user preferences" ON user_preferences;
CREATE POLICY "Enable read access for own user preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable insert access for own user preferences" ON user_preferences;
CREATE POLICY "Enable insert access for own user preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable update access for own user preferences" ON user_preferences;
CREATE POLICY "Enable update access for own user preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable delete access for own user preferences" ON user_preferences;
CREATE POLICY "Enable delete access for own user preferences"
  ON user_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 9. RLS Policies för job_alerts
-- ============================================
DROP POLICY IF EXISTS "Enable read access for own job alerts" ON job_alerts;
CREATE POLICY "Enable read access for own job alerts"
  ON job_alerts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable insert access for own job alerts" ON job_alerts;
CREATE POLICY "Enable insert access for own job alerts"
  ON job_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable update access for own job alerts" ON job_alerts;
CREATE POLICY "Enable update access for own job alerts"
  ON job_alerts FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable delete access for own job alerts" ON job_alerts;
CREATE POLICY "Enable delete access for own job alerts"
  ON job_alerts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 10. RLS Policies för application_templates
-- ============================================
DROP POLICY IF EXISTS "Enable read access for own templates" ON application_templates;
CREATE POLICY "Enable read access for own templates"
  ON application_templates FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable insert access for own templates" ON application_templates;
CREATE POLICY "Enable insert access for own templates"
  ON application_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable update access for own templates" ON application_templates;
CREATE POLICY "Enable update access for own templates"
  ON application_templates FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable delete access for own templates" ON application_templates;
CREATE POLICY "Enable delete access for own templates"
  ON application_templates FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 11. Verifiera att allt skapats
-- ============================================
SELECT 'Tabeller skapade:' as status;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'dashboard_preferences', 
  'user_preferences', 
  'job_alerts', 
  'application_templates'
);

SELECT 'RLS aktiverat:' as status;

SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'dashboard_preferences', 
  'user_preferences', 
  'job_alerts', 
  'application_templates'
);

SELECT 'Policies skapade:' as status;

SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN (
  'dashboard_preferences', 
  'user_preferences', 
  'job_alerts', 
  'application_templates'
);
