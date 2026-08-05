# Deltagarportalen - Claude Code Guidelines

## Projektöversikt

**Deltagarportalen** (live på **jobin.se**) är en jobbsökarportal som hjälper arbetssökande att hitta jobb genom AI-drivna verktyg. Portalen används av deltagare (arbetssökande) och arbetskonsulenter (handledare).

> **Hostnames:** Produktion = `jobin.se`. `deltagarportalen.se` används för förhandsdeploys/staging. CI smoke-test ska peka på `jobin.se` (se `74d4b71`).

### Målgrupp
- Arbetssökande, inklusive långtidsarbetslösa med fysiska/psykologiska utmaningar
- Arbetskonsulenter som coachar deltagare
- Kräver hög tillgänglighet (WCAG 2.1 AA) och empatisk design

### Huvudfunktioner
| Funktion | Beskrivning | AI-driven |
|----------|-------------|-----------|
| CV-byggare | Skapa och exportera CV | ✅ |
| Personligt brev | Generera anpassade brev | ✅ |
| Intervjusimulator | Öva intervjuer med tal-till-text | ✅ |
| Kompetensanalys | Identifiera gap mot drömjobb | ✅ |
| Intresseguide | Upptäck passande yrken | ✅ |
| LinkedIn-optimerare | Förbättra LinkedIn-profil | ✅ |
| AI-team | Personlig AI-coach/agentchatt | ✅ |
| Spontanansökan | Hitta företag och skicka spontana ansökningar | ✅ |
| ~~STA/Arbetsprövning~~ | ⏸ **Avaktiverad 2026-08-03.** Koden är kvar i `pages/sta/` men modulen monteras inte — se "Avaktiverade moduler" nedan | ✅ |
| Jobbsökning | Hitta och spara jobb | - |
| Dagbok | Reflektera och dokumentera | - |
| Hälsa/Wellness | Följ mående och energi | - |
| Fokusläge | Guidat fokusflöde (i18n-namespace `focus.*`) | - |
| Konsultvy | Hantera deltagare, GDPR-logg (`/consultant` — **portalens enda konsulentvy**) | - |

### Avaktiverade moduler (koden är kvar — bygg inte vidare på dem utan beslut)

**STA / Steg till arbete — avaktiverad 2026-08-03** (beslut Mikael). Modulflagga `MODULES.STA` i `client/src/config/features.ts`, styrd av `VITE_STA_ENABLED` och **av som default**.

- Deltagarvyn `/steg-till-arbete` monteras bara med flaggan på. Sidomenyns STA-sektion likaså.
- **STA-konsulentvyn är borttagen ur appen, inte flaggad.** Routerna `konsulent/steg-till-arbete` (+ dokumentarbetsytan) och navlänken "Konsulent-vy" är raderade. Portalen har **en** konsulentvy: `/consultant`. Filerna `pages/sta/StaConsultant.tsx`, `pages/sta/consultant/` och `pages/sta/StaDocumentWorkspace.tsx` ligger kvar orörda men har varken route eller importör — slår du på flaggan kommer de **inte** tillbaka. Att återinföra en konsulentyta för STA är ett eget beslut (flikar i `/consultant` vs. separat vy).
- Ingenting är raderat: `services/staApi.ts`, `staAiApi.ts`, `hooks/useSta.ts`, `FocusStaWizard`, STA-edge-funktionerna och de 10 STA-tabellerna i prod är orörda.
- e2e: `e2e/sta.spec.ts` skippar deltagartesterna tills `E2E_STA_ENABLED=true`; konsulentdelen är omskriven till en **regressionsvakt** som kräver att vyn inte går att nå.

**EU-utlysningsspåret (26-001 / 26-002 / 26-010) — pausat 2026-08-03.** Specarna ligger kvar i `docs/` som bilagor, men inget arbete drivs av dem. Det låser också ROADMAP C4 (de sex callerlösa `learning-*`-edge-funktionerna) i vänteläge — de behålls orörda.

---

## Teknikstack

```
Frontend:     React 19, TypeScript 5.9, Vite 7
Styling:      Tailwind CSS 4, Framer Motion 12
State:        Zustand 5, React Query (TanStack) 5
Auth/DB:      Supabase 2.97
i18n:         i18next 25 (svenska/engelska)
Test:         Vitest, Testing Library, Playwright (e2e)
Deploy:       Vercel (serverless functions, rootDirectory=client)
Monitoring:   Sentry
```

### Projektstruktur
```
deltagarportal/
├── client/                  # React frontend (Vercel rootDirectory)
│   ├── api/                 # Vercel serverless functions
│   │   ├── ai.js            # Huvud-AI-endpoint (18 funktioner, samlad)
│   │   ├── cv-pdf.js        # CV → PDF (puppeteer, rate-limited)
│   │   ├── job-alerts.js    # E-postaviseringar för jobb
│   │   ├── upload-image.js  # Profilbild → Vercel Blob
│   │   └── test.js, package.json
│   └── src/
│       ├── components/      # ui/, dashboard/, layout/, ai-team/, ...
│       ├── pages/           # ~120 sidfiler: verktygssidor, pages/hubs/, pages/sta/
│       ├── stores/          # Zustand stores
│       ├── services/        # API-anrop (aiApi.ts m.fl.)
│       ├── hooks/           # 30+ custom hooks
│       └── lib/             # supabase, sentry, validators, ...
├── api/                     # Repo-root Vercel-katalog
│   └── _utils/              # rate-limiter.js (Supabase-distribuerad)
├── supabase/                # Migrations (118 filer) + 24 edge functions
│   ├── functions/           # Deno edge — ai-*, af-*, learning-*, bolagsverket, ...
│   └── migrations/
├── e2e/                     # Playwright-tester (8 spec + 10 verktygsskript; 82 ad-hoc i e2e/archive/)
├── docs/                    # ROADMAP.md (enda gällande plan), DESIGN.md, granskningar
├── archive/                 # Arkiverat: 2026-q1, server-legacy, 2026-06-dokkonsolidering
├── .planning/               # GSD-milestone-historik (PROJECT, STATE) + AF-API-idébank
└── .claude/agents/          # 10 specialagenter för granskning
```

