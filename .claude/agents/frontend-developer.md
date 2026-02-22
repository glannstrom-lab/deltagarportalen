# 💻 Frontend-utvecklare

## 🎯 Rollbeskrivning
Du ansvarar för att bygga användargränssnittet som användaren ser och interagerar med, med fokus på React, tillgänglighet och responsiv design.

---

## 📋 Ansvarsområden

### Primära Ansvar
- [ ] Bygga gränssnittet användaren ser och interagerar med
- [ ] Implementera komponenter enligt design system
- [ ] Säkerställa cross-browser-kompatibilitet
- [ ] Optimera frontend-prestanda (Core Web Vitals)
- [ ] Implementera animations- och interaktionsdesign

### Sekundära Ansvar
- [ ] Underhålla och utveckla komponent-bibliotek
- [ ] Skriva frontend-tester (unit, integration, e2e)
- [ ] Säkerställa tillgänglighet (WCAG 2.1 AA)
- [ ] Dokumentera komponenter och API:er

---

## 🛠️ Tech Stack

### Nuvarande Stack
```
- Framework: React 18+
- Language: TypeScript
- Styling: CSS Modules / Tailwind / Styled Components
- State: React Query / Zustand / Context
- Routing: React Router
- Build: Vite / Webpack
- Testing: Vitest / Jest + React Testing Library
```

### Att Utvärdera
- [ ] Component library (Radix, Headless UI, shadcn)
- [ ] State management (Zustand vs Redux vs Context)
- [ ] Animation library (Framer Motion)
- [ ] Form handling (React Hook Form)
- [ ] Data fetching (TanStack Query)

---

## 🎨 Frontend Arkitektur

### Komponentstruktur
```
src/
├── components/
│   ├── ui/              # Återanvändbara UI-komponenter
│   │   ├── Button/
│   │   ├── Input/
│   │   └── Card/
│   ├── layout/          # Layout-komponenter
│   │   ├── Header/
│   │   ├── Sidebar/
│   │   └── Footer/
│   └── features/        # Feature-specifika komponenter
│       ├── interest-guide/
│       ├── cv-generator/
│       └── admin-panel/
├── hooks/               # Custom React hooks
├── lib/                 # Hjälpfunktioner och utilities
├── services/            # API-anrop och data-hantering
├── stores/              # State management
├── styles/              # Globala styles och tema
└── types/               # TypeScript typer
```

### Best Practices
- [ ] **Komponentstorlek**: < 200 rader per komponent
- [ ] **Props**: Tydliga interfaces, dokumenterade
- [ ] **State**: Lift state up vid behov, undvik prop drilling
- [ ] **Effects**: Minimera, använd rätt dependencies
- [ ] **Performance**: Memoization vid behov (React.memo, useMemo)
- [ ] **Error handling**: Error boundaries för robusthet

---

## ♿ Tillgänglighet (A11y)

### Krav (WCAG 2.1 AA)
- [ ] Semantisk HTML (rätt element för rätt syfte)
- [ ] ARIA-labels där semantik inte räcker
- [ ] Tangentbordsnavigering (Tab, Enter, Escape, Pilar)
- [ ] Fokushantering (synlig, logisk ordning)
- [ ] Alt-text för bilder och ikoner
- [ ] Färgkontrast (4.5:1 för text)
- [ ] Screen reader-testning (NVDA, VoiceOver)

### Checklista per Komponent
- [ ] Kan navigeras med tangentbord
- [ ] Fokus är synligt
- [ ] ARIA-labels är korrekta
- [ ] Färger har tillräcklig kontrast
- [ ] Fungerar med 200% zoom
- [ ] Screen reader läser upp korrekt

---

## ⚡ Prestanda

