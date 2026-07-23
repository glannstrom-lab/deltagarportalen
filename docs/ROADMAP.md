# Roadmap — Jobin (Deltagarportalen)

> **Detta är projektets enda gällande plan.** Version 2026-07-22, utifrån `docs/portal-review-2026-07.md` (2026-07-10) + `docs/portal-review-2026-07-22.md` (7-agenters uppföljningsgranskning; nya punkter A10–A15, B5–B8, C9–C15, D8–D12, E8–E11, F8–F10, G9–G13).
> **Prioriteringsstatus: förslag.** Punkterna nedan är grupperade i spår A–G och rankade inom varje spår, men horisonten (vad som görs först) väntar på Mikaels val — se §7. Undantag: spår A är deadline-styrt (AI Act 2 aug 2026) och ligger fast som "Nu".
> ID:n i parentes (J1, R5, P2 …) behålls från tidigare versioner för spårbarhet.

**Så underhålls dokumentet:** Ett plandokument. Avklarat flyttas till §9. Nya idéer förs in under rätt spår — aldrig i nya plandokument. Detaljspecar (STA, AF-API, EU) är bilagor enligt §8.

---

## Rättelser mot förra versionen (2026-06-22)

- Grenen `fix/review-quick-wins-2026-06-22` är **mergad till main** (inte "committad, ej pushad") — R1/R2/R3/R6/R9 + P1 steg 1 är i produktion. Kvar av det paketet: R6-deploysteget och R10-verifieringen (nu A9).
- ESLint-skulden är **11 errors** (inte 1 019) — gamla A1 är i praktiken klar och utgår.
- LIV fas 4 är delvis levererad (tid-på-dygnet-hälsning finns i HubOverview).
- Leveranser 22/6–10/7 tillagda i §9.

---

## Spår A — Juridik & säkerhet (deadline 2 aug; ligger fast som "Nu")

| # | Uppgift | Detaljer | Ansvar |
|---|---------|----------|--------|
| A1 (J1) | Rotera läckt OpenRouter-nyckel | CRIT-2605-01 sedan 28 maj; 5 min i dashboarden | **Mikael, idag** |
| A2 (J4) | Boka AI-jurist för Annex III-gränsfall | Längst ledtid; ~4 v efter egen plan. Gränsfall: cv-analysis, kompetensgap, RIASEC | **Mikael, denna vecka** |
| A3 (J5) | Art 50-märkning på alla AI-ytor | ✅ **Klar 2026-07-10** — ~12 ytor märkta (AIResultCard-panelerna ×5, branschradar, CV-assistent, intervjufeedback, LinkedIn, kompetensgap, rapportutkast, STA). Fejk-AI-ytorna (B1/B2) märks när de görs ärliga | Claude |
| A4 (J2/J3) | Färdigställ + signera DPIA & Art 30 | Org-uppgifter/signatur = Mikael; textkomplettering = Claude | Båda |
| A5 (R8) | OpenRouter DPF/SCC/TIA | Art 9-data → USA utan verifierat underlag. Claude tar fram underlag, Mikael verifierar/signerar DPA | Båda |
| A6 (R7) | Aktivera pg_cron + kör retention-migrationen | Utan den sker ingen Art 5.1.e-gallring | **Mikael** (dashboard) + Claude (verifiering) |
| A7 (R5) | Scopa `profile_shares`-RLS | ✅ **Klar 2026-07-23** — öppna policyn + anon-grant borta; SECURITY DEFINER-RPC `get_shared_profile` gör hela uppslaget server-side (validering, view_count — som tidigare aldrig räknades för anonyma besökare — och filtrerad profil; password_hash exponeras inte längre). `getSharedProfile` omskriven + 4 tester. Verifierat mot prod: anon-enumeration = permission denied. Migration `20260723110000` | Claude |
| A8 | Rate limit på `learning-analyze-gap` | ✅ **Klar 2026-07-10** — 5/min via `_shared/rateLimit.ts`, deployad | Claude |
| A9 (R6/R10) | Deploy-verifiering + uppdatera security-audit.md | ✅ **Klar 2026-07-10** — alla 24 edge-funktioner omdeployade med main-kod, Vercel-deploy verifierad, auditen nydaterad. Kvar för Mikael: dashboard-verifieringarna (OAuth-allowlist, pg_policies, FK-cascades) | Claude + Mikael (dashboardkoll) |
| A10 | **`invitations`-RLS: anonym massläsning** | ✅ **Klar 2026-07-23** — öppna `USING(true)`-policyn droppad; tokenmatchad SECURITY DEFINER-RPC `get_invitation_by_token` (returnerar bara id/email/role/metadata) + `REVOKE ALL FROM anon`; `InviteHandler.tsx` omskriven. Migration `20260723090000_fix_invitations_rls.sql` | Claude |
| A11 | SSRF i `cv-pdf.js` | ✅ **Klar 2026-07-23** — Origin valideras mot CORS-allowlisten (inkl. preview-regex) innan `printUrl` byggs; okänd origin → jobin.se | Claude |
| A12 | Dygnstokentak i `ai-stream.js` | ✅ **Klar 2026-07-23** — `checkDailyTokenCap` (50k/dygn) kopierad från ai.js, kollas före SSE-headers så 429 skickas som JSON | Claude |
| A13 | Rate limit på 7 oskyddade proxy-edge-funktioner | ✅ **Klar 2026-07-23** — ny `_shared/proxyGuard.ts`: per-IP-limit (30–60/min) via distribuerade `check_rate_limit` i alla sju + allowlistad CORS ersätter `'*'` i de fem som hade wildcard. Alla sju omdeployade | Claude |
| A14 | `npm audit fix` i client/ | ✅ **Helt klar 2026-07-23** — dompurify 3.4.12, react-router-dom 7.18.1, ws 8.21.1 + `@vercel/blob` 0.27→2.6.1 (undici 6.27.0; `addRandomSuffix: true` explicit för bevarat uppladdningsbeteende). `npm audit --omit=dev` = **0 sårbarheter** → CI-audit är nu en skarp gate (`--omit=dev --audit-level=high`, continue-on-error borttaget). 710 tester + build gröna | Claude |
| A15 | Säkerhetssmåfix | ✅ **Klar 2026-07-23** — `REVOKE anon` på cvs/user_preferences (migration `20260723100000`), bolagsverket-catch → `createErrorResponse` (stänger gamla MEDIUM-007), metod-allowlist (POST/GET) + 8s AF-fetch-timeout i job-alerts.js. Bonus: deployens API-hälsokontroll lagad på riktigt (health kräver anon-JWT — curlen skickade ingen; nu skarp i stället för continue-on-error) | Claude |

