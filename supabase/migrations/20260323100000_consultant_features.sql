-- Consultant Features Migration
-- Creates tables for messages, meetings, goals, journal, and placements

-- ==================== MESSAGES ====================
CREATE TABLE IF NOT EXISTS consultant_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_consultant_messages_sender ON consultant_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_consultant_messages_receiver ON consultant_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_consultant_messages_created ON consultant_messages(created_at DESC);

-- RLS for messages
ALTER TABLE consultant_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages" ON consultant_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON consultant_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receivers can update read status" ON consultant_messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- ==================== MEETINGS ====================
CREATE TABLE IF NOT EXISTS consultant_meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  meeting_type VARCHAR(20) DEFAULT 'video' CHECK (meeting_type IN ('video', 'phone', 'physical')),
  meeting_link TEXT,
  location TEXT,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for meetings
CREATE INDEX IF NOT EXISTS idx_consultant_meetings_consultant ON consultant_meetings(consultant_id);
CREATE INDEX IF NOT EXISTS idx_consultant_meetings_participant ON consultant_meetings(participant_id);
CREATE INDEX IF NOT EXISTS idx_consultant_meetings_scheduled ON consultant_meetings(scheduled_at);

-- RLS for meetings
ALTER TABLE consultant_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultants can manage their meetings" ON consultant_meetings
  FOR ALL USING (auth.uid() = consultant_id);

CREATE POLICY "Participants can view their meetings" ON consultant_meetings
  FOR SELECT USING (auth.uid() = participant_id);

-- ==================== GOALS ====================
CREATE TABLE IF NOT EXISTS consultant_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  specific TEXT,
  measurable TEXT,
  achievable TEXT,
  relevant TEXT,
  time_bound TEXT,
  priority VARCHAR(10) DEFAULT 'MEDIUM' CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
  status VARCHAR(20) DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  deadline TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for goals
CREATE INDEX IF NOT EXISTS idx_consultant_goals_consultant ON consultant_goals(consultant_id);
CREATE INDEX IF NOT EXISTS idx_consultant_goals_participant ON consultant_goals(participant_id);
CREATE INDEX IF NOT EXISTS idx_consultant_goals_status ON consultant_goals(status);
CREATE INDEX IF NOT EXISTS idx_consultant_goals_deadline ON consultant_goals(deadline);

-- RLS for goals
ALTER TABLE consultant_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultants can manage their goals" ON consultant_goals
  FOR ALL USING (auth.uid() = consultant_id);

CREATE POLICY "Participants can view their goals" ON consultant_goals
  FOR SELECT USING (auth.uid() = participant_id);

