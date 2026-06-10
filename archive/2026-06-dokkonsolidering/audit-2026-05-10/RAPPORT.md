# Produktionsaudit av jobin.se — 2026-05-10

**Miljö:** https://jobin.se (produktion)
**Verktyg:** Playwright (Chromium, desktop 1440×900 + mobil iPhone 12 390×844)
**Testkonto:** `claude-playwright-test@jobin.se` (deltagarroll)
**Omfång:** 41 sidor, 34 flikar, 75 skärmdumpar, kärnflöden testade

---

## TL;DR

Portalen fungerar på det stora hela. Inloggning, navigation, hubbar och de flesta sidor renderar utan kraschar. **Ingen sida visar error boundary eller blank state.** Men:

- 4 viktiga buggar (notifications-API, mobil overlap, AI Team dubbel-render, oöversatta engelska kategorier)
- 6 design-avvikelser från `docs/DESIGN.md` (gradient-knappar, hub-färgade hero, dubblerad navigation)
- 5 navigations-/UX-luckor (saknad CTA, inkonsekvent logo, redundanta knappar)

Sammanlagt **29 fel** loggade i `data/findings.json`.

---

## 🐛 Buggar (sorterade efter allvarlighet)

### KRITISKA

**B1. `notifications`-endpoint returnerar ERR_ABORTED på flera sidor**
Förekomst: Dashboard, Interest Guide (occupations + explore-tab), Calendar, Exercises, My Consultant.
Konsolfel: `[ERROR][API] Failed to load notifications {error: Object, errorMessage: [object Object], stack: undefined}`
Nätverk: `GET .../rest/v1/notifications?select=*&user_id=eq.<id>&order=created_at.desc&limit=50 — net::ERR_ABORTED`
**Effekt:** Klock-/notisikonen i topbaren får aldrig data. Användarna ser ALDRIG någon notis.
**Trolig orsak:** Antingen RLS-policy saknas på `notifications`-tabellen, eller anropet aborteras innan svar (kan vara request-cleanup vid navigation som race-conditionar i en oannullerad fetch).
**Felsöksväg:** `npx supabase db query --linked "SELECT polname, polcmd, polqual::text FROM pg_policies WHERE tablename='notifications';"`

**B2. AI Team renderar SIDAN DUBBELT (`/ai-team`)**
Skärmdump: `screenshots/41-ai-team.png`. Två fullständiga kopior av samma sida ligger ovanpå varandra. En onboarding-modal flyter mitt emellan. Den övre kopian är skarp, den undre är skuggad.
**Effekt:** Förvirrande, scroll fungerar fel, användare ser dubbla agentkort.
**Trolig orsak:** Komponenten monteras två gånger (kanske både i hub-grid och som direktroute), eller en gammal portal-modal som inte stängs har lagt sig ovanpå.
**Felsöksväg:** Sök `<AITeam` och `Modal` i `client/src/pages/AITeam.tsx`; kontrollera att `useEffect`-cleanups stänger eventuella portaler vid unmount.

**B3. Bottennav överlappar innehåll på mobil**
Skärmdump: `screenshots/mobile-oversikt.png`. Det fjärde HubCard ("Mina vardagliga rutiner") trycks delvis under den fixerade bottennavigationen.
**Effekt:** Information döljs, knappar svåra att klicka.
**Trolig orsak:** `<main>` saknar `padding-bottom: calc(safe-area-inset-bottom + 64px)` på mobile-breakpoint.
**Felsöksväg:** `client/src/components/layout/HubBottomNav.tsx` — verifiera att sidlayout har bottenmarginal motsvarande nav-höjd + safe-area.

**B4. "Skriv ut resurser"-sidan visar oöversatta engelska kategori-namn**
Skärmdump: `screenshots/52-print-resources.png`. Kategorierna heter `getting-started`, `job-search`, `interview`, `wellness`, `accessibility`, `job-market`, `tools`, `digital-presence`, `self-awareness`, `networking`, `employment-law`, `career-development`, `easy-swedish`.
**Effekt:** Slug-namn i en svensk-språkig portal — särskilt allvarligt eftersom målgruppen inkluderar låg svenska-kunskap-användare. Kategorin "easy-swedish" som visas på engelska är ironisk.
**Felsöksväg:** Sannolikt mappar `PrintableResources.tsx` direkt på `category`-fältet utan i18n-lookup. Lägg till en `categoryLabel(slug)`-helper med svenska översättningar.

