# GitHub Pages Setup Guide

En komplett guide för att deploya Deltagarportalen till GitHub Pages.

---

## ✅ Vad har jag redan förberett?

### 1. GitHub Actions workflow (`.github/workflows/deploy.yml`)
- Automatisk deployment vid varje push till `main`
- Bygger projektet med Node.js 20
- Deployar `client/dist` till GitHub Pages

### 2. Vite konfiguration uppdaterad (`client/vite.config.ts`)
- Lagt till `base: '/deltagarportalen/'` för korrekta sökvägar
- Detta gör att appen fungerar från underkatalogen `/deltagarportalen/`

---

## 🚀 Steg-för-steg: Aktivera GitHub Pages

### Steg 1: Pusha alla ändringar till GitHub

```bash
# Lägg till alla filer
git add .

# Commit
git commit -m "Förbered för GitHub Pages deployment"

# Push till main
git push origin main
```

### Steg 2: Aktivera GitHub Pages i repository-inställningar

1. Gå till ditt repository på GitHub: `https://github.com/ditt-användarnamn/deltagarportalen`

2. Klicka på **Settings** (fliken högst upp)

3. I vänster menyn, klicka på **Pages**

4. Under **Build and deployment**:
   - **Source**: Välj "GitHub Actions"
   - (Inte "Deploy from a branch" - vi använder Actions)

5. Klicka **Save**

### Steg 3: Vänta på första deployment

1. Gå till **Actions**-fliken i ditt repository
2. Du ser workflow "Deploy to GitHub Pages" köra
3. Vänta 2-3 minuter tills det är klart ✅

### Steg 4: Besök din sida

URL: `https://ditt-användarnamn.github.io/deltagarportalen/`

Ersätt `ditt-användarnamn` med ditt faktiska GitHub-användarnamn.

---

## 🔄 Så här fungerar det framöver

### Testa en ny version

```bash
# 1. Gör dina ändringar i koden

# 2. Commit och push
git add .
git commit -m "Beskrivning av ändringen"
git push origin main

# 3. GitHub Actions bygger och deployar automatiskt (tar ~2 min)

# 4. Öppna https://ditt-användarnamn.github.io/deltagarportalen/
#    - Hård omladdning (Ctrl+F5) för att rensa cache
```

### Se status på deployment

1. Gå till **Actions**-fliken i GitHub
2. Klicka på senaste workflow-körningen
3. Se loggar om något går fel

---

## 🛠️ Felsökning

### Problem: "404 Not Found" när jag öppnar sidan

**Lösning:**
1. Kontrollera att GitHub Pages är aktiverat (Settings → Pages)
2. Kontrollera att rätt repository-namn används i URL:en
3. Vänta 5 minuter - ibland tar det tid att propagera

### Problem: Sidan är blank / inget visas

**Lösning:**
1. Öppna webbläsarens konsol (F12 → Console)
2. Kontrollera om det är 404-fel på filer
3. Se till att `base: '/deltagarportalen/'` finns i `vite.config.ts`

### Problem: Bilder/assets laddas inte

**Lösning:**
- Alla bilder måste ligga i `client/public/` mappen
- Använd relativa sökvägar: `/bild.png` (inte `../bild.png`)

### Problem: Routing fungerar inte (404 vid sid-refresh)

**Lösning:**
- GitHub Pages stödjer inte SPA-routing (React Router) per default
- Lösning: Använd HashRouter istället för BrowserRouter (se nedan)

---

## 🔧 Om du behöver ändra: HashRouter för bättre routing

Om du får 404 när du refreshar sidan (t.ex. på `/cv`), ändra i `client/src/main.tsx`:

```typescript
// FRÅN:
import { BrowserRouter } from 'react-router-dom'

// TILL:
import { HashRouter } from 'react-router-dom'

// Och använd:
<HashRouter>
  <App />
</HashRouter>
```

Detta lägger till `#` i URL:en (`/#/cv` istället för `/cv`), vilket fungerar bättre på GitHub Pages.

---

## 📁 Filstruktur som skapats

```
deltagarportalen/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions workflow
├── client/
│   ├── vite.config.ts          # Uppdaterad med base-URL
│   └── dist/                   # Byggd app (skapas vid build)
└── GITHUB_PAGES_SETUP.md       # Denna guide
```

---

## ✅ Checklista innan du börjar

- [ ] GitHub-repository skapat
- [ ] All kod pushad till `main`-branchen
- [ ] GitHub Pages aktiverat i Settings
- [ ] Väntat 2-3 minuter på första deployment
- [ ] Testat URL:en i webbläsaren

---

## 🎯 Fördelar med denna lösning

| Fördel | Beskrivning |
|--------|-------------|
| **Gratis** | GitHub Pages är kostnadsfritt |
| **Automatiskt** | Pusha kod → Deploy sker automatiskt |
| **Versionshistorik** | Alla ändringar sparas i Git |
| **Inga portar** | Bara öppna URL i webbläsaren |
| **Ingen cache** | Alltid färsk version från GitHub |
| **Dela enkelt** | En URL att komma ihåg och dela |

---

**Du är redo! Pusha till GitHub och aktivera Pages så är du igång!** 🚀
