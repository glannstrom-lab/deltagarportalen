# Deltagarportalen - Claude Code Guidelines

## Projektöversikt

**Deltagarportalen** är en jobbsökarportal som hjälper arbetssökande att hitta jobb genom AI-drivna verktyg. Portalen används av deltagare (arbetssökande) och arbetskonsulenter (handledare).

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
| Jobbsökning | Hitta och spara jobb | - |
| Dagbok | Reflektera och dokumentera | - |
| Hälsa/Wellness | Följ mående och energi | - |
| Konsultvy | Hantera deltagare | - |

---

## Teknikstack

```
Frontend:     React 19, TypeScript 5.9, Vite 7
Styling:      Tailwind CSS 4, Framer Motion
State:        Zustand, React Query (TanStack)
Auth/DB:      Supabase
i18n:         i18next (svenska/engelska)
Test:         Vitest, Testing Library
Deploy:       Vercel (serverless functions)
Monitoring:   Sentry
```

### Projektstruktur
```
deltagarportal/
├── client/           # React frontend
│   ├── src/
│   │   ├── components/   # Återanvändbara komponenter
│   │   ├── pages/        # Sidor (~85 st)
│   │   ├── stores/       # Zustand stores
│   │   ├── services/     # API-anrop
│   │   └── lib/          # Utilities
├── server/           # Express backend (legacy)
├── api/              # Vercel serverless functions
│   └── ai.js         # Konsoliderad AI-endpoint (14 funktioner)
├── supabase/         # Databasmigrationer
└── .claude/agents/   # AI-agenter för granskning
```

---

## Utvecklingskommandon

```bash
# Starta utvecklingsserver
cd client && npm run dev

# Bygg för produktion
npm run build

# Kör tester
npm run test           # Watch mode
npm run test:run       # Single run
npm run test:coverage  # Med coverage

# TypeScript-kompilering (för felsökning)
npx tsc --noEmit
```

### Supabase-migrationer

**VIKTIGT:** Använd INTE `npx supabase db push` - det försöker köra ALLA migrationer och failar på konflikter.

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

1. **Läs koden** - Öppna och läs de relevanta filerna noggrant
2. **Kontrollera syntax** - Imports, exports, parenteser
3. **Kör TypeScript** - `npx tsc --noEmit` visar typfel
4. **Kolla webbläsarkonsolen** - Runtime-fel
5. **Lägg till debug-kod** - Endast som sista utväg

> **LÄS ALLTID KODEN FÖRST.** Grundläggande syntaxfel upptäcks snabbt genom att faktiskt titta på koden.

### AI-anrop går till TVÅ backends
Det finns två parallella AI-vägar — välj rätt:
- **`/api/ai.js`** (Vercel) — 18 funktioner samlade. Streaming, snabb cold start, lägre auth-kostnad. Default för UI-anrop.
- **`supabase/functions/`** (Deno edge) — 23 funktioner. Service role, längre prompts, integration mot AF/Bolagsverket.

När du bygger en ny AI-funktion: säg uttryckligen vilken backend. Annars gissar Claude.

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
AI-endpoints finns i `/api/ai.js` och anropas via:
```typescript
const response = await fetch('/api/ai', {
  method: 'POST',
  body: JSON.stringify({
    function: 'funktionsnamn',  // cv, personligt-brev, intervju, etc.
    ...params
  })
})
```

---

## UI/Design-instruktioner

### Innan du ändrar UI
1. **Läs `docs/DESIGN.md`** — den definierar färg, form, hierarki
2. **Kolla `7.png`** i rotmappen som designreferens
3. **Sök i `components/ui/`** om komponenten redan finns — återanvänd alltid, kopiera aldrig

### När du redesignar en sida
1. Be om eller hänvisa till en screenshot av nuvarande sida
2. Lista vilka designprinciper som bryts
3. Föreslå förändringar komponent för komponent
4. Visa diff innan implementation

### Innan du lägger till en ny färg
**Stopp.** Använd befintliga tokens i `tailwind.config.ts`.
Om du verkligen behöver en ny färg — fråga först.

### Innan du lägger till en ny komponent
Sök i `components/ui/` och `components/dashboard/`. Om något liknande finns, utöka det med en variant istället för att skapa nytt.

### Komponentkatalog
```
components/
  ui/
    Card.tsx           — bas-kort
    Button.tsx         — primär/sekundär/ghost
    Progress.tsx       — progress bars
    StatCard.tsx       — KPI-kort variant
  dashboard/
    KpiCard.tsx        — neutral och tinted variant
    NextStepCard.tsx   — turkos CTA-banner
    GettingStartedChecklist.tsx  — "Kom igång" checklista
    OnboardingStep.tsx — steg i onboarding
  layout/
    Sidebar.tsx        — sidomeny
    TopBar.tsx         — topbar
    PageLayout.tsx     — wrapper för sidor
```

---

## Lärdomar från Felsökning

### 2026-04-09: White Screen på Landing Page
**Problem:** Startsidan visade vit skärm.
**Orsak:** `console.log()` låg FÖRE `import`-satser - ogiltig ES-modulsyntax.
**Lösning:** Imports måste alltid komma först i filen.

### 2026-04-09: Sidor visade Dashboard istället
**Problem:** Nya sidor fångades av catch-all route.
**Orsak:** Routes saknades i `App.tsx` trots att imports fanns.
**Kontroll:** Jämför `navigation.ts` paths med `App.tsx` routes.

### 2026-04-27: Lazy-import utan route = dödkod
**Problem:** Sidor som `CoverLetterGenerator`, `UnifiedProfile` är `lazy()`-importerade i `App.tsx` men har ingen `<Route>`. De byggs in i bundlen utan att vara nåbara.
**Kontroll:** Sök efter sidonamnet i `<Route` — saknas det ska importen tas bort.
**Aktiva entry-points 2026-04-27:** Se `docs/portal-review-2026-04.md` § 1.

---

## Aktuella granskningar och planer

| Dokument | Innehåll |
|----------|----------|
| `docs/portal-review-2026-04.md` | Senaste helhetsgranskning – arkitektur, databas, säkerhet, repo-hygien + 12-punkts åtgärdslista. |
| `docs/ROADMAP.md` | 12-månaders roadmap (stabilisera → EU-projekt → konsolidera). |
| `docs/claude-code-guide.md` | Hur Claude Code används effektivt i projektet (agenter, skills, hooks, slash commands, fallgropar). |
| `docs/security-audit.md` | Säkerhetsrevision 2026-04-23 (alla HIGH åtgärdade). |
| `docs/audit-2026-04.md` | UI-audit mot DESIGN.md. |
| `docs/DESIGN.md` | Designsystemets sanning (domänfärger, hierarki, komponenter). |
| `docs/26-001/26-002/26-010` | EU-utlysningsspecifikationer för framtida funktioner. |

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
