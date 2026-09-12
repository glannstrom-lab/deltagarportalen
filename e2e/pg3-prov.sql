-- PG3-prov: visar att konsulenten inte ser CV-status i dag, och att policyn i
-- 20260912210000_pg3_cvs_konsulent_lasratt.sql rättar det. Rullas ALLTID tillbaka
-- (RAISE i slutet). Kör: npx supabase db query --linked -f e2e/pg3-prov.sql
DO $$
DECLARE
  v_kons uuid := (SELECT id FROM auth.users WHERE email = 'demo@jobin.se');
  v_fore int; v_efter int; v_totalt int;
BEGIN
  -- Agera som demokonsulenten (authenticated + JWT-claim sub), som PostgREST gör
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_kons::text, 'role', 'authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.sub', v_kons::text, true);
  SET LOCAL ROLE authenticated;

  SELECT count(*) FILTER (WHERE has_cv), count(*) INTO v_fore, v_totalt FROM consultant_dashboard_participants;

  RESET ROLE;
  CREATE POLICY "KS2b: konsulent läser aktiva deltagares CV" ON public.cvs FOR SELECT TO authenticated USING (public.har_aktiv_relation(user_id));
  SET LOCAL ROLE authenticated;

  SELECT count(*) FILTER (WHERE has_cv) INTO v_efter FROM consultant_dashboard_participants;

  RESET ROLE;
  RAISE EXCEPTION 'PROV (rullas tillbaka): deltagare=% | has_cv FÖRE policyn=% | EFTER policyn=% (väntat 3: Anna, Lisa, Omar)', v_totalt, v_fore, v_efter;
END $$;
