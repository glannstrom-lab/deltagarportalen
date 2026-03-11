# Åtgärda af-jobsearch problem

## Problem
Jobbsökningen misslyckas med följande fel:
```
[Retry] Fetch https://odcvrdkvzyrbdzvdrhkz.supabase.co/functions/v1/af-jobsearch/search?limit=3&offset=0 - Försök 1/4 misslyckades
TypeError: Cannot read properties of undefined (reading 'total')
```

## Orsak
Edge Function `af-jobsearch` är antingen:
1. Inte deployad till Supabase
2. Har kraschat pga gammal Deno-import
3. Returnerar fel som inte hanteras korrekt i frontend

## Lösning

### Steg 1: Deploy Edge Function
Kör följande kommando i terminalen:

```bash
supabase functions deploy af-jobsearch
```

Eller använd batch-filen:
```bash
deploy-edge-functions.bat
```

### Steg 2: Verifiera att funktionen fungerar
Testa med curl:

```bash
curl "https://odcvrdkvzyrbdzvdrhkz.supabase.co/functions/v1/af-jobsearch/search?limit=3&q=utvecklare" \
  -H "Authorization: Bearer <din-anon-key>"
```

### Steg 3: Kontrollera logs
Om det fortfarande inte fungerar, kolla logs:

```bash
supabase functions logs af-jobsearch --tail
```

## Vad har ändrats

### 1. Edge Function (supabase/functions/af-jobsearch/index.ts)
- ✅ Använder nu `Deno.serve()` istället för gammal import (mer kompatibel)
- ✅ Har timeout på 8 sekunder för att undvika hängande requests
- ✅ Returnerar alltom JSON med CORS-headers, även vid fel
- ✅ Returnerar tomma resultat istället för fel vid API-problem
- ✅ Lagt till `config.toml` med `verify_jwt = false`

### 2. Frontend (client/src/services/arbetsformedlingenApi.ts)
- ✅ Hanterar nu null/undefined från Edge Function
- ✅ Returnerar tomma resultat istället för att krascha
- ✅ Minskade antalet retries från 3 till 2 för snabbare felhantering
- ✅ Minskade delay från 1000ms till 500ms

### 3. Retry Service (client/src/services/retryService.ts)
- ✅ Redan konfigurerad för att hantera 503 fel

## Förväntat beteende efter fix

1. Om Edge Function fungerar: Visar jobb från Platsbanken
2. Om Edge Function inte fungerar: Visar tomma resultat utan att krascha
3. Inga CORS-fel i konsolen
4. Inga "undefined" fel

## Fortfarande problem?

Om det fortfarande inte fungerar efter deploy:

1. **Kontrollera att funktionen finns:**
   ```bash
   supabase functions list
   ```

2. **Kontrollera att projektet är länkat:**
   ```bash
   supabase status
   ```

3. **Manuell test i webbläsaren:**
   Öppna: `https://odcvrdkvzyrbdzvdrhkz.supabase.co/functions/v1/af-jobsearch/search?limit=3`
   
   Om du ser JSON-data fungerar det!

4. **Kolla nätverksfliken:**
   - Öppna DevTools (F12)
   - Gå till Network-fliken
   - Filtrera på "af-jobsearch"
   - Kolla vad status-koden är (ska vara 200)

## Kontakt
Om inget fungerar, kontakta utvecklingsteamet med:
- Output från `supabase functions logs af-jobsearch --tail`
- Screenshot av nätverksfliken i DevTools
- Vilken browser du använder
