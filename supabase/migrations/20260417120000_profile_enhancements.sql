-- Migration: Profile Enhancements
-- Adds tables for: documents, skills, sharing, history, notifications, visibility

-- ============================================
-- 1. Profile Documents (certifikat, intyg, etc)
-- ============================================
CREATE TABLE IF NOT EXISTS profile_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  name text NOT NULL,
  type text NOT NULL, -- 'certificate', 'degree', 'reference', 'other'
  description text,
  file_url text NOT NULL,
  file_size integer,
  mime_type text,

  -- Optional metadata
  issuer text,
  issue_date date,
  expiry_date date,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profile_documents_user_id_idx ON profile_documents(user_id);

ALTER TABLE profile_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents"
  ON profile_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON profile_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON profile_documents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON profile_documents FOR DELETE
  USING (auth.uid() = user_id);

GRANT ALL ON profile_documents TO authenticated;

-- ============================================
-- 2. Profile Skills (kompetenser med nivåer)
-- ============================================
CREATE TABLE IF NOT EXISTS profile_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  name text NOT NULL,
  category text DEFAULT 'other', -- 'technical', 'soft', 'language', 'tool', 'certification', 'other'
  level integer DEFAULT 3 CHECK (level >= 1 AND level <= 5), -- 1-5 scale
  years_experience numeric(4,1), -- e.g., 2.5 years
  verified boolean DEFAULT false,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS profile_skills_user_id_idx ON profile_skills(user_id);

ALTER TABLE profile_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own skills"
  ON profile_skills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skills"
  ON profile_skills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skills"
  ON profile_skills FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own skills"
  ON profile_skills FOR DELETE
  USING (auth.uid() = user_id);

GRANT ALL ON profile_skills TO authenticated;

-- ============================================
-- 3. Profile Shares (delbara profillänkar)
-- ============================================
CREATE TABLE IF NOT EXISTS profile_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  share_code text UNIQUE NOT NULL,
  name text, -- e.g., "Jobbansökan Volvo"

  -- What's visible in this share
  show_contact boolean DEFAULT true,
  show_skills boolean DEFAULT true,
  show_experience boolean DEFAULT true,
  show_education boolean DEFAULT true,
  show_documents boolean DEFAULT false,
  show_summary boolean DEFAULT true,

  -- Access control
  password_hash text, -- optional password protection
  max_views integer,
  view_count integer DEFAULT 0,
  expires_at timestamptz,

  -- Tracking
  last_viewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profile_shares_user_id_idx ON profile_shares(user_id);
CREATE INDEX IF NOT EXISTS profile_shares_share_code_idx ON profile_shares(share_code);

ALTER TABLE profile_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shares"
  ON profile_shares FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shares"
  ON profile_shares FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shares"
  ON profile_shares FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shares"
  ON profile_shares FOR DELETE
  USING (auth.uid() = user_id);

-- Allow public read for share lookups (by share_code)
CREATE POLICY "Public can view shares by code"
  ON profile_shares FOR SELECT
  USING (true);

GRANT SELECT ON profile_shares TO anon;
GRANT ALL ON profile_shares TO authenticated;

-- ============================================
-- 4. Profile History (ändringshistorik)
-- ============================================
CREATE TABLE IF NOT EXISTS profile_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  field_name text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  change_type text DEFAULT 'update', -- 'create', 'update', 'delete'

  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profile_history_user_id_idx ON profile_history(user_id);
CREATE INDEX IF NOT EXISTS profile_history_created_at_idx ON profile_history(created_at DESC);

ALTER TABLE profile_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own history"
  ON profile_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history"
  ON profile_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

GRANT ALL ON profile_history TO authenticated;

-- ============================================
-- 5. Notification Settings
-- ============================================
CREATE TABLE IF NOT EXISTS notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Email notifications
  email_job_matches boolean DEFAULT true,
  email_application_updates boolean DEFAULT true,
  email_weekly_summary boolean DEFAULT true,
  email_tips_and_resources boolean DEFAULT false,
  email_consultant_messages boolean DEFAULT true,

  -- Push notifications
  push_enabled boolean DEFAULT false,
  push_job_matches boolean DEFAULT true,
  push_deadlines boolean DEFAULT true,
  push_achievements boolean DEFAULT true,

  -- In-app notifications
  inapp_enabled boolean DEFAULT true,
  inapp_job_matches boolean DEFAULT true,
  inapp_tips boolean DEFAULT true,

  -- Frequency
  digest_frequency text DEFAULT 'daily', -- 'realtime', 'daily', 'weekly', 'never'
  quiet_hours_start time,
  quiet_hours_end time,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification settings"
  ON notification_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings"
  ON notification_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings"
  ON notification_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT ALL ON notification_settings TO authenticated;

-- ============================================
-- 6. Visibility Settings
-- ============================================
CREATE TABLE IF NOT EXISTS visibility_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Profile visibility
  profile_visible_to text DEFAULT 'consultant', -- 'public', 'consultant', 'private'

  -- Section visibility
  show_email boolean DEFAULT false,
  show_phone boolean DEFAULT false,
  show_location boolean DEFAULT true,
  show_full_name boolean DEFAULT true,
  show_photo boolean DEFAULT true,
  show_summary boolean DEFAULT true,
  show_skills boolean DEFAULT true,
  show_experience boolean DEFAULT true,
  show_education boolean DEFAULT true,
  show_documents boolean DEFAULT false,
  show_interests boolean DEFAULT true,
  show_goals boolean DEFAULT false,
  show_activity boolean DEFAULT false,

  -- Consultant specific
  share_with_consultant boolean DEFAULT true,
  consultant_can_edit boolean DEFAULT false,

  -- Job search visibility
  visible_to_employers boolean DEFAULT false,
  searchable_profile boolean DEFAULT false,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE visibility_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own visibility settings"
  ON visibility_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own visibility settings"
  ON visibility_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own visibility settings"
  ON visibility_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT ALL ON visibility_settings TO authenticated;

-- ============================================
-- 7. Profile Summary (AI-generated)
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_summary text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_summary_updated_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_image_url text;

-- ============================================
-- 8. Storage bucket for profile images and documents
-- ============================================
-- Note: Storage buckets are created via Supabase dashboard or management API
-- This is just documentation of the expected structure:
-- - Bucket: 'profile-images' (public)
-- - Bucket: 'profile-documents' (private)
