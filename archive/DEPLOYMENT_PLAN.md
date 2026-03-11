# Deploymentsplan för Deltagarportalen

## Problem vi har idag
- Lokalt vite preview har cache-problem
- Portkonflikter (5000, 8080, etc.)
- Svårt att rensa gamla versioner
- Ingen enkel delningsmöjlighet

## Rekommenderad lösning: Vercel (gratis)

### Varför Vercel?
✅ **Gratis** för hobbyprojekt  
✅ **Automatisk deployment** vid varje push till GitHub  
✅ **Preview URLs** - varje ändring får en unik URL att testa  
✅ **Inga cache-problem** - alltid färsk version  
✅ **HTTPS** - säker anslutning  
✅ **Inga portar** - bara öppna en URL i webbläsaren  
✅ **Dela enkelt** - skicka länken till vem som helst  

---

## Steg-för-steg guide

### 1. Förberedelser (10 min)

```bash
# Se till att du har ett GitHub-konto
# Se till att projektet är pushat till GitHub
```

### 2. Skapa Vercel-konto (5 min)

1. Gå till https://vercel.com
2. Klicka "Sign Up" → välj "Continue with GitHub"
3. Godkänn behörigheter
4. Klart!

### 3. Koppla projektet (5 min)

1. I Vercel-dashboard, klicka "Add New Project"
2. Välj "Import Git Repository"
3. Välj ditt GitHub-konto
4. Hitta "deltagarportalen" i listan
5. Klicka "Import"

### 4. Konfigurera bygginställningar (2 min)

Vercel brukar upptäcka inställningar automatiskt, men kontrollera:

```
Framework Preset: Vite
Root Directory: client
Build Command: npm run build
Output Directory: dist
```

Klicka "Deploy"

### 5. Klart! (1 min)

Efter 2-3 minuter får du:
- **Production URL**: `https://deltagarportalen.vercel.app`
- **Dashboard**: Översikt över alla deployments

---

## Hur du använder det framöver

### Testa en ny version

```bash
# 1. Gör dina ändringar i koden
# 2. Commit och push till GitHub
git add .
git commit -m "Förbättrad design enligt feedback"
git push origin main
```

**Vercel gör resten automatiskt!**

- Ny version byggs (tar ~2 min)
- Production URL uppdateras automatiskt
- Ingen cache, inga portar, inget krångel

### Testa ändringar innan de går live (Preview)

```bash
# Skapa en ny branch
git checkout -b feature/ny-design

# Gör ändringar, commit, push
git push origin feature/ny-design
```

Vercel skapar automatiskt en **Preview URL**:
- `https://deltagarportalen-git-feature-ny-design.vercel.app`
- Testa denna URL först
- Nöjd? Merge till main → production uppdateras

---

## Alternativ (om Vercel inte passar)

### Alternativ 2: Netlify (liknande Vercel)
- Fördelar: Också gratis, enkelt
- Nackdelar: Lite långsammare än Vercel
- URL: `https://deltagarportalen.netlify.app`

### Alternativ 3: GitHub Pages (helt gratis)
- Fördelar: Inget extra konto, allt i GitHub
- Nackdelar: Kräver GitHub Actions workflow, lite mer setup
- URL: `https://dittnamn.github.io/deltagarportalen`

### Alternativ 4: Docker lokalt (om du vill köra lokalt men bättre)
```bash
# Bygg Docker-image
docker build -t deltagarportalen .

# Kör container
docker run -p 3000:80 deltagarportalen

# Öppna http://localhost:3000
# För att rensa: docker system prune -a
```

---

## Rekommendation

**Starta med Vercel.** Det är det smidigaste alternativet:
- Pusha kod → Automatisk deployment
- Inga fler "gamla versioner"
- Enkel URL att komma ihåg
- Kan delas med vem som helst

---

## Checklista för mig (Maria) att förbereda

- [ ] Säkerställa att `client/dist` byggs korrekt
- [ ] Skapa `vercel.json` konfiguration om nödvändigt
- [ ] Dokumentera miljövariabler (om vi lägger till backend senare)

---

*Vill du att jag ska hjälpa dig sätta upp Vercel nu? Det tar cirka 15 minuter totalt.*
