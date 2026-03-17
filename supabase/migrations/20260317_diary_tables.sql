-- Migration: Create comprehensive diary tables
-- Date: 2026-03-17
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. DIARY ENTRIES TABLE
-- ============================================

DROP TABLE IF EXISTS diary_entries CASCADE;

CREATE TABLE diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  mood INTEGER CHECK (mood >= 1 AND mood <= 5),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
  tags TEXT[] DEFAULT '{}',
  word_count INTEGER DEFAULT 0,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_type TEXT DEFAULT 'diary' CHECK (entry_type IN ('diary', 'gratitude', 'reflection', 'goal')),
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_diary_entries_user_id ON diary_entries(user_id);
CREATE INDEX idx_diary_entries_date ON diary_entries(entry_date DESC);
CREATE INDEX idx_diary_entries_type ON diary_entries(entry_type);
CREATE INDEX idx_diary_entries_tags ON diary_entries USING GIN(tags);

-- RLS
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own diary entries"
  ON diary_entries FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own diary entries"
  ON diary_entries FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own diary entries"
  ON diary_entries FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own diary entries"
  ON diary_entries FOR DELETE USING (user_id = auth.uid());


-- ============================================
-- 2. MOOD LOGS TABLE (Enhanced)
-- ============================================

DROP TABLE IF EXISTS mood_logs CASCADE;

CREATE TABLE mood_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood_level INTEGER NOT NULL CHECK (mood_level >= 1 AND mood_level <= 5),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 5),
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
  activities TEXT[] DEFAULT '{}',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, log_date)
);

-- Indexes
CREATE INDEX idx_mood_logs_user_id ON mood_logs(user_id);
CREATE INDEX idx_mood_logs_date ON mood_logs(log_date DESC);

-- RLS
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mood logs"
  ON mood_logs FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own mood logs"
  ON mood_logs FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own mood logs"
  ON mood_logs FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own mood logs"
  ON mood_logs FOR DELETE USING (user_id = auth.uid());


-- ============================================
-- 3. WEEKLY GOALS TABLE
-- ============================================

DROP TABLE IF EXISTS weekly_goals CASCADE;

CREATE TABLE weekly_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  goal_text TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('career', 'health', 'personal', 'learning', 'general')),
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  reflection TEXT,
  priority INTEGER DEFAULT 2 CHECK (priority >= 1 AND priority <= 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_weekly_goals_user_id ON weekly_goals(user_id);
CREATE INDEX idx_weekly_goals_week ON weekly_goals(week_start DESC);

-- RLS
ALTER TABLE weekly_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weekly goals"
  ON weekly_goals FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own weekly goals"
  ON weekly_goals FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own weekly goals"
  ON weekly_goals FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own weekly goals"
  ON weekly_goals FOR DELETE USING (user_id = auth.uid());


-- ============================================
-- 4. GRATITUDE ENTRIES TABLE
-- ============================================

DROP TABLE IF EXISTS gratitude_entries CASCADE;

CREATE TABLE gratitude_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  item1 TEXT NOT NULL,
  item2 TEXT,
  item3 TEXT,
  reflection TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_gratitude_entries_user_id ON gratitude_entries(user_id);
CREATE INDEX idx_gratitude_entries_date ON gratitude_entries(entry_date DESC);

-- RLS
ALTER TABLE gratitude_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gratitude entries"
  ON gratitude_entries FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own gratitude entries"
  ON gratitude_entries FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own gratitude entries"
  ON gratitude_entries FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own gratitude entries"
  ON gratitude_entries FOR DELETE USING (user_id = auth.uid());


-- ============================================
-- 5. DIARY STREAKS TABLE
-- ============================================

DROP TABLE IF EXISTS diary_streaks CASCADE;

CREATE TABLE diary_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_entry_date DATE,
  total_entries INTEGER DEFAULT 0,
  total_words INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_diary_streaks_user_id ON diary_streaks(user_id);

-- RLS
ALTER TABLE diary_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own diary streaks"
  ON diary_streaks FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own diary streaks"
  ON diary_streaks FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own diary streaks"
  ON diary_streaks FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- ============================================
-- 6. WRITING PROMPTS TABLE (Admin-managed)
-- ============================================

DROP TABLE IF EXISTS writing_prompts CASCADE;

CREATE TABLE writing_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_text TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('reflection', 'gratitude', 'career', 'personal', 'creativity', 'general')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default writing prompts
INSERT INTO writing_prompts (prompt_text, category) VALUES
  ('Vad är du mest tacksam för idag?', 'gratitude'),
  ('Beskriv ett ögonblick som gjorde dig glad idag.', 'reflection'),
  ('Vilka är dina tre viktigaste mål just nu?', 'career'),
  ('Vad har du lärt dig den senaste veckan?', 'reflection'),
  ('Om du kunde ge ditt yngre jag ett råd, vad skulle det vara?', 'personal'),
  ('Beskriv din perfekta arbetsdag.', 'career'),
  ('Vad ger dig energi?', 'personal'),
  ('Vilka framsteg har du gjort mot dina mål?', 'career'),
  ('Vad skulle du göra om du inte var rädd?', 'creativity'),
  ('Beskriv en utmaning du övervunnit.', 'reflection'),
  ('Vem inspirerar dig och varför?', 'personal'),
  ('Vad är du stolt över att ha åstadkommit?', 'reflection'),
  ('Hur vill du att din framtid ska se ut?', 'career'),
  ('Vilka styrkor har du upptäckt hos dig själv?', 'personal'),
  ('Vad gör dig unik på arbetsmarknaden?', 'career')
ON CONFLICT DO NOTHING;


-- ============================================
-- 7. AUTO-UPDATE TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_diary_entries_updated_at ON diary_entries;
CREATE TRIGGER update_diary_entries_updated_at
  BEFORE UPDATE ON diary_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mood_logs_updated_at ON mood_logs;
CREATE TRIGGER update_mood_logs_updated_at
  BEFORE UPDATE ON mood_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_weekly_goals_updated_at ON weekly_goals;
CREATE TRIGGER update_weekly_goals_updated_at
  BEFORE UPDATE ON weekly_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- 8. VERIFICATION
-- ============================================

SELECT 'diary_entries table created' AS status WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'diary_entries');
SELECT 'mood_logs table created' AS status WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mood_logs');
SELECT 'weekly_goals table created' AS status WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'weekly_goals');
SELECT 'gratitude_entries table created' AS status WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gratitude_entries');
SELECT 'diary_streaks table created' AS status WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'diary_streaks');
SELECT 'writing_prompts table created' AS status WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'writing_prompts');
