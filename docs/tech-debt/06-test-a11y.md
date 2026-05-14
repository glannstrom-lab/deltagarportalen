# Test & a11y-coverage (2026-05-14)

Granskning: `client/` (React 19 + Vitest), `e2e/` (Playwright + Node-skript), `.github/workflows/`, samt accessibility-mönster i komponenter och layout.

## TL;DR

- **Vitest passar 722** men **coverage är 20,09 % på rader** (35 578 / 177 067) och **34,75 % på funktioner** — branches ligger förvånansvärt högt på 64,27 %. Stora delar av koden saknar tester.
- **433 källfiler (av 1 014 i coverage-rapporten) ligger på 0 % radcoverage**. Hela kataloger är otestade: `pages/sta` (4 936 rader), `pages/consultant` (4 879), `components/profile` (4 484), `components/career` (4 047), `components/cv` (11 224 rader, 7,4 % täckning), `components/knowledge-base`, `components/applications`, `components/gamification`, `components/diary`, `pages/wellness`, `pages/personal-brand`, `pages/interest-guide`, `pages/spontaneous`, `pages/dashboard/tabs`, `pages/career`.
- **Kritiska services helt otestade:** `userApi.ts` (21,5 %), `profileEnhancementsApi.ts` (7,9 %), `careerApi.ts` (0 %), `applicationsApi.ts` (0 %), `cloudStorage.ts` (12,9 %), `staApi.ts` (0 %), `journeyService.ts` (0 %), `gamificationService.ts` (0 %), `pdfExportService.ts` (10,3 %), `notificationsService.ts` (0 %), `linkedinService.ts` (0 %), `googleCalendarService.ts` (0 %).
- **Hooks är till stor del otestade.** `hooks/` har 57 produktionsfiler men endast 14 testfiler (~25 %). `useAccessibility.tsx`, `useFocusTrap.ts`, `useAITeamContext.ts`, `useApplications.ts`, `useDashboardData.ts`, `useGamification.ts`, `useDiary.ts` m.fl. saknar tester.
- **E2E-flöden täcker `/login`, `/cv`, `/dashboard`, `/job-search`, `/cover-letter` på ytan**, men de viktigaste AI-flödena (intervjusimulator, kompetensanalys, personlig coach-chat), konsulent-tilldelning av deltagare, och PDF/Word-export är *inte* end-to-end-verifierade i `*.spec.ts`. CI kör endast `smoke.spec.ts` (publika sidor utan login).
- **A11y-grundinfrastruktur finns** (SkipLinks är monterad i `Layout.tsx`, `useFocusTrap` används i 7 modaler, kontrast 0 violations 2026-05-14), men **bara 63 `aria-live`-träffar i hela kodbasen** och flera modaler/dialoger har ofullständig `role="dialog"` + `aria-modal`-täckning (19 filer). Heading-hierarkin på Dashboard hoppar h1 → h3 inne i samma sektion.
- **CI har lint+typecheck+coverage+lighthouse+smoke-e2e**, men **inga blockerande lint-grindar**: ESLint rapporterar **1160 errors + 106 warnings** och CI-stegen failar inte commits idag (lint körs men måste antingen failas innan merge, eller ignoreras — i praktiken stoppar 1160 errors hela steget). Det finns ingen `husky`/pre-commit. Authenticated E2E (alla `*.spec.ts` utom smoke) körs inte alls i CI (saknar `TEST_USER_EMAIL`-secret enligt fixtures + CI-yaml).

---

## Coverage per lager

Källa: `client/coverage/coverage-summary.json` (vitest run 2026-05-14).

### Totalt
| Mått | % | Räknare |
|---|---|---|
| Lines | **20,09 %** | 35 578 / 177 067 |
| Statements | 20,09 % | 35 578 / 177 067 |
| Functions | **34,75 %** | 710 / 2 043 |
| Branches | 64,27 % | 1 824 / 2 838 |