### MEDEL

**B5. Vendor-chunk för animation-bibliotek failar att ladda på dashboard**
`GET https://www.jobin.se/assets/vendor-animation-TQ4QLjCX.js — net::ERR_ABORTED`
**Effekt:** Framer Motion-animationer kan saknas på första load. Risk för `Cannot read property` på grund av missing-import.
**Trolig orsak:** Code-splitting + browser-cache eller CDN-edge-fel. Kan också vara att chunken bytts namn vid ny deploy och clienten har gammal index.html cachad.
**Lösning:** Kontrollera Vercel-cache-headers (`Cache-Control: public, max-age=0, must-revalidate` på `index.html`).

**B6. `diary_entries` och `network_contacts` HEAD-requests failar globalt**
Förekomst: Dashboard, Översikt-hub, Översikt-historik, Min vardag-hub, Career→Relocation-tab.
`HEAD .../diary_entries?select=id&user_id=eq.<id> — net::ERR_ABORTED`
`HEAD .../network_contacts?select=id&user_id=eq.<id> — net::ERR_ABORTED`
**Effekt:** Antagligen "antal poster"-räknare som inte fungerar. Hub-cards visar troligen "Inga händelser än" även när det finns data.
**Felsöksväg:** Sök efter `HEAD`-requests i `client/src/services/`. PostgREST stöder HEAD bara om RLS tillåter `select`. Kontrollera RLS-policies för dessa tabeller.

**B7. `/career/relocation` saknar data — `job_applications` + `cover_letters` HEAD-requests failar**
Samma mönster som B6 men på flytt-tab.

**B8. CV-byggaren saknar tydligt "Skapa nytt CV"-CTA**
Audit-skriptet rapporterade: `Hittade inget tydligt "Skapa CV"-CTA på /cv`. Mall-galleriet visas direkt utan en huvudknapp. Förstagångs-användare som vill "börja" får ingen ledning — bara en kortlek av mallar.
**Lösning:** Antingen lägg till en stor "Skapa CV nu"-knapp i hjältesektionen, eller tydlig instruktionsetikett "Välj en mall för att börja".

**B9. Cover Letter-sidan har 0 input-fält i HTML**
Auditen detekterade noll `<textarea>` eller `<input>`-element vid första laddning. Sidan visar mall-väljare först (skärmdump `21-cover-letter.png`). Det är en wizard, inte ett formulär — OK i sig, men verifiera att den faktiskt fungerar att skriva.

### LÅGA

**B10. Logotyp inkonsekvent mellan publika sidor**
- `/login`: Liten grön kub-logo med litet "j" (modern, ren).
- `/register`: Stor pixelig "JOBIN" rund logo med ljusstrålar (gammal estetik).
- App-topbar: "j" + "jobin.se" textlogo.
Tre olika logon på samma produkt.
**Lösning:** Använd en logotyp överallt. Den moderna kub-versionen är genomgående bäst.

**B11. Settings: Förnamn/efternamn-fälten är tomma utan placeholder/hjälp**
Skärmdump `71-settings.png`. Ny användare ser tomma rutor utan exempel.
**Lösning:** Lägg till `placeholder="Anna"` / `placeholder="Andersson"`.

**B12. "Mina ansökningar": dubbla "Ny ansökan"-knappar**
Skärmdump `23-applications.png`. En i hero, en över Filter-knappen. Funktionellt OK men visuellt redundant.

**B13. "Mina ansökningar": dubbla tomtillstånd**
Pipeline-vyn visar 4 tomma kolumner ("Intresserad/Sparad/Ansökt/Granskning") MED tomma ikoner OCH en stor "Inga ansökningar än" hero under. Det blir två tomtillstånd staplade.
**Lösning:** Visa antingen pipeline-skelettet ELLER hero — inte båda.

---

## 🎨 Design-avvikelser från DESIGN.md

DESIGN.md (aktiv från 2026-04-30) säger explicit hur portalen ska se ut. Följande punkter bryter mot det:

