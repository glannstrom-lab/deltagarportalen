# Prestanda-audit (2026-05-14)

Sajten är live på `jobin.se`. LCP klagas på 7–8 s — det stämmer med vad bygg-output, HTML-preloaden och statiska importer visar nedan. Det här dokumentet är resultatet av en arkivanalys: build-output i `client/dist/`, källkod under `client/src/`, samt Vite-konfigurationen.

---

## TL;DR (LCP 7–8 s — vart ligger de tunga lagren?)

Den enskilt största LCP-bromsen ligger i `client/dist/index.html`. På varje sidladdning säger HTML:en:

```
<link rel="modulepreload" crossorigin href="/assets/vendor-pdf-C-yOT2Zg.js">
```

`vendor-pdf-C-yOT2Zg.js` är **2 157 289 bytes** (530 KB Brotli, 686 KB gzip). Den preloadas på *alla* sidor — även `/`, `/oversikt`, `/login`, `/landing` — innan användaren ens har sett en CV-knapp. Den är preloadad för att Rollups manualChunks-output har lagt Vites `__vitePreload`-hjälpare i `vendor-pdf`-chunken; entrypointens `import { _ as v } from './vendor-pdf-C-yOT2Zg.js'` är **statisk** och drar in hela chunken.

I praktiken laddar varje förstabesök ned 2,1 MB ren PDF/canvas-kod (jspdf + html2canvas + @react-pdf/renderer + yoga-layout-WASM-helpers) som 99% av användarna aldrig kommer att använda i sessionen. Det är hela LCP-budgeten redan där.

Lager nr 2: `contentApi-PSpxGx15.js` (1,5 MB) drar in ALLA artiklar och övningar via två `import * as LucideIcons from 'lucide-react'` och en eager-import av `articleData.ts` (24 880 rader mock-text). Lager nr 3: huvudbundlen `index.js` på 1,17 MB. Lager nr 4: i18n-resurser på 2 × 307 KB JSON laddas synkront vid uppstart. Lager nr 5: `index-C1p6oHu8.css` på 318 KB.

Sammantaget: ~5 MB JS+JSON+CSS preloadas/parsas på första rendering. På en 4G-anslutning är 7–8 s LCP exakt vad man får.

Topplistan över snabba wins (mer detalj längst ned):

| # | Åtgärd | Effekt på LCP | Insats |
|---|--------|---------------|--------|
| 1 | Bryt ut Vite-preload-hjälparen från `vendor-pdf` → eliminera modulepreload av 2,1 MB | **−2 000 ms till −3 500 ms** | 1 h |
| 2 | Ladda `articleData.ts` (1 MB+ mockdata) lazy via dynamisk import | **−400 ms till −800 ms** | 2 h |
| 3 | Ta bort `import * as LucideIcons` i `contentApi.ts` + `Achievements.tsx` | **−200 ms till −500 ms** | 1 h |
| 4 | Lazy-load i18n (`en.json` 307 KB), eller hoppa engelska om språk = sv | **−150 ms till −400 ms** | 2 h |
| 5 | Sluta avregistrera SW + radera caches vid varje sidladdning | **−100 ms till −300 ms** (varierar) | 30 min |
| 6 | Parallellisera `initialize()` i `authStore.ts` (3 sekventiella anrop) | **−200 ms till −500 ms** | 30 min |
| 7 | Konvertera kvarvarande `*.png` i `public/` (1 MB logo-jobin.png m.fl.) till webp/avif med riktiga storlekar (logon visas 36px, filen är 1 MB) | **−100 ms till −300 ms** | 1 h |
| 8 | Förbered en separat `vendor-react-pdf` chunk (skild från jspdf) — eller flytta `@react-pdf/renderer` till en lazy egen route | **bättre cache-träffrate** | 1 h |
| 9 | Splitta CSS per route — 318 KB Tailwind globalt CSS preloadas idag | **−100 ms till −300 ms** | 4 h |
| 10 | Defer Google Translate-skript fram till menyöppning (gör redan rätt nu — men preconnect till `translate.google.com` saknas; lägg dit) | **0–100 ms** | 15 min |

Realistisk LCP-prognos efter punkt 1–5: **3,5–4 s** (från ~7–8 s). Efter 1–10: **2,5–3 s**.

