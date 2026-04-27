# Supabase-Only Backend Setup

> **VIKTIGT:** Denna applikation kör 100% via Supabase. Inga egna servrar (Node.js/Express eller PHP) behövs.

---

## Arkitektur

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND (React + Vite)                                        │
│  └── Hostas på: GitHub Pages / Netlify / Vercel                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS / WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  SUPABASE (odcvrdkvzyrbdzvdrhkz.supabase.co)                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  AUTH (Inbyggd)                                         │    │
│  │  └── Inloggning, registrering, lösenordsåterställning   │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  DATABASE (PostgreSQL)                                  │    │
│  │  ├── profiles          - Användarprofiler              │    │
│  │  ├── cvs              - CV-data                        │    │
│  │  ├── cover_letters    - Personliga brev                │    │
│  │  ├── saved_jobs       - Sparade jobb                   │    │
│  │  ├── shared_jobs      - Delade jobb (A3)               │    │
│  │  ├── articles         - Kunskapsbank                   │    │
│  │  ├── interest_results - Intressetestresultat           │    │
│  │  ├── consultant_notes - Konsulentanteckningar         │    │
│  │  └── interview_sessions - Intervjusessioner (B6)      │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  EDGE FUNCTIONS (Serverless)                            │    │
│  │  ├── af-jobsearch       → Arbetsförmedlingen jobbsök    │    │
│  │  ├── af-taxonomy        → Yrkesklassificering           │    │
│  │  ├── af-trends          → Jobbtrender                   │    │
│  │  ├── af-enrichments     → Berikad jobbdata              │    │
│  │  ├── af-jobed           → Relaterad utbildning          │    │
│  │  ├── ai-cover-letter    → AI-genererade brev           │    │
│  │  └── cv-analysis        → CV-analys & feedback         │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  STORAGE                                                │    │
│  │  └── profile_images/, cv_files/                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  REALTIME (WebSockets)                                  │    │
│  │  └── Live-uppdateringar av CV, anteckningar, etc.      │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Miljövariabler (Frontend)

Skapa `client/.env`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://odcvrdkvzyrbdzvdrhkz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Hämta nycklar från:** https://app.supabase.com/project/odcvrdkvzyrbdzvdrhkz/settings/api

---

## Databas-setup

### 1. Kör migrations i Supabase Studio

Gå till: https://app.supabase.com/project/odcvrdkvzyrbdzvdrhkz/sql/new

Kör filerna i ordning:
1. `001_initial_schema.sql`
2. `002_user_activities.sql`
3. `003_cv_versions_rls.sql`
4. `004_add_cv_columns.sql`
5. `005_add_all_missing_cv_columns.sql`
6. `006_add_cv_shares.sql`
7. `20260227123729_create_shared_jobs_table.sql`
8. `20260227130000_add_new_features.sql`

### 2. Aktivera Realtime (för live-uppdateringar)

Gå till: Database → Replication → Realtime

Aktivera för tabeller:
- [x] `cvs`
- [x] `consultant_notes`
- [x] `shared_jobs`

---

## Edge Functions Deployment

### Alternativ 1: Supabase CLI (rekommenderas)

```bash
# Installera Supabase CLI
npm install -g supabase

# Logga in
supabase login

# Länka projektet
supabase link --project-ref odcvrdkvzyrbdzvdrhkz

# Deploy alla functions
supabase functions deploy

# Deploy specifik function
supabase functions deploy af-jobsearch
```

### Alternativ 2: Manuell upload via Dashboard

1. Gå till: https://app.supabase.com/project/odcvrdkvzyrbdzvdrhkz/functions
2. Klicka "Deploy a new function"
3. Välj function från `supabase/functions/`-mappen
4. Ladda upp som .zip eller klistra in koden

---

## Storage Buckets

Skapa buckets i Supabase Studio → Storage:

1. **profile_images** (Public)
   - Allowed MIME types: `image/*`
   - Max file size: 5MB

2. **cv_files** (Private)
   - Allowed MIME types: `application/pdf`
   - Max file size: 10MB

---

## Frontend Build & Deploy

```bash
cd client

# Installera dependencies
npm install

# Bygg för produktion
npm run build

# Deploy till GitHub Pages / Netlify / Vercel
# (dist/-mappen innehåller statiska filer)
```

---

## Felsökning

### "Failed to fetch" eller CORS-fel
- Kontrollera att Supabase URL är korrekt i `.env`
- Verifiera att Edge Functions är deployade

### "Permission denied" på databas
- Kontrollera RLS policies (Row Level Security)
- Se migrations-filer för korrekta policies

### Autentisering fungerar inte
- Verifiera att `VITE_SUPABASE_ANON_KEY` är korrekt
- Kontrollera att användaren finns i Auth → Users

---

## Viktiga filer

| Fil | Beskrivning |
|-----|-------------|
| `client/src/lib/supabase.ts` | Supabase-klient & helpers |
| `client/src/services/supabaseApi.ts` | API-anrop till Supabase |
| `supabase/migrations/*.sql` | Databasschema |
| `supabase/functions/*/` | Edge Functions |

---

## Support

- **Supabase Dashboard:** https://app.supabase.com/project/odcvrdkvzyrbdzvdrhkz
- **Supabase Docs:** https://supabase.com/docs
- **Edge Functions:** https://supabase.com/docs/guides/functions

---

*Senast uppdaterad: 2026-02-27*
