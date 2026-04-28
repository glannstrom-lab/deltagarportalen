# Deltagarportalen

En jobbsökarportal för arbetssökande (inkl. långtidsarbetslösa) och arbetskonsulenter
som coachar dem. AI-driven CV, personligt brev, intervjusimulator, kompetensanalys och
mer — designat för låg friktion, hög tillgänglighet (WCAG 2.1 AA) och empatisk ton.

**Backend:** Supabase (PostgreSQL + Edge Functions) + Vercel serverless functions
**Frontend:** React 19 + Vite 7 + Tailwind 4 + Zustand + React Query

---

## Funktioner

| Funktion | Beskrivning | AI |
|----------|-------------|----|
| CV-byggare | Steg-för-steg, ATS-analys, PDF-export, 5 templates | ✅ |
| Personligt brev | AI-genererat, 4 templates, PDF-export från HTML | ✅ |
| Intervjusimulator | Mock-intervjuer, AI-feedback, STAR-metoden | ✅ |
| Kompetensanalys | Identifiera gap mot drömjobb | ✅ |
| Intresseguide | RIASEC + Big Five → yrkesrekommendationer | ✅ |
| LinkedIn-optimerare | Förbättra headline, about, posts | ✅ |
| AI-Team | Chatta med specialiserade AI-agenter (karriärcoach m.fl.) | ✅ |
| Jobbsökning | Arbetsförmedlingens API, sverigekarta, dela med konsulent | — |
| Dagbok | Reflektion, dokumentation, mood-tracking | — |
| Wellness | Energi, mående, vilo-tracking | — |
| Konsultvy | Hantera deltagare, rapportering | — |

---

## Teknisk stack

| Lager | Teknik |
|-------|--------|
| Frontend | React 19, TypeScript 5.9, Vite 7, Tailwind 4 |
| State | Zustand 5 (client state), React Query 5 (server state) |
| Routing | React Router 7 (HashRouter — `/#/route`) |
| AI-integration | OpenRouter (default Claude 3.5 Sonnet) via Vercel functions + Supabase Edge |
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions) + Vercel serverless |
| PDF | @react-pdf/renderer + html2canvas + jsPDF (multi-strategy) |
| Test | Vitest + Testing Library + Playwright (E2E) |
| Monitoring | Sentry (cookie-consent-gated) |
| Deploy | Vercel (frontend + serverless), Supabase (DB + edge) |

---

## Snabbstart

```bash
git clone https://github.com/glannstrom-lab/deltagarportalen.git
cd deltagarportalen/client
npm install
cp .env.example .env  # fyll i Supabase URL + anon key
npm run dev           # http://localhost:5173 (port faller tillbaka 3000/3001/3002)
```

`.env`:
```env
VITE_SUPABASE_URL=https://<projekt>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiI...
```

---

## Vanliga kommandon

```bash
# Utveckling
cd client && npm run dev          # vite dev server
npx tsc --noEmit                  # typecheck (snabb felsökning)

# Test
npm run test                      # vitest watch
npm run test:run                  # vitest single-run
npm run test:coverage             # med coverage-rapport
npx playwright test e2e/smoke.spec.ts --project=chromium  # E2E smoke

# Build
npm run build                     # production-bundle till client/dist/
npm run analyze                   # bundle-storleksanalys

# Linting
npm run lint
```

---

## Supabase

### Migrations — VIKTIGT

**Använd INTE `npx supabase db push`** — den försöker köra alla migrationer
från början och faller på dubbletter (vi har kända konflikter, se
`supabase/migrations/MIGRATION_NOTES.md`).

Kör enskilda migrationer manuellt:

```bash
# Kör en specifik migration mot prod-DB
npx supabase db query --linked -f supabase/migrations/2026XXXX_namn.sql

# Verifiera schema
npx supabase db query --linked "SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles'" --output table

# Lista RLS-status per tabell
npx supabase db query --linked "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
```

### Edge Functions

```bash
cd supabase
npx supabase functions deploy <namn> --linked
```

Aktiva edge functions: `ai-assistant`, `ai-cover-letter`, `ai-cv-writing`,
`ai-career-assistant`, `ai-company-search`, `ai-company-analysis`,
`ai-industry-radar`, `ai-commute-planner`, `cv-analysis`, `learning-recommend`,
`learning-progress`, `learning-analyze-gap`, plus AF-API-proxies (`af-jobsearch`,
`af-taxonomy`, `af-trends`, etc.), `bolagsverket`, `delete-account`,
`send-invite-email`, `health`.

