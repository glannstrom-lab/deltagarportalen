-- KM10 (notiser i appen) + KM7-rest (AF-registrering som kolumn).
--
-- 1. notifications hade EN policy: `auth.uid() = user_id` för ALL. Ingen
--    konsulenthändelse har därför kunnat skapa en notis åt deltagaren (enda
--    skrivaren är job-alerts.js med service role). Ny INSERT-policy: en konsulent
--    med AKTIV rad i consultant_participants får skapa en notis åt just den
--    deltagaren, och BARA av aktivitetstyperna — inte 'message'/'system'/
--    'job_match', så policyn inte kan användas för att förfalska andra notiser.
--    Läsning, uppdatering och radering är fortfarande bara deltagarens egen.
-- 2. activity_plans.af_registered_at: datum då konsulenten registrerat
--    anvisningen i Arbetsförmedlingens "Mina sidor för kommuner". Ersätter
--    localStorage-bocken i IvoUnderlagSektion (per webbläsare, inte per plan).
--
-- Rör ingen annan policy. Ingen definer-funktion.
-- Kör:   npx supabase db query --linked -f supabase/migrations/20260911220000_km10_notiser_km7_af_kolumn.sql
-- Sedan: cd client && npm run schema:refresh && npm run grants:refresh

CREATE POLICY "Konsulent skapar aktivitetsnotis åt aktiv deltagare"
  ON notifications FOR INSERT
  WITH CHECK (
    type IN ('aktivitet_plan', 'aktivitet_pass', 'aktivitet_franvaro')
    AND EXISTS (
      SELECT 1 FROM consultant_participants cp
      WHERE cp.consultant_id = auth.uid()
        AND cp.participant_id = notifications.user_id
    )
  );

ALTER TABLE activity_plans
  ADD COLUMN IF NOT EXISTS af_registered_at date;

COMMENT ON COLUMN activity_plans.af_registered_at IS
  'KM7: datum då anvisningen registrerats i AF:s Mina sidor för kommuner (manuellt — inget API finns).';

-- VERIFIERING (rullad-tillbaka transaktion som authenticated):
--   konsulent → insert notis typ aktivitet_plan åt kopplad deltagare → 1 rad
--   konsulent → insert notis typ 'message' åt samma deltagare → 42501
--   konsulent → insert notis åt okopplad användare → 42501
--   deltagare → select count(*) from notifications → ser sin egen
