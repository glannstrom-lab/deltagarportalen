# Prestandagranskning — Jobin/Deltagarportalen

**Datum:** 2026-08-04 · **Granskare:** performance-agent · **Metod:** mätt, inte gissat.

## Mätuppställning

| Sak | Värde |
|---|---|
| Bygge | `cd client && npm run build` (produktionsläge, terser, `sourcemap: false`) |
| Server | `npx vite preview --port 4173` — **produktionsbygge**, inte dev-servern |
| Webbläsare | Playwright Chromium (`node_modules/@playwright/test`) |
| CWV-metod | `PerformanceObserver` (`largest-contentful-paint`, `layout-shift`, `longtask`) + Navigation Timing. **Kall context per körning**, 3 körningar/sida, **median** rapporteras |
| Desktopviewport | 1440×900, obegränsat nät (isolerar bundle/JS från nätet) |
| Mobil/nät-emulering | CDP `Network.emulateNetworkConditions` 400 kb/s, 400 ms RTT + `Emulation.setCPUThrottlingRate` 4×, viewport 390×844 |
| Komprimering | `zlib.gzipSync(level 9)` / `zlib.brotliCompressSync(quality 11)` över `dist/` — **brotli är sanningen över nätet** (I1:s lärdom) |
| Konto | `.env.test.local`, prod-databas. Endast läsning/navigering — inget skapat eller raderat |

**Vad jag inte kunnat mäta** (redovisas hellre än gissas):
- **Fältdata (RUM/CrUX)** finns inte — allt nedan är labbmätning från en utvecklardator mot `localhost`. **TTFB (3–6 ms) är därför meningslöst som prod-tal** och säger bara att preview-servern är lokal. Vercels edge-TTFB är inte mätt.
- **INP** går inte att mäta utan riktig interaktion; jag rapporterar **TBT som proxy**, vilket är vad Lighthouse gör i labb.
- **Fontfilerna** (`fonts.gstatic.com/*.woff2`) laddades inte ned i headless-körningen — bara CSS:en (24,9 kB). Fontviktens faktiska kostnad är alltså **inte** mätt, bara att CSS-requesten är renderblockerande.
- `lighthouse` kördes inte — PerformanceObserver ger samma primärtal med kontroll över antal körningar och kall cache.

---

# Fynd

## P1 — Hela jsPDF (401 kB) laddas på varje sidladdning, inklusive den publika landningen

- **ID:** P1 · **Allvarlighet:** KRITISK · **Storlek:** S (konfigändring + verifiering)

**Mätvärde (före):** `vendor-jspdf-Cc0Oa4Bo.js` = **401,3 kB rå / 127,8 kB gzip / 107,1 kB brotli**. Den laddas ned på **den utloggade landningssidan** — verifierat med `page.on('response')`, kall cache:

```
=== JS-chunkar på PUBLIKA LANDNINGEN (utloggad, kall cache) ===
    524.8 kB  index-XP6-YMMk.js
    401.3 kB  vendor-jspdf-Cc0Oa4Bo.js     <-- ingen PDF genereras någonsin här
    187.0 kB  vendor-react-BtoxWAtw.js
    168.8 kB  vendor-supabase-CSTfef5T.js
     38.9 kB  Landing-B3WinqIr.js
    ...
  SUMMA JS: 1399.8 kB rå (12 chunkar)
```

**Orsak — bevisad, inte antagen.** Entry-chunken importerar **exakt en symbol** ur jsPDF-chunken:

```js
// dist/assets/index-XP6-YMMk.js, första raden:
import{_ as e}from"./vendor-jspdf-Cc0Oa4Bo.js";
// dist/assets/vendor-jspdf-Cc0Oa4Bo.js exporterar:
export{n as _,r as a,Fa as b,Ei as j}
// ...och filen inleds med Vites modulepreload-helper:
const t=function(){...document.createElement("link").relList...}()
```

