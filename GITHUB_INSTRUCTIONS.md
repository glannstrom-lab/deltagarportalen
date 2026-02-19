# Deltagarportalen - Instruktioner för GitHub

## Steg för att publicera på GitHub

Eftersom GitHub CLI inte är autentiserad i denna miljö, följ dessa steg för att publicera portalen:

### Alternativ 1: Använd GitHub CLI (om du har tillgång)
```bash
# Logga in på GitHub
gh auth login

# Skapa repo
gh repo create deltagarportal --public --source=. --push
```

### Alternativ 2: Använd webbgränssnittet
1. Gå till https://github.com/new
2. Skapa ett nytt repository med namnet "deltagarportal"
3. Följ instruktionerna för att pusha en befintlig repository:

```bash
cd /root/.openclaw/workspace/deltagarportal
git remote add origin https://github.com/[DITT-ANVÄNDARNAMN]/deltagarportal.git
git branch -M main
git push -u origin main
```

## Vad som har skapats

### Backend (Node.js/Express)
- ✅ Autentisering med JWT
- ✅ CV-hantering med ATS-analys
- ✅ Intresseguide med RIASEC och Big Five
- ✅ Personligt brev-generator
- ✅ Kunskapsbank med artiklar
- ✅ SQLite-databas med Prisma ORM

### Frontend (React/TypeScript)
- ✅ Inloggning och registrering
- ✅ Dashboard med översikt
- ✅ CV-generator med steg-för-steg wizard
- ✅ Intresseguide med 40+ frågor
- ✅ Personligt brev-generator
- ✅ Kunskapsbank med sök
- ✅ Profilhantering

## Nästa steg

1. **Installera beroenden:**
   ```bash
   npm run install:all
   ```

2. **Konfigurera databas:**
   ```bash
   cd server
   cp .env.example .env
   npx prisma migrate dev
   ```

3. **Starta utveckling:**
   ```bash
   npm run dev
   ```

## Struktur

```
deltagarportal/
├── client/          # React frontend
├── server/          # Express backend
├── README.md        # Dokumentation
└── PROJEKTPLAN.md   # Projektplan
```

## Funktioner att lägga till (framtida utveckling)

- [ ] PDF-export för CV
- [ ] Integration med Arbetsförmedlingens API
- [ ] AI-chatbot för karriärrådgivning
- [ ] Kalender för möten
- [ ] E-postnotiser
- [ ] Mobilapp
- [ ] Admin-panel för konsulenter
