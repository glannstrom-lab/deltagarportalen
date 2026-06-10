# Arkitektur & dödkod-audit (2026-05-14)

Audit av `client/src/`, `server/`, `client/api/`, `supabase/functions/` och `package.json`.

---

## TL;DR

1. **Server/-mappen är 100 % dödkod.** README säger explicit "INAKTIV — använd inte". 14 TS-filer + Prisma-schema + bcryptjs/express/jwt-deps i en separat `package.json`. Inget i `client/` eller `client/api/` refererar till den. **Ta bort.**
2. **Stora dödkods-kluster i `services/ai/`, `services/ml/`, `services/nlp/` + tre AI-komponenter:** `aiAssistant.ts` (725 rader), `predictions.ts` (441), `textAnalysis.ts`, plus `SmartReminders.tsx` (324), `SmartJobMatches.tsx`, `SkillGapAnalysis.tsx`. Inget importerar dem. **~1 800 rader att radera.**
3. **`components/Onboarding.tsx` (623 rader) + `career/CareerOnboarding.tsx` (624 rader) är oimporterade.** Den faktiska globala onboardingen är `components/onboarding/OnboardingFlow.tsx`. Två gamla varianter ligger kvar — bekräftar DESIGN-DEBT-pekaren om onboarding-konsolidering.
4. **`services/api.ts` är en deprecation-shim ingen längre använder.** `apiRequest`/`api`-objektet har 0 anropare (bara internt). 14 filer importerar fortfarande från `@/services/api` men *bara* re-exports (`cvApi`, `userApi`, `trendsApi`, …). Migrera till direktimporter och radera api.ts. Samtidigt: `mockApi.ts` (774 rader) — bara 2 `type`-exports används.
5. **Två "god module"-services:** `services/cloudStorage.ts` (2 476 rader, 21 orelaterade *Api-namespaces*) och `services/careerApi.ts` (1 150 rader, 13 namespaces). Tree-shaking funkar inte; varje konsument drar in hela klumpen.

---

## Layering & coupling

### Direkt Supabase-åtkomst läcker överallt
- **91 filer** importerar `supabase`-klienten och **77 filer** kallar `supabase.from/rpc/auth/storage/functions` direkt — inklusive 9 sidor (alla `pages/consultant/*Tab.tsx`, `pages/Exercises.tsx`, `pages/MyConsultant.tsx`, `pages/dashboard/QuestsTab.tsx`), 14 komponenter (bl.a. `components/admin/SuperAdminPanel.tsx`, `components/consultant/*`) och 18 hooks.
- Det finns ingen tydlig data-access-gräns. `services/*Api.ts` är *en* väg, men sidor och komponenter går runt dem.

### `services/api.ts` är en avveckling som inte slutfördes
- `client/src/services/api.ts:51-107` — `apiRequest` är märkt `@deprecated`, har 0 callers (`grep apiRequest\(` matchar bara definitionen).
- Filen finns kvar som re-export-hub. 14 callers importerar `cvApi`, `userApi`, `articleApi`, `trendsApi` m.fl. från `@/services/api` istället för domän-filerna.
- **Effekt:** lazy chunks kan inte tree-shake:as när någon importerar `cvApi` från `@/services/api` (drar med deprecated `apiRequest` + alla re-exports).

### Två AI-backends — överlappar men dokumenterat
- `client/api/ai.js` (Vercel) = 18 funktioner samlade. Default för UI.
- `supabase/functions/` = 23 Deno-funktioner: `ai-assistant`, `ai-career-assistant`, `ai-commute-planner`, `ai-company-analysis`, `ai-company-search`, `ai-cover-letter`, `ai-cv-writing`, `ai-industry-radar` + `af-*`, `learning-*`, `bolagsverket`, `cv-analysis`.
- Faktisk ansvarsdelning **är tydlig** — Vercel = chat/UI-snabba, Supabase = långa prompts + tredjeparts (AF, Bolagsverket). CLAUDE.md dokumenterar detta. Men:
  - `client/src/services/aiService.ts` (725 rader) är **inte importerad någonstans** i `client/src/`. Endast docs/archive refererar till den. Tidig variant som blev kvar när Vercel-rutten flyttades till `aiApi.ts`.
  - Tre AI-komponenter (`SmartReminders.tsx`, `SmartJobMatches.tsx`, `SkillGapAnalysis.tsx`) som ringer på `services/ai/*` är också alla utan callers (se Dödkod).

