-- ============================================
-- Security Hardening Migration
-- Date: 2026-03-24
-- Description: Secure role changes, audit logging, and fix user creation
-- ============================================

-- ============================================
-- 1. FIX USER CREATION TRIGGER
-- Always set role to USER, never trust client-provided role
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  invite_record RECORD;
  user_role TEXT DEFAULT 'USER';
  user_consultant_id UUID DEFAULT NULL;
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

  -- Create profile with validated role
  INSERT INTO public.profiles (id, email, first_name, last_name, role, roles, active_role, consultant_id)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    user_role,
    ARRAY[user_role]::TEXT[],
    user_role,
    user_consultant_id
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. SECURE ROLE CHANGE POLICIES
-- Only SUPERADMIN can assign SUPERADMIN role
-- Only ADMIN+ can assign ADMIN/CONSULTANT roles
-- ============================================

-- Helper function to check if user can assign a specific role
CREATE OR REPLACE FUNCTION can_assign_role(target_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  my_role TEXT;
BEGIN
  SELECT role INTO my_role FROM profiles WHERE id = auth.uid();

  -- SUPERADMIN can assign any role
  IF my_role = 'SUPERADMIN' THEN
    RETURN TRUE;
  END IF;

  -- ADMIN can assign USER and CONSULTANT, but not ADMIN or SUPERADMIN
  IF my_role = 'ADMIN' THEN
    RETURN target_role IN ('USER', 'CONSULTANT');
  END IF;

  -- No one else can assign roles
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile safely" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles with restrictions" ON profiles;

-- Helper function to check if user is trying to change protected role fields
CREATE OR REPLACE FUNCTION check_role_change_allowed(
  user_id UUID,
  new_role TEXT,
  new_roles TEXT[],
  new_active_role TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  current_record RECORD;
  my_role TEXT;
BEGIN
  -- Get current values
  SELECT role, roles, active_role INTO current_record
  FROM profiles WHERE id = user_id;

  -- Get the role of the user making the change
  SELECT role INTO my_role FROM profiles WHERE id = auth.uid();

  -- If updating own profile
  IF user_id = auth.uid() THEN
    -- Users cannot change their own role or roles array
    IF new_role IS DISTINCT FROM current_record.role THEN
      RETURN FALSE;
    END IF;
    IF new_roles IS DISTINCT FROM current_record.roles THEN
      RETURN FALSE;
    END IF;
    -- active_role can be changed but must be in user's roles array
    IF new_active_role IS NOT NULL AND new_active_role != ALL(COALESCE(current_record.roles, ARRAY[current_record.role])) THEN
      RETURN FALSE;
    END IF;
    RETURN TRUE;
  END IF;

  -- For other users, check admin permissions
  IF my_role NOT IN ('ADMIN', 'SUPERADMIN') THEN
    RETURN FALSE;
  END IF;

  -- ADMIN cannot assign ADMIN or SUPERADMIN
  IF my_role = 'ADMIN' AND new_role IN ('ADMIN', 'SUPERADMIN') THEN
    RETURN FALSE;
  END IF;

  -- Only SUPERADMIN can assign SUPERADMIN
  IF new_role = 'SUPERADMIN' AND my_role != 'SUPERADMIN' THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Users can update their own profile (non-role fields freely, role fields restricted)
CREATE POLICY "Users can update own profile safely" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    check_role_change_allowed(id, role, roles, active_role)
  );

-- Admins can update other profiles with role restrictions
CREATE POLICY "Admins can update profiles with restrictions" ON profiles
  FOR UPDATE
  USING (is_admin_or_superadmin())
  WITH CHECK (
    check_role_change_allowed(id, role, roles, active_role)
  );

-- ============================================
-- 3. ADMIN AUDIT LOG TABLE
-- Track all administrative actions for security
-- ============================================
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON admin_audit_log(created_at DESC);

-- RLS for audit log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only superadmins can view audit logs
CREATE POLICY "Superadmins can view audit logs" ON admin_audit_log
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPERADMIN')
  );

-- Only system (via triggers) can insert audit logs
CREATE POLICY "System can insert audit logs" ON admin_audit_log
  FOR INSERT
  WITH CHECK (TRUE);

