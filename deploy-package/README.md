# 🚀 Deltagarportalen - Deploy-paket för Egen Host

Detta paket innehåller allt du behöver för att köra Deltagarportalen med AI-funktioner på din egen server.

---

## 📦 Innehåll

```
deploy-package/
├── nodejs-version/          # Om din host stödjer Node.js
│   ├── server.js           # Backend med Express
│   ├── package.json
│   └── public/             # Frontend-filer
│       ├── index.html
│       ├── app.js
│       └── style.css
├── php-version/            # Om din host har PHP (t.ex. Loopia, One, etc.)
│   ├── api/
│   │   └── openrouter.php  # PHP-backend för OpenRouter
│   └── public/
│       ├── index.html
│       ├── app.js
│       └── style.css
└── standalone-html/        # Enkel HTML-version (kräver ingen backend)
    └── ai-demo.html        # Med inbyggd proxy-logik
```

---

## 🎯 Välj din version

### Alternativ 1: Node.js-version (Rekommenderat)
**Passar för:** VPS, DigitalOcean, AWS, Azure, eller host med Node.js-stöd

**Fördelar:**
- Full funktionalitet
- Bäst prestanda
- Enkel att underhålla

**Se:** `nodejs-version/README.md`

---

### Alternativ 2: PHP-version
**Passar för:** Loopia, One.com, Binero, eller annan shared hosting med PHP

**Fördelar:**
- Fungerar på de flesta svenska webbhotell
- Ingen installation av Node.js krävs

**Se:** `php-version/README.md`

---

### Alternativ 3: Standalone HTML
**Passar för:** Statisk hosting, GitHub Pages, Netlify

**Fördelar:**
- Inga serverkrav alls
- Ladda upp och kör

**Nackdelar:**
- Kräver att användaren har egen OpenRouter-nyckel
- Mindre säker (API-nyckeln syns om du lägger in den)

**Se:** `standalone-html/README.md`

---

## 🔧 Snabbstart

### Steg 1: Välj version
Bestäm vilken version som passar din host:

- Har du **SSH och terminal**? → Node.js-version
- Har du bara **FTP och cPanel**? → PHP-version  
- Vill du ha **helt statisk**? → Standalone HTML

### Steg 2: Konfigurera
1. Kopiera mappen för vald version till din server
2. Konfigurera API-nyckel (se respektive README)

### Steg 3: Deploy
Följ instruktionerna i respektive README för din version.

---

## 🔐 Säkerhet - VIKTIGT!

**ALDRIG lägg din OpenRouter API-nyckel i:**
- Frontend-kod (JavaScript som skickas till webbläsaren)
- Git-repositoriet (använd .gitignore!)
- Offentlig dokumentation

**API-nyckeln ska ENDAST finnas:**
- I miljövariabler på servern (.env-fil)
- I server-side kod (PHP, Node.js)

---

## 📞 Support

Vid problem, kontrollera:
1. Är API-nyckeln korrekt insatt?
2. Fungerar serverns utgående anslutningar (curl/fetch)?
3. Är rättigheterna korrekta på filerna?

---

*Senast uppdaterad: 2026-02-21*