### Stora moduler (god objects)

| Fil | Rader | Problem |
|---|---|---|
| `client/src/services/articleData.ts` | 19 215 | Statisk artikeldatabas + helper-funktioner. Fallback för Supabase-fel. Borde flyttas till en Supabase seed eller en JSON-fil utanför TypeScript-kompilatorn. |
| `client/src/data/exercises.ts` | 5 053 | Fallback-content för övningar. Importeras av `learningService.ts`, `contentApi.ts`, `pages/Exercises.tsx`, `pages/Article.tsx`, `pages/PrintableResources.tsx`. **Används aktivt** som fallback men hör inte hemma i TS. |
| `client/src/services/cloudStorage.ts` | 2 476 | 21 separata API-namespaces (`articleBookmarksApi`, `dashboardPreferencesApi`, `notificationsApi`, `journalApi`, `interestGuideApi`, `draftsApi`, `jobApplicationsApi`, `interviewSessionsApi`, `savedJobsApi`, `platsbankenApi`, `darkModeApi`, `moodApi`, `wellnessDataApi`, `personalBrandApi`, `onboardingApi`, `calendarApi`, `integrationChecklistApi`, m.fl.) i **en** fil. |
| `client/src/services/pdfExportService.ts` | 1 466 | 1 fil = 4 ansvar: CV-PDF, Cover-letter-PDF, Resources-PDF, Print. Bryt upp per domän. |
| `client/src/services/careerApi.ts` | 1 150 | 13 separata API-namespaces (`careerPathApi`, `salaryApi`, `skillsApi`, `educationApi`, `networkApi`, `careerPlanApi`, `milestonesApi`, `networkingEventsApi`, `skillsAnalysisApi`, `favoriteOccupationsApi`, `adaptationsApi`, `credentialsApi`, `relocationApi`). |
| `client/src/services/journeyService.ts` | 979 | Stora men sammanhängande — OK. |
| `client/src/services/arbetsformedlingenApi.ts` | 841 | Sammanhängande. |
| `client/src/services/mockApi.ts` | 774 | Death by re-export — bara 2 `type`-exports används; se Dödkod. |

### Inga cirkulära pages→pages-imports
- Inom `pages/` importeras endast `pages/CVPage.tsx` ⇒ `pages/CVBuilder.tsx` + `pages/JobAdaptPage.tsx` (medvetet — sub-routes). Test-filer importerar sitt eget syskon. **Inga andra cross-page-imports.**

### Hooks beror på services + supabase parallellt
- Hooks som `useDashboardData`, `useImageUpload`, `useAchievementChains`, `useJobsokHubSummary`, `useKarriarHubSummary`, `useMinVardagHubSummary`, `useOversiktHubSummary`, `useResurserHubSummary`, `useMoodRecommendations` använder `supabase.*` direkt istället för en service. Inkonsekvens — vissa hooks går via service, vissa direkt.

---

## Dödkod

### Komponenter — definierade men 0 importer
| Fil | Rader | Anteckning |
|---|---|---|
| `client/src/components/Onboarding.tsx` | 623 | Gammal global onboarding. Ersatt av `components/onboarding/OnboardingFlow.tsx` (importerad av `Layout.tsx:21`). |
| `client/src/components/career/CareerOnboarding.tsx` | 624 | Endast `components/career/index.ts:6` re-exporterar — och inget importerar från det. `careerGoalLabel.ts:9` har en kommentar. |
| `client/src/components/ai/SmartReminders.tsx` | 324 | Konsumerar `services/notifications/reminderService.ts`. |
| `client/src/components/ai/SmartJobMatches.tsx` | ~330 | Konsumerar `services/ai/embeddings.ts`. |
| `client/src/components/ai/SkillGapAnalysis.tsx` | 244 | Konsumerar `services/ai/smartMatching.ts`. |
| `client/src/components/CVMatcher.tsx` | ~? | Konsumerar `services/cvMatcher.ts`. |
| `client/src/components/JobRecommendations.tsx` | ~? | Konsumerar `services/occupationMatcher.ts`. |
| `client/src/components/QuickApply.tsx` | ~? | 0 importer. |
| `client/src/components/MarketStats.tsx` | ~? | Konsumerar `services/marketStatsService.ts`. |
| `client/src/components/recommendations/RecommendationsPanel.tsx` | ~? | Konsumerar `services/recommendationService.ts`. |
| `client/src/components/MobileNav.tsx` | — | 0 importer (`MobileBackButton` också). |
| `client/src/components/MobileBackButton.tsx` | — | 0 importer. |
| `client/src/components/SuccessMoments.tsx` | — | 0 importer. |
| `client/src/components/BreakReminder.tsx` | — | 0 importer. |
| `client/src/components/CoachWidget.tsx` | — | 0 importer (men `data/coaches.ts` används av Layout för pagekey-mapping). |
| `client/src/components/SupportiveLanguage.tsx` | — | 0 importer (bara i18n/README.md). |
| `client/src/components/HelpButton.tsx` | — | Endast `data/helpContent.ts:7` importerar `type HelpContent` — själva komponenten används inte. |
| `client/src/components/Link.tsx` | — | 0 importer. |

