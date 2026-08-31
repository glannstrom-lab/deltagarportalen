-- AG3/KS1: förbereder consultant_placements för arbetsgivarspåret (spår AG).
--
-- Bakgrund: KS1 bygger skrivvägen till consultant_placements (dialog i
-- konsulentvyn som anropar consultantService.recordPlacement()). Spår AG:s
-- etapp 1 ska koppla en placering till en arbetsgivarpost, men den tabellen
-- finns inte än och beslutet om dess form ligger utanför KS1. För att slippa
-- en andra migration mot samma tabell när AG-etapp 1 landar läggs kolumnen
-- till redan nu — NULLBAR, utan FK, och utan att något UI sätter den.
--
-- Ingen befintlig rad påverkas (prod har 0 rader i consultant_placements
-- 2026-08-31, verifierat med `SELECT count(*) FROM consultant_placements`).
--
-- INTE KÖRD ÄN. Kräver Mikaels ja enligt CLAUDE.md (migrationer mot prod).
-- Körs manuellt när klartecken finns:
--   npx supabase db query --linked -f supabase/migrations/20260831120000_ag3_placement_company_id.sql
-- Uppdatera sedan snapshoten i SAMMA commit som körningen:
--   cd client && npm run schema:refresh

ALTER TABLE consultant_placements
  ADD COLUMN IF NOT EXISTS company_id UUID;

COMMENT ON COLUMN consultant_placements.company_id IS
  'Länk till en framtida arbetsgivartabell (spår AG, etapp 1). Ingen FK än — tabellen finns inte. Nullbar: sätts inte av något UI idag.';

-- Kontroll efter körning (ska visa kolumnen, nullable=YES, inget FK-constraint):
--   SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--   WHERE table_name = 'consultant_placements' AND column_name = 'company_id';
