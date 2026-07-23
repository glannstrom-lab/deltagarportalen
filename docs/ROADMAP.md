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
| B7 | "Skapa karriärplan" utan AI | ⬜ Ny 2026-07-22. `PlanTab.tsx:148-200` skapar tre hårdkodade milstolpar; `karriarplan`-funktionen finns färdig i båda backends utan anropare. Koppla in + Art 50-märk (M) |
| B8 | AI-svarsvalidering: koppla in `aiSchemas.ts` | ⬜ Ny 2026-07-22. `safeParseAiResponse` + scheman byggda mot H8 men 0 produktionsanrop; `ai.js` returnerar `{success:true,{raw}}` vid trasig JSON utan felsignal; `StaDocumentDraftSchema` matchar dessutom inte verklig svarsform (objekt, ej array) och `staAiApi` castar ovaliderat. Rätta schemat + koppla in (S) |

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
| C9 | **Arkivera journey/gamification-systemet (~4 300 rader)** | ⬜ Ny 2026-07-22. `services/journeyService.ts` + `gamificationService.ts` + `hooks/useJourney`/`useGamification` + `components/journey/*` (10 filer) — inget routat, samma mönster som C1. Ett *tredje* system (`useAchievementTracker`) är det levande. OBS: `AchievementCelebration` bryter dessutom Manifestet ×3 (confetti, bounce-loop, 5s auto-dismiss) — radera, återbygg ev. senare mot DESIGN.md (M) |
| C10 | Widgetsystem gen 2 + orutade `Dashboard.tsx` | ⬜ Ny 2026-07-22. `components/dashboard/widgets/` (~20 filer, DashboardGrid/WidgetFilter m.fl.) hänger dött på `pages/Dashboard.tsx` som saknar route sedan C3 (E12-kandidaten). Arkivera konsekvent med C1 (M) |
| C11 | Döda AI-dubbletter | ⬜ Ny 2026-07-22. `components/career/`-mappen (anropar funktionsnamn som skulle 400:a), `AIWritingAssistantSecure`, `hooks/useSupabase.ts` (enda vägen till GPT-4-fakturerande `cv-analysis` — radering billigare än migrering?), `coverLetterApi.generate()` + AI-exporter i `lib/supabase.ts`. Flytta först `ai-cover-letter`-edgens bättre no-platshållare-prompt till ai.js:s `personligt-brev` (S) |
| C12 | Beslut per orphanad ai.js-funktion | ⬜ Ny 2026-07-22. 9 av 24 utan anropare: `karriarplan` (→B7), `intervju-forberedelser`, `cv-optimering`, `generera-cv-text`, `jobbtips`, `loneforhandling`, `natverkande`, `ansokningscoach`, `mentalt-stod`. Radera eller koppla in — per funktion (S–M) |
| C13 | Dödkodssmåskrot | ⬜ Ny 2026-07-22. 3 döda hooks i `useSta.ts` (~112 rader), `ui/BottomSheet` (+Filter/ActionSheet; saknar dialog-roll/fokus-trap — fixa före ev. första användning), `actionplan/ActionPlan`, `MobileSimplified`, `ApplicationsTracker`, `PlatsbankenIntegration`, döda Zustand-selektorer i `profileStore` (S) |
| C14 | Konsolidera mood-datalagren | ⬜ Ny 2026-07-22. `mood_logs`/`mood_history`/`calendar_mood_entries` — tre tabeller blockerar AI-kontextbygget (G10) och wellness-rapporter (M–L) |
| C15 | Dokumentsvep | ⬜ Ny 2026-07-22. Arkivera/skriv om `AI_ARCHITECTURE_OVERVIEW.md` (beskriver obefintliga filer + modeller som strider mot låsningen), rätta fiktiva `cvMatcher`/`jobMatchingService` i `docs/api/services-overview.md`, ersätt `client/README.md` (Vite-mall), döp om ena `20260306130000`-migrationen (versionkollision). `claude-code-guide.md` tsc-fällan + CLAUDE.md-siffror rättade 2026-07-22 (S–M) |

## Spår D — Skyddsnät & kvalitet