### Services — 0 callers
| Fil | Rader | Anteckning |
|---|---|---|
| `client/src/services/aiService.ts` | 725 | Tidig version av Vercel-AI-anrop. Ersatt av `aiApi.ts`. Referenser bara i `archive/` och `docs/teknisk-skuld-2026-05/`. |
| `client/src/services/ai/aiAssistant.ts` | 725 | 0 callers (`grep` ger bara self + ml/predictions internt). |
| `client/src/services/ml/predictions.ts` | 441 | Endast `SkillGapAnalysis.tsx` (dödkod) importerar `ml/`. |
| `client/src/services/ml/index.ts` | — | Endast re-export. |
| `client/src/services/nlp/textAnalysis.ts` | — | 0 callers. |
| `client/src/services/nlp/index.ts` | — | Endast re-export. |
| `client/src/services/notifications/reminderService.ts` | — | Endast `SmartReminders.tsx` (dödkod). |
| `client/src/services/ai/embeddings.ts` | 598 | Endast `SmartJobMatches.tsx` (dödkod). |
| `client/src/services/ai/smartMatching.ts` | — | Endast `SkillGapAnalysis.tsx` (dödkod). |
| `client/src/services/cacheService.ts` | — | Endast `afTaxonomyApi.ts:9` importerar `taxonomyCache`. **Behåll** men flytta in i `afTaxonomyApi.ts`. |
| `client/src/services/afDirectApi.ts` | — | 0 callers. |
| `client/src/services/mockApi.ts` | 774 | 23/25 exports är döda. Endast `type Job` + `type JobApplication` används av `JobCard.tsx`, `JobDetailModal.tsx`, `ApplicationsTracker.tsx`. **Flytta typerna till `types/jobs.ts` och radera resten** (`mockAuthApi`, `mockCvApi`, `mockJobsApi`, `mockInterestApi`, `mockCoverLetterApi`, `mockArticleApi`, `mockUserApi`). |
| `client/src/services/cvMatcher.ts` | — | Endast `components/CVMatcher.tsx` (dödkod). |
| `client/src/services/marketStatsService.ts` | — | Endast `components/MarketStats.tsx` (dödkod). |
| `client/src/services/occupationMatcher.ts` | — | Endast `components/JobRecommendations.tsx` (dödkod). |
| `client/src/services/recommendationService.ts` | — | Endast `components/recommendations/RecommendationsPanel.tsx` (dödkod). |

### Pages
- **Inga oroutade lazy-imports i `App.tsx`.** Den lärdom som CLAUDE.md varnar för (2026-04-27) verkar vara åtgärdad.
- `pages/CVBuilder.tsx` (1 216) och `pages/JobAdaptPage.tsx` (43) saknas i `App.tsx` lazy-listan — men routas via sub-routes i `pages/CVPage.tsx:10-11,58,60`. Detta är **korrekt** men icke-uppenbart för en läsare av App.tsx. Bör dokumenteras eller flyttas till `components/cv/`.

### Tomma kataloger
- `client/src/features/` — tom mapp. Radera.

### Server/
- `server/src/` 14 filer, totalt ~80 KB. Har egen `package.json`, `node_modules`, `dist/`, `prisma/`. README explicit: "INAKTIV - Använd INTE denna backend!"
- Inga importer från `client/` eller `client/api/` mot `server/`.

---

## Duplikation