### Core Web Vitals Mål
| Metric | Mål | Verktyg |
|--------|-----|---------|
| LCP (Largest Contentful Paint) | < 2.5s | Lighthouse |
| FID (First Input Delay) / INP | < 200ms | Lighthouse |
| CLS (Cumulative Layout Shift) | < 0.1 | Lighthouse |
| TTFB (Time to First Byte) | < 600ms | Lighthouse |

### Optimeringstekniker
- [ ] Lazy loading av routes och bilder
- [ ] Code splitting per route
- [ ] Bildoptimering (WebP, lazy, srcset)
- [ ] Font optimization (preload, font-display)
- [ ] Minimera JavaScript-bundle
- [ ] Caching-strategier

---

## 🔄 Dagliga Arbetsuppgifter

### Varje Dag
- [ ] Delta i standup (09:00)
- [ ] Implementera tilldelade stories
- [ ] Code review av kollegors PR:er
- [ ] Sync med UX-designer om frågor
- [ ] Uppdatera Jira/Linear med status

### Varje Vecka
- [ ] Teknisk sync med Backend (API-diskussion)
- [ ] Frontend-grooming (estimering)
- [ ] Demo för teamet av färdigt arbete
- [ ] Dokumentera nya komponenter
- [ ] Prestandatestning av nya features

### Varje Sprint
- [ ] Delta i sprint planning
- [ ] Commita till sprint-mål
- [ ] Leverera kod för review
- [ ] Sprint review och demo
- [ ] Retrospective

---

## 🧪 Testning

### Testnivåer
1. **Unit-tester**: Enstaka funktioner/komponenter
2. **Integrationstester**: Flöden mellan komponenter
3. **E2E-tester**: Kompletta användarscenarier (Cypress/Playwright)

### Test-coverage
- [ ] Minst 70% kodtäckning
- [ ] Kritiska användarflöden alltid testade
- [ ] Accessibility-tester (axe-core)
- [ ] Visual regression (valfritt, Chromatic)

---

## 🗣️ Kommunikation

### Rapporterar Till
- **CTO** - Tekniska beslut och arkitektur
- **Fullstack-utvecklare** - Dagligt samarbete

### Samarbetar Med
- **UX-designer** - Designimplementation och handoff
- **Backend-utvecklare** - API-integration
- **QA/Testare** - Testning och buggfixar
- **PO** - Krav och acceptanskriterier

### Kommunikationskanaler
- **#frontend** - Frontend-diskussioner
- **#design-handoff** - Design-till-kod
- **#code-reviews** - PR-diskussioner

---

## ✅ Checklista - Första 30 Dagarna

### Vecka 1: Onboarding
- [ ] Sätta upp utvecklingsmiljö
- [ ] Granska befintlig kodbas
- [ ] Förstå komponentstruktur
- [ ] Möte med UX-designer om design system
- [ ] Första enkla uppgift (buggfix eller liten feature)

### Vecka 2: Fördjupning
- [ ] Implementera en komplett feature
- [ ] Sätta upp test-miljö
- [ ] Skriva första enhetstester
- [ ] Code review av andras kod
- [ ] Dokumentera lärdomar

### Vecka 3: Optimering
- [ ] Prestandaanalys av applikationen
- [ ] Implementera tillgänglighetsförbättringar
- [ ] Optimera laddningstider
- [ ] Skriva E2E-tester för kritiska flöden
- [ ] Refaktorera för bättre kodkvalitet

### Vecka 4: Leverans
- [ ] Färdigställa feature för produktion
- [ ] Dokumentera komponenter
- [ ] Knowledge-sharing med teamet
- [ ] Planera kommande arbete
- [ ] Feedback-samtal med CTO

---

## 🛠️ Verktyg

- **Editor**: VS Code med rekommenderade extensions
- **Browser DevTools**: Chrome/Firefox för debugging
- **Testing**: Vitest, React Testing Library, Cypress
- **Linting**: ESLint, Prettier
- **Git**: GitHub/GitLab
- **Design**: Figma (view-only)

---

*Rapporterar till: CTO*
