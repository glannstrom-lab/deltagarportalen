# 🚀 Backend Deployment Guide - Deltagarportalen

## 📋 Förutsättningar

Du behöver en server som stödjer:
- **Node.js 18+**
- **NPM**
- **SQLite** (ingår i Node.js)

## 📁 Struktur efter deployment

```
/deltagarportalen/                    # Rotmapp på servern
├── server/                           # Backend
│   ├── dist/                         # Kompilerad backend-kod
│   ├── prisma/
│   │   └── dev.db                    # Databas (skapas vid start)
│   ├── package.json
│   ├── package-lock.json
│   └── .env                          # Miljövariabler
└── client/dist/                      # Frontend-bygge
    ├── index.html
    ├── assets/
    └── vite.svg
```

## 🛠️ Steg-för-steg deployment

### 1. Kopiera filer till servern

Ladda upp hela `deltagarportalen-backend.zip` till din server och packa upp:

```bash
# På servern:
cd /var/www/html  # eller din webbroot
cd deltagarportalen
unzip deltagarportalen-backend.zip
```

### 2. Installera beroenden

```bash
cd server
npm install --production
```

### 3. Konfigurera miljövariabler

Skapa filen `server/.env`:

```env
# Databas (SQLite - sparas som fil)
DATABASE_URL="file:./prisma/dev.db"

# JWT Secret (byt ut till något långt och slumpmässigt!)
JWT_SECRET="din-super-hemliga-nyckel-minst-32-tecken-lång"

# Port (backend körs på denna port)
PORT=3001

# Frontend URL (för CORS)
FRONTEND_URL="https://glannstrom.se"
```

**VIKTIGT:** Ändra `JWT_SECRET` till något unikt och hemligt!

### 4. Initiera databasen

```bash
cd server
npx prisma generate
npx prisma migrate deploy
```

### 5. Starta servern

**Alternativ A - Direkt (för test):**
```bash
cd server
npm start
```

**Alternativ B - Med PM2 (rekommenderat för produktion):**
```bash
# Installera PM2 globalt
npm install -g pm2

# Starta med PM2
cd server
pm2 start dist/index.js --name deltagarportal-api

# Spara PM2-konfiguration
pm2 save
pm2 startup
```

### 6. Konfigurera webbserver (Apache/Nginx)

#### Apache (.htaccess)

Om du kör på delad hosting, lägg till i `public_html/.htaccess`:

```apache
# Omdirigera allt till backend
RewriteEngine On
RewriteBase /

# API-anrop -> backend
RewriteRule ^api/(.*)$ http://localhost:3001/api/$1 [P,L]

# Frontend-filer
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^deltagarportalen/(.*)$ /deltagarportalen/client/dist/$1 [L]

# SPA fallback
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^deltagarportalen/.*$ /deltagarportalen/client/dist/index.html [L]
```

#### Nginx

```nginx
server {
    listen 80;
    server_name glannstrom.se;

    location /deltagarportalen/ {
        alias /var/www/html/deltagarportalen/client/dist/;
        try_files $uri $uri/ /deltagarportalen/index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔒 Säkerhet

### 1. HTTPS (SSL-certifikat)

Se till att du har HTTPS aktiverat. Om du använder Let's Encrypt:

```bash
sudo certbot --nginx -d glannstrom.se
```

### 2. Miljövariabler

- Ändra aldrig `JWT_SECRET` efter att systemet är i drift (då loggas alla användare ut)
- Förvara `.env` utanför webbroot om möjligt
- Använd `chmod 600 .env` för att begränsa åtkomst

### 3. Brandvägg

Öppna endast portarna:
- 80 (HTTP)
- 443 (HTTPS)
- 3001 (backend - endast localhost/intern)

## 📊 Övervakning

### Loggar

```bash
# Backend-loggar (med PM2)
pm2 logs deltagarportal-api

# Eller direkt
journalctl -u deltagarportal-api
```

### Hälsokontroll

```bash
curl https://glannstrom.se/api/health
```

## 🔄 Uppdateringar

För att uppdatera till ny version:

```bash
cd /var/www/html/deltagarportalen

# 1. Stoppa backend
pm2 stop deltagarportal-api

# 2. Backup databas
cp server/prisma/dev.db server/prisma/dev.db.backup

# 3. Ladda upp nya filer
# (ersätt client/dist och server/dist)

# 4. Uppdatera beroenden
cd server
npm install --production
npx prisma migrate deploy

# 5. Starta om
pm2 start deltagarportal-api
```

## 🆘 Felsökning

### Problem: "Cannot connect to backend"

1. Kolla att backend körs:
   ```bash
   pm2 status
   ```

2. Kolla loggar:
   ```bash
   pm2 logs
   ```

3. Testa direkt:
   ```bash
   curl http://localhost:3001/api/health
   ```

### Problem: "Database locked"

1. Stoppa backend
2. Ta bort låsfil om den finns:
   ```bash
   rm server/prisma/dev.db-journal
   ```
3. Starta om

### Problem: CORS-fel

Kolla att `FRONTEND_URL` i `.env` matchar din faktiska domän.

## 📞 Support

Om något går fel:
1. Kolla loggarna först
2. Testa backend direkt på localhost:3001
3. Verifiera att frontend kan nå /api

---

**Lycka till med deployment!** 🎉
