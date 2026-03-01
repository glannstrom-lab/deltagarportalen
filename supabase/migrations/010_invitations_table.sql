-- ============================================
-- TABELL: Inbjudningar (för konsulenter att bjuda in deltagare)
-- ============================================

CREATE TABLE IF NOT EXISTS invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'CONSULTANT', 'ADMIN')),
  invited_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  consultant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Email-tracking
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  email_error TEXT,
  
  -- Status
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Utgångstid (7 dagar som standard)
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index för snabbare sökning
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_invited_by ON invitations(invited_by);
CREATE INDEX IF NOT EXISTS idx_invitations_consultant ON invitations(consultant_id);
CREATE INDEX IF NOT EXISTS idx_invitations_expires ON invitations(expires_at);

-- RLS Policies
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Konsulenter kan se sina egna inbjudningar
CREATE POLICY "Consultants can view their own invitations" ON invitations
  FOR SELECT USING (auth.uid() = invited_by);

-- Konsulenter kan skapa inbjudningar
CREATE POLICY "Consultants can create invitations" ON invitations
  FOR INSERT WITH CHECK (
    auth.uid() = invited_by AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('CONSULTANT', 'ADMIN', 'SUPERADMIN'))
  );

-- Konsulenter kan uppdatera sina egna inbjudningar
CREATE POLICY "Consultants can update their own invitations" ON invitations
  FOR UPDATE USING (auth.uid() = invited_by);

-- Trigger för uppdatering av updated_at
CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNKTION: Städa upp gamla inbjudningar
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
  DELETE FROM invitations 
  WHERE expires_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
