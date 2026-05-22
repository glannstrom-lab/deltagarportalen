# CV PDF-export — strategier som funkar och inte

> **Senast uppdaterad:** 2026-05-22
> **Aktiv implementation:** `client/src/components/cv/CVPrintLayout.tsx`
> **Tidigare implementation (deprecated, kvar för historik):** `client/src/components/cv/PagedCVPrint.tsx`

Det här dokumentet beskriver vilka HTML→PDF-strategier för CV-byggaren som
funkar och vilka som inte gör det. Skrivet efter en lång iteration där flera
parallella ansatser provats. **Läs detta innan du gör större ändringar i
`PrintCV.tsx`, `CVPreview.tsx` eller PDF-flödet.**

## Den valda lösningen (V3 — 2026-05-22)

### Kärnidé
Rendera CV som **en sammanhängande sida** och låt Chrome:s print-engine
paginera naturligt via `break-inside: avoid`-hints. För sidobar-mallar:
använd `background-image: linear-gradient(to right, …)` på rot-elementet
för att färga vänster N pixlar i sidobar-färgen. Eftersom gradienten är på
ETT långt element och print-engine slicar elementet sida för sida får varje
tryckt sida samma sidobar-färg från 0 till sidobar-bredden.

### Komponenter
| Fil | Syfte |
|-----|-------|
| `CVPrintLayout.tsx` | Print-specifik wrapper kring template — sätter background-gradient + page-break-hints |
| `PrintCV.tsx` | Route `/print/cv` — hämtar CV-data (demo, query-base64 eller Supabase) och renderar `<CVPrintLayout>` |
| `client/api/cv-pdf.js` | Vercel serverless function — Puppeteer öppnar `/print/cv?data=<base64>` och anropar `page.pdf({ preferCSSPageSize: true })` |

### Pipeline
1. Användaren klickar **Exportera PDF** → `PDFExportButton`
2. POST `/api/cv-pdf` med Bearer-token + template-id
3. Vercel-funktionen hämtar användarens CV från Supabase
4. CV-JSON base64-kodas och injiceras i URL: `/#/print/cv?data=<base64>&template=X&manual=1`
5. Puppeteer (med `@sparticuz/chromium` i prod, lokal Chrome i dev) navigerar till URL:en
6. React-appen renderar `PrintCV` → `CVPrintLayout` → vald template
7. `page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true })` genererar PDF
8. PDF-bytes returneras till klienten som blob

### Mått som tas

I `CVPrintLayout` används `useLayoutEffect` för att avrunda
`.cv-print-root`:s `minHeight` till nästa hela A4-sida (≈1122.5px @ 96 DPI).
Varför: `background-image` på elementet renderas där elementet sträcker sig.
Utan rundning slutar gradient-bakgrunden där mall-innehållet slutar
(typiskt mitt på sista tryckta sidan). Med rundning täcker bakgrunden
varenda tryckt sida hela vägen ned.

Tolerans 4px hanterar pixel-rounding (en mall med `minHeight: 297mm` mäts
ibland som 1123px > 1122.5 = "över 1 sida" och tippar onödigt till 2 sidor).

## Vad som funkar ✅

| Tekniken | Varför funkar |
|----------|---------------|
| `background-image: linear-gradient(to right, …)` på rot-element | Bakgrund renderas där elementet sträcker sig; print-engine slicar elementet i sidor och varje sida får sin del av bakgrunden |
| `break-inside: avoid` på `.cv-entry` / `.cv-keep` | Håller ihop varje jobb/utbildning/cert — bryts inte mitt i ett entry |
| `break-after: avoid-page` på `h1, h2, h3` | Rubrik följer med till nästa sida om innehåll inte ryms efter den (ingen ensam rubrik längst ned) |
| `orphans: 3; widows: 3` på `p, li` | Minst 3 rader hålls ihop — sista raden av en paragraph hamnar aldrig ensam |
| Avrunda rot-höjd till hela A4 via JS | Säkerställer att bakgrund täcker alla tryckta sidor edge-to-edge |
| `display: block !important` på `.cv-entry` i print | Chromes flex-print-engine blockerar `break-inside: avoid` på flex-children — tvinga block |
| `preferCSSPageSize: true` i `page.pdf()` | Respekterar CSS:s `@page`-regel; konsekvent mellan dev-test (Playwright) och prod (Puppeteer + @sparticuz/chromium) |
| `body * { visibility: hidden } ` + `.cv-print-root * { visibility: visible }` | Döljer ev. nav/sidebar från `App.tsx` så bara CV:t syns i print |
| Single render av template, inte multi-page-data-split | Sektionsnumrering (Berlin:s romerska siffror), löpande paragraf-flöde, inget innehåll faller bort |

