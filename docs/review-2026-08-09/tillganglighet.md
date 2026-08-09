# Tillgänglighetsgranskning WCAG 2.1 AA — Jobin/Deltagarportalen

**Datum:** 2026-08-09 · **Granskare:** accessibility-specialist (agent)
**Metod:** Playwright + `@axe-core/playwright` (taggar `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`) i riktig Chromium. Publika sidor mätta mot **prod** (`https://www.jobin.se`), inloggade sidor mot **dev-servern** på `localhost:3000` med kontot `claude-playwright-test@jobin.se`. Registreringsflödet verifierat på **både** prod och lokalt.
**Omfattning:** 48 sidvyer axe-svepta (12 publika + 36 inloggade, varav 5 mobilvyer), 22 sidor tangentbordstestade (650 tabbstopp), 5 modaler, 19 sidor kontrastmätta (desktop + 390 px), 6 sidor vid 200 %/400 % zoom och 200 % textstorlek, rörelse mätt med och utan `prefers-reduced-motion`.
**Ingen kod, databas eller befintligt dokument ändrat.** Skärmdumpar: `docs/review-2026-08-09/bilder/a11y-*.png`.

---

## 1 · Sammanfattning

Mycket av 2026-08-04 års skuld är verkligen betald: **fokusstölden är borta**, **alla synliga formulärfält har namn** (0 av 35 utan namn, mot 20 av 43 den 4 augusti), varje rutt har egen `<title>` och annonseras med "Du är nu på …". Axe hittar **0 överträdelser på samtliga 12 publika sidor** — start, verktyg och guider. Reducerad rörelse fungerar, reflow håller ned till 320 px, fokusringen mäter 5,46:1.

Men två fel är allvarligare än något i förra rapporten, och båda handlar om att ett tangentbord inte kan användas. **Skip-länken syns aldrig när den får fokus** — den är fortfarande `clip: rect(0,0,0,0)`, 48×48 px, gömd bakom loggan, på varje sida i portalen och på prod. Första tabbtrycket leder ingenstans synligt. Och **på mobil (390 px) samt vid 400 % zoom (320 px) ligger 45 av 68 fokuserbara element utanför skärmen** — två stängda men fullt tabbara off-canvas-menyer. Man tabbar genom 36 osynliga tabbstopp innan sidans innehåll.

Totalt 96 axe-noder över 7 regel-id på 13 av 48 sidvyer, allt i inloggat läge. Tillgänglighetsredogörelsen finns, men påstår mätbart osanna saker.

---

## 2 · Fynd

### Aggregerat axe-utfall (48 sidvyer)

| Regel-id | Allvarlighet | Noder | Sidor (noder) |
|---|---|---:|---|
| `nested-interactive` | serious | **46** | job-search(20), m:job-search(20), personal-brand(6) |
| `color-contrast` | serious | **29** | career(10), exercises(5), resources(4), ai-team(2), diary-mood(2), diary(1), job-search(1), m:job-search(1), m:diary-mood(1), print-resources(1), international(1) |
| `button-name` | **critical** | **16** | m:diary-mood(6), diary(4), diary-mood(2), resources(2), m:cv(2) |
| `scrollable-region-focusable` | serious | **2** | wellness(1), skills-gap(1) |
| `aria-progressbar-name` | serious | **1** | profile(1) |
| `aria-required-children` | **critical** | **1** | profile(1) |
| `link-in-text-block` | serious | **1** | career(1) |
| **Summa** | | **96** | **13 av 48 sidvyer** |

**Noll överträdelser** på: alla 12 publika (start, `/verktyg/`, `/verktyg/cv/`, `/verktyg/intervjutraning/`, `/guider/`, `/guider/cv-grunder/`, `/guider/funktionsnedsattning-jobbsokning/`, `/guider/lattlast/`, login, register, tillgänglighet) samt oversikt, jobb, applications, cv (desktop), cover-letter, karriar, resurser, min-vardag, my-consultant, settings, interview-simulator, salary, calendar, linkedin, interest-guide, education, knowledge-base, m:oversikt, m:min-vardag.

> Axe fångar ~30 % av WCAG. Fynd 1, 2, 3, 4, 8, 10, 12, 13, 20 och 21 nedan är **inte** axe-fynd — de kommer ur manuell mätning i webbläsare.

---

### 1 · KRITISK — Skip-länken blir aldrig synlig när den får fokus
**WCAG:** 2.4.7 Fokus synligt (AA), 2.4.1 Kringgå block (A) i praktiken
**Storlek:** S

Första tabbtrycket på **varje** sida — inloggad och publik — landar på "Hoppa till huvudinnehåll". Ingenting händer visuellt.

**Bevis (uppmätt på fokuserat element, `document.activeElement` efter ett Tab):**

```
/#/oversikt (localhost)          https://www.jobin.se/          https://www.jobin.se/verktyg/cv/
text  "Hoppa till huvudinnehåll" "Hoppa till huvudinnehåll"     "Hoppa till innehållet"
rect  x=-1 y=-1 48×48            x=-1 y=-1 48×48                x=-1 y=-1 1×1
clip  rect(0px,0px,0px,0px)      rect(0px,0px,0px,0px)          rect(0px,0px,0px,0px)
overflow            hidden       hidden                         hidden
scrollWidth/clientWidth 219/48   219/48                         152/1
elementFromPoint(mitten) IMG.h-6 sm:h-8 (loggan)   NAV.fixed top-0…   HEADER.topbar
```

`clip: rect(0,0,0,0)` gäller **medan elementet har fokus**. Texten är dessutom klippt (219 px innehåll i en 48 px låda) och punkten mitt i elementet träffar loggan, inte länken. Skärmdumpar: `a11y-skiplank2-inloggad.png`, `a11y-skiplank-desktop.png` (fokus ligger på länken — bilden visar loggan).

