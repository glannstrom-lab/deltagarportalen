# Visuell mobilgranskning — Jobin/Deltagarportalen

**Datum:** 2026-08-04
**Metod:** Playwright/Chromium, `isMobile: true, hasTouch: true, deviceScaleFactor: 3`.
Primär viewport 390×844 (iPhone 12), sekundär 360×640. Inloggad med testkontot mot prod-databasen.
Hit-test = `document.elementFromPoint()` på 5 provpunkter per knapp (centrum + 4 hörn indragna 25 %, max 8 px),
kompletterat med faktiska `page.tap()`-anrop där hit-testet indikerade blockering.
**Sidor mätta:** 33 st på 390×844, 26 st på 360×640.
**Långsamt nät:** CDP `Network.emulateNetworkConditions`, 400 kbit/s, 150 ms latens — mätt mot **prod-bygget**
(`client/dist` via `vite preview`, byggt 2026-08-04 21:18), inte mot dev-servern.
**Skärmbilder:** `shots-mobil/` (33 sidbilder 390×844, 26 st 360×640, plus regressions- och nätbilder).
**Ingen kod ändrad. Inga rader skapade eller raderade i databasen.**

---

## 1. Regressionskontroll av de åtgärdade mobilbuggarna

### UX10 — cookiebannern vs bottennavets fem hubbknappar → ✅ HÅLLER

Rensade `jobin_cookie_consent` + `jobin_cookie_preferences`, laddade om `/#/oversikt` inloggad, väntade in bannern.

| Knapp | Före fixen (roadmap) | 390×844 nu | 360×640 nu |
|---|---|---|---|
| Översikt | 5/5 blockerade | **0/5** | **0/5** |
| Söka jobb | 5/5 blockerade | **0/5** | **0/5** |
| Karriär | 5/5 blockerade | **0/5** | **0/5** |
| Resurser | 5/5 blockerade | **0/5** | **0/5** |
| Din vardag | 5/5 blockerade | **0/5** | **0/5** |

Inga blockerare rapporterade på någon provpunkt. Funktionellt bevis utöver hit-testet: en riktig
`tap()` på Karriär-knappen **med bannern uppe** navigerar `/#/oversikt → /#/karriar` på båda viewporterna.
Geometrin stämmer: bannerkortet slutar på y=828, navet börjar på y=779 — kortet ligger ovanpå men
wrappern är `pointer-events-none` och kortet `pointer-events-auto` (`CookieConsent.tsx:95-99`),
så den tomma paddingytan äter inte längre tappar.
Skärmbild: `shots-mobil/ux10-oversikt-banner-390x844.png`, `…-360x640.png`.

### UX16 — CV-sidans fixerade knapprad vs bottennavet → ✅ HÅLLER (men se M2)

`/#/cv`, samtycke satt, onboardingen avklarad.

| Knapp | Före fixen | 390×844 nu | 360×640 nu |
|---|---|---|---|
| Alla fem navknappar | 5/5 blockerade | **0/5** | **0/5** |

Geometrin: knappraden ligger y=705–780 (`z-40`), navet y=779–844 (`z-30`), `--bottom-nav-h: 64px`
är satt. Raden ligger alltså **ovanför** navet precis som avsett.
**Men fixen har skapat en ny kollision — se M2 nedan.**
Skärmbild: `shots-mobil/ux16-cv-390x844.png`, `shots-mobil/cv-bar-vs-nav.png`.

### UX23 — cookiebannern vs inloggningsknappen på `/#/login` → ❌ KVARSTÅR, oförändrat

| Viewport | Provpunkter blockerade | Blockerare |
|---|---|---|
| 390×844 | **5/5** | `P.text-sm.text-stone-600`, `DIV.flex-1`, `DIV.flex.items-start.gap-4`, `svg` |
| 360×640 | **5/5** | `DIV.flex.flex-wrap.gap-3`, `DIV.flex.items-start.gap-4` |

Detta är inte bara friktion. En riktig `page.tap('button[type=submit]')` **timeoutar efter 5 s** på
båda viewporterna — Playwright loggar `<p class="text-sm…">Vi använder nödvändiga cookies…</p> …
subtree intercepts pointer events` i 20+ omförsök. Inloggningen är alltså faktiskt otillgänglig
tills man svarat på cookiefrågan.
Skärmbild: `shots-mobil/ux23-login-banner-390x844.png`, `…-360x640.png`. Se fynd **M1**.