## Spår B — Ärlighet i produkten (nya fynd 2026-07-10)

| # | Uppgift | Detaljer |
|---|---------|----------|
| B1 | Fejk-AI på `/career/adaptation` | ✅ **Klar 2026-07-10** — `adaptation-recommendations` + `adaptation-conversation` byggda i ai.js, fliken använder callAI (auth), ärliga fel i stället för maskerad fallback, Art 50-märkt |
| B2 | Simulerad AI i CV-byggarens "Anpassa för jobb" | ✅ **Klar 2026-07-10** — ny `cv-jobbmatchning` (JSON) i ai.js ersätter den simulerade nyckelordslistan; ärlig felhantering + Art 50-märkning |
| B3 (R2b) | Konsulent-bulk: tagg-backend + PDF-export | ✅ **Klar 2026-07-10** — `consultant_participants.tags text[]` + vy + service + taggchips i deltagarlistan; PDF-export via jspdf-autotable. **Bonusfynd:** servicen skrev till obefintliga tabellen `participant_consultants` → status/prioritet/kontakt-uppdateringar har misslyckats tyst i prod; rättat till `consultant_participants` |
| B4 | "Kommer snart"-svep | ✅ **Klar 2026-07-10** — LinkedIn-import-teaser (Profil) och videokort (CV-tips) borttagna, badge-delning fick riktig Web Share/urklipp, superadmins tomma Inställningar-flik borttagen, "Kommer snart" → "Inga artiklar än" i Kunskapsbanken |
| B5 | **Fabricerad trend + maskerade fel i konsulent-analytics** | ✅ **Klar 2026-07-23** — `calculateTrends` (Math.random-"förra perioden") ersatt av ärliga `getKeyMetrics` (ögonblicksvärden, ingen fejkjämförelse — historiska snapshots saknas); tre servicefunktioner kastar nu fel i stället för att returnera `[]`; `InsightsPanel` fick felläge med "Försök igen". Fliken heter "Nyckeltal" i stället för "Trender" |
| B6 | **Kompetensgapsanalysen: regex-parsning med hårdkodad fallback** | ✅ **Klar 2026-07-23** — sidan använder JSON-varianten (`callAI('kompetensgap')`) med omskriven prompt i sidans exakta format + `safeParseAiResponse(KompetensgapSchema)`; regex-parsern och alla hårdkodade fallback-resultat raderade; ärligt felmeddelande vid valideringsmiss (inget sparas). Streaming-varianten borttagen ur ai-stream.js + typunionen |
| B7 | "Skapa karriärplan" utan AI | ✅ **Klar 2026-07-23** — knappen anropar nu `karriarplan` på riktigt (omskriven prompt: situation/mål/tidsram → 4-5 personliga steg med actions), Zod-valideras (`KarriarPlanSchema` omskriven till verklig svarsform), milstolpar skapas från AI-stegen, Art 50-vattenmärke på genererade planer. Vid AI-fel: planen sparas ändå utan förslag + ärligt meddelande (sv+en) |
| B8 | AI-svarsvalidering: koppla in `aiSchemas.ts` | ✅ **Klar 2026-07-23** — `StaDocumentDraftSchema` omskriven till verklig form (`Record<sectionKey, {title,content}>` + wrapper-normalisering), inkopplad i `staAiApi.generateDocumentDraft` med ärligt fel vid mismatch. **Bonusfynd:** `sta-document-draft` saknade `parseJson` → `response.sections` var en RÅ JSON-STRÄNG som castades till objekt (tyst trasigt); lagat + 3 nya schematester. `kompetensgap`/`karriarplan`-schemana kopplades in i B6/B7 |
| B9 | **AI-brevet hittar på meriter** | ✅ **Klar 2026-07-23** — `personligt-brev`-prompten skärpt: får aldrig hitta på erfarenheter/verktyg/titlar/siffror (osäker → utelämna) + skriver ingen egen avslutningsfras (mallen lägger en → dubbleringen borta). Prompt-nivåfix; om det återkommer = klient-strip i CoverLetterWrite som nästa försvar |

## Spår B-buggar från UX-testet 2026-07-23 (prod-verifierade, ej ärlighet men användarblockerande)