---

## Bundle-analys

### Manualchunks (`client/vite.config.ts`)
Konfigurationen splittar fint på pappret:

```ts
manualChunks: {
  'vendor-react':     ['react', 'react-dom'],
  'vendor-router':    ['react-router-dom'],
  'vendor-query':     ['@tanstack/react-query'],
  'vendor-state':     ['zustand'],
  'vendor-supabase':  ['@supabase/supabase-js'],
  'vendor-forms':     ['zod'],
  'vendor-pdf':       ['jspdf', 'jspdf-autotable', 'html2canvas', '@react-pdf/renderer'],
  'vendor-animation': ['framer-motion'],
}
```

Problemen är två:

**1. `vendor-pdf` blir LCP-killer trots att den endast används bakom dynamic imports.**
Filen `client/dist/index.html` har:

```html
<link rel="modulepreload" href="/assets/vendor-pdf-C-yOT2Zg.js">
```

Och `client/dist/assets/index-BS6L5O7X.js` har:

```js
import { _ as v } from "./vendor-pdf-C-yOT2Zg.js";
```

`_` är Vites `__vitePreload`-hjälpare. När `manualChunks` är aktiv flyttar Rollup hjälpfunktioner till den största chunken som behöver dem — i det här fallet `vendor-pdf`. Det gör att vendor-pdf blir en *statisk* dependency av entry-bundlen och därmed `modulepreload`:as.

Detta neutraliserar HELA poängen med att lazy-loada PDF-koden. PDF-utils används bara i:
- `CoverLetterPDF.tsx` (lazy, via `import('@/components/cover-letter/CoverLetterPDF')`)
- `pdfExportService.ts` (lazy via `import('jspdf')`)
- `staPdfExport.ts` (STATIC import av jspdf — men det här ligger bakom Sta-routen som är lazy)
- `Resources.tsx` (lazy via `await import('jspdf')`)

Lösningen: avskilja PDF-libs från Vite-helpers. Två alternativ:

```ts
// Alt A — låt Rollup fördela hjälparna automatiskt
manualChunks(id) {
  if (id.includes('/jspdf/') || id.includes('/jspdf-autotable/')) return 'vendor-jspdf'
  if (id.includes('/@react-pdf/')) return 'vendor-react-pdf'
  if (id.includes('/html2canvas/')) return 'vendor-html2canvas'
  if (id.includes('/framer-motion/')) return 'vendor-animation'
  // ...
}

// Alt B — flytta __vitePreload till en egen liten chunk
build.rollupOptions.output.experimentalMinChunkSize = 0
build.modulePreload = { polyfill: false }
```

**2. `vendor-pdf` packar fyra inkompatibla bibliotek (jspdf, html2canvas, @react-pdf/renderer) i ETT 2,1 MB-block.** När någon laddar bara CV-export drar de in @react-pdf-renderer också, och vice versa. Splitta i 3 chunks (vendor-jspdf, vendor-react-pdf, vendor-html2canvas) så cache:n också kan stabiliseras separat.

### `index-*.js` (1,17 MB) — vad ligger där?
Vid stickprov in i strängarna i `index-BS6L5O7X.js`:
- Hela `articleData.ts`-eko? Nej — det ligger i `contentApi-*.js`.
- Stora `i18n`-resurser? Ja, `sv.json` + `en.json` ligger i `index.js` (importeras synkront från `client/src/i18n/config.ts`, som importeras från `main.tsx`). Sammanlagt ~620 KB JSON, men efter minify+gzip ungefär 100 KB komprimerat.
- `lucide-react`-ikoner från ~46 platser som importerar via barrel `@/components/ui/icons`. Det är OK.
- `framer-motion` används från 38 platser — det ligger i `vendor-animation` (129 KB, bra).
- Sentry SDK + `browserTracingIntegration` + replay-integration (~80 KB).
- Hela auth-store + auth-flöde + Toast + ErrorBoundary + Layout + ALL eager-importerade pages (Login, Register, Landing — Landing-sidan är 35 KB jsx alone).

### `contentApi-*.js` (1,5 MB) — innehåller mockdata?
Ja. `contentApi.ts` har högt upp:

