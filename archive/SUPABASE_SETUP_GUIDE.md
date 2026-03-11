# Supabase Setup Guide för Deltagarportalen

Denna guide hjälper dig att sätta upp Supabase för Deltagarportalen.

## 📋 Förberedelser

1. Skapa ett konto på [supabase.com](https://supabase.com)
2. Installera Supabase CLI:
   ```bash
   npm install -g supabase
   ```

## 🚀 Steg 1: Skapa Supabase-projekt

### Via webben (rekommenderat):
1. Gå till [app.supabase.com](https://app.supabase.com)
2. Klicka "New Project"
3. Välj organisation och namnge projektet (t.ex. "deltagarportalen")
4. Välj lösenord för databasen (spara detta!)
5. Vänta på att projektet skapas

### Hämta API-nycklar:
1. I projektet, gå till Project Settings → API
2. Kopiera:
   - `URL` (t.ex. https://xyz123.supabase.co)
   - `anon public` (client key)
   - `service_role secret` (server key - hemlig!)

## 🗄️ Steg 2: Databas-setup

### Alternativ A: Via SQL Editor (enklaste)

1. I Supabase-dashboard, gå till "SQL Editor"
2. Klicka "New query"
3. Kopiera innehållet från `supabase/migrations/001_initial_schema.sql`
4. Klicka "Run"

### Alternativ B: Via Supabase CLI

```bash
# Logga in
supabase login

# Länka projektet
supabase link --project-ref your-project-ref

# Kör migration
supabase db push
```

## ⚡ Steg 3: Edge Functions

### Deploya funktioner:

```bash
# Navigera till projektets root
cd deltagarportal

# Sätt miljövariabler först
supabase secrets set OPENAI_API_KEY=sk-your-key

# Deploya funktioner
supabase functions deploy ai-cover-letter
supabase functions deploy cv-analysis
```

### Testa funktioner lokalt:

```bash
# Starta Supabase lokalt
supabase start

# I en annan terminal, serve funktioner
supabase functions serve ai-cover-letter

# Testa med curl
curl -X POST http://localhost:54321/functions/v1/ai-cover-letter \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{
    "cvData": {"firstName": "Anna", "lastName": "Andersson"},
    "jobDescription": "Vi söker en utvecklare...",
    "companyName": "Tech AB",
    "jobTitle": "Systemutvecklare"
  }'
```

## 🪣 Steg 4: Storage Buckets

1. Gå till "Storage" i dashboard
2. Skapa bucket: `profile_images`
   - Public: Ja
   - Allowed mime types: image/png, image/jpeg
3. Skapa bucket: `cv_files`
   - Public: Nej
   - Allowed mime types: application/pdf

## 🔧 Steg 5: Frontend-konfiguration

1. Kopiera `client/.env.example` till `client/.env`
2. Fyll i dina värden:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Installera Supabase client:
   ```bash
   cd client
   npm install @supabase/supabase-js
   ```

## 🧪 Steg 6: Testa integrationen

Skapa en test-fil `test-supabase.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Supabase Test</title>
  <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
</head>
<body>
  <h1>Supabase Test</h1>
  <div id="status">Testing...</div>
  
  <script>
    const client = supabase.createClient(
      'https://your-project.supabase.co',
      'your-anon-key'
    )
    
    async function test() {
      // Testa auth
      const { data: { user } } = await client.auth.getUser()
      document.getElementById('status').innerHTML = 
        user ? `Authenticated: ${user.email}` : 'Not authenticated'
      
      // Testa databas
      const { data: articles } = await client
        .from('articles')
        .select('*')
        .limit(1)
      
      console.log('Articles:', articles)
    }
    
    test()
  </script>
</body>
</html>
```

## 🔐 Säkerhetschecklista

- [ ] Service role key är INTE i frontend-koden
- [ ] RLS policies är aktiverade på alla tabeller
- [ ] Storage buckets har korrekta rättigheter
- [ ] Edge Functions verifierar JWT
- [ ] Lösenordspolicy är satt (Auth → Policies)

## 🐛 Vanliga problem

### "Failed to fetch"
Kontrollera att CORS är korrekt konfigurerat i Supabase.

### "JWT expired"
Användaren måste logga in igen. Token är giltig i 1 timme.

### "new row violates row-level security policy"
Kontrollera att RLS policies är korrekt satta för tabellen.

### "Invalid API key"
Kontrollera att du använder anon key i frontend, inte service role key.

## 📚 Nästa steg

1. Implementera auth-flöde i React
2. Byta ut gamla API-anrop mot Supabase
3. Aktivera realtime för live-uppdateringar
4. Sätta upp backup-policy

---

Behöver du hjälp? Se [Supabase docs](https://supabase.com/docs)