### Bonus: `/#/wellness` horisontell överspillning → ✅ ÅTGÄRDAD

UX22 rapporterade 4 px överspillning på `/#/wellness`. Nu: **0 px** på både 390×844 och 360×640.
**Samtliga 33 mätta sidor har `scrollWidth - clientWidth = 0`.**

---

## 2. Fynd

### M1 — Cookiebannern gör inloggningsknappen otappbar

- **Sida:** `/#/login` (samt `/#/register`, samma banner och samma geometri)
- **Allvarlighet:** **HÖG** (roadmapen har MEDEL — höjs: det här är portalens ytterdörr och
  knappen är bevisligen inte tryckbar, inte bara delvis skymd)
- **Mätvärde:** hit-test **5/5 provpunkter blockerade** på 390×844 *och* 360×640.
  Riktig `tap()` **timeoutar** (`page.tap: Timeout 5000ms exceeded`). Knappen ligger y=520–570;
  bannerkortet y=476–828 på 390×844 och y=212–624 på 360×640 — kortet täcker knappen helt.
- **Orsak:** `client/src/components/CookieConsent.tsx:95-99`. Wrappern är
  `fixed bottom-0 left-0 right-0 z-50` med `paddingBottom: calc(1rem + var(--bottom-nav-h, 0px))`.
  På publika sidor är `--bottom-nav-h` = 0, så kortet lägger sig längst ned — och kortet är högt
  (352 px på 390×844, 412 px på 360×640) eftersom rubrik, brödtext, tre knappar och två
  policylänkar staplas i en kolumn på smal skärm. Bannern saknar backdrop, så den läser som ett
  vanligt kort och inte som något man måste besvara först — användaren ser en inloggningsknapp
  som "inte fungerar".
- **Åtgärd:** ge bannern en backdrop (`fixed inset-0 bg-black/40`) + `role="dialog"`,
  `aria-modal="true"` och initialt fokus i kortet, så att den läser som det spärrläge den är.
  Alternativt en kompakt variant under `sm`: en rad text + två knappar, med detaljerna bakom
  "Anpassa". Att bara flytta kortet räcker inte — det är 352–412 px högt och kommer täcka
  *något* på en 640 px hög skärm.
- **Storlek:** S (backdrop + fokus) / M (kompakt mobilvariant).

### M2 — CoachWidget-knappen täcker "Nästa" i CV-byggaren (regression införd av UX16-fixen)

- **Sida:** `/#/cv`
- **Allvarlighet:** **HÖG** — primäråtgärden i ett av portalens tyngsta verktyg går inte att trycka.
- **Mätvärde:** hit-test på knappradens tre knappar:
  `"Föregående"` 144×50 → **0/5**, ikonknappen 48×48 → **0/5**,
  **`"Nästa"` 142×48 → 2/5 blockerade**, blockerare `IMG.w-10.h-10.rounded-full` / `DIV.flex.-space-x-3`
  (coach-avatarerna). Centrumpunkten är en av de blockerade → en riktig
  `tap()` på knappen **timeoutar efter 5 s**.
  Geometri: "Nästa" x=232–374, y=719–767. CoachWidget x=292–374, y=710–764,
  `opacity: 1`, `pointer-events: auto`, `transform: none` — alltså fullt synlig och aktiv, inte
  dold av scroll-logiken. Överlappet är 82×54 px, dvs. 58 % av knappens bredd.
- **Orsak:** kollision mellan två fixerade lager som båda är korrekta var för sig:
  - `client/src/pages/CVBuilder.tsx:1312-1315` — knappraden fick `style={{ bottom: 'var(--bottom-nav-h, 0px)' }}` i UX16-fixen.
  - `client/src/components/CoachWidget.tsx:142` — `'group fixed z-40 bottom-20 sm:bottom-6 right-4 sm:right-6'`, dvs. `bottom: 80px`.

  **Före UX16-fixen fanns ingen konflikt:** raden låg på `bottom: 0` → y=769–844, widgeten på
  y=710–764, 5 px mellanrum. UX16 flyttade upp raden 64 px till y=705–780 och sköt in den rakt
  under widgeten. Buggen är alltså direkt införd av fixen — bottennavet blev fritt, men
  "Nästa" blev blockerad i stället.
