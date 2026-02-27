-- ============================================
-- Deltagarportalen - Supabase Schema
-- Konverterat från Prisma-schema
-- ============================================

-- Aktivera nödvändiga extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELL: Profiler (utökar Supabase Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'CONSULTANT', 'ADMIN')),
  phone TEXT,
  avatar_url TEXT,
  consultant_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- För att länka deltagare till konsulent
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELL: CV
-- ============================================
CREATE TABLE IF NOT EXISTS cvs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Profilinfo
  profile_image TEXT,
  title TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  summary TEXT,
  
  -- JSON-fält för flexibel data
  work_experience JSONB DEFAULT '[]'::jsonb,
  education JSONB DEFAULT '[]'::jsonb,
  skills JSONB DEFAULT '[]'::jsonb,
  languages JSONB DEFAULT '[]'::jsonb,
  certificates JSONB DEFAULT '[]'::jsonb,
  links JSONB DEFAULT '[]'::jsonb,
  "references" JSONB DEFAULT '[]'::jsonb,
  
  -- ATS-analys
  ats_score INTEGER CHECK (ats_score >= 0 AND ats_score <= 100),
  ats_feedback JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELL: CV-versioner (historik)
-- ============================================
CREATE TABLE IF NOT EXISTS cv_versions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELL: Intresseguide-resultat
-- ============================================
CREATE TABLE IF NOT EXISTS interest_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- RIASEC (Holland-koder)
  realistic INTEGER DEFAULT 0 CHECK (realistic >= 0 AND realistic <= 100),
  investigative INTEGER DEFAULT 0 CHECK (investigative >= 0 AND investigative <= 100),
  artistic INTEGER DEFAULT 0 CHECK (artistic >= 0 AND artistic <= 100),
  social INTEGER DEFAULT 0 CHECK (social >= 0 AND social <= 100),
  enterprising INTEGER DEFAULT 0 CHECK (enterprising >= 0 AND enterprising <= 100),
  conventional INTEGER DEFAULT 0 CHECK (conventional >= 0 AND conventional <= 100),
  holland_code TEXT,
  
  -- Big Five
  openness INTEGER DEFAULT 0 CHECK (openness >= 0 AND openness <= 100),
  conscientiousness INTEGER DEFAULT 0 CHECK (conscientiousness >= 0 AND conscientiousness <= 100),
  extraversion INTEGER DEFAULT 0 CHECK (extraversion >= 0 AND extraversion <= 100),
  agreeableness INTEGER DEFAULT 0 CHECK (agreeableness >= 0 AND agreeableness <= 100),
  neuroticism INTEGER DEFAULT 0 CHECK (neuroticism >= 0 AND neuroticism <= 100),
  
  -- Övrigt
  physical_requirements JSONB,
  recommended_jobs JSONB DEFAULT '[]'::jsonb,
  
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELL: Personliga brev
-- ============================================
CREATE TABLE IF NOT EXISTS cover_letters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  title TEXT NOT NULL,
  job_ad TEXT,
  content TEXT NOT NULL,
  company TEXT,
  job_title TEXT,
  ai_generated BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELL: Artiklar (kunskapsbank)
