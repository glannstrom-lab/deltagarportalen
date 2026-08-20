-- ============================================================================
-- MV2: samtyckesgrind på diary_entries
-- Projektgenomgången 2026-08-21
--
-- KÖRD OCH VERIFIERAD MOT PROD 2026-08-21 (godkänd av Mikael).
-- Verifieringen längst ned är genomförd; utfallen står inskrivna där.
-- ============================================================================
--
-- VAD SOM ÄR FEL
-- --------------
-- Migrationen 20260328100000 gav `mood_logs` och `interest_results` en
-- samtyckesgrindad INSERT-policy:
--
--     WITH CHECK (auth.uid() = user_id AND check_wellness_consent(auth.uid()))
--
-- `diary_entries` fick den aldrig. Dess INSERT-policy är sedan 2026-03-17
-- bara `WITH CHECK (user_id = auth.uid())` — alltså enbart ägarkontroll.
-- Tabellen bär `content` (fri text om hur dagen varit), `mood` och
-- `energy_level`: samma kategori av uppgifter som `mood_logs`, och det är
-- exakt det innehåll `WellnessConsentGate` säger sig skydda.
--
-- Detta är INTE dubblettpolicy-mönstret som träffat fem gånger (profiles,
-- mood_logs, storage.objects, invitations, profile_shares). Där fanns en
-- permissiv policy som upphävde en strängare. Här finns ingen sträng policy
-- alls — grinden byggdes aldrig. Kontrollerat: `diary_entries` har fyra
-- separata policyer (SELECT/INSERT/UPDATE/DELETE), ingen `ALL`-policy.
--
-- VARFÖR DET SPELAR ROLL
-- ----------------------
-- Skyddet ligger i dag enbart i klientkomponenten `WellnessConsentGate`.
-- En komponent är ett gränssnitt, inte en grind — den går förbi genom att
-- anropa PostgREST direkt. Och MV3 (samma genomgång) visar att den redan
-- kringgås av misstag inne i portalen: `Wellness.tsx:25` renderar fokuslägets
-- wizard UTANFÖR grinden. Samma klass av glapp kan uppstå i dagboken vid
-- nästa layoutändring.
--
-- RÄCKVIDD — KONTROLLERAT FÖRE SKRIVNING
-- --------------------------------------
-- En samtyckesgrind kan låsa ute användare. Kontrollerat att den inte gör
-- det här: hela `/diary` ligger innanför `<WellnessConsentGate>`
-- (`Diary.tsx:172-194`), så varje deltagare som kan skriva en anteckning i
-- dag har redan passerat samtycket. Grinden stänger alltså bara de vägar som
-- går FÖRBI gränssnittet — vilket är hela poängen.
--
-- Kontrollera ändå utfallet efter körning (steg 3 nedan): finns rader från
-- konton utan `wellness_consent_at` betyder det att en sådan väg funnits, och
-- då är det ett eget fynd att gå vidare med — inte ett skäl att rulla tillbaka.
--
-- AVGRÄNSNING: exercise_answers ingår INTE
-- ----------------------------------------
-- Granskningen föreslog samma grind på `exercise_answers`. Den premissen
-- håller inte, och migrationen gör därför inte det:
--
--   * Övningarna har 38 kategorier. Tre är hälsonära (Självkännedom,
--     Välmående, Rehabilitering); de övriga 35 är Jobbsökning, Nätverkande,
--     Arbetsrätt, Karriärutveckling och liknande — inte art. 9-data.
--   * `exercise_answers` har ingen kategorikolumn (verifierat mot
--     schema-snapshoten: answers, completed_at, created_at, exercise_id,
--     exercise_uuid, id, is_completed, updated_at, user_id). RLS kan alltså
--     omöjligt skilja en rehabiliteringsövning från en om nätverkande.
--   * Sidan har heller ingen `WellnessConsentGate` i dag. En blanket-grind
--     hade krävt hälsosamtycke för att svara på en jobbsökningsövning, och
--     låst ute alla utom de få med samtycke.
--
-- Rätt åtgärd där är antingen att grinda de tre kategorierna i UI:t, eller
-- att bära kategorin i tabellen så RLS kan skilja dem åt. Båda är
-- produktbeslut och ligger kvar som MV2b i docs/ROADMAP.md.

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Ersätt den ogrindade INSERT-policyn
-- ----------------------------------------------------------------------------
-- DROP + CREATE, inte en andra policy vid sidan av: permissiva policyer OR:as,
-- så en tillagd sträng policy bredvid den befintliga lösa hade inte grindat
-- någonting. Det är precis felet i A16/A21/A26.

