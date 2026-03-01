-- ============================================
-- FIX: Skapa invitations tabell om den saknas
-- ============================================

-- Skapa tabellen om den inte finns
CREATE TABLE IF NOT EXISTS invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'CONSULTANT', 'ADMIN')),
  invited_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  consultant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}'::jsonb,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  email_error TEXT,
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_invited_by ON invitations(invited_by);
CREATE INDEX IF NOT EXISTS idx_invitations_consultant ON invitations(consultant_id);
CREATE INDEX IF NOT EXISTS idx_invitations_expires ON invitations(expires_at);

-- RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Policies (endast om de inte finns)
DO $$
BEGIN
  -- Policy: Consultants can view their own invitations
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'invitations' 
    AND policyname = 'Consultants can view their own invitations'
  ) THEN
    CREATE POLICY "Consultants can view their own invitations" ON invitations
      FOR SELECT USING (auth.uid() = invited_by);
  END IF;

  -- Policy: Consultants can create invitations
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'invitations' 
    AND policyname = 'Consultants can create invitations'
  ) THEN
    CREATE POLICY "Consultants can create invitations" ON invitations
      FOR INSERT WITH CHECK (
        auth.uid() = invited_by AND
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('CONSULTANT', 'ADMIN', 'SUPERADMIN'))
      );
  END IF;

  -- Policy: Consultants can update their own invitations
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'invitations' 
    AND policyname = 'Consultants can update their own invitations'
  ) THEN
    CREATE POLICY "Consultants can update their own invitations" ON invitations
      FOR UPDATE USING (auth.uid() = invited_by);
  END IF;
END
$$;

-- Trigger för updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Sätt upp trigger (ta bort om den finns först)
DROP TRIGGER IF EXISTS update_invitations_updated_at ON invitations;
CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