**Trolig orsak i kod:** `client/src/styles/accessibility.css:112` definierar en **egen** `.sr-only` (`clip: rect(0,0,0,0); overflow:hidden`). Filen importeras med CSS:ets eget `@import` och ligger därför **utanför** Tailwinds `@layer utilities` — olagrad CSS vinner över lagrad oavsett specificitet, så `focus:not-sr-only` i `SkipLinks.tsx:96` når aldrig fram. `min-width/min-height: 48px` från `client/src/styles/mobile.css:18-19` blåser upp 1×1-lådan till 48×48 utan att ta bort clip. Samtidigt sätter `accessibility.css:59-84` en *tredje* uppsättning regler (`.skip-links a { top:-100px }`, `:focus { top:0 }`) som vinner över `focus:top-4 focus:left-4` — därav position (-1,-1) i stället för (16,16).

**Konsekvens:** en seende tangentbordsanvändare kan inte veta att kringgåendet finns. Skärmläsare hör länken (den är i a11y-trädet) och den *fungerar* när man trycker Enter — men bara den som tar risken att trycka Enter på något osynligt.

**Åtgärd:** ta bort den handskrivna `.sr-only` ur `accessibility.css` och låt Tailwind äga den, eller lägg hela `accessibility.css` i `@layer base`. Verifiera med den mätning som gjordes här: `getComputedStyle(document.activeElement).clip` ska vara `auto` efter fokus.

---

### 2 · KRITISK — 45 av 68 fokuserbara element ligger utanför skärmen på mobil och vid 400 % zoom
**WCAG:** 2.4.3 Fokusordning (A), 2.4.7 Fokus synligt (AA); slår även mot 1.4.10 Reflow (AA) i praktiken
**Storlek:** M

Två off-canvas-lådor renderas i stängt läge men är varken `display:none`, `visibility:hidden`, `inert` eller `aria-hidden`. De ligger kvar i tabbordningen.

**Bevis (390 × 844 px, `/#/oversikt`):**

```
fokuserbara totalt: 68     utanför viewporten: 45
lager 1: DIV.fixed top-0 right-0 bottom-0 … z-50   aria-label="Meny"   x=398 (viewport=390)
         32 poster: Stäng, ÖVERSIKT, Översikt, Min profil, … Hjälp, Logga ut
lager 2: DIV.fixed top-0 left-0 bottom-0 … z-50    4 poster: Stäng, Min profil, Inställningar, Logga ut
båda: display=flex/block, visibility=visible, opacity=1, transform=none,
      pointerEvents=auto, aria-hidden=null, inert=false
```

**Tabbprotokoll från sidans början (390 px), stopp 1–14:**

```
 1 A"Hoppa till huvudinnehåll"  x=-1   iViewport=false   (fynd 1)
 2 A"Hoppa till navigation"     x=-1   iViewport=false
 3 A"jobin.se"                          true
 4 BUTTON"Öppna stöd och hjälp…"        true
 5 BUTTON"Notifikationer"               true
 6 BUTTON"Min profil"                   true
 7 BUTTON"Meny"                         true
 8 BUTTON"Stäng"              x=610     false   ← in i den stängda lådan
 9 BUTTON"ÖVERSIKT"           x=398     false
10 A"Översikt"                x=398     false
11 A"Min profil"              x=398     false
12 A"Din konsulent"           x=398     false
13 A"Ditt AI-team Ny!"        x=398     false
14 A"Nätverk"                 x=398     false
… ytterligare 29 osynliga stopp innan sidans första innehållslänk (stopp 43)
```

**Samma sak vid 400 % zoom på desktop** (320 px CSS-bredd, det scenario WCAG 1.4.10 kräver stöd för): `fokuserbara 68, utanför viewporten 45`, tabbstopp 9 = `BUTTON "ÖVERSIKT" x=328` i en 320 px vy. Skärmdumpar: `a11y-mobil-fokus-osynlig.png` (fokus på "Nätverk", ingenting syns), `a11y-zoom400-fokus-utanfor.png`.

**Drabbad grupp:** varje tangentbordsanvändare på mobil, varje switch-användare, och varje synsvag som zoomar till 400 % på desktop. 36 blinda tabbtryck innan innehållet är inte "besvärligt" för den här målgruppen — det är där man slutar.

**Åtgärd:** ge de stängda lådorna `inert` (eller `visibility:hidden` + `display:none` efter uttoningen). `inert` löser både fokus och skärmläsarträdet i ett drag och stöds i alla målwebbläsare. Regressionsvakt: räkna fokuserbara utanför viewporten vid 320 px — talet ska vara 0.

---

### 3 · HÖG — Publika sidor: skip-länken flyttar inte fokus, och 133 guidesidor saknar den helt
**WCAG:** 2.4.1 Kringgå block (A)
**Storlek:** S

**Bevis (`https://www.jobin.se/verktyg/cv/`):**
```
Tab → A "Hoppa till innehållet"  →  Enter  →  activeElement = BODY
mål: #innehall = MAIN tabindex=null      (focus() på ett element utan tabindex är en no-op)
```
Samma familj som A11Y-2 från 2026-08-04, som lagades i SPA:n (`focusSkipTarget` sätter numera `tabindex="-1"`, `SkipLinks.tsx:70-78`) men aldrig i det prerenderade publika lagret — det har en egen implementation.

**Bevis (`https://www.jobin.se/guider/lattlast/`):** ingen skip-länk finns. Första tre länkarna är `["Jobin", "Öppna Jobin", "Jobin"]`. Sitemapen listar **133 guidesidor** (139 URL:er totalt) — samtliga bygger på samma mall.

**Åtgärd:** `tabindex="-1"` på `<main id="innehall">` i verktygsmallen; lägg samma skip-länk i guidemallen. Guidernas landmärken är i övrigt korrekta (`main=1 nav=1 header=1 footer=1`, exakt en `<h1>`).

---

### 4 · HÖG — Fyra dagboksflikar och två CV-knappar tappar sitt namn på mobil
**WCAG:** 4.1.2 Namn, roll, värde (A), 1.3.1 (A)
**Storlek:** S

Etiketten ligger i ett `<span class="hidden xs:inline sm:inline">`. Under `sm`-brytpunkten är knappen ren ikon utan `aria-label` — den har alltså **inget tillgängligt namn alls** på telefon och vid 400 % zoom, men ett korrekt namn på desktop. Därför missade förra svepet det.