```ts
import { mockArticlesData, articleCategories, type EnhancedArticle, ... } from './articleData'
import { exercises as mockExercises, ... } from '@/data/exercises'
import * as LucideIcons from 'lucide-react'  // ← drar in alla 1400+ ikoner
```

- `articleData.ts` är **24 880 rader** — i praktiken hela kunskapsbasen som hårdkodad fallback-data.
- `exercises.ts` är **5 072 rader** mock-övningar.
- `import * as LucideIcons` förstör tree-shaking — alla 1400+ ikoner inkluderas så att `getIconComponent(name)` kan slå upp dem dynamiskt.

Den här chunken laddas så fort något i KnowledgeBase, Article, Exercises, Resources, Dashboard, ForYouTab, eller Hubs hänvisar till artiklar/övningar.

Allt går mot DB i `getAll()`, `getById()` osv. — men *fallback-datan importeras statiskt och är därmed alltid i bundlen*. Det är "döda" megabytes 95% av tiden. Lösning:

```ts
// Lazy fallback
async function getMockArticles() {
  const m = await import('./articleData')
  return m.mockArticlesData
}
```

Samma sak för `import * as LucideIcons` — byt till en explicit lookup-tabell över de 20–30 ikoner som faktiskt används.

### Duplikat-bibliotek?
Stickprov i `client/package.json`:
- `jspdf` + `@react-pdf/renderer` + `html2canvas` — *tre* PDF-bibliotek. `jspdf` är default för CV+STA, `@react-pdf/renderer` för personligt brev, `html2canvas` är legacy. Den nya CoverLetterPDF.tsx-implementationen ersätter html2canvas-vägen men html2canvas är fortfarande dependency.
- `date-fns` används med `format`, `differenceInDays`, `parseISO`, `addDays`, `formatDistanceToNow`, `sv`, `enGB`-locale. Det är OK men en `dayjs`-migration skulle spara ~70 KB. Inga lodash- eller moment-duplikat hittade.
- Ingen lodash i package.json. Inget moment.

`puppeteer-core` och `@sparticuz/chromium` ligger som dependencies — dessa är för serverless-funktioner (Vercel) och bör flyttas till `dependencies` på `client/api`-nivån eller `devDependencies` om de bara används där, så de inte (kan) följa med i prod-bundlar. Idag exkluderar Vite dem via tree-shaking eftersom inget i src/ importerar dem — men de står som `dependencies`, vilket är fel.

---

## Lazy-loading

### App.tsx
47 sidor `lazy()`-importeras. Eager-laddade (i App.tsx-prefixet):
- `Layout`, `Login`, `Register`, `Landing`, `Privacy`, `Terms`, `AiPolicy`, `CookieConsent`, `EnergySaveMode`, `FocusModeProvider`, `FocusExitButton`.

Detta är medvetet — Layout behövs alltid för att rendra rutten direkt, Landing för guests, Login/Register för auth.

**Problem:** `Layout.tsx` drar i sin tur in `Sidebar`, `TopBar`, `BottomBar`, `BreakReminder`, `CrisisSupport`, `NotificationBell`, `HubBottomNav`, `OnboardingFlow`, `CoachWidget`, `MobileOptimizer`, `useSettingsStore`, `useAuthStore`, `navigation.ts` — totalt 22 statiska importer. Allt detta hamnar i `index.js`. Många av dem (`OnboardingFlow`, `CrisisSupport`, `BreakReminder`) skulle kunna vara `lazy()`.

Totalt 93 `lazy()`-kallningar i kodbasen (4 ovanpå App.tsx finns i `widgets/registry.ts`, `KnowledgeBase.tsx`, `InterestGuide.tsx`, `Profile.tsx`). Det är bra. Widget-laddning är lazy-firat per widget.

### Suspense-boundaries
`<LazyRoute>` wrap:ar varje route i `Suspense + RouteErrorBoundary`. Det är korrekt — varje route har en isolerad fallback (`RouteLoadingFallback`).

### Förbättring
Tre stora pages är fortfarande tunga i sina egna chunks:
- `Consultant-Cx5Z-Xy5.js` (227 KB) — alla 6 tab-komponenter (`OverviewTab`, `ParticipantsTab`, `AnalyticsTab`, ...) importeras eagerly i `Consultant.tsx`. Borde vara `lazy()` per tab.
- `CVPage-BJhAwC91.js` (223 KB) — CV-flödet är 67 rader skal men de underliggande komponenterna (`CVForm`, `CVPreview`, `BerlinTemplate`, `AtelierTemplate`...) packas in.
- `JobSearch-B0pMEeIV.js` (158 KB) — komplex job-sök-UI med flera tabs. Samma mönster.

