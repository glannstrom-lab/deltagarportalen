-- AS2 (projektgenomgången 2026-09-07): consultant_placements kräver aktiv relation.
--
-- INTE KÖRD ÄN. RLS-ändring mot prod kräver Mikaels uttryckliga ja (CLAUDE.md).
-- Kör manuellt när klartecken finns:
--   npx supabase db query --linked -f supabase/migrations/20260908100000_as2_placements_relation.sql
-- Uppdatera sedan BÅDA snapshotarna i SAMMA commit som körningen:
--   cd client && npm run schema:refresh && npm run grants:refresh
--
-- PREMISSEN, MÄTT MOT PROD 2026-09-08
-- ----------------------------------
-- pg_policies för consultant_placements har EN rad:
--   "Consultants can manage their placements" | ALL | PERMISSIVE
--   qual = (auth.uid() = consultant_id) | with_check = NULL
-- Ingen EXISTS mot consultant_participants, ingen deltagarpolicy. with_check
-- NULL betyder att USING-uttrycket återanvänds — så en konsulent kan också
-- INSERT:a en placering för vilken deltagare som helst, bara consultant_id
-- är hennes eget. Radantal: consultant_placements 0, consultant_participants 31.
-- Ändringen är alltså strukturellt riskfri: ingen befintlig rad kan stängas ute.
--
-- Effekten som stängs: revoke_consultant_link() tar bort raden i
-- consultant_participants men rör inte consultant_placements. En återkallad
-- konsulent behöll full läs-, skriv- och raderingsrätt till placeringen
-- (arbetsgivare, titel, löneintervall, anteckningar) om en människa som
-- brutit kopplingen. KK5 (2026-09-06) skalade av GDPR-exporten i
-- SettingsTab.handleExportData till aktiv caseload — i applikationskoden,
-- inte i policyn. Det här är policyn.
--
-- MÖNSTRET är KS2 (20260831140000_ks_consultant_rls.sql), samma som AG1:s
-- consultant_work_placements och AG5:s employer_share_proposals: ägarskap
-- OCH en rad i consultant_participants, i både USING och WITH CHECK.
-- consultant_participants saknar statuskolumn — radens blotta existens ÄR
-- den aktiva relationen (samma tolkning som KS2/KS8).
--
-- VAD SOM INTE ÄNDRAS, MED FLIT
-- ----------------------------
-- · Ingen SELECT-policy för deltagaren läggs till. consultant_goals och
--   consultant_work_placements har en ("Participants can view their goals",
--   "Deltagaren ser sina platser"); consultant_placements har det inte, och
--   raden bär konsulentens fritext (notes) och löneintervall. Om deltagaren
--   ska se sin egen placeringsrad (art. 15 talar för det) är det ett eget
--   beslut — inte något som ska smygas in i en spärrmigration.
-- · Samma produktfråga som KS2 dokumenterar gäller här: vad händer med
--   HISTORISKA placeringar när relationen upphör? Grundläget efter den här
--   migrationen är (c) — raden står kvar men ingen part når den. En
--   placering är dessutom ett utfall som konsulentens uppdragsgivare (R&M)
--   räknar på; om den ska överleva relationen som statistik behövs en
--   aggregerad väg (t.ex. en vy med count, utan personuppgifter), inte
--   fortsatt radåtkomst.
--
-- KOSTNAD SOM SYNS FÖRST VID KÖRNING
-- ----------------------------------
-- Två kommentarer i klienten blir inaktuella och ska rättas i samma commit
-- (utanför den här filens räckvidd, rapporterat):
--   client/src/services/consultantService.ts:685–695 (docstring för
--     getActiveParticipantIds säger att consultant_placements SAKNAR spärren)
--   client/src/pages/consultant/SettingsTab.tsx:305–318 (samma påstående)
-- Ingen kodväg läser consultant_placements för en deltagare UTAN relation:
-- AnalyticsTab, consultantService.getAnalytics och exporten filtrerar redan
-- på consultant_id och (KK5) aktiv caseload. Den enda som förlorar rader är
-- en konsulent vars relation upphört — vilket är avsikten.

DROP POLICY IF EXISTS "Consultants can manage their placements" ON consultant_placements;

CREATE POLICY "Konsulent har access till aktiva deltagares placeringar"
  ON consultant_placements FOR ALL
  USING (
    consultant_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM consultant_participants cp
      WHERE cp.consultant_id = auth.uid()
        AND cp.participant_id = consultant_placements.participant_id
    )
  )
  WITH CHECK (
    consultant_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM consultant_participants cp
      WHERE cp.consultant_id = auth.uid()
        AND cp.participant_id = consultant_placements.participant_id
    )
  );

-- =============================================================================
-- VERIFIERING — kör EFTER körningen. Ett kommando som "gick bra" är inget
-- bevis (lärdomen 2026-08-04). Läs HELA uppsättningen: en permissiv
-- systerpolicy OR:as in och kan upphäva den här (lärdomen om profiles).
-- =============================================================================

-- 1) Strukturell kontroll — exakt EN rad, med EXISTS i både qual och with_check:
--   SELECT policyname, cmd, permissive, qual, with_check
--   FROM pg_policies WHERE tablename = 'consultant_placements';
--   → 1 rad: "Konsulent har access till aktiva deltagares placeringar" | ALL | PERMISSIVE
--     qual OCH with_check innehåller "EXISTS ( SELECT 1 FROM consultant_participants cp"

-- 2) Funktionellt prov i en RULLAD transaktion (dashboardens SQL-editor).
--    <konsulent-utan-relation> = ett konsulent-id som INTE har någon rad i
--    consultant_participants för <deltagare>; <konsulent-med-relation> har det.
--   BEGIN;
--     SET LOCAL ROLE authenticated;
--     SET LOCAL request.jwt.claims = '{"sub":"<konsulent-utan-relation>","role":"authenticated"}';
--     -- Nekande prov: INSERT ska ge ERROR 42501 (new row violates row-level security policy)
--     INSERT INTO consultant_placements (consultant_id, participant_id, employer_name)
--       VALUES ('<konsulent-utan-relation>', '<deltagare>', 'Testbolaget');
--   ROLLBACK;
--
--   BEGIN;
--     SET LOCAL ROLE authenticated;
--     SET LOCAL request.jwt.claims = '{"sub":"<konsulent-med-relation>","role":"authenticated"}';
--     -- Godkännande prov: ska lyckas (1 rad), och SELECT ska ge den tillbaka
--     INSERT INTO consultant_placements (consultant_id, participant_id, employer_name)
--       VALUES ('<konsulent-med-relation>', '<deltagare>', 'Testbolaget');
--     SELECT count(*) FROM consultant_placements WHERE participant_id = '<deltagare>';
--       → 1
--     -- Nekande prov B: samma rad, sedd av den andra konsulenten — 0 rader, inget fel
--     SET LOCAL request.jwt.claims = '{"sub":"<konsulent-utan-relation>","role":"authenticated"}';
--     SELECT count(*) FROM consultant_placements WHERE participant_id = '<deltagare>';
--       → 0
--   ROLLBACK;  -- alltid. Committa aldrig provdata.