> Branches ligger högt eftersom mycket av koden som *körs* via testerna har många if/else; raderna som *aldrig laddas* (hela komponenter med 0 %) räknas inte in i branches-totalen.

### Top-15 katalog/fil med mest *otestad kod*
| Lager | Rader | Coverage | Antal 0 %-filer |
|---|---|---|---|
| `components/cv/*` | 11 224 | **7,4 %** | 16 |
| `hooks/*` | 8 475 | 15,3 % | 36 (av 57) |
| `components/dashboard/*` | 7 453 | **2,4 %** | 42 (av 45) |
| `components/jobs/*` | 5 244 | 5,9 % | 11 (av 14) |
| `pages/sta/*` | 4 936 | **0 %** | 12 (alla) |
| `pages/consultant/*` | 4 879 | **0 %** | 8 (alla) |
| `components/profile/*` | 4 484 | **0 %** | 28 (alla) |
| `components/consultant/*` | 4 390 | **0,1 %** | 14 |
| `components/focus/*` | 4 275 | 4,0 % | 24 |
| `components/career/*` | 4 047 | **0 %** | 8 (alla) |
| `pages/career/*` | 3 267 | **0 %** | 6 (alla) |
| `components/cover-letter/*` | 2 853 | 2,4 % | 12 |
| `pages/dashboard/tabs/*` | 2 433 | **0 %** | 6 (alla) |
| `components/knowledge-base/*` | 2 243 | **0 %** | 19 (alla) |
| `components/applications/*` | 2 117 | **0 %** | 10 (alla) |
| `components/widgets/*` | 2 309 | **89,8 %** ✅ | 3 |
| `components/layout/*` | 2 064 | 54,7 % | 1 |
| `pages/hubs/*` | 1 191 | 62,0 % | 1 |

**Mönstret:** widget-systemet och hub-sidor (senaste 6 månaders arbete) är **välltäckta**. Allt äldre — CV-byggaren, profil, konsulent-vyer, sta-flödet, career-coachen, knowledge-base, applications-pipelinen — är effektivt **otestat**.

### Components (442 källfiler, ~75 testfiler)
- Tester finns främst i `widgets/` (37 av 46 testade), `dashboard/DashboardSkeleton`, `layout/Sidebar`, `layout/HubBottomNav`, `layout/navigation`, `ui/Image`, `ui/Skeleton`, `ImageUpload`.
- **0 tester** för `ui/Button`, `ui/Input`, `ui/Card`, `ui/Tabs`, `ui/EmptyState`, `ui/ConfirmDialog`, `ui/BottomSheet`, `ui/DropdownMenu`, `ui/SearchBar` — alla wide-blast-radius-komponenter.
- **0 tester** för `ErrorBoundary`, `RouteErrorBoundary`, `Toast`, `CookieConsent`, `CrisisSupport`, `CoachWidget`, `Layout`, `MobileNav`, `SkipLinks`, `Onboarding`.

### Pages (104 källfiler, 5 testfiler)
- Testade: `CVPage`, `Dashboard`, `JobSearch`, `Login`, samt 5 hubbar i `pages/hubs/__tests__/`.
- **0 tester:** allt i `pages/sta/`, `pages/consultant/`, `pages/career/`, `pages/personal-brand/`, `pages/wellness/`, `pages/interest-guide/`, `pages/international/`, `pages/salary/`, `pages/spontaneous/`, `pages/dashboard/tabs/`, samt `Landing`, `Register`, `Profile`, `Settings`, `Resources`, `KnowledgeBase`, `Wellness`, `Diary`, `Calendar`, `Network`, `Help`, `Article`, `MyConsultant`, `LinkedInOptimizer`, `SharedProfile`, `Spontaneous`, `Education`, `SkillsGapAnalysis`, `InterviewSimulator`, `International`, `Salary`, `Career`, `CoverLetterPage`.

