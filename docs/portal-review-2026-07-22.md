# Helhetsgranskning 2026-07-22 — Jobin (Deltagarportalen)

> **Metod:** 7 parallella granskningsagenter (kod/arkitektur, säkerhet, UX/tillgänglighet, prestanda, produkt, AI-funktioner, dokumentation/test), samtliga read-only mot main @ `1baf954d`. Uppdraget var att hitta **nya** fynd utöver `portal-review-2026-07.md` (2026-07-10) — allt som redan är ✅ i ROADMAP spår A–F upprepas inte här.
> **Verifieringsläge:** Statisk kod- och buildanalys + körda kommandon (`typecheck:critical`, ESLint, `npm run test:run`, `npm run build`, `npm audit`, `lint:design`, `report:i18n`). Ingen browser-verifiering — fynd markerade "härlett" är inte uppmätta i drift. Sifferpåståenden i agentrapporterna stickprovades: ai.js har **24** AI-funktioner, `supabase/migrations/` har **118** .sql-filer, `e2e/` har 10 verktygsskript.

## Sammanfattning — de tio viktigaste fynden

1. **[SÄKERHET, HIGH/CRIT] `invitations`-tabellen är öppen för anonym massläsning.** `USING (true)`-policy utan tokenmatchning → vem som helst med anon-nyckeln kan läsa ut alla inbjudningar: e-post, telefon, roll och den hemliga inbjudningstoken. Systempar till kända A7 (`profile_shares`) men med känsligare fält. → ROADMAP A10.
2. **[SÄKERHET, HIGH] SSRF i `cv-pdf.js`.** `printUrl` byggs från ovaliderad `Origin`-header och matas till server-side Chromium — en autentiserad användare kan få Jobins Puppeteer att rendera en attacker-kontrollerad sida. → A11.
3. **[SÄKERHET/KOSTNAD, MED] `ai-stream.js` saknar dygnstokentaket** som `ai.js` har (`checkDailyTokenCap`) — kostnadsskyddet C4 kan kringgås via streaming-endpointen. → A12.
4. **[ÄRLIGHET] Kompetensgapsanalysen visar delvis påhittade resultat.** `SkillsGapAnalysis.tsx` regex-parsar fritext-streaming och faller vid miss (vanligaste fallet) tillbaka på hårdkodade exempelkompetenser/kurser — oavsett användarens CV. En färdig JSON-variant av `kompetensgap` finns redan i ai.js men används inte. → B6.
5. **[ÄRLIGHET] Konsulentens analysflik visar fabricerad trenddata.** `consultantInsights.calculateTrends` genererar "föregående period" med `Math.random()` och renderas live via `InsightsPanel` på `/consultant/analytics`. Samma fil maskerar dessutom DB-fel som "inga riskdeltagare" (`assessParticipantRisks` returnerar `[]` i catch). → B5.
6. **[WCAG] Tangentbordsdöda sektioner på Nätverk-sidan.** `NetworkTab.tsx:723,748` — expanderbara `<div onClick>` utan role/tabIndex/onKeyDown/aria-expanded; innehållet är onåbart för tangentbords- och skärmläsaranvändare. + 58 hårdkodade svenska `aria-label` i 42 filer. → F8/F9.
7. **[PRESTANDA] STA-konsulentvyn over-fetchar O(5N).** `useConsultantStats` drar full detaljdata (5 queries/deltagare) för hela caseloaden vid varje sidladdning, fast lista+KPI bara behöver aggregat. Härlett: ~150 anrop för 30 deltagare. → E8.
8. **[DÖDKOD] Ett tredje dött subsystem: journey/gamification (~4 300 rader)** + ett andra dött widgetsystem (`components/dashboard/widgets/`, hänger på orutade `pages/Dashboard.tsx`) + 9 av 24 AI-funktioner i ai.js utan anropare + döda AI-UI-dubbletter. Samtidigt loggar `useAchievementTracker` poäng till DB som användaren aldrig ser. → C9–C13, G9.
9. **[CI] a11y-e2e-svepet körs aldrig.** `axe-a11y.spec.ts` och `regression-fas-a.spec.ts` saknas i båda e2e-jobbens kommandorader i `ci.yml`. STA — en av fyra huvudfunktioner — saknar helt e2e-täckning. → D8/D9.
10. **[DEPENDENCIES] 4 high + 1 moderate i produktionen** (`npm audit --omit=dev`): dompurify (själva XSS-skyddets motor), react-router-dom, ws, undici. Fix finns för samtliga. → A14.