### Onboarding-komponenter
| Komponent | Var | Status |
|---|---|---|
| `components/onboarding/OnboardingFlow.tsx` | Layout.tsx:21,142 | **Aktiv global modal** |
| `components/dashboard/OnboardingStep.tsx` | Dashboard.tsx:260 | Aktiv (small step-card) |
| `components/dashboard/GettingStartedChecklist.tsx` | ? | Aktiv? Behöver verifieras |
| `components/onboarding/GettingStartedChecklist.tsx` | ? | Aktiv? Dubbel mot ovan? |
| `components/cv/CVOnboarding.tsx` | CVBuilder.tsx:34 | Aktiv (CV-tour) |
| `components/profile/OnboardingModal.tsx` | Profile.tsx:20 | Aktiv (profile welcome) |
| `components/ai-team/OnboardingModal.tsx` | ? | Behöver verifieras |
| `components/career/CareerOnboarding.tsx` | — | **Död** (se ovan) |
| `components/Onboarding.tsx` | — | **Död** (se ovan) |

DESIGN-DEBT noterar att detta behöver konsolideras — bekräftat.

### CV-byggare
- En aktiv: `pages/CVBuilder.tsx` (1 216 rader) som default i `CVPage.tsx`.
- `components/cv/FocusCVBuilder.tsx` (751 rader) — focus-mode-variant, importeras i `CVPage.tsx:16`. **Inte duplikat** utan parallellt fokusläge.

### JobAdapt-paneler
- En enda: `pages/JobAdaptPage.tsx` + `components/jobs/JobAdaptPanel.tsx` (behöver kontroll). Ingen tydlig duplikation.

### Mock-fallbacks
- `mockApi.ts` (774 rader, 23 döda exports) + `articleData.ts` (19 215 rader) + `data/exercises.ts` (5 053 rader) + `pages/sta/mockData.ts` är alla "fallback om Supabase fail".
- `articleData.ts` och `exercises.ts` används aktivt som fallback i `contentApi.ts` (rad 588 m.fl.) — kan inte tas bort utan riskering, men **bör flyttas ut ur TypeScript-pipelinen** (JSON eller Supabase seed).

---

## Dependencies

### Sannolikt oanvända prod-deps i `client/package.json`
- **Inga.** Alla deps är referenser i koden (`canvas-confetti` i `AchievementCelebration.tsx`, `docx`/`file-saver` lazy i `cvWordExport.ts` + `Resources.tsx`, `html2canvas` lazy i `pdfLazyLoad.ts`).
- `@sparticuz/chromium` + `puppeteer-core` används av `client/api/cv-pdf.js` (serverless PDF).
- `@vercel/blob` används av `client/api/upload-image.js`.

### Två PDF-vägar (medveten kompromiss)
- `@react-pdf/renderer` → endast `components/cover-letter/CoverLetterPDF.tsx`.
- `jspdf` + `jspdf-autotable` + `html2canvas` → `pdfExportService.ts`, `pdfReportGenerator.ts`, `staPdfExport.ts`, `pdfLazyLoad.ts`.
- Båda behövs (`@react-pdf` löser `oklch`-fel som html2canvas inte klarar — kommentaren i `CoverLetterPDF.tsx:4`). **OK men dokumentera.**

### Server-deps (i `server/package.json`)
Hela `server/package.json` är dött tillsammans med `server/`. `express`, `prisma`, `bcryptjs`, `jsonwebtoken`, `helmet`, `cors`, `dotenv`, `axios`, `jsdom`, `express-rate-limit` + devdeps tas bort tillsammans med mappen.

### DevDeps
Inga uppenbart döda. `rollup-plugin-visualizer`, `vite-plugin-compression2`, `vite-plugin-image-optimizer`, `svgo`, `sharp`, `terser` används alla av `vite.config.ts`.

---

## Server/-mappen

**Verifierad som 100 % dödkod.**

- `server/README.md` säger explicit: "**INAKTIV - Använd INTE denna backend!**" och pekar på `/supabase/functions/`.
- 14 TypeScript-filer i `server/src/` (~80 KB).
- Egen `package.json` med Express + Prisma + bcryptjs + JWT (gammal arkitektur innan Supabase).
- Egen `node_modules/`, `dist/`, `prisma/`.
- **Inga importer från `client/` eller `client/api/`** mot `server/`.
- `prisma/schema.prisma` är ersatt av `supabase/migrations/`.

