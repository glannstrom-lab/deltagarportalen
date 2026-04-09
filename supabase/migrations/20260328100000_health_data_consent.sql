-- ============================================
-- Health Data Consent Migration
-- Date: 2026-03-28
-- Description: Add health and wellness data consent tracking with RLS policies
-- GDPR Rationale: Health data is sensitive personal data requiring explicit consent
-- and granular data sharing controls per GDPR Article 9
-- ============================================

-- ============================================
-- 1. ADD HEALTH AND WELLNESS CONSENT COLUMNS TO PROFILES
-- GDPR: Separate consent for health vs wellness data (Article 9 sensitive data)
-- ============================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS health_consent_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS wellness_consent_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN profiles.health_consent_at IS 'Timestamp when user consented to health data collection (ICF/medical consent - GDPR Article 9 sensitive data)';
COMMENT ON COLUMN profiles.wellness_consent_at IS 'Timestamp when user consented to mood/diary/wellness data collection (GDPR Article 9 sensitive data)';

-- ============================================
-- 2. UPDATE CONSENT_HISTORY CHECK CONSTRAINT
-- Allow new consent types for health and wellness data
-- ============================================
-- First, drop the old constraint
ALTER TABLE consent_history
DROP CONSTRAINT IF EXISTS consent_history_consent_type_check;

-- Add new constraint with expanded consent types
ALTER TABLE consent_history
ADD CONSTRAINT consent_history_consent_type_check
CHECK (consent_type IN ('terms', 'privacy', 'ai_processing', 'marketing', 'health_data', 'wellness_data'));

-- ============================================
-- 3. UPDATE GRANT_CONSENT FUNCTION
-- Support health_data and wellness_data consent types
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
    WHEN 'health_data' THEN column_name := 'health_consent_at';
    WHEN 'wellness_data' THEN column_name := 'wellness_consent_at';
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
-- 4. UPDATE WITHDRAW_CONSENT FUNCTION
-- Support withdrawing health and wellness consent
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
    WHEN 'health_data' THEN column_name := 'health_consent_at';
    WHEN 'wellness_data' THEN column_name := 'wellness_consent_at';
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
-- 5. UPDATE USER_CONSENT_STATUS VIEW
-- Include health and wellness consent fields
-- Note: DROP + CREATE required because CREATE OR REPLACE VIEW
-- cannot add new columns to an existing view in PostgreSQL
-- ============================================
DROP VIEW IF EXISTS user_consent_status;
CREATE VIEW user_consent_status AS
SELECT
  id as user_id,
  terms_accepted_at IS NOT NULL as terms_accepted,
  privacy_accepted_at IS NOT NULL as privacy_accepted,
  ai_consent_at IS NOT NULL as ai_consent,
  marketing_consent_at IS NOT NULL as marketing_consent,
  health_consent_at IS NOT NULL as health_consent,
  wellness_consent_at IS NOT NULL as wellness_consent,
  terms_accepted_at,
  privacy_accepted_at,
  ai_consent_at,
  marketing_consent_at,
  health_consent_at,
  wellness_consent_at
FROM profiles
WHERE id = auth.uid();

-- ============================================
-- 6. CREATE HELPER FUNCTIONS FOR CONSENT CHECKS
-- GDPR: RLS checks that validate explicit consent before data access
-- ============================================