Positivt: typecheck:critical och ESLint är gröna, 710 tester passerar, grundskyddet (RLS-mönster, CORS, JWT, rate-limit-arkitektur, PII-sanering) är genomgående välbyggt, designsystemet efterlevs (lint:design 52/52 = baseline), Framer Motion-användningen är återhållsam och asset-pipelinen välskött.

---

## 1. Säkerhet

### Nya fynd (utöver security-audit.md och spår A)

| Fynd | Allvar | Fil | Detalj |
|---|---|---|---|
| `invitations` öppen SELECT | **HIGH/CRIT** | `supabase/migrations/20260412130000_fix_invitation_acceptance.sql:152-156` | `USING (true)` utan `TO authenticated`, ingen tokenmatchning i villkoret. Exponerar email, token (hemligheten!), role (inkl. CONSULTANT/ADMIN), consultant_id, metadata (namn/telefon/STA-id). Fix: SECURITY DEFINER-RPC `get_invitation_by_token(p_token)` — samma mönster som A7-fixen. Ingen senare migration ersätter policyn (verifierat). |
| SSRF i CV-PDF | **HIGH** | `client/api/cv-pdf.js:207,225,239` | `ALLOWED_ORIGINS` sätter bara svarshuvud — blockerar aldrig anropet. `printUrl` byggs från `req.headers.origin` och ges till `page.goto()`. Fix: validera origin mot allowlisten (eller env-styrd bas-URL) innan URL-bygget. |
| Dygnstokentak saknas i streaming | **MED** | `client/api/ai-stream.js` (hela) vs `ai.js:170-201` | `checkDailyTokenCap` (50k/dygn/användare) finns bara i ai.js. Fix: kopiera blocket. |
| 7 oskyddade proxy-edge-funktioner | **MED** | `af-jobsearch`, `af-taxonomy`, `af-trends`, `af-enrichments`, `af-historical`, `af-jobed`, `education-search` | Ingen auth, ingen rate limit (verifierat via grep), `af-enrichments` har `ACAO: *`. Publikt nåbara open proxies mot Jobtech-API:erna — kostnads-/kvot-/IP-blockningsrisk. C4-beslutet (aug) löser inte att de är nåbara *nu*. Fix: minst per-IP-rate-limit via `_shared/rateLimit.ts`, överväg anon-JWT-krav. |
| Sårbara prod-beroenden | **MED/HIGH** | `client/package.json` | `dompurify@3.3.3` (sanerings-bypass — grunden för `utils/sanitize.ts`!), `react-router-dom@7.13.0` (RCE via turbo-stream m.m.), `ws@8.20.0`, `undici@5.28.4`. `npm audit fix` täcker alla; regressionstesta react-router. |
| `GRANT ALL ... TO anon` | LOW | `20260316_fix_cv_save_issues.sql:126` (cvs), `20260315_fix_user_preferences.sql:75` | RLS blockerar idag, men blankogrant = en framtida policy-miss blir direkt anon-exploaterbar. Fix: `REVOKE`. |
| Bolagsverket-catch läcker fel | LOW | `supabase/functions/bolagsverket/index.ts:461-476` | Returnerar `error.message` rått + `ACAO: origin \|\| '*'`. Flaggades redan MEDIUM-007 i maj-audit — aldrig stängd. Fix: `createErrorResponse`. |
| Diverse | LOW | `job-alerts.js` (ingen metod-allowlist, ingen fetch-timeout på AF-anrop), `cloudStorage.ts:1758,1774` (wellness-data i localStorage — Art 9-närliggande, jfr LOW-2605-07), `authStore.ts:495-498` (profil inkl. `health_consent_at` persisteras i localStorage) | Defense-in-depth-städning. |

## 2. Ärlighet i produkten (spår B-klass, nya fynd)