- **Åtgärd:** CoachWidget (och `SamlingarFab`, `client/src/components/SamlingarFab.tsx:154-155`,
  som staplar ovanpå den) behöver samma `--bottom-nav-h`-medvetenhet som bannern och CV-raden
  fick — plus ett andra offset för sidor som har en egen verktygsrad. Enklast: låt CV-raden
  exportera sin höjd i en variabel (`--tool-bar-h`) på samma sätt som `HubBottomNav` sätter
  `--bottom-nav-h`, och låt FAB:arna räkna `bottom: calc(80px + var(--tool-bar-h, 0px))`.
  Bevisbild: `shots-mobil/cv-nasta-vs-fab.png` — avatarstacken ligger synligt över ordet "Nästa",
  bara "Näs" syns.
- **Storlek:** S–M.

### M3 — Mobilmenyerna är alltid monterade utan `inert`/`aria-hidden` → 36 tabbara element utanför skärmen

- **Sida:** samtliga inloggade sidor (36 på 31 av 33 sidor, 48 på `/#/cv`, 37–39 på några)
- **Allvarlighet:** **MEDEL–HÖG** (WCAG 2.1 AA, 2.4.3 Focus Order + 2.4.7 Focus Visible)
- **Mätvärde:** verifierat med riktiga Tab-tryck på `/#/oversikt`, inte bara geometri:

  | Tab | Element | left | Status |
  |---|---|---|---|
  | 1 | BUTTON "Notifikationer" | 230 | på skärmen |
  | 2 | BUTTON "Min profil" | 280 | på skärmen |
  | 3 | BUTTON "Meny" | 330 | på skärmen |
  | 4 | BUTTON "Stäng" | **610** | **utanför** |
  | 5 | BUTTON "ÖVERSIKT" | **398** | **utanför** |
  | 6–12 | A "Översikt", "Min profil", "Din konsulent", "Ditt AI-team", "Nätverk", "Kunskapsbank", "Dina dokument" | **398** | **utanför** |

  **9 av de 12 första tabbstoppen hamnar utanför viewporten.** Efter tre tabbar är
  tangentbordsanvändaren fast i en osynlig meny och måste tabba igenom 36 element för att komma
  tillbaka till sidan. Uppmätta drawer-attribut:

  | Drawer | left | bredd | visibility | pointer-events | inert | aria-hidden | tabbara |
  |---|---|---|---|---|---|---|---|
  | Höger (huvudmeny) | 390 | 280 | `visible` | `auto` | nej | — | **32** |
  | Vänster (profilmeny) | −260 | 260 | `visible` | `auto` | nej | — | **4** |

  Identiskt på 360×640 (36 fällor på 24 av 26 sidor).
- **Orsak:** `client/src/components/Layout.tsx:246-252` (vänster profilmeny) och
  `client/src/components/Layout.tsx:340-346` (höger huvudmeny). Båda renderas alltid och göms
  enbart med `translate-x-full` / `-translate-x-full`. Transform flyttar elementet visuellt men
  tar det inte ur tabbordningen, och `visibility` förblir `visible`.
- **Åtgärd:** sätt `inert` (och `aria-hidden="true"`) på drawern när den är stängd — en attribut-
  rad per drawer, styrd av `isMenuOpen` / `isProfileOpen`. Alternativt `visibility: hidden` i
  stängt läge med `transition` på `visibility` så animationen behålls.
- **Storlek:** S.

### M4 — Fyra 48×48-träffytor i headern med 2 px mellanrum

- **Sida:** samtliga inloggade sidor (headern är global)
- **Allvarlighet:** **MEDEL** (WCAG 2.5.8 Target Size, AA i 2.2 — och konkret felträffrisk för
  målgruppen)
- **Mätvärde:** uppmätta träffytor på 390×844:
  `Öppna stöd och hjälp` x=180 (48×48) · `Notifikationer` x=230 (48×48) ·
  `Min profil` x=280 (48×48) · `Meny` x=330 (48×48).
  Delning 50 px, träffyta 48 px → **exakt 2 px mellanrum** mellan tre intilliggande par.
  Dessa tre par är de minsta avstånden på **31 av 33 sidor**. Ett tumtryck som glider 3 px landar
  på fel knapp — och grannen till "Min profil" är "Meny", som öppnar hela drawern.