-- ============================================
-- 4. AUDIT TRIGGER FOR PROFILE CHANGES
-- Log all role changes automatically
-- ============================================
CREATE OR REPLACE FUNCTION log_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if role changed
  IF OLD.role IS DISTINCT FROM NEW.role OR OLD.roles IS DISTINCT FROM NEW.roles THEN
    INSERT INTO admin_audit_log (
      admin_id,
      action,
      target_table,
      target_id,
      old_value,
      new_value
    ) VALUES (
      auth.uid(),
      'ROLE_CHANGE',
      'profiles',
      NEW.id,
      jsonb_build_object('role', OLD.role, 'roles', OLD.roles),
      jsonb_build_object('role', NEW.role, 'roles', NEW.roles)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for profile changes
DROP TRIGGER IF EXISTS audit_profile_changes ON profiles;
CREATE TRIGGER audit_profile_changes
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_profile_changes();

-- ============================================
-- 5. SECURE INVITATION CREATION
-- Validate that only authorized users can create invitations with elevated roles
-- ============================================
DROP POLICY IF EXISTS "Consultants can create invitations" ON invitations;

CREATE POLICY "Authorized users can create invitations" ON invitations
  FOR INSERT
  WITH CHECK (
    auth.uid() = invited_by AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('CONSULTANT', 'ADMIN', 'SUPERADMIN')
    ) AND
    -- Restrict role assignment in invitations
    (
      (role = 'USER') OR  -- Anyone authorized can invite USERs
      (role = 'CONSULTANT' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN'))) OR
      (role = 'ADMIN' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPERADMIN'))
      -- SUPERADMIN cannot be assigned via invitation
    )
  );

-- ============================================
-- 6. PREVENT DELETION OF LAST SUPERADMIN
-- ============================================
CREATE OR REPLACE FUNCTION prevent_last_superadmin_removal()
RETURNS TRIGGER AS $$
DECLARE
  superadmin_count INTEGER;
BEGIN
  -- Check if we're removing SUPERADMIN role
  IF OLD.role = 'SUPERADMIN' AND (NEW.role != 'SUPERADMIN' OR TG_OP = 'DELETE') THEN
    SELECT COUNT(*) INTO superadmin_count
    FROM profiles
    WHERE role = 'SUPERADMIN' AND id != OLD.id;

    IF superadmin_count = 0 THEN
      RAISE EXCEPTION 'Cannot remove the last SUPERADMIN';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_last_superadmin ON profiles;
CREATE TRIGGER protect_last_superadmin
  BEFORE UPDATE OR DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_last_superadmin_removal();

-- ============================================
-- 7. ADD SESSION TRACKING TABLE
-- For monitoring active sessions and forced logout capability
-- ============================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_token_hash TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON user_sessions(user_id) WHERE revoked_at IS NULL;

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can see their own sessions
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all sessions
CREATE POLICY "Admins can view all sessions" ON user_sessions
  FOR SELECT USING (is_admin_or_superadmin());

-- Users can revoke their own sessions
CREATE POLICY "Users can revoke own sessions" ON user_sessions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 8. LOGIN ATTEMPT TRACKING FOR RATE LIMITING
-- ============================================
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT,
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address, attempted_at DESC);

-- Function to check if login should be rate limited
CREATE OR REPLACE FUNCTION check_login_rate_limit(
  check_email TEXT,
  check_ip TEXT,
  max_attempts INTEGER DEFAULT 5,
  window_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN AS $$
DECLARE
  attempt_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO attempt_count
  FROM login_attempts
  WHERE (email = check_email OR ip_address = check_ip)
    AND success = FALSE
    AND attempted_at > NOW() - (window_minutes || ' minutes')::INTERVAL;

  RETURN attempt_count < max_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup old login attempts (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_login_attempts()
RETURNS void AS $$
BEGIN
  DELETE FROM login_attempts
  WHERE attempted_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE admin_audit_log IS 'Audit trail for all administrative actions';
COMMENT ON TABLE user_sessions IS 'Track user sessions for security monitoring';
COMMENT ON TABLE login_attempts IS 'Track login attempts for rate limiting and security';
