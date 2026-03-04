-- =====================================================
-- Databas-fixar för Deltagarportalen
-- Kör dessa i Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. RLS-policyer för article_reading_progress
-- =====================================================

-- Aktivera RLS
ALTER TABLE IF EXISTS article_reading_progress ENABLE ROW LEVEL SECURITY;

-- Ta bort befintliga policyer om de finns
DROP POLICY IF EXISTS "Users can CRUD own reading progress" ON article_reading_progress;
DROP POLICY IF EXISTS "Enable read for own progress" ON article_reading_progress;
DROP POLICY IF EXISTS "Enable insert for own progress" ON article_reading_progress;
DROP POLICY IF EXISTS "Enable update for own progress" ON article_reading_progress;

-- Skapa ny policy
CREATE POLICY "Users can CRUD own reading progress"
ON article_reading_progress
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy för anon (om det behövs för utveckling)
-- CREATE POLICY "Allow anon during development"
-- ON article_reading_progress
-- FOR ALL
-- TO anon
-- USING (true);

-- =====================================================
-- 2. RLS-policyer för article_checklists
-- =====================================================

ALTER TABLE IF EXISTS article_checklists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own checklists" ON article_checklists;

CREATE POLICY "Users can CRUD own checklists"
ON article_checklists
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 3. RLS-policyer för user_activities
-- =====================================================

ALTER TABLE IF EXISTS user_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own activities" ON user_activities;

CREATE POLICY "Users can CRUD own activities"
ON user_activities
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 4. RLS-policyer för exercise_answers
-- =====================================================

ALTER TABLE IF EXISTS exercise_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own exercise answers" ON exercise_answers;

CREATE POLICY "Users can CRUD own exercise answers"
ON exercise_answers
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 5. Säkerställ att user_id alltid sätts automatiskt
-- =====================================================

-- Funktion för att sätta user_id
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers för att automatiskt sätta user_id
DROP TRIGGER IF EXISTS set_user_id_article_reading_progress ON article_reading_progress;
CREATE TRIGGER set_user_id_article_reading_progress
  BEFORE INSERT ON article_reading_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_user_id_article_checklists ON article_checklists;
CREATE TRIGGER set_user_id_article_checklists
  BEFORE INSERT ON article_checklists
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_user_id_user_activities ON user_activities;
CREATE TRIGGER set_user_id_user_activities
  BEFORE INSERT ON user_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

-- =====================================================
-- 6. Migrera tags till array (om de är sparade som string)
-- =====================================================

-- Kontrollera först current state
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'articles' AND column_name = 'tags';

-- Om tags är text/varchar, migrera till array:
-- ALTER TABLE articles ALTER COLUMN tags TYPE text[] USING string_to_array(tags, ',');

-- Om tags redan är array men mock-data skickar fel format,
-- se till att frontend alltid skickar array

-- =====================================================
-- 7. Index för bättre prestanda
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_subcategory ON articles(subcategory);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_article_reading_progress_user ON article_reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_article_reading_progress_article ON article_reading_progress(article_id);
CREATE INDEX IF NOT EXISTS idx_article_reading_progress_user_article ON article_reading_progress(user_id, article_id);

CREATE INDEX IF NOT EXISTS idx_exercise_answers_user ON exercise_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_answers_exercise ON exercise_answers(exercise_id);

-- =====================================================
-- 8. Full-text-sökning för artiklar (valfritt)
-- =====================================================

-- Lägg till tsvector-kolumn för sökning
ALTER TABLE articles ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Uppdatera sökvektor
UPDATE articles SET search_vector = 
  setweight(to_tsvector('swedish', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('swedish', coalesce(summary, '')), 'B') ||
  setweight(to_tsvector('swedish', coalesce(content, '')), 'C');

-- Index för full-text-sökning
CREATE INDEX IF NOT EXISTS idx_articles_search ON articles USING GIN(search_vector);

-- Trigger för att automatiskt uppdatera sökvektor
CREATE OR REPLACE FUNCTION articles_search_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('swedish', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('swedish', coalesce(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('swedish', coalesce(NEW.content, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS articles_search_trigger ON articles;
CREATE TRIGGER articles_search_trigger
  BEFORE INSERT OR UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION articles_search_update();

-- =====================================================
-- 9. Verifiera att allt fungerar
-- =====================================================

-- Testa RLS (kör som authenticated user)
-- INSERT INTO article_reading_progress (article_id, progress_percent) 
-- VALUES ('test-article', 50);

-- Verifiera att user_id sätts automatiskt
-- SELECT * FROM article_reading_progress WHERE article_id = 'test-article';

-- Rensa testdata
-- DELETE FROM article_reading_progress WHERE article_id = 'test-article';

-- =====================================================
-- 10. Seed-data för artiklar (om tabellen är tom)
-- =====================================================

-- OBS: Detta kräver att artiklarna från mockArticlesData insertas
-- Se separat seed-fil eller gör via admin-gränssnitt

-- =====================================================
-- Verifiering
-- =====================================================

-- Lista alla RLS-policyer
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('article_reading_progress', 'article_checklists', 'user_activities', 'exercise_answers');

-- Lista alla triggers
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';