### Hooks (57 källfiler, 14 testfiler)
- Testade (snabbt): `useAIContext`, `useBreakpoint`, `useCVAutoSave`, `useJobsokHubSummary`, `useKarriarHubSummary`, `useMinVardagHubSummary`, `useOnboardedHubsTracking`, `useOversiktHubSummary`, `useResurserHubSummary`, `useWidgetLayout`, `useWidgetSize`, `useZodForm`.
- **Otestade men kritiska:** `useAccessibility.tsx`, `useFocusTrap.ts`, `useAuthInit.ts`, `useDashboardData.ts`, `useApplications.ts`, `useSta.ts`, `useGamification.ts`, `useInsights.ts`, `useDiary.ts`, `useJourney.ts`, `useNotifications.ts`, `useNextStep.ts`, `useJobMatching.ts`, `useServiceWorker.ts`, `useVoiceInput.ts`/`useVoiceOutput.ts` (intervjusimulator beror på dem), `useAIStream.ts`, `useDocuments.ts`, `useImageUpload.ts`/`useVercelImageUpload.ts`, `useStorageValidation.ts`, `useEnergyLevel.ts`.

### Services (76 källfiler, 8 testfiler)
| Service | Coverage |
|---|---|
| `accountApi.ts` ✅ | 100 % |
| `cacheService.ts` ✅ | 100 % |
| `aiApi.ts` | 59 % (testat) |
| `interviewService.ts` | 57 % (testat) |
| `supabaseApi.ts` | 40 % (testat) |
| `personalBrandAuditsApi.ts` | 53 % (testat) |
| `cvMatcher.ts` | 78 % (testat) |
| `arbetsformedlingenApi.ts` | 61 % |
| `cvApi.ts` | 49 % |
| **`userApi.ts`** | **21,5 %** (otestat) |
| **`profileEnhancementsApi.ts`** | **7,9 %** (otestat) |
| **`careerApi.ts`** | **0 %** |
| **`applicationsApi.ts`** | **0 %** |
| **`cloudStorage.ts`** | **12,9 %** |
| **`staApi.ts`** | **0 %** |
| `journeyService.ts` | 0 % |
| `pdfExportService.ts` | 10 % |
| `notificationsService.ts` | 0 % |
| `linkedinService.ts` | 0 % |
| `gamificationService.ts` | 0 % |
| `aiService.ts`, `aiCareerAssistantApi.ts`, `aiCompanySearchApi.ts` | 0 % |
| `services/ai/`, `services/ml/`, `services/nlp/`, `services/notifications/` | 0 % |

> Stickprov enligt prompten: **`aiApi.ts`** testas (vi mockar fetch + supabase.auth.getSession, verifierar auth-header och felmeddelanden — solid). **`userApi.ts`** har **ingen test alls** (radcoverage 21,5 % kommer från oavsiktliga importer i andra tester). **`profileEnhancementsApi.ts`** har **ingen test alls** (7,9 % från transitiva importer).

### Stores (6 källfiler, 2 testfiler)
- `authStore.ts` 75,6 %, `cvStore.ts` 100 %.
- **Otestat:** `aiTeamStore.ts`, `profileStore.ts` (27 %), `settingsStore.ts` (25 %), `energyStoreWithSync.ts` (0 %).

### Lib & utils
- `lib/validatedStorage.test.ts`, `lib/validations/validations.test.ts` finns. Resten av `lib/` (`supabase`, `sentry`, `aiContext`, `toast`, `utils.ts`) är otestat.
- `utils/`: bara `streakDays` och `careerGoalLabel` är testade. `safeStorage`, `sanitize`, `security`, `supportiveLanguage`, `validation`, `supportiveMessages` har 0–46 %.

---

## E2E-gaps (kritiska flöden som saknar test)

