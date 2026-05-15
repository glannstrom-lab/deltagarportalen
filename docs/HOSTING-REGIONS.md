# Hosting Regions — GDPR-policy

**Senast uppdaterad:** 2026-05-15
**Policy:** Allt persondata-flöde inom EU.

## Översikt

| Tjänst | Region | Status | Konfiguration |
|---|---|---|---|
| **Supabase** (DB + Auth + Storage) | West EU (Ireland) | ✅ EU | Sätts vid projektskapande, kan inte ändras |
| **Vercel Serverless Functions** (`/api/ai`, `/api/cv-pdf`, `/api/upload-image`, `/api/job-alerts`, `/api/ai-stream`) | `fra1` (Frankfurt) | ✅ EU | `client/vercel.json` → `regions: ["fra1"]` |
| **Vercel Blob Storage** (profilbilder) | EU (måste verifieras manuellt) | ⚠️ MANUELL | Sätts i Vercel-dashboarden vid storage-creation |
| **OpenRouter** (AI-modell `gpt-oss-120b`) | USA | ❌ NON-EU | OpenRouter-modeller har inte EU-routing för gpt-oss-serien |
| **Sentry** (error tracking) | Multi-region (USA default) | ⚠️ EU SAAS finns | Lazy-load bakom cookie-consent (E9). Migrera till sentry.io/eu om strikt krav |
| **Arbetsförmedlingen / Bolagsverket APIs** | SE | ✅ EU | Inga persondata utgående (bara sökord) |

## Vercel Functions — region-konfiguration

Funktioner körs i Frankfurt (`fra1`) per `client/vercel.json`:

```json
{
  "regions": ["fra1"],
  "functions": {
    "api/ai.js":           { "regions": ["fra1"] },
    "api/ai-stream.js":    { "regions": ["fra1"] },
    "api/cv-pdf.js":       { "regions": ["fra1"] },
    "api/upload-image.js": { "regions": ["fra1"] },
    "api/job-alerts.js":   { "regions": ["fra1"] }
  }
}
```

**Verifiering efter deploy:** I Vercel-dashboard → Project → Functions, varje funktion ska visa "fra1" som primary region.

## Vercel Blob — manuell konfiguration

Vercel Blob-storage region kan **inte** sättas via SDK eller `vercel.json` — den fastställs när storen skapas i dashboarden.

**Kontrollera nuvarande region:**
1. Vercel-dashboard → Project → Storage → Blob → välj store
2. Settings → Region

**Om regionen är USA (default):**
1. Skapa ny store: Storage → Create → Blob → Region: **Europe (Frankfurt)** eller **Europe (Ireland)**
2. Kopiera BLOB_READ_WRITE_TOKEN från nya storen
3. Lägg in i Vercel project env-variables (Production + Preview)
4. Migrera befintliga filer från gamla storen (skript: lista, ladda ned, ladda upp)
5. Radera gamla storen

**Tills migration är gjord:** anteckna avvikelsen — profilbilder kan ligga i USA.

## OpenRouter — undantag med kommentar

OpenRouter routar AI-modellen `openai/gpt-oss-120b` via USA-baserade endpoints. Att flytta till en EU-routing kräver:
- Byta modell till en med EU-stöd (eg. några Mistral/Anthropic-modeller har EU-routing)
- Eller självhostat alternativ via Replicate EU eller Anthropic Bedrock EU

**Beslut 2026-05-15:** Behåller `gpt-oss-120b` av kostnadsskäl. Avvikelsen dokumenteras i samtyckesgaten (`<AiConsentGate>`-texten) så att deltagare ser att AI-leverantör finns i USA innan de ger consent.

## Sentry — EU-migrering om krav

Sentry erbjuder `*.sentry.io/eu` (Frankfurt). Migrering:
1. Skapa ny Sentry-organisation på `sentry.io/eu`
2. Byta `VITE_SENTRY_DSN` till EU-dsn
3. Verifiera att `client/src/lib/sentry.ts` använder default-endpoint (autodetekteras från DSN)

**Status:** Inte gjort. Sentry är lazy-loadad och bakom consent (E9), så ingen data skickas tills användaren godkänner cookies. Acceptabel risk.

## Säker policy att kommunicera

> "Allt persistent persondata-lagring och all server-side processning av persondata sker i EU (Supabase Irland, Vercel Frankfurt). Det enda undantaget är AI-leverantören OpenRouter (USA), som vi använder för gpt-oss-120b — användaren ger uttryckligt samtycke innan något skickas till AI:n och varnas för att AI-leverantör finns i USA."

## Roadmap

- [ ] Verifiera Vercel Blob-store region (manuell check i dashboard)
- [ ] Migrera Sentry till EU-org
- [ ] Utvärdera OpenRouter-alternativ med EU-routing (Mistral large på EU eller Anthropic Bedrock EU)
- [ ] Lägga till region-info i `<AiConsentGate>`-texten så användaren ser uttryckligen "AI-leverantör (USA)"
