# Teknisk skuld — QA & testtäckning

**Datum:** 2026-05-09
**Granskare:** qa-testare-agent
**Verktyg granskade:** Vitest + Testing Library, Playwright, GitHub Actions CI

---

## Sammanfattning

| Mått | Värde |
|------|-------|
| Källfiler i `client/src` (.ts/.tsx, ej tester) | **735** |
| Vitest-testfiler | **82** |
| Grov testfilskvot | **~11%** av filer har egen testfil |
| Komponenttäckning | **43 testfiler / 416 .tsx-komponenter** = ~10 % |
| Hooks | **12 testfiler / 54 hooks** = ~22 % |
| Services | **8 testfiler / 65 services** = ~12 % |
| Sidor (`pages/`) | **4 testfiler / ~48 sidor** = ~8 % |
| **Senaste `npm run test:run`** | **24 fail / 695 pass / 3 skip** av 722 (4 av 81 testfiler röda) |
| Coverage-thresholds | **Inga aktiva** (kommenterade ut i `vitest.config.ts`) |
| Playwright-projekt konfigurerade | 5 (chromium, firefox, webkit, Mobile Chrome, Mobile Safari) |
| Playwright-spec-filer | 6 (`smoke`, `auth`, `cv`, `cover-letter`, `dashboard`, `job-search`) |
| E2E i CI | Endast `smoke.spec.ts` körs i CI |
| Tillgänglighetstest (axe-core) | **0 — inte installerat** |
| Visuell regressionstestning | **0 — finns inte** |

### Snabbdiagnos

- **CI är permissivt grönt:** thresholds saknas i `vitest.config.ts` (avsiktligt — kommentaren erkänner att de 20 trasiga Dashboard-testerna måste fixas först), och `npm audit` har `continue-on-error: true`. Det betyder att CI passerar trots 24 fail i `test:coverage`-jobbet — om inte CI-jobbet faktiskt failar nu (det gör det, eftersom `npm run test:coverage` returnerar non-zero exit code utan thresholds — låt det bekräftas).
- **Trasiga test som ligger kvar:** `pages/Dashboard.test.tsx` (20 fails — komponenten har drivit ifrån testet), `Sidebar.test.tsx` legacy-läge (1), `widgets/HubGrid.test.tsx` (2 — saknar role-region-stöd), `test/integration/register-flow.test.tsx` (1 — query baserad på CSS-klass `.text-green-500`).
- **AI-stack är extremt undertesad:** `aiApi.ts` har test, men resten av `services/ai/*`, `services/aiStreamService.ts`, `services/aiCareerAssistantApi.ts`, `services/aiCompanySearchApi.ts`, `services/aiService.ts` saknar tester helt.
- **Inget e2e för auth-flöde mot Supabase** kör i CI — alla flow-test i `e2e/auth.spec.ts`, `cv.spec.ts`, `cover-letter.spec.ts`, `dashboard.spec.ts`, `job-search.spec.ts` skippas via `test.skip(!process.env.TEST_USER_EMAIL, ...)` om inte sekreten är satt. Det är troligen aldrig satt i CI eftersom workflowen `e2e-smoke` bara kör `e2e/smoke.spec.ts`.

---

## Kritiska flöden utan test

