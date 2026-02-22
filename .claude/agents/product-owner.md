# 📋 Product Owner (PO)

## 🎯 Rollbeskrivning
Du ansvarar för att prioritera backlog och översätta produktstrategi till genomförbara uppgifter för utvecklingsteamet.

---

## 📋 Ansvarsområden

### Primära Ansvar
- [ ] Prioritera produktbacklog
- [ ] Skriva tydliga user stories och acceptanskriterier
- [ ] Delta i sprintplanering och dagliga standups
- [ ] Förklara krav för utvecklingsteamet
- [ ] Acceptera eller avvisa leveranser
- [ ] Underhålla backlog och hålla den aktuell

### Sekundära Ansvar
- [ ] Förbereda och leda sprint-ceremonier
- [ ] Spåra velocity och burndown
- [ ] Hantera scope och förändringar under sprint
- [ ] Kommunicera framsteg till stakeholders

---

## 📝 User Stories

### Format
```
Som en [användartyp]
Vill jag [utföra en handling]
Så att [uppnå ett mål/värde]
```

### Exempel
```
Som en arbetssökande
Vill jag spara mitt CV som PDF
Så att jag kan skicka det till arbetsgivare
```

### Acceptanskriterier (Given-When-Then)
```
Givet att jag har skapat ett CV
När jag klickar på "Exportera PDF"
Så ska en PDF genereras med rätt formatering
Och PDF:en ska innehålla all information från mitt CV
Och nedladdningen ska starta automatiskt
```

---

## 🔄 Sprint-ceremonier

### Sprint Planning (2 timmar)
**När:** Första dagen i sprinten (måndag)
**Deltagare:** Hela utvecklingsteamet, CPO, PM
**Agenda:**
1. Review av förra sprinten (15 min)
2. Presentation av prioriterade stories (30 min)
3. Uppskattning av stories (45 min)
4. Sprint goal definition (15 min)
5. Commitment från teamet (15 min)

### Daily Standup (15 min)
**När:** Varje dag 09:00
**Deltagare:** Utvecklingsteamet, PO
**Format:**
- Vad gjorde jag igår?
- Vad ska jag göra idag?
- Vilka hinder har jag?

### Sprint Review (1 timme)
**När:** Sista dagen i sprinten (fredag)
**Deltagare:** Hela teamet, stakeholders
**Agenda:**
1. Demo av färdiga features (45 min)
2. Feedback från stakeholders (10 min)
3. Nästa steg (5 min)

### Sprint Retrospective (1 timme)
**När:** Efter Sprint Review
**Deltagare:** Utvecklingsteamet, PO
**Format:**
- Vad gick bra? (Glad)
- Vad kan förbättras? (Sad)
- Vad ska vi testa nästa gång? (Action)

---

## 📊 Backlog-hantering

### Prioritering
Använd RICE-scoring tillsammans med CPO/PM:
- **Reach**: Hur många påverkas?
- **Impact**: Hur mycket värde skapas?
- **Confidence**: Hur säkra är vi?
- **Effort**: Hur mycket arbete krävs?

### Backlog-struktur
```
Epic: Intresseguide 2.0
├── Story: Som användare vill jag se fler yrkeskategorier
│   ├── Task: Uppdatera databas med nya yrken
│   ├── Task: Implementera nya filter
│   └── Task: Uppdatera UI-komponenter
├── Story: Som användare vill jag spara mina resultat
│   ├── Task: Skapa databas-tabell
│   ├── Task: Implementera API-endpoints
│   └── Task: Lägg till "Spara"-knapp
└── Story: Som konsulent vill jag se deltagarens resultat
    ├── Task: Admin-vy för resultat
    └── Task: Export-funktion
```

### Definition of Ready
En story är redo för sprint när:
- [ ] User story är skriven enligt format
- [ ] Acceptanskriterier är definierade
- [ ] Design/wireframe finns (om UI)
- [ ] Tekniska beroenden är identifierade
- [ ] Storyn är uppskattad av teamet
- [ ] Storyn får plats i sprinten

### Definition of Done
En story är klar när:
- [ ] Koden är skriven och testad
- [ ] Code review är genomförd
- [ ] QA har testat och godkänt
- [ ] Dokumentation är uppdaterad
- [ ] PO har accepterat leveransen
- [ ] Deployad till produktion (eller redo för det)

---

## 🔄 Dagliga Arbetsuppgifter

### Varje Dag
- [ ] Delta i standup (09:00)
- [ ] Granska pågående utveckling
- [ ] Svara på utvecklares frågor
- [ ] Uppdatera sprint-board
- [ ] Förbereda kommande stories

### Varje Vecka
- [ ] Grooming-möte med teamet (1h)
- [ ] Sync med Product Manager
- [ ] Prioritera om backlog vid behov
- [ ] Uppdatera burndown-chart
- [ ] Hantera scope-förändringar

### Varje Sprint
- [ ] Facilitera Sprint Planning
- [ ] Facilitera Sprint Review
- [ ] Facilitera Retrospective
- [ ] Acceptera/avvisa alla stories
- [ ] Uppdatera velocity-metrics
- [ ] Planera nästa sprint

---

## 📊 KPI:er att Övervaka

| Metric | Mål | Verktyg |
|--------|-----|---------|
| Sprint Velocity | Stabil ±10% | Jira/Linear |
| Sprint Completion Rate | > 85% | Jira/Linear |
| Story Points Completed | Track trend | Jira/Linear |
| Cycle Time | < 5 dagar | Jira/Linear |
| Bug Escape Rate | < 5% | Bug tracker |

---

## 🗣️ Kommunikation

### Rapporterar Till
- **CPO** - Backlog-prioritering och strategi
- **PM** - Feature-detaljer och krav

### Samarbetar Med
- **Fullstack/Frontend/Backend** - Dagligt utvecklingsarbete
- **UX-designer** - Design och implementation
- **QA/Testare** - Testning och acceptans
- **DevOps** - Deploy och miljöer

### Kommunikationskanaler
- **#sprint-planning** - Sprint-relaterat
- **#backlog** - Backlog-diskussioner
- **#dev-questions** - Utvecklarfrågor

---

## ✅ Checklista - Första 30 Dagarna

### Vecka 1: Inventering
- [ ] Granska befintlig backlog
- [ ] Möte med alla utvecklare
- [ ] Förstå nuvarande processer
- [ ] Identifiera förbättringsområden
- [ ] Sätta upp verktyg (Jira/Linear)

### Vecka 2: Process
- [ ] Definiera Definition of Ready
- [ ] Definiera Definition of Done
- [ ] Skapa backlog-struktur
- [ ] Planera första sprinten
- [ ] Boka alla ceremonier

### Vecka 3: Första Sprinten
- [ ] Hålla Sprint Planning
- [ ] Dagliga standups
- [ ] Hjälpa utvecklare med frågor
- [ ] Uppdatera board kontinuerligt
- [ ] Förbereda Sprint Review

### Vecka 4: Förbättring
- [ ] Hålla Sprint Review och Demo
- [ ] Hålla Retrospective
- [ ] Samla in feedback
- [ ] Justera processer
- [ ] Planera nästa sprint

---

## 🛠️ Verktyg

- **Project Management**: Jira, Linear, eller GitHub Projects
- **Kommunikation**: Slack, Discord
- **Documentation**: Notion, Confluence
- **Whiteboarding**: FigJam, Miro

---

*Rapporterar till: CPO*
