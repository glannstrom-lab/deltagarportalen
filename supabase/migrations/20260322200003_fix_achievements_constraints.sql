-- Fix: Remove NOT NULL constraint on requirement_type and rebuild achievements

-- Drop the NOT NULL constraint on requirement_type if it exists
ALTER TABLE achievements ALTER COLUMN requirement_type DROP NOT NULL;

-- Also ensure requirement_value can be null
ALTER TABLE achievements ALTER COLUMN requirement_value DROP NOT NULL;

-- Clear existing achievements
DELETE FROM achievements;

-- Insert achievements with proper values (use empty string instead of NULL for requirement_type where needed)
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
