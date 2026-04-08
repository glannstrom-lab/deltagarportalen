-- Migration: Spontaneous Companies (Spontanansökan)
-- Allows users to track companies for spontaneous job applications

-- Create the main table for tracking companies
CREATE TABLE IF NOT EXISTS spontaneous_companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Company identification (from Bolagsverket)
  org_number TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_data JSONB NOT NULL DEFAULT '{}',

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'saved' CHECK (status IN (
    'saved',              -- Sparad - just added
    'to_contact',         -- Att kontakta - planned for outreach
    'contacted',          -- Kontaktad - outreach sent
    'waiting',            -- Väntar svar - awaiting response
    'response_positive',  -- Intresse visat - positive response
    'response_negative',  -- Avslag - rejection
    'no_response',        -- Inget svar - no response received
    'archived'            -- Arkiverad - no longer active
  )),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),

  -- User notes
  notes TEXT,
  why_interested TEXT,

  -- Contact info (user-added)
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_linkedin TEXT,

  -- Outreach tracking
  outreach_method TEXT CHECK (outreach_method IN ('email', 'linkedin', 'phone', 'visit', 'other', NULL)),
  outreach_date DATE,
  followup_date DATE,
  response_date DATE,
  response_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Ensure one entry per company per user
  UNIQUE(user_id, org_number)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_spontaneous_companies_user
  ON spontaneous_companies(user_id);

CREATE INDEX IF NOT EXISTS idx_spontaneous_companies_status
  ON spontaneous_companies(user_id, status);

CREATE INDEX IF NOT EXISTS idx_spontaneous_companies_followup
  ON spontaneous_companies(user_id, followup_date)
  WHERE followup_date IS NOT NULL
  AND status NOT IN ('archived', 'response_positive', 'response_negative');

CREATE INDEX IF NOT EXISTS idx_spontaneous_companies_created
  ON spontaneous_companies(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE spontaneous_companies ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own companies
CREATE POLICY "Users can CRUD own spontaneous companies"
  ON spontaneous_companies
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_spontaneous_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_spontaneous_companies_updated_at
  BEFORE UPDATE ON spontaneous_companies
  FOR EACH ROW
  EXECUTE FUNCTION update_spontaneous_companies_updated_at();

-- Activity log for tracking history
CREATE TABLE IF NOT EXISTS spontaneous_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES spontaneous_companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'saved', 'status_changed', 'note_added', 'contacted', 'followup_set', 'response_received'
  )),
  old_value TEXT,
  new_value TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_spontaneous_activity_company
  ON spontaneous_activity(company_id, created_at DESC);

-- RLS for activity log
ALTER TABLE spontaneous_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity"
  ON spontaneous_activity
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity"
  ON spontaneous_activity
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON spontaneous_companies TO authenticated;
GRANT ALL ON spontaneous_activity TO authenticated;

COMMENT ON TABLE spontaneous_companies IS 'Tracks companies users want to contact for spontaneous job applications';
COMMENT ON TABLE spontaneous_activity IS 'Activity log for spontaneous company interactions';
