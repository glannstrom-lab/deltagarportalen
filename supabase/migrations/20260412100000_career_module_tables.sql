-- Career Module Tables
-- Provides cloud storage for Career plans, Skills analyses, Networking events, and Favorite occupations
-- Note: network_contacts table already exists

-- ============================================
-- NETWORKING EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS networking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  location TEXT,
  event_url TEXT,
  expected_attendees INTEGER,
  is_attending BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_networking_events_user_id ON networking_events(user_id);
CREATE INDEX IF NOT EXISTS idx_networking_events_date ON networking_events(event_date);

ALTER TABLE networking_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own events" ON networking_events;
CREATE POLICY "Users can view their own events"
  ON networking_events FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own events" ON networking_events;
CREATE POLICY "Users can insert their own events"
  ON networking_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own events" ON networking_events;
CREATE POLICY "Users can update their own events"
  ON networking_events FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own events" ON networking_events;
CREATE POLICY "Users can delete their own events"
  ON networking_events FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- CAREER PLANS
-- ============================================
CREATE TABLE IF NOT EXISTS career_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_situation TEXT NOT NULL,
  goal TEXT NOT NULL,
  timeframe TEXT,
  is_active BOOLEAN DEFAULT true,
  total_progress INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_career_plans_user_id ON career_plans(user_id);

ALTER TABLE career_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own career plans" ON career_plans;
CREATE POLICY "Users can view their own career plans"
  ON career_plans FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own career plans" ON career_plans;
CREATE POLICY "Users can insert their own career plans"
  ON career_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own career plans" ON career_plans;
CREATE POLICY "Users can update their own career plans"
  ON career_plans FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own career plans" ON career_plans;
CREATE POLICY "Users can delete their own career plans"
  ON career_plans FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- CAREER MILESTONES
-- ============================================
CREATE TABLE IF NOT EXISTS career_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES career_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  timeframe TEXT,
  target_date DATE,
  steps TEXT[] DEFAULT '{}',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  is_completed BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_career_milestones_plan_id ON career_milestones(plan_id);
CREATE INDEX IF NOT EXISTS idx_career_milestones_user_id ON career_milestones(user_id);

ALTER TABLE career_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own milestones" ON career_milestones;
CREATE POLICY "Users can view their own milestones"
  ON career_milestones FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own milestones" ON career_milestones;
CREATE POLICY "Users can insert their own milestones"
  ON career_milestones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own milestones" ON career_milestones;
CREATE POLICY "Users can update their own milestones"
  ON career_milestones FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own milestones" ON career_milestones;
CREATE POLICY "Users can delete their own milestones"
  ON career_milestones FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- SKILLS ANALYSES
-- ============================================
CREATE TABLE IF NOT EXISTS skills_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dream_job TEXT NOT NULL,
  cv_text TEXT,
  match_percentage INTEGER DEFAULT 0,
  analysis_result JSONB,
  skills_comparison JSONB DEFAULT '[]',
  recommended_courses JSONB DEFAULT '[]',
  action_plan JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skills_analyses_user_id ON skills_analyses(user_id);

ALTER TABLE skills_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own analyses" ON skills_analyses;
CREATE POLICY "Users can view their own analyses"
  ON skills_analyses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own analyses" ON skills_analyses;
CREATE POLICY "Users can insert their own analyses"
  ON skills_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own analyses" ON skills_analyses;
CREATE POLICY "Users can update their own analyses"
  ON skills_analyses FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own analyses" ON skills_analyses;
CREATE POLICY "Users can delete their own analyses"
  ON skills_analyses FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- FAVORITE OCCUPATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS favorite_occupations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  occupation_id TEXT NOT NULL,
  occupation_title TEXT NOT NULL,
  occupation_category TEXT,
  salary_range TEXT,
  demand_level TEXT,
  education_required TEXT,
  match_percentage INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, occupation_id)
);

CREATE INDEX IF NOT EXISTS idx_favorite_occupations_user_id ON favorite_occupations(user_id);

ALTER TABLE favorite_occupations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own favorites" ON favorite_occupations;
CREATE POLICY "Users can view their own favorites"
  ON favorite_occupations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own favorites" ON favorite_occupations;
CREATE POLICY "Users can insert their own favorites"
  ON favorite_occupations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own favorites" ON favorite_occupations;
CREATE POLICY "Users can delete their own favorites"
  ON favorite_occupations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update career plan progress based on milestones
CREATE OR REPLACE FUNCTION update_career_plan_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE career_plans
  SET total_progress = (
    SELECT COALESCE(AVG(progress), 0)::INTEGER
    FROM career_milestones
    WHERE plan_id = NEW.plan_id
  ),
  updated_at = NOW()
  WHERE id = NEW.plan_id;

  RETURN NEW;
END;
$$;

-- Trigger to auto-update plan progress
DROP TRIGGER IF EXISTS trigger_update_career_plan_progress ON career_milestones;
CREATE TRIGGER trigger_update_career_plan_progress
  AFTER INSERT OR UPDATE OF progress, is_completed ON career_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_career_plan_progress();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_career_plan_progress TO authenticated;
