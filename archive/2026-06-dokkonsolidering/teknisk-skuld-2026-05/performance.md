# Teknisk skuld 2026-05 — Prestanda

**Granskning:** 2026-05-09
**Agent:** performance-engineer
**Build-mått från:** `client && npm run build` (Vite 7, terser, gzip+brotli)
**Total dist-storlek:** ~18 MB (assets-katalog ~14 MB JS+CSS, resten är publika bilder/templates)

> Sammanfattning i en rad: bundlen är acceptabelt code-splittad per route, men tre extrema "elefanter" (`vendor-pdf` 2.1 MB, `supabaseApi` 1.5 MB, huvud-`index` 1.06 MB) dominerar. Riktade åtgärder kan halvera initial JS för en inloggad användare.

---

## Bundle-sammanfattning (siffror per chunk)

### Topp 15 JS-chunks (raw / gzip)

| Rank | Chunk | Raw | Gzip | Anmärkning |
|------|-------|-----|------|-----------|
| 1 | `vendor-pdf-*.js` | 2 157 kB | 689 kB | jspdf + jspdf-autotable + html2canvas + @react-pdf/renderer i ett block. Lazy-laddad — bra. |
| 2 | `supabaseApi-*.js` | 1 544 kB | 458 kB | "God-modul" (1 835 LOC, 12 namngivna export-objekt). Importeras av 54 filer; eager-pull. |
| 3 | `index-BTqSlZuq.js` (entry) | 1 062 kB | 322 kB | App-skal: stores, kontexter, layout, hooks. Innehåller troligen död kod. |
| 4 | `index-pBxRdabz.js` | 350 kB | 98 kB | Andra entry-relaterade utility/lib-chunken. |
| 5 | `Consultant-*.js` | 219 kB | 45 kB | Konsultsidan — bara CONSULTANT/ADMIN, ändå stor. |
| 6 | `vendor-supabase-*.js` | 173 kB | 44 kB | @supabase/supabase-js. |
| 7 | `index.es-*.js` | 156 kB | 51 kB | Sannolikt jspdf-related (oklar källa, behöver visualizer-körning). |
| 8 | `JobSearch-*.js` | 152 kB | 39 kB | Söka-jobb-sidan — stor, kandidat för split. |
| 9 | `vendor-animation-*.js` | 129 kB | 41 kB | framer-motion — laddas eager via main bundle. |
| 10 | `Career-*.js` | 127 kB | 31 kB | OK — route-splittad. |
| 11 | `CVBuilder-*.js` | 121 kB | 29 kB | Lazy-laddad via CVPage. |
| 12 | `interestGuideData-*.js` | 117 kB | 22 kB | Statisk datafil — kan code-splittas. |
| 13 | `CVPage-*.js` | 97 kB | 20 kB | OK. |
| 14 | `Dashboard-*.js` | 96 kB | 21 kB | Endast aktiv när hub-flagga är av. |
| 15 | `ExternalResources-*.js` | 80 kB | 21 kB | Mestadels statisk data. |

### Initialt download-budget

För en inloggad användare som landar på `/oversikt` (HubOverview) läses följande in initialt:

```
index (entry)         ~1 062 kB raw / 322 kB gzip
index.es              ~156 kB / 51 kB
vendor-react          ~  ?? (saknas i toppen — sammanslaget eller liten)
vendor-router         ~  49 kB / 17 kB
vendor-supabase       ~ 173 kB / 44 kB
vendor-query          ~  36 kB / 11 kB
vendor-animation      ~ 129 kB / 41 kB     <-- ladda lazy
vendor-forms (zod)    ~  57 kB / 15 kB
HubOverview            ~   9 kB /  3 kB
+ index-pBxRdabz       ~ 350 kB / 98 kB
─────────────────────────────────────────
≈ 2 020 kB raw / 600 kB gzip på första render
```

**Vid ~600 kB gzip körs FCP/LCP-budgeten väldigt nära kanten på 4G/3G-mobil** (Mikaels persona-mål: LCP < 2.5 s).

