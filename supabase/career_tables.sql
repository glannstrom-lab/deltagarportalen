-- ============================================
-- Career Page Tables for Deltagarportalen
-- ============================================

-- 1. Career Paths - Sparade karriärvägar
CREATE TABLE IF NOT EXISTS career_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_occupation TEXT NOT NULL,
  target_occupation TEXT NOT NULL,
  experience_years INTEGER NOT NULL DEFAULT 0,
  current_salary INTEGER NOT NULL DEFAULT 0,
  target_salary INTEGER NOT NULL DEFAULT 0,
  salary_increase INTEGER NOT NULL DEFAULT 0,
  timeline_months INTEGER NOT NULL DEFAULT 12,
  demand_level TEXT CHECK (demand_level IN ('high', 'medium', 'low')),
  job_count INTEGER DEFAULT 0,
  steps JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_career_path UNIQUE (user_id, current_occupation, target_occupation)
);

COMMENT ON TABLE career_paths IS 'Sparade karriärvägar för användare';
COMMENT ON COLUMN career_paths.steps IS 'JSON array med CareerStep objekt';

-- 2. Salary Searches - Sparade lönesökningar
CREATE TABLE IF NOT EXISTS salary_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  occupation TEXT NOT NULL,
  median_salary INTEGER NOT NULL DEFAULT 0,
  percentile_25 INTEGER DEFAULT 0,
  percentile_75 INTEGER DEFAULT 0,
  region_data JSONB NOT NULL DEFAULT '[]',
  experience_data JSONB NOT NULL DEFAULT '[]',
  trends JSONB DEFAULT '{"growth": 0, "job_count": 0, "competition": 0}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_salary_search UNIQUE (user_id, occupation)
);

COMMENT ON TABLE salary_searches IS 'Sparade lönejämförelser';
COMMENT ON COLUMN salary_searches.region_data IS 'JSON array med RegionSalary objekt';
COMMENT ON COLUMN salary_searches.experience_data IS 'JSON array med ExperienceSalary objekt';

-- 3. User Skills - Kompetenser användaren vill utveckla
CREATE TABLE IF NOT EXISTS user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('technical', 'soft', 'certification', 'language')),
  frequency INTEGER DEFAULT 0,
  target_occupation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'interested' CHECK (status IN ('interested', 'learning', 'acquired')),
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_skill UNIQUE (user_id, skill_name, target_occupation)
);

COMMENT ON TABLE user_skills IS 'Kompetenser användaren vill utveckla eller har';

-- 4. Saved Educations - Sparade utbildningar
CREATE TABLE IF NOT EXISTS saved_educations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  education_code TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  duration_months INTEGER,
  location TEXT,
  url TEXT,
  provider TEXT,
  target_occupation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'interested' CHECK (status IN ('interested', 'applied', 'enrolled', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE saved_educations IS 'Sparade utbildningar användaren är intresserad av';

-- 5. Network Contacts - Nätverkskontakter
CREATE TABLE IF NOT EXISTS network_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  role TEXT,
  email TEXT,
  linkedin_url TEXT,
  relationship TEXT NOT NULL DEFAULT 'other' CHECK (relationship IN ('colleague', 'friend', 'mentor', 'recruiter', 'other')),
  last_contact_date DATE,
  next_contact_date DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dormant', 'reconnect')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE network_contacts IS 'Professionella kontakter för nätverkande';

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_career_paths_user_id ON career_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_career_paths_created ON career_paths(created_at);

CREATE INDEX IF NOT EXISTS idx_salary_searches_user_id ON salary_searches(user_id);

CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_status ON user_skills(status);
CREATE INDEX IF NOT EXISTS idx_user_skills_target ON user_skills(target_occupation);

CREATE INDEX IF NOT EXISTS idx_saved_educations_user_id ON saved_educations(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_educations_status ON saved_educations(status);

CREATE INDEX IF NOT EXISTS idx_network_contacts_user_id ON network_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_network_contacts_status ON network_contacts(status);
CREATE INDEX IF NOT EXISTS idx_network_contacts_next_contact ON network_contacts(next_contact_date);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE career_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_educations ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_contacts ENABLE ROW LEVEL SECURITY;

-- Career Paths policies
CREATE POLICY "Users can view own career paths"
  ON career_paths FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own career paths"
  ON career_paths FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own career paths"
  ON career_paths FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own career paths"
  ON career_paths FOR DELETE
  USING (auth.uid() = user_id);

-- Salary Searches policies
CREATE POLICY "Users can view own salary searches"
  ON salary_searches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own salary searches"
  ON salary_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own salary searches"
  ON salary_searches FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own salary searches"
  ON salary_searches FOR DELETE
  USING (auth.uid() = user_id);

-- User Skills policies
CREATE POLICY "Users can view own skills"
  ON user_skills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skills"
  ON user_skills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skills"
  ON user_skills FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own skills"
  ON user_skills FOR DELETE
  USING (auth.uid() = user_id);

-- Saved Educations policies
CREATE POLICY "Users can view own saved educations"
  ON saved_educations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved educations"
  ON saved_educations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved educations"
  ON saved_educations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved educations"
  ON saved_educations FOR DELETE
  USING (auth.uid() = user_id);

-- Network Contacts policies
CREATE POLICY "Users can view own network contacts"
  ON network_contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own network contacts"
  ON network_contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own network contacts"
  ON network_contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own network contacts"
  ON network_contacts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Triggers for updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_skills_updated_at
  BEFORE UPDATE ON user_skills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_educations_updated_at
  BEFORE UPDATE ON saved_educations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_network_contacts_updated_at
  BEFORE UPDATE ON network_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Default data for testing (optional)
-- ============================================

-- Note: Default data should only be inserted after user is created
-- This is just for reference on the structure

/*
-- Example career path
INSERT INTO career_paths (
  user_id, current_occupation, target_occupation, experience_years,
  current_salary, target_salary, salary_increase, timeline_months,
  demand_level, job_count, steps
) VALUES (
  'user-uuid-here',
  'Systemutvecklare',
  'Tech Lead',
  3,
  45000,
  65000,
  20000,
  24,
  'high',
  150,
  '[
    {"order": 1, "title": "Stärk din bas", "description": "...", "timeframe": "6 månader", "actions": [...]},
    {"order": 2, "title": "Brobyggande kompetens", "description": "...", "timeframe": "6 månader", "actions": [...]}
  ]'::jsonb
);
*/
