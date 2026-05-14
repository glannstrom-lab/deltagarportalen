# AI-modell-låsning — policy och status

**Senast uppdaterad:** 2026-05-15
**Princip:** All AI-generering ska gå till **`openai/gpt-oss-120b`** av kostnadsskäl. Modellbyten kräver explicit beslut.

---

## Status efter Fas A (2026-05-15)

| Endpoint | Modell-default | Status |
|----------|---------------|--------|
| `client/api/ai.js` (Vercel, 18 funktioner) | `process.env.AI_MODEL || 'openai/gpt-oss-120b'` | ✅ Låst |
| `client/api/ai-stream.js` (Vercel, 13 funktioner) | `process.env.AI_MODEL || 'openai/gpt-oss-120b'` | ✅ Låst |
| `supabase/functions/ai-cover-letter` | `Deno.env.get('AI_MODEL') || 'openai/gpt-oss-120b'` | ✅ Låst 2026-05-15 |
| `supabase/functions/ai-cv-writing` | `Deno.env.get('AI_MODEL') || 'openai/gpt-oss-120b'` | ✅ Låst 2026-05-15 |
| `supabase/functions/ai-assistant` | `Deno.env.get('AI_MODEL') || 'openai/gpt-oss-120b'` | ✅ Låst 2026-05-15 |
| `supabase/functions/learning-analyze-gap` | `Deno.env.get('AI_MODEL') || 'openai/gpt-oss-120b'` | ✅ Låst 2026-05-15 |

## Medvetna undantag

Följande edge-funktioner använder **andra modeller** medvetet — de kräver capabilities som gpt-oss-120b inte har. Försök att flytta dem är spårbara i denna fil.

| Edge-fn | Modell | Varför | Migrationsplan |
|---------|--------|--------|----------------|
| `ai-career-assistant` | `perplexity/sonar` (hårdkodad) | Behöver web-search för aktuell företags-/löndata. Returnerar JSON. | Inget akut — Perplexity är billigare än Claude men dyrare än gpt-oss. Kan flyttas till Tavily-search + gpt-oss om kostnaden blir ett problem. |
| `ai-commute-planner` | `perplexity/sonar` (hårdkodad) | Pendlings-/SL-data hämtas via web-search. | Samma. |
| `ai-company-analysis` | `perplexity/sonar` (hårdkodad) | Företagsanalys mot aktuell web-data. | Samma. |
| `ai-company-search` | `perplexity/sonar` (hårdkodad) | Företagssökning + Bolagsverket-verifiering. | Samma. |
| `ai-industry-radar` | `perplexity/sonar` (hårdkodad) | Branschtrender från web. | Samma. |
| `cv-analysis` | `gpt-4` (OpenAI direkt, hårdkodad) | Använder `OPENAI_API_KEY`, inte OpenRouter. Separat faktura. | **Bör flyttas till OpenRouter + gpt-oss-120b**. Föreslås i Fas C av roadmapen. |

---

## Operations — rollback och deploy

### Deploy av denna ändring (2026-05-15)

1. `git push` triggar Vercel-deploy automatiskt. Vercel-vägen redan på gpt-oss.
2. Edge-funktioner deployar inte automatiskt — kräver manuell `supabase functions deploy`:
   ```bash
   npx supabase functions deploy ai-cover-letter
   npx supabase functions deploy ai-cv-writing
   npx supabase functions deploy ai-assistant
   npx supabase functions deploy learning-analyze-gap
   ```

### Verifiera modellen som körs

Efter deploy: generera ett cover-letter och kolla i `ai_usage_logs`:
```sql
SELECT model_used, COUNT(*) FROM ai_usage_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY model_used;
```
Förväntning: alla rader ska visa `openai/gpt-oss-120b` (utöver Perplexity-undantagen ovan).

### Rollback om kvaliteten är oacceptabel

I Supabase dashboard → Edge Functions → Settings → Environment Variables:
```
AI_MODEL=anthropic/claude-3.5-sonnet
```
Sätt på den specifika edge-fn (eller globalt). Förändringen träder i kraft inom ~30 sekunder utan re-deploy.

Tid för rollback: ~2 minuter.

---

## Kvalitetsbedömning som bör göras

Inom första veckan efter deploy bör en av dessa metoder användas för att utvärdera kvalitetsskillnaden Sonnet → gpt-oss-120b:

1. **A/B-jämförelse manuellt:** Generera 5 cover-letters per modell på samma CV. Bedöm:
   - Naturligt språk (1-5)
   - Strukturell tydlighet (1-5)
   - Anpassning till jobbet (1-5)
   - Personalisering till sökandens CV (1-5)
2. **Tittade-på-i-prod:** Granska första 20 cover-letters efter deploy. Är de godkända för deltagare?
3. **Token-användning:** Mäta tokens per request — gpt-oss-120b tenderar generera kortare svar än Sonnet.

Om kvaliteten är väsentligt sämre på vissa flöden — rollback per-funktion möjligt genom att ändra defaulten lokalt i den filen (inte globalt env).

---

## Historik

| Datum | Ändring | Co-author |
|-------|---------|-----------|
| 2026-05-09 | Vercel-vägen (`ai.js`, `ai-stream.js`) låst på `gpt-oss-120b` via `AI_MODEL`-env. | Initialt commit |
| 2026-05-15 | Tech-debt-audit upptäckte att edge-vägen fortfarande defaultar på Sonnet trots Mikaels policy. Defaults synkade till gpt-oss-120b. | Fas A av tech-debt-roadmap |
