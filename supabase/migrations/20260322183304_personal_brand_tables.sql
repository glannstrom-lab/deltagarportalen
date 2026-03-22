-- Personal Brand Tables Migration
-- Stores personal branding data: audit answers, portfolio items, elevator pitches, visibility progress

-- ============================================================================
-- PERSONAL BRAND AUDIT
-- Stores user's brand audit answers and history
-- ============================================================================
CREATE TABLE personal_brand_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',  -- { questionId: boolean }
  total_score INTEGER DEFAULT 0,
  category_scores JSONB DEFAULT '{}',   -- { online: 80, content: 60, ... }
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for user queries
CREATE INDEX idx_personal_brand_audit_user_id ON personal_brand_audit(user_id);
CREATE INDEX idx_personal_brand_audit_updated ON personal_brand_audit(updated_at DESC);

-- ============================================================================
-- PORTFOLIO ITEMS
-- User's portfolio projects, work, certificates
-- ============================================================================
CREATE TABLE portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL CHECK (item_type IN ('project', 'work', 'certificate', 'other')),
  url TEXT,
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  start_date DATE,
  end_date DATE,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for user queries
CREATE INDEX idx_portfolio_items_user_id ON portfolio_items(user_id);
CREATE INDEX idx_portfolio_items_type ON portfolio_items(item_type);
CREATE INDEX idx_portfolio_items_featured ON portfolio_items(user_id, is_featured) WHERE is_featured = true;

-- ============================================================================
-- ELEVATOR PITCHES
-- User's saved elevator pitches
-- ============================================================================
CREATE TABLE elevator_pitches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Min pitch',
  content TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 30,  -- Target duration
  pitch_type TEXT NOT NULL CHECK (pitch_type IN ('general', 'job-specific', 'networking', 'interview')),
  target_audience TEXT,                 -- Who is this pitch for?
  key_points TEXT[] DEFAULT '{}',       -- Main talking points
  is_favorite BOOLEAN DEFAULT false,
  practice_count INTEGER DEFAULT 0,
  last_practiced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for user queries
CREATE INDEX idx_elevator_pitches_user_id ON elevator_pitches(user_id);
CREATE INDEX idx_elevator_pitches_type ON elevator_pitches(pitch_type);
CREATE INDEX idx_elevator_pitches_favorite ON elevator_pitches(user_id, is_favorite) WHERE is_favorite = true;

-- ============================================================================
-- VISIBILITY PROGRESS
-- Tracks which visibility strategies user has tried
-- ============================================================================
CREATE TABLE visibility_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_id TEXT NOT NULL,            -- Matches the tip ID from code
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, strategy_id)
);

-- Index for user queries
CREATE INDEX idx_visibility_progress_user_id ON visibility_progress(user_id);
CREATE INDEX idx_visibility_progress_status ON visibility_progress(status);

-- ============================================================================
-- CONTENT CALENDAR
-- User's planned content/posts
-- ============================================================================
CREATE TABLE content_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'twitter', 'blog', 'other')),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'published', 'skipped')) DEFAULT 'draft',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for user queries
CREATE INDEX idx_content_calendar_user_id ON content_calendar(user_id);
CREATE INDEX idx_content_calendar_date ON content_calendar(scheduled_date);
CREATE INDEX idx_content_calendar_status ON content_calendar(status);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE personal_brand_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE elevator_pitches ENABLE ROW LEVEL SECURITY;
ALTER TABLE visibility_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can view own brand audit" ON personal_brand_audit
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand audit" ON personal_brand_audit
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand audit" ON personal_brand_audit
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand audit" ON personal_brand_audit
  FOR DELETE USING (auth.uid() = user_id);

-- Portfolio items
CREATE POLICY "Users can view own portfolio items" ON portfolio_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolio items" ON portfolio_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolio items" ON portfolio_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolio items" ON portfolio_items
  FOR DELETE USING (auth.uid() = user_id);

-- Elevator pitches
CREATE POLICY "Users can view own pitches" ON elevator_pitches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pitches" ON elevator_pitches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pitches" ON elevator_pitches
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pitches" ON elevator_pitches
  FOR DELETE USING (auth.uid() = user_id);

-- Visibility progress
CREATE POLICY "Users can view own visibility progress" ON visibility_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own visibility progress" ON visibility_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own visibility progress" ON visibility_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own visibility progress" ON visibility_progress
  FOR DELETE USING (auth.uid() = user_id);

-- Content calendar
CREATE POLICY "Users can view own content calendar" ON content_calendar
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own content calendar" ON content_calendar
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own content calendar" ON content_calendar
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own content calendar" ON content_calendar
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================
CREATE TRIGGER update_personal_brand_audit_updated_at
  BEFORE UPDATE ON personal_brand_audit
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_items_updated_at
  BEFORE UPDATE ON portfolio_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_elevator_pitches_updated_at
  BEFORE UPDATE ON elevator_pitches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visibility_progress_updated_at
  BEFORE UPDATE ON visibility_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_calendar_updated_at
  BEFORE UPDATE ON content_calendar
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