-- ============================================
CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  published BOOLEAN DEFAULT FALSE,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELL: Konsulentanteckningar
-- ============================================
CREATE TABLE IF NOT EXISTS consultant_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  consultant_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'GENERAL' CHECK (category IN ('GENERAL', 'PROGRESS', 'CONCERN', 'GOAL')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELL: Sparade jobb
-- ============================================
CREATE TABLE IF NOT EXISTS saved_jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  job_id TEXT NOT NULL,
  job_data JSONB NOT NULL, -- Cache av jobbdata från AF
  status TEXT DEFAULT 'SAVED' CHECK (status IN ('SAVED', 'APPLIED', 'INTERVIEW', 'REJECTED', 'ACCEPTED')),
  notes TEXT,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- ============================================
-- INDEX för prestanda
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_consultant ON profiles(consultant_id);
CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON cvs(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_versions_user_id ON cv_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_interest_results_user_id ON interest_results(user_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_user_id ON cover_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_consultant_notes_participant ON consultant_notes(participant_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published);

-- ============================================
-- TRIGGER: Uppdatera updated_at automatiskt
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cvs_updated_at BEFORE UPDATE ON cvs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cv_versions_updated_at BEFORE UPDATE ON cv_versions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cover_letters_updated_at BEFORE UPDATE ON cover_letters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultant_notes_updated_at BEFORE UPDATE ON consultant_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Aktivera
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interest_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE cover_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultant_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - Profiler
-- ============================================
-- Användare ser sin egen profil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Användare uppdaterar sin egen profil
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Konsulenter ser sina tilldelade deltagare
CREATE POLICY "Consultants can view their participants" ON profiles
  FOR SELECT USING (
    consultant_id = auth.uid()
  );

-- OBS: Admin-policy är tillfälligt borttagen för att undvika rekursion
-- Lägg tillbaka när du behöver admin-funktionen med en separat lösning

-- ============================================
-- RLS POLICIES - CV
-- ============================================
CREATE POLICY "Users can CRUD own CV" ON cvs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Consultants can view participant CVs" ON cvs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = cvs.user_id 
      AND consultant_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES - Cover Letters
-- ============================================
CREATE POLICY "Users can CRUD own cover letters" ON cover_letters
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Consultants can view participant cover letters" ON cover_letters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = cover_letters.user_id 
      AND consultant_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES - Intresseguide
-- ============================================
CREATE POLICY "Users can CRUD own interest results" ON interest_results
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Consultants can view participant interest results" ON interest_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = interest_results.user_id 
      AND consultant_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES - Konsulentanteckningar
-- ============================================
CREATE POLICY "Consultants can CRUD own notes" ON consultant_notes
  FOR ALL USING (auth.uid() = consultant_id);

CREATE POLICY "Participants can view notes about themselves" ON consultant_notes
  FOR SELECT USING (auth.uid() = participant_id);

-- ============================================
-- RLS POLICIES - Artiklar
-- ============================================
CREATE POLICY "Anyone can view published articles" ON articles
  FOR SELECT USING (published = TRUE);

CREATE POLICY "Authors can CRUD own articles" ON articles
  FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "Admin can CRUD all articles" ON articles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- ============================================
-- RLS POLICIES - Sparade jobb
-- ============================================
CREATE POLICY "Users can CRUD own saved jobs" ON saved_jobs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Consultants can view participant saved jobs" ON saved_jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = saved_jobs.user_id 
      AND consultant_id = auth.uid()
    )
  );

-- ============================================
-- FUNKTION: Skapa profil vid ny användare
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'USER');
  
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    user_role
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger för att automatiskt skapa profil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TABELL: AI-användningslogg (för statistik)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  function_name TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS för AI logs
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI usage" ON ai_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- TABELL: CV-analyser (historik)
-- ============================================
CREATE TABLE IF NOT EXISTS cv_analyses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  job_description TEXT,
  match_percentage INTEGER CHECK (match_percentage >= 0 AND match_percentage <= 100),
  matching_skills TEXT[],
  missing_skills TEXT[],
  recommendations TEXT[],
  ats_score INTEGER CHECK (ats_score >= 0 AND ats_score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS för CV-analyser
ALTER TABLE cv_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own CV analyses" ON cv_analyses
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- SEED DATA - Exempelartiklar
-- ============================================
INSERT INTO articles (title, content, summary, category, tags, published)
VALUES 
(
  'Så skriver du ett CV som fångar arbetsgivarens uppmärksamhet',
  '# Så skriver du ett CV...

Ett bra CV är din biljett till en intervju...',
  'Tips och tricks för att skriva ett professionellt CV som sticker ut',
  'CV',
  ARRAY['cv', 'tips', 'jobbsökning'],
  TRUE
),
(
  'Att söka jobb med funktionsnedsättning',
  '# Att söka jobb med funktionsnedsättning...

Din funktionsnedsättning är en del av dig...',
  'Råd och stöd för dig som söker jobb med funktionsnedsättning',
  'Stöd',
  ARRAY['funktionsnedsättning', 'stöd', 'rättigheter'],
  TRUE
)
ON CONFLICT DO NOTHING;