| Flöde | Status | Riskbedömning |
|-------|--------|---------------|
| **CV-byggare → spara/exportera** | Endast e2e-fixtur som kräver TEST_USER_EMAIL (skippas) + `pages/CVPage.test.tsx`. Ingen integration mellan `cvStore` + `useCVAutoSave` + Supabase. | **HÖG** — kärnfunktion utan flow-test |
| **CV PDF-export** | `services/pdfExportService.ts`, `services/pdfReportGenerator.ts`, `services/pdfLazyLoad.ts` har **inga** test trots att de innehåller komplex layout-logik | **HÖG** |
| **AI-streaming** (`useAIStream` + `client/api/ai-stream.js`) | Inget test — varken hook, service eller endpoint | **HÖG** — användarsynlig regression vid driftstörningar |
| **AI-anrop end-to-end** (`callAI`) | `aiApi.test.ts` mockar fetch men testar bara felmappning, inte konsumenter (`generateCV`, `optimizeProfile`, etc.) | MEDEL |
| **Auth-flöde mot Supabase** | `authStore.test.ts` mockar all Supabase-auth — ingen integrationstest mot riktig instans. E2E `auth.spec.ts` skippar tester som kräver inloggning | **HÖG** |
| **Hub-navigering — mobil bottennav** | `HubBottomNav.test.tsx` finns men `pages/hubs/*.test.tsx` testar inte mobile-only-flödet | MEDEL |
| **Spontanansökan** (`Spontaneous.tsx`, `useSpontaneousCompanies`, `aiCompanySearchApi`) | Inget test alls | MEDEL |
| **Intervjusimulator** (tal-till-text, audio recording) | `interviewService.test.ts` finns men `useAudioRecorder`, `useVoiceInput`, `useVoiceOutput`, `pages/InterviewSimulator.tsx` saknar test | MEDEL |
| **Konsulent-vy** (`pages/Consultant.tsx`, `services/consultantInsights`, `consultantService`) | Inget test alls | MEDEL |
| **Spara/dela jobb** (`useSavedJobs`, `useJobMatching`, `useJobAlerts`) | Inga hook-test | MEDEL |
| **Hälsa & Wellness** (`pages/Wellness.tsx`, `useEnergyLevel`, `energyStoreWithSync`) | Inget test, trots cross-device-sync | MEDEL |
| **Dagbok** (`pages/Diary.tsx`, `useDiary`, `services/diaryApi`) | Inget test | MEDEL |
| **OAuth-callbacks** (`GoogleCalendarCallback.tsx`, `LinkedInCallback.tsx`, `services/googleCalendarService`, `linkedinService`) | Inget test — silent failure-risk på prod | **HÖG** för konsulter |
| **Kompetensgapsanalys & utbildning** | `useEducationSearch` + `pages/SkillsGapAnalysis.tsx` + `pages/Education.tsx` — inga test | MEDEL |
| **Rate-limiting** (`api/_utils/rate-limiter.js`) | Inget test trots att den är distribuerad mot Supabase | **HÖG** |
| **Vercel serverless functions** (`client/api/ai.js`, `ai-stream.js`, `job-alerts.js`, `upload-image.js`) | Inga test — JS-kod utan TS-säkerhet | **HÖG** |
| **Supabase edge functions** (23 st i `supabase/functions/`) | Inga Deno-test alls | **HÖG** |
| **Felhantering 401/403/429/500 på UI-sidor** | Mestadels otestat — `aiApi.test.ts` testar bara mapping, inte att komponenter faktiskt visar fel | MEDEL |

---

## Svaga test (mockar för mycket eller är stub)

### Stubbar utan verkligt assert
- `client/src/components/widgets/InternationalWidget.test.tsx` — endast `it.skip()`. Filen importerar komponenten men kör inget. **Värdelös som regression-skydd.**
- `client/src/components/widgets/SalaryWidget.test.tsx` — två `it.skip()`. Samma problem.
- Båda kommenterar "Phase 3 default" / "DB-PERFORMANCE.md" — uppenbart kvarglömda från en plan som aldrig slutfördes (`82d5059 test(03-02): Wave 0 stub files — 9 skipped tests`).

### Test som mockar bort allt meningsfullt
- `pages/Dashboard.test.tsx` mockar `useDashboardData`, `useInterestProfile`, `useAuthStore`, `supabase`, `HelpButton` — sen renderar den och letar efter strängar. Resultatet: alla 20 test failar för att Dashboard-komponenten har ändrats men testet inte uppdaterats. Det testar inte beteende — det testar att en specifik DOM-struktur finns.
- `test/integration/register-flow.test.tsx` rad 92 använder `document.querySelectorAll('.text-green-500')` — testet bryts så snart Tailwind-utility-klasser ändras. Det är **inte beteendetest**, det är CSS-snapshot-test förklätt.
- `test/integration/nav-smoke.test.tsx` har 5 `vi.mock()` (auth, navigation, supabase, sentry, ThemeContext) — vilket gör att testet bara verifierar att lazy-imports inte kraschar. Värdefullt som "smoke", men det är inte ett integrationstest mot riktig nav-logik.
- `services/aiApi.test.ts` mockar både `supabase.auth.getSession` och `global.fetch`. Det fångar happy-path och felmappning men inte:
  - Retry-beteende (verkar saknas helt i `aiApi.ts`)
  - Timeout
  - Body-parsning av streaming
  - Korrelations-id eller Sentry-context