`_` är Vites `__vitePreload`-helper (~700 byte). Rollup har lagt helpern i jsPDF-chunken, och eftersom entry gör dynamiska importer behöver den helpern → **statisk import av hela 401 kB-chunken**. Statisk ESM-import betyder att modulen både hämtas *och evalueras*.

**Detta är den bugg som `vite.config.ts` påstår sig ha löst.** Kommentaren i konfigen säger att function-form av `manualChunks` "undviker detta" och att `modulePreload: false` fixar det. Mätningen visar att ingetdera stämmer: `modulePreload: false` tog bara bort `<link rel="modulepreload">`-taggen. Den statiska importen finns kvar — och utan preload-hinten är det nu **sämre**, eftersom chunken hämtas sekventiellt *efter* att entry parsats i stället för parallellt.

Statisk importgraf från entry (mitt skript `graph.cjs`):

| eager chunk | rå kB | brotli kB |
|---|---:|---:|
| index-XP6-YMMk.js | 524,8 | 135,0 |
| **vendor-jspdf-Cc0Oa4Bo.js** | **401,3** | **107,1** |
| vendor-react-BtoxWAtw.js | 187,0 | 50,3 |
| vendor-supabase-CSTfef5T.js | 168,8 | 36,8 |
| vendor-router-hWhl3LKQ.js | 37,0 | 11,8 |
| vendor-query-BakbwGcJ.js | 34,4 | 9,2 |
| vendor-state-BLvTx9ZA.js | 6,5 | 2,6 |
| **EAGER TOTALT** | **1 359,8** | **352,8** |

**Förväntad vinst:** −107,1 kB brotli (**−30 % av all eager JS**) på varje kall sidladdning i hela portalen. Vid 400 kb/s ≈ **−2,1 s**. Plus bortfall av jsPDF:s modulevaluering (fonttabeller byggs vid import) — en del av de 334 ms TBT som landningen har vid 4× CPU.

**Åtgärd:** Se till att `__vitePreload` inte bor i en tung vendor-chunk. Enklaste vägen: ta bort `jspdf`/`jspdf-autotable` ur `manualChunks` och låt Rollup auto-chunka dem, alternativt återaktivera `modulePreload` (default) så Vite lägger helpern i entry. **Verifiera efteråt** — antagandet i konfigkommentaren höll inte, så gissa inte igen: kör importgraf-kontrollen och kontrollera att `vendor-jspdf` *inte* finns i eager-listan.

**Rekommenderad grind (billig, fångar regressionen permanent):** ett skript som traverserar `dist/index.html` → statiska importer och failar om eager brotli-summan överstiger ett fryst tak. Samma mönster som de sju befintliga CI-grindarna. Utan grind kommer det tillbaka — det har redan kommit tillbaka en gång.

---

## P2 — Översikt gör 13 identiska `profiles`-anrop och 8 `auth/v1/user` per sidladdning

- **ID:** P2 · **Allvarlighet:** KRITISK · **Storlek:** M

**Mätvärde (före):** `/#/oversikt` = **43 Supabase-requests**, varav **21 är rena dubbletter** (49 % slöseri). Fångat med patchad `window.fetch` + stack traces:

```
=== 13× /rest/v1/profiles?select=*&id=eq.5b0904ac-...
   tider (ms): 367, 1319, 1320, 1320, 1321, 1321, 1412, 1412, 1413, 1414, 1415, 1415, 1417
=== 8× /auth/v1/user
   tider (ms): 204, 861, 951, 1024, 1108, 1185, 1254, 1321
```

**Orsak — spårad till källan.** `useAuth()` i `client/src/hooks/useSupabase.ts` är **inte** React Query, utan rå `useState`/`useEffect`:

```ts
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  useEffect(() => {
    getCurrentUser().then(user => {            // 1 nätverksanrop: /auth/v1/user
      if (user) getProfile(user.id).then(...)  // 1 nätverksanrop: profiles?select=*
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data } = await getProfile(session.user.id)  // ETT TILL per auth-event
        }
      })
  }, [])
}
```

Varje komponent som anropar `useAuth()` får **egen** state och **egna** anrop — ingen delning, ingen cache. Sex hooks anropar den:

