-- Tillåt 'easy-swedish' som difficulty på artiklar
-- 2026-05-15
--
-- Tidigare check tillät bara 'easy', 'medium', 'detailed', men kategorin
-- "Lätt svenska" har egen difficulty-nivå 'easy-swedish' som matchar TS-typen
-- i client/src/services/articleData.ts (EnhancedArticle.difficulty).
--
-- Utan denna ändring failar 15 lättsvenska-artiklar vid seed.

ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_difficulty_check;
ALTER TABLE articles ADD CONSTRAINT articles_difficulty_check
  CHECK (difficulty IN ('easy-swedish', 'easy', 'medium', 'detailed'));
