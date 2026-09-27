-- ============================================================================
-- VÄNTAR PÅ MIKAELS GODKÄNNANDE — KÖRS INTE AUTOMATISKT
-- ============================================================================
-- Filnamnet har prefixet PENDING_ med flit. Döp om till
-- `20260927c_fler_passtyper.sql` (eller med tidsstämpel) när den godkänts och körts.
--
-- RK28 (rollspelet 2026-09-27): "Lägg till pass" hade bara fem typer —
-- lagens fyra plus eget jobbsökande. Konsulenten saknade SFI, studier,
-- studie- och yrkesvägledning och hälsa.
--
-- Vad: vidgar CHECK-villkoret på `activity_sessions.activity_type` med
--   'sfi', 'studier', 'vagledning', 'halsa'.
-- Bara passen. Schemamallar (`activity_template_items`) och aktivitetskatalogen
-- (`activity_catalog_items`) behåller de fem typerna; vidga dem i en egen
-- migration om mallar med de nya typerna ska gå att spara.
--
-- Villkorets namn och nuvarande innehåll uppmätt mot prod 2026-09-27:
--   activity_sessions_activity_type_check
--   CHECK (activity_type = ANY (ARRAY['motivation','language','jobsearch','workplace','jobsearch_own']))
--
-- Icke-destruktiv: ett vidare villkor avvisar inga befintliga rader.
-- Går att backa så länge ingen rad har en ny typ (se längst ner).
--
-- EFTER KÖRNING, i den här ordningen:
--   1. cd client && npm run schema:refresh
--   2. Sätt `UTOKADE_AKTIVITETSTYPER_PA = true` i client/src/services/aktivitetSchema.ts
--      — först då visas typerna i "Lägg till pass".
--   3. Vidga `ActivityType` till `PassTyp` i samma fil och ge de nya typerna
--      etiketter i läsvyerna som har egna `Record<ActivityType, …>`
--      (MinVecka.tsx, narvaroIntygPdf.ts, underlagspaketPdf.ts,
--      aktivitetsplanPdf.ts). Typkollen pekar ut dem. Annars visar de
--      `undefined` för ett SFI-pass.
--
-- Hur typerna räknas (klienten, redan byggt):
--   · Alla fyra är anvisade (`arAnvisad`) och räknas i veckosaldot.
--   · SFI och studier hålls av skolan och räknas INTE i avtalsloggen mot
--     Rusta och matcha (`arVerksamhetsledd` i aktivitetslogg.ts).
-- ============================================================================

BEGIN;

ALTER TABLE public.activity_sessions
  DROP CONSTRAINT IF EXISTS activity_sessions_activity_type_check;

ALTER TABLE public.activity_sessions
  ADD CONSTRAINT activity_sessions_activity_type_check
  CHECK (activity_type IN (
    'motivation', 'language', 'jobsearch', 'workplace', 'jobsearch_own',
    'sfi', 'studier', 'vagledning', 'halsa'
  ));

COMMIT;

-- Tillbaka (bara om ingen rad har en ny typ):
--   SELECT count(*) FROM activity_sessions WHERE activity_type IN ('sfi','studier','vagledning','halsa');  -- måste vara 0
--   ALTER TABLE public.activity_sessions DROP CONSTRAINT activity_sessions_activity_type_check;
--   ALTER TABLE public.activity_sessions ADD CONSTRAINT activity_sessions_activity_type_check
--     CHECK (activity_type IN ('motivation','language','jobsearch','workplace','jobsearch_own'));