## Vad som INTE funkar ❌ (försök som vi förkastat)

### 1. JS-pre-paginering (V1 — `PagedCVPrint.tsx`, deprecated)
**Idé:** Mät DOM, splitta `workExperience` och `education` till N delmängder, rendera varje delmängd i en egen 297mm-container.

**Varför fel:**
- Splittar bara work-exp + edu — kan inte splitta `summary`, `skills`, `languages`
- Mallarna har olika strukturer: vissa har skills i aside, andra i main — pagination-koden känner inte till per-mall-layout
- `withEmptyAside()` rensar bara aside-fält (skills/lang/cert). Om aside-innehållet inte ryms på sida 1 → **innehåll förloras**
- `firstName/lastName/email/phone` blankas INTE → header upprepas på sida 2 inkonsekvent
- Berlin:s romerska sektionsnumrering reset:ar på sida 2 (`I, II → I, II` istället för `I, II → III, IV`)
- `PAGE_CONTENT_PX = 1080` hårdkodat — funkar inte för mallar med annan padding
- `overflow: hidden` på page-container klipper innehåll om mätningen är fel

### 2. `position: fixed` för sidobar-bakgrund (V2, försök 1)
**Idé:** Lägg en `position: fixed; top:0; left:0; width:Xpx; height:100vh`-div med sidobar-färgen. Chrome upprepar fixed på varje tryckt sida.

**Varför fel:**
- Funkar i isolation, men när rot-elementet (`cv-print-root`) har egen `background: white` så täcker det fixed-elementet
- Att sätta z-index löser det inte tillförlitligt — `print-color-adjust` interagerar med stacking
- Fungerar olika i `@media print` vs vid `page.pdf()` med `preferCSSPageSize: true`

### 3. `@page { margin: 12mm 0 10mm 0 }` + JS aside-stretch (V1.5)
**Idé:** Använd @page-margin för top/bottom-safe-zone, JS-mät main:s scrollHeight, sätt aside.minHeight = main.scrollHeight så sidobar-bg sträcks.

**Varför fel:**
- @page-margin skapar **vita band** ovanför sidobar på sida 2+ (eftersom @page-margin-bandet inte har bakgrund)
- JS-aside-stretch funkar för screen men Chrome:s print-engine respekterar inte minHeight: 100% på flex-children över page-breaks
- "Sidobar slutar mitt i sida 2"-buggen kvarstår

### 4. `@page { margin: 0 }` + `::before` 12mm safe-zone
**Idé:** Edge-to-edge bg via margin:0, sedan ::before 12mm på första sidan för innehållssäkerhet.

**Varför fel:**
- ::before 45px adderas till element-höjden
- 1-sidors-CV (Budapest: exakt 297mm) tippar över till 2 sidor med 90% tom sida 2
- Tradeoff: top-safe-zone vs onödig pagination — vi prioriterar pagination

Lösning: använd mallens egen padding (40-56px = 10-14mm) som top-safe-zone, ingen extra ::before.

### 5. CSS regions / column-fill
Chrome stödjer inte CSS regions. CSS columns kan inte hantera multi-sidors-flöde med break-inside avoid pålitligt. Ej använt.

### 6. `background-attachment: fixed`
Påverkar inte print — backgrounds renderas alltid scroll-relativt i print.

## Mall-specifika hänsyn