---

## Utvecklingskommandon

```bash
# Starta utvecklingsserver
cd client && npm run dev

# Bygg för produktion
npm run build

# Kör tester
npm run test           # Watch mode (Vitest)
npm run test:run       # Single run
npm run test:coverage  # Med coverage

# E2E (från projektroten)
npx playwright test

# TypeScript-kompilering (för felsökning)
npx tsc --noEmit
```

---

## Släpp: commit, push, deploy — EN procedur, hitta aldrig på en ny

När Mikael säger **"commit"**, **"push"** eller **"deploy"** gäller det här. Fråga inte, uppfinn inte, improvisera inte.

**Grundfakta om det här projektet:**
- Allt går direkt på `main`. Inga feature-grenar.
- **`push` till `main` ÄR deployen.** `.github/workflows/deploy.yml` triggar på push → `vercel build` → `vercel deploy --prod` → Supabase edge functions → smoke-test. Det finns inget separat deploy-kommando, och inget att klicka i Vercel.
- Det betyder att en push är en produktionsändring. Behandla den därefter.

**Proceduren:**

```bash
# 1. Grindarna. Pre-push-hooken kör dem automatiskt, men kör dem själv först
#    så du ser felen innan git gör det.
cd client && npm run verify            # se nedan

# 2. Commit — beskriv VAD och VARFÖR, inte bara vad.
git add <filer> && git commit -F - <<'EOF'
<typ>(<scope>): <rubrik>
...
EOF

# 3. Push = deploy.
git push origin main

# 4. VERIFIERA UTFALLET. En push är inte klar förrän deployen är grön.
#    gh CLI saknas på den här maskinen — använd GitHub-API:t (repot är publikt):
curl -sS "https://api.github.com/repos/glannstrom-lab/deltagarportalen/actions/runs?per_page=1&branch=main"
#    Failar den: hämta jobbstegen och åtgärda. Rapportera aldrig "pushad" som
#    om det vore "levererat".
```

**`npm run verify` (i `client/`) kör hela grinduppsättningen.** Pre-push-hooken (`.husky/pre-push`) kör den automatiskt och gör dessutom ett **fullt bygge** när bygg-/deploy-påverkande filer ändrats (`vercel.json`, `package.json`, `vite.config`, `index.html`, `tsconfig`, `scripts/`, `.github/workflows/`).

**Varför hooken finns:** 2026-08-05 fälldes en deploy av `vercel build` efter 35 sekunder medan alla sju lokala grindar var gröna — de kontrollerade aldrig filen som ändrats. Prod stod kvar på gammal kod utan att något larmade. Grinden ersätter uppmärksamhet med mekanik.

**Undantag som kräver Mikaels ja innan push:** ändringar i `client/vercel.json`, `.github/workflows/`, RLS-policyer, eller migrationer mot prod. Allt annat följer proceduren rakt av.

> `git push --no-verify` finns som nödutgång. Använd den inte för att komma runt en röd grind — laga grinden eller fråga.

---

### Supabase-migrationer

**VIKTIGT:** Använd INTE `npx supabase db push` — det försöker köra ALLA migrationer och failar på konflikter.

```bash
# Kör NY migration direkt mot remote-databasen:
npx supabase db query --linked "ALTER TABLE tablename ADD COLUMN IF NOT EXISTS newcol type DEFAULT 'value';"

# Eller kör från fil:
npx supabase db query --linked -f supabase/migrations/20260417_new_migration.sql

# Verifiera kolumner:
npx supabase db query --linked "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tablename';" --output table
```

Migrationsfiler skapas fortfarande i `supabase/migrations/` för dokumentation, men körs manuellt med `db query --linked`.

#### Efter varje körd migration: uppdatera schema-snapshoten

```bash
cd client && npm run schema:refresh   # skriver supabase/schema-snapshot.json
```

Committa snapshoten i **samma commit** som migrationen. `npm run lint:schema` (CI-grind sedan 2026-07-27) jämför varje `.from()`, `.rpc()`, `.storage.from()` och kolumnreferens i koden mot snapshoten och failar bygget vid drift. Utan uppdaterad snapshot blir grinden falskt röd; utan grinden återkommer fantomtabellerna (se lärdomen 2026-07-27 nedan).

Grinden kontrollerar **båda riktningarna av det som går att kontrollera automatiskt** — kod som pekar på objekt som inte finns. Motsatsen (tabeller i prod som ingen kod rör) kräver manuell genomgång; senaste inventeringen finns i `docs/portal-review-2026-07-27.md` §2.4.

---

## Premissgranskning — obligatorisk före varje roadmap-punkt

**Regel:** Innan du bygger något från `docs/ROADMAP.md` ska punktens premiss verifieras mot verkligheten. Roadmapen beskriver vad någon trodde när raden skrevs — inte vad som är sant idag.

**Så gör du, i ordning:**

1. **Läs den faktiska koden.** Öppna filerna raden pekar på. Inte bara sök — läs.
2. **Spåra konsumenter själv.** Finns komponenten/hooken/funktionen ens monterad? Vem importerar den? Noll importörer = punkten handlar om dödkod, inte om en funktion som ska förbättras.
3. **Kolla schemat mot databasen**, inte mot migrationsfilerna:
   ```bash
   npx supabase db query --linked "SELECT column_name FROM information_schema.columns WHERE table_name='<tabell>';" --output table
   ```
