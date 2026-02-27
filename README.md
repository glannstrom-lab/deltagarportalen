# Deltagarportalen

En användarportal för arbetssökande med fokus på effektivisering av arbetskonsulenters arbete och värde för deltagarna.

**🚀 Backend:** 100% Supabase (PostgreSQL + Edge Functions)  
**🎨 Frontend:** React + Vite + Tailwind CSS

---

## Funktioner

### 🔐 Autentisering
- Registrering och inloggning (Supabase Auth)
- JWT-baserad autentisering
- Rollbaserad åtkomst (användare, konsulent, admin)

### 📝 CV-Generator
- Steg-för-steg CV-byggare
- Personlig information
- Arbetslivserfarenhet
- Utbildning
- Färdigheter
- ATS-kompatibilitetsanalys
- **PDF-export** ✅
- **LinkedIn-import** ✅

### ✉️ Personligt Brev-Generator
- AI-baserad generering (OpenAI via Supabase Edge Function)
- Input för jobbannons
- Stilreferens från tidigare brev
- Spara och hantera flera brev

### 🧭 Intresseguide (RIASEC)
- Holland-koder test
- Big Five personlighetstest
- Fysiska förutsättningar
- Yrkesrekommendationer

### 🔍 Jobbsök
- Integration med Arbetsförmedlingens API
- **Sverigekarta** för geografisk filtrering ✅
- Spara och hantera jobb
- **Dela jobb med konsulent** ✅

### 📚 Kunskapsbank
- Artiklar om arbetsmarknaden
- Hälsa och välmående
- Sök och filter
- Kategorier

### 🎯 Intervjuförberedelse
- **STAR-metoden guide** ✅
- **Mock-intervjuer** med AI-feedback ✅
- Vanliga intervjufrågor

### 📊 Prestanda & UX
- **Caching** för API-anrop ✅
- **Retry-mekanism** med exponential backoff ✅
- **Skeleton loaders** för bättre upplevelse ✅

---

## Teknisk Stack

### Backend (Supabase)
| Komponent | Teknik |
|-----------|--------|
| Database | PostgreSQL |
| Auth | Supabase Auth (inbyggd) |
| API | Supabase JavaScript Client |
| Serverless Functions | Deno Edge Functions |
| AI-integration | OpenAI API (via Edge Functions) |
| File Storage | Supabase Storage |
| Realtime | Supabase Realtime (WebSockets) |

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Zustand (state management)
- React Query (data fetching)
- Lucide React (ikoner)
- jsPDF + jspdf-autotable (PDF-generering)

---

## Installation

### 1. Klona repot
```bash
git clone https://github.com/glannstrom-lab/deltagarportalen.git
cd deltagarportalen
```

### 2. Installera frontend-beroenden
```bash
cd client
npm install
```

### 3. Konfigurera miljövariabler
```bash
cp .env.example .env
# Redigera .env med dina Supabase-inställningar
```

`.env`:
```env
VITE_SUPABASE_URL=https://odcvrdkvzyrbdzvdrhkz.supabase.co
VITE_SUPABASE_ANON_KEY=din-anon-key-här
```

### 4. Starta utvecklingsservern
```bash
npm run dev
```

Frontend körs på http://localhost:5173

---

## Supabase Setup

### Databas
Kör migrations i Supabase Studio SQL Editor:

```bash
# Alla migrations finns i supabase/migrations/
# Kör i nummerordning:
1. 001_initial_schema.sql
2. 002_user_activities.sql
3. 003_cv_versions_rls.sql
4. 004_add_cv_columns.sql
5. 005_add_all_missing_cv_columns.sql
6. 006_add_cv_shares.sql
7. 20260227123729_create_shared_jobs_table.sql
8. 20260227130000_add_new_features.sql
```

### Edge Functions
Deploya functions till Supabase:

```bash
cd supabase

# Installera Supabase CLI om du inte har den
npm install -g supabase

# Logga in
supabase login

# Länka projekt
supabase link --project-ref odcvrdkvzyrbdzvdrhkz

# Deploy alla functions
supabase functions deploy
```

**Edge Functions:**
- `af-jobsearch` - Arbetsförmedlingen jobbsök
- `af-taxonomy` - Yrkesklassificering
- `af-trends` - Jobbtrender
- `af-enrichments` - Berikad jobbdata
- `af-jobed` - Relaterad utbildning
- `ai-cover-letter` - AI-genererade personliga brev
- `cv-analysis` - CV-analys & feedback

Se [SUPABASE_ONLY_SETUP.md](SUPABASE_ONLY_SETUP.md) för detaljerad setup-guide.

---

## Miljövariabler

### Frontend (client/.env)
```env
VITE_SUPABASE_URL=https://odcvrdkvzyrbdzvdrhkz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Edge Functions (Supabase Secrets)
```bash
# Sätt secrets för Edge Functions
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set AF_API_KEY=din-af-api-nyckel
```

---

## Bygga för produktion

```bash
cd client
npm run build
```

Resultatet hamnar i `dist/`-mappen och kan deployas till:
- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- Egen webbserver

---

## Projektstruktur

```
deltagarportalen/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React-komponenter
│   │   ├── pages/          # Sidkomponenter
│   │   ├── services/       # API-services (Supabase)
│   │   ├── lib/            # Supabase-klient
│   │   └── types/          # TypeScript-typer
│   └── dist/               # Byggda filer
│
├── supabase/               # Supabase-konfiguration
│   ├── functions/          # Edge Functions
│   ├── migrations/         # Databas-migrations
│   └── config.toml         # Supabase-config
│
├── server/                 # ⛔ INAKTIV (gammal Node.js backend)
├── php-backend/            # ⛔ INAKTIV (gammal PHP backend)
│
└── README.md
```

---

## Framtida funktioner

- [ ] Mobilapp (PWA/Native)
- [ ] AI-chatbot för karriärrådgivning
- [ ] Kalender för möten med konsulent
- [ ] E-postnotiser
- [ ] Statistik för arbetskonsulenter
- [ ] Integration med fler jobbsajter

---

## Licens

MIT

---

## Utvecklat av

Denna portal är utvecklad för att hjälpa arbetssökande på deras väg till nytt jobb.

---

*Senast uppdaterad: 2026-02-27*
