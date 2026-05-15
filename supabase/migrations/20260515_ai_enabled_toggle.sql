-- AI-funktioner PÅ/AV toggle (GDPR Art 21 — rätt att invända mot profilering)
-- 2026-05-15
--
-- Tidigare: Användare kunde bara dra tillbaka AI-samtycke helt (ai_consent_at = null).
-- Det är bra för fullt återkall men dåligt UX för "jag vill ha portalen men inte AI".
--
-- Nu: separat ai_enabled-flagga som default = true.
--   - Att stänga av: ai_enabled = false (samtycke kvar, AI bara avstängd)
--   - Att återaktivera: ai_enabled = true (om samtycke fortfarande finns)
--   - Att helt ångra samtycke: ai_consent_at = null (tar bort samtycke + sätter ai_enabled = false)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN profiles.ai_enabled IS
  'AI-funktioner PÅ/AV. GDPR Art 21 rätt att invända mot profilering. Default true. '
  'Användare kan stänga av AI utan att dra tillbaka samtycke helt. '
  'Effektiv AI-tillgång kräver: ai_consent_at IS NOT NULL AND ai_enabled = TRUE.';

-- När samtycke återkallas → stäng även av AI automatiskt
-- Annars kan flaggorna hamna i otydligt läge
CREATE OR REPLACE FUNCTION sync_ai_enabled_on_consent_withdrawal()
RETURNS TRIGGER AS $$
BEGIN
  -- Om ai_consent_at sätts till NULL → stäng av AI
  IF NEW.ai_consent_at IS NULL AND OLD.ai_consent_at IS NOT NULL THEN
    NEW.ai_enabled := FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_ai_enabled ON profiles;
CREATE TRIGGER trg_sync_ai_enabled
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (NEW.ai_consent_at IS DISTINCT FROM OLD.ai_consent_at)
  EXECUTE FUNCTION sync_ai_enabled_on_consent_withdrawal();