---

## Render-prestanda

### Dataladdning vid mount
`useDashboardData.ts` (för gamla Dashboard) gör en `Promise.all` av 15 endpoints — bra. `useOversiktHubSummary.ts` triggar 4 sibling-hub-loaders parallellt + en egen profile-fetch — bra.

`useJobsokHubSummary.ts` gör `Promise.all([cv, letters, sessions, apps, spontaneous])` — 5 parallella. Bra.

**Men:** `authStore.initialize()` (anropas i App.tsx vid mount) gör SEKVENTIELLA anrop:

```ts
const { data: { session } } = await supabase.auth.getSession()   // anrop 1
const { data: { user } } = await supabase.auth.getUser()         // anrop 2 (väntar)
const { data: profile } = await supabase.from('profiles')...     // anrop 3 (väntar)
```

`getSession()` läser bara localStorage så den är snabb, men `getUser()` är ett nätverkscall (verifierar token mot Supabase) och `select profiles` är ett till. Båda kan göras parallellt med `Promise.all([getUser, supabase.from('profiles').select('*').eq('id', session.user.id)])` — sparar ~150–300 ms TTI.

### useMemo/useCallback
`useMemo`/`useCallback` finns i 148 filer (av ~250+). Det är OK — många små komponenter behöver dem inte. Kritiska hot paths (`useAchievementTracker`, `useDashboardData`, `useJobsokHubSummary`) använder dem.

**Inget memo-läckage upptäckt** vid stickprov. `Layout.tsx` har inga inline-objekt eller tunga arrays som rendrar barn.

### Stora useState
Inga 5000-rad-state-objekt hittade. State är spread över Zustand-stores (`authStore`, `settingsStore`, `profileStore`) och React Query.

### React Query
`main.tsx` konfig:
```ts
{ retry: 1, refetchOnWindowFocus: false, staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000 }
```

Bra default. Per-hook overrides använder `staleTime: 60_000` (1 min) för hub-summaries — också rimligt.

---

## Bilder & assets

### Logo-debacle
`client/public/logo-jobin.png` är **1 075 197 bytes (1 MB)**. Den webp-konverterade versionen är 27 KB.

`<link rel="apple-touch-icon" href="/logo-jobin.png">` i HTML pekar fortfarande på PNG. Och `OptimizedImage`-komponenten har endast `loading="lazy"`-stöd, ingen automatisk PNG→WebP-fallback. Resultatet: alla iOS-användare som lägger till till hemskärm laddar 1 MB.

Stora PNG:er i `public/`:
- `logo-jobin.png`: 1 075 KB (webp: 27 KB)
- `jobin-logga.png`: 540 KB (webp: 80 KB)
- `hero-landing.png`: 492 KB (webp: 55 KB) — Landing använder webp-versionen, men PNG ligger ändå i build-output (Vite-image-optimizer kör bara över PNG som *importeras* från src, inte fristående public/).
- `logo-icon.png`: 431 KB (webp: 20 KB)
- `logo-jobin-new.png`: 145 KB (webp: 2,6 KB)
- 11 CV-templates: ~210–267 KB var (alla med .br men ingen webp). Cirka 2,5 MB sammanlagt.

`ViteImageOptimizer` är aktiverat i `vite.config.ts` men det jobbar bara på *src-importerade* bilder. `public/`-filer kopieras orörda. Skapa ett pre-build-steg som kör `sharp` över public/ och genererar `.webp` + `.avif`.

### OptimizedImage
`<OptimizedImage>` används på 11 platser. Den hanterar lazy-loading men har ingen `<picture>`-fallback för webp/avif. Logon-komponenten (`Logo.tsx`) hänvisar fortfarande till PNG-källan i flera fall.

### SVG vs PNG ikoner
Hyrglyphs: lucide-react levereras som inline SVG-komponenter. Bra. Templates ovan är PNG-previews — webp/avif skulle skära av ~70% där.

---

## Tredje-parts scripts

