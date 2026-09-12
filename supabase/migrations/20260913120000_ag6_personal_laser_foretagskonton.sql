-- AG6-rest (2026-09-13, fynd av konsulentagenten): konsulenten kunde inte läsa
-- företagskontots NAMN. organizations har bara "Medlem ser sin organisation"
-- (KM2) + superadmin, så `organizations(name)` inbäddat från employer_places
-- eller consultant_work_placements blev null för personal, och kortet fick
-- falla tillbaka på platsens eget company_name.
--
-- Personal (CONSULTANT/ADMIN/SUPERADMIN, ar_personal()) får läsa organisationer
-- av slaget arbetsgivare — namn och org.nr är offentliga uppgifter om ett
-- företag, inte personuppgifter. Kommuner/leverantörer berörs inte.
--
-- Kör: npx supabase db query --linked -f supabase/migrations/20260913120000_ag6_personal_laser_foretagskonton.sql
-- Sedan: cd client && npm run grants:refresh

DROP POLICY IF EXISTS "Personal läser företagskonton" ON organizations;
CREATE POLICY "Personal läser företagskonton" ON organizations
  FOR SELECT USING (kind = 'arbetsgivare' AND ar_personal());

-- Verifiering: select policyname from pg_policies where tablename='organizations'; → 4 rader
