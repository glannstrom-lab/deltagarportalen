-- Complete rebuild of achievements table
-- This migration handles ALL cases: missing columns, constraints, and data

-- Step 1: Add ALL potentially missing columns one by one
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS key TEXT;
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 10;
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS rarity TEXT DEFAULT 'common';
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS requirement_type TEXT;
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS requirement_value INTEGER;
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'award';
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Step 2: Drop NOT NULL constraints if they exist
ALTER TABLE achievements ALTER COLUMN requirement_type DROP NOT NULL;
ALTER TABLE achievements ALTER COLUMN requirement_value DROP NOT NULL;
ALTER TABLE achievements ALTER COLUMN key DROP NOT NULL;

-- Step 3: Clear existing data
DELETE FROM achievements;

-- Step 4: Insert fresh achievements
INSERT INTO achievements (key, name, description, icon, category, xp_reward, rarity, requirement_type, requirement_value, sort_order) VALUES
  ('first_login', 'Första steget', 'Logga in för första gången', 'log-in', 'engagement', 10, 'common', 'login', 1, 1),
  ('profile_complete', 'Komplett profil', 'Fyll i alla profiluppgifter', 'user-check', 'profile', 25, 'common', 'profile_complete', 1, 2),
  ('cv_started', 'CV-byggare', 'Börja skapa ditt CV', 'file-text', 'cv', 15, 'common', 'cv_started', 1, 3),
  ('cv_complete', 'CV-mästare', 'Slutför ditt CV med alla sektioner', 'file-check', 'cv', 50, 'uncommon', 'cv_complete', 1, 4),
  ('first_application', 'Första ansökan', 'Skicka din första jobbansökan', 'send', 'jobs', 30, 'common', 'jobs_applied', 1, 5),
  ('five_applications', 'Aktiv sökare', 'Skicka 5 jobbansökningar', 'inbox', 'jobs', 50, 'uncommon', 'jobs_applied', 5, 6),
  ('ten_applications', 'Ihärdig sökare', 'Skicka 10 jobbansökningar', 'briefcase', 'jobs', 100, 'rare', 'jobs_applied', 10, 7),
  ('article_reader', 'Kunskapstörstande', 'Läs 5 artiklar', 'book-open', 'knowledge', 25, 'common', 'articles_read', 5, 8),
  ('knowledge_seeker', 'Kunskapsmästare', 'Läs 25 artiklar', 'graduation-cap', 'knowledge', 100, 'rare', 'articles_read', 25, 9),
  ('diary_writer', 'Reflekterande', 'Skriv 5 dagboksinlägg', 'edit-3', 'wellness', 30, 'common', 'diary_entries', 5, 10),
  ('week_streak', 'Veckorutin', 'Logga in 7 dagar i rad', 'flame', 'engagement', 50, 'uncommon', 'streak_days', 7, 11),
  ('month_streak', 'Månadsmästare', 'Logga in 30 dagar i rad', 'award', 'engagement', 150, 'epic', 'streak_days', 30, 12),
  ('interest_explorer', 'Självutforskare', 'Slutför intresseguiden', 'compass', 'knowledge', 40, 'uncommon', 'interest_guide_complete', 1, 13),
  ('linkedin_pro', 'LinkedIn-proffs', 'Optimera din LinkedIn-profil', 'linkedin', 'profile', 50, 'uncommon', 'linkedin_analyzed', 1, 14),
  ('journey_master', 'Jobbkung', 'Nå nivå 10', 'crown', 'special', 500, 'legendary', 'level_reached', 10, 15);

-- Step 5: Now make key NOT NULL and unique
UPDATE achievements SET key = 'achievement_' || id::text WHERE key IS NULL;
ALTER TABLE achievements ALTER COLUMN key SET NOT NULL;

-- Add unique constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'achievements_key_key') THEN
    ALTER TABLE achievements ADD CONSTRAINT achievements_key_key UNIQUE (key);
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;
