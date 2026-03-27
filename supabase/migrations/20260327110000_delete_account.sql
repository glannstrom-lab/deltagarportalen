-- ============================================
-- Delete Account Migration
-- Date: 2026-03-27
-- Description: GDPR Art. 17 - Right to erasure ("right to be forgotten")
-- ============================================

-- ============================================
-- 1. ACCOUNT DELETION REQUEST TABLE
-- Track deletion requests with grace period
-- ============================================
CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  scheduled_deletion_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  cancelled_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  executed_by TEXT -- 'user_confirmed' or 'scheduled_job'
);

-- Index for finding pending deletions
CREATE INDEX IF NOT EXISTS idx_deletion_requests_scheduled
  ON account_deletion_requests(scheduled_deletion_at)
  WHERE executed_at IS NULL AND cancelled_at IS NULL;

-- RLS
ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Users can see and manage their own deletion requests
CREATE POLICY "Users can view own deletion requests" ON account_deletion_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create deletion requests" ON account_deletion_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel own deletion requests" ON account_deletion_requests
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND cancelled_at IS NOT NULL);

-- ============================================
-- 2. DATA EXPORT LOG
-- Track when users export their data (GDPR Art. 20)
-- ============================================
CREATE TABLE IF NOT EXISTS data_export_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL, -- Keep email even if user is deleted
  export_type TEXT NOT NULL CHECK (export_type IN ('full', 'cv', 'cover_letters', 'activity')),
  requested_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  file_size_bytes BIGINT,
  download_count INTEGER DEFAULT 0
);

