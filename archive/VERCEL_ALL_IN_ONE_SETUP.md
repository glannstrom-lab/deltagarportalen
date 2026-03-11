# 🚀 Vercel All-in-One Setup Guide

Denna guide hjälper dig att flytta hela din AI-backend från lokal server till Vercel Serverless Functions.

## 📋 Vad vi gör

- **Frontend**: React + Vite på Vercel (som byggs automatiskt)
- **AI-API**: Serverless Functions på Vercel (ersätter din lokala Node.js-server)
- **Databas**: Supabase (oförändrad)

---

## 🎯 Fördelar med denna lösning

✅ **Gratis** upp till 100 GB-timmar/månad  
✅ **Automatisk deploy** vid varje push till GitHub  
✅ **Preview URLs** för varje branch  
✅ **Ingen server att underhålla**  
✅ **HTTPS ingår**  
✅ **Global CDN** för snabb laddning  

---

## 📁 Nya filer som skapats

```
client/
├── vercel.json              # Vercel-konfiguration
├── api/                     # Serverless Functions
│   ├── health.ts           # Health check
│   ├── models.ts           # Lista AI-modeller
│   ├── config.ts           # API-konfiguration
│   └── ai/
│       └── [function].ts   # Huvud-AI-handler (alla AI-anrop)
└── package.json            # Uppdaterad med @vercel/node
```

---

## 🚀 Steg-för-steg Setup

### Steg 1: Installera Vercel CLI (valfritt, men rekommenderas)

```bash
npm install -g vercel
```

### Steg 2: Skapa Vercel-konto och projekt

1. Gå till [vercel.com](https://vercel.com)
2. Klicka "Sign Up" → välj "Continue with GitHub"
3. Godkänn behörigheter
4. Klicka "Add New Project"
5. Välj ditt GitHub-repo (deltagarportalen)
6. Konfigurera:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Steg 3: Konfigurera miljövariabler

I Vercel Dashboard:
1. Gå till project → Settings → Environment Variables
2. Lägg till dessa variabler:

```
OPENROUTER_API_KEY=sk-or-v1-...          # Din OpenRouter API-nyckel
AI_MODEL=anthropic/claude-3.5-sonnet     # Valfri modell (eller använd standard)
SITE_URL=https://deltagarportalen.se     # Din domän (eller vercel-url)
```

### Steg 4: Uppdatera frontend API-anrop

Du behöver uppdatera din frontend för att anropa de nya endpointsen. Skapa eller uppdatera din AI-service:

```typescript
// client/src/services/aiService.ts

const API_URL = import.meta.env.VITE_AI_API_URL || '/api';

export async function callAIFunction(functionName: string, data: any) {
  const response = await fetch(`${API_URL}/ai/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ function: functionName, data }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Något gick fel');
  }

  return response.json();
}

// Specifika funktioner
export const aiService = {
  cvOptimering: (cvText: string, yrke?: string) => 
    callAIFunction('cv-optimering', { cvText, yrke }),
  
  genereraCvText: (data: { yrke: string; erfarenhet?: string; utbildning?: string; styrkor?: string }) =>
    callAIFunction('generera-cv-text', data),
  
  personligtBrev: (data: { jobbAnnons: string; erfarenhet?: string; motivering?: string; namn?: string; ton?: string }) =>
    callAIFunction('personligt-brev', data),
  
  intervjuForberedelser: (data: { jobbTitel: string; foretag?: string; erfarenhet?: string; egenskaper?: string }) =>
    callAIFunction('intervju-forberedelser', data),
  
  jobbtips: (data: { intressen?: string; tidigareErfarenhet?: string; hinder?: string; mal?: string }) =>
    callAIFunction('jobbtips', data),
  
  loneforhandling: (data: { roll: string; erfarenhetAr?: number; nuvarandeLon?: number; foretagsStorlek?: string; ort?: string }) =>
    callAIFunction('loneforhandling', data),
  
  chatbot: (meddelande: string, historik?: any[]) =>
    callAIFunction('chatbot', { meddelande, historik }),
};
```

### Steg 5: Lägg till miljövariabler i frontend

```bash
# client/.env
VITE_SUPABASE_URL=https://ditt-project.supabase.co
VITE_SUPABASE_ANON_KEY=din-nyckel-här
# Ingen AI_API_URL behövs - använder samma domän (/api)
```

### Steg 6: Testa lokalt (valfritt)

```bash
cd client

