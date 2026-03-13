-- Migration: Add dashboard tables
-- Created: 2026-03-13

-- ============================================
-- Calendar Events Table
-- ============================================
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME,
    type TEXT DEFAULT 'event',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS view_own_events ON calendar_events;
DROP POLICY IF EXISTS insert_own_events ON calendar_events;
DROP POLICY IF EXISTS update_own_events ON calendar_events;
DROP POLICY IF EXISTS delete_own_events ON calendar_events;

-- Create policies
CREATE POLICY view_own_events ON calendar_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY insert_own_events ON calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_events ON calendar_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY delete_own_events ON calendar_events FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- Quests Table
-- ============================================
CREATE TABLE IF NOT EXISTS quests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    points INTEGER DEFAULT 10,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    assigned_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS view_own_quests ON quests;
DROP POLICY IF EXISTS insert_own_quests ON quests;
DROP POLICY IF EXISTS update_own_quests ON quests;
DROP POLICY IF EXISTS delete_own_quests ON quests;

-- Create policies
CREATE POLICY view_own_quests ON quests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY insert_own_quests ON quests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_quests ON quests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY delete_own_quests ON quests FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- User Streaks Table
-- ============================================
CREATE TABLE IF NOT EXISTS user_streaks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    streak_type TEXT NOT NULL DEFAULT 'general',
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, streak_type)
);

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS view_own_streaks ON user_streaks;
DROP POLICY IF EXISTS insert_own_streaks ON user_streaks;
DROP POLICY IF EXISTS update_own_streaks ON user_streaks;

-- Create policies
CREATE POLICY view_own_streaks ON user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY insert_own_streaks ON user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_streaks ON user_streaks FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- Function to create default daily quests
-- ============================================
CREATE OR REPLACE FUNCTION create_daily_quests(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM quests 
        WHERE user_id = p_user_id 
        AND assigned_date = CURRENT_DATE
    ) THEN
        INSERT INTO quests (user_id, title, description, category, points, assigned_date)
        VALUES 
            (p_user_id, 'Uppdatera CV', 'Lägg till ny information i ditt CV', 'cv', 10, CURRENT_DATE),
            (p_user_id, 'Skicka 1 ansökan', 'Ansök till ett jobb som intresserar dig', 'apply', 20, CURRENT_DATE),
            (p_user_id, 'Registrera mående', 'Hur mår du idag?', 'wellness', 10, CURRENT_DATE);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(date);
CREATE INDEX IF NOT EXISTS idx_quests_user_id ON quests(user_id);
CREATE INDEX IF NOT EXISTS idx_quests_assigned_date ON quests(assigned_date);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