| # | Uppgift | Detaljer |
|---|---------|----------|
| UX1 | Registrering trasig | ✅ **Klar 2026-07-23** — `useZodForm.handleBlur` läste `e.target.value` (alltid "on") för checkboxar → "Invalid input" på ikryssade samtyckesrutor, feltexten sköt layouten mitt i klicket → Registrera-knappen låst i normal klicktakt. 3 av 5 UX-agenter blockerades. Fixad + 12 tester gröna |
| UX2 | **"Skapa ansökan" i jobbannons kraschar** | ✅ **Klar 2026-07-23** — `workflowApi.createApplication` styrd från trasiga `cloudStorage.savedJobsApi.update()` till `applicationsApi` (samma tabell/API som Kanban-vyn); UPDATE på rätt kolumner för befintligt jobb, INSERT för nytt. **Bekräftade E11-utredningen: `applicationService`/`job_applications` är nu helt orphanad dödkod** → E12 kvarstår (full trevägs-konsolidering + `nextStepApi`-räkningen som pekar på döda tabellen) |
| UX3 | Intervjusimulatorn tappar all data utan varning | ✅ **Klar 2026-07-23** — bekräftelsedialog (useConfirmDialog) före Avsluta, `saveSimulatorSession` (localStorage) + sammanfattningsskärm (snitt/svar/feedback/nedladdning) + `beforeunload`-skydd mot reload |
| UX4 | Råa i18n-nycklar + otextad text i prod | ✅ **Klar 2026-07-23** — rotorsak: hela `health`-namespacet saknades i locale-filerna (i18next returnerar råa nyckeln) → ICF-blocket + Dagbokens/Wellness samtyckesgrind (UX7) fick nu `health.consent.*`+`wellness.consent.*`; `nav.hubs` tillagt i en.json (hub-namn översätts); "Failed to fetch" → alltid `analysisFailed` |
| UX5 | Snabb-CV falsk framgång + Big Five | ✅ **Snabb-CV klar 2026-07-23** — sparar nu via `cvApi.saveVersion` + ärligt fel om det misslyckas. **Big Five = INTE kodbugg** (verifierat: äkta beräkning från 10 egna Likert-frågor; 63% är en kollision när 2 frågor/drag summerar till 7). Följdpunkt: 3:e fråga/drag + `IntroScreen`-räkning (34→39) för högre upplösning |
| UX6 | Karriärplan-knapp felkopplad | ✅ **Klar 2026-07-23** — "Uppdatera plan" var kopplad till `deletePlan()`; copyn rättad till "Börja om med en ny plan" (matchar beteende) |
| UX7 | Schema-fel `share_health_data_with_consultant` | ✅ **Klar 2026-07-23** — rotorsak var frontend-kolumnnamnsbugg (koden läste `_with_consultant`-suffix; tabellen har `share_health_data`/`share_wellness_data`) + latent upsert-bugg (saknade `consultant_id` i composite-nyckeln). `DataSharingSettings` rättad; migration `20260723120000` (idempotent skydd) körd mot prod + kolumner verifierade. WellnessConsentGate monterad runt HealthTab (rätt gate: `wellness_consent_at`) |
| D11 | Konsulentens felmaskering → generellt mönster | ✅ **Klar 2026-07-23** — 5 fynd åtgärdade: `getAnalytics` kastar vid DB-fel (var "noll deltagare"), 7 mutationsmetoder fick auth-guard, `unifiedProfileApi` skiljer PGRST116 (ingen data) från äkta fel, `updateCore` felcheckar bakåtkompat-skrivning, `generateWeekSummary` kräver icke-tom sträng. Tester uppdaterade + nya |

## Spår C — Städning & dödkod