- **Orsak:** `client/src/components/Layout.tsx:198` — `<div className="flex items-center gap-0.5">`
  (`gap-0.5` = 2 px). Knapparna deklareras `w-8 h-8` men får 48×48 träffyta av den globala
  touch-target-regeln; mellanrummet följer inte med.
- **Åtgärd:** `gap-0.5` → `gap-2` (8 px). Headern har gott om plats: logotypen slutar på x=104
  och första ikonen börjar på x=180, dvs. 76 px oanvänt utrymme.
- **Storlek:** XS.

### M5 — Långsamt nät: 10 s statisk splash, sedan spinner — aldrig ett skelett

- **Sida:** `/#/oversikt`, `/#/jobb`, `/#/cv` (mätt mot prod-bygget, 400 kbit/s, 150 ms latens)
- **Allvarlighet:** **MEDEL**
- **Mätvärde:**

  | Sida | App-skal (header/nav) | Första skelett | Första spinner | Meningsfullt innehåll |
  |---|---|---|---|---|
  | `/#/oversikt` | 10,9 s | **aldrig** | 10,2 s | **14,5 s** |
  | `/#/jobb` | 10,9 s | **aldrig** | 10,2 s | **14,5 s** |
  | `/#/cv` | 10,9 s | **aldrig** | 10,6 s | **16,7 s** |

  Vad användaren faktiskt ser, sekund för sekund (`/#/oversikt`):
  `0,6 s` → "Laddar Jobin..." · `3,1 s` → "Laddar Jobin..." · `6,3 s` → "Laddar Jobin..." ·
  `9,1 s` → "Laddar Jobin..." · `12 s` → "Laddar sida..." (spinner) → `14,5 s` innehåll.

  Alltså **~10 s helt statisk splash utan framdriftsindikation**, följt av **~4,5 s med enbart en
  snurra**. Ingen av de tre sidorna visar ett enda skelett (`animate-pulse`-element = 0 hela vägen).
- **Orsak:**
  - Splashen är den statiska markupen i `client/index.html:221` — den byts först när
    entry-bundlen körts. Entry är `index-XP6-YMMk.js` **135,0 kB brotli**; vid 400 kbit/s = 50 kB/s
    är det ~2,7 s bara för den filen, och den kommer efter HTML + CSS + preloads.
  - Spinnern är `RouteLoadingFallback` i
    `client/src/components/RouteErrorBoundary.tsx:255-273` — en `Loader2` med texten
    "Laddar sida...". Det är den enda `Suspense`-fallbacken för samtliga lazy-routes
    (`client/src/App.tsx:87`).
  - **Skelettkomponenterna finns redan men är dödkod:** `DashboardSkeleton`
    (`client/src/components/dashboard/DashboardSkeleton.tsx`) importeras **bara av sin egen testfil**,
    och `client/src/components/ui/Skeleton.tsx` har **0 importörer** i hela `client/src`.
- **Åtgärd:** byt `RouteLoadingFallback` mot en skelettvariant per hub — komponenterna är redan
  skrivna och testade, de saknar bara konsument. Det tar bort de 4,5 sekunderna med enbart snurra.
  De första 10 sekunderna kräver ett separat grepp (koddelning av entry).
  Bevisbilder: `shots-mobil/slow-prod-oversikt.png`, `slow-oversikt-3s.png` … `-30s.png`.
- **Storlek:** S för skelett-fallbacken, M för entry-delningen.

### M6 — 12 px text i verktygssidornas hjälptexter

- **Sida:** `/#/personal-brand` (16 st), `/#/knowledge-base` (13 st), `/#/cover-letter` (5),
  `/#/linkedin-optimizer` (5), `/#/ai-team` (3), `/#/job-search` (2), åtta sidor med 1
