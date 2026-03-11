# Deploy af-jobsearch Edge Function

## Problemet
Edge Function `af-jobsearch` är inte deployad till Supabase, vilket gör att jobbsökningen misslyckas.

## Lösning - Steg för steg

### Steg 1: Kontrollera att Supabase CLI är installerad

```bash
supabase --version
```

Om inte, installera:
```bash
npm install -g supabase
```

### Steg 2: Logga in på Supabase

```bash
supabase login
```

### Steg 3: Länka projektet (om inte redan gjort)

```bash
supabase link --project-ref odcvrdkvzyrbdzvdrhkz
```

### Steg 4: Deploy funktionen

```bash
supabase functions deploy af-jobsearch
```

### Steg 5: Verifiera att den fungerar

```bash
# Testa funktionen
curl "https://odcvrdkvzyrbdzvdrhkz.supabase.co/functions/v1/af-jobsearch/search?limit=3"
```

Eller kolla logs:
```bash
supabase functions logs af-jobsearch --tail
```

## Alternativ: Använd direkt API istället

Om Edge Functions inte fungerar, kan vi ändra frontend att anropa Arbetsförmedlingens API direkt med CORS-proxy:

```typescript
// I arbetsformedlingenApi.ts
const AF_BASE_URL = 'https://jobsearch.api.jobtechdev.se';

// Använd en CORS-proxy om nödvändigt
const PROXY_URL = 'https://cors-anywhere.herokuapp.com/';

const response = await fetch(`${PROXY_URL}${AF_BASE_URL}/search?limit=3`);
```

## Snabbkoll - Är funktionen deployad?

```bash
supabase functions list
```

Du bör se `af-jobsearch` i listan.

## Fortfarande problem?

Om det fortfarande inte fungerar efter deploy:

1. **Kolla att projekt-ref är rätt:**
   ```bash
   supabase status
   ```

2. **Kolla funktions-logs:**
   ```bash
   supabase functions logs af-jobsearch
   ```

3. **Testa funktionen manuellt i webbläsaren:**
   Öppna: https://odcvrdkvzyrbdzvdrhkz.supabase.co/functions/v1/af-jobsearch/search?limit=3

   Om du ser JSON-data → fungerar det!
   Om du ser "Function not found" → måste deployas

## Kontakta support

Om inget fungerar, kontakta Supabase support med:
- Projekt-ref: `odcvrdkvzyrbdzvdrhkz`
- Funktionsnamn: `af-jobsearch`
- Felmeddelande från logs
