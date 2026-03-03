-- Create table for exercise answers
CREATE TABLE IF NOT EXISTS exercise_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_id TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, exercise_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_exercise_answers_user_id ON exercise_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_answers_exercise_id ON exercise_answers(exercise_id);

-- Enable Row Level Security
ALTER TABLE exercise_answers ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own answers
CREATE POLICY "Users can view own exercise answers"
  ON exercise_answers FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own answers
CREATE POLICY "Users can insert own exercise answers"
  ON exercise_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own answers
CREATE POLICY "Users can update own exercise answers"
  ON exercise_answers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can delete their own answers
CREATE POLICY "Users can delete own exercise answers"
  ON exercise_answers FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_exercise_answers_updated_at
  BEFORE UPDATE ON exercise_answers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE exercise_answers IS 'Stores user answers for exercises/övningar in the platform';