1. **Fabricerad trend i konsulent-analytics** — `consultantInsights.ts:213-290` (`calculateTrends`, kommentar "Simulating previous period data", `Math.random()`), konsumeras av `InsightsPanel.tsx:65`, renderad i `AnalyticsTab.tsx:827`. Ironi: AnalyticsTab har redan en egen ÄRLIG `calculateTrends` (rad 594) sedan en tidigare fejk-sanering — fixen missade InsightsPanels separata datakälla. **Samma fil maskerar fel som tomt:** `assessParticipantRisks` (rad 300-379), `generateParticipantInsights`, `calculateTrends` returnerar alla `[]` i catch → en nätverksglitch visar konsulenten "inga riskdeltagare". Farligt givet uppföljningsansvaret.
2. **Kompetensgapsanalysen** — `SkillsGapAnalysis.tsx:145-163` streamar fritext (`ai-stream.js:215-219`), `parseAIResponse()` (rad 203-286) regex-letar efter format modellen aldrig instruerats producera, fallback = hårdkodade "Projektledning 3→5", "LinkedIn Learning"-kurser (rad 240-245, 268-272). JSON-varianten finns redan: `ai.js:363-371` (`parseJson: true`) + färdigt Zod-schema i `aiSchemas.ts` — inget av det inkopplat.
3. **"Skapa karriärplan" använder ingen AI** — `pages/career/PlanTab.tsx:148-200` skapar tre hårdkodade generiska milstolpar oavsett input, trots att `karriarplan`-funktionen finns färdig i BÅDA backendarna med systemets striktaste rate limit (5/15 min) och noll anropare.
4. **Tyst JSON-fallback utan felsignal** — `ai.js:1112-1114`: trasig JSON → `{ success: true, x: { raw } }`; klienter som destrukturerar får `undefined` utan signal. `aiSchemas.ts` (`safeParseAiResponse` + scheman) byggdes uttryckligen mot detta (audit-fynd H8) men har **noll produktionsanrop**; `StaDocumentDraftSchema` matchar dessutom inte den verkliga svarsformen (objekt, inte array) och `staAiApi.ts:28-38` gör en ovaliderad cast.

## 3. UX & tillgänglighet

- **`NetworkTab.tsx:723,748`** (live på Nätverk under Resurser): expanderbara sektioner som `<div onClick>` utan `role="button"`, `tabIndex`, `onKeyDown`, `aria-expanded` — rakt WCAG 2.1.1-brott. Korrekt mönster finns redan i `ExperienceEditor.tsx:201-212` att kopiera.
- **58 hårdkodade svenska `aria-label` i 42 filer** — skärmläsare annonserar svenska i engelskt UI. Värst: `NotificationBell.tsx` (5 st), spinners med `aria-label="Laddar"` i 8+ applications-filer. Osynligt för `report:i18n` som bara letar JSX-barntext → utöka detektorn till attribut, annars återkommer luckan.
- **5 oöversatta "editorial-spot"-stycken** (infördes efter i18n-svepet): `Career.tsx:79`, `Diary.tsx:235`, `PersonalBrand.tsx:64`, `Salary.tsx:62`, `International.tsx:62`.
- **Dödkod med inbyggda brister** (rör ej prod men frestande att återanvända): `AchievementCelebration.tsx` (confetti + bounce-loop + 5s auto-dismiss-modal = tre Manifest/WCAG-brott samtidigt), `components/actionplan/ActionPlan.tsx`, `MobileSimplified.tsx`, `ApplicationsTracker.tsx`, `PlatsbankenIntegration.tsx`, `ui/BottomSheet.tsx` (ingen dialog-roll/fokus-trap; oimporterad).
- Verifierat OK: fokusringar, img-alt, skip-links, prefers-reduced-motion, hub-kortdensitet, lint:design 52/52, report:i18n-resten är innehållsdata (känt produktbeslut).

## 4. Prestanda

- **E8 (störst): `useConsultantStats` i `useSta.ts:178-217`** — 5 fulla queries per deltagare för hela caseloaden vid varje load/`reload()` (efter varje mutation), men lista+KPI behöver bara aggregat. Fix: counts/status-RPC för listan, fulldata endast för öppnad deltagare. (Härlett ur koden, ej uppmätt i drift.)
- **Dubbel ocachad 15-endpoints-fetch:** `AIAssistant.tsx:152` använder legacy-`useDashboardData` (ej React Query) och renderas ×2 på `Exercises.tsx:791,842` → hela hämtningen körs dubbelt per sidbesök. Fix: byt till `useDashboardDataQuery`, deprecatea legacy-hooken.
- **Entry är 634 kB raw / 190 kB gzip** (drift uppåt från dokumenterade 605). Enda 3 sidor av ~50 som INTE är lazy: `Landing`, `Login`, `Register` (`App.tsx:9-11`) — inloggade betalar ~33 kB gzip i onödan, plus `CoachWidget`+`data/coaches.ts` (36 kB) som laddas ovillkorligt via `Layout.tsx:31-37` även när widgeten är avstängd, plus båda date-fns-localerna i `NotificationBell.tsx:26-27`.
- **`select('*')`-rest:** 177 träffar i 24 servicefiler; tyngst `cloudStorage.ts` (25) och `careerApi.ts` (17). Notabelt: `jobApplicationsApi` (cloudStorage) och `applicationsApi.ts` är **två parallella dataåtkomstvägar till samma tabell** — konsolidering före kolumntrim.
- Småfynd: `useSta.ts` har 3 döda exporterade hooks (~112 rader), `profileStore.ts:486-491` returnerar nya objekt utan useShallow (men hooksen är oanvända), `ThemeContext.tsx:90-96` saknar useMemo på value.
- Verifierat OK/oförändrat: pako×3 & docx korrekt lazy, Sentry lazy+consent-gated, api/-cold-start lean, bilder välhanterade (ViteImageOptimizer + brotli).

