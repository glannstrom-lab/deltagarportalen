-- Migration: Add user_adaptations table for storing workplace adaptation preferences
-- This enables cloud storage for the AdaptationTab component

CREATE TABLE IF NOT EXISTS user_adaptations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Physical adaptations
  physical_adaptations text[] DEFAULT '{}',

  -- Cognitive adaptations
  cognitive_adaptations text[] DEFAULT '{}',

  -- Organizational adaptations
  organizational_adaptations text[] DEFAULT '{}',

  -- Social adaptations
  social_adaptations text[] DEFAULT '{}',

  -- Custom notes
  notes text,

  -- Generated summary (AI or manual)
  summary text,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create unique constraint on user_id (one adaptation record per user)
CREATE UNIQUE INDEX user_adaptations_user_id_idx ON user_adaptations(user_id);

-- Enable RLS
ALTER TABLE user_adaptations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own adaptations"
  ON user_adaptations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own adaptations"
  ON user_adaptations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own adaptations"
  ON user_adaptations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own adaptations"
  ON user_adaptations FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_adaptations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_adaptations_timestamp
  BEFORE UPDATE ON user_adaptations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_adaptations_updated_at();

-- Grant permissions
GRANT ALL ON user_adaptations TO authenticated;