**Bevis (390 px, `/#/diary?tab=mood`, axe `button-name` critical ×6):**
```
BUTTON  rect 48×48  dold text: "Dagbok"      (span.hidden xs:inline sm:inline)
BUTTON  rect 48×48  dold text: "Humör"
BUTTON  rect 48×48  dold text: "Mål"
BUTTON  rect 48×48  dold text: "Tacksamhet"
BUTTON  rect 48×48  dold text: —             (månadsnavigering ×2)
/#/cv:  BUTTON dold text "Exempeldata";  BUTTON w-12 h-12 utan text alls
```
Skärmdump: `a11y-mobil-diary-flikar.png` — fyra ikoner utan text, ingen av dem läses upp som något annat än "knapp".

**Åtgärd:** `aria-label` på knappen (inte bara på det dolda spannet), alternativt `<span class="sr-only">` i stället för `hidden xs:inline`. Kontrollen som saknas: kör axe även på 390 px — förra rapportens svep var enbart desktop.

---

### 5 · HÖG — Åtta namnlösa ikonknappar på desktop kvarstår oförändrat sedan 2026-08-04
**WCAG:** 4.1.2 (A)
**Storlek:** S

`button-name` (critical): diary 4, diary-mood 2, resources 2 — exakt samma noder som A11Y-7.

| Element | Sida | Läses upp som |
|---|---|---|
| `button.p-2.hover:bg-red-50` (**radera dagboksinlägg**) | diary | "knapp" |
| `button.p-2.hover:bg-amber-100` (nytt skrivtips) | diary | "knapp" |
| `button.p-2.rounded-lg.border` / `.text-stone-600` | diary | "knapp" ×2 |
| `button.p-1.hover:bg-stone-100` (månadsnavigering) | diary-mood | "knapp" ×2 |
| `button.p-1.5` (rutnät/lista-växlare) | resources | "knapp" ×2 |

Raderingsknappen är fortfarande den enda av de fyra som förstör data, och den enda skyddet är en `confirm()` **efter** klicket. En skärmläsaranvändare har fyra likadana "knapp" att välja mellan.

**Åtgärd:** `aria-label` på åtta ställen. Portalen har mönstret överallt annars.

---

### 6 · HÖG — 46 nästlade interaktiva noder på jobbkorten och varumärkesreflektionen
**WCAG:** 4.1.2 (A)
**Storlek:** M

`nested-interactive`: job-search 20 (desktop) + 20 (mobil), personal-brand 6.

```
<div role="button" tabindex="0" aria-label="House cleaning - ARUA AB" …>
   inuti: BUTTON "Sparad" · A "Skriv brev" · BUTTON "Ansök"
```

**Rättelse mot 2026-08-04:** rapporten skrev att "Spara jobb inte är tillförlitligt nåbart". Det stämmer inte — mätt både med tangentbord och mot Chromes a11y-träd via CDP:

```
Tabbsekvens från kortet: DIV[role=button] → BUTTON"Sparad" → A"Skriv brev" → BUTTON"Ansök" → nästa kort
Accessibility.queryAXTree(kortet, role=button):
   {role:button, name:"House cleaning - ARUA AB", ignored:false}
   {role:button, name:"Sparad",  ignored:false, ignoredReasons:[]}
   {role:button, name:"Ansök",   ignored:false, ignoredReasons:[]}
```

De inre kontrollerna **är** nåbara och **är** i trädet i Chromium. Felet är ändå verkligt: ett `role="button"` med `aria-label` platsar hela kortets innehåll (företag, ort, anställningsform, sista ansökningsdag) inuti en knapp vars namn bara är "House cleaning - ARUA AB", och ARIA:s regel om att `button` har presentational children gör beteendet **beroende av vilken skärmläsare man kör**. `BrandAuditTab.tsx` har dessutom en `<Link>` inuti en `<button>` — ogiltig HTML.

**Åtgärd:** mönstret "card with a link, not a link card" — gör rubriken till länken, låt kortet vara en `<article>`. Storleken är M eftersom kortet återanvänds på flera ytor.

---

### 7 · HÖG — 29 kontrastbrott, samma tre familjer som i juli
**WCAG:** 1.4.3 Kontrast (minimum) (AA)
**Storlek:** M

Uppmätta värden (axe, faktiska renderade färger):

| Kvot | Förgrund | Bakgrund | Storlek | Sida | Text |
|---:|---|---|---|---|---|
| **2,50:1** | `#ff6900` | `#f2edf8` | 12 px | diary, diary-mood | streak-räknaren "dagar" |
| **2,87:1** | `#e17100` | `#ecf4fa` | 12 px | resources | amber-etikett |
| **2,88:1** ×10 | `#b48189` | `#fbeeef` | 12 px | career | stegnumren "1."–"5." |
| **3,07:1** | `#00a63e` | `#f0fdf4` | 14 px | exercises | "Påbörjade" |
| **3,08:1** | `#e17100` | `#fffbeb` | 14 px | exercises | "Aktiva" |
| **3,21:1** | `#00a63e` | `#ffffff` | 14/16 px | diary-mood (desktop + mobil) | "Uppåt" |
| **3,46:1** | `#009966` | `#ecfdf5` | 14 px | exercises | "Övningar totalt" |
| **3,49:1** | `#009966` | `#fafaf9` | 16 px | international | "Ja, efter 4 år" |
| **3,51:1** | `#009689` | `#f0fdfa` | 14 px | ai-team | rubriken "Tips" |
| **3,59:1** | `#009966` | `#fdfdfd` | 14 px | exercises | "Synkad med molnet" |
| **3,65:1** | `#ffffff` | `#009966` | 14 px | exercises | knappen "Alla övningar" |
| **3,66:1** | `#009689` | `#ffffff` | 12 px | ai-team | "Eller skriv ett eget meddelande…" |
| **3,72:1** | `#ffffff` | `#518ab3` | 12 px | print-resources | räknarchip "133" |
| **3,76:1** | `#ffffff` | `#2b7fff` | 14 px | resources | blå etikett |
| **4,12:1** | `#ec003f` | `#fff1f2` | 14 px | job-search (desktop + mobil) | rosa filterknapp |
| **4,29:1** | `#155dfc` | `#dbeafe` | 12 px | resources | statusetikett "Ansökt" |
| **4,44:1** | `#ffffff` | `#148860` | 12 px | resources | grön etikett |

