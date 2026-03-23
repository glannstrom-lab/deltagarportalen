-- ============================================
-- CONSULTANT REQUESTS - Kopplingsförfrågningar
-- ============================================
-- Används när en konsulent vill koppla sig till en befintlig användare

CREATE TABLE IF NOT EXISTS consultant_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consultant_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED')),
  message TEXT, -- Valfritt meddelande från konsulenten
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(consultant_id, participant_id)
);

-- Enable RLS
ALTER TABLE consultant_requests ENABLE ROW LEVEL SECURITY;

-- Konsulenter kan skapa och se sina egna förfrågningar
CREATE POLICY "Consultants can create requests" ON consultant_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (consultant_id = auth.uid());

CREATE POLICY "Consultants can view own requests" ON consultant_requests
  FOR SELECT
  TO authenticated
  USING (consultant_id = auth.uid());

CREATE POLICY "Consultants can delete own pending requests" ON consultant_requests
  FOR DELETE
  TO authenticated
  USING (consultant_id = auth.uid() AND status = 'PENDING');

-- Deltagare kan se och uppdatera förfrågningar riktade till dem
CREATE POLICY "Participants can view requests to them" ON consultant_requests
  FOR SELECT
  TO authenticated
  USING (participant_id = auth.uid());

CREATE POLICY "Participants can respond to requests" ON consultant_requests
  FOR UPDATE
  TO authenticated
  USING (participant_id = auth.uid() AND status = 'PENDING')
  WITH CHECK (participant_id = auth.uid());

-- Index för prestanda
CREATE INDEX IF NOT EXISTS idx_consultant_requests_consultant ON consultant_requests(consultant_id);
CREATE INDEX IF NOT EXISTS idx_consultant_requests_participant ON consultant_requests(participant_id);
CREATE INDEX IF NOT EXISTS idx_consultant_requests_status ON consultant_requests(status);

-- Funktion för att acceptera förfrågan och sätta consultant_id
CREATE OR REPLACE FUNCTION accept_consultant_request(request_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  req RECORD;
BEGIN
  -- Hämta förfrågan och verifiera att den tillhör användaren
  SELECT * INTO req FROM consultant_requests
  WHERE id = request_id AND participant_id = auth.uid() AND status = 'PENDING';

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Uppdatera förfrågan
  UPDATE consultant_requests
  SET status = 'ACCEPTED', responded_at = NOW()
  WHERE id = request_id;

  -- Sätt consultant_id på deltagaren
  UPDATE profiles
  SET consultant_id = req.consultant_id
  WHERE id = req.participant_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion för att neka förfrågan
CREATE OR REPLACE FUNCTION decline_consultant_request(request_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE consultant_requests
  SET status = 'DECLINED', responded_at = NOW()
  WHERE id = request_id AND participant_id = auth.uid() AND status = 'PENDING';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