4. **Mät i stället för att lita på siffror i planen.** Storlek = brotli över nätet, inte rå `dist/`. Radantal = `SELECT count(*)`, inte `reltuples`. Regelfördelning = kör linten, inte minnesbilden.
5. **Rapportera premissen innan du bygger:** *"Premissen håller / håller inte — så här ser verkligheten ut."* Föreslå därefter: **bygg**, **omscopa** eller **avskriv**.
6. **Bygg sedan** — och skriv in rättelsen i roadmapen (under "Rättelser mot förra versionen"), inte bara i commit-meddelandet.

**Rapporten ska bära bevis, inte intryck:** radantal, importspår, brotli-tal, prod-repro. "Jag kollade" räcker inte.

**Varför regeln finns:** vid körningen 2026-07-27 visade sig sex punkter ha fel premiss — G3 (CV hade redan fokusläge), G9 (poängen hade noll läsare, inte bara ingen vy), G10 (chatboten var dödkod), I1 (1 510 kB var rå storlek; 383 kB brotli → avskriven), I3 (`no-console` var 25 av 154, inte dominerande) och H6 (`email_queue` behövde kanonisk form från producent+konsument, inte påhittad). Att bygga rakt på raden hade gett fel arbete i samtliga fall.

**Undantag:** ingen. Även en punkt som ser trivial ut ska premissgranskas — G3 och G13 såg ut som "bygg en ny vy" och var i själva verket "vyn finns men ljuger".

---

## Felsökningsprotokoll

När något inte fungerar, följ denna ordning:

1. **Läs koden** — Öppna och läs de relevanta filerna noggrant
2. **Kontrollera syntax** — Imports, exports, parenteser
3. **Kör TypeScript** — `npx tsc --noEmit` visar typfel
4. **Kolla webbläsarkonsolen** — Runtime-fel
5. **Lägg till debug-kod** — Endast som sista utväg

> **LÄS ALLTID KODEN FÖRST.** Grundläggande syntaxfel upptäcks snabbt genom att faktiskt titta på koden.

### AI-anrop går till TVÅ backends
Det finns två parallella AI-vägar — välj rätt:
- **`client/api/ai.js`** (Vercel serverless, exponerad som `/api/ai`) — **18 funktioner** samlade (verifierat 2026-08-04; siffran 24 var fel sedan C12). Snabb cold start, lägre auth-kostnad. **Default för UI-anrop.** **Det finns ingen streaming-väg** — `client/api/ai-stream.js` och `useAIStream` är borta sedan streaming-lagret arkiverades; skriv inte kod som antar dem.
- **`supabase/functions/`** (Deno edge) — 24 funktioner: `ai-*`, `af-*` (Arbetsförmedlingen), `learning-*`, `bolagsverket`, `cv-analysis`, `health`, `delete-account`, `send-invite-email`. Service role, längre prompts, integration mot AF/Bolagsverket.

> **AI-modellen är låst** till `openai/gpt-oss-120b` av kostnadsskäl (`docs/AI_MODEL_LOCKING.md`). Byt aldrig modell utan explicit beslut av Mikael.

När du bygger en ny AI-funktion: säg uttryckligen vilken backend. Annars gissar Claude.

### CI-grindarna (sju st, alla körbara lokalt)

```bash
cd client
npm run lint:ci            # eslint: 0 errors, max 129 warnings (fryst tak)
npm run typecheck:critical # krasch-klassade typfel
npm run typecheck:ceiling  # hela strict-skulden mot fryst tak (468)
npm run lint:design        # gradient-baseline (52)
npm run lint:schema        # schemadrift kod vs prod-schema
npm run test:run           # 933 tester
npm run build
```

De tre **frysta taken** (129 warnings, 468 typfel, 52 gradienter) finns för att skulden ska kunna
minska men inte växa. Höj dem aldrig för att bli grön — sänk dem när du betalar av. Varje
takskript skriver ut det nya talet när skulden minskat.

> **⚠️ De sju räcker inte — CI kör ett åttonde steg som inte finns i listan.** `ci.yml` kör
> `npm run test:coverage` (inte `test:run`), och den **fäller bygget** i dag: functions 23,62 %
> mot tröskeln 30 %. Eftersom `build` har `needs: [lint-and-typecheck, test]` har build,
> lighthouse och båda e2e-jobben inte kört. Kör `npm run test:coverage` innan du tror att CI
> blir grön. Se ROADMAP D13.

### Verifiera alltid själv
Be inte Mikael köra build/test/Playwright. Kör det själv och rapportera resultat. Om du inte kan testa något (t.ex. UI-flöde) — säg det explicit, claima inte success.

---

## Kodstandard

### React-komponenter
```typescript
// Extrahera komponenter över 150 rader till egna filer
// Använd custom hooks för komplex logik
// Lägg konstanter utanför komponenter för prestanda
const CONFIG = { ... } as const  // Utanför komponenten

export function MyComponent() {
  // Hooks först
  const [state, setState] = useState()

  // Effekter
  useEffect(() => { ... }, [])

  // Render
  return <div>...</div>
}
```

### Tillgänglighet (WCAG 2.1 AA)
```typescript
// Expanderbara sektioner
<button
  aria-expanded={isExpanded}
  aria-controls="section-id"
>

// Progress-indikatorer
<span role="status" aria-live="polite">
  3 av 5 klart
</span>

// Ikoner utan text
<Icon aria-hidden="true" />
<span className="sr-only">Beskrivning</span>
```