Familjerna är oförändrade: (1) Tailwinds `-500/-600` på egna `-50/-100`-bakgrunder, (2) 12 px-text i chips och räknare, (3) vit text på mellanmörk fyllning. Förbättringen från 38 → 29 noder beror mest på att CV-heron (`text-white/80`) och CV-ATS-poängchipsen är lagade.

**Verifierat separat (mina egna beräkningar, inte axe):**
- **Placeholdertext:** 14 fält över 8 sidor, samtliga `#64748b` på vit/`#fafaf9` = **4,56–4,76:1** — godkänt.
- **Fokusringen:** `rgb(124,58,237) solid 3px`, offset 2 px, mot `#fafaf9` = **5,46:1** (krav 3:1 för icke-text) — godkänt.
- **Mobil 390 px:** 0 nya kontrastbrott utöver dem i tabellen.

**Åtgärd:** `-700`-toner för text på `-50/-100`-bakgrunder; höj chip-text till 14 px där färgen inte kan flyttas. Överväg att låta `lint:design` bevaka de fyra värsta paren — de har nu överlevt tre granskningar.

---

### 8 · HÖG — Registreringens valideringsfel är inte kopplade till fälten (verifierat på prod)
**WCAG:** 3.3.1 Felidentifiering (A), 3.3.3 Förslag vid fel (AA), 4.1.3 Statusmeddelanden (AA)
**Storlek:** S

**Bevis, identiskt lokalt och på `https://www.jobin.se/#/register`** (ogiltig e-post + för kort lösenord, sedan submit):

```
fel:  [{text:"Ogiltig e-postadress", tag:"LI", id:null, role:null, live:null},
       {text:"Ogiltig e-postadress", tag:"P",  id:null, role:null, live:null},
       {text:"Minst 12 tecken",      tag:"SPAN", id:null, role:null, live:null}]
aria-invalid satt:    0 av 8 fält
aria-describedby satt: 0 av 8 fält
role=alert / aria-live på felen: 0
```

Felet renderas dessutom **två gånger** (`<li>` + `<p>`). Ingenting av detta når en skärmläsare — den som inte ser rött får bara en knapp som inte gör något. Detta är den första sidan en ny deltagare möter. Skärmdump: `a11y-register-fel-prod.png`.

**Jämför login, som gör rätt:** `<p>Fel e-post eller lösenord</p>` inuti ett element med `role="alert"`, och numera bara en gång (dubbleringen från 2026-08-04 är borta).

**Åtgärd:** `id` + `role="alert"` per fel, `aria-describedby` från fältet, `aria-invalid="true"`. Formulera felen som instruktioner (se avsnitt 3).

---

### 9 · MEDEL — Notifikationspanelen kallar sig dialog men fångar inte fokus
**WCAG:** 4.1.2 (A), 2.4.3 (A)
**Storlek:** S

```
dialogs: [{role:"dialog", ariaModal:null, ariaLabel:"Notifikationer", focusables:6}]
fokus efter öppning: BUTTON "Notifikationer"  inDialog=false   ← flyttas aldrig in
25 tabbar → 19 hamnade utanför dialogen (stopp 6:BUTTON"C", 7:A"Översikt", 8:A"Söka jobb", …)
Escape: dialogen stängs ✅
```
Oförändrat sedan A11Y-9. `NotificationBell.tsx` saknar `aria-modal` och `useFocusTrap`.

**Åtgärd:** ta bort `role="dialog"` och behandla panelen som ett dropdown med `aria-expanded` på knappen. Det är vad den är.

---

### 10 · MEDEL — Språkväljaren är en `listbox` utan options
**WCAG:** 4.1.2 Namn, roll, värde (A)
**Storlek:** S

```
[role=listbox] aria-label="Välj språk"  aria-activedescendant=null
  barn: DIV role=ingen "Språk"
        DIV role=ingen "Svenska\nEnglish"
fokus efter Enter:  BUTTON (utanför listboxen)
ArrowDown:          ingen effekt — fokus står kvar
Tab:                BUTTON "Svenska" (inne i menyn)  ✅
Escape:             stänger, fokus tillbaka till "Välj språk"  ✅
```

Rollen lovar en lista med valbara alternativ; a11y-trädet innehåller noll `option`. En skärmläsare annonserar "Välj språk, listbox" och hittar sedan ingenting att välja mellan. Att den *går* att använda med Tab räddar den funktionellt, inte semantiskt.

**Åtgärd:** enklast är att släppa `role="listbox"` och göra det till `role="menu"` med `role="menuitem"`-knappar (som passar hur den redan beter sig), eller implementera listbox på riktigt med `role="option"` + `aria-activedescendant` + piltangenter.

---

### 11 · MEDEL — Rubriknivåer hoppar på 9 av 11 kontrollerade sidor; profilen har `h2` före `h1`
**WCAG:** 1.3.1 (A), 2.4.6 Rubriker och etiketter (AA)
**Storlek:** M

Exakt en `<h1>` finns nu på 22 av 22 sidor i tangentbordssvepet — det är en förbättring. Intresseguiden, mätt separat, har två. Nivåerna under den är däremot fortfarande fel.

