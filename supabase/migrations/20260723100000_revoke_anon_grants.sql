-- ============================================
-- A15 (2026-07-23): Defense-in-depth — ta bort anon-grants på PII-tabeller
-- ============================================
-- 20260316_fix_cv_save_issues.sql och 20260315_fix_user_preferences.sql
-- gjorde `GRANT ALL ... TO anon` på cvs respektive user_preferences.
-- RLS-policyerna (auth.uid() = user_id) blockerar anon idag, men
-- blankogrant:et betyder att en enda framtida policy-miss (t.ex. en ny
-- USING(true)-policy för en specialfunktion — exakt vad som hände med
-- invitations, se A10) omedelbart blir anon-exploaterbar.
-- Appen använder authenticated-rollen för alla legitima anrop.

REVOKE ALL ON cvs FROM anon;
REVOKE ALL ON user_preferences FROM anon;
