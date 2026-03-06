# ⚡ Vercel Quickstart - Kom igång på 10 minuter

## Steg 1: Förberedelser (2 min)

Se till att du har:
- [ ] GitHub-repo pushat med senaste kod
- [ ] OpenRouter API-nyckel (från https://openrouter.ai)

## Steg 2: Skapa Vercel-konto (2 min)

1. Gå till https://vercel.com
2. Klicka "Sign Up" → "Continue with GitHub"
3. Godkänn behörigheter

## Steg 3: Importera projekt (2 min)

1. I Vercel-dashboard, klicka "Add New Project"
2. Hitta ditt GitHub-repo "deltagarportalen"
3. Klicka "Import"
4. Konfigurera:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Klicka "Deploy"

Vänta på att bygget ska bli klart (tar ~2 minuter).

## Steg 4: Konfigurera miljövariabler (3 min)

1. I Vercel Dashboard, gå till ditt projekt
2. Klicka "Settings" → "Environment Variables"
3. Lägg till:

| Key | Value |
|-----|-------|
| `OPENROUTER_API_KEY` | `sk-or-v1-din-nyckel-här` |
| `AI_MODEL` | `anthropic/claude-3.5-sonnet` |

4. Klicka "Save"
5. Gå till "Deployments" tabben
6. Hitta senaste deploymenten, klicka tre prickar → "Redeploy"

## Steg 5: Testa! (1 min)

1. Öppna din nya URL (visas i Vercel Dashboard)
2. Logga in på portalen
3. Testa en AI-funktion (t.ex. "Generera personligt brev")

---

## ✅ Klart!

Din app är nu live med:
- Frontend på Vercel
- AI-funktioner på Vercel Serverless Functions
- Databas på Supabase (oförändrad)

**URL:** `https://ditt-projekt.vercel.app`

---

## 🔄 Framtida deploys

Härfter sker allt automatiskt:

```bash
git add .
git commit -m "Dina ändringar"
git push origin main
```

Vercel bygger och deployar automatiskt! 🎉

---

## 🐛 Problem?

| Problem | Lösning |
|---------|---------|
| "Build failed" | Kolla att `client/package.json` har `@vercel/node` i devDependencies |
| "AI not working" | Kontrollera att `OPENROUTER_API_KEY` är satt i Vercel Settings |
| "CORS error" | Se till att du använder relativ URL (`/api/...`) i frontend |

---

**Behöver mer hjälp?** Se fullständiga guiden i `VERCEL_ALL_IN_ONE_SETUP.md`
