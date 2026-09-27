-- Prov (2026-09-27): kan en deltagare spara sin profil och skriva till sin konsulent?
-- Fällde 42P17 (profiles-rekursion) från SP5 2026-09-24 22:38 till 2026-09-27, och 42501
-- på meddelandet — e2e-sviten (66/66 grön) provade aldrig en UPDATE av profiles som deltagare.
-- Kör efter varje migration som rör RLS på profiles, consultant_participants eller
-- consultant_messages. Allt rullas tillbaka.
--   npx supabase db query --linked -f e2e/rls-deltagare-skriver-prov.sql --output table
-- Förväntat: en rad "OK". Ett fel = regressionen är tillbaka.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-000000000002","role":"authenticated"}', true);
UPDATE profiles SET phone = '070-000 00 00' WHERE id = '22222222-2222-4222-8222-000000000002';
INSERT INTO consultant_messages (sender_id, receiver_id, content)
  VALUES ('22222222-2222-4222-8222-000000000002', '22222222-2222-4222-8222-000000000001', 'prov');
SELECT 'OK' AS resultat, (SELECT count(*) FROM consultant_participants) AS egna_kopplingar;
ROLLBACK;