| Sida | Rubrikföljd (synliga, i dokumentordning) | Fel |
|---|---|---|
| profile | **H2**"Välkommen!" → H1"Claude Testdeltagare" → H3"Kontaktuppgifter" | h2 **före** h1, sedan h1→h3 |
| interest-guide | H1"Intresseguide" → **H1"Intresseguide"** → H2 → H3 | två `<h1>` |
| cv | H1"CV" → H3"Välj en mall" → H4 ×11 | h1→h3 |
| cover-letter | H1"Personligt brev" → **H4**"CV-data hämtad" → H2"Välj en mall" | h1→h4, sedan bakåt |
| applications | H1 → H3"Intresserad" → H4 | h1→h3 |
| diary | H1"Dagbok" → H3"Dagens skrivtips" | h1→h3 |
| settings | H1 → H3"Profil" → H4 | h1→h3 |
| job-search | H1"Sök jobb" → H3"Sök & Filtrera" → H3 ×20 | h1→h3 |
| education | H1 → H3 → H4 ×8 | h1→h3 |
| help | H1 → H3 ×4 → **H2**"Komma igång" → H3 | h1→h3, sedan bakåt |
| exercises | H1"Övningar" → H3 ×11 | h1→h3 |

Dessutom är cookie-bannerns `<h2>"Vi använder cookies"` sist i rubriklistan på **varje** sida — den som navigerar med rubriktangent tror att sidan slutar med ett cookie-avsnitt.

**Åtgärd:** sektionsrubriker på verktygssidor = `h2`, kortrubriker inuti sektion = `h3`. Profilens "Välkommen!" ska vara `h2` **efter** namnet eller ingen rubrik alls.

---

### 12 · MEDEL — Publika SPA-sidor saknar `<main>`; Login och Register har `<h1>Jobin</h1>`
**WCAG:** 1.3.1 (A), 2.4.6 (AA)
**Storlek:** S

```
prod:start           main=0 nav=2 header=0 footer=1   h1="Stärk dina deltagare mot jobb"   (h2→h4-hopp)
prod:login           main=0 nav=0 header=0 footer=0   h1="Jobin"
prod:register        main=0 nav=0 header=0 footer=0   h1="Jobin"
prod:tillganglighet  main=0 nav=0 header=1 footer=0   h1="Tillgänglighetsredogörelse"  — ingen skip-länk
prod:/verktyg/cv/    main=1 nav=2 header=1 footer=1   ✅
prod:/guider/…       main=1 nav=1 header=1 footer=1   ✅ (men ingen skip-länk, se fynd 3)
```

Login och Register har varken landmärke eller skip-länk, och rubriken berättar inte vad sidan gör. Tillgänglighetsredogörelsen — sidan som ska bevisa att portalen är tillgänglig — saknar `<main>`.

**Åtgärd:** `MainContent`-hjälparen finns redan i `SkipLinks.tsx:117`. Använd den. `<h1>Logga in</h1>` / `<h1>Skapa konto</h1>`.

---

### 13 · MEDEL — Tillgänglighetsredogörelsen påstår saker som är mätbart falska
**Rättsligt:** lag (2023:254) / EAA-direktivet 2019/882 kräver en aktuell och korrekt redogörelse
**Storlek:** S

Redogörelsen finns (`/#/tillganglighet`, `client/src/pages/Accessibility.tsx`), är nåbar och innehåller tillsynsmyndighet, kontaktväg (`tillganglighet@jobin.se`) och en lista över kända brister. Det är bättre än de flesta. Men fyra påståenden håller inte mot mätning:

| Påstående (rad) | Verklighet |
|---|---|
| "Skärmläsarstöd: … Knappar är `<button>`, inte klickbara `<div>`." (57) | **46 axe-noder** är `<div role="button" tabindex="0">` med knappar inuti (fynd 6) |
| "Tangentbordsnavigering: Hela portalen kan användas utan mus. Skip-länkar finns…" (56) | Skip-länken är osynlig vid fokus (fynd 1); 45 av 68 tabbstopp osynliga på mobil (fynd 2) |
| "Hanterbart (Operable): **Uppfyllt**." (83) | 2.4.7, 2.4.3, 2.1.1 och 4.1.2 fallerar mätbart |
| "Begripligt: **Uppfyllt**. … formulärfel beskrivs" (84) | Registreringens fel når inte hjälpmedel alls (fynd 8) |
| "Vi testar löpande med NVDA, VoiceOver och TalkBack" (101) | Ingen av de fyra granskningarna 2026-07-10 → 2026-08-09 har kunnat verifiera en enda skärmläsarkörning; 2026-08-04 skriver uttryckligen "Inte testat: riktig skärmläsare" |

Redogörelsen saknar också två formella uppgifter: **utvärderingsmetod** (självskattning vs. extern granskning) och **datum för den bedömning som ligger till grund**. "Senast uppdaterad: 2026-05-15" är nästan tre månader gammal och tre granskningar efter.

**Åtgärd:** flytta de fyra påståendena till "Kända brister" med hänvisning till fynd 1, 2, 6 och 8; ange metod ("intern granskning med axe-core och manuell tangentbordstest, senast 2026-08-09") och stryk skärmläsarpåståendet tills en riktig NVDA-session är körd. En redogörelse som överdriver är juridiskt sämre än en som är ärlig.

---

### 14 · MEDEL — Två rullbara områden går inte att rulla med tangentbord
**WCAG:** 2.1.1 Tangentbord (A)
**Storlek:** XS

`scrollable-region-focusable`:
- `pages/wellness/HealthTab.tsx` — `<div class="space-y-2 max-h-32 overflow-y-auto">`
- `pages/SkillsGapAnalysis.tsx` — `<div class="… max-h-48 overflow-y-auto">`

`MyConsultant`s meddelandelogg (den tredje i A11Y-14) är **lagad** — den flaggas inte längre.

**Åtgärd:** `tabIndex={0}` + `role="region"` + `aria-label` på de två kvarvarande.

---

### 15 · MEDEL — CoachWidget tappar fokus till `<body>` när den stängs
**WCAG:** 2.4.3 (A)
**Storlek:** S

```
Coachtips:  role=dialog aria-modal=true aria-labelledby="_r_5_" (finns) ✅
            fokus efter öppning: BUTTON "Stäng" inDialog=true ✅
            25 tabbar → 0 utanför dialogen ✅
            Escape → stängs ✅   fokus efter: BODY ❌
```
De fyra andra testade modalerna gör rätt hela vägen: Krisstöd → "Öppna stöd och hjälp…", Ny ansökan → "Ny ansökan", Ny händelse → "Ny händelse".