| # | Uppgift | Detaljer |
|---|---------|----------|
| C1 | Arkivera widget-systemet | ✅ **Klar 2026-07-10** — hela `components/widgets/` + `useWidgetLayout`/`useWidgetSize` (+tester) → `archive/2026-07-widget-system/`; levande typer flyttade till `hooks/hubSummaryTypes.ts`. Testsviten −184 tester som vaktade dödkod |
| C2 | Radera småskrot | ✅ **Klar 2026-07-10** — CompactDashboard, MobileDashboard, ai-team/OnboardingModal, useServiceWorker raderade; SW-avregistrering 4→1 ställe (index.html); UpdateNotification förenklad till offline-indikator; `ovningshjalp` borta ur ai.js |
| C3 | Ta bort `VITE_HUB_NAV_ENABLED` | ✅ **Klar 2026-07-10** — flaggan + legacy-grenar borta ur App/Sidebar/Layout/HubBottomNav, nav-flag-flip-testet raderat, 14 e2e-skript rensade. **Korrigering:** navGroups är INTE död — mobilens MobileMainMenu renderar den; behållen och dokumenterad. Rest: pages/Dashboard.tsx blev orutad (E12-kandidat); ta bort flaggan ur Vercel-dashboarden (kosmetiskt, Mikael) |
| C4 | Beslut: 6 callerlösa edge-funktioner | ⬜ **Öppen — kopplad till G6-beslutet (aug).** `learning-*` ×3, `ai-assistant`, `af-jobsearch`, `af-enrichments` behålls tills EU-valet; alla har auth och `learning-analyze-gap` fick rate limit (A8) |
| C5 (E6) | Radera `services/api.ts`-shim | ✅ **Klar 2026-07-10** — 14 importörer omskrivna till källmoduler (supabaseApi/afTrendsApi/afTaxonomyApi/afJobEdApi), shimmen raderad |
| C6 (S3) | Kurera `e2e/` + skriv om README | ✅ **Klar 2026-07-10** — 82 ad-hoc-skript → `e2e/archive/`, 7 kanoniska kvar, README omskriven. Promota-till-spec väntar på D1 (CI-secrets) |
| C7 (S6) | `design-source/` 36 MB ospårat | ✅ Gitignorerad 2026-07-10 (rå grafik, inga persondata; optimerade versioner i client/public). Långsiktig hemvist fortfarande **Mikaels beslut** |
| C8 | Dokumentarkivering | ✅ **Klar 2026-07-10** — 12× team-betyg, jobsearch-review, AI_ENGINEER_ANALYSIS, RLS_VERIFICATION, onboarding-patterns + .planning/STATE\|ROADMAP\|REQUIREMENTS → `archive/2026-07-dokarkiv/` (README förklarar) |
| C9 | **Arkivera journey/gamification-systemet (~4 300 rader)** | ✅ **Klar 2026-07-23** — `components/journey/` (10) + `components/gamification/` (8) + journeyService/gamificationService + useJourney/useGamification → `archive/2026-07-journey-gamification/` (README förklarar, inkl. varför AchievementCelebration inte ska återaktiveras rakt av). Barrel-exporterna städade; useAchievementTracker/-Chains kvar som levande system |
| C10 | Widgetsystem gen 2 + orutade `Dashboard.tsx` | ✅ **Klar 2026-07-23** — 19 widgets + DashboardGrid/DashboardWidget/4 filterkomponenter + `pages/Dashboard.tsx` (+ dess 18 tester som vaktade dödkod) → `archive/2026-07-widget-system-gen2/`; dashboard-barrelen bantad till levande exporter. Importspårning verifierade noll konsumenter före flytt |
| C11 | Döda AI-dubbletter | ✅ **Klar 2026-07-23** — `components/career/` + `AIWritingAssistantSecure` → `archive/2026-07-doda-ai-dubbletter/`; useCoverLetters/useAIGeneration (GPT-4-vägen)/useConsultantParticipants + lib/supabase-AI-exporterna + `coverLetterApi.generate()` raderade; no-platshållare-reglerna portade till ai.js `personligt-brev` först. **Korrigering av granskningsfyndet:** `useSupabase.ts` var INTE död — useAuth/useCV används av hub-hooksen/AI-team-kontexten (kirurgi, ej radering); lagade även trasig barrel-export. Edge-funktionerna ai-cover-letter/ai-cv-writing/cv-analysis har nu 0 klientanropare → ödet avgörs i C4/G6 (aug) |
| C12 | Beslut per orphanad ai.js-funktion | ✅ **Klar 2026-07-23** — `karriarplan` inkopplad (B7); övriga 8 raderade ur ai.js (24→16 funktioner) + deras aiApi-wrappers (återskapas från git om G10 vill koppla in någon). **Bonusfynd:** hela streaming-lagret var dött efter B6 — `/api/ai-stream`, `useAIStream`, `aiStreamService` hade noll anropare (AgentChat streamar via ai.js egen SSE-gren) → arkiverat + vercel.json-posten borttagen |
| C13 | Dödkodssmåskrot | ✅ **Klar 2026-07-23** — 3 döda useSta-hooks raderade, BottomSheet/actionplan/MobileSimplified/ApplicationsTracker/PlatsbankenIntegration → `archive/2026-07-smaskrot/`, döda profileStore-selektorer bort, ThemeContext-value memoiserat |
| C14 | Konsolidera mood-datalagren | ⬜ Ny 2026-07-22. `mood_logs`/`mood_history`/`calendar_mood_entries` — tre tabeller blockerar AI-kontextbygget (G10) och wellness-rapporter (M–L) |
| C15 | Dokumentsvep | ✅ **Klar 2026-07-23** — AI_ARCHITECTURE_OVERVIEW omskriven från grunden (varje påstående kodverifierat; gamla → dokarkivet), services-overview-fiktionerna ersatta med verkliga moduler, client/README projektspecifik, migrationskollisionen omdöpt (…130001), guide-radsiffror rättade. **Rest:** `AI_MODEL_LOCKING.md` har inaktuella funktionssiffror efter C12; C4-beslutet (aug) bör även täcka learning-*/af-jobsearch/af-enrichments som saknar klientanropare |

## Spår D — Skyddsnät & kvalitet

