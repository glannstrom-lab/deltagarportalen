# Teknisk skuld – roadmap
**Datum:** 2026-05-14
**Bas:** [TECH-DEBT-AUDIT-2026-05-14.md](TECH-DEBT-AUDIT-2026-05-14.md)
**Princip:** Tidsuppskattningar är realistiska för en utvecklare som kan kodbasen. Effort-skala: XS=10 min, S=≤2 h, M=½ dag, L=1 dag, XL=2-5 dagar.

---

## Översikt – 6 faser över ~10 veckor

| Fas | Tema | Mål | Tid | Risk |
|-----|------|-----|-----|------|
| **Fas A** | Akut brandsläckning | CRITICAL + HIGH. Stoppa CI-blockering, säkra public upload, lås AI-kostnad, fixa LCP. | **1 vecka** | Hög effekt, låg risk |
| **Fas B** | Dödkod-rensning | Radera 5-6k rader oimporterad kod. Avveckla `server/`. | **½ vecka** | Låg risk |
| **Fas C** | AI-robusthet | Konsolidera AI-stack, Zod-validera, token-cap, retry. | **2 veckor** | Medel risk |
| **Fas D** | Test-grundläggning | Auth-E2E i CI, 4 kritiska services testade, coverage-tröskel. | **2 veckor** | Låg risk |
| **Fas E** | Arkitektur-städning | Bryt upp god-objects, migrera articleData → DB. | **2 veckor** | Medel risk |
| **Fas F** | UX-städning & a11y | EmptyState-migration, localStorage-cloud, heading-fix, mobil-tester. | **2 veckor** | Låg risk |

**Parallellitet:** Fas A måste vara först. Fas B-F kan delvis köras parallellt. Fas C blockerar inte Fas D/E/F.

---

## Fas A – Akut brandsläckning (vecka 1)

> **Mål:** Stoppa pågående skador. CI-grön igen. Säkerhetsläckan stängd. LCP halverat. AI-kostnaden under kontroll.

### A1. Lös CI-blockering — ESLint 1160 → 0 errors
- **Vad:** `npx eslint . --fix` löser ~800 errors automatiskt (no-unused-vars, no-useless-escape, prefer-const). Granska diff per modul, commit per modul. Resterande ~360 fixas manuellt eller suppressas per fall.
- **Tid:** L (1 dag)
- **Risk:** Låg. Auto-fix är säker. Commit per modul håller diff läsbar.
- **Verifiera:** `npx eslint .` ger 0 errors → `npm run lint` exit 0 → CI grönt.
- **Vinst:** Återfår pushability till `main`.

### A2. Fix rules-of-hooks-bugg i SkillsGapAnalysis
- **Vad:** Flytta 13 `useState`-anrop före `if (isFocusMode) return`. `client/src/pages/SkillsGapAnalysis.tsx:115-149`.
- **Tid:** S (30 min)
- **Risk:** Låg.
- **Verifiera:** Toggle focus-mode på `/skills-gap-analysis` utan krasch. ESLint `rules-of-hooks` 17 → 16.
- **Vinst:** Riktig bugg åtgärdad.

### A3. Stoppa anonym uppladdning till Vercel Blob — CRITICAL
- **Vad:** Lägg till Bearer-token + `auth.getUser` i `client/api/upload-image.js`. Magic-byte-validering (JPEG/PNG/GIF/WebP). Rate-limit via `api/_utils/rate-limiter.js`. Sanera `req.query.filename`.
- **Tid:** M (½ dag)
- **Risk:** Låg. Mönster finns i `client/api/ai.js`.
- **Verifiera:** Anonymt curl-anrop returnerar 401. Spoofat Content-Type avvisas (testa med .html-fil med image/png-header).
- **Vinst:** Stänger CRITICAL-läckan. Quota-skydd.

### A4. Fix vendor-pdf modulepreload — LCP -2 000 ms
- **Vad:** I `vite.config.ts`, byt `manualChunks: { 'vendor-pdf': [...] }` till en function-based allocator som inte fångar Vites `__vitePreload`-helper. Alternativt sätt `build.modulePreload = { polyfill: false }` + `experimentalMinChunkSize: 0`. Splitta `vendor-pdf` i `vendor-jspdf` + `vendor-react-pdf` + `vendor-html2canvas`.
- **Tid:** S (1 h)
- **Risk:** Medel — verifiera att lazy CV-export fortfarande fungerar.
- **Verifiera:** Build → granska `dist/index.html`. Inget `modulepreload` för PDF-chunken. Lokalt: ladda `/` och kolla Network. Sentry: mät LCP före/efter.
- **Vinst:** LCP 7-8s → ~5s.

