-- Körd mot prod 2026-09-10 (beslut Mikael: "ja migrera") med
-- `npx supabase db query --linked -f`. Verifierat: kolumnen finns, default 'mjuk',
-- 12 befintliga rader fick 'mjuk'. Snapshoten uppdaterad i samma commit.
--
-- Grafikstil (beslut Mikael 2026-09-10): 'mjuk' (standard) eller 'action'.
-- Ligger tills vidare bara i localStorage; den här kolumnen gör valet
-- molnsparat som alla andra inställningar i user_preferences.

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS graphics_style text NOT NULL DEFAULT 'mjuk'
  CHECK (graphics_style IN ('mjuk', 'action'));

COMMENT ON COLUMN public.user_preferences.graphics_style IS
  'Grafikstil i portalen: mjuk (foto, dagsljus, standard) eller action (renderad, dramatiskt ljus). Beslut 2026-09-10.';