**D1. Hub-landningssidor har full hub-färg som hero, inte neutral grå**
Skärmdumpar: `12-hub-jobb.png` (persika), `13-hub-karriar.png` (rosa), `14-hub-resurser.png` (sky), `15-hub-vardag.png` (lavendel).
DESIGN.md § "Header / Hjältesektion": *"Övriga hub-sidor (`/jobb`, `/karriar`, `/resurser`, `/min-vardag`) använder standard neutral PageHeader med 4px vänsterkant i sin hub-färg."*
**Faktiskt:** Alla 4 hub-landningssidor har hub-färg som FULL bakgrundsfärg i hero. Ingen är neutral grå.
**Lösning:** Antingen uppdatera DESIGN.md (om beslutet är ändrat) eller ändra `HubPage.tsx` till neutral header. Om hub-färg är medvetet val: dokumentera det.

**D2. Gradient-knapp på Intresseguide ("Starta Intresseguiden")**
Skärmdump `31-interest-guide.png`. Stor knapp `bg-gradient-to-r from-indigo-500 to-purple-600`.
DESIGN.md § "Knappar": *"Förbjudet: gradient-knappar (`bg-gradient-to-r from-X to-Y`). Använd platt `--c-solid`."*
**Lösning:** Byt till platt karriär-rosa solid (`#B85363`).

**D3. Gradient-knapp på Skills Gap ("Analysera gapet")**
Skärmdump `32-skills-gap.png`. Lila/rosa gradient.
**Lösning:** Samma som D2 — solid karriär-rosa.

**D4. Gradient-modal på Profile (welcome-onboarding)**
Skärmdump `70-profile.png`. Modal-header med turkos→blå→lila→rosa-gradient.
DESIGN.md § "Header / Hjältesektion: Vad som FÖRBJÖD": *"Inga gradients i header"*.
**Lösning:** Använd hub-färgens platta solid eller en mjukare pastell.

**D5. Help-sidan: solid mörkblå sektionsbanderoller**
Skärmdump `72-help.png`. 4 sektioner ("Komma igång", "CV & personligt brev", "Jobbsökning", "Karriär & utveckling") har solida mörkblå rubrikbanderoller.
DESIGN.md § "Pasteller bor i innehållet": *"KPI-kort, sektionsbakgrunder, tabs, ikon-badges använder pastellerna. Inte rubrikbanderoller."*
**Lösning:** Byt till pastell `--info-bg` eller white + border.

**D6. Wellness "Spara reflektion"-knapp i pastell istället för solid**
Skärmdump `60-wellness.png`. Knappen är ljus lavendel-pastell istället för solid `--wellbeing-solid`. Knappar ska enligt DESIGN.md vara platt `--c-solid` med vit text. Här är den knappt synlig.
**Lösning:** Byt till solid lavendel `#7058A8` med vit text.

---

## 🧭 Navigation & arkitektur

**N1. Nätverk dubblerad mellan Resurser och Min vardag**
Skärmdumpar `14-hub-resurser.png` (innehåller Nätverk) och `15-hub-vardag.png` (innehåller också Nätverk).
DESIGN.md: *"En sida får bara tillhöra en hub — ingen dubblering tillåten."*
**Faktiskt:** Nätverkssidan listas i båda hubbarna men sidobaren visar den bara under Resurser. Det är en regression mot designprincipen.
**Felsöksväg:** Kontrollera `client/src/components/layout/navigation.ts::navHubs[].memberPaths` — `/nätverk` ska bara förekomma en gång.

**N2. Min vardag-sidobar saknar Nätverk men huben innehåller det**
Sidobaren visar 5 sub-items för Min vardag (Hälsa, Dagbok, Kalender, Övningar, Min konsulent). Hub-landningssidan visar 6 features inkl Nätverk.
**Lösning:** Bestäm vilken hub Nätverk hör till och uppdatera båda sidorna konsekvent.

**N3. Dashboard (`/`) och Hub Översikt (`/oversikt`) ser identiska ut**
Skärmdumpar `10-dashboard.png` och `11-hub-oversikt.png` är pixelidentiska. Det är förmodligen avsiktligt — `/` är redirected till `/oversikt` eller renderar samma komponent. Men då bör `/dashboard` ha sin egen redirect (det har det) och `/`-routet kan använda `<Navigate>` istället för att duplicera komponenten.

**N4. Hub-sidornas funktionsstats säger "Inga händelser än" trots att HEAD-requests failar**
Detta är delvis en bugg (B6) men också en UX-fråga: när data saknas på grund av nätverksfel ska användaren se "Kunde inte ladda" — inte "0". Tyst fail-soft luras användaren tro att den inte har gjort något.