### AI-funktioner
AI-endpoints anropas via `client/src/services/aiApi.ts`:
```typescript
import { callAI } from '@/services/aiApi'

const result = await callAI('personligt-brev', { ...params })
// Internt: POST /api/ai med Authorization: Bearer <supabase-token>
```

Streaming via `useAIStream`-hooken (anropar `/api/ai-stream`).

---

## UI/Design-instruktioner

### Innan du ändrar UI
1. **Läs `docs/DESIGN.md`** — Manifestet (§1) + Voice & Tone (§2) är obligatoriska före allt annat. Avsnitt 4–9 är referens när du implementerar.
2. **Designreferenser i rotmappen:** `ny1.png`–`ny5.png` (senaste designiterationer)
3. **Sök i `client/src/components/ui/`** om komponenten redan finns — återanvänd alltid, kopiera aldrig

### Designsystemet (DESIGN.md v3.0, aktivt från 2026-05-10)
Sammanfattning av sanningarna i DESIGN.md — vid konflikt gäller DESIGN.md.

- **Manifestet styr alla val.** Jobin är inte en jobbportal — det är en följeslagare. Tonen är "lugn vän", inte "myndighet" eller "tools-app". Inga prestationsmätningar i hjälteposition, inga gradient-knappar, inga "Aktivera"-knappar. Se DESIGN.md §1.
- **Två lägen, inga kompromisser:**
  - **Hub-landning** (`/oversikt`, `/jobb`, `/karriar`, `/resurser`, `/min-vardag`) = full pastell-hero i hub-färgen.
  - **Verktygssida** (allt annat under hubbarna) = neutral grå hero (`--header-bg`) med 4px vänsterkant i hub-färgen.
  - Dessa lägen blandas aldrig på samma sida. Se DESIGN.md §3.
- **En sida = en hub-färg.** Alla pastell-element på en sida (KPI-kort, sektioner, ikon-tiles) använder samma hub-färg. Variation kommer från intensitet (50/200/700) och ikon — aldrig från olika hubars pasteller på samma sida. *Undantag: Översikt med 4 hubbar samtidigt.* Se DESIGN.md §4.
- **5 hubbar:** Översikt (mint/`action`), Söka jobb (persika/`activity`), Karriär (rosa/`coaching`), Resurser (sky/`info`), Min vardag (lavendel/`wellbeing`). Aktiveras via `<div data-domain="...">` (sätts av `PageLayout`).
- **Bakåtkompatibilitet:** `reflection` → wellbeing, `outbound` → activity (CSS-aliaser). Använd inte i ny kod.
- **Inga gradients** i KPI-kort, sektionsheaders, knappar, modaler. Förbjudet enligt DESIGN.md §6.
- **Personalisering:** Använd användarens förnamn när det finns ("Hej Anna", inte "Välkommen tillbaka"). Se DESIGN.md §2.

### Voice & Tone (sammanfattning av DESIGN.md §2)
- **Rubriker är inviter, inte etiketter.** "Hantera resurser" → "Dina sparade resurser".
- **Aldrig administrationsspråk.** "Aktivera" → "Slå på". "Konfigurera" → "Ändra".
- **Aldrig prestationsspråk i deltagarvyer.** "0 ansökningar" → "Du har inte börjat söka jobb än".
- *Konsulent-/admin-vyer kan ha annan ton — det är en tydlig switch, inte slumpartat.*

### Empty states är kontraktualiserade
Alla tomtillstånd ska gå genom `<EmptyState>`-komponenten med tre delar: ikon, mänsklig rubrik, EN tydlig CTA. Inga staplade tomtillstånd, inga "0"-rubriker, inga oöversatta i18n-keys i UI. Se DESIGN.md §7.

### När du redesignar en sida
1. Be om eller hänvisa till en screenshot av nuvarande sida
2. Lista vilka designprinciper som bryts mot Manifestet och §3-9
3. Föreslå förändringar komponent för komponent
4. Visa diff innan implementation
5. Kör PR-checklistan i DESIGN.md §15 innan commit

### Innan du lägger till en ny färg
**Stopp.** Använd befintliga tokens i `client/src/styles/tokens.css` och `tailwind.config.ts`.
Om du verkligen behöver en ny färg — fråga först.

### Innan du lägger till en ny komponent
Sök i `client/src/components/ui/` och `client/src/components/dashboard/`. Om något liknande finns, utöka det med en variant istället för att skapa nytt.

### Bevara befintlig funktionalitet
Originalsidor och molndata rörs inte. Nya lager (hubbar/widgets) är **alltid additiva** — gamla flöden måste fortsätta fungera.

### Komponentkatalog (urval)

> **Rättad 2026-08-04.** Den gamla katalogen listade tolv komponenter i `components/dashboard/` och fyra `ui/`-primitiver som levande — **hela `components/dashboard/` (17 av 17 filer, 3 182 rader) nås inte från `main.tsx`**, och `Tabs`, `Badge`, `Avatar`, `LanguageSelector` är också döda. Kopiera aldrig ett mönster därifrån och bygg aldrig vidare på dem utan att först kontrollera nåbarheten från `main.tsx`. Se `docs/review-2026-08-04/arkitektur.md`.

```
client/src/components/
  ui/
    Card, Button, Input, Logo
    Progress, ProgressBars, StatCard, EmptyState, LoadingState
    BarChart, LineChart, CircleChart, CalendarWidget
    DropdownMenu, BottomSheet, ConfirmDialog, SearchBar, QuickActions
    Image, OptimizedImage, PageCard
    ── döda (nås ej från main.tsx): Badge, Avatar, Tabs, LanguageSelector, Skeleton
  dashboard/                                      # ⛔ HELA KATALOGEN ÄR DÖD
  layout/
    Sidebar, TopBar, BottomBar, Header, PageHeader, PageLayout, PageTabs
    HubBottomNav                                  # Bottennav för 5-hub-systemet
    AnimatedSection, GoogleTranslate, LanguageSwitcher
    navigation.ts                                 # navGroups + navHubs (sanning)
```