| # | Uppgift | Detaljer |
|---|---------|----------|
| D1 (S1) | Authenticated E2E i CI | ✅ **Klar 2026-07-10 (kodsidan)** — `e2e-authenticated`-jobb i ci.yml; specarna själv-skippar utan credentials så jobbet aktiveras automatiskt när **Mikael lägger in secrets** TEST_USER_EMAIL/TEST_USER_PASSWORD (+ valfritt TEST_CONSULTANT_*) i GitHub. Fixade även AuthHelper.login som väntade på fel URL efter C3 |
| D2 (S2) | Golden path-spec | ✅ **Klar 2026-07-10** — `e2e/golden-path.spec.ts`: deltagarens kärnflöde (7 sidor i en session) + hubbnav + konsulent-smoke. Provkörd 3/3 grönt mot prod |
| D3 (D2r) | Tester för kärnservices | ✅ **Klar 2026-07-10** — 174 nya tester: applicationsApi (23), careerApi (37), staApi (62), cloudStorage (52). Låser beteendet inför E3–E5-refaktorerna. ~14 källkodsobservationer rapporterade (svalda fel, race i recordPractice, asymmetrisk casing i calendarApi m.m.) — se commit-historik |
| D4 (D6) | Husky + lint-staged | ✅ **Klar 2026-07-10** — pre-commit kör eslint --quiet på stage:ade filer + lint:design |
| D5 | ESLint 11→0 + jaga flaky test | ✅ **Klar 2026-07-10** — 0 errors (villkorlig useMemo i AssessmentEditor var ett äkta rules-of-hooks-brott); flaky = nav-smoke-timeout under maskinlast, höjd 8→20 s |
| D6 (S5) | LCP-baseline + CI-budget | ✅ **Klar 2026-07-10** — baseline mot prod: landning ~340 ms, inloggad översikt ~1 400 ms (median, `e2e/lcp-baseline.cjs`). LCP-budget 2 500 ms som warn i CI:s Lighthouse-jobb; skärp till error när CI-variansen är känd |
| D7 | Robusthetsfynd från testskrivningen | ⬜ Ny 2026-07-10. ~14 observationer från D3-agenterna, viktigast: tysta DB-fel i `applicationHistoryApi.log` + `milestonesApi.toggleComplete` + `favoriteOccupationsApi.isFavorite` (fel tolkas som "inte favorit" → toggle kan skapa dubblett), race i `personalBrandApi.recordPractice`, `careerPlanApi.create` error-checkar inte avaktiveringen (två aktiva planer möjliga), `savedJobsApi.getAll` utan auth-guard, asymmetrisk snake/camelCase i `calendarApi`, `credentialsApi.updateStatus` kan aldrig rensa completed_date. Detaljer i commit 79f52e78 |
| D8 | **CI-luckor** | ✅ **Klar 2026-07-23** — `regression-fas-a` in i e2e-smoke, `axe-a11y` in i e2e-authenticated (publika sidor auditeras direkt, inloggade när D1-secrets finns); `concurrency` i ci.yml (cancel-in-progress) och deploy.yml (kö, ej cancel); npm-audit-stegets `continue-on-error` dokumenterat som medvetet tills A14-resten (undici/@vercel/blob) är löst. Deployens API-hälsokontroll behåller `continue-on-error` (health-endpointens auth-beteende overifierat) — ta i A15 |
| D9 | STA-e2e-spec | ⬜ Ny 2026-07-22. STA — en av fyra huvudfunktioner, aktivt utvecklingsfokus (G1) — saknar helt e2e-täckning. Minst deltagarflödet + DOA; CV-PDF-export är också otestad (M) |
| D10 | Servicetester våg 2 | ⬜ Ny 2026-07-22. 47/59 services otestade. Prioritet: `consultantService` (hade redan tyst prod-bugg, B3), `cvApi`, `coverLetterApi`, `staAiApi` (Art 50-yta), `unifiedProfileApi`; hooks: `useSta`, E5-cache-hooksen; stores: `energyStoreWithSync` (racerisk) (M, delbar per fil) |
| D11 | Konsulentens felmaskering → generellt mönster | ⬜ Ny 2026-07-22. D7-klassens fynd i `consultantInsights.ts` (tre funktioner returnerar `[]` i catch) åtgärdas i B5; svep efter samma mönster i övriga services vid D10-testskrivningen |

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
| E8 | **STA-konsulentvyns overfetch** | ⬜ Ny 2026-07-22. `useConsultantStats` (`useSta.ts:178-217`) drar 5 fulla queries per deltagare för hela caseloaden vid varje load + efter varje mutation — lista/KPI behöver bara aggregat. Fix: counts-RPC för listan, fulldata endast för öppnad deltagare. Störst förväntad effekt; skalar med caseload (M) |
| E9 | AIAssistant dubbel ocachad dashboard-fetch | ⬜ Ny 2026-07-22. `AIAssistant.tsx:152` använder legacy-`useDashboardData` (15 parallella anrop, ingen cache) och renderas ×2 på Övningar-sidan → allt körs dubbelt. Byt till `useDashboardDataQuery`, deprecatea legacy-hooken (S) |
| E10 | Entry-bantning: lazy auth-sidor + CoachWidget | ⬜ Ny 2026-07-22. Landing/Login/Register är enda icke-lazy-sidorna (~33 kB gzip för inloggade i onödan); `CoachWidget`+`data/coaches.ts` (36 kB) laddas ovillkorligt via Layout även avstängd; NotificationBell importerar båda date-fns-localerna. Entry har drivit 605→634 kB raw (S) |
| E11 | select('*')-svansen + dubbel dataväg till job_applications | ⬜ Ny 2026-07-22. 177 träffar kvar i 24 servicefiler (cloudStorage 25, careerApi 17). OBS: `jobApplicationsApi` (cloudStorage) och `applicationsApi.ts` är två parallella vägar till samma tabell — konsolidera före kolumntrim (L) |

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
| F9 | aria-label-i18n-svep + detektorutökning | ⬜ Ny 2026-07-22. 58 hårdkodade svenska `aria-label` i 42 filer (värst: NotificationBell, "Laddar"-spinners ×8) — skärmläsare talar svenska i engelskt UI. Utöka `report:i18n`-detektorn till attribut så luckan inte återkommer (M) |
| F10 | Editorial-spot-texterna → i18n | ⬜ Ny 2026-07-22. 5 stycken infördes efter F2-svepet: `Career.tsx:79`, `Diary.tsx:235`, `PersonalBrand.tsx:64`, `Salary.tsx:62`, `International.tsx:62` (S) |

## Spår G — Produktutveckling

| # | Uppgift | Detaljer |
|---|---------|----------|
| G1 | **STA fas 7: statusflöde + AF-integration** | Sista milen till kärnvisionen: Utkast→Granskning→Inskickad→Bekräftad, konsekvenscheck före export, e-post till AF, audit-trail AI-vs-konsulent. Detalj: `docs/sta-automation-roadmap.md`. **Uppdaterat 2026-07-22:** mindre än befarat — statusenum, `staApi.approve()` och konsulentens statusfilter finns redan; det som saknas är knapparna i `DocumentDraftPanel` + konsekvenscheck. Minsta värdefulla steg = S–M, inte L |
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