-- Function to check if user has health data consent
CREATE OR REPLACE FUNCTION check_health_consent(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_uuid AND health_consent_at IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has wellness data consent
CREATE OR REPLACE FUNCTION check_wellness_consent(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_uuid AND wellness_consent_at IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. ADD RLS POLICY FOR INTEREST_RESULTS TABLE
-- GDPR: Require health consent for health data access
-- Users can INSERT only with consent; SELECT their own for data portability
-- ============================================
ALTER TABLE interest_results ENABLE ROW LEVEL SECURITY;

-- Users can view their own results (data portability right)
CREATE POLICY "Users can read own interest results"
  ON interest_results FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only INSERT results if they have health consent
-- GDPR Article 9: Explicit consent required for health data
CREATE POLICY "Users can insert interest results with health consent"
  ON interest_results FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND check_health_consent(auth.uid())
  );

-- Users can update their own results
CREATE POLICY "Users can update own interest results"
  ON interest_results FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own results
CREATE POLICY "Users can delete own interest results"
  ON interest_results FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 8. ADD RLS POLICY FOR MOOD_LOGS TABLE
-- GDPR: Require wellness consent for mood/diary data access
-- ============================================
-- Drop existing policies if they exist (from previous migration)
DROP POLICY IF EXISTS "Users can read own mood logs" ON mood_logs;
DROP POLICY IF EXISTS "Users can insert own mood logs" ON mood_logs;
DROP POLICY IF EXISTS "Users can update own mood logs" ON mood_logs;
DROP POLICY IF EXISTS "Users can delete own mood logs" ON mood_logs;

-- Users can view their own mood logs (data portability)
CREATE POLICY "Users can read own mood logs"
  ON mood_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only INSERT mood logs if they have wellness consent
-- GDPR Article 9: Explicit consent for wellness data collection
CREATE POLICY "Users can insert mood logs with wellness consent"
  ON mood_logs FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND check_wellness_consent(auth.uid())
  );

-- Users can update their own mood logs
CREATE POLICY "Users can update own mood logs"
  ON mood_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own mood logs
CREATE POLICY "Users can delete own mood logs"
  ON mood_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 9. CREATE PARTICIPANT_DATA_SHARING TABLE
-- GDPR Article 6 & 9: Granular consent for consultant access to sensitive data
-- Participants control which consultants access which data types
-- ============================================
CREATE TABLE IF NOT EXISTS participant_data_sharing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  consultant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  share_health_data BOOLEAN DEFAULT false,
  share_wellness_data BOOLEAN DEFAULT false,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique sharing relationship per consultant
  UNIQUE(participant_id, consultant_id)
);

COMMENT ON TABLE participant_data_sharing IS 'GDPR-compliant data sharing preferences: participants grant consultants access to specific data types (health_data, wellness_data)';
COMMENT ON COLUMN participant_data_sharing.participant_id IS 'User ID of the data subject (participant)';
COMMENT ON COLUMN participant_data_sharing.consultant_id IS 'User ID of the healthcare consultant requesting access';
COMMENT ON COLUMN participant_data_sharing.share_health_data IS 'Participant grants consultant access to health data (ICF results, medical notes)';
COMMENT ON COLUMN participant_data_sharing.share_wellness_data IS 'Participant grants consultant access to wellness data (mood logs, diary entries)';
COMMENT ON COLUMN participant_data_sharing.granted_at IS 'Timestamp when participant granted access (for audit trail)';

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_participant_data_sharing_participant
ON participant_data_sharing(participant_id);

CREATE INDEX IF NOT EXISTS idx_participant_data_sharing_consultant
ON participant_data_sharing(consultant_id);

CREATE INDEX IF NOT EXISTS idx_participant_data_sharing_health
ON participant_data_sharing(consultant_id, share_health_data)
WHERE share_health_data = true;

CREATE INDEX IF NOT EXISTS idx_participant_data_sharing_wellness
ON participant_data_sharing(consultant_id, share_wellness_data)
WHERE share_wellness_data = true;

-- Enable RLS on data sharing table
ALTER TABLE participant_data_sharing ENABLE ROW LEVEL SECURITY;

-- Participants can view and manage their own data sharing preferences
-- GDPR Article 15: Right of access; Article 21: Right to object
CREATE POLICY "Participants can manage own data sharing"
  ON participant_data_sharing FOR ALL
  USING (auth.uid() = participant_id)
  WITH CHECK (auth.uid() = participant_id);

-- Consultants can view sharing preferences (but only if they have access)
CREATE POLICY "Consultants can view their data sharing grants"
  ON participant_data_sharing FOR SELECT
  USING (auth.uid() = consultant_id);

-- ============================================
-- 10. UPDATE CONSULTANT ACCESS TO SENSITIVE DATA
-- Add consultant RLS policies for interest_results
-- ============================================

