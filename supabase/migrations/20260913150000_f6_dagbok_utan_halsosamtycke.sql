-- ============================================================================
-- F6: Jobbsökardagbok utan hälsosamtycke, skild från mående/sömn
-- docs/ROADMAP.md — F6
--
-- PREMISSGRANSKNING (2026-09-13, verifierad mot prod-schema och koden)
-- ----------------------------------------------------------------------------
-- `diary_entries` bär `mood` (int, NULLBAR) och `energy_level` (int, NULLBAR)
-- på SAMMA rad som den fria texten (`content`). Det finns ingen `sleep`-kolumn
-- på tabellen. JournalTab (client/src/components/diary/JournalTab.tsx) skriver
-- hit — en ren dagboksrad utan hälsodata är en rad där BÅDA är NULL.
--
-- MoodTab (client/src/components/diary/MoodTab.tsx) skriver till en HELT ANNAN
-- tabell, `mood_logs` (via useMoodLogs/moodLogsApi), och berörs INTE av den
-- här migrationen eller av `diary_entries`s policy alls.
--
-- MV2 (20260821120000_mv2_diary_wellness_consent.sql) grindade HELA
-- `diary_entries` bakom `check_wellness_consent(auth.uid())` — oavsett om
-- raden bar mood/energy_level eller inte. En ren textanteckning ("skrev en
-- rad om dagens jobbansökningar, ingen mood satt") krävde alltså exakt samma
-- art. 9-samtycke som en rad med humör ifyllt. Det är precis F6:s premiss,
-- och den håller: grinden satt på HELA tabellen, inte på hälsodatan i den.
--
-- LÖSNING (variant: grinda raden, inte tabellen)
-- ----------------------------------------------------------------------------
-- Samtycke krävs bara när raden FAKTISKT bär hälsodata (mood eller
-- energy_level satt på NEW-raden). En ren textrad (båda NULL) går igenom utan
-- samtycke, precis som SELECT/DELETE redan gör (MV2, art. 15/17 — de rörs
-- INTE här). DROP + CREATE, inte en policy vid sidan av — permissiva policyer
-- OR:as (lärdomen från A16/A21/A26/MV2), så en lös policy bredvid den gamla
-- strikta hade inte grindat något alls.
--
-- KLIENT-FYND — INTE åtgärdat i denna migration (utanför scope)
-- ----------------------------------------------------------------------------
-- JournalTab.tsx:s skrivmodal sätter `mood` till 3 som DEFAULT-state och
-- skickar alltid ett mood-värde vid spara (`useState(3)`, aldrig null) —
-- oavsett om användaren rört reglaget. Så länge klienten gör det kommer varje
-- ny rad från JournalTab fortfarande bära mood != NULL och alltså fortfarande
-- kräva samtycke i PRAKTIKEN, trots att RLS-policyn nedan öppnar för rena
-- textrader. RLS-kontraktet är nu rätt (gate på datan, inte på ändpunkten),
-- men F6 är inte fullt uppnått för användaren förrän klienten också kan spara
-- en rad med mood = NULL. Se rapporten till Mikael för detaljer — ändring av
-- JournalTab.tsx ingår inte i den här uppgiftens filomfång.
-- ============================================================================

BEGIN;

DROP POLICY IF EXISTS "Users can create own diary entries with wellness consent" ON diary_entries;

CREATE POLICY "Users can create own diary entries unless health data"
  ON diary_entries FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      (mood IS NULL AND energy_level IS NULL)
      OR check_wellness_consent(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own diary entries with wellness consent" ON diary_entries;

CREATE POLICY "Users can update own diary entries unless health data"
  ON diary_entries FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (
      (mood IS NULL AND energy_level IS NULL)
      OR check_wellness_consent(auth.uid())
    )
  );

COMMIT;

-- ============================================================================
-- VERIFIERING — se e2e/f6-dagbok-prov.sql (rullad tillbaka transaktion, ingen
-- prod-data ändrad). Förväntat utfall:
--   ren textrad (mood=NULL, energy_level=NULL) UTAN samtycke  → OK
--   rad med mood satt                          UTAN samtycke  → 42501
--   rad med energy_level satt                  UTAN samtycke  → 42501
--   UPDATE av ren rad utan att lägga till hälsodata, UTAN samtycke → 1 rad
--   UPDATE som LÄGGER TILL mood på en ren rad, UTAN samtycke  → 42501
--   rad med mood satt                          MED samtycke   → OK
-- ============================================================================

-- ROLLBACK (om något behöver backas till MV2:s läge — hela tabellen grindad):
--   BEGIN;
--     DROP POLICY IF EXISTS "Users can create own diary entries unless health data" ON diary_entries;
--     DROP POLICY IF EXISTS "Users can update own diary entries unless health data" ON diary_entries;
--     CREATE POLICY "Users can create own diary entries with wellness consent"
--       ON diary_entries FOR INSERT
--       WITH CHECK (user_id = auth.uid() AND check_wellness_consent(auth.uid()));
--     CREATE POLICY "Users can update own diary entries with wellness consent"
--       ON diary_entries FOR UPDATE
--       USING (user_id = auth.uid())
--       WITH CHECK (user_id = auth.uid() AND check_wellness_consent(auth.uid()));
--   COMMIT;
-- ============================================================================