### Secrets

```bash
npx supabase secrets set OPENROUTER_API_KEY=sk-or-...
npx supabase secrets set AI_MODEL=anthropic/claude-3.5-sonnet
```

---

## Projektstruktur

```
deltagarportalen/
├── client/                       React frontend (aktiv)
│   ├── api/                      Vercel serverless functions
│   │   ├── ai.js                 18 AI-funktioner (cv, cover-letter, etc.)
│   │   ├── ai-stream.js          Streaming SSE-variant
│   │   └── ...
│   └── src/
│       ├── components/           React-komponenter (organiserade per feature)
│       ├── pages/                Sidkomponenter (lazy-loadade)
│       ├── services/             API-wrappers (Supabase, AF, AI, etc.)
│       ├── stores/               Zustand-stores (auth, settings, profile, cv)
│       ├── hooks/                React hooks (useDashboardData, useCVAutoSave)
│       ├── lib/                  domains.ts (route→domän), supabase.ts, logger.ts
│       └── styles/               tokens.css (designsystem), globals
│
├── api/                          Top-level Vercel functions
│   ├── google-calendar.js
│   └── linkedin-auth.js
│
├── supabase/
│   ├── functions/                Deno edge functions (28 st)
│   ├── migrations/               SQL-migrationer (85+ filer, se MIGRATION_NOTES.md)
│   └── config.toml
│
├── docs/                         Aktiv projektdokumentation
│   ├── DESIGN.md                 Designsystem (C-Pastell, 3 domäner)
│   ├── ROADMAP.md                12-månaders plan
│   ├── portal-review-2026-04.md  Helhetsgranskning
│   ├── claude-code-guide.md      Hur Claude Code används effektivt
│   └── security-audit.md         Säkerhetsrevision
│
├── e2e/                          Playwright E2E-tester
├── design-demos/                 Standalone HTML för designval
├── archive/2026-q1/              Arkiverad sprint-dokumentation
├── server/                       ⛔ INAKTIV (gammal Express-backend)
├── CLAUDE.md                     Instruktioner för Claude Code
├── SECURITY.md                   Säkerhetsrutiner
└── README.md                     (denna fil)
```

---

## Designsystem

Specifikation i `docs/DESIGN.md`. Sammanfattning: turkos primär + 3 domäner i
pastell-intensitet. Aktiveras automatiskt per route via `[data-domain]`-CSS:

| Domän | Färg | Sidor |
|-------|------|-------|
| Action | Turkos | Dashboard, AI-Team, Settings, Help, Resources |
| Reflektion | Lila | CV, Personligt brev, Wellness, Diary, Karriär |
| Utåtriktat | Persika | Jobbsökning, Ansökningar, LinkedIn, Salary |

Domän-mappning i `client/src/lib/domains.ts`. CSS-tokens i
`client/src/styles/tokens.css`. Visuell referens: `design-demos/demo-C-pastell.html`.

---

## Dokumentation

| Dokument | Syfte |
|----------|-------|
| `CLAUDE.md` | Projektkontext för Claude Code (build-kommandon, konventioner) |
| `docs/portal-review-2026-04.md` | Helhetsgranskning (arkitektur, säkerhet, kvalitet) |
| `docs/ROADMAP.md` | 12 månader framåt |
| `docs/DESIGN.md` | Designsystem |
| `docs/claude-code-guide.md` | Hur Claude Code används i projektet |
| `docs/security-audit.md` | Säkerhetsrevision (april 2026) |
| `docs/audit-2026-04.md` | UI-audit |
| `e2e/README.md` | E2E-test-aktivering |
| `supabase/migrations/MIGRATION_NOTES.md` | Kända migrations-konflikter |

---

## Roller & åtkomst

- **USER** (deltagare) — egen CV, brev, jobb, dagbok
- **CONSULTANT** — alla deltagares CV/brev/aktivitet hen är knuten till
- **ADMIN** — alla deltagare + konsulenter
- **SUPERADMIN** — admin + audit-logs + system-config

Rollkontroll via `PrivateRoute` + Supabase RLS på alla 130 publika tabeller.

---

## Bidra

1. Skapa branch från `main`
2. Kör `npx tsc --noEmit && npm run test:run` lokalt
3. Skapa PR — CI körs automatiskt (lint, typecheck, vitest, build, lighthouse,
   security scan, e2e smoke)
4. Coverage-rapport visas i PR-summary

---

## Licens

MIT

*Senast uppdaterad: 2026-04-28*
