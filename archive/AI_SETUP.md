# 🤖 AI-funktioner - Setup Guide

Denna guide hjälper dig att konfigurera AI-funktionerna i Deltagarportalen via OpenRouter.

---

## 🔐 Säkerhet - VIKTIGT!

**Din OpenRouter API-nyckel ska ALDRIG:**
- ❌ Checkas in i Git
- ❌ Delas med andra
- ❌ Skickas till klienten (frontend)
- ❌ Läggas i kodfiler

**Din API-nyckel ska ALLTID:**
- ✅ Läggas i `.env`-filer (som är i `.gitignore`)
- ✅ Förvaras på server-sidan
- ✅ Roteras regelbundet
- ✅ Ha rate limiting aktiverat

---

## 🚀 Snabbstart

### Steg 1: Skaffa API-nyckel

1. Gå till [OpenRouter](https://openrouter.ai/keys)
2. Logga in eller skapa ett konto
3. Klicka på "Create API Key"
4. Kopiera nyckeln (börjar med `sk-or-v1-`)

### Steg 2: Välj AI-modell

Redigera `server/ai/.env` och välj vilken modell du vill använda:

```env
# Rekommenderade modeller:
AI_MODEL=anthropic/claude-3.5-sonnet    # Standard - bra balans
AI_MODEL=openai/gpt-4o                   # OpenAI:s senaste
AI_MODEL=openai/gpt-oss-120b             # OpenAI OSS (120B)
AI_MODEL=google/gemini-2.0-flash-001     # Snabb & prisvärd

# Full lista: https://openrouter.ai/models
```

### Steg 3: Konfigurera API-nyckel

1. Öppna filen `server/ai/.env`
2. Ersätt `sk-or-v1-...` med din riktiga nyckel:
   ```env
   OPENROUTER_API_KEY=sk-or-v1-din-riktiga-nyckel-här
   ```

### Steg 4: Starta AI-servern

```bash
start-ai-server.bat
```

Eller manuellt:
```bash
cd server/ai
npm install
npm run dev
```

### Steg 5: Testa

Öppna i webbläsaren:
```
http://localhost:3002/api/health
```

Du ska se:
```json
{
  "status": "OK",
  "timestamp": "...",
  "version": "1.0.0",
  "model": "anthropic/claude-3.5-sonnet"
}
```

---

## 🤖 Tillgängliga Modeller

| Modell | Provider | Beskrivning | Prisnivå |
|--------|----------|-------------|----------|
| `anthropic/claude-3.5-sonnet` | Anthropic | ⭐ Rekommenderad - bra balans | Medel |
| `anthropic/claude-3-opus` | Anthropic | Kraftfullast - för komplexa uppgifter | Hög |
| `openai/gpt-4o` | OpenAI | Senaste multimodella modellen | Medel |
| `openai/gpt-4o-mini` | OpenAI | Billigare alternativ | Låg |
| `openai/gpt-oss-120b` | OpenAI | Open Source-modell | Låg |
| `google/gemini-2.0-flash-001` | Google | Snabb och prisvärd | Låg |
| `deepseek/deepseek-r1` | DeepSeek | Open source | Låg |
| `meta-llama/llama-3.3-70b-instruct` | Meta | Meta:s öppna modell | Låg |

Se alla modeller: https://openrouter.ai/models

### Byta modell

1. Stoppa AI-servern (Ctrl+C)
2. Redigera `server/ai/.env`:
   ```env
   AI_MODEL=openai/gpt-oss-120b
   ```
3. Starta om servern: `start-ai-server.bat`

---

## 🔧 Tillgängliga AI-funktioner

### 1. CV-optimering
**Endpoint:** `POST /api/ai/cv-optimering`

Ger AI-driven feedback på CV-text.

```bash
curl -X POST http://localhost:3002/api/ai/cv-optimering \
  -H "Content-Type: application/json" \
  -d '{
    "cvText": "Mitt CV innehåller...",
    "yrke": "Projektledare"
  }'
```

### 2. Generera CV-text
**Endpoint:** `POST /api/ai/generera-cv-text`

Genererar professionell CV-sammanfattning.

```bash
curl -X POST http://localhost:3002/api/ai/generera-cv-text \
  -H "Content-Type: application/json" \
  -d '{
    "yrke": "Säljare",
    "erfarenhet": "5 år inom detaljhandel",
    "styrkor": "Kommunikation, kundservice"
  }'
```

### 3. Personligt brev
**Endpoint:** `POST /api/ai/personligt-brev`

Skriver personligt brev från jobbannons.

```bash
curl -X POST http://localhost:3002/api/ai/personligt-brev \
  -H "Content-Type: application/json" \
  -d '{
    "jobbAnnons": "Vi söker en...",
    "erfarenhet": "Tidigare säljare",
    "ton": "professionell"
  }'
```

### 4. Intervjuförberedelser
**Endpoint:** `POST /api/ai/intervju-forberedelser`

Förbereder dig inför intervjun.

```bash
curl -X POST http://localhost:3002/api/ai/intervju-forberedelser \
  -H "Content-Type: application/json" \
  -d '{
    "jobbTitel": "Projektledare",
    "foretag": "ABC AB"
  }'
```

### 5. Jobbtips
**Endpoint:** `POST /api/ai/jobbtips`

Ger personliga jobbsökartips.

```bash
curl -X POST http://localhost:3002/api/ai/jobbtips \
  -H "Content-Type: application/json" \
  -d '{
    "intressen": "Teknik, människor",
    "hinder": "Lång tid utanför arbetsmarknaden"
  }'
```

### 6. Övningshjälp
**Endpoint:** `POST /api/ai/ovningshjalp`

AI-coach för övningar.

```bash
curl -X POST http://localhost:3002/api/ai/ovningshjalp \
  -H "Content-Type: application/json" \
  -d '{
    "ovningId": "strengths",
    "steg": 1,
    "fraga": "Dina bästa stunder"
  }'
```

### 7. Löneförhandling
**Endpoint:** `POST /api/ai/loneforhandling`

Rådgivning inför lönesamtal.

```bash
curl -X POST http://localhost:3002/api/ai/loneforhandling \
  -H "Content-Type: application/json" \
  -d '{
    "roll": "Projektledare",
    "erfarenhetAr": 3
  }'
```

---

## 🛡️ Säkerhetsfunktioner

### Rate Limiting
- Max 20 förfrågningar per 15 minuter per IP
- Skyddar mot överanvändning och oväntade kostnader

### CORS-skydd
- Endast tillåtna origins kan anropa API:et
- Konfigureras via `ALLOWED_ORIGINS` i `.env`

### API-nyckel på server-sidan
- Nyckeln finns aldrig i frontend-koden
- Alla AI-anrop går via din backend

---

## 💰 Kostnader

OpenRouter debiterar per användning. Priserna varierar mellan modeller:

| Modell | Inmatning | Utmatning |
|--------|-----------|-----------|
| Claude 3.5 Sonnet | ~$3/M tokens | ~$15/M tokens |
| GPT-4o | ~$5/M tokens | ~$15/M tokens |
| GPT-OSS 120B | ~$1-2/M tokens | ~$5/M tokens |
| Gemini Flash | ~$0.5/M tokens | ~$2/M tokens |

En typisk CV-optimering kostar några ören till någon krona beroende på modell.

**Tips:** Sätt upp en spending limit på OpenRouter!

---

## 🐛 Felsökning

### "Invalid API Key"
```bash
# Kontrollera att nyckeln är korrekt
cd server/ai
cat .env
```

### "Model not found"
```bash
# Kontrollera att modell-namnet är rätt stavat
# Se https://openrouter.ai/models för korrekta namn
```

### "EAI_AGAIN" eller nätverksfel
```bash
# Kontrollera internetanslutning
ping openrouter.ai
```

### Port 3002 är upptagen
```bash
# Ändra port i server/ai/.env
PORT=3003
```

### Lista tillgängliga modeller
```bash
curl http://localhost:3002/api/models
```

### Visa nuvarande konfiguration
```bash
curl http://localhost:3002/api/config
```

---

## 📝 Git-ignore

Filen `.gitignore` ska redan innehålla:
```
.env
*.env
server/ai/.env
```

Verifiera att din `.env`-fil INTE checkas in:
```bash
git status
```

---

*Senast uppdaterad: 2026-02-22*