-- ==================== JOURNAL ====================
CREATE TABLE IF NOT EXISTS consultant_journal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  category VARCHAR(20) DEFAULT 'GENERAL' CHECK (category IN ('GENERAL', 'PROGRESS', 'CONCERN', 'GOAL')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for journal
CREATE INDEX IF NOT EXISTS idx_consultant_journal_consultant ON consultant_journal(consultant_id);
CREATE INDEX IF NOT EXISTS idx_consultant_journal_participant ON consultant_journal(participant_id);
CREATE INDEX IF NOT EXISTS idx_consultant_journal_created ON consultant_journal(created_at DESC);

-- RLS for journal
ALTER TABLE consultant_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultants can manage their journal entries" ON consultant_journal
  FOR ALL USING (auth.uid() = consultant_id);

-- ==================== PLACEMENTS ====================
CREATE TABLE IF NOT EXISTS consultant_placements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  employer_name VARCHAR(255) NOT NULL,
  job_title VARCHAR(255),
  start_date DATE,
  salary_range VARCHAR(100),
  placement_type VARCHAR(20) DEFAULT 'permanent' CHECK (placement_type IN ('permanent', 'temp', 'trial')),
  followup_3m BOOLEAN DEFAULT FALSE,
  followup_6m BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for placements
CREATE INDEX IF NOT EXISTS idx_consultant_placements_consultant ON consultant_placements(consultant_id);
CREATE INDEX IF NOT EXISTS idx_consultant_placements_participant ON consultant_placements(participant_id);
CREATE INDEX IF NOT EXISTS idx_consultant_placements_created ON consultant_placements(created_at DESC);

-- RLS for placements
ALTER TABLE consultant_placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultants can manage their placements" ON consultant_placements
  FOR ALL USING (auth.uid() = consultant_id);

-- ==================== GOAL TEMPLATES ====================
CREATE TABLE IF NOT EXISTS consultant_goal_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  specific TEXT,
  measurable TEXT,
  achievable TEXT,
  relevant TEXT,
  time_bound TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for goal templates
CREATE INDEX IF NOT EXISTS idx_consultant_goal_templates_consultant ON consultant_goal_templates(consultant_id);
CREATE INDEX IF NOT EXISTS idx_consultant_goal_templates_category ON consultant_goal_templates(category);
CREATE INDEX IF NOT EXISTS idx_consultant_goal_templates_public ON consultant_goal_templates(is_public);

-- RLS for goal templates
ALTER TABLE consultant_goal_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultants can manage their templates" ON consultant_goal_templates
  FOR ALL USING (auth.uid() = consultant_id OR is_public = TRUE);

CREATE POLICY "Anyone can view public templates" ON consultant_goal_templates
  FOR SELECT USING (is_public = TRUE);

-- ==================== JOB COLLECTIONS ====================
CREATE TABLE IF NOT EXISTS consultant_job_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  industry VARCHAR(100),
  job_ids TEXT[] DEFAULT '{}',
  shared_with UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for job collections
CREATE INDEX IF NOT EXISTS idx_consultant_job_collections_consultant ON consultant_job_collections(consultant_id);

-- RLS for job collections
ALTER TABLE consultant_job_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultants can manage their collections" ON consultant_job_collections
  FOR ALL USING (auth.uid() = consultant_id OR auth.uid() = ANY(shared_with));

-- ==================== CONSULTANT SETTINGS ====================
CREATE TABLE IF NOT EXISTS consultant_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultant_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notifications JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for consultant settings
ALTER TABLE consultant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultants can manage their settings" ON consultant_settings
  FOR ALL USING (auth.uid() = consultant_id);

-- ==================== FUNCTIONS ====================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_consultant_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_consultant_messages_updated_at ON consultant_messages;
CREATE TRIGGER update_consultant_messages_updated_at
  BEFORE UPDATE ON consultant_messages
  FOR EACH ROW EXECUTE FUNCTION update_consultant_updated_at();

DROP TRIGGER IF EXISTS update_consultant_meetings_updated_at ON consultant_meetings;
CREATE TRIGGER update_consultant_meetings_updated_at
  BEFORE UPDATE ON consultant_meetings
  FOR EACH ROW EXECUTE FUNCTION update_consultant_updated_at();

DROP TRIGGER IF EXISTS update_consultant_goals_updated_at ON consultant_goals;
CREATE TRIGGER update_consultant_goals_updated_at
  BEFORE UPDATE ON consultant_goals
  FOR EACH ROW EXECUTE FUNCTION update_consultant_updated_at();

DROP TRIGGER IF EXISTS update_consultant_job_collections_updated_at ON consultant_job_collections;
CREATE TRIGGER update_consultant_job_collections_updated_at
  BEFORE UPDATE ON consultant_job_collections
  FOR EACH ROW EXECUTE FUNCTION update_consultant_updated_at();

DROP TRIGGER IF EXISTS update_consultant_settings_updated_at ON consultant_settings;
CREATE TRIGGER update_consultant_settings_updated_at
  BEFORE UPDATE ON consultant_settings
  FOR EACH ROW EXECUTE FUNCTION update_consultant_updated_at();

-- Function to increment template usage count
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE consultant_goal_templates
  SET usage_count = usage_count + 1
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