## 5. Produkt

- **G1 (STA statusflöde) är mindre än roadmapen antyder:** statusenum (`draft→consultant_review→approved→submitted`) finns i datamodellen (`20260512_sta_data_model.sql:229`), `staApi.approve()`/statusmetoder finns (rad 941,946), konsulentens DocumentsTab har redan statusfilter (`StaConsultant.tsx:4057-4069`) — men `DocumentDraftPanel.tsx` saknar knapparna, så status fastnar på `draft` för evigt. Minsta värdefulla steg = tre knappar + enkel konsekvenscheck (**S–M**, inte L).
- **Poäng loggas men syns aldrig:** `useAchievementTracker` är inkopplad i useApplications/useCVAutoSave/useSavedJobs/MoodTracker/Article/InterviewSimulator och skriver till `log_user_activity` — men inga av de färdigbyggda visningskomponenterna (`NextStepCard`, `WeeklySummary` ×2, `JourneyCelebration`, `AchievementCelebration`, `DailyStep`) är monterade. Ren skrivkostnad utan produktvärde. Antingen montera EN kurerad yta på HubOverview (inom "lugn vän"-ramen) eller sluta logga.
- **AI-personalisering outnyttjad:** `useAITeamContext` (profil, CV, RIASEC, energi) används bara av AI-team-chatten; `AICareerChatbot` skickar inget av det till samma `chatbot`-funktion. RIASEC förekommer **aldrig** i någon AI-prompt (0 grep-träffar i client/api + supabase/functions); dagbok/energi bara i STA-prompterna — inte i `mentalt-stod`/`jobbtips` där de hör hemma.
- **Mood-data i 3 tabeller** (`mood_logs`, `mood_history`, `calendar_mood_entries`) — blockerar AI-kontextbygget; konsolidera innan vidare wellness-AI.
- **G4 bekräftad öppen:** `/profile` saknas i min-vardag-hubbens memberPaths (`navigation.ts:292-298`).
- **G2-notis:** `sta-week-summary`-endpointen finns; enda cron-jobbet är GDPR-gallringen — schemaläggning + leveranskanal saknas.
- Konsulentvyn: "Min dag" är verklig data (levererad). Nästa vardagsnytta: batch-granskning av AI-utkast (sta-automation Del F) och deltagartransparens "Det här ser din konsulent" (STA-FORBATTRINGSFORSLAG B5).

## 6. AI-lagret

- **9 av 24 funktioner i ai.js utan anropare** (verifierat via call-site-grep): `karriarplan`, `intervju-forberedelser` (högsta maxTokens: 2000), `cv-optimering`, `generera-cv-text`, `jobbtips`, `loneforhandling`, `natverkande`, `ansokningscoach`, `mentalt-stod`. Radera eller koppla in — största deltagarvärdet: `karriarplan` → PlanTab (se B7).
- **Döda dubbletter:** `components/career/{CareerCoach,SalaryInsights,SkillsDevelopment,NetworkingGuide}.tsx` anropar funktionsnamn som inte finns (skulle 400:a) men är orutade; `AIWritingAssistantSecure.tsx` (enda klient till `ai-cv-writing`-edge) är orenderad; `hooks/useSupabase.ts` (enda väg till `cv-analysis`-edge som fakturerar GPT-4 direkt!) har noll anropare — radering kan vara billigare än den migrering AI_MODEL_LOCKING.md rekommenderar; `coverLetterApi.generate()` + `lib/supabase.ts:284-316` callerlösa (edge-funktionen `ai-cover-letter` har dock en bättre no-platshållare-prompt värd att flytta till ai.js:s `personligt-brev` före radering).
- **Server-side timeout saknas i Vercel-vägen:** `ai.js:208-237,1086-1104` och `ai-stream.js:305-326` har ingen AbortController (edge-funktionerna har 20-25 s) — och klientens `AI_TIMEOUT_MS` = exakt 60 s = Vercels maxDuration → kapplöpning i stället för marginal. Fix: 45 s server-abort, klient <60 s.
- **Nya AI-möjligheter inom låst modell:** sessionssammanfattning i Intervjusimulatorn (schemat `IntervjuSimulatorResultSchema` finns redan, oanvänt), veckoreflektion för icke-STA-deltagare (återanvänd `sta-week-summary`-mönstret med dagbok/wellness-data).
- Verifierat OK: modellåsningen konsekvent i båda backends, rate-limit/PII-sanering/prompt-injection-skydd genomarbetade.

