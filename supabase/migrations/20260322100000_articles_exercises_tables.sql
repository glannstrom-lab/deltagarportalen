-- ============================================
-- MIGRATION: Articles & Exercises Tables
-- Created: 2026-03-22
-- Description: Migrate hardcoded articles (44) and exercises (70) to database
-- ============================================

-- ============================================
-- 1. ARTICLE CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS article_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,           -- 'job-search', 'interview'
  name TEXT NOT NULL,                  -- 'Jobbsokning'
  description TEXT,
  icon TEXT,                           -- Lucide icon name
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. ARTICLES (Extended schema)
-- Drop old articles table and recreate with full schema
-- ============================================
-- First backup any existing data (though it should be empty)
CREATE TABLE IF NOT EXISTS articles_backup AS SELECT * FROM articles;

-- Drop old table constraints first
DROP TABLE IF EXISTS article_course_links CASCADE;

-- Recreate articles table with full schema
DROP TABLE IF EXISTS articles CASCADE;

CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,           -- URL-friendly ID (e.g., 'cv-grunder')
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,               -- Markdown/plain text
  category_id UUID REFERENCES article_categories(id),
  category_key TEXT,                   -- Legacy: category key for backwards compat
  subcategory TEXT,
  tags TEXT[] DEFAULT '{}',
  reading_time INTEGER DEFAULT 5,      -- minutes
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'detailed')),
  energy_level TEXT CHECK (energy_level IN ('low', 'medium', 'high')),
  author TEXT,
  author_title TEXT,
  related_article_slugs TEXT[] DEFAULT '{}',  -- Array of article slugs
  related_exercise_slugs TEXT[] DEFAULT '{}', -- Array of exercise slugs
  related_tools TEXT[] DEFAULT '{}',          -- Array of tool paths
  checklist JSONB DEFAULT '[]',        -- [{id, text}]
  actions JSONB DEFAULT '[]',          -- [{label, href, type}]
  helpfulness_rating DECIMAL(2,1),
  bookmark_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Recreate article_course_links
CREATE TABLE IF NOT EXISTS article_course_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  relevance_score INTEGER DEFAULT 50,
  sort_order INTEGER DEFAULT 0,
  UNIQUE(article_id, course_id)
);

-- ============================================
-- 3. EXERCISE CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS exercise_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,            -- 'self-awareness', 'job-search'
  name TEXT NOT NULL,                  -- 'Sjalvkannedom', 'Jobbsokning'
  description TEXT,
  icon TEXT,                           -- Lucide icon name
  color TEXT DEFAULT 'emerald',
  mapped_article_category_key TEXT,    -- Maps to article category
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 4. EXERCISES
-- ============================================
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,           -- URL-friendly ID
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,                  -- Lucide icon name
  category_id UUID REFERENCES exercise_categories(id),
  category_name TEXT,                  -- Legacy: category name for backwards compat
  duration TEXT NOT NULL,              -- '20-30 min'
  difficulty TEXT CHECK (difficulty IN ('Latt', 'Medel', 'Utmanande')),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 5. EXERCISE STEPS
-- ============================================
CREATE TABLE IF NOT EXISTS exercise_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE NOT NULL,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(exercise_id, step_number)
);

-- ============================================
-- 6. EXERCISE QUESTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS exercise_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID REFERENCES exercise_steps(id) ON DELETE CASCADE NOT NULL,
  question_key TEXT NOT NULL,          -- Original question ID (e.g., 's1-q1')
  question_text TEXT NOT NULL,
  placeholder TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 7. UPDATE EXISTING PROGRESS TABLES
-- Add UUID references while keeping TEXT for backwards compat
-- ============================================
-- article_reading_progress: add article_uuid
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'article_reading_progress' AND column_name = 'article_uuid'
  ) THEN
    ALTER TABLE article_reading_progress ADD COLUMN article_uuid UUID REFERENCES articles(id);
  END IF;
END $$;

-- exercise_answers: add exercise_uuid
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exercise_answers' AND column_name = 'exercise_uuid'
  ) THEN
    ALTER TABLE exercise_answers ADD COLUMN exercise_uuid UUID REFERENCES exercises(id);
  END IF;
END $$;

-- article_checklists: add article_uuid (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'article_checklists') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'article_checklists' AND column_name = 'article_uuid'
    ) THEN
      ALTER TABLE article_checklists ADD COLUMN article_uuid UUID REFERENCES articles(id);
    END IF;
  END IF;
END $$;

-- ============================================
-- 8. INDEXES
-- ============================================
-- Article categories
CREATE INDEX IF NOT EXISTS idx_article_categories_key ON article_categories(key);
CREATE INDEX IF NOT EXISTS idx_article_categories_active ON article_categories(is_active) WHERE is_active = TRUE;

-- Articles
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_category_key ON articles(category_key);
CREATE INDEX IF NOT EXISTS idx_articles_tags ON articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_articles_difficulty ON articles(difficulty);
CREATE INDEX IF NOT EXISTS idx_articles_energy_level ON articles(energy_level);
CREATE INDEX IF NOT EXISTS idx_articles_active ON articles(is_active) WHERE is_active = TRUE;

-- Exercise categories
CREATE INDEX IF NOT EXISTS idx_exercise_categories_key ON exercise_categories(key);
CREATE INDEX IF NOT EXISTS idx_exercise_categories_active ON exercise_categories(is_active) WHERE is_active = TRUE;