### A5. Sätt `maxDuration: 60` för AI-endpoints i vercel.json
- **Vad:** Lägg till `client/api/ai.js` och `client/api/ai-stream.js` i `vercel.json` med `maxDuration: 60`.
- **Tid:** XS (10 min)
- **Risk:** Ingen.
- **Verifiera:** Generera ett 1500-token cover letter. Ingen "AI hängde sig".
- **Vinst:** Stoppar timeout-kapning av AI-svar.

### A6. Synka modell-låsning till edge-vägen — stoppa kostnadsläckan
- **Vad:** Sätt `AI_MODEL=openai/gpt-oss-120b` som Supabase-env för `ai-assistant`, `ai-cover-letter`, `ai-cv-writing`, `learning-analyze-gap` (de defaultar Sonnet idag). Bestäm om Perplexity-vägen (5 edge-fn) är medvetet undantag för web-search — om ja, dokumentera i `docs/AI_ARCHITECTURE_OVERVIEW.md`. `cv-analysis` (OpenAI gpt-4) flyttas till OpenRouter eller dokumenteras som separat faktura.
- **Tid:** M (½ dag)
- **Risk:** Medel — kvalitetstest cover-letter på gpt-oss vs Sonnet.
- **Verifiera:** Trigga `coverLetterApi.generate()` → kolla `ai_usage_logs.model_used` = `openai/gpt-oss-120b`.
- **Vinst:** Stoppar månadens kostnadsläcka. Logga månatlig OpenRouter-faktura före/efter för dokumentation.

### A7. Skydda `_fix_all_rls_policies.sql` mot återkörning
- **Vad:** Lägg till explicit marker i Supabase `_migrations`-tabellen att filen är körd. Alternativt: refaktorera filen att vara non-destruktiv (wrap i `DO BEGIN IF NOT EXISTS ...`).
- **Tid:** S (1 h)
- **Risk:** Låg om man inte rör filen, högre om man refaktorerar.
- **Verifiera:** `SELECT * FROM supabase_migrations.schema_migrations WHERE version = '20260306130000';` returnerar rad.
- **Vinst:** Förhindrar accidentell data-destruktion.

### Fas A-summa
- **Tid:** ~6 dagars arbete = 1 vecka.
- **Stänger:** 2 CRITICAL + 3 HIGH + 1 LCP-killer.
- **Effekt:** CI grönt. Säkerhetsläckan stängd. LCP halverat. AI-kostnad kontrollerad.

---

## Fas B – Dödkod-rensning (½ vecka)

> **Mål:** Radera 5-6k rader oimporterad kod så att läsning, sökning, tree-shaking och bundle-storlek alla blir bättre.

### B1. Flytta `server/` till `archive/server-legacy/` eller radera
- **Vad:** README säger redan "INAKTIV". 14 TS-filer, egen `package.json`+`node_modules`+`prisma`. 0 importer från resten av koden.
- **Tid:** XS (5 min)
- **Risk:** Ingen.
- **Verifiera:** `grep -r "from.*server" client/` ger 0 träffar (utöver i docs).

### B2. Radera oimporterade komponenter
- **Vad:** `components/Onboarding.tsx`, `components/career/CareerOnboarding.tsx`, `components/MobileNav.tsx`, `components/MobileBackButton.tsx`, `components/SuccessMoments.tsx`, `components/BreakReminder.tsx`, `components/SupportiveLanguage.tsx`, `components/Link.tsx`, `components/HelpButton.tsx` (flytta `type HelpContent` till `data/helpContent.ts`), `components/QuickApply.tsx`, `components/CoachWidget.tsx` (NB: dubbelkolla — den verkar användas av Layout men auditen säger 0 importer). Uppdatera `components/career/index.ts:6` re-export.
- **Tid:** S (1 h)
- **Risk:** Låg — verifierat 0 importer per audit. Kör build efter varje delete.
- **Verifiera:** `npm run build` lyckas. `npx tsc --noEmit` rent.

