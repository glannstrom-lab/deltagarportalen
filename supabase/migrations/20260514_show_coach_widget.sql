-- =============================================================================
-- Toggle för CoachWidget (sidkontextuella coach-tips längst ner till höger)
-- =============================================================================
-- Default TRUE — visas för alla nya konton. Användaren kan stänga av via
-- Inställningar → Gränssnitt och visning. Persisteras tillsammans med
-- övriga settings (calm_mode, focus_mode, high_contrast osv) i user_preferences.

ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS show_coach_widget BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN user_preferences.show_coach_widget IS
  'Visar floating CoachWidget med sidkontextuella tips. Default TRUE.';
