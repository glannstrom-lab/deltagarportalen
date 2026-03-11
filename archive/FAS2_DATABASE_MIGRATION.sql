-- Fas 2 Database Migration
-- Unified Profile & Contextual Knowledge Base

-- ============================================
-- 1. UNIFIED PROFILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS unified_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Core profile (replaces/extends profiles table)
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  location TEXT,
  summary TEXT,
  profile_image_url TEXT,
  
  -- Career profile
  career_goals JSONB DEFAULT '{}',
  preferred_roles TEXT[] DEFAULT '{}',
  
  -- Metadata
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE unified_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own unified profile"
  ON unified_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own unified profile"
  ON unified_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own unified profile"
  ON unified_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_unified_profiles_user_id ON unified_profiles(user_id);

-- ============================================
-- 2. ARTICLE CONTEXTS (FÖR KONTEXTUELL KUNSKAPSBANK)
-- ============================================

-- Lägg till kontext-taggar i articles
ALTER TABLE articles ADD COLUMN IF NOT EXISTS contexts TEXT[] DEFAULT '{}';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}';

-- Skapa index för snabb kontext-sökning
CREATE INDEX IF NOT EXISTS idx_articles_contexts ON articles USING GIN(contexts);
CREATE INDEX IF NOT EXISTS idx_articles_keywords ON articles USING GIN(keywords);

-- ============================================
-- 3. JOB MATCHING CACHE
-- ============================================

-- Cache för att spara jobbmatchningar (för snabbare visning)
CREATE TABLE IF NOT EXISTS job_interest_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL,
  job_data JSONB NOT NULL,
  match_score INTEGER NOT NULL, -- 0-100
  riasec_match_score INTEGER,
  keyword_match_score INTEGER,
  matched_riasec_types TEXT[],
  matched_skills TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, job_id)
);

ALTER TABLE job_interest_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own job matches"
  ON job_interest_matches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own job matches"
  ON job_interest_matches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own job matches"
  ON job_interest_matches FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_job_matches_user_id ON job_interest_matches(user_id);
CREATE INDEX idx_job_matches_score ON job_interest_matches(user_id, match_score DESC);

-- ============================================
-- 4. FUNKTION FÖR ATT BERÄKNA PROFILKOMPLETTHET
-- ============================================

CREATE OR REPLACE FUNCTION calculate_profile_completeness(
  p_unified_profile unified_profiles,
  p_cv cvs,
  p_interest_result interest_results
) RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  -- Core profile (max 40%)
  IF p_unified_profile.first_name IS NOT NULL THEN score := score + 8; END IF;
  IF p_unified_profile.last_name IS NOT NULL THEN score := score + 8; END IF;
  IF p_unified_profile.phone IS NOT NULL THEN score := score + 8; END IF;
  IF p_unified_profile.location IS NOT NULL THEN score := score + 8; END IF;
  IF p_unified_profile.summary IS NOT NULL OR p_cv.summary IS NOT NULL THEN score := score + 8; END IF;
  
  -- Professional (max 35%)
  IF p_cv.skills IS NOT NULL AND array_length(p_cv.skills, 1) > 0 THEN score := score + 10; END IF;
  IF p_cv.work_experience IS NOT NULL AND jsonb_array_length(p_cv.work_experience) > 0 THEN score := score + 15; END IF;
  IF p_cv.education IS NOT NULL AND jsonb_array_length(p_cv.education) > 0 THEN score := score + 10; END IF;
  
  -- Career (max 25%)
  IF p_interest_result.riasec_scores IS NOT NULL THEN score := score + 10; END IF;
  IF p_unified_profile.career_goals IS NOT NULL AND p_unified_profile.career_goals != '{}' THEN score := score + 10; END IF;
  IF p_unified_profile.preferred_roles IS NOT NULL AND array_length(p_unified_profile.preferred_roles, 1) > 0 THEN score := score + 5; END IF;
  
  RETURN LEAST(100, score);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. TRIGGERS FÖR AUTO-SYNC
-- ============================================

-- När CV uppdateras, uppdatera unified_profiles
CREATE OR REPLACE FUNCTION sync_cv_to_unified_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO unified_profiles (user_id, summary, updated_at)
  VALUES (NEW.user_id, NEW.summary, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    summary = COALESCE(unified_profiles.summary, EXCLUDED.summary),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cv_to_unified_profile_trigger ON cvs;
CREATE TRIGGER cv_to_unified_profile_trigger
  AFTER INSERT OR UPDATE ON cvs
  FOR EACH ROW
  EXECUTE FUNCTION sync_cv_to_unified_profile();

-- ============================================
-- 6. SEED DATA - ARTIKEL KONTEXTER
-- ============================================

-- Uppdatera befintliga artiklar med kontext-taggar
-- (Detta skulle normalt göras via en migrationsfil eller admin-panel)

-- Exempel på hur man kan tagga artiklar:
/*
UPDATE articles 
SET contexts = ARRAY['cv-building'], keywords = ARRAY['cv', 'sammanfattning', 'ats']
WHERE title ILIKE '%CV%' OR title ILIKE '%sammanfattning%';

UPDATE articles 
SET contexts = ARRAY['interview-prep'], keywords = ARRAY['intervju', 'förberedelse']
WHERE title ILIKE '%intervju%' OR title ILIKE '%förberedelse%';
*/

-- ============================================
-- 7. SÄKERHET & INDEX
-- ============================================

-- Säkerställ att RLS är aktiverat på alla nya tabeller
ALTER TABLE unified_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE job_interest_matches FORCE ROW LEVEL SECURITY;

-- Kommentarer för dokumentation
COMMENT ON TABLE unified_profiles IS 'Central lagring för all profilinformation - Single source of truth';
COMMENT ON TABLE job_interest_matches IS 'Cache för jobbmatchningar baserat på intressen';
COMMENT ON COLUMN articles.contexts IS 'Taggar för kontextuell visning (cv-building, interview-prep, etc.)';
