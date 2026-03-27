-- ============================================
-- User Consent Migration
-- Date: 2026-03-27
-- Description: Add GDPR consent tracking to profiles
-- ============================================

-- ============================================
-- 1. ADD CONSENT COLUMNS TO PROFILES
-- ============================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ai_consent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS marketing_consent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS consent_ip TEXT,
ADD COLUMN IF NOT EXISTS consent_user_agent TEXT;

-- Add comment explaining the columns
COMMENT ON COLUMN profiles.terms_accepted_at IS 'Timestamp when user accepted terms of service';
COMMENT ON COLUMN profiles.privacy_accepted_at IS 'Timestamp when user accepted privacy policy (required for GDPR)';
COMMENT ON COLUMN profiles.ai_consent_at IS 'Timestamp when user consented to AI processing of their data';
COMMENT ON COLUMN profiles.marketing_consent_at IS 'Timestamp when user consented to marketing communications (optional)';
COMMENT ON COLUMN profiles.consent_ip IS 'IP address at time of consent (for audit trail)';
COMMENT ON COLUMN profiles.consent_user_agent IS 'User agent at time of consent (for audit trail)';

-- ============================================
-- 2. CREATE CONSENT HISTORY TABLE
-- Track all consent changes for GDPR compliance
-- ============================================
CREATE TABLE IF NOT EXISTS consent_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('terms', 'privacy', 'ai_processing', 'marketing')),
  action TEXT NOT NULL CHECK (action IN ('granted', 'withdrawn')),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_consent_history_user ON consent_history(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_history_type ON consent_history(consent_type);
CREATE INDEX IF NOT EXISTS idx_consent_history_created ON consent_history(created_at DESC);

-- RLS for consent history
ALTER TABLE consent_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own consent history
CREATE POLICY "Users can view own consent history" ON consent_history
  FOR SELECT USING (auth.uid() = user_id);

-- System can insert consent records (via trigger)
CREATE POLICY "System can insert consent records" ON consent_history
  FOR INSERT WITH CHECK (TRUE);

-- Admins can view all consent history (for audit purposes)
CREATE POLICY "Admins can view all consent history" ON consent_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN'))
  );

-- ============================================
-- 3. UPDATE USER CREATION TRIGGER
-- Capture consent during registration
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  invite_record RECORD;
  user_role TEXT DEFAULT 'USER';
  user_consultant_id UUID DEFAULT NULL;
  consent_timestamp TIMESTAMPTZ DEFAULT NOW();
BEGIN
  -- Check if user was invited (has valid invitation token)
  SELECT * INTO invite_record
  FROM invitations
  WHERE email = NEW.email
    AND used_at IS NULL
    AND expires_at > NOW()
  LIMIT 1;

  -- If invited, use the role from invitation (trusted source)
  IF invite_record.id IS NOT NULL THEN
    user_role := invite_record.role;
    user_consultant_id := invite_record.consultant_id;

    -- Mark invitation as used
    UPDATE invitations
    SET used_at = NOW(), used_by = NEW.id
    WHERE id = invite_record.id;
  END IF;

  -- Create profile with validated role and consent
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    roles,
    active_role,
    consultant_id,
    terms_accepted_at,
    privacy_accepted_at,
    ai_consent_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    user_role,
    ARRAY[user_role]::TEXT[],
    user_role,
    user_consultant_id,
    -- Consent timestamps from metadata (set during registration)
    CASE WHEN (NEW.raw_user_meta_data->>'terms_accepted')::boolean = true
         THEN consent_timestamp ELSE NULL END,
    CASE WHEN (NEW.raw_user_meta_data->>'privacy_accepted')::boolean = true
         THEN consent_timestamp ELSE NULL END,
    CASE WHEN (NEW.raw_user_meta_data->>'ai_consent')::boolean = true
         THEN consent_timestamp ELSE NULL END
  )
  ON CONFLICT (id) DO UPDATE SET
    terms_accepted_at = COALESCE(profiles.terms_accepted_at, EXCLUDED.terms_accepted_at),
    privacy_accepted_at = COALESCE(profiles.privacy_accepted_at, EXCLUDED.privacy_accepted_at),
    ai_consent_at = COALESCE(profiles.ai_consent_at, EXCLUDED.ai_consent_at);

  -- Log initial consent in history
  IF (NEW.raw_user_meta_data->>'terms_accepted')::boolean = true THEN
    INSERT INTO consent_history (user_id, consent_type, action)
    VALUES (NEW.id, 'terms', 'granted');
  END IF;

  IF (NEW.raw_user_meta_data->>'privacy_accepted')::boolean = true THEN
    INSERT INTO consent_history (user_id, consent_type, action)
    VALUES (NEW.id, 'privacy', 'granted');
  END IF;

  IF (NEW.raw_user_meta_data->>'ai_consent')::boolean = true THEN
    INSERT INTO consent_history (user_id, consent_type, action)
    VALUES (NEW.id, 'ai_processing', 'granted');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. FUNCTION TO WITHDRAW CONSENT