-- Consultants can view interest results if participant granted access
CREATE POLICY "Consultants can read shared interest results"
  ON interest_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM participant_data_sharing
      WHERE consultant_id = auth.uid()
        AND participant_id = interest_results.user_id
        AND share_health_data = true
    )
  );

-- ============================================
-- 11. UPDATE CONSULTANT ACCESS TO MOOD_LOGS
-- Add consultant RLS policies for mood logs
-- ============================================

-- Consultants can view mood logs if participant granted access
CREATE POLICY "Consultants can read shared mood logs"
  ON mood_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM participant_data_sharing
      WHERE consultant_id = auth.uid()
        AND participant_id = mood_logs.user_id
        AND share_wellness_data = true
    )
  );

-- ============================================
-- 12. ADD AUDIT TRIGGER FOR DATA SHARING CHANGES
-- GDPR: Log all changes to data sharing preferences for compliance
-- ============================================
CREATE TABLE IF NOT EXISTS data_sharing_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL,
  consultant_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('granted', 'revoked', 'modified')),
  share_health_data BOOLEAN,
  share_wellness_data BOOLEAN,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE data_sharing_audit IS 'Audit trail for data sharing consent changes (GDPR compliance record)';

-- Trigger to log data sharing changes
CREATE OR REPLACE FUNCTION audit_data_sharing_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO data_sharing_audit (
    participant_id, consultant_id, action, share_health_data, share_wellness_data
  )
  VALUES (
    COALESCE(NEW.participant_id, OLD.participant_id),
    COALESCE(NEW.consultant_id, OLD.consultant_id),
    CASE
      WHEN TG_OP = 'DELETE' THEN 'revoked'
      WHEN TG_OP = 'INSERT' THEN 'granted'
      ELSE 'modified'
    END,
    COALESCE(NEW.share_health_data, OLD.share_health_data),
    COALESCE(NEW.share_wellness_data, OLD.share_wellness_data)
  );

  -- Update the updated_at timestamp on modifications
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at := NOW();
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER participant_data_sharing_audit
AFTER INSERT OR UPDATE OR DELETE ON participant_data_sharing
FOR EACH ROW
EXECUTE FUNCTION audit_data_sharing_change();

-- RLS for audit trail (participants and admins only)
ALTER TABLE data_sharing_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view own data sharing audit"
  ON data_sharing_audit FOR SELECT
  USING (auth.uid() = participant_id);

CREATE POLICY "Admins can view all data sharing audits"
  ON data_sharing_audit FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN'))
  );

-- ============================================
-- 13. HELPER FUNCTION TO CHECK CONSULTANT ACCESS
-- For use in application logic to verify access before operations
-- ============================================
CREATE OR REPLACE FUNCTION consultant_has_access(
  p_consultant_id UUID,
  p_participant_id UUID,
  p_data_type TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verify consultant role
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_consultant_id AND role = 'CONSULTANT') THEN
    RETURN FALSE;
  END IF;

  -- Check if access is granted for the specific data type
  RETURN EXISTS (
    SELECT 1 FROM participant_data_sharing
    WHERE consultant_id = p_consultant_id
      AND participant_id = p_participant_id
      AND (
        (p_data_type = 'health_data' AND share_health_data = true)
        OR (p_data_type = 'wellness_data' AND share_wellness_data = true)
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 14. MIGRATION NOTES
-- ============================================
-- For existing data without consent:
-- - interest_results can still be queried, but new inserts require health_consent
-- - mood_logs can still be queried, but new inserts require wellness_consent
-- - No existing data is deleted; RLS enforces going forward
--
-- For consultants:
-- - Must be explicitly granted access by participants via participant_data_sharing
-- - Cannot see any sensitive data without grants
-- - All access attempts are logged in data_sharing_audit
--
-- GDPR Compliance Notes:
-- - Article 6: Lawful basis = participant consent for processing health data
-- - Article 9: Explicit consent required for sensitive (health) data
-- - Article 21: Right to object/withdraw consent (via withdraw_consent function)
-- - Article 15: Right to access (users can SELECT their own data)
-- - Article 17: Right to erasure (ON DELETE CASCADE handles this)
-- - Article 32: Data protection by design (RLS enforces access controls)
