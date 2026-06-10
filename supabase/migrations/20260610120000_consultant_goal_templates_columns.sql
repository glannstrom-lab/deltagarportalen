-- Konsultportalen / Resurser-fliken: koden använder is_starred (stjärnmärkning)
-- och updated_at på consultant_goal_templates, men tabellen (20260323100000)
-- har bara is_public, usage_count, created_at. Resultat i prod: 42703/400 vid
-- spara/stjärnmärk. (SELECT-felet på is_shared är rättat i koden → is_public.)
--
-- Körs manuellt (CLAUDE.md-rutinen):
--   npx supabase db query --linked -f supabase/migrations/20260610120000_consultant_goal_templates_columns.sql
--
-- Verifiera:
--   npx supabase db query --linked "SELECT column_name FROM information_schema.columns WHERE table_name = 'consultant_goal_templates';" --output table

ALTER TABLE consultant_goal_templates ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT FALSE;
ALTER TABLE consultant_goal_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