`useJobsokHubSummary`, `useKarriarHubSummary`, `useMinVardagHubSummary`, `useResurserHubSummary`, `useOversiktHubSummary`, `useOnboardedHubsTracking`

Och `useOversiktHubSummary` monterar de fyra syskonhookarna med flit (raderna 82–86) för att "React Query dedupliceras". **React Query dedupliceras mycket riktigt — men `useAuth` ligger utanför React Query, så just den vägen dedupliceras inte.** Räkningen stämmer exakt: 6 × 2 profiles + 1 från `authStore.initialize()` = **13**; 6 × 1 + 1–2 auth-anrop = **7–8**. Mätt: 13 och 8.

Notera också att `authStore` **redan har** `user` och `profile` i minnet (`authStore.initialize()` hämtar dem på rad 176) — de sex hookarna hämtar om exakt samma rad.

**Ytterligare:** anropen använder `select('*')` på `profiles`, vilket spår E3/E11 redan städat på andra ställen.

**Förväntad vinst:** 43 → ~22 Supabase-requests på Översikt (−49 %). Vid 400 ms RTT ligger merparten av de 13 i två burstar (~1320 ms och ~1415 ms) och belastar samma HTTP/2-anslutning; på mobilnät är det direkt mätbar fördröjning till dess hubben har data. Samma vinst i mindre skala på alla fem hubbar (se tabellen — 6–8 dubbletter var).

**Åtgärd:** Låt `useAuth()` läsa `authStore` (som redan äger `user` + `profile`) i stället för att hämta själv. Om en fetch ändå behövs — gör den till en `useQuery` med delad nyckel. **Varning enligt lärdomen 2026-07-27 (delad cache-nyckel):** en nyckel = en form = en ägare. `useProfileStatus.ts` har dessutom **noll konsumenter** — dödkod, raderingskandidat i samma svep.

---

## P3 — CV-sidan skickar 910 kB miniatyrbilder, 6,2× för stora

- **ID:** P3 · **Allvarlighet:** HÖG · **Storlek:** S

**Mätvärde (före):** `/#/cv` = **1 503 kB transfer**, varav **910 kB bilder** — mot 529–691 kB på alla andra sidor. Mätt i webbläsaren efter scroll till botten:

```
/#/cv
  DOM-noder 634, transfer 1503 kB (bilder 910 kB, 15 img)
  ÖVERSTOR BILD sidebar.png:   naturlig 1588x2246, visas 256x256 → 6.2× för stor
  ÖVERSTOR BILD centered.png:  naturlig 1588x2246, visas 256x256 → 6.2× för stor
  (samma för minimal, creative, executive, nordic, budapest, chicago, atelier, manhattan, rotterdam)
```

Elva PNG:er i `client/public/templates/` är **1588×2246 px** (fullt CV-ark) men renderas som `w-full h-64 object-cover` ≈ 256×256 CSS-px i mallväljaren (`CVBuilder.tsx` rad 626–631). `ViteImageOptimizer` pressar dem från 2,5 MB till 903 kB i `dist/` — men **komprimering löser inte fel dimension**.

Källa vs. dist:

| | rå i `public/` | efter ViteImageOptimizer i `dist/` |
|---|---:|---:|
| 11 mall-PNG:er | 2 464 kB | 903 kB |

`loading="lazy"` finns redan på taggen, så bara det som scrollas fram hämtas — men mallväljaren *är* sidans huvudinnehåll, så i praktiken hämtas alla.

**Förväntad vinst:** vid 512×724 WebP (2× av visad storlek, retina-säkert) landar 11 bilder på uppskattningsvis 60–110 kB totalt i stället för 903 kB → **−800 kB på CV-sidan**, ca −55 % av sidans totala transfer. Vid 400 kb/s ≈ **−16 s** för den som scrollar igenom mallväljaren.

**Åtgärd:** generera om miniatyrerna i rätt storlek och WebP. Genereringsskriptet finns redan: `node e2e/cv-template-snapshots.cjs` (refererat i `CVBuilder.tsx` rad 59–60) — sätt ned utdataupplösningen där. Lägg `width`/`height` på `<img>` samtidigt; se P6 (CLS).