ALTER TABLE data_export_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own export logs" ON data_export_logs
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 3. FUNCTION: Request Account Deletion
-- Creates a deletion request with 14-day grace period
-- ============================================
CREATE OR REPLACE FUNCTION request_account_deletion(
  p_reason TEXT DEFAULT NULL,
  p_grace_period_days INTEGER DEFAULT 14
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_scheduled_at TIMESTAMPTZ;
  v_request_id UUID;
  v_existing_request RECORD;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Check for existing pending request
  SELECT * INTO v_existing_request
  FROM account_deletion_requests
  WHERE user_id = v_user_id
    AND executed_at IS NULL
    AND cancelled_at IS NULL
  LIMIT 1;

  IF v_existing_request.id IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Deletion request already pending',
      'scheduled_at', v_existing_request.scheduled_deletion_at
    );
  END IF;

  -- Calculate scheduled deletion date
  v_scheduled_at := NOW() + (p_grace_period_days || ' days')::INTERVAL;

  -- Create deletion request
  INSERT INTO account_deletion_requests (user_id, scheduled_deletion_at, reason)
  VALUES (v_user_id, v_scheduled_at, p_reason)
  RETURNING id INTO v_request_id;

  -- Log consent withdrawal for all consents
  INSERT INTO consent_history (user_id, consent_type, action)
  SELECT v_user_id, unnest(ARRAY['terms', 'privacy', 'ai_processing', 'marketing']), 'withdrawn';

  RETURN json_build_object(
    'success', true,
    'request_id', v_request_id,
    'scheduled_at', v_scheduled_at,
    'grace_period_days', p_grace_period_days
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. FUNCTION: Cancel Account Deletion
-- ============================================
CREATE OR REPLACE FUNCTION cancel_account_deletion()
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_request RECORD;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Find pending request
  SELECT * INTO v_request
  FROM account_deletion_requests
  WHERE user_id = v_user_id
    AND executed_at IS NULL
    AND cancelled_at IS NULL
  LIMIT 1;

  IF v_request.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No pending deletion request found');
  END IF;

  -- Cancel the request
  UPDATE account_deletion_requests
  SET cancelled_at = NOW()
  WHERE id = v_request.id;

  RETURN json_build_object('success', true, 'message', 'Deletion request cancelled');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. FUNCTION: Execute Account Deletion (Immediate)
-- For users who confirm immediate deletion
-- ============================================
CREATE OR REPLACE FUNCTION execute_account_deletion_immediate()
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get user email for audit
  SELECT email INTO v_user_email FROM profiles WHERE id = v_user_id;

  -- Mark any pending deletion request as executed
  UPDATE account_deletion_requests
  SET executed_at = NOW(), executed_by = 'user_confirmed'
  WHERE user_id = v_user_id
    AND executed_at IS NULL
    AND cancelled_at IS NULL;

  -- Log the deletion in admin audit (before deleting profile)
  INSERT INTO admin_audit_log (admin_id, action, target_table, target_id, old_value)
  VALUES (
    v_user_id,
    'ACCOUNT_DELETION',
    'profiles',
    v_user_id,
    json_build_object('email', v_user_email, 'deleted_by', 'user_request')
  );

  -- Delete from profiles (CASCADE will handle related tables)
  -- Note: auth.users deletion must be handled separately via Supabase Admin API
  DELETE FROM profiles WHERE id = v_user_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Profile and related data deleted',
    'note', 'Auth account will be deleted separately'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. FUNCTION: Get Deletion Status
-- ============================================
CREATE OR REPLACE FUNCTION get_deletion_status()
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_request RECORD;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO v_request
  FROM account_deletion_requests
  WHERE user_id = v_user_id
    AND executed_at IS NULL
    AND cancelled_at IS NULL
  ORDER BY requested_at DESC
  LIMIT 1;

  IF v_request.id IS NULL THEN
    RETURN json_build_object(
      'success', true,
      'has_pending_request', false
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'has_pending_request', true,
    'request_id', v_request.id,
    'requested_at', v_request.requested_at,
    'scheduled_at', v_request.scheduled_deletion_at,
    'days_remaining', EXTRACT(DAY FROM (v_request.scheduled_deletion_at - NOW()))::INTEGER
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. FUNCTION: Export User Data (GDPR Art. 20)
-- Returns all user data as JSON
-- ============================================
CREATE OR REPLACE FUNCTION export_user_data()
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_profile RECORD;
  v_cv RECORD;
  v_cover_letters JSON;
  v_interest_results RECORD;
  v_activities JSON;
  v_saved_jobs JSON;
  v_consent_history JSON;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get profile
  SELECT * INTO v_profile FROM profiles WHERE id = v_user_id;

  -- Get CV
  SELECT * INTO v_cv FROM cvs WHERE user_id = v_user_id;

  -- Get cover letters
  SELECT json_agg(cl) INTO v_cover_letters
  FROM cover_letters cl WHERE user_id = v_user_id;

  -- Get interest results
  SELECT * INTO v_interest_results FROM interest_results WHERE user_id = v_user_id;

  -- Get activities (last 1000)
  SELECT json_agg(a ORDER BY created_at DESC) INTO v_activities
  FROM (SELECT * FROM user_activities WHERE user_id = v_user_id LIMIT 1000) a;

  -- Get saved jobs
  SELECT json_agg(sj) INTO v_saved_jobs
  FROM saved_jobs sj WHERE user_id = v_user_id;

  -- Get consent history
  SELECT json_agg(ch ORDER BY created_at DESC) INTO v_consent_history
  FROM consent_history ch WHERE user_id = v_user_id;

  -- Log the export
  INSERT INTO data_export_logs (user_id, user_email, export_type)
  VALUES (v_user_id, v_profile.email, 'full');

  RETURN json_build_object(
    'success', true,
    'exported_at', NOW(),
    'data', json_build_object(
      'profile', row_to_json(v_profile),
      'cv', row_to_json(v_cv),
      'cover_letters', COALESCE(v_cover_letters, '[]'::json),
      'interest_results', row_to_json(v_interest_results),
      'activities', COALESCE(v_activities, '[]'::json),
      'saved_jobs', COALESCE(v_saved_jobs, '[]'::json),
      'consent_history', COALESCE(v_consent_history, '[]'::json)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION request_account_deletion IS 'GDPR Art. 17 - Request account deletion with grace period';
COMMENT ON FUNCTION cancel_account_deletion IS 'Cancel a pending account deletion request';
COMMENT ON FUNCTION execute_account_deletion_immediate IS 'Immediately delete account and all data';
COMMENT ON FUNCTION export_user_data IS 'GDPR Art. 20 - Export all user data as JSON';
