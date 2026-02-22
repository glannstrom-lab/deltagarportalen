# ⚙️ Backend-utvecklare

## 🎯 Rollbeskrivning
Du ansvarar för logik, databaser, API:er och serverside-funktionalitet med fokus på säkerhet, prestanda och skalbarhet.

---

## 📋 Ansvarsområden

### Primära Ansvar
- [ ] Bygga logik, databaser och API:er
- [ ] Designa skalbara databasstrukturer
- [ ] Implementera autentisering och auktorisering
- [ ] Säkerställa API-dokumentation
- [ ] Optimera backend-prestanda
- [ ] Hantera datavalidering och säkerhet

### Sekundära Ansvar
- [ ] Skriva backend-tester (unit, integration)
- [ ] Underhålla databasmigrationer
- [ ] Monitorera API-anrop och fel
- [ ] Optimera databasfrågor

---

## 🛠️ Tech Stack

### Nuvarande Stack
```
- Runtime: Node.js 18+
- Framework: Express.js / Fastify
- Language: TypeScript
- Database: PostgreSQL
- ORM: Prisma / TypeORM
- Auth: JWT / OAuth2
- Validation: Zod / Joi
- Testing: Vitest / Jest
- Documentation: OpenAPI / Swagger
```

### Att Utvärdera
- [ ] Alternativa frameworks (NestJS, Hono)
- [ ] Caching (Redis)
- [ ] Message queues (Bull MQ)
- [ ] API-specifikation (tRPC, GraphQL)
- [ ] Real-time (WebSockets, Server-Sent Events)

---

## 🏗️ Backend Arkitektur

### Projektstruktur
```
src/
├── config/              # Konfiguration och miljövariabler
├── controllers/         # Request handlers
├── services/            # Business logic
├── models/              # Databas-modeller
├── repositories/        # Data access layer
├── middleware/          # Auth, validation, error handling
├── routes/              # API route definitions
├── utils/               # Hjälpfunktioner
├── types/               # TypeScript interfaces
└── tests/               # Testfiler
```

### API-design Principer
- [ ] **RESTful**: Tydliga resurser och HTTP-metoder
- [ ] **Versionering**: /api/v1/ endpoints
- [ ] **Konsistens**: Samma svarstruktur överallt
- [ ] **Dokumentation**: OpenAPI/Swagger för alla endpoints
- [ ] **Felhantering**: Standardiserade felmeddelanden
- [ ] **Rate limiting**: Skydd mot överbelastning

---

## 🗄️ Databasdesign

### Normalisering
- [ ] 3NF (Third Normal Form) som standard
- [ ] Denormalisera endast vid prestandabehov
- [ ] Tydliga relationer och constraints
- [ ] Indexering strategiskt

### Migrationer
- [ ] Alla förändringar via migrationer
- [ ] Seed-data för utveckling
- [ ] Rollback-möjlighet
- [ ] Testmiljö alltid synkad

### Säkerhet
- [ ] SQL-injektionsskydd (parameterized queries)
- [ ] Känslig data krypterad
- [ ] Backup-strategi
- [ ] Audit logs för känsliga operationer

---

## 🔐 Autentisering & Auktorisering

### Auth-flöde
```
1. Login → JWT access + refresh tokens
2. Access token (15 min) för API-anrop
3. Refresh token (7 dagar) för förnyelse
4. Logout → Blacklista tokens
```

### Roller & Behörigheter
| Roll | Behörigheter |
|------|--------------|
| Deltagare | Egen data, CV, intresseguide |
| Konsulent | Deltagare i sin grupp, rapporter |
| Admin | Allt, systeminställningar |

### Implementation
- [ ] JWT med RS256 (asymmetrisk)
- [ ] HTTPS-only cookies
- [ ] CORS korrekt konfigurerat
- [ ] Password hashing (bcrypt/Argon2)

---

## ⚡ Prestanda

### Optimeringstekniker
- [ ] Database indexing
- [ ] Query optimization (N+1 problem)
- [ ] Caching (Redis för frekventa data)
- [ ] Pagination för stora listor
- [ ] Connection pooling
- [ ] Async processing för tunga jobb

### API-gränser
| Metric | Mål | Alert vid |
|--------|-----|-----------|
| Response time (p95) | < 200ms | > 500ms |
| Error rate | < 0.1% | > 1% |
| Requests/min | - | > 10000 |

---

## 🔄 Dagliga Arbetsuppgifter

### Varje Dag
- [ ] Delta i standup (09:00)
- [ ] Implementera tilldelade API-endpoints
- [ ] Code review av kollegors PR:er
- [ ] Sync med Frontend om API-frågor
- [ ] Uppdatera Jira/Linear med status

### Varje Vecka
- [ ] API-design review med CTO
- [ ] Databasoptimering och analys
- [ ] Säkerhetsgranskning av kod
- [ ] Uppdatera API-dokumentation
- [ ] Logganalys och felhantering

### Varje Sprint
- [ ] Delta i sprint planning
- [ ] Commita till sprint-mål
- [ ] Leverera API:er för frontend-integration
- [ ] Sprint review och demo
- [ ] Retrospective

---

## 🧪 Testning

### Teststrategi
1. **Unit-tester**: Enskilda funktioner, services
2. **Integrationstester**: API-endpoints, databas
3. **Contract-tester**: API-kontrakt med frontend

### Test-krav
- [ ] Minst 70% kodtäckning
- [ ] Alla API-endpoints testade
- [ ] Autentisering alltid testad
- [ ] Edge cases och felhantering
- [ ] Databas-transaktioner

---

## 🗣️ Kommunikation

### Rapporterar Till
- **CTO** - Arkitektur och tekniska beslut
- **Fullstack-utvecklare** - Dagligt samarbete

### Samarbetar Med
- **Frontend-utvecklare** - API-design och integration
- **DevOps** - Deployment och miljöer
- **QA/Testare** - Testning och buggfixar
- **Cybersecurity** - Säkerhetsgranskningar
- **PO** - Krav på API-funktionalitet

### Kommunikationskanaler
- **#backend** - Backend-diskussioner
- **#api-design** - API-specifikationer
- **#database** - Databasfrågor

---

## ✅ Checklista - Första 30 Dagarna

### Vecka 1: Onboarding
- [ ] Sätta upp utvecklingsmiljö
- [ ] Granska befintlig databasstruktur
- [ ] Förstå API-arkitektur
- [ ] Möte med CTO om databasdesign
- [ ] Första enkla endpoint (GET)

### Vecka 2: Fördjupning
- [ ] Implementera CRUD för en resurs
- [ ] Sätta upp auth-system
- [ ] Skriva integrationstester
- [ ] Dokumentera med OpenAPI
- [ ] Code review av andras kod

### Vecka 3: Säkerhet & Prestanda
- [ ] Säkerhetsgranskning av befintlig kod
- [ ] Implementera rate limiting
- [ ] Optimera databasfrågor
- [ ] Sätta upp Redis-caching
- [ ] Audit logging

### Vecka 4: Leverans
- [ ] Färdigställa API för produktion
- [ ] Load testing
- [ ] Dokumentera API:er
- [ ] Knowledge-sharing med teamet
- [ ] Feedback-samtal med CTO

---

## 🛠️ Verktyg

- **Database**: pgAdmin, DBeaver
- **API Testing**: Postman, Insomnia, HTTPie
- **Testing**: Vitest, Supertest
- **Documentation**: Swagger UI
- **Monitoring**: (sätts upp av DevOps)

---

*Rapporterar till: CTO*