### Bilder (publika)

- `hero-landing.png` 374 kB → optimerad till 53 kB webp ✅
- `logo-icon.png` 136 kB / `logo-jobin.png` 208 kB / `jobin-logga.png` 100 kB — webp-versioner finns men PNG ligger kvar
- `templates/*.png` 11 st × ~75-100 kB = ~1 MB total — laddas troligen lazy via `<CVTemplateSelector />` men ingen `width/height` ⇒ CLS-risk

---

## Topp 10 dyra dependencies

| # | Paket | Storlek (raw) | Användning | Förslag |
|---|-------|--------------|------------|---------|
| 1 | `@react-pdf/renderer` + `jspdf` + `jspdf-autotable` + `html2canvas` (vendor-pdf) | 2 157 kB | CV/cover-letter PDF-export | OK — redan dynamic import via `pdfLazyLoad.ts` och `pdfExportService.ts`. Verifiera att inget statiskt importerar från `@react-pdf/renderer` (gör det inte just nu — bra). |
| 2 | `framer-motion` (vendor-animation) | 129 kB | Animationer i nästan varje sida | **Migrera mest använda till CSS-transitions/transform.** Behåll `motion` bara där sequencing krävs. Många `<motion.div initial animate>` är lika bra som CSS. Sparar ~80-100 kB raw/30 kB gzip från initial. |
| 3 | `@supabase/supabase-js` (vendor-supabase) | 173 kB | Auth/DB | Kan inte mindre, men säkerställ att `realtime` inte importeras i onödan. Många edge-functions kunde flyttats till HTTP-anrop via fetch. |
| 4 | `lucide-react` (icons) | inbäddad | 47 filer importerar från `lucide-react` direkt, trots barrel `@/components/ui/icons` | **Eslint-regel** som tvingar import via barrel. Kontrollera att tree-shaking faktiskt funkar — Vite log skulle visa om hela paketet drogs in. |
| 5 | `zod` (vendor-forms) | 57 kB | Form-validering | OK om används brett. Annars: byt till `valibot` (~6 kB) om bara basic strings/objects. |
| 6 | `date-fns` (format-*) | ~12 kB | 4 filer | OK — använder named imports + `date-fns/locale/sv`. |
| 7 | `dompurify` (purify.es) | 23 kB | Sanitering | OK. |
| 8 | `canvas-confetti` | ~14 kB | 4 ställen (gamification-feedback) | Lazy-load endast vid celebration-triggers. |
| 9 | `docx` | i vendor-pdf? | DOC-export | Verifiera lazy. |
| 10 | `i18next` + `react-i18next` (i index) | ~30-40 kB | Översättningar | Behövs eager — accepterat. |

**Stora kodfiler från vår källa (inte deps):**
- `client/src/services/supabaseApi.ts` — **1 835 LOC, 1.5 MB raw chunk** — största enskilda källfilsproblem.
- `client/src/services/interestGuideData.ts` (117 kB raw) — RIASEC-data + occupations. Bör delas upp i en JSON-fil som hämtas vid behov.
- `client/src/data/exercises.ts` (3 400+ LOC) — om den importeras eager pullas in i Exercises chunk (~34 kB OK), men kontrollera.

---

## Lazy-loading-skuld

### Saknade lazy-imports / dödkod i App.tsx

| Fil | Status | Åtgärd |
|-----|--------|--------|
| `pages/StorageTest.tsx` | **Statiskt importerad i `App.tsx:32`, ingen Route använder den** | Ta bort import — sparar några kB från entry. |
| `pages/CVBuilder.tsx` | `lazy()` i `App.tsx:37`, men **ingen Route refererar `<CVBuilder />` direkt** — den används endast inifrån `CVPage.tsx` (statisk import där) | Ta bort den oanvända lazy-deklarationen; den lurar grep-verktyg. |
| `pages/TemplateSnapshot.tsx` | Lazy + Route ✅ | OK. |
| `components/consultant/ConsultantDashboard` | `lazy()` i `App.tsx:55`, **ingen Route använder referensen** | Ta bort den oanvända lazy-importen. |
| `components/auth/InviteHandler` | Route + lazy ✅ | OK. |

