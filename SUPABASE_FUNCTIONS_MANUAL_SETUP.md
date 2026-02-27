# Manuell setup av Supabase Edge Functions

Eftersom Supabase CLI inte är installerat, här är en guide för att skapa funktionerna manuellt via Supabase Dashboard.

## Metod 1: Via Supabase Dashboard (Rekommenderat)

### Steg 1: Logga in på Supabase Dashboard
1. Gå till https://supabase.com/dashboard
2. Logga in med ditt konto
3. Välj ditt projekt (deltagarportalen)

### Steg 2: Skapa Edge Functions

#### Funktion 1: af-taxonomy
1. I vänstermenyn, klicka på "Edge Functions"
2. Klicka "New Function"
3. Namn: `af-taxonomy`
4. Kopiera följande kod:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const TAXONOMY_API_BASE = 'https://taxonomy.api.jobtechdev.se/v1/taxonomy';

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace('/af-taxonomy', '');
    const queryString = url.search;
    const targetUrl = `${TAXONOMY_API_BASE}${path}${queryString}`;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Taxonomy API error: ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
```

5. Klicka "Deploy"

#### Funktion 2: af-jobed
1. Klicka "New Function" igen
2. Namn: `af-jobed`
3. Kopiera följande kod:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const JOBED_API_BASE = 'https://jobed-connect-api.jobtechdev.se';

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace('/af-jobed', '');
    const queryString = url.search;
    const targetUrl = `${JOBED_API_BASE}${path}${queryString}`;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`JobEd API error: ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
```

4. Klicka "Deploy"

#### Funktion 3: af-trends
1. Klicka "New Function"
2. Namn: `af-trends`
3. Kopiera följande kod:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const TRENDS_API_BASE = 'https://jobsearch-trends-api.jobtechdev.se';

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace('/af-trends', '');
    const queryString = url.search;
    const targetUrl = `${TRENDS_API_BASE}${path}${queryString}`;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Trends API error: ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
```

4. Klicka "Deploy"

#### Funktion 4: af-enrichments (valfri)
1. Klicka "New Function"
2. Namn: `af-enrichments`
3. Kopiera följande kod:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ENRICHMENTS_API_BASE = 'https://jobad-enrichments-api.jobtechdev.se/v1';

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace('/af-enrichments', '');
    const queryString = url.search;
    const targetUrl = `${ENRICHMENTS_API_BASE}${path}${queryString}`;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Enrichments API error: ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
```

4. Klicka "Deploy"

---

## Metod 2: Installera Supabase CLI med Scoop (Windows)

Om du vill kunna deploya från kommandoraden i framtiden:

```powershell
# Installera Scoop (om du inte har det)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression

# Installera Supabase CLI
scoop install supabase

# Verifiera installation
supabase --version
```

Efter installation, kör deploy-kommandona:
```bash
supabase login
supabase link --project-ref <ditt-project-ref>
supabase functions deploy af-taxonomy
supabase functions deploy af-jobed
supabase functions deploy af-enrichments
supabase functions deploy af-trends
```

---

## Metod 3: Använd fallback-data (tillfällig lösning)

Om du inte vill sätta upp Edge Functions just nu, kan du använda fallback-data som redan finns i koden. Komponenterna visar mock-data när API-anropen misslyckas.

För att aktivera detta permanent, kan du ändra API-filerna att alla använder mock-data:

1. Öppna `client/src/services/afTaxonomyApi.ts`
2. Ändra så att funktionerna returnerar mock-data direkt
3. Upprepa för andra API-filer

---

## Verifiera efter setup

När funktionerna är deployade, testa dem med:

```
https://<ditt-project-ref>.supabase.co/functions/v1/af-taxonomy/concept-types
```

Om du ser JSON-data tillbaka fungerar det!

---

**Rekommendation:** Använd Metod 1 (Dashboard) för snabbast resultat!