### B3. Radera AI-dödkod-stacken
- **Vad:** `components/ai/SmartReminders.tsx`, `components/ai/SmartJobMatches.tsx`, `components/ai/SkillGapAnalysis.tsx`, `services/ai/aiAssistant.ts`, `services/ai/embeddings.ts`, `services/ai/smartMatching.ts`, `services/ml/`, `services/nlp/`, `services/notifications/reminderService.ts`, `services/aiService.ts` (725 rader, 0 callers).
- **Tid:** S (1 h)
- **Risk:** Låg.
- **Verifiera:** Build + tsc rent.

### B4. Radera matchande komponenter + services
- **Vad:** `components/CVMatcher.tsx` + `services/cvMatcher.ts`, `components/JobRecommendations.tsx` + `services/occupationMatcher.ts`, `components/MarketStats.tsx` + `services/marketStatsService.ts`, `components/recommendations/RecommendationsPanel.tsx` + `services/recommendationService.ts`, `services/afDirectApi.ts`.
- **Tid:** S (30 min)
- **Risk:** Låg.

### B5. Krymp `services/mockApi.ts` (774 → ~80 rader)
- **Vad:** Flytta `type Job` + `type JobApplication` till `client/src/types/jobs.ts`, radera 23 oanvända `mock*Api`-exports. Uppdatera 3 imports (`JobCard.tsx`, `JobDetailModal.tsx`, `ApplicationsTracker.tsx`).
- **Tid:** S (30 min)
- **Risk:** Låg.

### B6. Radera tomma `client/src/features/`
- **Tid:** XS

### B7. Konsolidera onboarding-komponenter
- **Vad:** Verifiera duplikatet `components/dashboard/GettingStartedChecklist.tsx` vs `components/onboarding/GettingStartedChecklist.tsx`. Behåll en. Dokumentera de 5 aktiva onboarding-mönstren (`OnboardingFlow`, `OnboardingStep`, `CVOnboarding`, `profile/OnboardingModal`, `ai-team/OnboardingModal`) i `docs/onboarding-patterns.md`. Adressera DESIGN-DEBT §Onboarding.
- **Tid:** L (1 dag)
- **Risk:** Medel — kräver bekräfta vilken som ska vinna.

### Fas B-summa
- **Tid:** ~2 dagars arbete = ½ vecka.
- **Effekt:** -5-6k rader, mindre bundle, läsbarare kodbas. Tree-shaking funkar bättre.

---

## Fas C – AI-robusthet (vecka 3-4)

> **Mål:** AI-stacken ska vara typsäker, retry:bar, observerad och kostnadsbegränsad.

### C1. Konsolidera prompt-templates
- **Vad:** Skapa `client/api/_prompts.js` som både `ai.js` och `ai-stream.js` importerar från. Eliminera divergensen (`karriarplan` saknar JSON-instruktion i stream, fler är out-of-sync).
- **Tid:** L (1 dag)
- **Risk:** Medel — testa noga.
- **Verifiera:** Snapshot-tester (Fas D) ska upptäcka divergens.

### C2. Slå ihop `aiApi.ts` + `aiService.ts`
- **Vad:** `aiService.ts` har 0 callers idag men har retry+context-logik. Behåll `aiApi.ts` som single-entry. Migrera retry-logik från `aiService.ts`. Ta bort `userContext`-läcka (H9).
- **Tid:** L-XL (1-2 dagar)
- **Risk:** Medel — komponenter behöver migreras.

### C3. Distribuerad rate-limit på edge-vägen
- **Vad:** Byt `supabase/functions/_shared/rateLimit.ts` från in-memory Map till `check_rate_limit`-RPC (samma som Vercel). Standardisera på `ai-cv-writing`s tredje rate-limiter också.
- **Tid:** L (1 dag)
- **Risk:** Låg.
- **Verifiera:** Trigga från 2 olika edge-instanser → räknaren delas.

### C4. Daglig token-cap per användare
- **Vad:** Räkna `tokens_used` per dygn från `ai_usage_logs`, blocka om > N (förslag 50k tokens/dygn). Visa "Du har nått dagens AI-gräns" i UI.
- **Tid:** L (1 dag)
- **Risk:** Låg.
- **Vinst:** Skydd mot abuse + kostnad-tak.

