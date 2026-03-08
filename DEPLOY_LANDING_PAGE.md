# 🚀 Deploya Jobin Landningssida till www.jobin.se

Denna guide beskriver hur du får upp den nya landningssidan live på www.jobin.se.

---

## 📋 Översikt

**Arkitektur:**
- **Frontend**: React + Vite (landningssidan är en React-komponent)
- **Hosting**: Vercel (rekommenderas) eller annan statisk hosting
- **Backend**: Supabase (Edge Functions, databas, auth)
- **Domän**: www.jobin.se

**Landningssidan:**
- Fil: `client/src/pages/Landing.tsx`
- Visas på: `/` för oinloggade besökare
- Inloggade omdirigeras automatiskt till `/dashboard`

---

## ✅ Steg-för-steg Deployment

### Steg 1: Förberedelser

1. **Se till att du har ett Vercel-konto**
   - Gå till [vercel.com](https://vercel.com)
   - Logga in med GitHub (rekommenderas)

2. **Verifiera att du har tillgång till domänen**
   - Du måste kunna uppdatera DNS-inställningar för `jobin.se`
   - Eller ha någon som kan göra det åt dig

### Steg 2: Pusha kod till GitHub

```bash
# Se till att allt är committat
git add .
git commit -m "feat: Add landing page for Jobin with new routing"

# Pusha till main
git push origin main
```

### Steg 3: Sätt upp Vercel-projekt

**Alternativ A: Via Vercel Dashboard (enklast)**

1. Gå till [vercel.com/dashboard](https://vercel.com/dashboard)
2. Klicka "Add New Project"
3. Importera ditt GitHub-repo (deltagarportalen)
4. Konfigurera:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Klicka "Deploy"

**Alternativ B: Via Vercel CLI**

```bash
# Installera Vercel CLI om du inte har den
npm install -g vercel

# Logga in
vercel login

# I projektroten
cd client

# Första deployen
vercel

# Följ instruktionerna:
# - Set up and deploy? [Y/n] → Y
# - Which scope? → Välj ditt konto
# - Link to existing project? [y/N] → N (första gången)
# - What's your project name? → jobin
```

### Steg 4: Konfigurera miljövariabler i Vercel

1. I Vercel Dashboard, gå till ditt projekt
2. Klicka på "Settings" → "Environment Variables"
3. Lägg till:

| Variabel | Värde |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://odcvrdkvzyrbdzvdrhkz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kY3ZyZGt2enlyYmR6dmRyaGt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjU1NzcsImV4cCI6MjA4NzQ0MTU3N30.StWwqG3cVo1ItJ5Z59eQzBGBH4ttIHypupcKzkAYXus` |

4. Klicka "Save"
5. Redeploya: Gå till "Deployments" → klicka på "...") → "Redeploy"

### Steg 5: Konfigurera domän (www.jobin.se)

**I Vercel Dashboard:**

1. Gå till "Settings" → "Domains"
2. I "Project Domains", skriv: `www.jobin.se`
3. Klicka "Add"
4. Vercel visar nu DNS-instruktioner. Du behöver lägga till en CNAME-post hos din domänleverantör:

**DNS-konfiguration hos domänleverantör (t.ex. Loopia, Namecheap, etc):**

```
Typ:     CNAME
Namn:    www
Värde:   cname.vercel-dns.com
TTL:     3600
```

**För root-domän (jobin.se utan www):**

Alternativ 1 (rekommenderas): Använd www.jobin.se som huvudadress och redirecta root-domen:
```
Typ:     CNAME
Namn:    @
Värde:   cname.vercel-dns.com
```

Alternativ 2: Om din domänleverantör stödjer ALIAS/ANAME:
```
Typ:     ALIAS (eller ANAME)
Namn:    @
Värde:   cname.vercel-dns.com
```

**Notera:** DNS-propagation kan ta upp till 24 timmar, men oftast inom 1-2 timmar.

### Steg 6: Verifiera deployment

1. **Testa Vercel-URL:en** (innan DNS är klart)
   - Din app får en tillfällig URL: `https://jobin-xxx.vercel.app`
   - Testa att landningssidan visas korrekt
   - Testa login-knappen (ska gå till /login)
   - Testa att registrering fungerar

2. **Testa www.jobin.se** (när DNS är klart)
   - Gå till https://www.jobin.se
   - Verifiera att landningssidan visas
   - Klicka på "Logga in" och testa inloggning
   - Efter inloggning ska du hamna på dashboarden

3. **Testa olika enheter**
   - Mobil (iPhone/Android)
   - Tablet
   - Desktop

---

## 🔧 Alternativa hosting-lösningar

Om du inte vill använda Vercel, här är alternativ:

### Alternativ A: Netlify

```bash
cd client
npm run build

# Installera Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

### Alternativ B: GitHub Pages

1. Uppdatera `client/vite.config.ts`:
```typescript
export default defineConfig({
  base: '/deltagarportalen/',  // Ditt repo-namn
  // ...resten av konfigurationen
})
```

2. Använd GitHub Actions för automatisk deploy (se `GITHUB_ACTIONS_SETUP.md`)

### Alternativ C: Egen server (Laragon/XAMPP)

```bash
cd client
npm run build

# Kopiera dist-mappen till din webbserver
cp -r dist/* /path/to/laragon/www/jobin.se/
```

---

## 🔒 HTTPS och säkerhet

**Vercel**, **Netlify** och **GitHub Pages** erbjuder automatiskt HTTPS via Let's Encrypt.

Om du kör egen server, konfigurera Let's Encrypt:
```bash
# Installera certbot
# Konfigurera SSL för jobin.se
```

---

## 🧪 Test-checklista före lansering

- [ ] Landningssidan visas på www.jobin.se
- [ ] Login-knappen fungerar och leder till /login
- [ ] Registrering fungerar
- [ ] Efter inloggning omdirigeras användaren till /dashboard
- [ ] Alla sektioner på landningssidan ser bra ut (Hero, Features, Testimonials, FAQ)
- [ ] Mobilversionen fungerar (testa på riktig mobil)
- [ ] Laddningstid är rimlig (< 3 sekunder)
- [ ] Inga console errors i webbläsaren
- [ ] Supabase-kopplingen fungerar (testa inloggning)

---

## 🐛 Felsökning

### "Page not found" på www.jobin.se
- Verifiera DNS-inställningarna
- Kolla i Vercel Dashboard att domänen är korrekt konfigurerad
- Vänta på DNS-propagation (kan ta upp till 24 timmar)

### Landningssidan visas inte (vit sida)
- Kolla browser console för fel
- Verifiera att miljövariabler är satta i Vercel
- Kontrollera att bygget lyckades i Vercel Dashboard → Deployments

### Login fungerar inte
- Verifiera att Supabase URL och API-nyckel är korrekt
- Kolla att redirect-URL:er är konfigurerade i Supabase Auth settings
- Testa med en ny användare

### CSS ser konstig ut
- Kontrollera att Tailwind byggdes korrekt
- Verifiera att inga 404-fel för CSS-filer i Network tab

---

## 📞 Support

Vid problem:
1. Kolla Vercel Dashboard → Logs för byggfel
2. Testa lokalt först: `cd client && npm run dev`
3. Kolla browser console för JavaScript-fel

---

## 🎉 Efter lansering

1. **Sätt upp analytics** (valfritt):
   - Google Analytics
   - Vercel Analytics (inbyggt i Pro-plan)

2. **Övervakning**:
   - Vercel Dashboard visar uptime automatiskt
   - Supabase Dashboard för databasövervakning

3. **SEO** (valfritt):
   - Skicka in sitemap till Google Search Console
   - Lägg till metadata tags i index.html

---

**Redo att gå live?** Följ stegen ovan och din landningssida kommer att synas på www.jobin.se! 🚀
