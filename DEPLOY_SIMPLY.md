# Deployment Guide: Simply + Supabase

**För:** glannstrom.se/deltagarportalen

---

## 📋 Förutsättningar

- Supabase-projekt skapat och konfigurerat
- Simply-konto (gratis fungerar)
- GitHub-konto (för enkel deployment)

---

## 🔧 Steg 1: Förbered frontend för produktion

### 1.1 Skapa .env.production
```bash
cd client
cp .env.example .env.production
```

Fyll i:
```
VITE_SUPABASE_URL=https://ditt-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=din-anon-nyckel-från-supabase
```

### 1.2 Bygg för produktion
```bash
cd client
npm run build
```

Detta skapar en `dist/`-mapp med optimerade filer.

---

## 🚀 Steg 2: Deploy till Simply

### Alternativ A: Via GitHub (rekommenderat)

1. **Skapa GitHub-repo**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/ditt-namn/deltagarportalen.git
   git push -u origin main
   ```

2. **Koppla Simply till GitHub**
   - Gå till https://simply.com
   - Skapa ny site → "Deploy from Git"
   - Välj ditt GitHub-repo
   - Bygg-kommando: `cd client && npm run build`
   - Publicerings-mapp: `client/dist`

3. **Miljövariabler i Simply**
   - Gå till Site Settings → Environment Variables
   - Lägg till:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

### Alternativ B: Manuell upload

1. **Bygg lokalt**
   ```bash
   cd client
   npm run build
   ```

2. **Upload till Simply**
   - Drag-and-drop `dist/`-mappen till Simply-dashboard
   - Eller använd Simply CLI

---

## 🗄️ Steg 3: Konfigurera Supabase för produktion

### 3.1 Autentisering
1. Gå till Supabase → Authentication → URL Configuration
2. **Site URL**: `https://glannstrom.se/deltagarportalen`
3. **Redirect URLs**: Lägg till:
   - `https://glannstrom.se/deltagarportalen`
   - `https://glannstrom.se/deltagarportalen/login`

### 3.2 CORS (om problem)
1. Gå till Supabase → API → Settings
2. **Allowed Origins**: Lägg till:
   ```
   https://glannstrom.se
   https://*.glannstrom.se
   ```

### 3.3 Edge Functions (för AI)
Om du använder AI-funktioner:
```bash
supabase functions deploy ai-cover-letter
supabase functions deploy cv-analysis
```

---

## 🌐 Steg 4: DNS & Custom Domain (valfritt)

Om du vill ha `deltagarportalen.glannstrom.se`:

1. **Simply**: Add custom domain i site settings
2. **DNS**: Lägg till CNAME hos din domänleverantör:
   ```
   deltagarportalen  CNAME  ditt-simply-namn.simplycdn.net
   ```

---

## ✅ Steg 5: Verifiera deployment

### Testa att allt fungerar:
1. ✅ Sidan laddar utan fel
2. ✅ Kan skapa konto
3. ✅ Kan logga in
4. ✅ Kan spara CV
5. ✅ Kan söka jobb (Arbetsförmedlingen)

### Vanliga problem:

| Problem | Lösning |
|---------|---------|
| "Failed to fetch" | Kontrollera CORS i Supabase |
| Vit sida | Kolla console för JS-fel |
| Auth fungerar inte | Kontrollera Site URL i Supabase |
| 404 på routes | Simply ska hantera SPA-routing |

---

## 🔒 Säkerhetschecklista

- [ ] Supabase `anon` key används (inte service_role)
- [ ] RLS policies är aktiverade på alla tabeller
- [ ] Email-confirmation är AV för enklare onboarding (eller ON om du vill)
- [ ] HTTPS är påtvingat
- [ ] Inga hemligheter i GitHub-repo

---

## 📊 Övervakning

### Supabase Dashboard:
- Auth → Users (se registrerade användare)
- Database → Logs (se queries)
- Edge Functions → Logs (se AI-anrop)

### Simply Dashboard:
- Analytics (trafik)
- Deployments (historik)
- Logs (fel)

---

## 🆘 Felsökning

### "Invalid API key"
- Kontrollera att `VITE_SUPABASE_ANON_KEY` är rätt
- Säkerställ att nyckeln är från Settings → API (anon public)

### "Email not confirmed"
- Gå till Supabase → Auth → Providers → Email
- Stäng av "Confirm email" för enklare flow

### CORS-fel
- Lägg till din domän i Supabase → API → Allowed Origins
- Inkludera både `https://` och `http://` för localhost

---

## 📞 Support

- Supabase Docs: https://supabase.com/docs
- Simply Docs: https://simply.com/docs
- Arbetsförmedlingen API: https://jobtechdev.se

---

**Klart!** Din app är nu live på glannstrom.se/deltagarportalen 🎉