### C5. Standardisera sanitizer + Zod-validering
- **Vad:** Använd `ai-cv-writing`s `[SYSTEM]/[USER_CONTENT]`-separator + control-token-strip-mönster i alla 18 prompts. Skriv Zod-scheman för `karriarplan.plan`, `kompetensgap.analys`, `intervju-simulator.resultat`, `sta-document-draft.sections`. `safeParse` på klientsidan med tydligt felmeddelande istället för tyst undefined.
- **Tid:** XL (2-3 dagar)
- **Risk:** Medel.
- **Vinst:** Skyddar mot prompt-injection (M-uppgift för gpt-oss, kritisk för Sonnet). Användare ser fel istället för `undefined`.

### C6. Retry på 5xx + Sentry-spans
- **Vad:** 1-2 retries med 2s backoff i Vercel-vägen och edge. Mät TTFT + total duration via Sentry tracing.
- **Tid:** L (1 dag)
- **Risk:** Låg.

### C7. JWT-check + rate-limit på Bolagsverket-edge
- **Vad:** Lägg till `auth.getUser(authHeader)` i `supabase/functions/bolagsverket/index.ts`. Använd `_shared/rateLimit.ts` (post-C3).
- **Tid:** S (1 h)

### C8. Rate-limit på `cv-pdf.js` (puppeteer)
- **Vad:** `checkRateLimit(supabase, user.id, 'cv-pdf')` med limit ~5/15min.
- **Tid:** S (30 min)

### C9. Migrera OAuth-endpoints till distribuerad rate-limit
- **Vad:** `api/linkedin-auth.js` + `api/google-calendar.js` använder in-memory Map. Byt till `api/_utils/rate-limiter.js`.
- **Tid:** S (1 h)

### Fas C-summa
- **Tid:** ~8 dagars arbete = 2 veckor.
- **Effekt:** AI-stack är typsäker, observerad, kostnadsbegränsad. Edge skyddad samma som Vercel. Stänger 3 MEDIUM säkerhetsfynd.

---

## Fas D – Test-grundläggning (vecka 5-6)

> **Mål:** CI validerar de viktigaste flödena. 4 kritiska services testade. Coverage-tröskel aktiv.

### D1. Aktivera authenticated E2E i CI
- **Vad:** Lägg till `TEST_USER_EMAIL`+`TEST_USER_PASSWORD` som GitHub Secrets. Skapa test-användare i prod-Supabase (eller dedikerat test-projekt). Uppdatera `.github/workflows/ci.yml` att köra alla `e2e/*.spec.ts`.
- **Tid:** M (½ dag)
- **Risk:** Låg om test-data är isolerad.
- **Verifiera:** CI kör 5 authenticated specs → grönt.

### D2. Tester för 4 otestade kritiska services
- **Vad:** Skriv tester för `userApi.ts`, `profileEnhancementsApi.ts`, `careerApi.ts` (eller minst de mest använda namespaces), `pdfExportService.ts`. Använd `aiApi.test.ts` som mall — mocka `supabase.auth.getSession` + nätverksanrop. Sikta på 60% radcoverage per fil.
- **Tid:** XL (3-5 dagar)
- **Risk:** Låg.
- **Verifiera:** `npm run test:coverage` → cov >25%.

### D3. Konsulent-E2E golden path
- **Vad:** Konvertera `e2e/sta-consultant-addparticipant.cjs` (one-shot) till `e2e/consultant.spec.ts`. Login (konsulent) → addParticipant → tilldela uppgift → följ upp.
- **Tid:** L (1 dag)

### D4. PDF-export E2E
- **Vad:** Login → CV → skapa CV → exportera PDF → verifiera nedladdning. Bygg på `e2e/cv-print-pdf.cjs`.
- **Tid:** L (1 dag)

### D5. Coverage-tröskel
- **Vad:** I `vitest.config.ts`, lägg till `coverage.thresholds: { lines: 25, functions: 35 }`. CI failas om det sjunker.
- **Tid:** XS (15 min)
- **Risk:** Ingen.

### D6. Husky + lint-staged
- **Vad:** Pre-commit grind: lint på ändrade filer, `tsc --noEmit` på kritiska paths.
- **Tid:** S (1 h)

