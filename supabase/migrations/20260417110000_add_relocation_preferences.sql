-- Migration: Add relocation_preferences table for tracking relocation plans
-- Stores target regions, budget, and moving checklist progress

CREATE TABLE IF NOT EXISTS relocation_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Target and current regions
  target_regions text[] DEFAULT '{}',
  current_region text,

  -- Budget planning
  max_rent_budget integer,
  expected_salary integer,

  -- Moving checklist progress (array of completed item IDs)
  checklist_completed text[] DEFAULT '{}',

  -- Notes
  notes text,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create unique constraint on user_id (one record per user)
CREATE UNIQUE INDEX IF NOT EXISTS relocation_preferences_user_id_idx ON relocation_preferences(user_id);

-- Enable RLS
ALTER TABLE relocation_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own relocation preferences"
  ON relocation_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own relocation preferences"
  ON relocation_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own relocation preferences"
  ON relocation_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own relocation preferences"
  ON relocation_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON relocation_preferences TO authenticated;
