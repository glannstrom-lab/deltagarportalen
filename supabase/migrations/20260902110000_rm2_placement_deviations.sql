-- RM2 / AG1-rest: avvikelsen är det viktiga, inte närvaron.
--
-- BAKGRUND
-- --------
-- AG1 lånade uppföljningsmönstret från sta_workplace_followups rakt av,
-- inklusive kolumnen attendance_pct. Mikaels svar 2026-08-31 på den sista
-- öppna frågan var "avvikelsen är det viktiga" (ROADMAP, Domänsvar 5), och
-- ROADMAP säger uttryckligen att kolumnen ska BYTAS mot en avvikelsemodell,
-- inte kompletteras med en. En procentsiffra svarar inte på det någon
-- faktiskt frågar:
--   · Rusta och matcha-leverantören behöver underlag till avvikelserapporten
--     (FFU §4.4; vite 50 000 kr per tillfälle vid systematiska brister, §6.12.2).
--   · Kommunens biståndshandläggare behöver datum, orsak och BEDÖMD
--     GILTIGHET för att pröva ekonomiskt bistånd (SoL 4 kap. 4 §).
-- Båda vill ha en rad per tillfälle med en bedömning, inte ett medelvärde.
--
-- FORMEN
-- ------
-- En tabell med en rad per avvikelse, knuten till platsen. Giltig/ogiltig är
-- ett EGET fält med tre lägen där 'obedomd' är default — en avvikelse som
-- registreras samma dag är oftast inte bedömd än, och "ogiltig" får aldrig
-- vara det värde som råkar stå där för att ingen valt. Bedömningen bär vem
-- och när, eftersom det är den som blir beslutsunderlag hos någon annan.
--
-- Deltagaren ser sina egna avvikelser, inklusive bedömningen. Det är
-- uppgifter om henne som kan påverka hennes ersättning (art. 15), och det är
-- samma princip som AG1:s "deltagaren ser sin egen plats" — motsatsen till
-- journalfelet KS4.
--
-- INTE KÖRD ÄN. Kräver Mikaels ja enligt CLAUDE.md (migrationer mot prod).
-- Kör manuellt när klartecken finns:
--   npx supabase db query --linked -f supabase/migrations/20260902110000_rm2_placement_deviations.sql
-- Uppdatera snapshoten i SAMMA commit som körningen:
--   cd client && npm run schema:refresh
--
-- ⚠️ Steg 3 DROPPAR attendance_pct. Koden som skriver den
-- (components/consultant/PlaceringUppfoljningModal.tsx:41,136-137 och typen
-- i services/placeringarApi.ts:128) måste ändras i SAMMA commit som
-- körningen, annars får varje ny uppföljning 42703 undefined_column. Det är
-- avsiktligt att kolumnen inte lämnas kvar "för säkerhets skull": en kolumn
-- som finns kommer att fyllas i, och då har vi två sanningar.

-- =============================================================================
-- 1. Avvikelser
-- =============================================================================

CREATE TABLE IF NOT EXISTS consultant_work_placement_deviations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_id uuid NOT NULL REFERENCES consultant_work_placements(id) ON DELETE CASCADE,
  consultant_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  deviation_date date NOT NULL,
  -- Vad som hände. Fyra slag, inte fritext — det är vad rapporterna räknar.
  kind text NOT NULL CHECK (kind IN ('franvaro', 'sen_ankomst', 'tidig_avgang', 'avbrott')),
  -- Orsak som uppgetts (av deltagaren eller arbetsplatsen). Fritext, får vara tom.
  reason text,
  -- Vem som rapporterade — arbetsplatsen ringer oftast, ibland deltagaren själv.
  reported_by text CHECK (reported_by IS NULL OR reported_by IN ('arbetsplats', 'deltagare', 'konsulent')),

  -- Bedömningen. 'obedomd' är default MED FLIT: en oregistrerad bedömning får
  -- aldrig se ut som ett "ogiltig". Sätts bedömningen sätts också vem och när.
  validity text NOT NULL DEFAULT 'obedomd' CHECK (validity IN ('giltig', 'ogiltig', 'obedomd')),
  assessed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  assessed_at timestamptz,
  CONSTRAINT cwpd_assessment_complete CHECK (
    (validity = 'obedomd' AND assessed_at IS NULL) OR
    (validity <> 'obedomd' AND assessed_at IS NOT NULL)
  ),

  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cwpd_placement ON consultant_work_placement_deviations(placement_id);
