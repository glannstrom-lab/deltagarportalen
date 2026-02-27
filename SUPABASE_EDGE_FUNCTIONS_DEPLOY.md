# Deploy Supabase Edge Functions

## Översikt
Dessa Edge Functions fungerar som proxy för Arbetsförmedlingens API:er, vilket undviker CORS-problem helt och hållet.

## Förutsättningar
- Supabase CLI installerad: `npm install -g supabase`
- Inloggad i Supabase: `supabase login`
- Projekt länkat: `supabase link --project-ref <ditt-project-ref>`

## Deploy

Kör följande kommandon i terminalen:

```bash
# Gå till projektmappen
cd C:\Users\Mikael\Desktop\SKARP AI\deltagarportal

# Deploy alla Edge Functions
supabase functions deploy af-taxonomy
supabase functions deploy af-jobed
supabase functions deploy af-enrichments
supabase functions deploy af-trends
```

## Verifiera att funktionerna fungerar

Testa med curl eller besök URL:erna i webbläsaren:

```bash
# Testa Taxonomy API
curl https://<ditt-project-ref>.supabase.co/functions/v1/af-taxonomy/concept-types

# Testa JobEd API
curl "https://<ditt-project-ref>.supabase.co/functions/v1/af-jobed/occupation-to-educations?occupation_id=<id>"

# Testa Trends API
curl https://<ditt-project-ref>.supabase.co/functions/v1/af-trends/market-stats
```

## Konfigurera CORS (om nödvändigt)

Om du vill begränsa vilka domäner som får anropa funktionerna, uppdatera `corsHeaders` i varje funktion:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://deltagarportalen.glannstrom.se',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};
```

## Felsökning

### Problem: "Function not found"
- Kontrollera att funktionen är deployad: `supabase functions list`
- Kontrollera att projektet är länkat: `supabase status`

### Problem: "CORS error" fortfarande
- Kontrollera att frontend använder Supabase Edge Functions URL:er
- Verifiera att `corsHeaders` är korrekt konfigurerade
- Testa funktionen direkt med curl först

### Problem: "Rate limit exceeded"
- Arbetsförmedlingens API:er kan ha rate limits
- Överväg att lägga till caching i Edge Functions
- Kontakta AF om du behöver högre limits

## Uppdatera frontend

Frontend är redan uppdaterad för att använda Supabase Edge Functions via `supabase.functions.invoke()`.

Ingen ytterligare konfiguration behövs!

## Underhåll

För att uppdatera en funktion:

```bash
# Ändra koden i filen
# T.ex. supabase/functions/af-taxonomy/index.ts

# Deploy igen
supabase functions deploy af-taxonomy
```

## Logs

För att se loggar från funktionerna:

```bash
# Real-time logs
supabase functions logs af-taxonomy --tail

# Logs för alla funktioner
supabase functions logs --tail
```

## Miljövariabler (om nödvändigt)

Om du behöver API-nycklar eller andra hemligheter:

```bash
# Sätt miljövariabel
supabase secrets set MY_API_KEY=xxx

# Använd i funktionen
const apiKey = Deno.env.get('MY_API_KEY');
```

## Kostnad

Supabase Edge Functions ingår i gratisnivån:
- 500 000 invocationer per månad
- 1 GB dataöverföring per månad

För Deltagarportalen bör detta vara mer än tillräckligt!

---

**Klart!** Efter deploy kan du använda Karriärsidan och alla andra funktioner utan CORS-problem.