**Åtgärd:** spara öppnarens ref och fokusera den vid stängning.

---

### 16 · LÅG–MEDEL — Profilens framstegsindikator och taggkomponent har trasig ARIA
**WCAG:** 1.3.1 (A), 4.1.2 (A)
**Storlek:** XS

```
aria-progressbar-name (serious):  <div role="progressbar" aria-valuenow="17" …> utan namn
aria-required-children (critical): <div role="list" aria-label="Lägg till ett intresse: 0 av 5">
                                     <span …>Inga tillagda</span></div>
```
Oförändrat sedan A11Y-15. Samma namnlösa progressbar-mönster finns i `OverviewSection.tsx`, `career/PlanTab.tsx` och `SkillsGapAnalysis.tsx`.

**Åtgärd:** `aria-label="Profilen är 17 % ifylld"`; släpp `role="list"` i tomt läge.

---

### 17 · LÅG — En rå i18n-nyckel läses fortfarande upp bokstavligt
**WCAG:** 4.1.2 (A)
**Storlek:** XS

`/#/job-search` → `<button aria-label="jobSearch.voiceSearch">`. Källa `pages/JobSearch.tsx:481`. De två nycklarna på `/#/my-consultant` från A11Y-8 är lagade.
Skanningen täckte 22 sidor och alla `aria-label`/`title`/`alt` som matchar `^[a-z][a-zA-Z0-9]*(\.[…]+)+$` — det här var det enda äkta fyndet.

**Åtgärd:** lägg nyckeln i `sv.json`/`en.json`. Enhetsregeln som föreslogs 2026-08-04 hade fångat den.

---

### 18 · LÅG — Länk i löptext skiljs bara med färg
**WCAG:** 1.4.1 Användning av färg (A)
**Storlek:** XS

`/#/career`: `<a href="https://arbetsformedlingen.se" class="text-[var(--c-text)] … hover:underline">Arbetsförmedlingen</a>`. Understrykning bara vid hover.

---

### 19 · LÅG — Inaktiverade knappar är oläsbara (2,6:1)
**WCAG:** formellt undantaget i 1.4.3 (inaktiva komponenter), men i praktiken ett hinder
**Storlek:** S

| Kvot | Sida | Knapp |
|---:|---|---|
| 2,69:1 | wellness | "Spara reflektion" (opacity 0.5) |
| 2,60:1 | ai-team | "Skicka" (opacity 0.5) |
| 1,00:1 | profile | "Lägg till" — vit text på vit bakgrund vid opacity 0.5 |

Undantaget i WCAG finns för att inaktiva kontroller inte behöver läsas. Men för den här målgruppen är "varför händer inget när jag trycker?" den vanligaste avhopps­punkten, och svaret står i knappen man inte kan läsa. `opacity: 0.5` är ett trubbigt sätt att uttrycka inaktivt läge.

**Åtgärd:** använd en egen `disabled`-token (dämpad text på dämpad yta, ≥ 3:1) i stället för global opacity, och skriv ut villkoret bredvid knappen ("Skriv något först").

---

### 20 · LÅG — Cookie-bannern ligger sist i tabbordningen och täcker innehåll mitt på sidan
**WCAG:** 2.4.3 Fokusordning (A)
**Storlek:** S

På mobil är bannerns knappar tabbstopp **59–61 av 61**. En tangentbordsanvändare måste passera hela menyn, hela sidan och bottennavet för att kunna svara på ett val som visuellt blockerar innehållet (se `a11y-mobil-fokus-osynlig.png` och `a11y-mobil-diary-flikar.png` — bannern täcker dagbokens flikar).

Positivt: bannerns yttre lager har `pointer-events: none`, så hit-testet visar att **bottennavet inte blockeras** — alla fem hubbnav-poster träffar sig själva. Den geometriska fällan från UX16 är alltså inte tillbaka.

**Åtgärd:** flytta bannern först i DOM:en eller ge den fokus vid visning.

---

### 21 · LÅG — `line-clamp` klipper text vid 200 % textstorlek
**WCAG:** 1.4.4 Ändring av textstorlek (AA), 1.4.12 Textavstånd (AA)
**Storlek:** S

Vid `html { font-size: 32px }` (200 %) på 1280 px vy: **0 px horisontellt spill på alla sex testade sidor** ✅, men `/#/cv` har `<p class="text-sm … line-clamp-2">` där `scrollHeight > clientHeight` — tipstextens andra halva försvinner utan att gå att nå. Skärmdump: `a11y-text200-oversikt.png`.

**Åtgärd:** `line-clamp` bara på innehåll som har en "läs mer"-väg.

---

## 3 · Verifierat sedan 2026-08-04

| Fynd 08-04 | Status 08-09 | Bevis |
|---|---|---|
| A11Y-1 fokusstöld till krisknappen vid varje sidladdning | ✅ **Lagat** | `activeElement` = `BODY` på 22 av 22 sidor efter laddning |
| A11Y-2 skip-länkar mot id:n som inte finns | ✅ **Lagat i SPA:n** | `main-content` + `main-navigation`, båda `targetExists=true`, `tabindex=-1`; Enter flyttar fokus till `MAIN`. **Men** synligheten är trasig (fynd 1) och det publika lagret kvarstår (fynd 3) |
| A11Y-3 20 av 43 fält utan namn + 14 i CV-fokusläget | ✅ **Lagat** | 0 av 35 synliga fält utan tillgängligt namn över 22 sidor |
| A11Y-4 identisk `<title>` på alla sidor, ingen ruttannonsering | ✅ **Lagat** | 22 unika titlar ("CV — Jobin", "Dagbok — Jobin", …) + `sr-only`-region "Du är nu på Kalender" |
| A11Y-5 38 kontrastnoder | ⚠️ **Delvis** | 29 noder kvar; CV-heron och ATS-chipsen lagade, familjerna i övrigt intakta (fynd 7) |
| A11Y-6 nästlade interaktiva element | ⛔ **Kvarstår** | 46 noder; rättelse om nåbarheten, se fynd 6 |
| A11Y-7 8 namnlösa knappar | ⛔ **Kvarstår** + 8 nya på mobil | fynd 5, fynd 4 |
| A11Y-8 tre råa i18n-nycklar i `aria-label` | ⚠️ **2 av 3 lagade** | `myConsultant.*` borta, `jobSearch.voiceSearch` kvar (fynd 17) |
| A11Y-9 notifikationspanelen | ⛔ **Kvarstår** | 19 av 25 tabbar utanför (fynd 9) |
| A11Y-10 modaler tappar fokus vid stängning | ⚠️ **Delvis** | CoachWidget kvarstår (fynd 15); 4 av 5 testade modaler är korrekta |
| A11Y-11 rubrikhopp | ⛔ **Kvarstår** | 9 av 11 sidor (fynd 11) |
| A11Y-12 `<main>` saknas publikt | ⛔ **Kvarstår** | fynd 12 |
| A11Y-13 registreringens fel inte kopplade | ⛔ **Kvarstår**, verifierat på prod | fynd 8. Loginets dubbelrendering är däremot borta |
| A11Y-14 rullbara områden | ⚠️ **1 av 3 lagat** | MyConsultant klar, wellness + skills-gap kvar (fynd 14) |
| A11Y-15 TagInput + progressbar | ⛔ **Kvarstår** | fynd 16 |
| A11Y-16 länk endast med färg | ⛔ **Kvarstår** | fynd 18 |

