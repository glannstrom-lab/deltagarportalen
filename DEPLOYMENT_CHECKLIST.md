# 🚀 Deployment Checklist - Deltagarportalen till Supabase

> **Användning:** Följ denna checklista efter att ha kört `deploy-to-supabase.ps1`

---

## ✅ Steg 1: Förberedelser (Lokalt)

### 1.1 Installera Supabase CLI (om inte redan gjort)
```bash
npm install -g supabase
```

### 1.2 Logga in på Supabase
```bash
supabase login
```
- Öppna webbläsaren och logga in
- Kopiera access token
- Klistra in i terminalen

### 1.3 Linka projektet
```bash
supabase link --project-ref <ditt-project-ref>
```

**Hitta ditt project-ref:**
- Gå till [Supabase Dashboard](https://app.supabase.com)
- Välj ditt projekt
- Project ref finns i URL:en eller Settings > API

---

## ✅ Steg 2: Kör Deploy Script

### 2.1 Öppna PowerShell i projektroten
```powershell
.\deploy-to-supabase.ps1
```

### 2.2 Om du vill hoppa över vissa steg
```powershell
# Hoppa över Edge Functions
.\deploy-to-supabase.ps1 -SkipFunctions

# Hoppa över migrations  
.\deploy-to-supabase.ps1 -SkipMigrations
```

---

## ✅ Steg 3: Manuella steg i Supabase Dashboard

### 3.1 Verifiera Edge Functions

**Gå till:** Supabase Dashboard > Edge Functions

**Kontrollera att dessa finns:**
- [ ] `ai-cover-letter`
- [ ] `cv-analysis`
- [ ] `af-jobsearch`
- [ ] `af-taxonomy`
- [ ] `af-enrichments`
- [ ] `af-jobed`
- [ ] `af-trends`
- [ ] `send-invite-email` (ny!)

**Om någon saknas, deploya manuellt:**
```bash
supabase functions deploy <function-name>
```

---

### 3.2 Konfigurera Miljövariabler

**Gå till:** Supabase Dashboard > Project Settings > Edge Functions

**Lägg till dessa variabler:**

| Variabel | Beskrivning | Exempel |
|----------|-------------|---------|
| `SUPABASE_URL` | Din Supabase URL | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | `eyJ...` |
| `OPENAI_API_KEY` | För AI-funktioner | `sk-...` |
| `SITE_URL` | Din produktions-URL | `https://deltagarportalen.se` |

**Hitta värdena:**
1. `SUPABASE_URL` och `SUPABASE_SERVICE_ROLE_KEY`:
   - Dashboard > Settings > API > Project API keys
   - Använd `service_role` key (inte anon!)

2. `OPENAI_API_KEY`:
   - Skaffa från [OpenAI Dashboard](https://platform.openai.com)

3. `SITE_URL`:
   - Din faktiska domän
   - För utveckling: `http://localhost:5173`

---

### 3.3 Verifiera Database Migrations

**Gå till:** Supabase Dashboard > Database > Migrations

**Kontrollera att alla migrationer har körts:**
- [ ] `001_initial_schema.sql`
- [ ] `002_user_activities.sql`
- [ ] `003_cv_versions_rls.sql`
- [ ] `004_add_cv_columns.sql`
- [ ] `005_add_all_missing_cv_columns.sql`
- [ ] `006_add_cv_shares.sql`
- [ ] `007_consultant_dashboard.sql`
- [ ] `008_fix_user_creation_trigger.sql`
- [ ] `009_gamification_and_features.sql`
- [ ] `010_invitations_table.sql` (ny!)

**Om migrationer saknas, kör manuellt:**
```bash
supabase db push
```

**Eller kör specifik migration:**
```bash
supabase migration up
```

---

### 3.4 Verifiera RLS Policies

**Gå till:** Supabase Dashboard > Database > Tables > [Varje tabell] > Policies

**Kontrollera att dessa tabeller har RLS aktiverat:**
- [ ] `profiles`
- [ ] `cvs`
- [ ] `cv_versions`
- [ ] `cover_letters`
- [ ] `interest_results`
- [ ] `saved_jobs`
- [ ] `consultant_notes`
- [ ] `invitations` (ny!)

**Om RLS saknas på någon tabell:**
1. Gå till Table Editor
2. Välj tabell
3. Klicka på "Enable RLS"

---

### 3.5 Konfigurera Auth

**Gå till:** Supabase Dashboard > Authentication > Settings

**Site URL:**
- Sätt till din produktions-URL: `https://deltagarportalen.se`
- För utveckling: `http://localhost:5173`

**Redirect URLs:**
- Lägg till: `https://deltagarportalen.se/**`
- Lägg till: `http://localhost:5173/**` (för utveckling)

**Email Templates (valfritt):**
- [ ] Konfigurera bekräftelsemail för registrering
- [ ] Konfigurera lösenordsåterställning

---

### 3.6 Konfigurera Storage (om används)

**Gå till:** Supabase Dashboard > Storage

**Buckets som ska finnas:**
- [ ] `cv_files` - För uppladdade CV:n
- [ ] `profile_images` - För profilbilder

**Skapa bucket om saknas:**
```sql
-- Eller via Dashboard UI
insert into storage.buckets (id, name, public) 
values ('cv_files', 'cv_files', false);
```

---

## ✅ Steg 4: Frontend-konfiguration

### 4.1 Uppdatera miljövariabler

**Fil:** `client/.env.production`

```env
VITE_SUPABASE_URL=https://ditt-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 4.2 Bygg och deploya frontend

```bash
cd client
npm run build
```

**Deploya till hosting:**
- GitHub Pages: Pusha till `gh-pages` branch
- Netlify: Drag and drop `dist` mappen
- Vercel: `vercel --prod`

---

## ✅ Steg 5: Testning efter Deploy

### 5.1 Testa autentisering
- [ ] Registrera nytt konto
- [ ] Logga in
- [ ] Logga ut
- [ ] Återställ lösenord (om konfigurerat)

### 5.2 Testa core features
- [ ] Skapa CV
- [ ] Spara personligt brev
- [ ] Genomför intresseguide
- [ ] Sök jobb

### 5.3 Testa konsulent-flödet
- [ ] Logga in som konsulent
- [ ] Bjud in deltagare
- [ ] Verifiera att email skickas
- [ ] Deltagare kan acceptera inbjudan

### 5.4 Testa Edge Functions
```bash
# Testa AI-cover-letter
curl -X POST https://ditt-project-ref.supabase.co/functions/v1/ai-cover-letter \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"cvData": {...}, "jobDescription": "..."}'
```

---

## ✅ Steg 6: Övervakning

### 6.1 Aktivera Logging
**Gå till:** Dashboard > Logs

**Kontrollera att logs kommer in för:**
- [ ] Auth events
- [ ] Database queries
- [ ] Edge Function invocations

### 6.2 Sätt upp Alerty (valfritt)
**Gå till:** Dashboard > Database > Webhooks

**Lägg till webhooks för:**
- Nya användarregistreringar
- Kritiska fel

---

## 🚨 Felsökning

### Problem: Edge Function deploy failar
**Lösning:**
```bash
# Kolla logs
supabase functions serve --env-file .env

# Deploya med force
supabase functions deploy <name> --force
```

### Problem: Database migration failar
**Lösning:**
```bash
# Återställ och kör igen
supabase db reset
supabase db push
```

### Problem: RLS blockerar queries
**Lösning:**
1. Gå till Dashboard > Database > Policies
2. Kolla att policies finns för rätt roller
3. Testa med "New Policy" om nödvändigt

### Problem: Email skickas inte
**Lösning:**
1. Kolla att `send-invite-email` function finns
2. Verifiera att `SITE_URL` är satt
3. Kolla logs i Dashboard > Edge Functions > Logs

---

## 📞 Support

Vid problem:
1. Kolla [Supabase Docs](https://supabase.com/docs)
2. Kolla logs i Dashboard > Logs
3. Fråga i teamet

---

*Senast uppdaterad: 2026-03-01*
