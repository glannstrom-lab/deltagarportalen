-- KS2 / KS4 / KS8: tre RLS-brister i konsulentvyn — verifierade mot
-- produktionsdatabasen 2026-08-31 (uppdrag Mikael, samma runda som AG1/AG3).
--
-- KÖRD 2026-08-31, verifierad mot pg_policies 2026-09-02 (fem policyer, DOK1). Huvudet sa "INTE KÖRD ÄN" till 2026-09-02.
-- (Ursprunglig text:) Kräver Mikaels uttryckliga ja enligt CLAUDE.md (RLS-ändringar
-- mot prod). Kör manuellt när klartecken finns:
--   npx supabase db query --linked -f supabase/migrations/20260831140000_ks_consultant_rls.sql
-- Uppdatera sedan schema-snapshoten i SAMMA commit som körningen:
--   cd client && npm run schema:refresh
--
-- Radantal i prod vid skrivandet (0 rader = ändringen är strukturellt
-- riskfri; 2 rader kontrollerade individuellt, se KS8):
--   consultant_journal        0 rader
--   consultant_goals          0 rader
--   consultant_messages       2 rader (båda mellan aktiva par i
--                              consultant_participants — den nya INSERT-
--                              policyn hade släppt igenom dem oförändrat)
--
-- =============================================================================
-- KS2 — revoke_consultant_link() (20260522_sta_bulk_invite_consent.sql:294)
-- rör profiles, consultant_participants, consultant_consents, sta_enrollments
-- och sta_documents — ALDRIG consultant_journal eller consultant_goals. Båda
-- tabellernas enda konsulent-policy var `USING (auth.uid() = consultant_id)`
-- utan villkor om att relationen fortfarande är aktiv: en uppsagd konsulent
-- behöll full läs- och skrivrätt till anteckningar och mål om en deltagare
-- som brutit kopplingen, däribland fritextkategorin "Oro" i journalen.
--
-- Mönstret som stänger detta finns redan i kodbasen: EXISTS mot
-- consultant_participants (20260831130000_ag1_work_placements.sql). Samma
-- mönster upprepas här för båda tabellerna.
--
-- PRODUKTBESLUT MIKAEL MÅSTE TA — denna migration avgör INTE det: vad ska
-- hända med HISTORISKA journalanteckningar/mål när en relation upphör?
--   (a) Arkiveras — blir läsbara igen om deltagaren knyts till en ny
--       konsulent (kräver att raderna får stå kvar okrypterade och en regel
--       för vem en "ny" konsulent då är)
--   (b) Raderas permanent av revoke_consultant_link() själv, samtidigt som
--       sta_documents-utkasten redan raderas där
--   (c) Låses kvar i databasen, oläsbara för alla parter (denna migrations
--       effekt just nu) — bevarat om dokumentationsplikt kräver det, men
--       varken den forna konsulenten eller deltagaren når raden
-- Denna migration ger (c) som grundläge genom att stänga läsvägen. Väljer
-- Mikael (a) eller (b) krävs en uppföljande migration/RPC-ändring — skriv
-- inte in den här utan ett uttryckligt beslut.
-- =============================================================================

DROP POLICY IF EXISTS "Consultants can manage their journal entries" ON consultant_journal;
CREATE POLICY "Consultant har access till aktiva deltagares journal"
  ON consultant_journal FOR ALL
  USING (
    consultant_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM consultant_participants cp
      WHERE cp.consultant_id = auth.uid()
        AND cp.participant_id = consultant_journal.participant_id
    )
  )
  WITH CHECK (
    consultant_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM consultant_participants cp
      WHERE cp.consultant_id = auth.uid()
        AND cp.participant_id = consultant_journal.participant_id
    )
  );

DROP POLICY IF EXISTS "Consultants can manage their goals" ON consultant_goals;
CREATE POLICY "Consultant har access till aktiva deltagares mål"
  ON consultant_goals FOR ALL
  USING (
    consultant_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM consultant_participants cp
      WHERE cp.consultant_id = auth.uid()
        AND cp.participant_id = consultant_goals.participant_id
    )
  )
  WITH CHECK (
    consultant_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM consultant_participants cp
      WHERE cp.consultant_id = auth.uid()
        AND cp.participant_id = consultant_goals.participant_id
    )
  );

-- "Participants can view their goals" (SELECT, consultant_goals) rörs INTE —
-- deltagarens egen vy av sina mål ska bestå oavsett konsulentrelationens
-- status, exakt som "Deltagaren ser sina platser" i AG1.

-- =============================================================================
-- KS4 — consultant_journal (dit allt faktiskt skrivs, till skillnad från den
-- övergivna consultant_notes) hade EN enda policy: konsulentens egen. Ingen
-- SELECT-policy för participant_id existerade, trots att både
-- consultant_goals ("Participants can view their goals") och
-- consultant_notes ("Participants can view notes about themselves") har det.
-- Effekten: en "Oro"-anteckning kan stå om en människa permanent utan att
-- hon själv kan se den, och art. 15 (registerutdrag) saknade en teknisk väg
-- för just denna tabell.
--
-- PRODUKTBESLUT MIKAEL KAN TA (inte gjort här): ska vissa kategorier
-- undantas deltagarens läsrätt — t.ex. category='Oro' som en konsulents rena
-- riskbedömning innan den delats med deltagaren? Denna migration ger FULL
-- läsrätt till participant_id, i linje med systertabellernas mönster
-- (ingen av dem filtrerar på category/status). Ett undantag är en framtida,
-- uttrycklig ändring — inte något som ska avgöras av vilken tabell en
-- utvecklare råkar röra härnäst.
-- =============================================================================