DROP POLICY IF EXISTS "Users can create own diary entries" ON diary_entries;

CREATE POLICY "Users can create own diary entries with wellness consent"
  ON diary_entries FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND check_wellness_consent(auth.uid())
  );

-- ----------------------------------------------------------------------------
-- 2. UPDATE grindas också
-- ----------------------------------------------------------------------------
-- Utan detta kan en användare som återkallat sitt samtycke fortfarande skriva
-- om innehållet i en befintlig anteckning — alltså fortsätta lämna nya
-- hälsouppgifter, bara genom en annan verbform. `mood_logs` har samma lucka,
-- men den tabellen uppdateras inte från klienten; dagboken gör det (redigera
-- anteckning).
--
-- SELECT och DELETE lämnas medvetet ogrindade: rätten att läsa och radera sina
-- egna uppgifter (art. 15 och 17) gäller OBEROENDE av samtyckets status, och
-- ska inte gå förlorad när samtycket återkallas. Att låsa läsningen hade
-- dessutom gjort dataexporten ofullständig.

DROP POLICY IF EXISTS "Users can update own diary entries" ON diary_entries;

CREATE POLICY "Users can update own diary entries with wellness consent"
  ON diary_entries FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND check_wellness_consent(auth.uid())
  );

COMMIT;

-- ============================================================================
-- VERIFIERING — GENOMFÖRD 2026-08-21, utfall inskrivna
-- ============================================================================
--
-- FÖRE KÖRNING (räckvidden mätt, inte antagen):
--   dagboksrader = 1 · skribenter = 1 · rader_utan_samtycke = 0
--   skribenter_utan_samtycke = 0 · profiler_med_samtycke = 2
--   → ingen låstes ute. Ingen hade heller gått förbi UI-grinden.
--
-- Steg 1 — policyuppsättningen (hela, inte bara de nya):
--   select policyname, cmd, permissive, with_check
--     from pg_policies where tablename='diary_entries' order by cmd;
--   → EXAKT FYRA rader, alla PERMISSIVE, ingen med cmd = 'ALL'.
--     INSERT: ((user_id = auth.uid()) AND check_wellness_consent(auth.uid()))
--     UPDATE: ((user_id = auth.uid()) AND check_wellness_consent(auth.uid()))
--     SELECT / DELETE: with_check NULL, qual (user_id = auth.uid())
--
-- Steg 2 — grinden gäller (rollade transaktioner, ingen data ändrad):
--   2a  INSERT som konto UTAN samtycke  → 42501 new row violates RLS  ✅
--   2b  INSERT som konto MED samtycke   → raden skapades              ✅
--       (2b är den nödvändiga positiva kontrollen: en grind som nekar
--        ALLA hade också gett 42501 i 2a och sett "rätt" ut.)
--
-- Steg 3 — art. 15 och 17 gäller oberoende av samtycket. Simulerat genom
-- att nolla samtycket inne i transaktionen och rulla tillbaka:
--   3a  SELECT utan samtycke → 1 rad läst      (art. 15)  ✅
--   3b  DELETE utan samtycke → 1 rad raderad   (art. 17)  ✅
--   3c  UPDATE utan samtycke → 42501            ✅
--       (3c är poängen med att grinda UPDATE: utan den kunde någon som
--        återkallat sitt samtycke fortsätta lämna nya hälsouppgifter,
--        bara genom en annan verbform.)
--
-- EFTER KÖRNING: dagboksrader = 1, profiler_med_samtycke = 2,
-- antal_policyer = 4 — oförändrat. Alla prov var rollade.
--
-- ROLLBACK (om något behöver backas)
-- ----------------------------------
--   BEGIN;
--     DROP POLICY IF EXISTS "Users can create own diary entries with wellness consent" ON diary_entries;
--     DROP POLICY IF EXISTS "Users can update own diary entries with wellness consent" ON diary_entries;
--     CREATE POLICY "Users can create own diary entries"
--       ON diary_entries FOR INSERT WITH CHECK (user_id = auth.uid());
--     CREATE POLICY "Users can update own diary entries"
--       ON diary_entries FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
--   COMMIT;
-- ============================================================================