-- For GDPR right to withdraw consent
-- ============================================
CREATE OR REPLACE FUNCTION withdraw_consent(consent_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  column_name TEXT;
BEGIN
  -- Map consent type to column
  CASE consent_type
    WHEN 'terms' THEN column_name := 'terms_accepted_at';
    WHEN 'privacy' THEN column_name := 'privacy_accepted_at';
    WHEN 'ai_processing' THEN column_name := 'ai_consent_at';
    WHEN 'marketing' THEN column_name := 'marketing_consent_at';
    ELSE RAISE EXCEPTION 'Invalid consent type: %', consent_type;
  END CASE;

  -- Update profile to remove consent timestamp
  EXECUTE format('UPDATE profiles SET %I = NULL WHERE id = $1', column_name)
  USING auth.uid();

  -- Log the withdrawal
  INSERT INTO consent_history (user_id, consent_type, action)
  VALUES (auth.uid(), consent_type, 'withdrawn');

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. FUNCTION TO GRANT CONSENT (for later use)
-- ============================================
CREATE OR REPLACE FUNCTION grant_consent(p_consent_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  column_name TEXT;
BEGIN
  -- Map consent type to column
  CASE p_consent_type
    WHEN 'terms' THEN column_name := 'terms_accepted_at';
    WHEN 'privacy' THEN column_name := 'privacy_accepted_at';
    WHEN 'ai_processing' THEN column_name := 'ai_consent_at';
    WHEN 'marketing' THEN column_name := 'marketing_consent_at';
    ELSE RAISE EXCEPTION 'Invalid consent type: %', p_consent_type;
  END CASE;

  -- Update profile to set consent timestamp
  EXECUTE format('UPDATE profiles SET %I = NOW() WHERE id = $1', column_name)
  USING auth.uid();

  -- Log the consent
  INSERT INTO consent_history (user_id, consent_type, action)
  VALUES (auth.uid(), p_consent_type, 'granted');

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. VIEW FOR USER'S CURRENT CONSENT STATUS
-- ============================================
CREATE OR REPLACE VIEW user_consent_status AS
SELECT
  id as user_id,
  terms_accepted_at IS NOT NULL as terms_accepted,
  privacy_accepted_at IS NOT NULL as privacy_accepted,
  ai_consent_at IS NOT NULL as ai_consent,
  marketing_consent_at IS NOT NULL as marketing_consent,
  terms_accepted_at,
  privacy_accepted_at,
  ai_consent_at,
  marketing_consent_at
FROM profiles
WHERE id = auth.uid();

COMMENT ON TABLE consent_history IS 'GDPR-compliant consent audit trail';
COMMENT ON VIEW user_consent_status IS 'Current consent status for authenticated user';