**Sekundärt (samma klass, mindre):** hub-ikoner och hjältebilder är 3,2–4,9× för stora — `hero-oversikt.webp` 929×705 visas 190×144; `icon-hub-*.webp` 128 px visas 32 px; `logo-icon.svg` är SVG (ofarligt). Totalt 58 kB bilder på `/#/jobb`. Låg prioritet jämfört med CV-sidan.

---

## P4 — Målgruppens verklighet: 13–14 s till LCP, upp till 21 s till meningsfullt innehåll

- **ID:** P4 · **Allvarlighet:** HÖG (sammanfattar P1–P3) · **Storlek:** — (åtgärdas via P1/P2/P3)

**Mätvärde (före):** 400 kb/s, 400 ms RTT, 4× CPU-throttling, mobil viewport 390×844, 3 körningar, median. "Meningsfullt innehåll" = tid tills sidans `h1` är synlig.

| sida | FCP | LCP | meningsfullt innehåll | körningar | transfer |
|---|---:|---:|---:|---|---:|
| landning | 3 136 ms | 13 760 ms | **13 847 ms** | 13847/14186/13310 | 518 kB |
| oversikt | 3 048 ms | 13 312 ms | **16 102 ms** | 16184/16032/16102 | 601 kB |
| cv | 3 188 ms | 13 940 ms | **19 480 ms** | 19480/19608/19105 | 601 kB |
| job-search | 3 040 ms | 13 340 ms | **20 649 ms** | 20649/21014/20618 | 691 kB |

Spridningen mellan körningar är liten (±3 %) — talen är stabila, inte brus.

LCP-målet i ROADMAP D6 är **< 2 500 ms**. På den här profilen missas det med **5–6×**. Notera att LCP är närmast konstant 13,3–13,9 s oavsett sida: **det är den eagera JS-bundlen som sätter golvet**, inte sidans eget innehåll. Därför är P1 (−107 kB brotli av 353 kB eager) den enskilt största hävstången här.

CV-sidans 601 kB i den här tabellen är lägre än desktopmätningens 1 503 kB eftersom mobil viewport + `loading="lazy"` gör att mallbilderna inte hämtas förrän man scrollar — men de kommer, och då kostar de (P3).

---

## P5 — TBT 1,5–1,7 s på CV och Jobbsökning vid 4× CPU

- **ID:** P5 · **Allvarlighet:** MEDEL · **Storlek:** M

**Mätvärde (före):** 4× CPU-throttling, obegränsat nät (isolerar CPU från nätet), 3 körningar, median:

| sida | TBT (median) | long tasks >50 ms | längsta task | alla körningar |
|---|---:|---:|---:|---|
| / (landning) | 334 ms | 2 | 227 ms | 339/273/334 |
| /#/oversikt | 322 ms | 5 | 169 ms | 378/322/294 |
| /#/exercises | 512 ms | 6 | 258 ms | 488/512/569 |
| /#/job-search | **1 651 ms** | 11 | 646 ms | 362/**1651**/3079 |
| /#/cv | **1 484 ms** | 10 | 515 ms | 1723/1484/**231** |

**Ärlig reservation:** `job-search` och `cv` har **mycket stor spridning** (362→3079 ms respektive 231→1723 ms). Medianen är därför osäker för just dessa två — sannolikt beror variationen på om asynkron data hinner fram inom mätfönstret. De övriga tre sidorna är stabila. Jag har **inte** rotorsakat spridningen; det kräver en profileringskörning med `Profiler`-trace, vilket inte gjordes.

På obegränsad CPU (desktop) är TBT 0–41 ms på samtliga tio sidor — **CPU är alltså inte ett problem på modern hårdvara, bara på svag**. Det är precis målgruppens situation, så det är värt att åtgärda, men efter P1–P3.

---

## P6 — CLS 0,079 på CV-sidan (bilder utan dimensioner)

