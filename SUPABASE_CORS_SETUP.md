# Supabase CORS & Auth Setup för GitHub Pages

## Steg 1: Konfigurera Authentication URL

Gå till: https://app.supabase.com/project/odcvrdkvzyrbdzvdrhkz/auth/url-configuration

### Site URL
Sätt till din GitHub Pages URL:
```
https://glannstrom-lab.github.io/deltagarportalen/
```

### Redirect URLs
Lägg till dessa:
```
https://glannstrom-lab.github.io/deltagarportalen/
https://glannstrom-lab.github.io/deltagarportalen/login
https://glannstrom-lab.github.io/deltagarportalen/auth/callback
```

Klicka **Save**

---

## Steg 2: Konfigurera CORS för Edge Functions

Gå till: https://app.supabase.com/project/odcvrdkvzyrbdzvdrhkz/functions

Varje Edge Function måste tillåta GitHub Pages-domänen. Öppna varje function och lägg till i CORS-headers:

```typescript
// I varje Edge Function (supabase/functions/*/index.ts)
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://glannstrom-lab.github.io',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400'
}
```

---

## Steg 3: Uppdatera Edge Functions

Låt mig fixa alla Edge Functions för att hantera CORS korrekt:

### Exempel på korrekt CORS-hantering:

```typescript
// Lägg till i början av varje Edge Function
const handleCors = (req: Request) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://glannstrom-lab.github.io'
  ]
  
  const origin = req.headers.get('origin') || ''
  const allowedOrigin = allowedOrigins.find(o => origin.startsWith(o)) || allowedOrigins[0]
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

// I request handler:
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: handleCors(req) })
}

return new Response(JSON.stringify(data), {
  headers: { ...handleCors(req), 'Content-Type': 'application/json' }
})
```

---

## Steg 4: Rensa cache och testa

Efter ändringar:

1. **Rensa browser cache**: Ctrl+Shift+R (Windows) eller Cmd+Shift+R (Mac)
2. **Rensa localStorage**: I DevTools Console, kör:
   ```javascript
   localStorage.clear()
   ```
3. **Ladda om sidan**
4. **Logga in** med test-användare

---

## Vanliga fel

### "Invalid JWT" eller "401 Unauthorized"
- Användaren är inte inloggad
- Token har gått ut
- CORS-headers saknas

### "Inte inloggad"
- Session har inte sparats korrekt
- localStorage är rensat
- Cookies är blockerade

### "Failed to fetch"
- CORS är inte korrekt konfigurerat
- Edge Function är inte deployad
- Nätverksfel

---

## Test-användare

Skapa en test-användare i Supabase Studio:

Gå till: https://app.supabase.com/project/odcvrdkvzyrbdzvdrhkz/auth/users

Klicka **"Add user"** och fyll i:
- Email: test@example.com
- Password: Test123456!

---

## Verifiera att allt fungerar

Efter inloggning, öppna DevTools → Application → Local Storage:

Du ska se:
```
supabase.auth.token: {"access_token":"eyJ...","expires_at":...}
```

Om detta saknas fungerar inte autentiseringen.
