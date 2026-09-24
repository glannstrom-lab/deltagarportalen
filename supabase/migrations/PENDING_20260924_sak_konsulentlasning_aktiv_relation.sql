-- ============================================================================
-- VÄNTAR PÅ MIKAELS GODKÄNNANDE — KÖRS INTE AUTOMATISKT
-- ============================================================================
-- Döp om till 20260924xxxxxx_sak_konsulentlasning_aktiv_relation.sql när den
-- godkänts och körts. Ingen data ändras; bara RLS-villkor (SELECT).
-- ============================================================================
--
-- ALLVAR: LÅG–MEDEL — permissiv dubblettpolicy som är svagare än KS2b.
--
-- Vad: KS2b (2026-09) gjorde "konsulenten läser bara AKTIVA deltagares data"
-- till regel via `har_aktiv_relation(participant_id)`, som slår upp
-- `consultant_participants`. Fem äldre SELECT-policyer ger konsulenten
-- läsrätt på ett ANNAT underlag — `profiles.consultant_id = auth.uid()`
-- eller en gammal inbjudan — och permissiva policyer OR:as. Den svagare
-- villkoret gäller alltså:
--
--   saved_jobs             "Consultants can view participant saved jobs"      (profiles.consultant_id)
--                          — dubblerar "Konsulent läser aktiva deltagares sparade jobb" (cp)
--   course_recommendations "Consultants can view participant recommendations" (profiles.consultant_id)
--   user_certifications    "Consultants can view participant certifications"  (profiles.consultant_id)
--   user_learning_paths    "Consultants can view participant paths"           (profiles.consultant_id)
--   shared_resources       "Consultants can view participant shared resources"(invitations.consultant_id)
--
-- När skiljer sig underlagen:
--   * Konsulenten avslutar kopplingen själv (policyn "Konsulent avslutar egen
--     koppling" = DELETE på consultant_participants). Det finns ingen trigger
--     på consultant_participants (verifierat: pg_trigger tom), så
--     profiles.consultant_id står kvar — och konsulenten fortsätter läsa
--     deltagarens sparade jobb, certifikat, lärvägar och kursförslag.
--     (`revoke_consultant_link`, deltagarens väg, nollar consultant_id — den
--     vägen är tät.)
--   * shared_resources: villkoret är "konsulenten bjöd in personen en gång".
--     Det överlever både återkallelse och överlämning.
--
-- Mätt 2026-09-24:
--   profiles med consultant_id men utan consultant_participants-rad: 0
--   shared_resources läsbara via inbjudan utan aktiv koppling: 0 (tabellen tom)
-- Ändringen är alltså beteendeneutral i dag och stänger vägen framåt.
--
-- Risk: låg. Konsulentvyn läser redan de KS2b-grindade tabellerna med samma
-- villkor. Om konsulentvyn slutar visa sparade jobb/certifikat för en deltagare
-- efteråt är det för att relationen saknas i consultant_participants — det är
-- den buggen som ska lagas, inte policyn.
--
-- LÄMNAS MED FLIT: profiles-policyn "Consultants can view assigned participant
-- profiles" (consultant_id = auth.uid()) har samma svaghet, men KS3-flödet
-- (samtyckesfrågan) kan läsa profilen innan kopplingsraden finns. Den kräver
-- en egen premissgranskning innan den ändras.
-- ============================================================================

BEGIN;

DROP POLICY IF EXISTS "Consultants can view participant saved jobs" ON public.saved_jobs;

ALTER POLICY "Consultants can view participant recommendations" ON public.course_recommendations
  USING (public.har_aktiv_relation(user_id));

ALTER POLICY "Consultants can view participant certifications" ON public.user_certifications
  USING (public.har_aktiv_relation(user_id));

ALTER POLICY "Consultants can view participant paths" ON public.user_learning_paths
  USING (public.har_aktiv_relation(user_id));

ALTER POLICY "Consultants can view participant shared resources" ON public.shared_resources
  USING (public.har_aktiv_relation(user_id));

COMMIT;

-- ----------------------------------------------------------------------------
-- VERIFIERING
-- ----------------------------------------------------------------------------
-- select tablename, policyname, qual from pg_policies
--  where tablename in ('saved_jobs','course_recommendations','user_certifications',
--                      'user_learning_paths','shared_resources')
--    and policyname ilike '%onsult%';
--   → saved_jobs: bara "Konsulent läser aktiva deltagares sparade jobb" (cp-villkor)
--   → övriga fyra: qual = har_aktiv_relation(user_id)
--
-- select count(*) from pg_policies where qual ilike '%profiles.consultant_id = auth.uid()%'
--    or qual ilike '%profiles.consultant_id = ( SELECT auth.uid()%';
--   → 0
--
-- Efter körning: cd client && npm run grants:refresh (om snapshoten bär RLS-
-- underlag) och npm run lint:grants → grönt.
-- ============================================================================