| # | Uppgift | Detaljer |
|---|---------|----------|
| D1 (S1) | Authenticated E2E i CI | ✅ **Klar 2026-07-10 (kodsidan)** — `e2e-authenticated`-jobb i ci.yml; specarna själv-skippar utan credentials så jobbet aktiveras automatiskt när **Mikael lägger in secrets** TEST_USER_EMAIL/TEST_USER_PASSWORD (+ valfritt TEST_CONSULTANT_*) i GitHub. Fixade även AuthHelper.login som väntade på fel URL efter C3 |
| D2 (S2) | Golden path-spec | ✅ **Klar 2026-07-10** — `e2e/golden-path.spec.ts`: deltagarens kärnflöde (7 sidor i en session) + hubbnav + konsulent-smoke. Provkörd 3/3 grönt mot prod |
| D3 (D2r) | Tester för kärnservices | ✅ **Klar 2026-07-10** — 174 nya tester: applicationsApi (23), careerApi (37), staApi (62), cloudStorage (52). Låser beteendet inför E3–E5-refaktorerna. ~14 källkodsobservationer rapporterade (svalda fel, race i recordPractice, asymmetrisk casing i calendarApi m.m.) — se commit-historik |
| D4 (D6) | Husky + lint-staged | ✅ **Klar 2026-07-10** — pre-commit kör eslint --quiet på stage:ade filer + lint:design |
| D5 | ESLint 11→0 + jaga flaky test | ✅ **Klar 2026-07-10** — 0 errors (villkorlig useMemo i AssessmentEditor var ett äkta rules-of-hooks-brott); flaky = nav-smoke-timeout under maskinlast, höjd 8→20 s |
| D6 (S5) | LCP-baseline + CI-budget | ✅ **Klar 2026-07-10** — baseline mot prod: landning ~340 ms, inloggad översikt ~1 400 ms (median, `e2e/lcp-baseline.cjs`). LCP-budget 2 500 ms som warn i CI:s Lighthouse-jobb; skärp till error när CI-variansen är känd |
| D7 | Robusthetsfynd från testskrivningen | 🔶 **Delvis klar 2026-07-23** — 5 åtgärdade: `favoriteOccupationsApi.isFavorite` (kastar vid fel → ingen dubblett-toggle), `milestonesApi.toggleComplete` (läsfel → kastar, ej alltid-klar), `careerPlanApi.create` (felkontrollerar avaktivering → ej två aktiva planer), `credentialsApi.updateStatus` (null rensar completed_date), `personalBrandApi.recordPractice` (läsfel → kastar, nollställer ej räknaren; kvarvarande samtidighets-race kräver atomisk RPC). **Kvar:** `savedJobsApi.getAll` auth-guard (medvetet ej — RLS scopar, bröt hot-path-tester), `calendarApi` snake/camelCase-asymmetri, `applicationHistoryApi.log`. Detaljer i commit 79f52e78 |
| D8 | **CI-luckor** | ✅ **Klar 2026-07-23** — `regression-fas-a` in i e2e-smoke, `axe-a11y` in i e2e-authenticated (publika sidor auditeras direkt, inloggade när D1-secrets finns); `concurrency` i ci.yml (cancel-in-progress) och deploy.yml (kö, ej cancel); npm-audit-stegets `continue-on-error` dokumenterat som medvetet tills A14-resten (undici/@vercel/blob) är löst. Deployens API-hälsokontroll behåller `continue-on-error` (health-endpointens auth-beteende overifierat) — ta i A15 |
| D9 | STA-e2e-spec | ✅ **Klar 2026-07-23** — `e2e/sta.spec.ts` (deltagarflöde, flik+DOA-vy, konsulentens 5 flikar; livstecken utan datamutation, självskipp utan secrets), in i CI:s e2e-authenticated. Provkörd mot prod: deltagartest + konsulentgren gröna med testkonton. Rest: CV-PDF-export fortfarande otestad |
| D10 | Servicetester våg 2 | ✅ **Klar 2026-07-23 (services-delen)** — 135 nya tester: consultantService (51, låser B3-tabellnamnet), cvApi (27), coverLetterApi (17), staAiApi (19, B8-vägen), unifiedProfileApi (21). Sviten 698→833. **Nya D11-fynd:** getAnalytics maskerar DB-fel som nollstatistik, 7 mutationsmetoder utan klient-auth-guard, unifiedProfileApi sväljer alla fel, generateWeekSummary ovaliderad. Rest: hooks (useSta, E5-cache) + energyStoreWithSync |
| D11 | Konsulentens felmaskering → generellt mönster | ✅ **Klar 2026-07-23** (se UX-blockets D11-rad) — getAnalytics/7 auth-guards/unifiedProfileApi/updateCore/generateWeekSummary. Kvar av D7-svepet: careerApi/cloudStorage tysta fel (lägre prio, ej i denna batch) |

## Spår E — Prestanda