### Hub-arkitektur (v1.0)
Portalen har **5 domän-hubbar** som ersätter den platta 27-items-navigationen. Featureflagga: `VITE_HUB_NAV_ENABLED`.

| Hub | Path | Domän | Innehåller |
|-----|------|-------|------------|
| Översikt | `/oversikt` | action | Dashboard / startpunkt |
| Söka jobb | `/jobb` | activity | JobSearch, Applications, Spontanansökan, CV, CoverLetter, InterviewSimulator, Salary, International, LinkedIn |
| Karriär | `/karriar` | coaching | Career, InterestGuide, SkillsGap, PersonalBrand, Education |
| Resurser | `/resurser` | info | KnowledgeBase, Resources, PrintResources, ExternalResources, AI-team, Nätverk |
| Min vardag | `/min-vardag` | wellbeing | Wellness, Diary, Calendar, Exercises, MyConsultant, Profile |

Sanning: `client/src/components/layout/navigation.ts` (`navHubs[]`). Member-paths får inte dubbleras mellan hubbar.

---

## Lärdomar från Felsökning

### 2026-04-09: White Screen på Landing Page
**Problem:** Startsidan visade vit skärm.
**Orsak:** `console.log()` låg FÖRE `import`-satser — ogiltig ES-modulsyntax.
**Lösning:** Imports måste alltid komma först i filen.

### 2026-04-09: Sidor visade Dashboard istället
**Problem:** Nya sidor fångades av catch-all route.
**Orsak:** Routes saknades i `App.tsx` trots att imports fanns.
**Kontroll:** Jämför `navigation.ts` paths med `App.tsx` routes.

### 2026-04-27: Lazy-import utan route = dödkod — ✅ **STÄNGD 2026-08-04**
**Problem:** Sidor som `CoverLetterGenerator`, `UnifiedProfile` var `lazy()`-importerade i `App.tsx` utan `<Route>`.
**Status:** Verifierat 2026-08-04 — **alla 49 `lazy()` i `App.tsx` har route.** Den här läckan är tätad. Dödkoden gömmer sig numera bakom barrel-filer i stället, se lärdomen 2026-08-04 nedan.
**Aktiva entry-points 2026-04-27:** Se `archive/2026-06-dokkonsolidering/portal-review-2026-04.md` § 1.

### 2026-04-29: Hub-aktivering kräver URL-prefix-fri matchning
**Problem:** Aktiv hub kunde feldetekteras vid djup-länkar.
**Lösning:** Använd `pageToHub`-mappen byggd från `navHubs[].memberPaths`. **Aldrig** URL-prefix-matchning. Se `.planning/research/PITFALLS.md` (Pitfall 2).

### 2026-07-03: CV-PDF — per-sida-marginaler + kant-till-kant-bakgrund
**Problem:** Flersidiga CV-PDF:er började sida 2+ ~2,5mm från papperskanten, och sidopanelens färg slutade med vit remsa 20-50mm före sista sidans nederkant.
**Lösning (CVPrintLayout.tsx):** (1) Sidobar-/sidbakgrund som **canvas-bg** — `html { background: <gradient> }` i print målas om kant-till-kant på VARJE sida (body/root/preview måste vara transparenta). (2) Säkerhetszoner via **`box-decoration-break: clone`** på flow-wrappern: `padding: 12mm 0 10mm` klonas vid varje sidbrytning; negativa marginaler nollar ut den på första/sista sidan så ensidiga CV:n inte tippar till 2 sidor. Kräver Chromium ≥130 (prod: @sparticuz/chromium 148). Filler-/höjdmätnings-JS:et kunde raderas helt.
**Verifiering:** `node e2e/cv-pdf-visual-audit.cjs` (dev-server på :3000) → PDF+PNG per mall/variant i `cv-prints/visual-audit/`.

### 2026-07-10: Widget-grid-systemet monteras aldrig i prod
**Problem:** `components/widgets/` (registry, HubGrid, JobsokLayoutContext, ~24 *Widget-komponenter, ~6 000 rader inkl. tester) importeras inte från någon sida — hubbarna byggs med `HubPage`-funktionskort i `pages/hubs/*.tsx`.
**Lärdom:** Ändringar som ska synas på en hubb görs i hubbsidans `features[]`, inte i widgets. Arkivering av widget-systemet är planerad (ROADMAP C1).

### 2026-07-27: Migrationsfiler ≠ prod-schema (verifiera mot databasen)
**Problem:** Koden skriver till 11 tabeller som inte finns i produktionsdatabasen — och läser 2 kolumner på `user_preferences` som inte finns. Jobbevakningen har därför varit ur funktion sedan 12 april utan att något test, typfel eller loggfynd avslöjade det.
**Orsak:** Den manuella migrationsrutinen (`db query --linked`, se ovan) har ingen grind. Tre migrationsfiler skrevs men kördes aldrig; åtta tabeller hade aldrig någon migration alls. Felen maskeras av `if (error) { console.error(...); return [] }`-mönstret — ett saknat schema ser ut som tom data.
**Lärdom:** Att en migrationsfil finns i `supabase/migrations/` är **inget bevis** för att tabellen finns i prod. Samma buggklass har nu träffat tre gånger: `participant_consultants` (B3), kolumnnamnen i `participant_data_sharing` (UX7), och de här elva.
**Kontroll — gör detta innan du tror på en kodväg som rör databasen:**
```bash
npx supabase db query --linked "SELECT column_name FROM information_schema.columns WHERE table_name='<tabell>';" --output table
```
**Åtgärd — nu på plats:** `npm run lint:schema` (H1) failar bygget vid drift, och `npm run schema:refresh` uppdaterar snapshoten. Grinden hittade **fyra buggar som den manuella granskningen missade**: profilbildsuppladdning mot en bucket som inte finns (`user-content`), `mood_logs.mood`/`notes` som heter `mood_level`/`note` (måenderekommendationerna kunde aldrig visas), `journey_goals` i konsulentens analytics, och `consultant_placements.placement_date` som heter `start_date`. Detaljer: `docs/portal-review-2026-07-27.md`.

