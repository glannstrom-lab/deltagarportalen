# Deltagarportalen

En användarportal för arbetssökande med fokus på effektivisering av arbetskonsulenters arbete och värde för deltagarna.

## Funktioner

### 🔐 Autentisering
- Registrering och inloggning
- JWT-baserad autentisering
- Rollbaserad åtkomst (användare, konsulent, admin)

### 📝 CV-Generator
- Steg-för-steg CV-byggare
- Personlig information
- Arbetslivserfarenhet
- Utbildning
- Färdigheter
- ATS-kompatibilitetsanalys
- PDF-export (kommande)

### ✉️ Personligt Brev-Generator
- AI-baserad generering
- Input för jobbannons
- Stilreferens från tidigare brev
- Spara och hantera flera brev

### 🧭 Intresseguide
- RIASEC-test (Holland-koder)
- Big Five personlighetstest
- Fysiska förutsättningar
- Yrkesrekommendationer

### 📚 Kunskapsbank
- Artiklar om arbetsmarknaden
- Hälsa och välmående
- Sök och filter
- Kategorier

## Teknisk Stack

### Backend
- Node.js
- Express
- TypeScript
- SQLite med Prisma ORM
- JWT-autentisering

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Zustand (state management)
- React Query (data fetching)
- Lucide React (ikoner)

## Installation

### 1. Klona repot
```bash
git clone https://github.com/[ditt-användarnamn]/deltagarportal.git
cd deltagarportal
```

### 2. Installera beroenden
```bash
npm run install:all
```

### 3. Konfigurera miljövariabler
```bash
cd server
cp .env.example .env
# Redigera .env med dina inställningar
```

### 4. Sätt upp databasen
```bash
npm run db:generate
npm run db:migrate
```

### 5. Starta utvecklingsservern
```bash
npm run dev
```

Detta startar både backend (port 3001) och frontend (port 3000).

## Miljövariabler

### Server (.env)
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-in-production"
PORT=3001
```

## API-endpoints

### Auth
- `POST /api/auth/register` - Registrera ny användare
- `POST /api/auth/login` - Logga in

### CV
- `GET /api/cv` - Hämta användarens CV
- `PUT /api/cv` - Uppdatera CV
- `GET /api/cv/ats-analysis` - ATS-analys

### Intresseguide
- `GET /api/interest/questions` - Hämta frågor
- `GET /api/interest/result` - Hämta resultat
- `POST /api/interest/result` - Spara resultat
- `POST /api/interest/recommendations` - Yrkesrekommendationer

### Personligt Brev
- `GET /api/cover-letter` - Hämta alla brev
- `POST /api/cover-letter` - Skapa nytt brev
- `PUT /api/cover-letter/:id` - Uppdatera brev
- `DELETE /api/cover-letter/:id` - Ta bort brev
- `POST /api/cover-letter/generate` - Generera med AI

### Kunskapsbank
- `GET /api/articles` - Hämta alla artiklar
- `GET /api/articles/:id` - Hämta specifik artikel
- `GET /api/articles/meta/categories` - Hämta kategorier

### Användare
- `GET /api/users/me` - Hämta profil
- `PUT /api/users/me` - Uppdatera profil
- `GET /api/users` - Hämta alla deltagare (konsulent)
- `GET /api/users/:id` - Hämta specifik deltagare (konsulent)
- `POST /api/users/:id/notes` - Lägg till anteckning (konsulent)

## Framtida funktioner

- [ ] Integration med Arbetsförmedlingens API
- [ ] AI-chatbot för karriärrådgivning
- [ ] Kalender för möten med konsulent
- [ ] Dokumentdelning
- [ ] Statistik för arbetskonsulenter
- [ ] PDF-export för CV
- [ ] E-postnotiser
- [ ] Mobilapp

## Licens

MIT

## Utvecklat av

Denna portal är utvecklad för att hjälpa arbetssökande på deras väg till nytt jobb.