### Sentry
Initierad synkront i `main.tsx` (`initSentry()` före `ReactDOM.createRoot`). MEN inuti `initSentry` finns en gate: bara om cookie-consent + production. Sentry-SDK:n är dock fortfarande importerad statiskt (`import * as Sentry from '@sentry/react'`) — vilket innebär att hela Sentry-SDK:n (~80 KB) ligger i `index.js` även för användare som inte gett consent.

Förbättring:
```ts
if (hasCookieConsent && IS_PRODUCTION) {
  const { initSentry } = await import('./lib/sentry')
  initSentry()
}
```

Sentry-SDK:n flyttas då till en egen lazy chunk.

### Google Translate
Laddas dynamiskt vid menyöppning, eller om `getSelectedLanguage()` har en sparad pref. Bra. CSP tillåter `https://translate.google.com`. **Förbättring:** lägg till `<link rel="preconnect" href="https://translate.google.com">` så DNS+TLS-handskakningen är klar när användaren öppnar menyn.

### Google Calendar / LinkedIn OAuth
Båda är callbacks på dedikerade routes (`/calendar/google-callback`, `/linkedin/callback`). Lazy. Inget blockerande på första render.

### Google Fonts
`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600;700;800&family=Source+Sans+3:wght@300;400;500;600;700&display=swap">`

7 vikt-varianter över 3 fonter — alla blockerar text-render tills woff2 är nedladdat. `display=swap` mildrar det. **Förbättring:** dessa fonter används bara i CV-templates (Atelier, Manhattan, Executive). Flytta till `<link>` injektion vid CV-route — bortsett från det är default `system-ui`.

### Service Worker
**Allvarlig regress:** `index.html` (rad 42–57), `main.tsx` (rad 79–90), `App.tsx` (rad 184–191) avregistrerar ALLA service workers OCH raderar ALLA caches på varje sidladdning. Det förklaras som "Clear broken service workers" — men det betyder att caching aldrig kommer igång. Repeat visits får ingen win på SW.

Om man ändå har infrastruktur (`useServiceWorker` registrerar `/sw.js`) — välj ett. Antingen kör SW, eller ta bort den helt. Idag har du worst-of-both.

---

## Database queries

### Profil-fetch vid auth
Som ovan: sekventiella 3 anrop i `authStore.initialize()`.

### Listor
`ParticipantsTab.tsx` (konsulent ser N deltagare) — vid stickprov finns inga N+1-mönster, det är en `supabase.from('profiles').select(...)`-query med eager joins. Bra.

Men många `useEffect(() => fetchX, [])` finns spridda i hooks som inte alltid är React Query-baserade. Stickprov: `useAchievementTracker` har 14 `useMemo`/`useCallback` — den hanterar mycket lokal state.

Sammanlagt 408 useMemo/useCallback-användningar — kodbasen är medveten om memo:ering.

### Realtime-subscriptions
Inga `supabase.channel().subscribe()` hittas i hot path för hubs. Bra.

---

## Snabba wins (≤1 dag) vs långsiktiga

### Wins ≤1 dag

