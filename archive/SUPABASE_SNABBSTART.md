# Supabase Snabbstart för Deltagarportalen

Allt är nu konfigurerat! Här är stegen för att komma igång:

## ✅ Vad som har skapats

```
supabase/
├── config.toml                          # Supabase CLI-konfig
├── migrations/
│   └── 001_initial_schema.sql           # Alla tabeller + RLS
├── functions/
│   ├── ai-cover-letter/
│   │   ├── index.ts                     # AI-generering av brev
│   │   └── config.toml
│   └── cv-analysis/
│       ├── index.ts                     # CV-matchningsanalys
│       └── config.toml
└── .env.example                         # Mall för miljövariabler

client/
├── src/
│   ├── lib/
│   │   └── supabase.ts                  # Supabase client + helpers
│   └── hooks/
│       └── useSupabase.ts               # React hooks
└── .env.example                         # Frontend miljövariabler

SUPABASE_SETUP_GUIDE.md                  # Detaljerad guide
```

## 🚀 Kom igång på 5 minuter

### 1. Skapa Supabase-projekt (webben)
```
→ Gå till https://app.supabase.com
→ "New Project" 
→ Kopiera URL och anon key
```

### 2. Konfigurera frontend
```bash
cd client
cp .env.example .env
# Redigera .env med dina värden:
# VITE_SUPABASE_URL=https://xyz123.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJ...
```

### 3. Kör databas-migration
**Via SQL Editor (enklaste):**
```
→ I Supabase dashboard, gå till "SQL Editor"
→ Klicka "New query"
→ Kopiera hela innehållet från supabase/migrations/001_initial_schema.sql
→ Klicka "Run"
```

### 4. Installera frontend-beroenden
```bash
cd client
npm install @supabase/supabase-js
```

### 5. Testa!
```bash
cd client
npm run dev
# Gå till http://localhost:5173
```

## 🔧 För AI-funktioner (valfritt)

Om du vill använda AI-generering:

1. Skaffa OpenAI API-nyckel: https://platform.openai.com
2. Installera Supabase CLI:
   ```bash
   npm install -g supabase
   supabase login
   ```
3. Länka projektet:
   ```bash
   supabase link --project-ref ditt-projekt-id
   ```
4. Sätt miljövariabler:
   ```bash
   supabase secrets set OPENAI_API_KEY=sk-din-nyckel
   ```
5. Deploya funktioner:
   ```bash
   supabase functions deploy ai-cover-letter
   supabase functions deploy cv-analysis
   ```

## 📋 Viktiga miljövariabler

| Fil | Variabel | Varifrån |
|-----|----------|----------|
| `client/.env` | `VITE_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `client/.env` | `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API (anon public) |
| Supabase Secrets | `OPENAI_API_KEY` | OpenAI Dashboard |

## 🧪 Testa Supabase-anslutning

Skapa denna komponent för att testa:

```tsx
// TestSupabase.tsx
import { useEffect, useState } from 'react'
import { supabase, getCurrentUser } from '../lib/supabase'

export function TestSupabase() {
  const [status, setStatus] = useState('Testar...')

  useEffect(() => {
    async function test() {
      // Testa auth
      const user = await getCurrentUser()
      
      // Testa databas
      const { data: articles } = await supabase
        .from('articles')
        .select('*')
        .limit(1)
      
      if (articles && articles.length > 0) {
        setStatus(`✅ Supabase fungerar! ${articles.length} artikel(er) hittade.`)
      } else {
        setStatus('⚠️ Supabase ansluten men inga artiklar hittade')
      }
    }
    test()
  }, [])

  return <div>{status}</div>
}
```

## 🔄 Nästa steg

### Byt ut gammal auth:
```tsx
// GAMMALT:
import { useAuthStore } from './stores/authStore'

// NYTT:
import { useAuth } from './hooks/useSupabase'
const { user, profile, signIn, signOut } = useAuth()
```

### Byt ut API-anrop:
```tsx
// GAMMALT:
const response = await fetch('/api/cv', {...})

// NYTT:
const { data } = await supabase
  .from('cvs')
  .select('*')
  .eq('user_id', userId)
  .single()
```

## 🛟 Felsökning

**Problem: "Failed to fetch"**
→ Kontrollera att `VITE_SUPABASE_URL` är korrekt (ska sluta på .supabase.co)

**Problem: "Invalid API key"**
→ Använder du `anon` key, inte `service_role`?

**Problem: "violates row-level security policy"**
→ Har du loggat in? RLS kräver autentiserad användare.

**Problem: "relation does not exist"**
→ Har du kört migration? Gå till SQL Editor och kör filen igen.

## 📞 Support

- Supabase Docs: https://supabase.com/docs
- Detaljerad guide: se `SUPABASE_SETUP_GUIDE.md`
- Frågor? Kontrollera att du följt stegen ovan först!

---

**Redo att börja koda?** Allt grundkonfiguration är klart - kör `npm run dev` och börja bygga! 🚀
