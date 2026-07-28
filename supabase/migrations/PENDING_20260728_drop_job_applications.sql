-- ============================================================================
-- VÄNTAR PÅ MIKAELS GODKÄNNANDE — KÖRS INTE AUTOMATISKT
-- ============================================================================
-- Filnamnet har prefixet PENDING_ med flit, så den inte råkar plockas upp av
-- en batchkörning. Döp om till `20260728160000_drop_job_applications.sql` när
-- den godkänts och körts.
--
-- DESTRUKTIV: DROP TABLE går inte att ångra utan backup.
-- ============================================================================
--
-- Vad: droppa `job_applications`, den parallella ansökningstabell som fasades
-- ut i E12 (2026-07-23).
--
-- Varför den kan droppas — verifierat mot prod 2026-07-28:
--   * `SELECT count(*) FROM job_applications` = **0 rader**. Den har aldrig
--     använts i skarp drift; ansökningarna ligger i `saved_jobs` (24 rader).
--   * Noll kodreferenser kvar. `grep -rn "job_applications"` över client/src,
--     client/api, supabase/functions och api ger bara KOMMENTARER — de tre
--     sista läsarna styrdes om i UX8 (2026-07-27) och E12-konsolideringen
--     (2026-07-28): useJobsokHubSummary, unifiedProfileApi, useUnifiedProgress.
--   * Tabellen var redan tyst degraderad när den användes: kolumnerna koden
--     skrev till (employer, cover_letter, contact_person m.fl.) fanns aldrig.
--
-- Varför det är värt att göra, och inte bara låta ligga:
--   Så länge tabellen finns är den ett aktivt fotgevär. `npm run lint:schema`
--   kan inte varna för den — grinden kontrollerar att kod pekar på objekt som
--   FINNS, och den här finns. En tom tabell med ett rimligt namn ser ut som en
--   giltig källa. Exakt det hände i UX8: hubben läste `job_applications`, fick
--   noll rader, och skrev noll över de riktiga siffrorna — Ansökningar-sidan
--   visade "Du har inte börjat söka jobb än" trots 24 rader i `saved_jobs`.
--
-- FÖRE KÖRNING — kontrollera att den fortfarande är tom (data kan ha tillkommit
-- sedan den här filen skrevs):
--
--   npx supabase db query --linked "SELECT count(*) FROM job_applications;"
--
-- Är svaret något annat än 0: KÖR INTE. Ta reda på vem som skrev först.
--
-- EFTER KÖRNING:
--   cd client && npm run schema:refresh   (135 → 134 tabeller)
--   och committa snapshoten i samma commit.
-- ============================================================================

BEGIN;

-- Säkerhetsspärr: avbryt om tabellen mot förmodan innehåller data.
DO $$
DECLARE
  antal bigint;
BEGIN
  SELECT count(*) INTO antal FROM public.job_applications;
  IF antal > 0 THEN
    RAISE EXCEPTION
      'AVBRUTET: job_applications innehåller % rader. Tabellen antogs vara tom. Utred innan DROP.', antal;
  END IF;
END $$;

DROP TABLE IF EXISTS public.job_applications CASCADE;

COMMIT;

-- Efterkontroll (kör separat):
--   SELECT to_regclass('public.job_applications');        -- ska ge NULL
--   SELECT count(*) FROM saved_jobs;                      -- ska fortfarande ge 24
--   SELECT count(*) FROM information_schema.tables
--     WHERE table_schema = 'public';                      -- ska ha minskat med 1