**Notera fällan i testerna:** `consultantService.test.ts` hade ett test som *asserterade* `journey_goals` — mot en mockad klient går ett tabellnamn som inte finns alltid igenom. Enhetstester kan inte ersätta den här grinden.

### 2026-07-27: Delad React Query-nyckel med två olika former (prod-persona-testet)

**Problem:** Ett besök på `/#/jobb` fick alla ansökningar att försvinna från `/#/applications`, och räknaren att visa den råa i18n-nyckeln `applications.pipeline.active`. Öppnade man `/#/applications` direkt fungerade allt.

**Orsak:** Två features skriver till samma cache-nyckel `['application-stats']` med **olika former**. `useApplications` lägger dit `applicationsApi.getStats()` (platt: `total/active/applied/…`, från `saved_jobs`). `useJobsokHubSummary` gör `queryClient.setQueryData(['application-stats'], …)` med `{ total, byStatus, segments }` — hämtat från den **döda tabellen `job_applications`** (0 rader i prod). Hubben skriver alltså noll över verkligheten, `stats.total = 0` gömmer hela pipelinen och `stats.active = undefined` får i18next att missa pluralformen.

**Varför inget fångade det:**
- `lint:schema` är grön — `job_applications` *finns* i prod, den är bara tom.
- TypeScript är grönt — `setQueryData` är otypad mot nyckeln.
- Enhetstestet är grönt — `useJobsokHubSummary.test.ts` **asserterar den trasiga formen**. Samma fälla som `journey_goals` ovan, men på cache-nivå i stället för schemanivå.

**Kontroll:** När en bugg bara uppträder på *en väg* till en sida men inte på direktnavigering — misstänk delad cache, inte data. `grep -rn "setQueryData"` och jämför formen mot den hook som äger nyckeln. En nyckel = en form = en ägare.

**Lärdom:** En delad cache-nyckel är ett kontrakt utan typ. Skriver två ställen till samma nyckel måste de dela form — annars förgiftar det ena det andra, tyst.

### 2026-08-03: Strict-typfel kan vara skarpa buggar, inte "typskuld"

**Problem:** `Property 'toLowerCase' does not exist on type 'Skill'` (`cvOptimizer.ts`) låg i I2:s frysta lista och hade avfärdats som typskuld. Verifiering mot prod visade att `cvs.skills` är **objekt** (`{id,name,level,category}`) i 16 av 16 CV:n med kompetenser — anropet kastade alltså `TypeError` i drift, varje gång, för just de användare som fyllt i mest.

**Lärdom:** taket på 469 är en skuldlista, inte en lista över harmlösa fel. Ett `Property X does not exist`-fel betyder att koden läser något som inte finns — kontrollera mot verklig data innan du antar att det bara är typer som gnäller.

**Kontroll:** `npx supabase db query --linked "SELECT jsonb_typeof(kolumn->0) FROM tabell LIMIT 5;"` avgör formen på sekunder.

### 2026-08-04: Testuppsättningens mockar kan vara lika lögnaktiga som fixturerna

**Problem:** `localStorage`-mocken i `client/src/test/setup.ts` var fyra `vi.fn()` utan backing store — `getItem` returnerade alltid undefined, hur mycket ett test än skrev med `setItem`. Ett test som ville verifiera "modalen visas inte för den som redan sett den" fick därför alltid se modalen. `sessionStorage` fick en in-memory-store 2026-05-09; localStorage blev kvar.

**Lärdom:** samma familj som fixturer snällare än verkligheten, men ett steg längre bort — den här ljuger för *alla* tester samtidigt, tyst. Ett test som "passerar" mot en tom mock kontrollerar ingenting.

**Kontroll:** när ett test som borde falla ändå går grönt — läs `setup.ts` innan du misstänker komponenten.

**Bonusfälla i jsdom:** `offsetParent` är alltid `null`, och `useFocusTrap` filtrerar bort element med `offsetParent === null` som dolda. Utan en shim ser fokusfällan noll fokuserbara element — och fokustester går grönt även när fokushanteringen är trasig.

### 2026-08-03: Testfixturer ska spegla prod-formen, inte den bekväma

**Problem:** en fixtur med `skills: ['React', 'Docker']` gjorde CV-matchningstesterna gröna. Prod har `skills: [{id,name,level,category}]`. Testerna bevisade alltså att koden fungerar på data som inte existerar — samma familj som `journey_goals`-fällan (mockad klient) och `useJobsokHubSummary.test.ts` (asserterade den trasiga formen).

**Lärdom:** när du skriver en fixtur för något som kommer ur databasen, hämta formen från databasen. Tre buggar i rad har gömt sig bakom fixturer som var snällare än verkligheten.

### 2026-08-03: Fail closed vs. fail open — välj efter vad felet kostar

**Problem:** `checkDailyTokenCap` släpper igenom vid uppslagsfel ("loggning är best-effort"). Samma mönster kopierat till art. 9-samtyckesgrinden hade betytt att hälsodata skickas till USA när databasen strular.