> **Mönster (CLAUDE.md, 2026-04-27):** "Lazy-import utan route = dödkod". Rensa de tre döda lazy-deklarationerna ovan. Effekten är liten i kB men viktig för att hålla App.tsx ärlig.

### Eager-imports som BORDE vara lazy

| Komponent | Var | Skäl |
|-----------|-----|------|
| `Login`, `Register`, `Landing`, `Privacy`, `Terms`, `AiPolicy` | `App.tsx:24-28` | Public routes — flera är stora (`Landing` är hero-sidan med animationer). Lazy-load alla utom `Landing` (som är root för guests). |
| `CookieConsent` | `App.tsx:29` | Visas en gång per användare; lazy efter idle. |
| `EnergySaveMode`, `FocusModeProvider` | `App.tsx:30-31` | Toggle-providers — lazy. |
| `Layout` | `App.tsx:22` | Hela inloggade skalet. Behålls eager (kan inte göras async lätt eftersom RootRoute returnerar det) — OK. |
| `MobileOptimizer`, `UpdateNotification`, `FontProvider`, `ThemeProvider`, `ConfirmDialogProvider` | `main.tsx` | Krävs för app-shell — eager OK. |

### Statisk datafil i route-chunk

- `interestGuideData.ts` (117 kB) blir inkluderat i flera route-chunks (Dashboard, InterestGuide, MatchesTab, DailyJobTab). Borde flyttas till en lazy `import()` eller en JSON-fil hämtad via fetch när Interest Guide-flödet startar.

---

## Render-prestandaproblem

### useMemo/useCallback finns, men spridd användning

- 308 `React.memo|useMemo|useCallback`-träffar i 100 tsx-filer ✅ — överlag bra.
- 159 `setInterval/setTimeout`-träffar i 113 filer ⚠️ — många av dessa är troligen i `useEffect` utan ordentlig cleanup. Stickprov rekommenderas.

### Konkreta misstankar

1. **`InterviewSimulator.tsx`** har 12 `useMemo/useCallback` — gränsfall till över-memoization. Verifiera att deps-arrays inte bryter referenslikhet varje render.
2. **`pages/dashboard/tabs/OverviewTab.tsx`** — Promise.all över 7 dataresurser. Bra idé, men kontrollera att resultatet sätts i en state utan onödiga re-renders.
3. **41 användningar av `framer-motion`** — varje `<motion.div>` är en wrapper med extra reconciliation. På Wellness/Career/PersonalBrand-sidor (där flera renders sker) kan detta märkas.

### Suspense-boundaries

- `LazyRoute` wrapparen i `App.tsx` har korrekt `<Suspense fallback={<RouteLoadingFallback />}>` ✅
- Inga sub-route Suspense på interest-guide / knowledge-base / wellness — alla tabbar är lazy men hela tab-grupperingen drar in en delad shell. OK för MVP.

---

## Datahämtningsproblem (N+1, saknad cache)

### Bra mönster

- `useJobsokHubSummary`, `useKarriarHubSummary`, `useResurserHubSummary`, `useMinVardagHubSummary`, `useOversiktHubSummary`, `useDashboardData` — använder **Promise.all** och **react-query** med `staleTime: 60_000` ✅
- `services/ai/aiAssistant.ts → gatherUserContext()` — Promise.all över 6 tabeller ✅
- `main.tsx` queryClient defaults: `staleTime: 5 min, gcTime: 10 min, retry: 1, refetchOnWindowFocus: false` ✅ — vettig konfig.

### Problem