### Test som är "rendering OK"-test
Många widget-test (`CvWidget.test.tsx`, `JobSearchWidget.test.tsx` m.fl.) gör i praktiken bara `render(<X/>)` + `expect(getByText(...))`. De fångar inte:
- Vad händer när `data` är `null`/`undefined` mitt under render?
- Vad händer vid hook-fel?
- Tangentbordsnavigering, ARIA, screen-reader-states.

### Inga error-path-test
Sökning efter `rejects.toThrow|response.*500|status: 500|status: 401` ger ~10 träffar i hela `client/src`. För en app med 65 services som alla kallar antingen Supabase eller AI-endpoints är det extremt lågt. Edge cases (offline, timeout, race conditions) saknas i princip helt.

---

## E2E-luckor

### Vad som finns
- `smoke.spec.ts` — 6 publika sidor renderar utan JS-fel. Körs i CI.
- `auth.spec.ts` — 11 test, varav ca 4 är **autentiserade** (skippas i CI utan TEST_USER_EMAIL).
- `cv.spec.ts`, `cover-letter.spec.ts`, `dashboard.spec.ts`, `job-search.spec.ts` — **alla** har `test.skip(!process.env.TEST_USER_EMAIL, ...)` i `beforeEach`. **Hela filerna skippas i CI** eftersom workflowen bara kör `e2e/smoke.spec.ts`.
- 23 `.cjs`-filer i `e2e/` är **screenshot-skript**, inte Playwright-tester. De renderar och tar PNG men assertar inget.

### Vad som saknas
- **Hub-navigering** — inget e2e (varken `oversikt`, `jobb`, `karriar`, `resurser`, `min-vardag`).
- **AI-flöde end-to-end** — ingen riktig AI-test (CV-genererande, personligt brev, intervju, kompetensgap).
- **Mobil-flöde** — Mobile Chrome/Safari finns konfigurerade i `playwright.config.ts` men ingen workflow kör dem.
- **Cross-browser i CI** — endast chromium körs (`--project=chromium`).
- **Onboarding** — ny användare → första CV → första ansökan testas aldrig.
- **OAuth-callback** (Google Calendar / LinkedIn).
- **PDF-export** — ingen test som verifierar att PDF faktiskt skapas.
- **Tillgänglighet** — inga `@axe-core/playwright`-anrop.
- **Visual regression** — `toHaveScreenshot()` används inte (bara screenshot-on-failure).
- **Performance budgets** — Lighthouse CI körs men `performance=off` i assertions (`ci.yml` rad 152), så hastighetsregressioner blockerar inget.

---

## CI-skuld

### Fungerar
- Lint, typecheck-critical, build, smoke-E2E körs på varje PR.
- Lighthouse CI körs (men accessibility/best-practices/seo bara `warn`, performance helt av).
- `coverage-report` artifact uppladdat per build.
- `trufflesecurity/trufflehog` scan i security-jobbet.

### Brister
1. **Coverage-thresholds är aktivt avstängda** (kommentar i `vitest.config.ts` rad 23-32). CI rapporterar trender men kan inte regressionsblockera. Resultat: pull request med 0 % coverage på ny kod passerar.
2. **`npm audit` har `continue-on-error: true`** (`ci.yml` rad 230) — high/critical vulnerabilities blockerar inte merges.
3. **`test:coverage` failar på de 24 trasiga testerna** — men workflowen körs ändå eftersom `lint-and-typecheck`-jobbet är separat från `test`-jobbet, och `build` har `needs: [lint-and-typecheck, test]`. Det betyder att `build` bör failas. **Det här bör verifieras** — om `test`-jobbet faktiskt har varit grönt har någon glömt vilka tester som körs.
4. **E2E-coverage är illusorisk** — endast smoke körs, ingen autentiserad flow-test mot staging.
5. **`lighthouse` blockerar inget** — alla `--assert.assertions.categories` är `warn` eller `off`.
6. **Inget separat preview-deploy-test** — Vercel preview används inte i CI för att verifiera ny kod mot prod-lik miljö innan merge.
7. **Ingen mobil-CI** — alla 5 Playwright-projekt finns men endast desktop chromium körs.
8. **Snyggt deploy.yml + `supabase db push`** — påståendet i `CLAUDE.md` är att `db push` inte ska användas, men `deploy.yml` rad 58 gör exakt det. Konflikt mellan dokumentation och pipeline.
9. **Smoke-test efter deploy** har `continue-on-error: true` på API-checken (`deploy.yml` rad 93) — Supabase functions-health blockerar inte deploy om den failar.

