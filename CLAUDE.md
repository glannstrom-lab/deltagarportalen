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
| STA/Arbetsprövning | 4-delars arbetsprövningsresa: deltagarflöde, DOA-självskattning, konsulentvy, AI-utkast för AF-blanketter (`pages/sta/`) | ✅ |
| Jobbsökning | Hitta och spara jobb | - |
| Dagbok | Reflektera och dokumentera | - |
| Hälsa/Wellness | Följ mående och energi | - |
| Fokusläge | Guidat fokusflöde (i18n-namespace `focus.*`) | - |
| Konsultvy | Hantera deltagare, GDPR-logg | - |

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
│   │   ├── ai.js            # Huvud-AI-endpoint (24 funktioner, samlad)
│   │   ├── ai-stream.js     # SSE-streaming för AI-svar
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
- **`client/api/ai.js`** (Vercel serverless, exponerad som `/api/ai`) — 24 funktioner samlade. Snabb cold start, lägre auth-kostnad. **Default för UI-anrop.** Streaming-varianten ligger i `client/api/ai-stream.js` och anropas via `useAIStream`-hooken.
- **`supabase/functions/`** (Deno edge) — 24 funktioner: `ai-*`, `af-*` (Arbetsförmedlingen), `learning-*`, `bolagsverket`, `cv-analysis`, `health`, `delete-account`, `send-invite-email`. Service role, längre prompts, integration mot AF/Bolagsverket.

> **AI-modellen är låst** till `openai/gpt-oss-120b` av kostnadsskäl (`docs/AI_MODEL_LOCKING.md`). Byt aldrig modell utan explicit beslut av Mikael.

När du bygger en ny AI-funktion: säg uttryckligen vilken backend. Annars gissar Claude.

### CI-grindarna (sju st, alla körbara lokalt)

```bash
cd client
npm run lint:ci            # eslint: 0 errors, max 129 warnings (fryst tak)
npm run typecheck:critical # krasch-klassade typfel
npm run typecheck:ceiling  # hela strict-skulden mot fryst tak (471)
npm run lint:design        # gradient-baseline (52)
npm run lint:schema        # schemadrift kod vs prod-schema
npm run test:run           # 865 tester
npm run build
```

De tre **frysta taken** (129 warnings, 471 typfel, 52 gradienter) finns för att skulden ska kunna
minska men inte växa. Höj dem aldrig för att bli grön — sänk dem när du betalar av. Varje
takskript skriver ut det nya talet när skulden minskat.

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
```
client/src/components/
  ui/
    Card, Button, Input, Badge, Avatar, Tabs, Logo
    Progress, ProgressBars, StatCard, EmptyState, LoadingState, Skeleton
    BarChart, LineChart, CircleChart, CalendarWidget
    DropdownMenu, BottomSheet, ConfirmDialog, SearchBar, QuickActions
    Image, OptimizedImage, PageCard, LanguageSelector
  dashboard/
    KpiCard, NextStepCard, OnboardingStep
    DashboardWidget, DashboardGrid, DashboardSection, DashboardSkeleton
    WidgetFilter, WidgetSizeSelector
    QuickActions, QuickActionButton
    CareerReadinessScore, MatchingScoreWidget, ProfileStatusWidget,
    WeeklySummary, WellnessQuickCard, WhyItMatters, DashboardRiasecChart
    widgets/                                      # Lazy-laddade widget-moduler
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

### 2026-04-27: Lazy-import utan route = dödkod
**Problem:** Sidor som `CoverLetterGenerator`, `UnifiedProfile` är `lazy()`-importerade i `App.tsx` men har ingen `<Route>`. De byggs in i bundlen utan att vara nåbara.
**Kontroll:** Sök efter sidonamnet i `<Route` — saknas det ska importen tas bort.
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

### 2026-04-29: Smoke-test mot fel hostname
**Problem:** `deploy.yml` curlade `deltagarportalen.se` men prod ligger på `jobin.se`.
**Lösning:** Smoke-test ska peka på `jobin.se` — `deltagarportalen.se` är staging.

---

## Aktuella granskningar och planer

| Dokument | Innehåll |
|----------|----------|
| `docs/ROADMAP.md` | ★ **Projektets enda gällande plan** (version 2026-07-27) — spår A–I, beslutslogg, allt öppet arbete. Nya idéer förs in här, aldrig i nya plandokument |
| `docs/portal-review-2026-07-27.md` | **Senaste granskning** — kod vs. **prod-schema**. Grund för spår H (schemaintegritet) och I (kvalitetsgrindar/prestanda) |
| `docs/portal-review-2026-07-22.md` | Granskning 2026-07-22 (7 parallella analyser: kod, säkerhet, UX, prestanda, produkt, AI, dokumentation/test) |
| `docs/portal-review-2026-07.md` | Helhetsgranskning 2026-07-10 (grund för roadmapens spårstruktur) |
| `docs/DESIGN.md` | **Designsystemets sanning v3.0** — Manifest + Voice & Tone + två-läges-system (hub-landning vs verktygssida) + en-färg-per-sida-regel |
| `docs/DESIGN-DEBT.md` | Levande lista över designöverträdelser — CI-guardad (`npm run lint:design`) |
| `docs/security-audit.md` | Levande säkerhetsstatus (senast 2026-05-28; CRIT: OpenRouter-nyckelrotation utestående) |
| `docs/COMPLIANCE-AUDIT-2026-05-15.md` + `docs/COMPLIANCE-USER-ACTIONS.md` | Juridiskt läge + åtgärdschecklista (DPIA, Art 30, AI Act — deadline 2 aug 2026) |
| `docs/AI-ACT-CLASSIFICATION.md`, `docs/DPIA-PORTAL.md`, `docs/GDPR-ART30-REGISTER.md` | Compliance-dokument under färdigställande (se ROADMAP §1) |
| `docs/AI_MODEL_LOCKING.md` | Modell-låsning `openai/gpt-oss-120b` — alla AI-vägar |
| `docs/AI_ARCHITECTURE_OVERVIEW.md` | Översikt över AI-stack (Vercel + Supabase edge) |
| `docs/STA-FORBATTRINGSFORSLAG.md`, `docs/sta-automation-roadmap.md`, `docs/sta-*` | STA-modulens detaljspecar (prioriteras från ROADMAP §3b) |
| `docs/api/services-overview.md` | Översikt över services-lagret i `client/src/services/` |
| `docs/claude-code-guide.md` | Hur Claude Code används effektivt i projektet |
| `docs/GRAFIK-PLAN.md` | Grafikpipeline-manual (chroma-key-standard, optimering, asset-status) |
| `docs/26-001/26-002/26-010` | EU-utlysningsspecifikationer (beslut aug 2026, se ROADMAP §3c/§7) |
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
