-- PENDING 2026-09-29 — consultant_requests: avskriv den obesvarbara vägen
--
-- PREMISSEN (mätt i prod 2026-09-29):
--  * Policyn "Participants can respond to requests" är en UPDATE-policy med bara
--    USING (participant_id = uid AND status = 'PENDING') och INGEN WITH CHECK.
--    Postgres återanvänder då USING som WITH CHECK på den NYA raden -> en rad
--    med status ACCEPTED/DECLINED underkänns. Deltagaren kan alltså aldrig
--    svara via tabellen.
--  * accept_consultant_request / decline_consultant_request (SECURITY DEFINER)
--    har noll anropare (grep client/src, client/api, supabase/functions) och
--    EXECUTE är redan borta för anon och authenticated.
--  * Ingen deltagarvy läser tabellen. Enda klientkoden är
--    InviteParticipantDialog.tsx, som SKAPAR en PENDING-rad när e-posten redan
--    har ett konto — och visar "förfrågan skickad". Ingen kan se den.
--    Riktiga kopplingsvägen är inbjudan -> consultant_consents.
--  * "Consultants can delete own pending requests" (finns i 20260323-filen) finns
--    INTE i prod: dialogens DELETE av en nekad förfrågan tar 0 rader tyst.
--  * Tabellen har 1 rad (ACCEPTED, konsulent = superadmin, 2026-04-12).
--
-- DEL A (körs nu, ingen beteendeförändring): ta bort döda RPC:er och den
-- obesvarbara policyn.
-- DEL B (kräver Mikaels beslut + klientändring först — se längst ned).
--
-- PRÖVA (rollback): kör hela filen inom begin; ... rollback; och kontrollera
--   select proname from pg_proc where proname like '%consultant_request%';   -> 0 rader
--   select policyname from pg_policies where tablename='consultant_requests'; -> 3 rader
--     (Consultants can create requests, Consultants can view own requests,
--      Participants can view requests to them)

begin;

drop function if exists public.accept_consultant_request(uuid);
drop function if exists public.decline_consultant_request(uuid);

drop policy if exists "Participants can respond to requests" on public.consultant_requests;

commit;

-- Efter körning: cd client && npm run grants:refresh && npm run schema:refresh
-- och committa snapshotarna i samma commit.

-- ===========================================================================
-- DEL B — BESLUT KRÄVS (kör INTE utan klientändring):
--   (a) Avskriv: InviteParticipantDialog slutar skapa förfrågan för befintligt
--       konto (visa i stället "personen har redan konto - skicka en inbjudan
--       via länk / be hen godkänna kopplingen i Min konsulent"), därefter:
--         drop table public.consultant_requests;   -- 1 rad, ACCEPTED, förlorar inget
--       (BL4-migrationen 20260912180000 nämner tabellen i FK-listan; snapshot
--       + lint:schema måste uppdateras.)
--   (b) Bygg svarsflödet: deltagarvy som läser förfrågningarna + en definer-RPC
--       respond_consultant_request(id, accept bool) som skriver samtycke via
--       grant_consultant_consent (inte bara profiles.consultant_id, som den
--       gamla accept-funktionen gjorde — den kringgick samtyckesloggen).
-- Rekommendation: (a). Spåret duplicerar consultant_consents och saknar samtycke.
-- ===========================================================================
