-- Shared Resources - For sharing AI conversations and other resources with consultants
-- This enables participants to share insights from AI Team with their consultants

CREATE TABLE IF NOT EXISTS shared_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('ai_conversation', 'note', 'document')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_shared_resources_user_id
ON shared_resources(user_id);

CREATE INDEX IF NOT EXISTS idx_shared_resources_type
ON shared_resources(resource_type);

-- Enable RLS
ALTER TABLE shared_resources ENABLE ROW LEVEL SECURITY;

-- Users can view and manage their own shared resources
CREATE POLICY "Users can view own shared resources"
ON shared_resources FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shared resources"
ON shared_resources FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shared resources"
ON shared_resources FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shared resources"
ON shared_resources FOR DELETE
USING (auth.uid() = user_id);

-- Consultants can view resources shared by their participants
-- This uses the existing invitations table to determine consultant-participant relationships
CREATE POLICY "Consultants can view participant shared resources"
ON shared_resources FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM invitations
    WHERE invitations.used_by = shared_resources.user_id
    AND invitations.consultant_id = auth.uid()
    AND invitations.used_at IS NOT NULL
  )
);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_shared_resources_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER shared_resources_updated_at
  BEFORE UPDATE ON shared_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_shared_resources_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON shared_resources TO authenticated;
