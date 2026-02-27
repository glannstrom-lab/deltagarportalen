-- ============================================
-- Migration: Skapa tabell för CV-delning
-- ============================================

-- Tabell för CV-delningslänkar
CREATE TABLE IF NOT EXISTS cv_shares (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  share_code TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index för snabb sökning på share_code
CREATE INDEX IF NOT EXISTS idx_cv_shares_code ON cv_shares(share_code);

-- Index för att hämta användarens delningar
CREATE INDEX IF NOT EXISTS idx_cv_shares_user ON cv_shares(user_id);

-- RLS Policies
ALTER TABLE cv_shares ENABLE ROW LEVEL SECURITY;

-- Användare kan se sina egna delningar
CREATE POLICY "Users can view own CV shares" ON cv_shares
  FOR SELECT USING (auth.uid() = user_id);

-- Användare kan skapa egna delningar
CREATE POLICY "Users can create own CV shares" ON cv_shares
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Användare kan ta bort egna delningar
CREATE POLICY "Users can delete own CV shares" ON cv_shares
  FOR DELETE USING (auth.uid() = user_id);

-- Alla kan se delade CV:n (om de har rätt kod)
CREATE POLICY "Anyone can view shared CVs" ON cv_shares
  FOR SELECT USING (
    expires_at > NOW()
  );