| Mall | Sidobar-bredd | Sidobar-färg | Anmärkning |
|------|---------------|--------------|------------|
| sidebar (Modern) | 320px | `#141414` (solid, originalet var subtil gradient) | Mörk gradient renderar bra som solid mellanton |
| nordic | 280px | `#F8FAFC` + divider `#E2E8F0` | Tunn 1px linje mellan aside och main |
| budapest | 34% | `#2C3E50` | Procent-baserad bredd — funkar OK |
| manhattan | 220px | `#0F1B2D` | Mörk navy |
| rotterdam | 220px | `#FFFFFF` + divider `#E5E7EB` | Endast divider — ingen färgad sidobar |
| chicago | 200px | `#FFFFFF` + divider `#E5E7EB` | Endast divider |
| berlin | 60px | `#1A1A1A` | Smal mörk linje |
| centered | — | — | Single-column |
| minimal | — | — | Single-column |
| executive | — | — | Single-column |
| creative | — | — | Single-column (med pink #BE185D rubriker) |
| atelier | — | — | Single-column (cream `#FAF8F4`) |

> **Bredd MÅSTE matcha mallens egen `<aside>`-bredd EXAKT.** Annars hamnar
> sidobar-text utanför färgfältet på sida 2+.

## Testning

```bash
# Lokal dev — generera PDF för alla mallar
cd e2e && BASE_URL=http://localhost:3000 node cv-pdf-audit.cjs

# Konvertera till PNG för visuell granskning
cd ../audit-2026-05-22/cv-pdf
for f in *.pdf; do pdftoppm -png -r 90 "$f" "${f%.pdf}-page"; done

# Test 3-sidors-pagination (12 jobb)
cd /c/Users/Mikael/Desktop/COWORK/deltagarportal/e2e && BASE_URL=http://localhost:3000 node cv-pdf-3pages.cjs
```

Print-route accepterar query-flaggor för testing:
- `?demo=mikael` → ladda Mikaels test-fixture
- `?template=ID` → byt mall
- `?jobs=N` → multiplicera workExperience (1-20, demo-only)
- `?manual=1` → stäng av auto-print-trigger (för Puppeteer som använder `page.pdf()` istället)

## Framtida förbättringar

- **Foto-stöd:** template renderar profilbild om `data.profileImage` finns. Just nu är `profileImage: null` i Mikael-demo, så vi har inte testat bild-rendering i print. Det BÖR funka eftersom det är vanlig `<img>` — men verifiera när bild läggs till.
- **Långa skills/languages:** om en användare har 30+ skills kan aside-innehållet bli längre än en sida. Det funkar tekniskt (overflow till sida 2) men flexbox-flow över page-breaks är ostabilt. Test-data behövs.
- **Anpassade @page-margins per mall:** vissa mallar kanske vill ha större eller mindre top/bottom-safe-zones. Just nu använder vi mallens egen padding.

## Vanliga fallgropar (LÄS innan du debug:ar PDF-buggar)

1. **Vite HMR cache:** ändringar i CVPrintLayout.tsx kan ta några sekunder att slå igenom till `/print/cv`-routen. Reloada manuellt om en re-run inte ger nya resultat.
2. **Puppeteer + Playwright skillnad:** dev-testet använder Playwright. Prod använder `puppeteer-core` + `@sparticuz/chromium`. Båda är Chrome under huven men kan ha små version-skillnader. `preferCSSPageSize: true` minimerar diff.
3. **Två `.cv-preview` i DOM:** PagedCVPrint hade ett dolt "measure"-element. CVPrintLayout har bara ETT. Om tester använder `locator('.cv-preview').waitFor()` kan strict-mode bryta om flera matchar.
4. **`useLayoutEffect` timing:** JS-rundningen av rot-höjd körs efter mount. Pre-PDF-wait i Puppeteer (800ms i audit-skriptet) räcker.
5. **Pixel-rounding @ exakt 1 sida:** mallar som är exakt 297mm tall mäts ofta som 1123px > 1122.5 = över 1 sida. Tolerans 4px i `CVPrintLayout` hanterar detta.