| # | Åtgärd | Effekt | Insats |
|---|--------|--------|--------|
| 1 | Lös vendor-pdf modulepreload: byt `manualChunks: { 'vendor-pdf': [...] }` till function-baserad allokering ELLER lägg `build.modulePreload = { polyfill: false }` och `experimentalMinChunkSize: 0`. Verifiera att `index.html` inte längre har `modulepreload` för vendor-pdf. | −2 000 ms LCP | 1 h |
| 2 | Splitta `vendor-pdf` i tre: `vendor-jspdf`, `vendor-react-pdf`, `vendor-html2canvas`. | Cache-träffrate ↑ | 1 h |
| 3 | I `contentApi.ts`: byt `import * as LucideIcons` till explicit ikon-map (~30 ikoner). | −100 KB JS, −200 ms TBT | 30 min |
| 4 | I `Achievements.tsx`: samma sak — `import * as LucideIcons`. | −50 KB | 15 min |
| 5 | I `contentApi.ts`: gör mock-fallback till dynamisk import (`async function getMockArticles() { return (await import('./articleData')).mockArticlesData }`). | −1 MB JS för 95% av users | 2 h |
| 6 | Parallellisera `getUser` + `select profiles` i `authStore.initialize()`. | −200 ms TTI | 30 min |
| 7 | Konvertera kvarvarande public/*.png till webp + uppdatera `<link rel="apple-touch-icon">`. | −1 MB on iOS | 1 h |
| 8 | Stoppa SW-unregister + cache-radering i `index.html`, `main.tsx`, `App.tsx`. Bestäm: SW eller inte SW. | Repeat-visit LCP ↓ | 30 min |
| 9 | Lazy-importera Sentry: `if (hasConsent) await import('./lib/sentry')`. | −80 KB initial JS | 1 h |
| 10 | Lägg `<link rel="preconnect" href="https://translate.google.com">`. | −50 ms när menyn öppnas | 5 min |
| 11 | Inspektera `chunkSizeWarningLimit: 500` — höj inte gränsen, fixa innehållet. | Synlig varning | — |

### Långsiktiga (1–5 dagar)

| Åtgärd | Effekt | Insats |
|--------|--------|--------|
| Splitta i18n: separera sv.json/en.json i route-baserade namespaces, lazy-importera engelska. | −150 KB initial JS | 1–2 dagar |
| Splitta CSS per route (`build.cssCodeSplit: true`). Idag är allt Tailwind i 318 KB monolithic CSS som alla laddar. | −200 KB CSS för icke-Landing | 1 dag |
| Lazy-importera Consultant-flikar i `Consultant.tsx`. | −180 KB Consultant chunk | 4 h |
| Migrera `html2canvas`-beroendet bort (CoverLetterPDF är redan @react-pdf — radera html2canvas helt). | −150 KB vendor-pdf | 2 dagar |
| Pre-build sharp-pipeline för `public/`-bilder (webp + avif). | −1 MB total image weight | 1 dag |
| Migrera `date-fns` → `dayjs` om det blir akut. | −70 KB | 1 dag |
| Service Worker offline-strategi (precache + stale-while-revalidate för API). | Repeat-visit ~80% snabbare | 3 dagar |
| Migrera till `BrowserRouter` istället för `HashRouter` (CSP + SEO + LCP — `#`-routes försenar prerender). | Indirekt | 2 dagar + Vercel-config |

---

## Verifieringsplan

För att mäta effekt rekommenderar jag:

1. Lokal: `npm run analyze` (skapar `dist/stats.html`) — visa visualizer-graf före/efter varje åtgärd.
2. Produktion: använd det redan aktiverade Sentry browserTracing — `tracesSampleRate: 0.1`, Web Vitals (LCP/INP/CLS/FCP/TTFB) skickas automatiskt. Sätt baseline NU, mät igen efter punkt 1–5.
3. Lighthouse CI på `jobin.se` (inte `deltagarportalen.se` — det är staging).

---

## Bilaga: bygg-output (2026-05-14)

```
client/dist/assets/
  vendor-pdf-C-yOT2Zg.js     2 157 289 B  (br: 530 562 B)  ← MODULEPRELOADAS
  contentApi-PSpxGx15.js     1 542 985 B  (br: 353 639 B)
  index-BS6L5O7X.js          1 175 342 B  (br: 282 316 B)
  Consultant-Cx5Z-Xy5.js       226 997 B
  CVPage-BJhAwC91.js           223 411 B
  vendor-supabase-CSTfef5T.js  172 902 B
  JobSearch-B0pMEeIV.js        158 552 B
  index.es-BVlv81RQ.js         156 085 B  (FileSaver/saveAs-relaterad)
  vendor-animation-TQ4QLjCX.js 128 998 B
  Career-C-6C7WKE.js           123 477 B
  interestGuideData-DgvTBm3h.js116 648 B
  index-MaBSOyoE.js            403 041 B  (sekundär entry — Landing?)
  index-C1p6oHu8.css           317 813 B

client/public/ (orörda av Vite):
  logo-jobin.png             1 075 197 B  (webp finns: 27 136 B)
  jobin-logga.png              540 473 B
  hero-landing.png             492 040 B
  logo-icon.png                431 253 B
  templates/*.png              ~210–267 KB × 11 ≈ 2,5 MB

client/src/i18n/locales/
  sv.json                      314 249 B
  en.json                      306 951 B
  (laddas båda synkront via main.tsx → i18n/config.ts)
```
