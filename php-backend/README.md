# Deltagarportalen - PHP Backend

Komplett PHP-backend för Deltagarportalen, kompatibel med Simply och annan delad hosting.

## 📋 Krav

- PHP 8.0 eller högre
- SQLite (inbyggt i PHP)
- Apache med mod_rewrite
- cURL (för Arbetsförmedlingen API)

## 🚀 Installation på Simply

### 1. Ladda upp filer

Ladda upp hela `php-backend/`-mappen och `client/dist/`-innehållet till din Simply-server:

```
/public_html/
├── api/                    # PHP-backend
│   ├── index.php
│   └── ...
├── lib/                    # PHP-bibliotek
│   ├── Database.php
│   ├── Auth.php
│   └── Response.php
├── data/                   # SQLite-databas (skapas automatiskt)
├── index.html              # Frontend (från client/dist)
├── assets/                 # Frontend assets
└── .htaccess               # Routing
```

### 2. Konfigurera JWT Secret

Skapa filen `.env` i `php-backend/`-mappen:

```bash
JWT_SECRET=din-super-hemliga-nyckel-minst-32-tecken
```

Generera en säker nyckel:
```bash
# Om du har tillgång till terminal:
openssl rand -base64 32
```

Eller använd en online-generator för slumpmässiga strängar (minst 32 tecken).

### 3. Sätt rättigheter

Se till att `data/`-mappen är skrivbar:

```bash
chmod 755 /path/to/php-backend/data
```

### 4. Testa installationen

Öppna i webbläsare:
```
https://dindoman.se/api/health
```

Du bör se:
```json
{"success":true,"data":{"status":"ok","timestamp":"2024-..."}}
```

## 🔧 Frontend-konfiguration

Frontend ska redan vara konfigurerad att använda `/api` som base URL.

Bygg frontend:
```bash
cd client
npm run build
```

Kopiera innehållet i `client/dist/` till webbroot på servern.

## 📊 Databas

SQLite-databasen skapas automatiskt vid första anropet. Filen sparas i:
```
php-backend/data/deltagarportal.db
```

### Backup av databas

Kopiera bara filen:
```bash
cp data/deltagarportal.db data/deltagarportal.db.backup.$(date +%Y%m%d)
```

## 🔒 Säkerhet

1. **JWT Secret**: Använd en lång, slumpmässig sträng
2. **Lösenord**: Hashas med bcrypt (kostnad 12)
3. **CORS**: Konfigurerat för att tillåta alla origins (ändra vid behov)
4. **SQL Injection**: Skyddad via PDO prepared statements

## 🐛 Felsökning

### "404 Not Found" på API-anrop

Kontrollera att `.htaccess` finns och att mod_rewrite är aktiverat:
```bash
# Lägg till i .htaccess om det inte fungerar
RewriteEngine On
```

### "Database is locked"

SQLite kan låsa sig vid samtidiga skrivningar. Vänta några sekunder och försök igen.

### "Failed to fetch"

Kontrollera att CORS-headers är korrekt konfigurerade i `.htaccess`.

## 📝 API-dokumentation

### Autentisering

- `POST /api/auth/register` - Registrera ny användare
- `POST /api/auth/login` - Logga in
- `GET /api/auth/me` - Hämta inloggad användare

### CV

- `GET /api/cv` - Hämta användarens CV
- `POST /api/cv` - Spara CV
- `GET /api/cv/versions` - Hämta CV-versioner

### Personliga brev

- `GET /api/cover-letter` - Lista alla brev
- `POST /api/cover-letter` - Skapa nytt brev
- `PUT /api/cover-letter/:id` - Uppdatera brev
- `DELETE /api/cover-letter/:id` - Ta bort brev

### Intresseguide

- `GET /api/interest/result` - Hämta senaste resultat
- `POST /api/interest/result` - Spara resultat

### Användare

- `GET /api/user/me` - Hämta profil
- `PUT /api/user/me` - Uppdatera profil

## 🔧 Underhåll

### Uppdatera backend

1. Ladda upp nya PHP-filer
2. Databasen uppdateras automatiskt (migreringar körs vid behov)

### Loggar

PHP-fel loggas till Simply:s standard PHP-error-log.

---

**Support**: Vid problem, kontrollera först att:
1. PHP 8.0+ är installerat
2. `.env` finns med JWT_SECRET
3. `data/`-mappen är skrivbar
4. `.htaccess` är korrekt konfigurerad