- **ID:** P6 · **Allvarlighet:** LÅG · **Storlek:** S

**Mätvärde (före):** CLS median över 3 körningar, desktop:

| sida | CLS |
|---|---:|
| cv | **0,079** |
| job-search | 0,0346 |
| externa-resurser | 0,0338 |
| applications | 0,0039 |
| övriga sex | ≤ 0,0012 |

Alla ligger **under** Googles gräns 0,1, så inget är rött. CV-sidans 0,079 är dock nära, och orsaken är sannolikt densamma som P3: `<img>` utan `width`/`height` som reserverar plats innan bilden laddats. Åtgärdas gratis när P3 görs — sätt explicita dimensioner eller `aspect-ratio` på mallminiatyrerna.

---

## P7 — Ingen virtualisering i kodbasen; störst lista är 283 `<option>`

- **ID:** P7 · **Allvarlighet:** LÅG (idag) · **Storlek:** L om det ska byggas

**Mätvärde (före):** sökning efter `react-window|react-virtual|virtualiz|useVirtual` i `client/src` och `package.json` ger **noll träffar** — ingen virtualisering finns. Uppmätta DOM-storlekar efter full scroll:

| sida | DOM-noder | djup | längsta lista | heap |
|---|---:|---:|---|---:|
| /#/job-search | 2 158 | 19 | **283 syskon** — `SELECT > OPTION` | 14 MB |
| /#/exercises | 2 713 | 16 | **119 syskon** — `DIV.grid > DIV` | 14 MB |
| /#/externa-resurser | 645 | 17 | 35 syskon — `DIV.space-y-4 > DIV` | 10 MB |
| /#/cv | 634 | 20 | (inget över 15) | 11 MB |
| /#/oversikt | 339 | 16 | (inget över 15) | 12 MB |

**Slutsats: premissen "långa listor utan virtualisering" håller inte som prestandaproblem idag.** Ingen sida passerar 3 000 DOM-noder (Lighthouse varnar först vid ~1 400 noder totalt och ~60 barn i en enskild container). De 283 `<option>` är en **native `<select>`** — den renderas av operativsystemet, inte av React, och är billig. `exercises` 119 kort är den enda listan som skulle vinna på virtualisering, och den bidrar med 53 ms long task.

**Åtgärd:** bygg **inte** virtualisering nu. Det är fel investering jämfört med P1–P3. Ompröva om en lista passerar ~300 React-renderade element.

---

## P8 — `pako` finns i tre chunkar (E6:s observation står sig)

- **ID:** P8 · **Allvarlighet:** LÅG · **Storlek:** M

**Mätvärde (före):** signatursökning över `dist/assets/*.js`:

```
pako:      3 chunkar — index-MaBSOyoE.js (394kB), vendor-jspdf (401kB), vendor-react-pdf (1510kB)
dompurify: 2 chunkar — purify.es-Dzog_Ni9.js (28kB), vendor-jspdf (401kB)
date-fns:  1 chunk   — index-XP6-YMMk.js (525kB)   [ingen dubblett]
```

E6 (2026-07-10) noterade "3× pako-kopior" — det stämmer fortfarande.

**Men premissen om att det är brådskande håller inte:** alla tre bärarna är **lazy**. `vendor-react-pdf` har en statisk importör (`CoverLetterPDF`) och en dynamisk (`pdfExportService`); `index-MaBSOyoE.js` (394 kB) visade sig vid inspektion vara **`docx`** (signaturer `prepForXml`, `rsidRPr`, `xmlKeys` + JSZip) och importeras dynamiskt av endast `CVPage` och `Resources`. Ingen av dem ligger i eager-grafen. Kostnaden drabbar alltså bara den som faktiskt exporterar ett dokument.

**Åtgärd:** låt ligga tills P1–P3 är gjorda. Dedupliceringen är verklig men betalar sig bara på exportvägarna.

---

## P9 — Google Fonts-CSS är renderblockerande på kritisk väg

- **ID:** P9 · **Allvarlighet:** LÅG–MEDEL (ej fullt mätt) · **Storlek:** S

