# 🚀 Node.js-version

Komplett AI-lösning för Deltagarportalen med Node.js + Express.

---

## ✅ Förutsättningar

Din host måste ha:
- Node.js 16+ (helst 18+)
- NPM eller Yarn
- Möjlighet att köra `npm install` och `npm start`

**Passar för:**
- VPS (DigitalOcean, Linode, etc.)
- AWS/Azure/GCP
- Render.com (gratis!)
- Railway.app (gratis!)
- Heroku (betalt)

---

## 📦 Installation

### Steg 1: Ladda upp filer
Ladda upp hela mappen `nodejs-version` till din server.

### Steg 2: Installera dependencies
```bash
cd nodejs-version
npm install
```

### Steg 3: Konfigurera API-nyckel
```bash
# Kopiera exempel-konfigurationen
cp .env.example .env

# Redigera .env och fyll i din nyckel
nano .env
```

Ändra raden:
```
OPENROUTER_API_KEY=sk-or-v1-din-riktiga-nyckel-här
```

### Steg 4: Starta servern
```bash
npm start
```

Servern startar på port 3000 (eller den port som sätts i miljövariabel).

---

## 🌐 Åtkomst

- **Webbplats:** `http://din-domain.com:3000`
- **API-health:** `http://din-domain.com:3000/api/health`

---

## 🔧 Produktionsinställningar

### Med PM2 (rekommenderat för VPS)
```bash
# Installera PM2 globalt
npm install -g pm2

# Starta med PM2
pm2 start server.js --name "deltagarportalen"

# Spara konfiguration
pm2 save
pm2 startup
```

### Med Nginx reverse proxy
```nginx
server {
    listen 80;
    server_name din-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Med Apache (.htaccess ingår)
Se filen `.htaccess` i mappen (om din host använder Apache + mod_proxy).

---

## 📂 Filstruktur

```
nodejs-version/
├── server.js           # Huvudserver
├── package.json        # Dependencies
├── .env.example        # Exempel-konfiguration
├── .env               # Din konfiguration (skapas av dig)
├── .htaccess          # Apache config (valfritt)
├── README.md          # Denna fil
└── public/            # Frontend-filer
    ├── index.html
    ├── app.js
    └── style.css
```

---

## 🔒 Säkerhet

- **ALDRIG** lägg `.env` i git!
- API-nyckeln finns endast på servern
- Frontend har ingen tillgång till nyckeln

---

## 🐛 Felsökning

### "OPENROUTER_API_KEY saknas"
Se till att `.env`-filen finns och innehåller rätt nyckel.

### "EACCES permission denied"
Kör med sudo eller ändra port till > 1024:
```bash
PORT=3000 npm start  # istället för 80
```

### "Cannot find module 'express'"
Kör `npm install` igen.

---

## 📞 Support

Vid problem, kontrollera:
1. Att Node.js är installerat: `node --version`
2. Att alla filer laddats upp korrekt
3. Att `.env` finns med rätt innehåll
4. Att porten inte är blockerad av brandvägg