CREATE INDEX IF NOT EXISTS idx_cwpd_date      ON consultant_work_placement_deviations(deviation_date DESC);
CREATE INDEX IF NOT EXISTS idx_cwpd_validity  ON consultant_work_placement_deviations(validity);

COMMENT ON TABLE consultant_work_placement_deviations IS
  'RM2: en rad per avvikelse (frånvaro, sen ankomst, tidig avgång, avbrott) med bedömd giltighet. Ersätter attendance_pct.';

-- -----------------------------------------------------------------------------
-- RLS — samma två policyer som uppföljningarna (AG1), samma KS2-mönster
-- -----------------------------------------------------------------------------

ALTER TABLE consultant_work_placement_deviations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deltagaren ser avvikelser på sin plats"
  ON consultant_work_placement_deviations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM consultant_work_placements p
    WHERE p.id = placement_id AND p.participant_id = auth.uid()
  ));

CREATE POLICY "Konsulent har access till avvikelser på aktiva platser"
  ON consultant_work_placement_deviations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM consultant_work_placements p
    JOIN consultant_participants cp
      ON cp.consultant_id = p.consultant_id AND cp.participant_id = p.participant_id
    WHERE p.id = placement_id AND p.consultant_id = auth.uid()
  ))
  WITH CHECK (
    consultant_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM consultant_work_placements p
      JOIN consultant_participants cp
        ON cp.consultant_id = p.consultant_id AND cp.participant_id = p.participant_id
      WHERE p.id = placement_id AND p.consultant_id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS trg_cwpd_updated_at ON consultant_work_placement_deviations;
CREATE TRIGGER trg_cwpd_updated_at
  BEFORE UPDATE ON consultant_work_placement_deviations
  FOR EACH ROW EXECUTE FUNCTION update_consultant_updated_at();

-- =============================================================================
-- 2. Uppföljningen får peka på perioden den täcker
-- =============================================================================
-- Milstolparna (vecka 1, 5, 12, 24 — Domänsvar 3) täcker en period. Utan
-- start/slut går det inte att säga "tre avvikelser sedan förra uppföljningen"
-- utan att gissa. Nullbara: befintliga rader (0 i prod) och extra
-- uppföljningar konsulenten lägger till fritt.
ALTER TABLE consultant_work_placement_followups
  ADD COLUMN IF NOT EXISTS period_start date,
  ADD COLUMN IF NOT EXISTS period_end date;

-- =============================================================================
-- 3. attendance_pct bort — byts, kompletteras inte
-- =============================================================================
-- 0 rader i prod (mätt 2026-09-01), så ingen data går förlorad. Se varningen
-- i huvudet: koden ändras i samma commit.
ALTER TABLE consultant_work_placement_followups DROP COLUMN IF EXISTS attendance_pct;

-- =============================================================================
-- Verifiering efter körning (förväntat svar utskrivet)
-- =============================================================================
-- select column_name from information_schema.columns
--   where table_name = 'consultant_work_placement_followups' and column_name in ('attendance_pct','period_start','period_end');
--   → 2 rader: period_end, period_start (INTE attendance_pct)
-- select policyname, cmd from pg_policies where tablename = 'consultant_work_placement_deviations' order by cmd;
--   → 2 rader (ALL för konsulent, SELECT för deltagare)
-- select relrowsecurity from pg_class where relname = 'consultant_work_placement_deviations';
--   → true