**Rekommendation:** Flytta hela `server/` till `archive/server-legacy/` eller radera helt. Om bevarad för referens — flytta till `archive/` så den inte rankas av sökverktyg och inte längre påverkar repo-storlek (`node_modules`).

---

## Rekommendationer (prioriterad)

| Prio | Åtgärd | Effort | Risk |
|---|---|---|---|
| **P0** | Radera `server/` (eller flytta till `archive/`). README säger redan att den inte används. Sparar ~80 KB källa + node_modules. | S | Låg |
| **P0** | Radera `components/Onboarding.tsx`, `components/career/CareerOnboarding.tsx`, `components/career/index.ts:6` re-export, `components/MobileNav.tsx`, `components/MobileBackButton.tsx`, `components/SuccessMoments.tsx`, `components/BreakReminder.tsx`, `components/CoachWidget.tsx`, `components/SupportiveLanguage.tsx`, `components/Link.tsx`, `components/HelpButton.tsx` (flytta `type HelpContent` till `data/helpContent.ts`), `components/QuickApply.tsx`. | S | Låg — verifierat 0 importer |
| **P0** | Radera AI-dödkods-stacken: `components/ai/SmartReminders.tsx`, `components/ai/SmartJobMatches.tsx`, `components/ai/SkillGapAnalysis.tsx`, `services/ai/aiAssistant.ts`, `services/ai/embeddings.ts`, `services/ai/smartMatching.ts`, `services/ml/`, `services/nlp/`, `services/notifications/reminderService.ts`, `services/aiService.ts`. ~1 800 rader. | S | Låg |
| **P0** | Radera `components/CVMatcher.tsx` + `services/cvMatcher.ts`, `components/JobRecommendations.tsx` + `services/occupationMatcher.ts`, `components/MarketStats.tsx` + `services/marketStatsService.ts`, `components/recommendations/RecommendationsPanel.tsx` + `services/recommendationService.ts`, `services/afDirectApi.ts`. | S | Låg |
| **P1** | Krymp `services/mockApi.ts` 774 → ~80 rader: flytta `type Job` + `type JobApplication` till `client/src/types/jobs.ts`, radera de 23 oanvända `mock*Api`-exporterna. Uppdatera 3 imports. | S | Låg |
| **P1** | Radera `services/api.ts` deprecation-shim: migrera 14 callers från `@/services/api` till respektive domän-fil (`@/services/cvApi`, `@/services/userApi`, `@/services/afTrendsApi`, m.fl.). | M | Låg |
| **P1** | Konsolidera onboarding-komponenter (DESIGN-DEBT-pekaren). Behåll `OnboardingFlow` (global), `profile/OnboardingModal`, `cv/CVOnboarding`, `dashboard/OnboardingStep`. Verifiera om de två `GettingStartedChecklist` är duplikat. | M | Medel |
| **P1** | Radera tomma `client/src/features/`. | XS | Ingen |
| **P2** | Bryt upp `services/cloudStorage.ts` (2 476 rader, 21 namespaces) till `services/storage/<domain>Api.ts` per domän. | L | Medel — många callers |
| **P2** | Bryt upp `services/careerApi.ts` (1 150 rader, 13 namespaces). | M | Medel |
| **P2** | Bryt upp `services/pdfExportService.ts` (1 466 rader) till `services/pdf/{cv,coverLetter,resources}.ts`. | M | Låg |
| **P2** | Flytta `services/articleData.ts` (19 215 rader) och `data/exercises.ts` (5 053 rader) ut ur TS-pipelinen — Supabase seed eller JSON i `public/`. | L | Medel — fallback-logiken behöver behållas |
| **P3** | Etablera regel: sidor och komponenter får inte kalla `supabase.from/rpc/auth` direkt — gå alltid via `services/*Api.ts`. Skapa ESLint-regel `no-restricted-imports` för `@/lib/supabase` från `pages/**` och `components/**`. ~91 ställen att migrera. | L | Hög utan plan |
| **P3** | Flytta `pages/CVBuilder.tsx` + `pages/JobAdaptPage.tsx` in i `components/cv/` så `App.tsx`-listan blir komplett bild av routebara sidor. | S | Låg |

**Totalt under P0/P1:** ~5 000–6 000 rader dödkod att radera; ingen funktionell risk för verifierat 0-import-fall.
