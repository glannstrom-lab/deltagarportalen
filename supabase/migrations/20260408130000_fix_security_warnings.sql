-- ============================================
-- Fix Supabase Security Linter Warnings
-- Date: 2026-04-08
-- ============================================

-- ============================================
-- 1. Enable RLS on tables that have policies but RLS disabled
-- ============================================

-- article_course_links - has policies but RLS not enabled
ALTER TABLE IF EXISTS public.article_course_links ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. Enable RLS on public tables without RLS
-- ============================================

-- writing_prompts - public content, read-only for all
ALTER TABLE IF EXISTS public.writing_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view writing prompts" ON public.writing_prompts;
CREATE POLICY "Anyone can view writing prompts" ON public.writing_prompts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage writing prompts" ON public.writing_prompts;
CREATE POLICY "Admins can manage writing prompts" ON public.writing_prompts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN'))
  );

-- login_attempts - security table, only admins should view, system can insert
ALTER TABLE IF EXISTS public.login_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own login attempts" ON public.login_attempts;
CREATE POLICY "Admins can view login attempts" ON public.login_attempts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN'))
  );

DROP POLICY IF EXISTS "System can insert login attempts" ON public.login_attempts;
CREATE POLICY "System can insert login attempts" ON public.login_attempts
  FOR INSERT WITH CHECK (true);

-- articles_backup - admin only
ALTER TABLE IF EXISTS public.articles_backup ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage articles backup" ON public.articles_backup;
CREATE POLICY "Admins can manage articles backup" ON public.articles_backup
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN'))
  );

-- ============================================
-- 3. Fix SECURITY DEFINER views
-- Replace with SECURITY INVOKER (default) views
-- ============================================

-- user_consent_status - recreate without SECURITY DEFINER
DROP VIEW IF EXISTS public.user_consent_status;
CREATE VIEW public.user_consent_status AS
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

COMMENT ON VIEW public.user_consent_status IS 'Current consent status for authenticated user (SECURITY INVOKER)';

-- user_recommended_courses - set security_invoker=true instead of recreating
-- (has dependent function get_user_courses)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'user_recommended_courses' AND table_schema = 'public') THEN
    -- Use ALTER VIEW to change security setting (PostgreSQL 15+)
    ALTER VIEW public.user_recommended_courses SET (security_invoker = true);
    RAISE NOTICE '✅ user_recommended_courses set to SECURITY INVOKER';
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- If ALTER VIEW doesn't support this syntax, log it
  RAISE NOTICE '⚠️ Could not alter user_recommended_courses: %. Consider manual review.', SQLERRM;
END $$;

-- ============================================
-- 4. Verify changes
-- ============================================
DO $$
DECLARE
  rls_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO rls_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('article_course_links', 'writing_prompts', 'login_attempts', 'articles_backup')
    AND rowsecurity = true;

  IF rls_count = 4 THEN
    RAISE NOTICE '✅ All 4 tables now have RLS enabled';
  ELSE
    RAISE NOTICE '⚠️ Only % of 4 tables have RLS enabled', rls_count;
  END IF;
END $$;