- **Allvarlighet:** **LÅG–MEDEL**
- **Mätvärde:** samtliga förekomster är exakt **12 px** — inga mindre. **20 av 33 sidor har noll
  förekomster**, vilket är en klar förbättring mot UX22:s "12 px systematiskt på alla 31 sidor".
  Cookiedialogens knappar, som UX22 pekade ut som värst, mäter numera ≥14 px.
  Värsta enskilda: `"Visa tips"` × 5 på `/#/personal-brand` — en **knapp** på 12 px, alltså
  interaktiv text under gränsen.
- **Orsak:** `text-xs` (0,75 rem = 12 px) på:
  - `client/src/pages/personal-brand/BrandAuditTab.tsx:512` — `className="ml-8 mt-1 text-xs …"` på "Visa tips"-knappen
  - `client/src/pages/KnowledgeBase.tsx:249` — `className="text-xs font-medium text-gray-500 …"` på "N artiklar"
  - `client/src/pages/career/LaborMarketTab.tsx:199` — `text-xs` på datakällefoten
- **Åtgärd:** höj `text-xs` → `text-sm` på interaktiva element först (knappen på BrandAuditTab är
  den enda som är både 12 px *och* klickbar). Rent dekorativa räknare kan vänta.
- **Storlek:** XS per förekomst.

### M7 — För liten träffyta på källhänvisningen i Karriär

- **Sida:** `/#/career` (fliken Arbetsmarknad)
- **Allvarlighet:** **LÅG**
- **Mätvärde:** `<a>Arbetsförmedlingen</a>` mäter **141×21 px** — enda träffytan under 44 px på
  hela svepet. Alla övriga 32 sidor har `tapMin = 48 px`. Identiskt på 360×640.
- **Orsak:** `client/src/pages/career/LaborMarketTab.tsx:202-209` — inline-länk i en `text-xs`-fot
  utan egen padding.
- **Åtgärd:** `inline-block py-2` på länken ger 44 px höjd utan att bryta radflödet.
- **Storlek:** XS.

---

## 3. Sammanställning per sida (390×844, inloggad)

Överspillning = `document.documentElement.scrollWidth − clientWidth`.
Tabbfällor = tabbara element med `getBoundingClientRect().left >= innerWidth` eller `right <= 0`,
exklusive `[inert]`/`[aria-hidden]`.
"<8 px-par" = intilliggande träffytepar med mindre än 8 px mellanrum (de tre översta på varje sida
är alltid headerns ikonrad, M4).

| Sida | Överspill | Minsta tap target | Antal <14px-texter | Tabbfällor | <8px-par | Nav blockerad |
|---|---|---|---|---|---|---|
| /#/oversikt | 0 px | 48 px | 1 | 36 | 8 | 0/5 |
| /#/jobb | 0 px | 48 px | 0 | 36 | 3 | 0/5 |
| /#/karriar | 0 px | 48 px | 0 | 36 | 3 | 0/5 |
| /#/resurser | 0 px | 48 px | 0 | 36 | 3 | 0/5 |
| /#/min-vardag | 0 px | 48 px | 0 | 36 | 3 | 0/5 |
| /#/cv | 0 px | 48 px | 0 | **48** | 8 | 0/5 · **"Nästa" 2/5 (M2)** |
| /#/cover-letter | 0 px | 48 px | 5 | 36 | 4 | 0/5 |
| /#/job-search | 0 px | 48 px | 2 | 39 | 3 | 0/5 |
| /#/applications | 0 px | 48 px | 1 | 37 | 3 | 0/5 |
| /#/spontanansökan | 0 px | 48 px | 0 | 37 | 3 | 0/5 |
| /#/interview-simulator | 0 px | 48 px | 0 | 36 | 3 | 0/5 |
| /#/salary | 0 px | 48 px | 0 | 36 | 3 | 0/5 |
| /#/international | 0 px | 48 px | 0 | 37 | 3 | 0/5 |
| /#/linkedin-optimizer | 0 px | 48 px | 5 | 36 | 4 | 0/5 |
| /#/career | 0 px | **21 px** (1 st <44) | 0 | 38 | 4 | 0/5 |
| /#/interest-guide | 0 px | 48 px | 0 | 37 | 3 | 0/5 |
| /#/skills-gap-analysis | 0 px | 48 px | 0 | 36 | 3 | 0/5 |
| /#/personal-brand | 0 px | 48 px | **16** | 37 | **19** | 0/5 |
| /#/education | 0 px | 48 px | 0 | 36 | 4 | 0/5 |
| /#/knowledge-base | 0 px | 48 px | **13** | 36 | 5 | 0/5 |
| /#/resources | 0 px | 48 px | 0 | 36 | **16** | 0/5 |
| /#/print-resources | 0 px | 48 px | 0 | 36 | 3 | 0/5 |
| /#/externa-resurser | 0 px | 48 px | 0 | 36 | 5 | 0/5 |
| /#/ai-team | 0 px | 48 px | 3 | 36 | **17** | 0/5 |
| /#/nätverk | 0 px | 48 px | 0 | 36 | 6 | 0/5 |
| /#/wellness | 0 px | 48 px | 1 | 37 | 8 | 0/5 |
| /#/diary | 0 px | 48 px | 1 | 36 | 8 | 0/5 |
| /#/calendar | 0 px | 48 px | 0 | 36 | 10 | 0/5 |
| /#/exercises | 0 px | 48 px | 0 | 36 | 5 | 0/5 |
| /#/my-consultant | 0 px | 48 px | 1 | 36 | 4 | 0/5 |
| /#/profile | 0 px | 48 px | 1 | 36 | 4 | 5/5 * |
| /#/settings | 0 px | 48 px | 1 | 36 | 3 | 0/5 |
| /#/help | 0 px | 48 px | 0 | 36 | 3 | 0/5 |
| **/#/login** (utloggad) | 0 px | 48 px | — | — | — | — · **"Logga in" 5/5 (M1)** |

