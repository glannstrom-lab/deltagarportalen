-- =============================================================================
-- STA — Del 2 är valbar + auto-derived current_part
-- Date: 2026-05-24
--
-- Bakgrund: Del 2 ("Prova på" — kartläggning i konstruerad miljö med
-- arbetsstationer) är inte obligatorisk enligt AF. Vissa deltagare hoppar
-- direkt från Del 1 till Del 3 (arbetsprövning).
--
-- Just nu finns ingen DB-flagga för detta — alla enrollments antas inkludera
-- Del 2. Vidare står alla deltagare på current_part=1 oavsett startdatum,
-- eftersom det krävs manuell uppdatering för att flytta dem framåt.
--
-- Lösning:
--   1. includes_part_2 BOOLEAN DEFAULT TRUE — konsulenten väljer vid skapande
--      om Del 2 ska köras. Default sant (bakåtkompatibel med dagens beteende).
--   2. Klient-sidan härleder "rätt current_part" från started_at +
--      includes_part_2 (Del 1: 21d → Del 2: 35d om inkluderad → Del 3+).
--      Del 3 → Del 4 förblir manuell övergång (konsulent-/AF-beslut).
--   3. current_part-kolumnen finns kvar för bakåtkomp och som "manuell
--      override" — när konsulenten explicit flyttar någon till Del 3/4
--      skrivs den, annars härleds värdet i UI:t.
-- =============================================================================

ALTER TABLE sta_enrollments
  ADD COLUMN IF NOT EXISTS includes_part_2 BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN sta_enrollments.includes_part_2 IS
  'Om Del 2 (Prova på, 5 v i konstruerad miljö) ska köras. FALSE → Del 1 hoppar direkt till Del 3. AF-officiellt valbart.';
