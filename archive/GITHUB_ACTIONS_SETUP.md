# 🤖 Automatisk Deploy - GitHub Actions

> **Automatisk build och deploy varje gång du pushar till main!**

---

## 🎯 Hur det fungerar

```
Du pushar till main
        ↓
GitHub Actions startar automatiskt
        ↓
1. Installerar dependencies
2. Kör tester
3. Bygger frontend
4. Deployar till GitHub Pages
        ↓
Klart! 🎉
```

---

## ⚙️ Setup (Gör detta en gång)

### Steg 1: Aktivera GitHub Pages

1. Gå till din repo på GitHub
2. Klicka på **Settings** → **Pages**
3. Under **Source** välj **GitHub Actions**

### Steg 2: Lägg till Secrets

Dessa miljövariabler behövs för bygget:

1. Gå till **Settings** → **Secrets and variables** → **Actions**
2. Klicka **New repository secret**
3. Lägg till dessa:

| Secret Name | Value | Var hittar du det? |
|-------------|-------|-------------------|
| `VITE_SUPABASE_URL` | `https://odcvrdkvzyrbdzvdrhkz.supabase.co` | Supabase Dashboard → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbG...` | Supabase Dashboard → Project Settings → API → anon/public |

### Steg 3: Aktivera Workflows

1. Gå till **Actions** fliken i din repo
2. Klicka på **"I understand my workflows, go ahead and enable them"**

---

## 🚀 Användning

### Vanlig workflow

```bash
# 1. Gör dina ändringar
git add .
git commit -m "Min feature"

# 2. Pusha till main
git push origin main

# 3. Klart! GitHub Actions gör resten automatiskt
#    Gå till Actions-fliken för att se progress
```

### Se status på deploy

1. Gå till **Actions** fliken i GitHub
2. Klicka på senaste workflow-körningen
3. Se realtidsloggar

---

## 📁 Filer som skapats

```
.github/
└── workflows/
    └── deploy.yml          # CI/CD pipeline

GITHUB_ACTIONS_SETUP.md     # Denna fil
```

---

## 🔧 Konfiguration

### Ändra deploy-mål

Edit `.github/workflows/deploy.yml`:

```yaml
# För Netlify istället för GitHub Pages:
deploy:
  steps:
    - name: Deploy to Netlify
      run: npx netlify deploy --prod --dir=./client/dist
      env:
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

### Lägg till notifieringar

**Discord:**
```yaml
- name: Discord notification
  uses: Ilshidur/action-discord@master
  with:
    args: '🚀 Deltagarportalen har deployats!'
  env:
    DISCORD_WEBHOOK: ${{ secrets.DISCORD_WEBHOOK }}
```

**Slack:**
```yaml
- name: Slack notification
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: '🚀 Deltagarportalen har deployats!'
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 🐛 Felsökning

### Bygget failar

1. Gå till **Actions** → Klicka på den röda workflow-körningen
2. Läs felmeddelandet
3. Vanliga fel:
   - **"secrets.VITE_SUPABASE_URL not found"** → Lägg till secret i GitHub
   - **"npm test failed"** → Kolla testerna lokalt först

### Deploy fungerar inte

1. Kontrollera att GitHub Pages är aktiverat (Settings → Pages)
2. Kolla att workflow har rättigheter (Settings → Actions → General)
3. Verifiera att `index.html` finns i `client/dist/`

---

## 📊 Status badges

Lägg till i din README.md för att visa status:

```markdown
[![Build & Deploy](https://github.com/glannstrom-lab/deltagarportalen/actions/workflows/deploy.yml/badge.svg)](https://github.com/glannstrom-lab/deltagarportalen/actions/workflows/deploy.yml)
```

---

## ✨ Fördelar

| Före | Efter |
|------|-------|
| Manuell build lokalt | Automatisk vid varje push |
| Manuell upload till hosting | Automatisk deploy |
| Risk för att glömma deploy | Alltid uppdaterad |
| Ingen historik | Full logg i Actions |

---

## 🎯 Sammanfattning

**Efter detta är på plats:**
1. Pusha till `main` → Automatisk build & deploy
2. Ingen manuell deploy behövs!
3. Full transparens i Actions-fliken

**URL efter deploy:** `https://glannstrom-lab.github.io/deltagarportalen/`

---

*Konfiguration klar! Pusha för att testa.* 🚀