\* `/#/profile` blockeras av välkomstmodalen (`Välkommen! Det här är din profil…`) som har korrekt
backdrop och `role`-hantering. **Detta är inte en bugg** — kontrollerat: efter "Hoppa över" blir
navet **0/5 på alla fem knappar** och modalen återkommer inte efter omladdning (den persisteras).
Skärmbilder: `shots-mobil/page-profile.png`, `profile-after-dismiss.png`.

**360×640 (26 sidor):** identiskt mönster — 0 px överspillning överallt, `tapMin` 48 px utom
`/#/career` (21 px), samma 36–48 tabbfällor, samma `navBlocked` 0/5 (utom `/#/profile`,
välkomstmodalen). Inget fynd är unikt för den smalare skärmen.

---

## 4. Falska spår som kontrollerades bort

- **FAB:ar som "överlappar bottennavet" på `/#/ai-team`** (uppmätt 15 px och 39 px överlapp) är
  **inte** en bugg. Knapparna var mitt i `CoachWidget`s dölj-vid-scroll-läge:
  `translate-y-[220%]` (= 118,8 px av 54 px höjd) tillsammans med `opacity: 0` och
  `pointer-events: none` (`client/src/components/CoachWidget.tsx:150`). Geometrin flyttas, men
  elementet är osynligt och otappbart. Hit-testet på navet gav 0/5 blockerade på sidan.
  Ren geometrisk överlappsmätning ger falska positiva här — opacitet och `pointer-events` måste
  läsas med.
- **`z-index: 9999`-elementet på `/#/profile`** (358×812 px, tomt `class`) har
  `pointer-events: none` och blockerar ingenting. Ofarligt.
- **UX22:s "`/#/wellness` spiller över 4 px"** stämmer inte längre — 0 px på båda viewporterna.
- **UX22:s "12 px systematiskt på alla 31 sidor"** stämmer inte längre — 20 av 33 sidor har noll
  förekomster, och cookiedialogens knappar (som pekades ut som värst) är nu ≥14 px.

---

## 5. Rekommenderad ordning

1. **M2** — CV:s "Nästa" (HÖG, regression från i går, S–M)
2. **M1** — inloggningsknappen (HÖG, ytterdörren, S för backdrop)
3. **M3** — `inert` på de två drawerna (MEDEL–HÖG, WCAG, S — en attributrad per drawer)
4. **M4** — `gap-0.5` → `gap-2` i headern (MEDEL, XS)
5. **M5** — koppla in de befintliga skelettkomponenterna i `RouteLoadingFallback` (MEDEL, S)
6. **M6/M7** — textstorlek och länkhöjd (LÅG, XS)

M2, M3 och M4 är alla en–tre raders ändringar med mätbar effekt.