**Lärdom:** grindar ska ha uttrycklig policy. Kostar felet pengar → fail open kan vara rätt. Kostar felet en olaglig överföring eller en rättighet → fail closed, och skriv ut varför i koden så nästa läsare inte "harmoniserar" dem.

### 2026-08-04: Barrel-filer gör dödkod osynlig för importsökning

**Problem:** 175 filer / 41 878 rader (18 % av `client/src`) nås inte från `main.tsx`. Bara 9 587 av dem är den pausade STA-modulen — resten stod odokumenterad genom fyra granskningar. Hela `components/dashboard/` är dött, och `CLAUDE.md` listade tolv av filerna som levande komponenter.

**Orsak:** 20 döda barrel-filer (`hooks/index.ts` ensam håller 2 651 rader vid liv). En vanlig `grep` efter importörer hittar barreln och rapporterar "har importör" — fast ingen importerar barreln.

**Vad det kostade:** tre stycken *betalt* arbete landade i filer som ingen kör — UX8 styrde om `useUnifiedProgress.ts:509`, I5 betalade 43 typfel i `utils/validation.ts`, och `accountApi.ts` + 11 tester dubblerar en kontoradering som ligger någon annanstans.

**Kontroll:** en importsökning räcker inte. Kör nåbarhetsanalys från `main.tsx` — det är den enda sökningen som ser sanningen. Skriptet ligger i `docs/review-2026-08-04/arkitektur.md`; grinden är planerad som D16.

### 2026-08-04: Permissiva dubblettpolicyer neutraliserar de guardade — tyst

**Problem:** `profiles` hade tre permissiva UPDATE-policyer. Två kontrollerade rollbyte via `check_role_change_allowed`; den tredje, `Users can update own active_role`, hade bara `WITH CHECK (auth.uid() = id)`. Permissiva policyer **OR:as** — så vilken inloggad deltagare som helst kunde sätta `role = 'SUPERADMIN'` på sig själv. Samma mönster fanns på `mood_logs` (wellness-samtyckets grind) och `storage.objects`.

**Lärdom:** att grinden finns är inget bevis för att den gäller. En extra policy som ser harmlös ut ("får byta sin egen aktiva roll") kan upphäva den strängare policyn bredvid, och `pg_policies` visar det bara om man läser alla policyer på tabellen tillsammans.

**Kontroll — läs hela uppsättningen, inte den du just skrev:**
```bash
npx supabase db query --linked "select policyname, cmd, permissive, qual, with_check from pg_policies where tablename='<tabell>' order by cmd;" --output table
```
Fråga för varje par: *finns det en policy här som ensam räcker för att godkänna operationen?* Om ja är den svagaste policyn den som gäller.

### 2026-08-04: `REVOKE … FROM anon` gör ingenting när PUBLIC har EXECUTE

**Problem:** A17 revokade EXECUTE från `anon` på 18 `SECURITY DEFINER`-funktioner. Migrationen gick igenom utan fel — och `has_function_privilege('anon', …)` var fortfarande `true`. Anon kunde alltjämt läsa andras data.

**Orsak:** Postgres ger som default EXECUTE till **PUBLIC** på nya funktioner. I `proacl` syns det som `=X/postgres` (tom roll före `=` betyder PUBLIC). `anon` är medlem i PUBLIC, så ett REVOKE mot just `anon` tar bort ett grant som aldrig fanns — och lyckas tyst.

**Lärdom:** ett REVOKE som "gick bra" är inget bevis för att rättigheten är borta. Samma familj som lärdomen om permissiva dubblettpolicyer ovan: det räcker inte att den strängare regeln finns.

**Kontroll — mät utfallet, inte kommandot:**
```bash
npx supabase db query --linked "select proname, proacl::text, has_function_privilege('anon', oid, 'EXECUTE') as anon_exec from pg_proc where proname = '<funktion>';" --output table
```
Ska `anon` aldrig nå funktionen: `REVOKE EXECUTE ON FUNCTION … FROM PUBLIC;` följt av explicita `GRANT` till de roller som ska ha den.

### 2026-08-04: Lokalt gröna grindar ≠ grön CI

**Problem:** alla sju lokala grindar var gröna medan CI hade varit rött. `npm run test:coverage` (som `ci.yml` kör, men som inte ingår i de sju) ger exit 1 på coverage-tröskeln, och `build` har `needs: [..., test]` — så build, lighthouse och båda e2e-jobben hade inte kört.

**Två fällor under den:** (1) `exclude`-listan i `vitest.config.ts` **ersätter** vitests defaults, så 238 filer i `client/dist/assets` räknades som 0 % coverage och sänkte branch-siffran artificiellt. (2) `e2e-authenticated` skippar 74 av 94 tester tyst utan secrets och rapporterar grönt.

**Lärdom:** kör det kommando CI kör, inte det som liknar det. Ett jobb som skippar tyst och ett tak som mäter fel filer ser båda ut som "godkänt".

### 2026-08-04: En geometrisk fix behöver en geometrisk regression

**Problem:** UX16 flyttade CV-knappraden 64 px upp för att sluta täcka bottennavet — rakt in under CoachWidget-knappen, som ingen tänkte på. 58 % av "Nästa" blockerades och en riktig `tap()` timeoutade. Verifieringen kontrollerade det som lagades, inte det som flyttades.

**Lärdom:** fixar som flyttar fixerade element ska verifieras med hit-test över *alla* fixerade lager på sidan, inte bara mot det element buggen handlade om. Okulär besiktning duger inte — element med `opacity: 0` respektive `pointer-events: none` ger både falska positiva och falska negativa.