| # | Uppgift | Detaljer |
|---|---------|----------|
| E1 (P3) | Timeout + AbortController på `callAI` | ✅ **Klar 2026-07-10** — 60 s timeout med vänligt felmeddelande |
| E2 | Bildbantning | ✅ **Klar 2026-07-10** — favicon/touch-icon/PWA-ikoner genererade i rätt storlekar (3–110 kB); fem oanvända stor-PNG:er raderade (appen använde redan SVG/WebP). Favicon-nedladdningen gick från ~1,5 MB till 12 kB |
| E3 (P2) | Kolumn-trimma `select('*')` | ✅ **Delvis klar 2026-07-10** — calendarApi.getEvents (24 kolumner explicit), notifications (via E5), döda getUpcomingFollowups raderad; hub-loaders var redan trimmade. Rest: cloudStorage/careerApi-svansen tas i takt med E-refaktorer |
| E4 (gamla E1) | articleData → Supabase/lazy | ✅ **Analyserad 2026-07-10:** contentApi-chunken (1 055 kB: articleData 772 + exercises 263) är REDAN on-demand — bara lazy-sidor importerar den. Ingen eager-belastning. Full Supabase-migrering kvarstår gated på D1-aktivering, nedprioriterad |
| E5 (P4) | React Query-migrering | ✅ **Delvis klar 2026-07-10** — useSavedJobs (7 konsumenter delar cache), useNotifications (TopBar = varje sidvisning; realtime → cache), useDiary (6 hooks), useJobAlerts. Rest: useSta/useLearning/useInsights m.fl. i takt med att sidorna rörs |
| E6 (P1 steg 2) | Bundle-analys | ✅ **Klar 2026-07-10** — entry 655→605 kB (statiska sidor lazy). Fynd: sv.json 290 kB är största entry-posten (medvetet — startspråk), PDF-chunken har 3× pako-kopior (tas i PDF-konsolideringen), xlsx 978 kB egen lazy-chunk. CSS 317 kB = global tailwind, ingen enkel split |
| E7 | **CI-typkontrollen avslöjad + lagad** | ✅ 2026-07-10 — `npx tsc --noEmit` utan `-p` är en NO-OP (solution-style tsconfig). Riktiga gaten är `npm run typecheck:critical`. Den visade 2 crash-fel: hooks-barrelns useServiceWorker-export (från C2 — CI röd sedan dess) + odefinierad `now` i consultantInsights. Båda lagade. OBS: full `typecheck` har ~751 pre-existing strict-fel (ny skuldpost) |
| E8 | **STA-konsulentvyns overfetch** | ✅ **Klar 2026-07-23** — löst med tabell-batchning i stället för aggregat-RPC (alla flikar konsumerar faktiskt fulldatan): nya `listForEnrollments(ids)` (.in-query) i 5 staApi-tjänster + omskriven `useConsultantStats` → **5 queries totalt oavsett caseload** (tidigare 5×N ≈ 150 för 30 deltagare, vid varje load + mutation). Samma datastruktur, alla 62 staApi-tester gröna |
| E9 | AIAssistant dubbel ocachad dashboard-fetch | ✅ **Klar 2026-07-23** — `AIAssistant` använder `useDashboardDataQuery` (delad cache); legacy-hooken `@deprecated`-markerad (kvarvarande importörer är det döda widget-systemet, C10) |
| E10 | Entry-bantning: lazy auth-sidor + CoachWidget | ✅ **Klar 2026-07-23** — Landing/Login/Register lazy (som övriga ~50 sidor), CoachWidget+coaches.ts (36 kB) lazy bakom settings-flaggan via ny `GlobalCoachWidgetContent`. **Entry: 634→520 kB rå (−114 kB)**. Rest (S, lågprio): NotificationBells dubbla date-fns-localer (~8 kB gzip) kräver async-laddning |
| E11 | select('*')-svansen + dubbel dataväg till job_applications | ✅ **Klar 2026-07-23 (trimningen)** — 33 säkra trimningar (cloudStorage 16, careerApi 17); skippade dokumenterat (schemakonflikter i mood_history/interview_sessions, user_preferences, joins). **Utredningen korrigerade granskningsbilden:** det är en TREVÄGS-splitt på `saved_jobs` (cloudStorage/jobsApi/applicationsApi) + separat job_applications-stack, med latent bugg (workflowApi anropar obefintlig `.update()`) och applicationService som läser/skriver obefintliga kolumner. → ny punkt E12 |
| E12 | **Konsolidera saved_jobs-vägarna** | 🔶 **Delvis klar 2026-07-23** — job_applications-stacken utfasad: `nextStepApi`-räkningen (som visade alltid-0 ansökningar i NextStepWidget) flyttad till applicationsApi; `applicationService.ts` arkiverad; `jobApplicationsApi` + typer borttagna ur cloudStorage. **Kvar:** cloudStorage.savedJobsApi + jobsApi.savedJobsApi är fortf. två enklare läsvägar mot saved_jobs (ej trasiga, lågprio att ena), + **beslut om DROP av job_applications-tabellen (destruktivt, Mikael)** |

## Spår F — Design/UX-skuld

