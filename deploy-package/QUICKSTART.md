# ⚡ Snabbstart

Få Deltagarportalen med AI uppe på 10 minuter!

---

## 🎯 Välj din väg

| Om du har... | Välj denna | Tid |
|--------------|-----------|-----|
| SSH + Terminal | [Node.js-version](nodejs-version/) | 10 min |
| cPanel/FTP | [PHP-version](php-version/) | 10 min |
| Bara statisk hosting | Be om hjälp | - |

---

## 🚀 Snabbstart - Node.js (t.ex. Render.com)

### 1. Skapa konto på Render.com
Gå till [render.com](https://render.com) och skapa gratis konto.

### 2. Ladda upp kod
```bash
# På din dator:
cd nodejs-version
# (lägg in din API-nyckel i .env först)
git init
git add .
git commit -m "Initial"
# Pusha till GitHub eller ladda upp direkt på Render
```

**Eller enklare:** Zipa mappen `nodejs-version` och ladda upp direkt på Render.

### 3. Konfigurera på Render
- **Environment:** Node
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Environment Variables:** Lägg till `OPENROUTER_API_KEY`

### 4. Klar!
Du får en URL som `https://deltagarportalen-abc.onrender.com`

---

## 🚀 Snabbstart - PHP (t.ex. Loopia)

### 1. Packa filer
Zipa mappen `php-version` på din dator.

### 2. Ladda upp
1. Logga in på ditt webbhotell (Loopia, One.com, etc.)
2. Gå till Filhanteraren
3. Ladda upp zip-filen till `public_html/`
4Packa upp zip-filen

### 3. Konfigurera
1. Öppna `config.php` i filhanteraren
2. Ändra raden:
   ```php
   define('OPENROUTER_API_KEY', 'sk-or-v1-din-nyckel-här');
   ```
3. Spara

### 4. Testa
Gå till: `https://din-domain.com/public/`

---

## 🔑 Skaffa OpenRouter API-nyckel

1. Gå till [openrouter.ai](https://openrouter.ai)
2. Skapa konto
3. Gå till "Keys"
4. Skapa ny nyckel
5. Kopiera nyckeln (börjar med `sk-or-v1-`)

---

## ✅ Checklista innan deploy

- [ ] API-nyckel infogad i config
- [ ] `.env` eller `config.php` INTE i git (om du använder git)
- [ ] Testat lokalt (för Node.js: `npm start`)
- [ ] Alla filer uppladdade

---

## 🆘 Får du fel?

| Fel | Lösning |
|-----|---------|
| "API-nyckel saknas" | Dubbelkolla config-filen |
| "cURL error" | Kontakta webbhotell, be dem aktivera cURL |
| "Cannot find module" | Kör `npm install` igen |
| "Port already in use" | Ändra PORT i .env |

---

## 🎉 Grattis!

Nu har du Deltagarportalen med AI på din egen server!

Testa funktionerna:
- ✅ CV-optimering
- ✅ Jobbcoach-råd  
- ✅ Arbetsanpassnings-förslag