### Playwright `*.spec.ts` (6 filer som kör i CI/lokalt)
| Spec | Innehåll | Auth krävs |
|---|---|---|
| `smoke.spec.ts` | Landing, login-form, register, privacy, ai-policy, protected-redirect | Nej (kör i CI) |
| `auth.spec.ts` | Login-form, validering, password toggle, redirect, logout, register-form, keyboard a11y | Delvis |
| `dashboard.spec.ts` | Load, greeting, KPI, "Kom igång", quick actions, nav, expand/collapse, responsive, a11y, error-handling | **Ja, men `test.skip` om `TEST_USER_EMAIL` saknas (= alltid i CI)** |
| `cv.spec.ts` | Navigation, personal info, experience, education, skills, preview, export, auto-save, persist, list, a11y | **Ja, skippas i CI** |
| `cover-letter.spec.ts` | Navigation, AI-generate, edit, list, copy, PDF-download, a11y | **Ja, skippas i CI** |
| `job-search.spec.ts` | Navigation, search, filter location, details, save, applications-tab, pagination, responsive, a11y | **Ja, skippas i CI** |

> Eftersom CI-yaml endast kör `npx playwright test e2e/smoke.spec.ts --project=chromium`, **körs INTE de 5 authenticated specs i CI överhuvudtaget**. Det innebär att vi har:
> - **NOLL** CI-validering av login → dashboard
> - **NOLL** CI-validering av CV-byggaren och PDF-export
> - **NOLL** CI-validering av cover-letter-AI-flödet
> - **NOLL** CI-validering av job-search
> Authenticated tests måste köras manuellt med `TEST_USER_EMAIL`/`TEST_USER_PASSWORD` lokalt.

### Saknade golden paths
- **Login → CV-skapa → Export PDF**: Spec finns men skippas i CI. PDF-flödet ligger dessutom i många `*.cjs`-skript (audit-2026-05-11/verify-pdf-export.cjs, e2e/cv-print-pdf.cjs, e2e/cv-pdf-endpoint-verify.cjs, e2e/cv-template-snapshots.cjs) — manuella auditverktyg, inga CI-test.
- **Konsulent → tilldela deltagare → följ upp**: `sta-consultant-addparticipant.cjs` är ett one-shot-skript, inte ett spec. Det körs inte i CI.
- **AI-personligt brev**: `cover-letter.spec.ts` täcker UI:t men inte streaming-svar eller felhantering (429/timeout).
- **Intervjusimulator**: Inget spec. `e2e/test-focus-mode.cjs` rör fokusläget men inte själva intervjun. Tal-till-text-flödet är otestat.
- **Kompetensanalys (SkillsGapAnalysis)**: Inget spec. Pagecoverage är 93 % i vitest men funktionellt flöde är icke-E2E-verifierat.
- **Spontanansökan**: Inget spec. `pages/spontaneous/` är 0 % vitest-täckt.
- **AI-team / coach-chat**: Inget spec. `coach-widget.cjs` är ett verifieringsskript.
- **Onboarding (registrera → första steg)**: `auth.spec.ts` täcker formuläret men inte hela onboarding-flödet (Step 1–5 i `OnboardingFlow.tsx`).
- **Hubs på mobil**: `e2e/hubs-mobile.cjs` är ett one-shot-screenshot-skript. Inga assertions.
- **Diary, Wellness, Calendar, Education, Network, MyConsultant, KnowledgeBase, Resources**: Inga specs alls.

### Mobil-täckning
- `auth.spec.ts`, `dashboard.spec.ts`, `cv.spec.ts`, `cover-letter.spec.ts`, `job-search.spec.ts` har enstaka `setViewportSize({ width: 375, … })`-anrop, men ingen `--project=mobile-chromium` eller iPhone-emulering.
- `playwright.config.ts` saknas (jag hittade ingen i e2e/) — alla specs körs default-desktop-chromium om inte inline.
- Mobil-fokuserade scripts (`landing-mobile.cjs`, `login-mobile.cjs`, `hubs-mobile.cjs`, `subpages-mobile.cjs`) är screenshot-script utan assertions.