### 2026-04-29: Smoke-test mot fel hostname
**Problem:** `deploy.yml` curlade `deltagarportalen.se` men prod ligger på `jobin.se`.
**Lösning:** Smoke-test ska peka på `jobin.se` — `deltagarportalen.se` är staging.

---

## Aktuella granskningar och planer

| Dokument | Innehåll |
|----------|----------|
| `docs/ROADMAP.md` | ★ **Projektets enda gällande plan** (version 2026-07-27) — spår A–I, beslutslogg, allt öppet arbete. Nya idéer förs in här, aldrig i nya plandokument |
| `docs/portal-review-2026-08-04.md` | ★ **Senaste granskning** — tio agenter, kod + webbläsare (Playwright). Grund för A16–A21, B10–B18, C16–C20, D13–D16, E13–E16, F12–F17, H11–H17, UX24–UX35. **Innehåller en kritisk säkerhetspunkt (A16) som väntar på beslut** |
| `docs/review-2026-08-04/` | De tio fullständiga agentrapporterna med allt bevismaterial (~4 900 rader) |
| `docs/portal-review-2026-07-27.md` | Granskning kod vs. **prod-schema**. Grund för spår H (schemaintegritet) och I (kvalitetsgrindar/prestanda) |
| `docs/portal-review-2026-07-22.md` | Granskning 2026-07-22 (7 parallella analyser: kod, säkerhet, UX, prestanda, produkt, AI, dokumentation/test) |
| `docs/portal-review-2026-07.md` | Helhetsgranskning 2026-07-10 (grund för roadmapens spårstruktur) |
| `docs/DESIGN.md` | **Designsystemets sanning v3.0** — Manifest + Voice & Tone + två-läges-system (hub-landning vs verktygssida) + en-färg-per-sida-regel |
| `docs/DESIGN-DEBT.md` | Levande lista över designöverträdelser — CI-guardad (`npm run lint:design`) |
| `docs/security-audit.md` | Levande säkerhetsstatus (senast 2026-05-28; CRIT: OpenRouter-nyckelrotation utestående) |
| `docs/COMPLIANCE-AUDIT-2026-05-15.md` + `docs/COMPLIANCE-USER-ACTIONS.md` | Juridiskt läge + åtgärdschecklista (DPIA, Art 30, AI Act — deadline 2 aug 2026) |
| `docs/AI-ACT-CLASSIFICATION.md`, `docs/DPIA-PORTAL.md`, `docs/GDPR-ART30-REGISTER.md` | Compliance-dokument under färdigställande (se ROADMAP §1) |
| `docs/AI_MODEL_LOCKING.md` | Modell-låsning `openai/gpt-oss-120b` — alla AI-vägar |
| `docs/AI_ARCHITECTURE_OVERVIEW.md` | Översikt över AI-stack (Vercel + Supabase edge) |
| `docs/STA-FORBATTRINGSFORSLAG.md`, `docs/sta-automation-roadmap.md`, `docs/sta-*` | STA-modulens detaljspecar — ⏸ **vilande** sedan modulen avaktiverades 2026-08-03 |
| `docs/api/services-overview.md` | Översikt över services-lagret i `client/src/services/` |
| `docs/claude-code-guide.md` | Hur Claude Code används effektivt i projektet |
| `docs/GRAFIK-PLAN.md` | Grafikpipeline-manual (chroma-key-standard, optimering, asset-status) |
| `docs/26-001/26-002/26-010` | EU-utlysningsspecifikationer — ⏸ **pausade 2026-08-03**, inget arbete drivs av dem |
| `.planning/PROJECT.md`, `MILESTONES.md` | GSD-milestone-historik (hub-nav v1.0, klar 2026-04-29); STATE/ROADMAP/REQUIREMENTS arkiverade i `archive/2026-07-dokarkiv/` |
| `.planning/AF-API-INTEGRATION-ROADMAP.md` | AF-API-idébank (~60 förslag, status per förslag) |
| `.planning/research/PITFALLS.md` | Kända fallgropar i hub-systemet och dashboard |
| `archive/2026-06-dokkonsolidering/` | Arkiverade planer & granskningar apr–maj 2026 (TECH-DEBT, DESIGN-ROADMAP, LIV, FLAGGED, BLOCKED m.fl.) — README förklarar vad som finns var |

---

## Agenter

Projektets 10 specialiserade agenter finns i `.claude/agents/`:

| Agent | Fokus |
|-------|-------|
| arbetskonsulent | Arbetsmarknad, deltagarnytta, konsultverktyg |
| langtidsarbetssokande | Användarperspektiv, energianpassning, tillgänglighet |
| ux-designer | Användarflöden, WCAG, interaktionsdesign |
| fullstack-utvecklare | React/TypeScript/Supabase-integration |
| accessibility-specialist | WCAG 2.1 AA, skärmläsare, kognitiv tillgänglighet |
| qa-testare | Testning, edge cases, kvalitetssäkring |
| product-owner | User stories, prioritering, värdeskapande |
| ai-engineer | AI-funktioner, personalisering, ML-optimering |
| performance-engineer | Core Web Vitals, laddningstider, optimering |
| security-specialist | Säkerhetsrevision, secrets, RLS, XSS, GDPR → `docs/security-audit.md` |

Använd agenter för granskning: "Låt [agent] granska [funktion/kod]"

### Säkerhetsrevision
Kör säkerhetsagenten för en fullständig audit:
```
Låt security-specialist granska hela projektet
```
Rapporten skrivs till `docs/security-audit.md` och inkluderar:
- Secrets & credentials-sökning
- Supabase RLS-verifiering
- API-endpoints auth-krav
- Input validation (XSS, SQL injection)
- Externa API:er (OAuth, Claude)
- Top 3 att fixa innan launch