### Det som mätt fungerar

- **0 axe-överträdelser på samtliga 12 publika sidor** — inklusive de nya `/verktyg/`- och `/guider/`-sidorna. Guidemallen har korrekta landmärken och exakt en `<h1>`.
- **`prefers-reduced-motion` respekteras.** Med `reduce`: 248 element har `transition-duration: 1e-05s` och `animation-duration: 1e-05s`, 0 löpande animationer. Utan: 39 element med verkliga övergångar. Regeln i `accessibility.css:90-105` biter.
- **Inget roterar eller spelar automatiskt.** På `/#/oversikt`, `/#/jobb`, `/#/min-vardag`, `/#/karriar`: texten oförändrad efter 8 sekunder, 0 animationer med > 3 iterationer. WCAG 2.2.2 uppfylls.
- **Inga tidsgränser.** Intervjusimulatorn har ingen nedräkning (`grep` på `timeLimit|countdown|timeLeft` = 0 träffar), CV-byggaren autosparar (`useCVAutoSave`). WCAG 2.2.1 uppfylls.
- **Reflow och zoom:** 0 px horisontellt spill på 6 sidor vid 640 px (200 %), 320 px (400 %) och vid 200 % textstorlek. WCAG 1.4.10 och 1.4.4 uppfylls layoutmässigt.
- **Fokusindikator:** finns på 650 av 650 testade tabbstopp, kontrast 5,46:1.
- **Fokusläget lever.** På `/#/cv`: 33 → 13 interaktiva element, 2 462 → 130 tecken (−95 %). Portalens starkaste tillgänglighetsfunktion.
- **Placeholderkontrast** 4,56–4,76:1 på 14 fält. **`html lang="sv"`** överallt. **Touch targets** ≥ 24 px överallt utom cookie-bannerns "integritetspolicy"-länk (85×16 px).

---

## 4 · Förbättringsförslag utöver regelefterlevnad

Det här är inte WCAG-krav. Det är sådant som avgör om någon med tre års arbetslöshet bakom sig fortsätter eller stänger fliken.

**4.1 · Språkets svårighetsgrad — mätt med LIX (`main`-innehållet)**

| Yta | LIX | Bedömning |
|---|---:|---|
| `/guider/lattlast/` | **23** | mycket lättläst — förebilden |
| `/verktyg/cv/` (publik) | 30 | lätt |
| Hubbarna (oversikt, jobb, min-vardag) | 35–37 | lätt |
| `/#/profile`, `/#/karriar` | 41–45 | medel |
| `/#/settings`, `/#/ai-team` | 49–50 | medel/svår |
| `/guider/cv-grunder/` | **51** | svår — för en guide riktad till den som behöver mest hjälp |
| `/#/job-search` | 59 | svår |
| `/#/skills-gap-analysis` | **62** | mycket svår |

Hubbarnas ton är precis rätt. Problemet sitter i verktygen: `skills-gap-analysis` möter användaren med LIX 62 på 85 ord — varje mening är tät. `/guider/cv-grunder/` är portalens mest lästa guide och ligger på 51. **Förslag:** sätt ett tak på LIX 40 för allt UI och LIX 45 för guider, och mät det i CI på samma sätt som gradient-baseline. Lättläst-guiden bevisar att ni kan skriva så.

*Reservation:* LIX är otillförlitligt på etikett-tung UI där punkter saknas — `/#/cv` mäter 78 av just det skälet och ska inte läsas som "svårast i portalen".

**4.2 · Beslut per skärm**
`/#/job-search` har **96 interaktiva element** i en vy och `/#/cv` 33. Det är inte i sig fel — men fokusläget, som skär `/#/cv` till 13, är gömt bakom en knapp i topbaren som heter "Slå på fokusläge" och som en ny användare aldrig hittar. **Förslag:** fråga vid första inloggningen ("Vill du se en sak i taget?") i stället för att vänta på att någon letar upp knappen. Portalen vet redan vem som angett låg dagsenergi — koppla ihop det.

**4.3 · Felmeddelanden som säger vad man ska göra**
Nuvarande: "Ogiltig e-postadress", "Minst 12 tecken", "Förnamn är obligatoriskt". Alla tre beskriver vad som är fel, inget säger vad man ska göra. **Förslag:** "Skriv din e-postadress så här: namn@exempel.se", "Lösenordet behöver vara minst 12 tecken — du har skrivit 3". Kombinerat med fynd 8 (koppla felet till fältet) är det samma ändring i samma fil.

**4.4 · Spara och pausa syns inte**
CV-byggaren autosparar, men beskedet "Allt sparas automatiskt" står först på **steg 6 av 6** (`CVBuilder.tsx:915`). Den som orkar tre steg och stänger vet inte att arbetet finns kvar. **Förslag:** visa "Sparat" som en `aria-live="polite"`-status redan från steg 1. Kostnaden är en rad, vinsten är att någon vågar sluta i tid.