-- Exercises
CREATE INDEX IF NOT EXISTS idx_exercises_slug ON exercises(slug);
CREATE INDEX IF NOT EXISTS idx_exercises_category_id ON exercises(category_id);
CREATE INDEX IF NOT EXISTS idx_exercises_category_name ON exercises(category_name);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON exercises(difficulty);
CREATE INDEX IF NOT EXISTS idx_exercises_active ON exercises(is_active) WHERE is_active = TRUE;

-- Exercise steps
CREATE INDEX IF NOT EXISTS idx_exercise_steps_exercise_id ON exercise_steps(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_steps_number ON exercise_steps(exercise_id, step_number);

-- Exercise questions
CREATE INDEX IF NOT EXISTS idx_exercise_questions_step_id ON exercise_questions(step_id);

-- ============================================
-- 9. ROW LEVEL SECURITY
-- ============================================
ALTER TABLE article_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_questions ENABLE ROW LEVEL SECURITY;

-- Article categories: Everyone can read active categories
DROP POLICY IF EXISTS "Anyone can view active article categories" ON article_categories;
CREATE POLICY "Anyone can view active article categories" ON article_categories
  FOR SELECT USING (is_active = TRUE);

-- Articles: Everyone can read active articles
DROP POLICY IF EXISTS "Anyone can view active articles" ON articles;
CREATE POLICY "Anyone can view active articles" ON articles
  FOR SELECT USING (is_active = TRUE);

-- Exercise categories: Everyone can read active categories
DROP POLICY IF EXISTS "Anyone can view active exercise categories" ON exercise_categories;
CREATE POLICY "Anyone can view active exercise categories" ON exercise_categories
  FOR SELECT USING (is_active = TRUE);

-- Exercises: Everyone can read active exercises
DROP POLICY IF EXISTS "Anyone can view active exercises" ON exercises;
CREATE POLICY "Anyone can view active exercises" ON exercises
  FOR SELECT USING (is_active = TRUE);

-- Exercise steps: Everyone can read steps for active exercises
DROP POLICY IF EXISTS "Anyone can view exercise steps" ON exercise_steps;
CREATE POLICY "Anyone can view exercise steps" ON exercise_steps
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM exercises WHERE exercises.id = exercise_steps.exercise_id AND exercises.is_active = TRUE)
  );

-- Exercise questions: Everyone can read questions
DROP POLICY IF EXISTS "Anyone can view exercise questions" ON exercise_questions;
CREATE POLICY "Anyone can view exercise questions" ON exercise_questions
  FOR SELECT USING (TRUE);

-- Article course links: Everyone can read
DROP POLICY IF EXISTS "Anyone can view article links" ON article_course_links;
CREATE POLICY "Anyone can view article links" ON article_course_links
  FOR SELECT USING (TRUE);

-- ============================================
-- 10. TRIGGERS
-- ============================================
-- Auto-update updated_at
DROP TRIGGER IF EXISTS update_article_categories_updated_at ON article_categories;
CREATE TRIGGER update_article_categories_updated_at
  BEFORE UPDATE ON article_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_exercise_categories_updated_at ON exercise_categories;
CREATE TRIGGER update_exercise_categories_updated_at
  BEFORE UPDATE ON exercise_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_exercises_updated_at ON exercises;
CREATE TRIGGER update_exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 11. HELPER FUNCTIONS
-- ============================================

-- Function to get article by slug (for backwards compat with old IDs)
CREATE OR REPLACE FUNCTION get_article_by_slug_or_id(p_identifier TEXT)
RETURNS SETOF articles AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM articles
  WHERE slug = p_identifier
     OR id::TEXT = p_identifier
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get exercise by slug (for backwards compat with old IDs)
CREATE OR REPLACE FUNCTION get_exercise_by_slug_or_id(p_identifier TEXT)
RETURNS SETOF exercises AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM exercises
  WHERE slug = p_identifier
     OR id::TEXT = p_identifier
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get exercise with steps and questions
CREATE OR REPLACE FUNCTION get_exercise_with_content(p_slug TEXT)
RETURNS JSONB AS $$
DECLARE
  exercise_record RECORD;
  result JSONB;
BEGIN
  SELECT * INTO exercise_record FROM exercises WHERE slug = p_slug AND is_active = TRUE;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'id', exercise_record.id,
    'slug', exercise_record.slug,
    'title', exercise_record.title,
    'description', exercise_record.description,
    'icon', exercise_record.icon,
    'category', exercise_record.category_name,
    'duration', exercise_record.duration,
    'difficulty', exercise_record.difficulty,
    'steps', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', s.step_number,
          'title', s.title,
          'description', s.description,
          'questions', (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', q.question_key,
                'text', q.question_text,
                'placeholder', q.placeholder
              ) ORDER BY q.sort_order
            )
            FROM exercise_questions q
            WHERE q.step_id = s.id
          )
        ) ORDER BY s.step_number
      )
      FROM exercise_steps s
      WHERE s.exercise_id = exercise_record.id
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 12. COMMENTS
-- ============================================
COMMENT ON TABLE article_categories IS 'Categories for knowledge base articles';
COMMENT ON TABLE articles IS 'Knowledge base articles with content, metadata and relations';
COMMENT ON TABLE exercise_categories IS 'Categories for interactive exercises';
COMMENT ON TABLE exercises IS 'Interactive exercises with steps and questions';
COMMENT ON TABLE exercise_steps IS 'Steps within an exercise';
COMMENT ON TABLE exercise_questions IS 'Questions within exercise steps';

-- Cleanup backup if empty
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM articles_backup) = 0 THEN
    DROP TABLE IF EXISTS articles_backup;
  END IF;
END $$;
