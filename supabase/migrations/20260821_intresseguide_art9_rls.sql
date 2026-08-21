-- Intresseguiden: art. 9-grinden gäller inte, och den vaktar fel tabell.
--
-- KÖRS INTE AUTOMATISKT. RLS-ändringar mot prod kräver Mikaels ja
-- (CLAUDE.md § Släpp). Verifierat mot prod 2026-08-21 med:
--   npx supabase db query --linked "select tablename, policyname, cmd, permissive,
--     qual, with_check from pg_policies where tablename in
--     ('interest_results','interest_guide_history') order by tablename, cmd;"
--
-- ── FYND 1: FOR ALL-policyn OR:ar bort hälsosamtycket ────────────────────
--
-- `interest_results` har sex policyer. En av dem:
--
--   "Users can CRUD own interest results"  cmd=ALL  qual=(auth.uid()=user_id)
--                                                   with_check=NULL
--
-- FOR ALL gäller även INSERT, och när WITH CHECK utelämnas använder Postgres
-- USING-uttrycket som WITH CHECK. Permissiva policyer OR:as. Det effektiva
-- INSERT-villkoret blir därför:
--
--   (auth.uid()=user_id AND check_health_consent(auth.uid()))   ← den strikta
--   OR (auth.uid()=user_id)                                     ← FOR ALL
--   = auth.uid()=user_id
--
-- Hälsosamtycket kan alltså inte fälla någonting. Exakt samma mönster som
-- lärdomen 2026-08-04 om `profiles`, `mood_logs` och `storage.objects`:
-- att grinden finns är inget bevis för att den gäller.
--
-- SELECT/UPDATE/DELETE täcks redan av fyra specifika policyer, så FOR ALL-
-- policyn tillför ingenting utom luckan.

DROP POLICY IF EXISTS "Users can CRUD own interest results" ON public.interest_results;

-- ── FYND 2: konsulenten läser ICF utan delningssamtycke ──────────────────
--
-- `interest_guide_history` är den tabell som FAKTISKT innehåller `icf_profile`
-- (10 rader i prod). Dess konsulentpolicy kräver bara roll + tilldelning:
--
--   "Consultants can view participant history"
--     roll = consultant/superadmin  AND  participant.consultant_id = auth.uid()
--
-- Ingen kontroll av `participant_data_sharing.share_health_data`. Motsvarande
-- policy på `interest_results` kräver den. `docs/GDPR-ART30-REGISTER.md:101`
-- påstår dessutom att mottagaren är "tilldelad konsulent ENDAST om
-- share_health_data = true" — vilket alltså inte stämmer för den tabell där
-- hälsodatan ligger.

DROP POLICY IF EXISTS "Consultants can view participant history" ON public.interest_guide_history;

CREATE POLICY "Consultants can view participant history"
  ON public.interest_guide_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (p.role = 'consultant'::text
             OR p.role = 'superadmin'::text
             OR p.roles @> ARRAY['consultant'::text]
             OR p.roles @> ARRAY['superadmin'::text])
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles participant
      WHERE participant.id = interest_guide_history.user_id
        AND participant.consultant_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.participant_data_sharing s
      WHERE s.consultant_id = auth.uid()
        AND s.participant_id = interest_guide_history.user_id
        AND s.share_health_data = true
    )
  );

-- ── FYND 3: dubbletten på progress ───────────────────────────────────────
--
-- `interest_guide_progress` har två överlappande FOR ALL-policyer som båda
-- kokar ned till auth.uid()=user_id. Ingen rättighetsökning, men samma form
-- som fynd 1 — och `answers` innehåller de åtta ICF-svaren i råform.

DROP POLICY IF EXISTS "Users can manage own interest guide progress" ON public.interest_guide_progress;

-- ── VERIFIERING EFTER KÖRNING ────────────────────────────────────────────
--
-- Mät utfallet, inte kommandot (lärdomen 2026-08-04 om REVOKE mot PUBLIC):
--
--   select policyname, cmd, permissive, with_check
--   from pg_policies where tablename = 'interest_results' order by cmd;
--     → förväntat: INGEN rad med cmd='ALL'
--
--   select policyname from pg_policies
--   where tablename='interest_guide_history' and policyname like 'Consultants%';
--     → och läs with_check/qual: 'share_health_data' ska förekomma
--
-- OBS: efter körningen börjar art. 9-grinden gälla på riktigt för
-- `interest_results`. Koden skriver inte dit i dag (se interestApi.saveResult,
-- noll anropare), så inget flöde bryts — men börjar något skriva dit måste
-- samtycket vara på plats, annars fälls insertet.