---

## 💡 Designförslag och förbättringar

### Prioritet 1 — låg insats, hög effekt

1. **Enhetlig logotyp överallt.** Föreslå den moderna grön-kub-versionen från login.
2. **Lägg till stort tydligt CTA i CV-byggaren ("Skapa CV nu" / "Välj mall för att börja").**
3. **Översätt kategori-slugs på Skriv-ut-resurser-sidan.** Snabbfix: en switch i komponenten med svenska namn.
4. **Lös notifications-API.** Kontrollera RLS och fetch-cancellation.
5. **Fix mobil padding-bottom så bottennav inte överlappar.** En CSS-rad.
6. **Ta bort gradient-knapparna på Intresseguide, Skills Gap, Profile.** 3 platser.

### Prioritet 2 — medium insats

7. **Avgör hub-hero-färg en gång för alla.** Antingen följ DESIGN.md (neutral grå hero med 4px hub-kant) eller uppdatera DESIGN.md till nuvarande verklighet (full hub-färg).
8. **AI Team dubbel-render-bug.** Allvarligt visuellt fel.
9. **Onboarding-modaler.** Det visas modal på CV, AI Team, Profile, sannolikt fler. Användare som ofta bryter session får dem upprepade gånger. Spara `dismissedTours: ['cv', 'ai-team', 'profile']` per user.
10. **"Mina ansökningar" — slå ihop pipeline-skelett och tomtillstånds-hero.** En tom kolumnskelett räcker.
11. **Settings: lägg till placeholder-text på namnfält.**

### Prioritet 3 — större initiativ

12. **CV-byggaren på mobil.** 6356px lång scroll med 11 mallar staplade vertikalt. Bygg en horisontell swipe-galleri eller filtrerbar grid.
13. **Empty states med uppmaningar.** Många sidor visar "Inga händelser än — börja utforska" utan en länk till var. Lägg till en konkret CTA i varje tomtillstånd ("→ Sök ditt första jobb", "→ Skriv din första dagboksanteckning").
14. **Hub-konsistens.** Just nu finns många små skillnader mellan hubbar (sub-tabs vs side-tabs, pasteller vs neutrala headers). En passgenomgång där alla hub-medlems-sidor får samma struktur.
15. **Översättning av engelska strängar.** Förutom B4 fanns några engelska placeholders i nätverkssidan ("LinkedIn Tips") och kanske fler.
16. **Onboarding tour design.** Den orange CV-tour-overlayen och den blå/grön Profile-modal har olika visuell stil. Ena uppfattas som notisbar, andra som dialog. Enhetlig komponent behövs.

---

## 📊 Statistik

| Kategori | Antal |
|---------|-------|
| Sidor besökta | 41 |
| Flikar/tabbar testade | 34 |
| Skärmdumpar tagna | 75 (desktop + mobil) |
| Console-fel | 12 |
| Network-fel | 17 |
| Page-errors / error-boundaries | 0 |
| Detected blank pages | 0 |
| Kärnflöden testade | 8 (CV, Cover Letter, Interview, Job Search, Spontaneous, Diary, AI Team, mobil-vyer) |

---

## 📁 Bevismaterial

- **Råa fynd:** `audit-2026-05-10/data/findings.json`
- **Audit-logg:** `audit-2026-05-10/data/audit.log`
- **Skärmdumpar:** `audit-2026-05-10/screenshots/` (75 filer)
- **Audit-skript:** `audit-2026-05-10/audit.cjs` (kan köras igen med `node audit-2026-05-10/audit.cjs`)

## 🚫 Vad jag INTE testade

- Faktiska AI-genereringar (CV, brev, intervjusvar). Det skulle bränna AI-credits och skapa skräpdata i produktion.
- Konsultvyn (`/consultant`) — kräver konsulent-roll på testkontot.
- Admin-panelen — kräver admin-roll.
- E-postaviseringar för jobb (`/api/job-alerts`).
- Ljud-/tal-funktioner i Intervjusimulatorn.
- LinkedIn-OAuth-flow (kräver riktigt LinkedIn-konto).
- Google Calendar-integration.
- Bolagsverket-/AF-integrationer (extern data).
- Fil-uppladdning (CV-PDF, profilbild).
- Betalning/abonnemang (om det finns).
