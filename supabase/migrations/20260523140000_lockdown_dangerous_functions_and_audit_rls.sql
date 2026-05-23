-- ============================================
-- Lockdown of dangerous SECURITY DEFINER functions, search_path-fixes
-- on remaining DEFINER funcs, hardened RLS on audit tables, and
-- removal of duplicate broad storage policy on profile-images.
-- Date: 2026-05-23
--
-- Categories addressed (Supabase linter):
--   1. anon_security_definer_function_executable — 8 dangerous functions
--   2. function_search_path_mutable — 3 DEFINER funcs missing search_path
--   3. rls_policy_always_true — 3 audit tables with WITH CHECK (true)
--   4. public_bucket_allows_listing — duplicate broad SELECT on profile-images
--
-- App-code verification (before this migration):
--   sta_bulk_invite, revoke_consultant_link, request_account_deletion,
--   cancel_account_deletion, execute_account_deletion_immediate
--     → called from client/src/services/{staApi,accountApi}.ts as
--       authenticated user. Safe to revoke anon.
--   grant_consent, withdraw_consent
--     → only called from supabase/functions/delete-account/index.ts
--       which uses service_role. Safe to revoke anon AND authenticated.
--   handle_new_user, handle_invitation_acceptance
--     → trigger functions. Triggers fire regardless of EXECUTE grants;
--       revoking only prevents direct RPC abuse.
--   update_last_login
--     → no client/edge usage found; presumed trigger or server-side.
--       Revoke from anon+authenticated for safety.
-- ============================================

-- ---------- 1. Revoke EXECUTE from anon (and where applicable, authenticated) ----------

-- Trigger functions: revoke from ALL client-facing roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_invitation_acceptance() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_last_login() FROM anon, authenticated, public;

-- Service-role-only consent functions (called from delete-account edge function)
REVOKE EXECUTE ON FUNCTION public.grant_consent(text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.withdraw_consent(text) FROM anon, authenticated, public;

-- Authenticated-user functions: revoke anon only (app calls as authenticated)
REVOKE EXECUTE ON FUNCTION public.request_account_deletion(text, integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.cancel_account_deletion() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.execute_account_deletion_immediate() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.sta_bulk_invite(jsonb, date, text, jsonb) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.revoke_consultant_link(uuid, text) FROM anon, public;


-- ---------- 2. Lock search_path on 3 DEFINER functions missing it ----------
ALTER FUNCTION public.handle_invitation_acceptance() SET search_path = 'public';
ALTER FUNCTION public.revoke_consultant_link(uuid, text) SET search_path = 'public';
ALTER FUNCTION public.sta_bulk_invite(jsonb, date, text, jsonb) SET search_path = 'public';


-- ---------- 3. Tighten audit-table INSERT policies ----------
-- Currently all three have WITH CHECK (true) → any role can write fake rows.
-- DEFINER logging functions (log_user_activity, log_application_*, log_profile_changes,
-- check_login_rate_limit, etc.) run as owner=postgres and bypass RLS regardless
-- of policy, so tightening these policies does NOT break the audit pipeline —
-- it only blocks direct client INSERTs which were never intended.

-- admin_audit_log: only service_role may insert directly
DROP POLICY IF EXISTS "System can insert audit logs" ON public.admin_audit_log;
CREATE POLICY "Service role can insert audit logs"
  ON public.admin_audit_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- consent_history: own-row inserts only (DEFINER funcs still bypass via owner)
DROP POLICY IF EXISTS "System can insert consent records" ON public.consent_history;
CREATE POLICY "Users can insert own consent records"
  ON public.consent_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- login_attempts: only service_role / DEFINER-funcs may write
DROP POLICY IF EXISTS "System can insert login attempts" ON public.login_attempts;
CREATE POLICY "Service role can insert login attempts"
  ON public.login_attempts
  FOR INSERT
  TO service_role
  WITH CHECK (true);


-- ---------- 4. Drop duplicate broad SELECT policy on profile-images ----------
-- The auto-generated `Allow public read h83o5u_0` is a no-bucket-filter
-- read-all policy. The intentional `Public can view profile images` already
-- covers profile-images viewing; the duplicate just widens listing.
DROP POLICY IF EXISTS "Allow public read h83o5u_0" ON storage.objects;
