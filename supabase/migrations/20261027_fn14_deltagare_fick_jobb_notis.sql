-- FN14 "Jag fick jobbet" — notis till konsulenten. KÖRD mot prod 2026-10-31 (Mikaels ja).
--
-- notifications har EN policy för deltagare: auth.uid() = user_id (ALL), och en
-- INSERT-policy för konsulent -> deltagare (KM10, bara aktivitetstyper). Ingen
-- policy låter en DELTAGARE skriva en notis till sin KONSULENT. Den här släpper
-- igenom exakt en typ, 'deltagare_fick_jobb', och bara till en konsulent som har
-- en rad i consultant_participants mot den inloggade deltagaren.
-- Koden (services/fickJobbet.ts) hoppar över notisen utan att kasta om insertet
-- nekas, så klienten fungerar både före och efter migrationen.
--
-- Rör ingen annan policy. Ingen definer-funktion.
-- Kör:   npx supabase db query --linked -f supabase/migrations/20261027_fn14_deltagare_fick_jobb_notis.sql
-- Sedan: cd client && npm run schema:refresh && npm run grants:refresh

CREATE POLICY "Deltagare skapar fick-jobbet-notis åt sin konsulent"
  ON notifications FOR INSERT
  WITH CHECK (
    type = 'deltagare_fick_jobb'
    AND EXISTS (
      SELECT 1 FROM consultant_participants cp
      WHERE cp.participant_id = (SELECT auth.uid())
        AND cp.consultant_id = notifications.user_id
    )
  );