| Fil | Problem | Förslag |
|-----|---------|---------|
| `services/notificationsService.ts:307` | **N+1**: `for (const notif of newNotifications) { await supabase.from('user_notifications').insert(...) }` | Byt till en enda `.insert(arrayOfNotifs)` — Supabase stödjer batch insert. Sparar O(N) RTT. |
| `services/profileEnhancementsApi.ts` | 5 sekventiella `supabase.from(...).select(...)` (separata await) i samma funktion | Verifiera att de inte alla körs i serie i samma flöde. Använd Promise.all om oberoende. |
| `services/ai/aiAssistant.ts` | Många `select('*')` istället för specifika kolumner | I prod: `select('id, status, ...')` minskar överföring och snabbar upp queryn. |

### Saknad react-query-användning

`useQuery|useMutation` förekommer i 28 filer (129 träffar) — men:

- `useNotifications.ts`, `hooks/useGamification.ts` använder rå `useEffect` + `supabase.from` — **migrera till useQuery för att få caching, retry och dedup.**
- 36 filer gör fortfarande `useEffect` + `.select()` direkt (`hooks/useApplications.ts`, `hooks/useDashboardData.ts` etc — flera är dock react-query-baserade).

> **Lågt hängande frukt:** Inventera de 36 filerna. Mål: 100 % av Supabase-läsande hooks via react-query för cache-dedup. Många "summary"-hooks kan dela queryKey för samma resurs.

---

## Bilder & raw img

- `OptimizedImage`-komponenten finns och stödjer `<picture>` med webp-fallback ✅
- Endast 5 filer använder rå `<img>` (Avatar, CourseCard, HubOverview, TopBar, Login.test) — acceptabelt.
- `width`/`height` på rå `<img>` saknas i flera fall — **CLS-risk**.
- Vite-image-optimizer kör i build ✅ men sparar bara 3-32 % på webp (logos kunde komprimeras hårdare).

---

## Web Vitals & mätning

- **`web-vitals`-paketet finns INTE installerat** — ingen automatisk LCP/INP/CLS-mätning i prod.
- Sentry: `tracesSampleRate: 0.1`, `replaysSessionSampleRate: 0.01` ✅ — men det fångar transactions, inte Web Vitals direkt.
- Lighthouse-CI saknas i `deploy.yml`.

> **Rekommendation:** Lägg till `web-vitals@^4` (~3 kB) och rapportera till Sentry via `Sentry.captureMessage` eller en custom endpoint. Kostar ~3 kB, ger månader av insikt.

---

## Vite/build-konfig — observationer

`client/vite.config.ts`:
- `target` ej satt → default `modules` (ES2015+) — borde sätta `target: 'es2020'` för mindre polyfills.
- `minify: 'terser'` ✅ med `pure_funcs` för `console.log/info/debug/trace`.
- `chunkSizeWarningLimit: 500` — varnade om 4 chunks (förväntat).
- `manualChunks` är välgenomtänkt (vendor-react, router, query, state, supabase, forms, pdf, animation).
- **`sourcemap: mode !== 'production'`** ✅
- Saknar `cssCodeSplit` explicit (default `true` för MPA, men vi är SPA — verifiera).

---

## Konkreta åtgärder med uppskattat KB/ms-vinst

Sorterat efter ROI (vinst ÷ ansträngning):

### Snabba vinster (1-2 h arbete vardera)

| # | Åtgärd | Filer | Förväntad vinst |
|---|--------|-------|-----------------|
| 1 | **Ta bort dödkod**: `StorageTest`, `CVBuilder` (lazy i App.tsx), `ConsultantDashboard` (lazy i App.tsx) | `App.tsx` | -3-5 kB initial JS |
| 2 | **Lazy-load Login/Register/Privacy/Terms/AiPolicy** | `App.tsx:24-28` | -10-15 kB initial |
| 3 | **Batch insert i notificationsService** (N+1 → 1) | `services/notificationsService.ts:307` | -O(N) RTT på notifikationsskapande |
| 4 | **`width`/`height` på rå `<img>`** | 5 filer | CLS bättre, mätbar i fältdata |
| 5 | **Lägg till web-vitals + rapportering till Sentry** | ny: `lib/webVitals.ts` | +3 kB, men ger fältdata |
| 6 | **ESLint-regel som blockerar `lucide-react` direkt-import** (tvinga via `@/components/ui/icons`) | `eslint.config.js` | Garanterar tree-shaking, ~5-15 kB försäkring |

