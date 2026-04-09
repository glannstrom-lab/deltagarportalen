-- Calendar Events Table
-- Stores all calendar events for users

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  end_time TIME,
  type TEXT NOT NULL CHECK (type IN ('interview', 'meeting', 'deadline', 'reminder', 'task', 'followup', 'preparation')),
  location TEXT,
  is_video BOOLEAN DEFAULT false,
  is_phone BOOLEAN DEFAULT false,
  description TEXT,
  with_person TEXT,
  job_id TEXT,
  job_application_id TEXT,
  tasks JSONB DEFAULT '[]'::jsonb,
  travel JSONB,
  interview_prep JSONB,
  is_recurring BOOLEAN DEFAULT false,
  recurring_config JSONB,
  parent_event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  reminders JSONB DEFAULT '[]'::jsonb,
  shared_with UUID[] DEFAULT '{}',
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar Goals Table
CREATE TABLE IF NOT EXISTS calendar_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('applications', 'interviews', 'meetings', 'tasks')),
  target INTEGER NOT NULL DEFAULT 5,
  period TEXT NOT NULL CHECK (period IN ('week', 'month')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mood Entries Table (separate from mood_logs for calendar-specific tracking)
CREATE TABLE IF NOT EXISTS calendar_mood_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5),
  note TEXT,
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_date ON calendar_events(user_id, date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(user_id, type);
CREATE INDEX IF NOT EXISTS idx_calendar_goals_user ON calendar_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_mood_entries_user_date ON calendar_mood_entries(user_id, date);

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_mood_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_events
DROP POLICY IF EXISTS "Users can view their own events" ON calendar_events;
CREATE POLICY "Users can view their own events" ON calendar_events
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = ANY(shared_with));

DROP POLICY IF EXISTS "Users can insert their own events" ON calendar_events;
CREATE POLICY "Users can insert their own events" ON calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own events" ON calendar_events;
CREATE POLICY "Users can update their own events" ON calendar_events
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own events" ON calendar_events;
CREATE POLICY "Users can delete their own events" ON calendar_events
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for calendar_goals
DROP POLICY IF EXISTS "Users can manage their own goals" ON calendar_goals;
CREATE POLICY "Users can manage their own goals" ON calendar_goals
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for calendar_mood_entries
DROP POLICY IF EXISTS "Users can manage their own mood entries" ON calendar_mood_entries;
CREATE POLICY "Users can manage their own mood entries" ON calendar_mood_entries
  FOR ALL USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_calendar_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON calendar_events;
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_calendar_updated_at();

DROP TRIGGER IF EXISTS update_calendar_goals_updated_at ON calendar_goals;
CREATE TRIGGER update_calendar_goals_updated_at
  BEFORE UPDATE ON calendar_goals
  FOR EACH ROW EXECUTE FUNCTION update_calendar_updated_at();

DROP TRIGGER IF EXISTS update_calendar_mood_entries_updated_at ON calendar_mood_entries;
CREATE TRIGGER update_calendar_mood_entries_updated_at
  BEFORE UPDATE ON calendar_mood_entries
  FOR EACH ROW EXECUTE FUNCTION update_calendar_updated_at();