### CJS-script (30 filer i `e2e/`, 7 i `audit-2026-05-11/`)
- Dessa är användbara för **audit & verifiering**, men **utan assertions** kan de inte fånga regressioner. Klassificering:
  - **Screenshot-grabbers**: `screenshot.cjs`, `screenshot-collapsed.cjs`, `cv-screenshot.cjs`, `cv-template-snapshots.cjs`, `*-mobile.cjs`, `audit-2026-05-12/focus-mode/*`.
  - **PDF/Word-export verifiering**: `cv-print-pdf.cjs`, `cv-pdf-endpoint-verify.cjs`, `cv-templates-print.cjs`, `verify-pdf-export.cjs`, `verify-word.cjs`, `verify-berlin.cjs`, `verify-cv.cjs`, `export-centered-live.cjs`.
  - **Research/fetch** (engångsbruk): `fetch-elegantcv*.cjs`, `research-*.cjs`, `fetch-template-zoom.cjs`, `measure-margins.cjs`, `pdf-to-png.cjs`.
  - **Funktionsverifiering (utan asserts)**: `desired-jobs-flow.cjs`, `wellness-button.cjs`, `coach-widget.cjs`, `sta-*.cjs`, `network-empty-state.cjs`, `scroll-test.cjs`, `cv-live-test.cjs`, `test-focus-mode.cjs`.
  - **A11y-scan**: `axe-contrast.cjs` (kontrast 0 violations enligt audit 2026-05-14 ✅).

---

## A11y-skuld utöver färgkontrast

Färgkontrast: **0 axe-violations** (verifierat 2026-05-14 via `e2e/axe-contrast.cjs`). De övriga lagren har gap.

### Positivt
- `SkipLinks` är monterad i `Layout.tsx` och ger 3 hopplänkar (main-content, main-navigation, search). Main-element har `id="main-content"` + `aria-label`. ✅
- `useFocusTrap` används i 7 modaler (EventModal, QuestionCard, OnboardingFlow, WeeklySummary, AchievementCelebration, MobileNav, JobSearch jobModal). Hooken finns + en alternativ implementation i `useAccessibility.tsx`. ✅
- `IconButton` i `ui/Button.tsx` kräver `label`-prop som blir `aria-label`. Touch-targets ≥36 px (sm), ≥44 px (md), ≥48 px (lg). ✅
- 990 `aria-*`-referenser över 192 filer. ✅
- WCAG 2.5.5 touch-target verifieras via `min-h-[44px]` i Button-varianter `md`/`lg`/`touch`.

### Identifierad skuld

#### 1. `aria-live`-täckning är glesa (63 förekomster i 37 filer)
Streaming AI-svar, toast-meddelanden, autosave-indikator har `aria-live`, **men** dynamiska delar som följande **saknar** screen-reader-meddelanden:
- Sökresultat i `JobSearch.tsx` ("12 resultat" annonseras inte automatiskt — `dashboard.spec.ts:245` anropar `should announce results to screen readers` men den är ett soft-check, inte ett krav).
- Filter-uppdateringar (jobs/widgets/applications) — när filterChips ändras byts listan ut utan ARIA-feedback.
- Onboarding-stegen (`OnboardingFlow.tsx`) — varje steg är en separat sub-tree-bytning utan `aria-live="polite"` på containern.
- Widget-laddningstillstånd — `LoadingState.tsx` har `aria-live`, men widgetar som direkt visar data utan att gå via `LoadingState` saknar det.
- Energy-level changes (`EnergyLevelSelector.tsx`) — interaktion uppdaterar UI utan announcement.

#### 2. Heading-hierarki bryts
`Dashboard.tsx` (verifierat):
- Rad 101: `<h1>` (huvudtitel)
- Rad 144: `<h2>` ("Nästa steg")
- Rad 197: `<h3>` (sub-section under h2 — OK)
- Rad 235: `<h3>` direkt under `<h1>` (utan h2 mellanlands) — **hierarki bruten**
- Rad 253: `<h2>` (toDo)
- Rad 304: `<h2>` (sektion)
- Rad 323: `<h3>` (savedJobs)

