-- PG3 (persona-genomgång 2026-09-12): konsulenten ser aldrig deltagarens CV-status.
--
-- Mätt i prod som demo@jobin.se via PostgREST: vyn consultant_dashboard_participants
-- ger has_cv=false och ats_score=null för ALLA fem demodeltagare, fast tre av dem har
-- en rad i cvs (Anna 72, Lisa 81, Omar 58 — mätt som postgres). Vyn körs med
-- anroparens rättigheter (security_invoker), och cvs har bara policyn
-- "Users can view own CV" (auth.uid() = user_id). LEFT JOIN cvs blir därför alltid
-- tom för en konsulent — inte bara i demot utan för varje konsulent i drift:
-- "CV saknas" på alla, "Snitt ATS-poäng —", "Ingen ATS-poäng ännu".
--
-- Samtyckestexten (KS3/ON1) säger uttryckligen att konsulenten ser "om du har ett
-- CV, vilken ATS-poäng det fick och när du senast ändrade det" — så läsrätten är
-- redan det deltagaren samtyckt till; den saknades bara i RLS. Samma mönster som
-- KM9-rest (saved_jobs) och KS2 b (har_aktiv_relation): läsrätt = aktiv koppling.
--
-- EJ KÖRD — kräver Mikaels ja (RLS i prod). Bevisad i rollback: e2e/pg3-prov.sql.
-- Efter körning: cd client && npm run grants:refresh (RLS-räkningen) och
-- verifiera som demo@jobin.se: vyn ska ge has_cv=true för Anna, Lisa, Omar.

CREATE POLICY "KS2b: konsulent läser aktiva deltagares CV"
  ON public.cvs
  FOR SELECT
  TO authenticated
  USING (public.har_aktiv_relation(user_id));