| # | Uppgift | Detaljer |
|---|---------|----------|
| F1 (R4) | **Beslut: dark mode i scope eller ej** | ⬜ **Fortfarande Mikaels beslut** (deadline v. 26 passerad). Default `'system'` exponerar oprövad mörk vy |
| F2 (F7) | i18n-svep hårdkodad svenska | ✅ **Klar 2026-07-10** (UI-delen) — ~205 stränganvändningar i hubs (7 filer) + dashboard (13 filer) + PitchTab i18n:ade, 370 nya nycklar/språk. Ny rapport `npm run report:i18n` (rå svenska utanför t()) visar att resterande ~10 000 rader är svenskt INNEHÅLL (övningar/artiklar/yrkesdata) — översättning av innehållet är ett produktbeslut, inte städning |
| F3 (gamla F1) | EmptyState-migrering | ✅ **Klar 2026-07-10** — 8 filer migrerade till `<EmptyState>` med inviter + EN CTA (StaConsultant 5 flikar, WorkDiary, WorkplaceCard, Del3, PitchTab ×2, OccupationsTab, ResultsTab, PrintableResources). DoaSelfAssessment var felflaggad (inget tomtillstånd) |
| F4 (F9) | aria-live på dynamiska vyer | ✅ **Klar 2026-07-10** — sök-/filterresultat annonseras i Ansökningar-pipelinen och Spontanansökans lista (sr-only role=status) |
| F5 | Voice & Tone-svep | ✅ **Klar 2026-07-10** — "Aktivera" → "Slå på" (bevakning, e-post, jobbalert), "Inga aktiva påminnelser" → "Du har inga påminnelser just nu" (sv+en) |
| F6 (G) | Gradients → whitelistad noll | ✅ **Klar 2026-07-10** — baseline 65 → **52 där samtliga är medvetna undantag** (CV-mallar 43, Landing-hero 3, glow 2, tokens 4). Fixbara skulden = 0: ResultsView städad (13), döda gradient-tokens raderade, SVG-diagramgradienter dokumenterade som undantag |
| F7 (ONB) | Onboarding-konsolidering rest | ✅ **Klar 2026-07-10** — läget dokumenterat i DESIGN-DEBT: 1 global + 2 medvetet sidospecifika (Profil, STA); AI-team-modal raderad (C2), CV-tour borta. Rest: ev. Profile-modal-migrering när profilsidan görs om |
| F8 | **NetworkTab: tangentbordsdöda sektioner** | ✅ **Klar 2026-07-23** — båda toggle-diverna (LinkedIn-tips, Networking-manus) har role="button", tabIndex, Enter/Space-hantering och aria-expanded, samma mönster som ExperienceEditor |
| F9 | aria-label-i18n-svep + detektorutökning | ✅ **Klar 2026-07-23 (deltagardelen)** — detektorn utökad (flaggar ALLA literala aria-label, fann 109 st, inte 58); 60 attribut i 33 deltagarvända filer → t() med nycklar i sv+en; delade `CloseButton`-primitivens hårdkodade "Stäng"-default fixad vid källan. Kvar 45 = medvetet undantagna konsulent-/adminvyer (DESIGN.md §2) — listade i F9-agentens rapport |
| F10 | Editorial-spot-texterna → i18n | ✅ **Klar 2026-07-23** — alla 5 (Career/Diary/PersonalBrand/Salary/International) → `<ns>.editorialSpot` i sv+en |
| F11 | **STA-modulen saknar i18n helt** | ⬜ Nytt fynd 2026-07-23 (F9-svepet): hela `pages/sta/**` — inklusive deltagarvända delarna — hade noll i18next-integration; ett minimalt `sta`-namespace skapades bara för aria-labels. Synlig brödtext i hela STA-resan är hårdkodad svenska oavsett UI-språk. Egen i18n-genomgång behövs (produktbeslut: ska STA översättas?) (L) |

## Spår G — Produktutveckling

| # | Uppgift | Detaljer |
|---|---------|----------|
| G1 | **STA fas 7: statusflöde + AF-integration** | 🔶 **Steg 1 klart 2026-07-23** — statusbadge + övergångsknappar (Utkast→Granskning→Godkänd→Inskickad, inkl. "Tillbaka till utkast") i DocumentDraftPanel via två additiva staApi-metoder; konsekvenscheck (tomma sektioner listas i varningsdialog) före granskning/PDF. **Kvar av G1:** e-post till AF, audit-trail AI-vs-konsulent, dedup av statusbadge-logiken mot StaConsultant. Detalj: `docs/sta-automation-roadmap.md` |
| G2 | STA fas 6-rester + förbättringar | Automatisk fredagsveckosumma, A5 påminnelser (opt-in), A6 frånvarodagar, A7 konsulent-statusindikator. **Notis 2026-07-22:** `sta-week-summary`-endpointen finns redan; det som saknas är pg_cron-schemaläggning (mönster: `20260515_retention_cron.sql`) + leveranskanal |
| G3 | Fokusläge för CV-flödet | 34 sidor har PageFocusShell — CV (tyngsta verktyget) och STA saknar |
| G4 | Nav-lagningar | `/profile` in i Min vardag-hubben (CLAUDE.md lovar det), länka `/help` i Resurser |
| G5 | LIV fas 5: firande i nyckelögonblick | Ansökan skickad/övning klar/milstolpe; konfetti-grund finns. Fas 4 i stort klar |
| G6 | **EU-beslut: 26-001, 26-002 eller båda** | Aug. Styr även C4 (learning-funktionernas öde). Specar: docs/26-001/26-002 |
| G7 | Spontanansökan-rester (lågprio) | SearchTab-uppdelning (~900 r), dubblettskydd "Lägg till i Ansökningar", ortfältets svenska |
| G8 | Konsulentvyn vidare | Fortsätt på "Min dag"-spåret från 10–11/6; R2b ligger i B3 |
| G9 | **Gör intjänade poäng synliga — eller sluta logga** | ⬜ Ny 2026-07-22. `useAchievementTracker` skriver redan poäng/aktiviteter till DB från 6 ytor, men ingen visningskomponent är monterad (NextStepCard, WeeklySummary ×2 m.fl. finns färdiga men orutade — se C9/C10 för vad som arkiveras). Montera EN kurerad yta på HubOverview inom "lugn vän"-ramen, eller ta bort loggningen (S–M) |
| G10 | AI-personalisering: återanvänd kontexten | ⬜ Ny 2026-07-22. `useAITeamContext` (profil, CV, RIASEC, energi) används bara av AI-team-chatten — `AICareerChatbot` anropar samma `chatbot`-funktion kontextlöst. RIASEC förekommer i 0 AI-prompts; dagbok/energi bara i STA-prompterna. Skicka kontexten till chatboten + kompakt RIASEC-rad i `kompetensgap`/`karriarplan` + energidata i `mentalt-stod`/`jobbtips`. Delvis gated på C14 (mood-konsolidering) (M) |
| G11 | Intervjusimulator: sessionssammanfattning | ⬜ Ny 2026-07-22. Idag rating per svar men ingen helhetsbedömning; `IntervjuSimulatorResultSchema` (overall_score/strengths/improvements/summary) finns redan oanvänt i aiSchemas.ts (M) |
| G12 | Veckoreflektion för icke-STA-deltagare | ⬜ Ny 2026-07-22. Återanvänd `sta-week-summary`-mönstret med dagbok/wellness-data för vanliga deltagare — prompt-mönster + kontextbygge finns redan (M) |
| G13 | Konsulent-transparenssida ("Det här ser din konsulent") | ⬜ Ny 2026-07-22. GDPR-förtroendevinst, ingen ny datamodell — läsvy över det konsulenten ser. Spec: `STA-FORBATTRINGSFORSLAG` B5 (M) |