**Mätvärde (före):** `client/index.html` rad 37 laddar en synkron extern stylesheet:

```html
<link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;500;600;700
  &family=Playfair+Display:wght@400;600;700;800
  &family=Source+Sans+3:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

Uppmätt: **24,9 kB CSS, 1 request** — 3 familjer × 14 viktvarianter. `preconnect` till båda värdarna finns (rad 32–33), vilket är rätt, och `display=swap` förhindrar osynlig text.

**Vad jag inte kunnat verifiera:** fontfilerna från `fonts.gstatic.com` laddades inte i headless-körningen, så **den faktiska fontviktens kostnad i kB är inte mätt**. Jag har inte heller verifierat om alla 14 vikterna används — det kräver en genomgång av Tailwind-konfig + faktiska `font-weight`-anrop som jag inte gjorde.

**Varför det ändå är värt en rad:** en renderblockerande extern stylesheet kostar minst 1 extra RTT innan render kan börja. Vid uppmätta 400 ms RTT är det ≥ 400 ms rakt på FCP (som ligger på 3,0–3,2 s i den emulerade profilen).

**Åtgärd:** verifiera först vilka vikter som faktiskt används och beskär listan; överväg självhostade woff2 med `preload` för de 2–3 vikter som syns i första render. **Mät före och efter** — jag har inte belagt vinsten.

---

# Tabell 1 — chunkar × rå × gzip × brotli

De 15 största (av 238 JS/CSS-filer). `dist/` efter `npm run build`.

| # | chunk | rå kB | gzip kB | **brotli kB** | laddas |
|---:|---|---:|---:|---:|---|
| 1 | vendor-react-pdf | 1 510,0 | 497,7 | **383,2** | lazy (PDF-export) |
| 2 | contentApi | 995,8 | 317,7 | **241,5** | lazy (artiklar/övningar) |
| 3 | **index (entry)** | 524,8 | 164,2 | **135,0** | **EAGER** |
| 4 | **vendor-jspdf** | 401,3 | 127,8 | **107,1** | **EAGER — P1, ska vara lazy** |
| 5 | index (=`docx`) | 393,6 | 110,8 | **93,8** | lazy (CVPage, Resources) |
| 6 | en (locale) | 285,3 | 93,7 | **75,6** | lazy (bara vid engelska) |
| 7 | index CSS | 283,7 | 37,4 | **28,2** | EAGER (global Tailwind) |
| 8 | sentry | 254,8 | 82,1 | **71,0** | lazy (dyn. import från entry) |
| 9 | CVPage | 220,7 | 49,3 | **40,8** | lazy |
| 10 | vendor-html2canvas | 194,4 | 44,6 | **36,3** | lazy (via jspdf) |
| 11 | **vendor-react** | 187,0 | 58,5 | **50,3** | **EAGER** |
| 12 | StaParticipant | 173,9 | 43,0 | **35,7** | lazy (STA avaktiverad) |
| 13 | **vendor-supabase** | 168,8 | 43,2 | **36,8** | **EAGER** |
| 14 | JobSearch | 164,7 | 41,8 | **35,1** | lazy |
| 15 | index.es | 152,4 | 49,6 | **43,5** | lazy (via jspdf) |
| | **TOTALT (238 filer)** | **8 734,6** | **2 503,0** | **2 069,7** | |
| | **varav EAGER JS** | **1 359,8** | — | **352,8** | |
| | **EAGER JS efter P1** | **958,5** | — | **245,7** | **−30 %** |

**Tunga bibliotek som laddas i entry men bara behövs på en sida:** exakt ett — `jspdf` (P1). Kontrollerat och **friat**: `xlsx` (finns inte i bygget alls), `@react-pdf/renderer` (lazy), `html2canvas` (lazy, via jspdf), `docx` (lazy), `framer-motion` (`vendor-animation` 125,9 kB rå / 35,9 kB brotli — **inte** i eager-grafen; 18 statiska importörer men samtliga i lazy-laddade sidchunkar), `canvas-confetti` (lazy), `sentry` (dynamisk import från entry). Manual-chunkningen fungerar alltså som avsett för allt utom jsPDF, och där är felet helpern — inte konfigurationens intention.

---

# Tabell 2 — sida × LCP × CLS × requests

Desktop 1440×900, obegränsat nät, kall context, 3 körningar, median. **TTFB är lokal preview-server — säger inget om prod.**

| sida | LCP | FCP | CLS | TBT | TTFB | requests | Supabase-anrop | **dubbletter** | transfer |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| landing (publik) | 696 | 144 | 0 | 41 | 6 | 17 | 0 | 0 | 518 kB |
| **oversikt** | 1 260 | 124 | 0 | 6 | 5 | **80** | **43** | **21** | 601 kB |
| jobb | 1 140 | 104 | 0,0012 | 0 | 4 | 55 | 17 | 7 | 599 kB |
| karriar | 1 168 | 104 | 0 | 0 | 4 | 51 | 14 | 6 | 606 kB |
| resurser | 1 144 | 100 | 0,0012 | 0 | 4 | 52 | 15 | 6 | 608 kB |
| min-vardag | 1 144 | 108 | 0,0003 | 0 | 4 | 67 | 21 | 8 | 631 kB |
| **cv** | 1 168 | 100 | **0,079** | 1 | 4 | 83 | 8 | 2 | **1 503 kB** |
| applications | 1 012 | 108 | 0,0039 | 0 | 3 | 64 | 14 | 5 | 540 kB |
| externa-resurser | 1 068 | 104 | 0,0338 | 1 | 3 | 48 | 4 | 0 | 529 kB |
| job-search | 1 076 | 120 | 0,0346 | 10 | 5 | 84 | 10 | 3 | 691 kB |

---

# Tabell 3 — sekventiella kedjor och dubbletter per sida

Dubblett = identisk `method + path + query` två eller fler gånger under **samma** sidladdning.

| sida | dubbletter | vad som dubbleras |
|---|---:|---|
| **oversikt** | **21** | 13× `profiles?select=*`, 8× `auth/v1/user`, 2× `cvs?select=id,updated_at`, 2× `cover_letters?select=id,title,created_at` |
| min-vardag | 8 | 5× `profiles?select=*`, 5× `auth/v1/user` |
| jobb | 7 | 5× `profiles?select=*`, 4× `auth/v1/user` |
| karriar | 6 | 5× `profiles?select=*`, 3× `auth/v1/user` |
| resurser | 6 | 5× `profiles?select=*`, 3× `auth/v1/user` |
| applications | 5 | 6× `auth/v1/user` |
| job-search | 3 | 4× `auth/v1/user` |
| cv | 2 | 3× `auth/v1/user` |
| externa-resurser | 0 | — |
| landing | 0 | — (utloggad) |

**Sekventiell kedja — mätt via requesttidsstämplar på Översikt:**

```
204 ms   auth/v1/user            (authStore.initialize → getSession → getUser)
367 ms   profiles?select=*       (väntar på session från steg 1)
539 ms   profiles?select=first_name,...   (TopBar — egen fetch, väntar på authStore)
861-1321 ms  7× auth/v1/user     (de sex useAuth-instanserna, seriellt utspridda)
1319-1321 ms 6× profiles?select=*   (burst 1: useAuth initial-fetch)
1412-1417 ms 7× profiles?select=*   (burst 2: useAuth onAuthStateChange)
1411-1416 ms  hub-loaders (cvs, cover_letters, mood_logs, diary_entries, ...)
```

Kedjan är **tre led djup** innan hubbdatan ens börjar hämtas: `getSession` → `getUser` → `profiles` → hub-loaders. Först vid ~1 400 ms börjar de anrop som faktiskt fyller sidan. **P2 kortar av de två mellersta leden.**

**React Query fungerar där den används.** `useOversiktHubSummary` dedupliceras korrekt via query-nycklar — problemet är att `useAuth` ligger *utanför* React Query. Ett undantag finns dock:

**`cvs` och `cover_letters` hämtas 2× med identiskt select men olika query-nycklar** — `useJobsokHubSummary.ts:61` och `useResurserHubSummary.ts:31` hämtar samma tre senaste personliga brev och samma CV-lista under var sin nyckel. Det är samma familj som lärdomen 2026-07-27 om delade cache-nycklar, fast spegelvänd: **samma data under två nycklar** i stället för två former under en nyckel. Låg kostnad (2 requests) men fixas billigt genom att den ena läser den andras nyckel.

---

# Prioriterad åtgärdslista

| # | Åtgärd | Vinst (mätt/uppskattad) | Storlek | Risk |
|---|---|---|---|---|
| **1** | **P1** — flytta `__vitePreload` ur jsPDF-chunken | **−107 kB brotli på varje kall sidladdning i hela portalen** (−30 % eager JS), ≈ −2,1 s @ 400 kb/s | S | Låg — men **verifiera med importgrafen**, konfigkommentaren har haft fel en gång |
| **2** | **P3** — generera om CV-miniatyrer i 512×724 WebP | −800 kB på `/#/cv` (−55 % av sidans transfer), ≈ −16 s @ 400 kb/s | S | Låg — skriptet finns (`e2e/cv-template-snapshots.cjs`) |
| **3** | **P2** — `useAuth` läser `authStore` i stället för att hämta själv | −21 requests på Översikt (−49 % av Supabase-anropen), kortar kedjan från 3 led till 1 | M | Medel — rör auth-vägen; kräver tester |
| 4 | Grind: fryst tak för **eager brotli-storlek** i CI | hindrar att P1 kommer tillbaka (den har redan gjort det) | S | Låg |
| 5 | P6 — `width`/`height` på mallminiatyrer | CLS 0,079 → ~0 | S | Låg (görs ihop med P3) |
| 6 | P5 — rotorsaka TBT-spridningen på `cv`/`job-search` | okänd tills mätt | M | — |
| 7 | P9 — beskär/självhosta fonter | ej belagd | S | Låg |
| — | ~~P7 virtualisering~~ | **bygg inte** — ingen sida passerar 3 000 DOM-noder | L | — |
| — | ~~P8 pako-dedup~~ | **vänta** — alla tre bärarna är lazy | M | — |