---

## Konkreta åtgärder

### Prioritet 1 — Stoppa blödningen (1 sprint)
1. **Ta bort eller fixa `Dashboard.test.tsx`** (20 fail). Antingen ta bort filen eller skriv om den enligt "testa beteende, inte implementation"-principen — färre, robustare assertions.
2. **Fixa `widgets/HubGrid.test.tsx` × 2** (Section-tests letar efter `role="region"` men `Section`-komponenten saknar `aria-labelledby`). Lägg till `aria-labelledby` i `HubGrid.Section` — testet är korrekt, komponenten har drivit.
3. **Fixa `Sidebar.test.tsx` Test 8** — räkna nav-länkar matchar inte längre 27 (hub-shell ändrar). Uppdatera siffran eller mocka isHubNavEnabled tydligt.
4. **Fixa `register-flow.test.tsx`** — sluta queryselecta `.text-green-500`. Använd `aria-label` eller `data-testid` på checkmarks.
5. **Ta bort eller skriv `InternationalWidget.test.tsx` + `SalaryWidget.test.tsx`** — `it.skip`-stubbar är värre än ingen fil alls.
6. **Aktivera coverage-thresholds** så snart de 24 testen är gröna. Sätt baseline 5 % under faktisk täckning. `vitest.config.ts` har redan plan som kommentar.
7. **Ändra `npm audit` till `--audit-level=high`** utan `continue-on-error` — eller motivera explicit varför.

### Prioritet 2 — Kritisk täckning (2-3 sprintar)
8. **Lägg till `@axe-core/playwright`** i `smoke.spec.ts` — kör `await injectAxe(page); await checkA11y(page)` på alla 6 publika sidor.
9. **Skriv test för `aiStreamService.ts`/`useAIStream`** — streamingfel är osynliga annars.
10. **Skriv test för `services/ai/*`** (smartMatching, embeddings, aiAssistant) — kärnvärde i portalen.
11. **Skriv test för `pdfExportService.ts`** — verifiera CV-PDF är välformad (jspdf-snapshot eller PDF-parser).
12. **Skriv test för `services/applicationsApi`, `useSavedJobs`, `useJobMatching`** — sökandes data persisteras.
13. **Sätt upp TEST_USER_EMAIL/PASSWORD som GitHub Secret** och kör `auth.spec.ts` + `dashboard.spec.ts` + `cv.spec.ts` mot staging-miljö i `e2e-smoke`-jobbet.
14. **Skriv hook-test för `useEnergyLevel` + `energyStoreWithSync`** — Supabase-sync är icke-förhandlingsbar.

### Prioritet 3 — Långsiktig kvalitet
15. **Visuell regression** — Playwright `toHaveScreenshot()` på 5 hub-sidor + Login + Landing.
16. **Kontraktstest mot Supabase edge functions** — anropa varje edge function med dummy-payload och verifiera schema.
17. **Mutationstest** (Stryker) på `services/aiApi.ts` + `cvStore.ts` + `authStore.ts` — visa att existerande test faktiskt fångar buggar.
18. **Ta bort skip-pattern i e2e** — separera "kräver auth"-test till egen `*.authed.spec.ts` som körs i särskilt CI-jobb.
19. **Lighthouse-budgets med faktiska tröskel** — `performance: error` med threshold 70, `accessibility: error` med threshold 90.
20. **Ersätt `supabase db push` i `deploy.yml`** med kontrollerad migration enligt `CLAUDE.md`-policy. Lägg till migration-dry-run i CI.

### Mätbar ambition (slut Q3 2026)
- Vitest: pass-rate 100 %, line coverage ≥ 35 % (från ~20 %), inga `it.skip` utan FIXME-kommentar och ticket-id.
- Playwright: 12 spec-filer, 60 test, alla 5 projekt körs i CI nattetid mot staging.
- Axe: 0 critical violations på alla publika sidor + 5 hubbar.
- Visual regression: 15 baseline-screenshots, diff-tröskel 0.1 %.
- CI: blockerar PR vid coverage-drop > 1 %, vid axe-violation, vid lighthouse-perf-drop > 5.
