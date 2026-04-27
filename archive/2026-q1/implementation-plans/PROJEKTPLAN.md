# Deltagarportal - Projektplan

## Vision
En användarportal för arbetssökande med fokus på effektivisering av arbetskonsulenternas arbete och värde för deltagarna.

## Inspirationskällor
- https://glannstrom.se/cv/ - CV-generator med AI, personligt brev-generator, ATS-analys
- https://glannstrom.se/intresse/ - Intresseguide med RIASEC, Big Five, ICF, jobbmatchning

## Arkitektur
- Frontend: React + TypeScript + Tailwind CSS
- Backend: Node.js/Express API
- Auth: JWT-baserad inloggning
- Database: SQLite (enkel deployment)

## Sidor & Funktioner

### 1. Login/Huvudsida
- Inloggningsformulär
- Registrering för nya användare
- Dashboard efter inloggning

### 2. CV-Generator
- Steg-för-steg CV-byggare
- Profilbildsuppladdning
- Personlig information
- Arbetslivserfarenhet
- Utbildning
- Färdigheter
- ATS-kompatibilitetsanalys
- Export till PDF

### 3. Personligt Brev-Generator
- Input för jobbannons
- Stilreferens (tidigare brev)
- AI-generering
- Redigering och sparning

### 4. Intresseguide
- 40 frågor baserade på:
  - RIASEC (Holland-koder)
  - Big Five (personlighet)
  - ICF (funktionsnedsättningar)
  - Fysiska arbetskrav
- Resultat: Yrkesrekommendationer
- Integration med Arbetsförmedlingens API

### 5. Kunskapsbank
- Artiklar om arbetsmarknad
- Hälsa och välmående
- Sökbara kategorier
- Taggar

### 6. Admin-panel (för arbetskonsulenter)
- Översikt över deltagare
- Kommentarer och anteckningar
- Uppföljning

## Teknisk Stack
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Zustand (state management)
- React Query (data fetching)
- Express.js
- SQLite + Prisma
- JWT auth
- Puppeteer (PDF-export)

## Filstruktur
```
deltagarportal/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Återanvändbara komponenter
│   │   ├── pages/          # Sidkomponenter
│   │   ├── hooks/          # Custom hooks
│   │   ├── stores/         # Zustand stores
│   │   ├── services/       # API-anrop
│   │   └── types/          # TypeScript types
│   └── public/
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/         # API-routes
│   │   ├── models/         # Databasmodeller
│   │   ├── middleware/     # Auth, etc.
│   │   └── services/       # Affärslogik
│   └── prisma/
└── README.md
```

## Utvecklingsfaser

### Fas 1: Grundstruktur (Timme 1-2)
- [ ] Initiera projekt
- [ ] Sätta upp React + Vite
- [ ] Konfigurera Tailwind
- [ ] Skapa grundläggande routing
- [ ] Design-system (färger, typografi)

### Fas 2: Autentisering (Timme 2-3)
- [ ] Backend: Express + SQLite setup
- [ ] Registrering endpoint
- [ ] Login endpoint
- [ ] JWT middleware
- [ ] Frontend: Auth context
- [ ] Login/Register sidor

### Fas 3: Dashboard & Navigation (Timme 3-4)
- [ ] Sidebar-komponent
- [ ] Dashboard layout
- [ ] Navigation mellan sidor
- [ ] Skyddade routes

### Fas 4: CV-Generator (Timme 4-6)
- [ ] CV-formulär komponenter
- [ ] Steg-för-steg wizard
- [ ] ATS-analys logik
- [ ] PDF-export

### Fas 5: Personligt Brev (Timme 6-7)
- [ ] Brev-generator formulär
- [ ] AI-integration (mock eller riktig)
- [ ] Spara/ladda brev

### Fas 6: Intresseguide (Timme 7-9)
- [ ] Frågekomponenter
- [ ] RIASEC-logik
- [ ] Big Five-beräkning
- [ ] Resultatvisning
- [ ] Yrkesmatchning

### Fas 7: Kunskapsbank (Timme 9-10)
- [ ] Artikelstruktur
- [ ] Sök och filter
- [ ] Kategorier

### Fas 8: Polering & Deploy (Timme 10-11)
- [ ] UI/UX förbättringar
- [ ] GitHub-repo
- [ ] README
- [ ] Deployment-instruktioner

## Designprinciper
- Clean, professionell design
- Fokus på tillgänglighet (WCAG)
- Mobilresponsiv
- Svenskt språk i UI
- Enkelt för arbetssökande att använda
- Effektivt för arbetskonsulenter

## Framtida funktioner (efter MVP)
- Integration med Arbetsförmedlingens API
- AI-chatbot för karriärrådgivning
- Kalender för möten med konsulent
- Dokumentdelning
- Statistik för arbetskonsulenter
