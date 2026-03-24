-- ============================================
-- INTEREST GUIDE HISTORY
-- Sparar historik över tidigare genomförda tester
-- ============================================

-- Tabell för att spara historik över genomförda intressetester
CREATE TABLE IF NOT EXISTS interest_guide_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  answers JSONB NOT NULL,
  riasec_profile JSONB NOT NULL,  -- { R: 80, I: 60, A: 70, S: 50, E: 40, C: 30 }
  bigfive_profile JSONB NOT NULL, -- { openness: 75, conscientiousness: 80, ... }
  icf_profile JSONB NOT NULL,     -- { kognitiv: 4, kommunikation: 5, ... }
  strong_interest JSONB NOT NULL, -- { teknik_mekanik: 70, natur_vetenskap: 60, ... }
  top_occupations JSONB DEFAULT '[]', -- Array av topp 5 yrkesmatchningar med procent
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index för snabbare uppslag
CREATE INDEX IF NOT EXISTS idx_interest_guide_history_user_id
  ON interest_guide_history(user_id);

CREATE INDEX IF NOT EXISTS idx_interest_guide_history_completed_at
  ON interest_guide_history(user_id, completed_at DESC);

-- RLS
ALTER TABLE interest_guide_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own interest guide history" ON interest_guide_history;
CREATE POLICY "Users can read own interest guide history" ON interest_guide_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own interest guide history" ON interest_guide_history;
CREATE POLICY "Users can insert own interest guide history" ON interest_guide_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Konsulenter kan se sina deltagares historik
DROP POLICY IF EXISTS "Consultants can view participant history" ON interest_guide_history;
CREATE POLICY "Consultants can view participant history" ON interest_guide_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (p.role = 'consultant' OR p.role = 'superadmin' OR p.roles @> ARRAY['consultant']::text[] OR p.roles @> ARRAY['superadmin']::text[])
    )
    AND EXISTS (
      SELECT 1 FROM profiles participant
      WHERE participant.id = interest_guide_history.user_id
      AND participant.consultant_id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT, INSERT ON interest_guide_history TO authenticated;