CREATE POLICY "Deltagaren ser sina journalanteckningar"
  ON consultant_journal FOR SELECT
  USING (participant_id = auth.uid());

-- =============================================================================
-- KS8 — consultant_messages INSERT-policyn var `WITH CHECK (auth.uid() =
-- sender_id)`, utan kontroll av mottagaren. Att konsulent A inte når
-- konsulent B:s deltagare berodde UTESLUTANDE på att dialogerna bygger
-- mottagarlistan ur vyn consultant_dashboard_participants — ett UI-filter,
-- ingen databasspärr. Vem som helst med ett konto kunde INSERT:a ett
-- meddelande till vilken UUID som helst.
--
-- Kravet gäller i BÅDA riktningarna eftersom deltagaren svarar genom samma
-- tabell (sender_id = deltagaren, receiver_id = konsulenten den gången).
-- consultant_participants saknar statuskolumn — en rads blotta existens ÄR
-- den aktiva relationen (samma tolkning som AG1/KS2 ovan), så EXISTS räcker.
--
-- De 2 befintliga raderna i prod kontrollerades individuellt: båda
-- avsändare/mottagare-par finns som aktiv rad i consultant_participants,
-- så den skärpta regeln hade släppt igenom dem — ingen befintlig, legitim
-- data stängs ute. "Users can view their own messages" (SELECT) och
-- "Receivers can update read status" (UPDATE) rörs inte: de ändrar inget
-- om VEM man får kontakta, bara vad man får göra med ett meddelande som
-- redan finns.
-- =============================================================================

DROP POLICY IF EXISTS "Users can send messages" ON consultant_messages;
CREATE POLICY "Users can send messages to an active counterpart"
  ON consultant_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM consultant_participants cp
      WHERE (cp.consultant_id = sender_id AND cp.participant_id = receiver_id)
         OR (cp.consultant_id = receiver_id AND cp.participant_id = sender_id)
    )
  );

-- =============================================================================
-- VERIFIERING — kör EFTER körningen. Ett kommando som "gick bra" är inget
-- bevis (lärdomen 2026-08-04: ett REVOKE kan lyckas tyst utan effekt).
-- Varje block har både ett NEKANDE och ett GODKÄNNANDE prov — en policy som
-- nekar allt ser också "rätt" ut i ett rent nekande test.
-- =============================================================================

-- 1) Strukturell kontroll — fyra policyer ska synas, formen ska matcha ovan.
--   SELECT tablename, policyname, cmd, permissive, qual, with_check
--   FROM pg_policies
--   WHERE tablename IN ('consultant_journal', 'consultant_goals', 'consultant_messages')
--   ORDER BY tablename, cmd;

-- 2) KS2 — funktionellt prov med en konsulent UTAN aktiv relation.
--    Byt ut UUID:erna mot ett verkligt konsulent-id + ett participant-id
--    som INTE finns i consultant_participants för den konsulenten.
--   BEGIN;
--     SET LOCAL ROLE authenticated;
--     SET LOCAL request.jwt.claim.sub = '<konsulent-uuid-utan-relation>';
--     -- Nekande prov: ska ge 0 rader trots att consultant_id matchar innehållet
--     SELECT count(*) FROM consultant_journal WHERE participant_id = '<participant-uuid>';
--     SELECT count(*) FROM consultant_goals   WHERE participant_id = '<participant-uuid>';
--   ROLLBACK;
--
--    Godkännande prov: samma sats med en konsulent-uuid som HAR en aktiv rad
--    i consultant_participants för den participant-uuid:n ska ge samma
--    radantal som innan migrationen (dvs. den äkta datan, inte 0 på grund av
--    ett fel i EXISTS-uttrycket).

-- 3) KS4 — deltagaren ska nu se sin egen journal.
--   BEGIN;
--     SET LOCAL ROLE authenticated;
--     SET LOCAL request.jwt.claim.sub = '<participant-uuid>';
--     -- Godkännande prov: raderna om just denna deltagare kommer med
--     SELECT count(*) FROM consultant_journal WHERE participant_id = '<participant-uuid>';
--     -- Nekande prov: en annan deltagares rader kommer INTE med
--     SELECT count(*) FROM consultant_journal WHERE participant_id = '<en-annan-deltagares-uuid>';
--   ROLLBACK;

-- 4) KS8 — insert-spärren.
--   BEGIN;
--     SET LOCAL ROLE authenticated;
--     SET LOCAL request.jwt.claim.sub = '<uuid-utan-relation-till-mottagaren>';
--     -- Nekande prov: ska kasta en RLS-policyviolation (42501), inte lyckas
--     INSERT INTO consultant_messages (sender_id, receiver_id, content)
--       VALUES ('<uuid-utan-relation-till-mottagaren>', '<mottagar-uuid>', 'test');
--   ROLLBACK;
--
--   BEGIN;
--     SET LOCAL ROLE authenticated;
--     SET LOCAL request.jwt.claim.sub = '<deltagare-eller-konsulent-med-aktiv-relation>';
--     -- Godkännande prov: ska lyckas — en legitim part kan fortfarande skriva
--     INSERT INTO consultant_messages (sender_id, receiver_id, content)
--       VALUES ('<avsandare-uuid>', '<mottagare-med-aktiv-relation-uuid>', 'test');
--   ROLLBACK; -- rulla alltid tillbaka testinserten, committa aldrig den
