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
| Jobbsökning | Hitta och spara jobb | - |
| Dagbok | Reflektera och dokumentera | - |
| Hälsa/Wellness | Följ mående och energi | - |
| Konsultvy | Hantera deltagare | - |

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
│   │   ├── ai-stream.js     # SSE-streaming för AI-svar
│   │   ├── job-alerts.js    # E-postaviseringar för jobb
│   │   ├── upload-image.js  # Profilbild → Vercel Blob
│   │   └── test.js, package.json
│   └── src/
│       ├── components/      # ui/, dashboard/, layout/, ai-team/, ...
│       ├── pages/           # ~58 sidor + hub-sidor i pages/hubs/
│       ├── stores/          # Zustand stores
│       ├── services/        # API-anrop (aiApi.ts m.fl.)
│       ├── hooks/           # 30+ custom hooks
│       └── lib/             # supabase, sentry, validators, ...
├── api/                     # Repo-root Vercel functions
│   ├── google-calendar.js   # Google Calendar OAuth
│   ├── linkedin-auth.js     # LinkedIn OAuth
│   └── _utils/              # rate-limiter.js (Supabase-distribuerad)
├── server/                  # Express backend (legacy, oanvänd i prod)
├── supabase/                # Migrations + 23 edge functions
│   ├── functions/           # Deno edge — ai-*, af-*, learning-*, bolagsverket, ...
│   └── migrations/
├── e2e/                     # Playwright-tester
├── docs/                    # Granskningar, DESIGN.md, ROADMAP, audits
├── archive/                 # Gamla rapporter och dokument
├── .planning/               # Pågående milestone-arbete (PROJECT, ROADMAP, STATE)
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
- **`client/api/ai.js`** (Vercel serverless, exponerad som `/api/ai`) — 18 funktioner samlade. Snabb cold start, lägre auth-kostnad. **Default för UI-anrop.** Streaming-varianten ligger i `client/api/ai-stream.js` och anropas via `useAIStream`-hooken.
- **`supabase/functions/`** (Deno edge) — 23 funktioner: `ai-*`, `af-*` (Arbetsförmedlingen), `learning-*`, `bolagsverket`, `cv-analysis`, `health`, `delete-account`, `send-invite-email`. Service role, längre prompts, integration mot AF/Bolagsverket.

När du bygger en ny AI-funktion: säg uttryckligen vilken backend. Annars gissar Claude.

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
1. **Läs `docs/DESIGN.md`** — definierar färgsystem, header, hierarki, typografi
2. **Designreferenser i rotmappen:** `ny1.png`–`ny5.png` (senaste designiterationer)
3. **Sök i `client/src/components/ui/`** om komponenten redan finns — återanvänd alltid, kopiera aldrig

### Designsystemet (DESIGN.md, aktivt från 2026-04-29)
- **Hjältesektion = neutral grå** (`--header-bg`) på alla sidor — ingen domänfärg, inga gradients i toppen. 4px vänsterkant i domänfärg ger subtil identifiering.
- **5 domäner:** `action` (mint), `info` (sky), `activity` (persika), `wellbeing` (lavendel), `coaching` (rosa). Definieras via `<div data-domain="...">`.
- **Bakåtkompatibilitet:** `reflection` aliasar till `wellbeing`, `outbound` aliasar till `activity` — bevarar fungerande sidor.
- **Inga gradients i återkommande UI** (KPI-kort, sektionsheaders, knappar). Platt pastell räcker.
- **Pasteller bor i innehållet** — inte i rubrikbanderoller.

### När du redesignar en sida
1. Be om eller hänvisa till en screenshot av nuvarande sida
2. Lista vilka designprinciper som bryts
3. Föreslå förändringar komponent för komponent
4. Visa diff innan implementation

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
    KpiCard, NextStepCard, GettingStartedChecklist, OnboardingStep
    DashboardWidget, DashboardGrid, DashboardSection, DashboardSkeleton
    CompactDashboard, MobileDashboard, WidgetFilter, WidgetSizeSelector
    QuickActions, QuickActionButton, QuickWinButton, SmartQuickWinButton
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
**Aktiva entry-points 2026-04-27:** Se `docs/portal-review-2026-04.md` § 1.

### 2026-04-29: Hub-aktivering kräver URL-prefix-fri matchning
**Problem:** Aktiv hub kunde feldetekteras vid djup-länkar.
**Lösning:** Använd `pageToHub`-mappen byggd från `navHubs[].memberPaths`. **Aldrig** URL-prefix-matchning. Se `.planning/research/PITFALLS.md` (Pitfall 2).

### 2026-04-29: Smoke-test mot fel hostname
**Problem:** `deploy.yml` curlade `deltagarportalen.se` men prod ligger på `jobin.se`.
**Lösning:** Smoke-test ska peka på `jobin.se` — `deltagarportalen.se` är staging.

---

## Aktuella granskningar och planer

| Dokument | Innehåll |
|----------|----------|
| `docs/portal-review-2026-04.md` | Senaste helhetsgranskning — arkitektur, databas, säkerhet, repo-hygien + 12-punkts åtgärdslista |
| `docs/ROADMAP.md` | 12-månaders roadmap (stabilisera → EU-projekt → konsolidera) |
| `docs/claude-code-guide.md` | Hur Claude Code används effektivt i projektet |
| `docs/security-audit.md` | Säkerhetsrevision 2026-04-23 (alla HIGH åtgärdade) |
| `docs/audit-2026-04.md` | UI-audit mot DESIGN.md |
| `docs/DESIGN.md` | **Designsystemets sanning** — 5 domäner, neutral header, inga gradients |
| `docs/AI_ARCHITECTURE_OVERVIEW.md` | Översikt över AI-stack (Vercel + Supabase edge) |
| `docs/AI_ENGINEER_ANALYSIS.md` | Djupanalys av AI-funktionerna och förbättringsförslag |
| `docs/RLS_VERIFICATION.md` | Supabase RLS-policy-verifiering |
| `docs/SPRINT_SUMMARY.md` | Senaste sprintens sammanfattning |
| `docs/services-overview.md` | Översikt över services-lagret i `client/src/services/` |
| `docs/26-001/26-002/26-010` | EU-utlysningsspecifikationer för framtida funktioner |
| `.planning/PROJECT.md`, `ROADMAP.md`, `STATE.md` | Pågående milestone-arbete |
| `.planning/research/PITFALLS.md` | Kända fallgropar i hub-systemet och dashboard |

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
