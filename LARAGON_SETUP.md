# 🖥️ Lokal Utveckling med Laragon

Denna guide hjälper dig att köra Deltagarportalen lokalt med Laragon.

---

## 📋 Förutsättningar

1. **Laragon** installerat (hela paketet med Node.js)
   - Ladda ner: https://laragon.org/download/
   - Installera i `C:\laragon`

2. **Node.js** (följer med Laragon)
   - Verifiera: Öppna Laragon Terminal och kör `node --version`

---

## 🚀 Snabbstart

### Alternativ 1: Enkel start (rekommenderad för utveckling)

1. Öppna **Laragon Terminal**
2. Navigera till projektet:
   ```bash
   cd C:\laragon\www\deltagarportal
   ```
3. Starta utvecklingsservererna:
   ```bash
   start-laragon.bat
   ```
   
   Eller direkt med npm:
   ```bash
   npm run install:all  # Installerar alla beroenden (första gången)
   npm run dev          # Startar både frontend och backend
   ```

4. Öppna i webbläsaren:
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:3001

---

## 📁 Projektstruktur

```
C:\laragon\www\deltagarportal\
├── client\              # React + Vite frontend
│   ├── src\            # React-komponenter
│   └── public\         # Statiska filer
├── server\             # Express + TypeScript backend
│   ├── src\            # API-routes och logik
│   └── prisma\         # Databas-schema
├── start-laragon.bat   # Start-script för Windows
└── package.json        # Root-package med scripts
```

---

## 🔧 Konfiguration

### Miljövariabler

Lokal konfiguration finns i `server/.env.local`:

```env
NODE_ENV=development
PORT=3001
JWT_SECRET=deltagarportal-local-secret-key-development-only
DATABASE_URL="file:./local.db"
CLIENT_URL=http://localhost:5173
```

Kopiera till `.env` vid första start:
```bash
copy server\.env.local server\.env
```

### Databas

Projektet använder **MySQL/MariaDB** (via Laragon).

Databasen `deltagarportal` är redan skapad och konfigurerad.

#### Verifiera databasanslutning

```bash
cd C:\laragon\www\deltagarportal
test-database.bat
```

#### Om du behöver återställa databasen

```bash
cd server
npx prisma migrate reset
```

#### Se databasen i Prisma Studio (GUI)

```bash
cd server
npx prisma studio
# Öppna http://localhost:5555 i webbläsaren
```

---

## 📝 Användbara kommandon

```bash
# Installera alla beroenden
npm run install:all

# Starta utveckling (frontend + backend)
npm run dev

# Starta bara backend
npm run dev:server

# Starta bara frontend
npm run dev:client

# Bygg för produktion
npm run build

# Databas-kommandon
npm run db:generate    # Generera Prisma-klient
npm run db:migrate     # Kör migrationer
npm run db:studio      # Öppna Prisma Studio (GUI)
```

---

## 🌐 Virtuell Host (valfritt)

För att få en snyggare URL som `deltagarportal.test`:

1. I Laragon, klicka på **Menu** → **Apache** → **sites-enabled**
2. Skapa filen `deltagarportal.conf`:
   ```apache
   <VirtualHost *:80>
       DocumentRoot "C:/laragon/www/deltagarportal/client/dist"
       ServerName deltagarportal.test
       
       <Directory "C:/laragon/www/deltagarportal/client/dist">
           AllowOverride All
           Require all granted
       </Directory>
       
       # Proxy för API-anrop till backend
       ProxyPass /api http://localhost:3001/api
       ProxyPassReverse /api http://localhost:3001/api
   </VirtualHost>
   ```
3. Starta om Apache i Laragon
4. Bygg frontend: `cd client && npm run build`
5. Besök: http://deltagarportal.test

---

## 🐛 Felsökning

### "Port 3001 is already in use"
```bash
# Hitta och stäng processen på port 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### "Cannot find module"
```bash
# Installera om beroenden
npm run install:all
```

### Databasfel
```bash
# Återställ databasen
cd server
rm local.db  # Windows: del local.db
npx prisma migrate dev
```

### CORS-fel
Kontrollera att `CLIENT_URL` i `server/.env` matchar din frontend-URL.

---

## 📚 Resurser

- **Prisma dokumentation**: https://www.prisma.io/docs
- **Vite dokumentation**: https://vitejs.dev/guide/
- **Express dokumentation**: https://expressjs.com/
- **Laragon dokumentation**: https://laragon.org/docs/

---

*Senast uppdaterad: 2026-02-22*