### D7. Konsolidera `useFocusTrap`
- **Vad:** Det finns 2 implementationer — välj en, exportera, migrera 7 modaler.
- **Tid:** M (½ dag)

### D8. Snapshot-tester för CV-mallar
- **Vad:** 9 mallar (Berlin, Budapest, Chicago, …). Vitest snapshot-test med statisk CV-data → renderad HTML.
- **Tid:** L (1 dag)
- **Vinst:** Visuell regression i mallar fångas automatiskt.

### Fas D-summa
- **Tid:** ~9 dagars arbete = 2 veckor.
- **Effekt:** CI validerar 5 authenticated flöden. 4 kritiska services skyddade. Coverage-floor förhindrar regression.

---

## Fas E – Arkitektur-städning (vecka 7-8)

> **Mål:** God-objects splittas. Mock-data ut ur TS-pipelinen. Data-access-gräns etablerad.

### E1. Flytta `articleData.ts` (24 880 rader) till Supabase
- **Vad:** Skapa migration för `kb_articles`-tabell. Skriv seed-script som importerar nuvarande data. Uppdatera `contentApi.ts` att läsa från DB med React Query-cache. Behåll lazy `import('./articleData')` som fallback.
- **Tid:** XL (2-3 dagar)
- **Risk:** Medel — bredbandsmigration. Kör seed-script en gång på prod.
- **Vinst:** Babel-deopt-warning försvinner. Bundle -1.5 MB. KB blir CMS-baserad (kan editas utan deploy).

### E2. Fix `import * as LucideIcons` i contentApi + Achievements
- **Vad:** Byt till explicit ikon-map med ~30 ikoner.
- **Tid:** S (1 h)
- **Vinst:** -150 KB JS.

### E3. Bryt upp `cloudStorage.ts` (2 810 rader, 21 namespaces)
- **Vad:** Flytta varje namespace till `services/storage/<domain>Api.ts`. Behåll re-export från `cloudStorage.ts` tills callers migrerats, sen radera.
- **Tid:** XL (3 dagar)
- **Risk:** Medel — många callers.

### E4. Bryt upp `careerApi.ts` (1 150 rader, 13 namespaces)
- **Vad:** Samma mönster som E3.
- **Tid:** L (1-2 dagar)

### E5. Bryt upp `pdfExportService.ts` (1 619 rader)
- **Vad:** Till `services/pdf/{cv,coverLetter,resources}.ts`.
- **Tid:** L (1 dag)

### E6. Radera `services/api.ts` deprecation-shim
- **Vad:** 14 callers importerar från `@/services/api` istället för domän-filen. Migrera till direktimport. Sen radera shim.
- **Tid:** L (1 dag)

### E7. Parallellisera authStore.initialize()
- **Vad:** Promise.all([getUser, select profiles]). `client/src/stores/authStore.ts`.
- **Tid:** S (30 min)
- **Vinst:** -200-500 ms TTI.

### E8. Lazy-load Consultant-flikar
- **Vad:** `Consultant.tsx` importerar 6 tabbar eagerly. Lazy varje tab.
- **Tid:** M (½ dag)
- **Vinst:** -180 KB Consultant chunk.

### E9. Lazy-load Sentry-SDK bakom consent-gate
- **Vad:** `if (hasConsent) await import('./lib/sentry')`. Idag importeras Sentry statiskt även utan consent.
- **Tid:** S (1 h)
- **Vinst:** -80 KB initial JS.

### E10. Etablera data-access-regel
- **Vad:** ESLint `no-restricted-imports` för `@/lib/supabase` från `pages/**` och `components/**`. Idag är det 77 brott — migrera över tid (eller ge dispens till hooks).
- **Tid:** XL (per-fas)
- **Risk:** Hög utan plan. Föreslå att starta med soft warn → migrera 10 filer per sprint.

### E11. Service Worker — bestäm en strategi
- **Vad:** Antingen aktivera SW på riktigt (stale-while-revalidate för API) eller ta bort registreringen helt. Idag worst-of-both: SW registreras men raderas vid varje sidladdning.
- **Tid:** L-XL (1-3 dagar)
- **Risk:** Medel.

### Fas E-summa
- **Tid:** ~9-12 dagars arbete = 2 veckor.
- **Effekt:** Bundle krymper märkbart. Data-access-gräns börjar etableras. SW-fråga avgjord.