## 7. Dokumentation, test & CI

- **CI-luckor:** `axe-a11y.spec.ts` + `regression-fas-a.spec.ts` körs aldrig (saknas i `ci.yml` rad ~203/247); ingen `concurrency`-grupp i ci.yml/deploy.yml; `npm audit` och deployens API-hälsokontroll har `continue-on-error: true` (kan aldrig fälla).
- **e2e:** STA helt otäckt; CV-PDF-exporten (historiskt buggbenägen) otestad; golden path är livstecken, inte interaktion (medvetet).
- **Testtäckning:** 47/59 services otestade — viktigast `consultantService.ts` (hade redan en tyst prod-bugg, B3), `cvApi`, `coverLetterApi`, `staAiApi` (Art 50-yta), `unifiedProfileApi`; 41/43 hooks otestade (särskilt `useSta`, de E5-migrerade cache-hooksen); stores utom auth/cv otestade (`energyStoreWithSync` = racerisk).
- **Dokument som vilseleder:** `docs/AI_ARCHITECTURE_OVERVIEW.md` (mars 2026) beskriver filer som inte finns (`services/ai/*`) och modeller som strider mot låsningen → arkivera/skriv om. `docs/api/services-overview.md` dokumenterar fiktiva `cvMatcher.ts`/`jobMatchingService.ts`. `docs/claude-code-guide.md` rekommenderar `npx tsc --noEmit` — exakt no-op-fällan E7 dokumenterar. `client/README.md` = orörd Vite-mall.
- **CLAUDE.md-sifferfel** (rättade 2026-07-22): ai.js har 24 funktioner (inte 22), 118 migrationsfiler (inte 120), 10 e2e-verktygsskript (inte 7), tre spökkomponenter i katalogen (`GettingStartedChecklist`, `QuickWinButton`, `SmartQuickWinButton` finns inte).
- **Migrations:** äkta tidsstämpelkollision — `20260306130000_fix_all_rls_and_tables.sql` och `20260306130000_fix_all_rls_policies.sql` delar version-nyckel; ofarligt med dagens manuella flöde, fälla om `db push` någonsin körs. Två `20240303`-filer sticker ut kronologiskt (trolig namngivningsmiss).

---

## Prioriterad åtgärdslista (förslag)

**Nu (säkerhet + ärlighet, allt S/S–M):**
1. A10 `invitations`-RLS → SECURITY DEFINER-RPC
2. A11 SSRF-fix i cv-pdf.js
3. A12 dygnstokentak i ai-stream.js
4. A14 `npm audit fix` + regressionstest
5. B5 InsightsPanel: ärlig trend + fel-signalering
6. B6 Kompetensgap → JSON-varianten + Zod-validering
7. D8 axe-a11y + regression-fas-a in i CI
8. F8 NetworkTab-tangentbordsfix

**Härnäst:**
9. A13 rate limit på 7 proxy-edge-funktioner (M)
10. C9–C13 dödkodssvepet (journey/gamification, widgets gen 2, döda AI-dubbletter, 9 orphanfunktioner) (M)
11. B7/G-koppling: karriarplan-AI till PlanTab (M)
12. E8 STA-overfetch → aggregat-RPC (M)
13. E9 AIAssistant → useDashboardDataQuery (S)
14. F9 aria-label-svep + detektorutökning (M)
15. D9 STA-e2e-spec (M)
16. Dokumentsvepet: AI_ARCHITECTURE_OVERVIEW, services-overview, claude-code-guide (S–M)

**Senare:** E10 lazy auth-sidor + CoachWidget, G9 montera retention-yta, G10 AI-personalisering (RIASEC/energi i prompts), mood-datakonsolidering, servicetester (consultantService m.fl.), migrations-namnkollision, select('*')-svansen.

*Fullständiga agentrapporter med samtliga fil:rad-referenser finns i respektive avsnitt ovan; ROADMAP.md (version 2026-07-22) är den operativa planen.*
