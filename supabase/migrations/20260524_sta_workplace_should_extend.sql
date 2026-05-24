-- =============================================================================
-- STA — Arbetsprövning: "ska förlängas"-flagga
-- Date: 2026-05-24
--
-- Konsulenten vill kunna markera att en arbetsprövningsplats ska förlängas
-- (t.ex. när prövningen går bra och deltagaren ska stanna kvar längre, eller
-- vid övergång Del 3 → Del 4 på samma arbetsplats). Default FALSE.
-- =============================================================================

ALTER TABLE sta_workplaces
  ADD COLUMN IF NOT EXISTS should_extend BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN sta_workplaces.should_extend IS
  'Markerad av konsulent när arbetsprövningen ska förlängas (förlängd period / övergång Del 3→4 på samma plats).';