Snabb stickprovskontroll visar samma mönster i flera tabsidor (`pages/dashboard/tabs/OverviewTab.tsx`, `pages/career/PlanTab.tsx`). Behöver systematisk genomgång.

#### 3. Modaler/dialoger med ofullständig ARIA-täckning
Endast 19 filer matchar `aria-modal|role="dialog"`. Snabba misstänkta saknade:
- `CrisisSupport.tsx` (en kritisk dialog som måste vara screen-reader-säker).
- `CoachWidget.tsx` (öppnar en sidopanel som agerar dialog).
- `HelpButton.tsx` (öppnar hjälpdialog).
- `notifications/NotificationBell.tsx` (panel — har `aria-modal` enligt grep, OK).
- Många `BottomSheet`-användningar (mobil-modaler) går inte via en standardiserad dialog-komponent.

**Inkonsekvent:** vissa modaler använder `useFocusTrap` (7 st), andra använder `useAccessibility.tsx`'s egna `useFocusTrap` (vilket innebär dubbla hookimplementationer — risk för bugs och olika beteende). Konsolidera till en.

#### 4. Tangentbordsnavigering
- `auth.spec.ts:118` har `should work with keyboard navigation` men testar bara tab + enter på loginformuläret.
- `dashboard.spec.ts:231` har `should support keyboard navigation` — kollar att första interaktiva elementet kan fokuseras, inte hela flödet.
- `cv.spec.ts:216` testar bara `ArrowRight` mellan tabs.
- **Saknas:** keyboard-test för HubBottomNav, MobileNav-meny, OnboardingFlow stegnavigering, JobDetailModal-stängning med Esc, CV-byggarens drag-and-drop-alternativ via tangentbord.

#### 5. Skärmläsare-skuld
Ingen automatisk skärmläsare-test (axe testar bara statisk struktur, inte announcement-flöden). Allvarligt eftersom målgruppen inkluderar användare med kognitiva/visuella nedsättningar.