### Medelstora insatser (1 dag vardera)

| # | Åtgärd | Filer | Förväntad vinst |
|---|--------|-------|-----------------|
| 7 | **Splittra `services/supabaseApi.ts`** i `authApi.ts`, `cvApi.ts`, `coverLetterApi.ts`, `userApi.ts`, `jobsApi.ts`. Type-only-importer kan ligga i en separat `types.ts`. | 1 835 LOC fil | Förmodligen -200-400 kB raw/-60-120 kB gzip på initial JS, eftersom typimporter inte längre drar in värde-koden. |
| 8 | **Flytta `interestGuideData.ts` (117 kB) till JSON + lazy fetch** | `services/interestGuideData.ts` | -115 kB raw från Dashboard/JobSearch/Career chunks. |
| 9 | **Lazy-load `framer-motion`** för icke-kritiska sidor: Wellness, Career, PersonalBrand, ExternalResources animeras med CSS istället | 41 filer | -80-100 kB raw / -30 kB gzip från initial. |
| 10 | **Migrera `useNotifications`, `useGamification` till react-query** | 2 hooks | Färre re-renders, automatisk dedup, mindre Supabase-tryck. |
| 11 | **Sätt `target: 'es2020'`** i `vite.config.ts` `build.target` | `vite.config.ts` | -5-10 % på modern browsers (mindre polyfills). |
| 12 | **Lazy-load `canvas-confetti`** vid faktisk celebration-trigger | 4 filer | -10-14 kB raw från Dashboard/widgets-chunks. |

### Större projekt (3-5 dagar)

| # | Åtgärd | Förväntad vinst |
|---|--------|-----------------|
| 13 | **Audit av eager-användning av framer-motion**: ersätt enkla fade/slide med `animate-in fade-in slide-in-from-bottom-2` (Tailwind) eller pure CSS keyframes. | -100 kB+ raw från initial bundle. |
| 14 | **Inventera + ta bort död `useEffect+supabase.from`-kod**, migrera resterande 36 filer till react-query. | Snabbare TTI, färre racekonditioner, bättre offline-stöd. |
| 15 | **Route-aware preloading**: använd `<link rel="modulepreload">` för nästa troliga sida (t.ex. preload `JobsokHub` när användaren landar på `oversikt`). | -200-500 ms på navigation. |
| 16 | **`@react-pdf/renderer` är 2 MB** — utvärdera om alla 4 PDF-mallar verkligen behöver renderas via React-PDF, eller om enklare html2pdf räcker för 80 % av fallen. | Stor — kunde halvera vendor-pdf chunk. |

---

## Sammanfattning: var ligger störst smärta?

**Topp 3 dyra problem:**

1. **`supabaseApi.ts` är en 1.5 MB god-modul** som dras in via 54 filer. Splittra på domän → halverar troligen initial JS (åtgärd #7).
2. **`framer-motion` laddas eager (129 kB)** trots att 41 av 100+ användningar är trivial fade/slide som kan ersättas med CSS (åtgärd #9, #13).
3. **Ingen Web Vitals-mätning i prod** — vi vet inte ens om LCP/INP/CLS hålls. Måste införas innan vi optimerar blint (åtgärd #5).

**Lågt hängande frukt (bör fixas direkt):** dödkod (#1), lazy public pages (#2), N+1 notifikationer (#3), web-vitals (#5), ESLint-regel mot direct lucide-import (#6). Sammanlagt ~30-50 kB initial JS sparat och bättre observability — på en eftermiddags arbete.