# Installera nya dependencies
npm install

# Starta Vercel lokalt
vercel dev
```

Detta startar både frontend och API lokalt.

### Steg 7: Deploya!

```bash
# Commit och push till GitHub
git add .
git commit -m "Migrerat AI till Vercel Serverless Functions"
git push origin main
```

Vercel bygger och deployar automatiskt!

---

## 🔧 Tillgängliga API-endpoints

Efter deploy har du följande endpoints:

| Endpoint | Metod | Beskrivning |
|----------|-------|-------------|
| `/api/health` | GET | Health check |
| `/api/models` | GET | Lista AI-modeller |
| `/api/config` | GET | API-konfiguration |
| `/api/ai/cv-optimering` | POST | CV-optimering |
| `/api/ai/generera-cv-text` | POST | Generera CV-text |
| `/api/ai/personligt-brev` | POST | Skriv personligt brev |
| `/api/ai/intervju-forberedelser` | POST | Intervjuförberedelser |
| `/api/ai/jobbtips` | POST | Jobbsökartips |
| `/api/ai/loneforhandling` | POST | Löneförhandling |
| `/api/ai/chatbot` | POST | Allmän chatbot |

### Exempel på anrop:

```bash
curl -X POST https://din-app.vercel.app/api/ai/cv-optimering \
  -H "Content-Type: application/json" \
  -d '{
    "function": "cv-optimering",
    "data": {
      "cvText": "Jag har jobbat som...",
      "yrke": "undersköterska"
    }
  }'
```

---

## ⚠️ Viktigt att veta

### Timeout-gränser
- **Hobby-plan (gratis)**: 10 sekunder max
- **Pro-plan**: 60 sekunder max

De flesta AI-anrop tar 3-8 sekunder, så 10 sekunder räcker vanligtvis.

### Cold Starts
- Funktioner "somnar" vid inaktivitet (efter ~5 min)
- Första anropet efter inaktivitet tar 1-2 sekunder extra
- Lösning: Sätt upp en "keep-alive" ping (valfritt)

### Rate Limiting
- Inbyggt: 20 requests per 15 minuter per IP
- Kan justeras i koden om nödvändigt

---

## 🐛 Felsökning

### "Function not found"
- Kontrollera att `vercel.json` finns
- Se till att filerna är i `client/api/` mappen
- Kör `vercel --version` för att se att CLI är installerat

### "OPENROUTER_API_KEY not found"
- Kontrollera att miljövariabeln är satt i Vercel Dashboard
- Redeploya efter att du lagt till variabler

### CORS-fel
- Kontrollera att `vercel.json` har rätt headers
- Se till att frontend och API är på samma domän (eller rätt CORS-inställningar)

### "Build failed"
- Kontrollera att `@vercel/node` är installerat: `npm install -D @vercel/node`
- Se till att TypeScript-kompilering fungerar

---

## 🔄 Framtida utveckling med Kimi/Claude Code

Arbetsflödet blir nu:

```
1. Du kodar lokalt med Kimi/Claude Code
2. Testa med `npm run dev` (frontend) och `vercel dev` (med API)
3. Commit → Push → Vercel deployar automatiskt
4. Klart!
```

### Fördelar:
- Preview URLs för varje PR/branch
- Rollback med ett klick om något går fel
- Logs i Vercel Dashboard
- Analytics för att se användning

---

## 📞 Nästa steg

1. ✅ Följ stegen ovan för att deploya
2. ✅ Uppdatera din frontend att anropa nya API:t
3. ✅ Testa alla AI-funktioner
4. ✅ Stäng ner din lokala AI-server (port 3002)
5. ✅ Fira! 🎉

---

## 💡 Tips för vidare utveckling

### Lägg till fler AI-funktioner

Redigera `client/api/ai/[function].ts` och lägg till nya cases i `buildPrompt`:

```typescript
case 'ny-funktion':
  return {
    systemPrompt: 'Du är expert på...',
    userPrompt: `Gör detta: ${data?.input}`,
    maxTokens: 1000
  };
```

### Anpassa rate limiting

I `[function].ts`, ändra:
```typescript
const windowMs = 15 * 60 * 1000; // 15 minuter
const maxRequests = 20;          // Justera detta
```

### Byt AI-modell

I Vercel Dashboard → Environment Variables:
```
AI_MODEL=openai/gpt-4o
```

---

**Behöver du hjälp?** Kolla Vercel's dokumentation: https://vercel.com/docs