---

## Fas F – UX-städning & a11y (vecka 9-10)

> **Mål:** Tomtillstånd-kontraktet följs överallt. localStorage-skuld borta. Heading-hierarki återställd. Mobil-tester finns.

### F1. EmptyState-migration på ~50 sidor
- **Vad:** Skriv migration-script som söker `text-center.*Inga|tom` och flaggar custom tomtillstånd. Migrera Applications, Diary, MyConsultant, CommunicationTab till `<EmptyState>`. Kontrakt-koll i Fas C-snapshot-tester.
- **Tid:** XL (3 dagar)
- **Vinst:** Konsekvent UX. Färre handskrivna varianter.

### F2. localStorage → cloud-sync
- **Vad:** Mest akut: `salary/NegotiationTab.tsx` (förhandlingschecklist försvinner vid enhetsbyte). Skapa `negotiationChecklistApi`. Granska 6 onboarding-flaggor i `OverviewTab.tsx:385-453` — antingen helt cloud eller dokumentera legacy.
- **Tid:** L (1 dag)

### F3. Fix `CoverLetterStatistics.tsx:299` no-op
- **Tid:** XS

### F4. Radera "Kommer snart" i `sta/StaParticipant.tsx:1317`
- **Tid:** XS

### F5. Domain på PageLayout
- **Vad:** Settings (action), Spontaneous (activity), Consultant (bestäm policy).
- **Tid:** S (30 min)

### F6. LinkedInOptimizer fallback-strings
- **Vad:** Visa "AI ej tillgänglig just nu, här är en grundmall" istället för att låtsas vara AI-svar.
- **Tid:** S (1 h)

### F7. Hard-coded svenska labels
- **Vad:** Salary, International, PersonalBrand-tabbar, JobsokHub features → `t()`.
- **Tid:** M (½ dag)

### F8. Heading-hierarki återställd
- **Vad:** Dashboard.tsx (h3 direkt under h1), OverviewTab, PlanTab. Skriv ESLint-regel om möjligt.
- **Tid:** M (½ dag)

### F9. `aria-live` på dynamiska delar
- **Vad:** Sökresultat (JobSearch), filter-listor, onboarding-steg, widget-laddning.
- **Tid:** L (1 dag)

### F10. Verifiera Skip-link
- **Vad:** Lägg `tabIndex={-1}` på `<main>` i `Layout.tsx`. Test med skärmläsare.
- **Tid:** S (30 min)

### F11. Mobil-test-suite
- **Vad:** Skapa `playwright.config.ts` med `--project=mobile-chromium`. Konvertera screenshot-skripten (`landing-mobile.cjs`, `hubs-mobile.cjs`) till specs med assertions.
- **Tid:** XL (2 dagar)

### F12. Keyboard-only E2E
- **Vad:** Tab dig igenom landningssida + login → dashboard utan mus.
- **Tid:** L (1 dag)

### F13. Lighthouse a11y → error
- **Vad:** I CI: byt `accessibility=warn` till `error` när F1-F12 är klart.
- **Tid:** XS

### Fas F-summa
- **Tid:** ~10 dagars arbete = 2 veckor.
- **Effekt:** UX-kontrakt följs. Mobil-tester finns. WCAG-säkrare.

---

## Lågprioriterade följdåtgärder (efter 10 veckor)

| Åtgärd | Tid | Vinst |
|--------|-----|-------|
| Flytta `data/exercises.ts` till DB | XL | -5k rader bundle, CMS-baserade övningar |
| `date-fns` → `dayjs` | L | -70 KB |
| Migrera html2canvas bort (CoverLetterPDF är @react-pdf) | XL | -150 KB vendor-pdf |
| Sharp-pipeline för `public/`-bilder (webp/avif) | L | -1 MB image weight |
| Splitta i18n (route-baserade namespaces, lazy en.json) | XL | -150 KB initial JS |
| CSS code-split per route | L | -200 KB CSS |
| Prompt-versionering i DB (`ai_prompts`-tabell) | XL | Rollback utan deploy |
| `BrowserRouter` istället för `HashRouter` | XL + Vercel-config | Bättre SEO + LCP |
| PII-stripping i AI-prompts | XL | GDPR-baseline |
| `ai_usage_logs` retention (90 dagar) | S | GDPR |
| Admin-vy för token-usage | L | Synlighet |
| Snapshot-tester för fler komponenter | L | Visuell regression |
| Bredare streaming (`personligt-brev`, `cv-writing`) | XL | UX-vinst |