**De tre största vinsterna (1–3) är tillsammans ca −900 kB per drabbad sidladdning och −21 nätverksrundturer på Översikt, och samtliga är S/M i storlek.**

---

# Premissanteckningar (enligt CLAUDE.md:s premissgranskning)

Tre saker i uppdragsbeskrivningen visade sig **inte** hålla vid mätning — redovisas så att de inte byggs på:

1. **"Tunga bibliotek som laddas i entry men bara behövs på en sida (xlsx, jspdf, html2canvas, pdf-lib, docx, framer-motion...)"** — av de uppräknade är **endast `jspdf`** faktiskt eager. `xlsx` finns inte i bygget överhuvudtaget (E6:s notering om "xlsx 978 kB egen lazy-chunk" gäller inte längre). `html2canvas`, `docx`, `framer-motion`, `@react-pdf` är alla korrekt lazy. Och `jspdf` är eager av en **annan orsak än man skulle tro** — inte för att någon importerar jsPDF, utan för att Vites preload-helper råkade hamna i den chunken.

2. **"långa listor utan virtualisering"** — mätt: ingen sida passerar 3 000 DOM-noder och största React-renderade listan är 119 element. Virtualisering vore fel investering nu.

3. **`vite.config.ts`-kommentaren** (rad ~150–160) påstår att function-form `manualChunks` + `modulePreload: false` löser vendor-chunk-preload-problemet. **Det gör den inte** — den tog bort preload-*hinten* men inte den statiska importen, och gjorde hämtningen sekventiell i stället för parallell. Kommentaren bör rättas i samma commit som P1, annars återuppfinns felet.

Dessutom: **`useProfileStatus.ts` har noll konsumenter** (kontrollerat med importspårning, inte bara sökning) — dödkod, 130+ rader, raderingskandidat.
