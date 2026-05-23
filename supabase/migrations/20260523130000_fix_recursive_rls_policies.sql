-- ============================================
-- Fix infinite recursion in RLS policies (round 3)
-- Date: 2026-05-23
--
-- The previous migration (20260523120000) added RLS policies on
-- profiles and cvs that referenced consultant_participants. But
-- consultant_participants' own RLS policy reads from profiles to
-- check admin role → infinite recursion when either table is queried.
--
-- Fix: Use the profiles.consultant_id column directly (matches the
-- pattern used by existing policies on interest_results and saved_jobs).
-- This is a column-level check on the row itself — no recursion possible.
-- profiles.consultant_id is kept in sync with consultant_participants
-- by application logic; verified aligned in prod (2 = 2).
-- ============================================

-- Drop the recursive policies
DROP POLICY IF EXISTS "Consultants can view assigned participant profiles" ON public.profiles;
DROP POLICY IF EXISTS "Consultants can view assigned participant CVs" ON public.cvs;

-- profiles: consultant may read profile rows where consultant_id points to them
CREATE POLICY "Consultants can view assigned participant profiles"
  ON public.profiles
  FOR SELECT
  USING (consultant_id = auth.uid());

-- cvs: consultant may read CVs of users whose profile has consultant_id = auth.uid()
CREATE POLICY "Consultants can view assigned participant CVs"
  ON public.cvs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = cvs.user_id
        AND p.consultant_id = auth.uid()
    )
  );