---

## Mätning – före/efter

### Före-baseline (2026-05-14)
| Mätare | Värde |
|--------|-------|
| LCP (jobin.se) | 7-8 s |
| Bundle (initial JS) | ~5 MB |
| ESLint errors | 1160 |
| Coverage (rader) | 20% |
| Coverage (funktioner) | 35% |
| CI auth-E2E | 0 specs |
| CRITICAL säkerhetsfynd | 1 (upload-image.js) |
| HIGH säkerhetsfynd | 1 (RLS-migration) |
| Dödkod | ~5-6k rader |
| AI kostnad/månad | (mät separat) |

### Efter Fas A (vecka 1)
| Mätare | Värde | Förändring |
|--------|-------|-----------|
| LCP | 4-5 s | **-3 s** |
| ESLint errors | 0 | -1160 |
| CRITICAL | 0 | -1 |
| AI-kostnad/månad | Ner ~40-60% | (mät) |

### Efter Fas A-F (vecka 10)
| Mätare | Mål | Förändring |
|--------|-----|-----------|
| LCP | <2,5 s | -5 s |
| Bundle (initial JS) | <2 MB | -3 MB |
| ESLint errors | 0 | (förbli) |
| Coverage (rader) | >40% | +20 pp |
| Coverage (funktioner) | >55% | +20 pp |
| CI auth-E2E | 5+ specs | +5 |
| CRITICAL + HIGH | 0 | -2 (+ andra fynd) |
| Dödkod | <500 rader | -5500 |

---

## Verifiering per fas

Varje fas ska ha en **definition of done**:

- **Fas A:** `npm run lint` 0 errors, `npm run build` lyckas, lokal LCP <5s via Lighthouse, anonym curl mot upload-image returnerar 401, Sentry-spans visar `model_used: gpt-oss-120b` även för coverLetterApi.
- **Fas B:** `npx tsc --noEmit` rent, `npm run build` lyckas, `git log --shortstat` visar -5000+ rader på branchen.
- **Fas C:** Alla 18 AI-funktioner har Zod-schema. Daglig token-cap testbar. Sentry tracing visar AI-spans. Bolagsverket-edge har JWT-check.
- **Fas D:** CI kör 5+ authenticated specs grönt. `coverage.thresholds: { lines: 25, functions: 35 }` aktiv. 4 services har >60% test-coverage.
- **Fas E:** `dist/assets/` har inga chunks >1 MB (utom vendor-pdf om puppeteer-rel.), `articleData.ts` är inte längre statisk import i contentApi.
- **Fas F:** `grep -r "text-center.*Inga\|tom.*Card" client/src/pages` ger <5 träffar (custom-empty-state baseline). Mobil-specs körs i CI. Lighthouse a11y >95.

---

## Risker & beroenden

- **Fas A6 (edge AI-modell-låsning):** Kvalitetsskillnad gpt-oss-120b vs Sonnet på cover-letter och CV-writing är okänd — kör jämförande generering på 5 cv:n innan migrering. Om kvalitet sjunker tydligt, behåll Sonnet för enstaka edge-fn men dokumentera kostnadsutfall.
- **Fas E1 (articleData → DB):** Bredbandsmigration. Kör seed-script en gång på prod efter att backup tagits. Behåll lazy fallback i 1 sprint för rollback-möjlighet.
- **Fas E10 (data-access-gräns):** 77 filer = 8+ veckors migration om man bara migrerar lite per sprint. Inte realistiskt att göra på en gång — prioriteras hub-summaries och services som har 0 tester.
- **Test-data för Fas D1:** Skapa test-användare på prod är problematiskt — överväg dedikerat staging-projekt eller ephemeral test-användare via service-role + delete efter test.

---

*Roadmap utarbetad 2026-05-14 utifrån [TECH-DEBT-AUDIT-2026-05-14.md](TECH-DEBT-AUDIT-2026-05-14.md) och de 7 underliggande rapporterna i `docs/tech-debt/`.*