## 4. Q4 2026 — Konsolidera & mäta

Performance-budget i CI · A11y-audit (Lighthouse + skärmläsare, 5 sidor) · i18n-granskning av AI-output · användarintervjuer (5 deltagare + 3 konsulenter) · feature-sunset (< 5 % användning → avvecklingskandidat).

## 5. Horisont 2027 (riktning, ej spec)

Realtidsmeddelanden deltagare↔konsulent · 26-010-spår om utlysningen vinns · PWA-läge med offline-CV · AI-rollsimulator (26-002 modul 7).

## 6. Bygg inte (förbjudna riktningar)

Native mobilapp (PWA räcker) · egen LLM-hosting · egen videointervju-plattform · eget CMS · Gamification 2.0.

## 7. Beslutslogg — väntar på Mikael

| Beslut | Punkter | Behövs till |
|--------|---------|-------------|
| **Prioritera spåren B–G** (A ligger fast) | hela planen | nu |
| Rotera OpenRouter-nyckeln | A1 | omedelbart |
| Boka AI-jurist | A2 | denna vecka |
| GitHub Secrets för E2E | D1 | 10 min |
| pg_cron i Supabase-dashboarden | A6 | snarast |
| Dark mode i scope eller ej | F1 | var v. 26, försenad |
| `design-source/`-hemvist (36 MB, persondata?) | C7 | v. 29 |
| EU-utlysning: 26-001/26-002/båda | G6, C4 | aug |
| DPIA/Art 30: org-uppgifter + signatur | A4 | v. 29 |

## 8. Detaljkällor (bilagor)

| Dokument | Roll |
|----------|------|
| `docs/portal-review-2026-07-22.md` | **Senaste granskning (7-agenters uppföljning) — grund för punkterna A10+, B5+, C9+, D8+, E8+, F8+, G9+** |
| `docs/portal-review-2026-07.md` | Helhetsgranskning 2026-07-10 — grund för spårstrukturen A–G |
| `docs/portal-review-2026-06.md` | Föregående granskning (historik) |
| `docs/DESIGN.md` + `docs/DESIGN-DEBT.md` | Designsanning + CI-kopplad skuldlista |
| `docs/COMPLIANCE-AUDIT-2026-05-15.md` + `COMPLIANCE-USER-ACTIONS.md` | Juridiskt underlag + checklista |
| `docs/security-audit.md` | Säkerhetsstatus (nydateras i A9) |
| `docs/STA-FORBATTRINGSFORSLAG.md`, `sta-automation-roadmap.md` | STA-detaljspecar (G1/G2) |
| `.planning/AF-API-INTEGRATION-ROADMAP.md` | AF-API-idébank |
| `docs/26-001 / 26-002 / 26-010` | EU-utlysningsspecar |
| `docs/GRAFIK-PLAN.md` | Grafikpipeline |

## 9. Avslutat (flyttas hit i stället för att raderas)

| Plan | Resultat | När |
|------|----------|-----|
| Spontanansökan-granskning 20 punkter | Uppföljningar, kontaktperson, brevkoppling, React Query, batch, a11y, i18n — browserverifierat mot prod (`e2e/spontan-verify.cjs`) | 2026-07-10 |
| Ansökningar-totalgenomgång | i18n, döda knappar kopplade, fokusfällor/a11y, drag-and-drop-pipeline, sök/mobil/kalender | 2026-07-07–10 |
| Jobbsök UX/i18n/refactor-paket | MatchesTab-uppdelning m.m. | 2026-07-03 |
| CV-PDF per-sida-marginaler + 12-mallsgranskning | `box-decoration-break`-lösningen, visual audit-skript | 2026-07-03 |
| Grafik fas 7 | Custom hub- och verktygsikoner | 2026-06-29–30 |
| Granskningssnabbfixar 2026-06-22 | R1 (CV-assistent-404), R2 (konsulent-bulk status), R3 (test.js raderad), R6 (rate limit), R9 (gradient-baseline), P1 steg 1 (entry −28 %) — mergade till main | 2026-06-22 |
| Konsulentportal-utbyggnad | "Min dag", gruppmeddelanden, mall-tilldelning, AI-rapportutkast | 2026-06-10–11 |
| ESLint-skulden (gamla A1) | 1 019 → 11 errors (uppmätt 2026-07-10) | löpande |
| Hub-navigering v1.0, Designsystem v3.0, TECH-DEBT fas A–F, LIV fas 1–3(–4), GRAFIK fas 1–6, STA fas 1–5, granskningar apr–jun | Se arkiv | 2026-04–06 |

---

*Uppdateras löpande. Vid kvartalsskifte: flytta avklarat till §9, omvärdera spåren.*
