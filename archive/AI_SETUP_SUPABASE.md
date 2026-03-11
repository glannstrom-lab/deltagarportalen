# 🤖 AI-funktioner - Supabase Edge Functions Setup

Denna guide hjälper dig att konfigurera AI-funktionerna i Deltagarportalen via **Supabase Edge Functions**. Detta ger en global lösning som fungerar överallt, inte bara lokalt.

---

## 🌍 Varför Supabase Edge Functions?

| Fördel | Beskrivning |
|--------|-------------|
| 🌐 **Global tillgänglighet** | Fungerar överallt, alltid online |
| 🔒 **Säker** | API-nycklar förvaras säkert i Supabase |
| 📈 **Skalbar** | Automatisk skalning vid hög belastning |
| 🚀 **Ingen serverhantering** | Supabase sköter all drift |
| 💰 **Kostnadseffektiv** | Betala per användning, inga fasta kostnader |

---

## 🚀 Snabbstart

### Steg 1: Skaffa API-nyckel från OpenRouter

1. Gå till [OpenRouter](https://openrouter.ai/keys)
2. Logga in eller skapa ett konto
3. Klicka på "Create API Key"
4. Kopiera nyckeln (börjar med `sk-or-v1-`)

**Varför OpenRouter?**
- En nyckel ger tillgång till **flera AI-modeller** (OpenAI, Anthropic, Google, etc.)
- Enkel att byta modell utan att ändra kod
- Transparent prissättning

---

### Steg 2: Konfigurera Supabase Secrets

#### Metod A: Via Supabase Dashboard (Rekommenderat)

1. Gå till [Supabase Dashboard](https://supabase.com/dashboard)
2. Välj ditt projekt
3. I vänstermenyn, gå till **Project Settings** → **Secrets**
4. Klicka **Add new secret** och lägg till:

**Secret 1: OPENROUTER_API_KEY**
```
Name: OPENROUTER_API_KEY
Value: sk-or-v1-din-riktiga-nyckel-här
```

**Secret 2: AI_MODEL** (valfritt - anger default modell)
```
Name: AI_MODEL
Value: anthropic/claude-3.5-sonnet
```

**Secret 3: SITE_URL** (valfritt - för OpenRouter statistik)
```
Name: SITE_URL
Value: https://ditt-produktions-domain.se
```

#### Metod B: Via Supabase CLI (Om du har CLI installerat)

```bash
# Logga in
supabase login

# Länka till ditt projekt
supabase link --project-ref <ditt-project-ref>

# Sätt secrets
supabase secrets set OPENROUTER_API_KEY=sk-or-v1-din-nyckel
supabase secrets set AI_MODEL=anthropic/claude-3.5-sonnet
supabase secrets set SITE_URL=https://ditt-domain.se
```

---

### Steg 3: Deploya Edge Function

#### Metod A: Via Supabase Dashboard (Rekommenderat)

1. I vänstermenyn, klicka på **Edge Functions**
2. Klicka **New Function**
3. Namn: `ai-assistant`
4. Kopiera hela koden från `supabase/functions/ai-assistant/index.ts`
5. Klicka **Deploy**

#### Metod B: Via Supabase CLI

```bash
# Deploya funktionen
supabase functions deploy ai-assistant
```

---

### Steg 4: Verifiera att det fungerar

Testa med curl:

```bash
curl -X POST https://<ditt-project-ref>.supabase.co/functions/v1/ai-assistant \
  -H "Authorization: Bearer <din-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "function": "jobbtips",
    "data": {
      "intressen": "Teknik, människor",
      "hinder": "Lång tid utanför arbetsmarknaden"
    }
  }'
```

Du ska få ett JSON-svar med AI-genererade tips!

---

## 🔧 Tillgängliga AI-funktioner

Alla funktioner anropas via samma endpoint med olika `function`-parametrar:

```
POST https://<ditt-project-ref>.supabase.co/functions/v1/ai-assistant
```

### 1. CV-optimering
```json
{
  "function": "cv-optimering",
  "data": {
    "cvText": "Mitt CV innehåller...",
    "yrke": "Projektledare"
  }
}
```

### 2. Generera CV-text
```json
{
  "function": "generera-cv-text",
  "data": {
    "yrke": "Säljare",
    "erfarenhet": "5 år inom detaljhandel",
    "styrkor": "Kommunikation, kundservice"
  }
}
```

### 3. Personligt brev
```json
{
  "function": "personligt-brev",
  "data": {
    "jobbAnnons": "Vi söker en...",
    "erfarenhet": "Tidigare säljare",
    "motivering": "Jag brinner för kundservice",
    "ton": "professionell"
  }
}
```

**Tonalternativ:** `professionell`, `entusiastisk`, `formell`

### 4. Intervjuförberedelser
```json
{
  "function": "intervju-forberedelser",
  "data": {
    "jobbTitel": "Projektledare",
    "foretag": "ABC AB",
    "erfarenhet": "3 års erfarenhet",
    "egenskaper": "Strukturerad, kommunikativ"
  }
}
```

### 5. Jobbtips
```json
{
  "function": "jobbtips",
  "data": {
    "intressen": "Teknik, människor",
    "hinder": "Lång tid utanför arbetsmarknaden",
    "mal": "Hitta ett meningsfullt arbete"
  }
}
```

### 6. Övningshjälp
```json
{
  "function": "ovningshjalp",
  "data": {
    "ovningId": "strengths",
    "steg": 1,
    "fraga": "Dina bästa stunder",
    "anvandarSvar": "Jag har hjälpt kollegor..."
  }
}
```

### 7. Löneförhandling
```json
{
  "function": "loneforhandling",
  "data": {
    "roll": "Projektledare",
    "erfarenhetAr": 3,
    "nuvarandeLon": 35000,
    "foretagsStorlek": "Medelstort",
    "ort": "Stockholm"
  }
}
```

### 8. Generell fråga (Custom)
```json
{
  "function": "generell",
  "data": {
    "systemPrompt": "Du är en expert på...",
    "prompt": "Hjälp mig med...",
    "maxTokens": 1000
  }
}
```

---

## 🧠 Tillgängliga Modeller

Du kan ange vilken modell som ska användas på tre sätt:

1. **Global default** - Sätt `AI_MODEL` i Supabase Secrets
2. **Per request** - Skicka `model` i request body
3. **Fallback** - Om inget anges: `anthropic/claude-3.5-sonnet`

### Rekommenderade modeller

| Modell | Provider | Beskrivning | Prisnivå |
|--------|----------|-------------|----------|
| `anthropic/claude-3.5-sonnet` | Anthropic | ⭐ Standard - bra balans | Medel |
| `anthropic/claude-3-opus` | Anthropic | Kraftfullast - för komplexa uppgifter | Hög |
| `openai/gpt-4o` | OpenAI | Senaste multimodella modellen | Medel |
| `openai/gpt-4o-mini` | OpenAI | Billigare alternativ | Låg |
| `google/gemini-2.0-flash-001` | Google | Snabb och prisvärd | Låg |
| `deepseek/deepseek-r1` | DeepSeek | Open source | Låg |

**Exempel - använda specifik modell:**
```json
{
  "function": "cv-optimering",
  "data": { "cvText": "...", "yrke": "..." },
  "model": "google/gemini-2.0-flash-001"
}
```

Se alla modeller: https://openrouter.ai/models

---

## 💰 Kostnader

OpenRouter debiterar per användning:

| Modell | Inmatning | Utmatning |
|--------|-----------|-----------|
| Claude 3.5 Sonnet | ~$3/M tokens | ~$15/M tokens |
| GPT-4o | ~$5/M tokens | ~$15/M tokens |
| Gemini Flash | ~$0.5/M tokens | ~$2/M tokens |

En typisk CV-optimering kostar några ören till någon krona.

**Tips:**
- Sätt upp en spending limit på OpenRouter
- Använd billigare modeller för enkla uppgifter
- Övervaka användning via `ai_usage_logs` tabellen

---

## 📊 Loggning & Analys

All AI-användning loggas automatiskt i tabellen `ai_usage_logs`:

```sql
-- Visa daglig användning
SELECT 
  DATE(created_at) as datum,
  function_name,
  COUNT(*) as antal_anrop,
  SUM(tokens_used) as totalt_tokens
FROM ai_usage_logs
GROUP BY DATE(created_at), function_name
ORDER BY datum DESC;
```

---

## 🛡️ Säkerhetsfunktioner

- ✅ **JWT-verifiering** - Endast inloggade användare kan använda AI
- ✅ **API-nyckel i secrets** - Ald exponerad i frontend
- ✅ **CORS-skydd** - Endast tillåtna origins
- ✅ **Rate limiting** - Via OpenRouter (konfigureras där)
- ✅ **Användningsloggning** - Spåra all användning

---

## 🐛 Felsökning

### "AI service not configured"
- Kontrollera att `OPENROUTER_API_KEY` är satt i Supabase Secrets
- Verifiera att nyckeln är korrekt (börjar med `sk-or-v1-`)

### "Invalid API key"
- Kontrollera att nyckeln är aktiv på OpenRouter
- Testa nyckeln direkt med curl mot OpenRouter

### "Invalid token"
- Användaren måste vara inloggad
- JWT-token måste vara giltig och inte utgången

### "Model not found"
- Kontrollera att modell-namnet är rätt stavat
- Se https://openrouter.ai/models för korrekta namn

### "Rate limit exceeded"
- OpenRouter har rate limits
- Vänta några minuter och försök igen
- Överväg att uppgradera din OpenRouter-plan

---

## 🔧 Underhåll

### Uppdatera Edge Function

1. Gör ändringar i `supabase/functions/ai-assistant/index.ts`
2. Deploya om via Dashboard eller CLI:
```bash
supabase functions deploy ai-assistant
```

### Byta API-nyckel

1. Gå till Supabase Dashboard → Secrets
2. Ta bort den gamla `OPENROUTER_API_KEY`
3. Lägg till den nya
4. Edge Function använder automatiskt den nya nyckeln

### Lägga till nya AI-funktioner

1. Redigera `supabase/functions/ai-assistant/index.ts`
2. Lägg till ny funktion i `prompts`-objektet
3. Deploya om

---

## 📚 Migration från lokal AI-server

Om du tidigare använde den lokala servern (`server/ai/`):

1. Stäng av den lokala servern
2. Uppdatera frontend att anropa Supabase Edge Function istället
3. Se nästa avsnitt för frontend-ändringar

---

**Nästa steg:** Konfigurera frontend att anropa denna Edge Function → se `client/src/services/aiService.ts`

---

*Senast uppdaterad: 2026-03-05*