#### 6. Touch-target-undantag
`size="sm"` i `IconButton` är 36×36 px (< WCAG 2.5.5 nivå AAA 44 px men ≥ Level AA's enligt 2.5.5 Inverte stadgar). Acceptabelt enligt AA, men ska dokumenteras explicit. Sök i `components/admin/SuperAdminPanel`, `pages/sta/StaConsultant` (4 träffar), `components/consultant/ParticipantList`, `pages/consultant/ResourcesTab`, `pages/consultant/ParticipantDetailPage` för manuell granskning av size-6/size-7-ikoner i klickbara element.

#### 7. Skip-link fungerar men har ett funktionellt fel
`SkipLinks.tsx:42-47`: vid klick ringer den `element.focus()` men `main`-elementet behöver `tabindex="-1"` för att bli fokuserbart. `MainContent`-helpern sätter det, men i `Layout.tsx` används en vanlig `<main>` utan `tabIndex={-1}`. Verifiera att skip-link faktiskt flyttar fokus.

---

## Skrämmande testmönster

### `.skip` / `xdescribe` / `it.todo`
Totalt **5 it.skip** i koden:
- `InternationalWidget.test.tsx:5` — `'renders empty-state by default in Phase 3 (no international_targets table assumed)'`
- `SalaryWidget.test.tsx:5` — `'renders salary KPI when salary_data table exists in DB-PERFORMANCE.md'`
- `SalaryWidget.test.tsx:9` — `'renders empty state when no role configured (Phase 3 default)'`
- `Dashboard.test.tsx:211` — `'should have expand/collapse buttons with correct ARIA attributes'`
- `Dashboard.test.tsx:228` — `'should toggle category expansion when clicked'`

> De 5 stämmer med "5 skipped" som du nämnde — bra att de inte är fler. **Men:** Dashboard-skipparna är *ARIA-relaterade*, vilket är direkt en a11y-skuld.

Ingen `xdescribe`, `xit`, `it.todo` eller `test.todo` hittad. ✅

### Övermockning (testar mocken, inte koden)
- `vi.mock`/`jest.mock` förekommer **110 gånger i 34 filer** av 81 testfiler — ~42 % av tester mockar något.
- Sentry mockning är vanligt och OK.
- `aiApi.test.ts` mockar `fetch` + `supabase.auth.getSession` — testar fortfarande verkligt `callAI`-flöde med olika svar. Sund.
- `auth-flow.test.tsx`, `login-flow.test.tsx`, `register-flow.test.tsx` mockar `supabase.auth.signIn`/`signUp` direkt — testerna verifierar att UI:n reagerar korrekt på lovaden, men **integration mot riktig RLS-policy testas inte enhetstest-vägen** (görs istället i `docs/security-audit.md` RLS-test, vilket är bra men separat).
- `register-flow.test.tsx:247`, `login-flow.test.tsx:123` — använder `setTimeout(…, 1000)` för att simulera "loading state". Detta gör suiten 2 sek långsammare och är onödigt (kan användas `vi.useFakeTimers`).

### Flaky-risk
- **Inga `test.retry` eller `--retries` i koden.** Bra.
- **Inga uppenbara `await page.waitForTimeout(5000)`** i specs — men `cv.spec.ts:152` har `setTimeout: 5000` på autoSave-assertion, OK.
- Smoke-spec har `waitForTimeout(1500)` (rad 66) för redirect — minor flakiness-risk.

### Snapshot-täckning
- **1 enda snapshot-test:** `DashboardSkeleton.test.tsx`.
- Inga snapshots för CV-templates (BerlinTemplate, BudapestTemplate, ChicagoTemplate m.fl. — 9 mallar exportbara till PDF) → regression i visuella mallar fångas inte automatiskt. `e2e/cv-template-snapshots.cjs` finns men är ett one-shot-screenshot-skript, inte vitest-snapshot.

---

## CI / Kvalitetsgrindar

### `.github/workflows/ci.yml`
Jobb som körs vid push/PR:
| Steg | Status |
|---|---|
| `lint-and-typecheck` | ✅ `eslint .` + `typecheck:critical` + `lint:design` |
| `test` | ✅ `npm run test:coverage` (722 passar) |
| `build` | ✅ `npm run build` (Vite) |
| `lighthouse` | ✅ a11y/best-practices/seo som *warn* (inte fail) |
| `e2e-smoke` | ✅ Endast `smoke.spec.ts` |
| `security` | ✅ `npm audit` (continue-on-error) + trufflehog |

### `.github/workflows/deploy.yml`
- Frontend → Vercel (prod)
- Supabase functions deploy (NOT migrations)
- Smoke-test på `https://jobin.se`

### Inga
- **`.husky/`-katalog saknas** → ingen pre-commit-grind.
- **Ingen `lint-staged`-config** i `package.json` (root) eller `client/package.json`.
- **CODEOWNERS / PR-template** inte verifierat — utanför uppdragets scope.

### 1160 ESLint-errors — blockerar de CI?
- `npm run lint` returnerar **exit code 1** vid 1160 errors → CI-steget `lint-and-typecheck` **bör fail:a**. Att merge:s ändå går igenom betyder antingen att (a) den senaste pushes inte triggat CI, eller (b) den GitHub-policyn tillåter merge med röd CI, eller (c) testat lokalt utan att pusha.
- Snabbcheck: errorerna kommer från ny gradient-regel som höjts till `error` 2026-05-14 (kommentar i `eslint.config.js`: "Höjda till 'error' 2026-05-14 efter att 309 → 68 gradient-warnings städats"). Detta är **mycket nyligt** och CI har förmodligen inte hunnit fail:a en grön merge ännu. **Aktuellt: nästa push till `main`/`develop` kommer fail:a hela CI** om de 1160 errorerna inte fixas eller suppressas.
- Felfördelning: gradient-regler (no-restricted-syntax), `@typescript-eslint/no-explicit-any`, `no-useless-escape`, `no-unused-vars`, `react-refresh/only-export-components`.

### Coverage-grind
Coverage rapporteras (`coverage-summary.json`, `coverage-report` artifact) men **ingen tröskel** (`vitest.config.ts` har troligen inga `thresholds`). Coverage kan sjunka från 20 % → 5 % utan att CI märker.

---

## Prioriterad åtgärdslista

### Måste fixas innan nästa merge (BLOCK)
1. **Adressera 1160 ESLint-errors** — annars stoppas alla pushes till `main`. Antingen massredigera gradient-träffar (många kan vara legitima — granska whitelisten) eller lägga regeln som `warn` tillfälligt.
2. **Sätt `TEST_USER_EMAIL`/`TEST_USER_PASSWORD` som GitHub Secrets** och kör authenticated E2E-specs i CI. Just nu skippas 5 av 6 spec-filer i CI → vi vet aldrig om login → dashboard fungerar.

### Hög prioritet — säkerhet & regressionsskydd
3. **Skriv tester för otestade kritiska services:** `userApi.ts`, `profileEnhancementsApi.ts`, `applicationsApi.ts`, `careerApi.ts`, `staApi.ts`, `cloudStorage.ts`, `pdfExportService.ts`, `notificationsService.ts`. Sikta på 60 % radcoverage per fil. Använd `aiApi.test.ts` som mall.
4. **Skriv E2E golden path för Konsulent-flödet:** login (konsulent) → addParticipant → tilldela uppgift → följ upp. `sta-consultant-addparticipant.cjs` har redan all kod — konvertera till `consultant.spec.ts`.
5. **Skriv E2E för PDF-export:** Login → CV → skapa CV → exportera PDF → verifiera att blob nedladdas. Bygg på `e2e/cv-print-pdf.cjs`.
6. **Återställ heading-hierarki** på Dashboard.tsx + alla dashboard-tabs. h1 → h2 → h3 utan att hoppa.
7. **Aktivera coverage-tröskel** i `vitest.config.ts` (minst 25 % lines, 35 % functions) så det inte sjunker.

### Medel prioritet — a11y-konsolidering
8. **Konsolidera `useFocusTrap`** — det finns två implementationer (`hooks/useFocusTrap.ts` + `hooks/useAccessibility.tsx`). Välj en, exportera en, dokumentera.
9. **Lägg `aria-live="polite"`** på sökresultat-containers, filter-listor, onboarding-steg, widget-uppdateringar.
10. **Verifiera Skip-link funktionalitet** — kontrollera att `<main>` har `tabIndex={-1}` i `Layout.tsx` (annars flyttar inte fokus).
11. **Granska `ConfirmDialog`, `BottomSheet`, `CoachWidget`, `CrisisSupport`** för fullständig `role="dialog"` + `aria-modal="true"` + `aria-labelledby`.
12. **Skriv keyboard-only E2E-test:** Tab dig igenom hela landningssidan + login → dashboard utan att röra musen.

### Låg prioritet — hygien
13. **Lägg `husky` + `lint-staged`** för pre-commit: lint på ändrade filer, typecheck:critical.
14. **Snapshot-testa CV-templates** (9 mallar) med vitest + happy-dom, så Berlin/Budapest/etc inte tyst regress:ar visuellt.
15. **Aktivera lighthouse `accessibility=error`** istället för `warn` i CI när a11y-skulden är åtgärdad.
16. **Stub `setTimeout(…, 1000)`** i `register-flow.test.tsx:247` + `login-flow.test.tsx:123` med `vi.useFakeTimers` för snabbare suite.
17. **Lös 5 `it.skip`** i Dashboard + International + Salary (eller dokumentera varför de inte ska köras).
18. **Skriv tester för `ui/`-grundkomponenter:** Button, Input, Card, Tabs, EmptyState, ConfirmDialog. Wide blast radius betyder att en bugg där bryter hela portalen.