**4.5 · Inaktiverade knappar bör förklara sig** — se fynd 19. "Skicka" som är grå utan att säga varför är den vanligaste tysta återvändsgränden i portalen.

**4.6 · Lättläst-ingången bör finnas inne i portalen, inte bara publikt**
`/guider/lattlast/` (LIX 23) är utmärkt men ligger bakom en publik URL. Deltagaren som redan är inloggad hittar den inte. **Förslag:** en "Lättläst"-växel i inställningarna som byter mikrokopian, på samma sätt som Lugnt läge byter paletten.

**4.7 · Cookie-bannern kostar mest hos dem som orkar minst**
Den täcker innehåll mitt på sidan (`a11y-mobil-diary-flikar.png`), har fyra val och ligger sist i tabbordningen. Fyra val om kakor innan man får läsa sin egen dagbok är en energiavgift.

---

## 5 · Vad jag inte hann granska

- **Riktig skärmläsare.** Ingen NVDA-, VoiceOver- eller TalkBack-session är körd. Allt om skärmläsare här bygger på Chromiums a11y-träd via CDP och på axe. Automatik kan avgöra *om* något annonseras, aldrig om det är begripligt. Det här är den enskilt största luckan — och den redogörelsen påstår är fylld (fynd 13).
- **Konsulentvyn `/consultant`** — inte svept alls. Förra granskningen räknade 57 namnlösa fält där.
- **CV-PDF-exportens tagging** (redogörelsen erkänner själv att den är overifierad).
- **Diagram och visualiseringar:** RIASEC-radarn, lönediagrammen och `BarChart`/`LineChart`/`CircleChart` har inte kontrollerats för textalternativ (1.1.1).
- **CV-ATS-vyn** (`/#/cv` med analys), som 2026-08-04 gav 10 av 38 kontrastnoder — testkontot hade ingen färsk analys.
- **`/#/spontanansokan` och `/#/natverk`** — båda ruttnamnen jag prövade omdirigerade till `/#/oversikt`; jag hittade inte de rätta sökvägarna inom tidsramen.
- **Mörkt läge.** All kontrastmätning är gjord i ljust läge. Tokens skiljer sig, siffrorna gäller inte automatiskt.
- **STA-modulen** (avaktiverad) och e-postmallar.
- **Röststyrning och taligenkänning** utöver att konstatera att `jobSearch.voiceSearch`-knappen saknar namn.
- **Intervjusimulatorn i pågående session** — jag verifierade att ingen nedräkning finns på startskärmen, men startade aldrig en session med mikrofon.

---

### Metodanteckningar

- Publika sidor är mätta mot **prod**, inloggade mot dev-servern med prod-databasen bakom. Kontrast, fokus och tabbordning påverkas inte av dev/prod-skillnaden; bundling gör det inte heller för något fynd här.
- Testkontot har begränsad data (fem sparade jobb, fem ansökningar i pipelinen, ett dagboksinlägg). Sidor med mer innehåll kan ge fler kontrast- och rubrikfynd.
- Alla mätningar är gjorda i riktig Chromium. `offsetParent`-fällan från jsdom gäller inte här — synlighet är mätt med `getBoundingClientRect`, `getComputedStyle` och `elementFromPoint`, och fokusfällorna är testade genom att faktiskt trycka Tab 25 gånger per modal.
- Rådata i scratchpad: `axe-raw.json`, `axe-raw2.json` (48 sidvyer), `kbd-sem.json` (22 sidor × 30 tabbstopp), `modals.json`, `contrast.json`, `misc.json`, `register.json`, `mobilnav.json`, `skip2.json`, `final.json`, `final2.json`, `lix.json`.

---

## 6 · Prioriterad åtgärdslista

| # | Fynd | WCAG | Storlek | Varför i den ordningen |
|---|---|---|---|---|
| 1 | 1 · Skip-länken osynlig vid fokus | 2.4.7, 2.4.1 | S | Första tabbtrycket på varje sida i hela portalen och på prod. En CSS-rad, och den avslöjar ett lager-fel som kan dölja mer |
| 2 | 2 · 45 osynliga tabbstopp på mobil / 400 % zoom | 2.4.3, 2.4.7 | M | Gör tangentbord på telefon obrukbart. `inert` löser både fokus och skärmläsarträdet |
| 3 | 4 · Namnlösa flikar på mobil | 4.1.2 | S | Dagbokens fyra flikar är hela sidans navigation |
| 4 | 5 · 8 namnlösa ikonknappar | 4.1.2 | S | En av dem raderar dagboksinlägg. Tredje granskningen i rad |
| 5 | 8 · Registreringens fel når inte hjälpmedel | 3.3.1, 4.1.3 | S | Första sidan en ny deltagare möter, verifierat i prod |
| 6 | 3 · Publika skip-länkar | 2.4.1 | S | 133 guidesidor + verktygsmallen, två malländringar |
| 7 | 13 · Redogörelsen påstår osanningar | lag (2023:254) | S | Rättslig exponering, och den kan skrivas om samma dag |
| 8 | 7 · 29 kontrastnoder | 1.4.3 | M | Mekaniskt; sätt CI-vakt på de fyra värsta paren |
| 9 | 6 · Nästlade interaktiva element | 4.1.2 | M | 46 noder, men beteendet är AT-beroende snarare än blockerande |
| 10 | 11 · Rubrikhopp | 1.3.1, 2.4.6 | M | 9 sidor, mekaniskt |
| 11 | 9, 15, 10 · Modal- och menysemantik | 4.1.2, 2.4.3 | S | Tre komponenter |
| 12 | 12 · `<main>` saknas publikt | 1.3.1 | S | Login, Register, Landing, Tillgänglighet |
| 13 | 14, 16, 17, 18 | 2.1.1, 4.1.2, 1.4.1 | XS | Snabba |
| 14 | 19, 20, 21 | god praxis | S | Tas med när respektive yta ändå rörs |
