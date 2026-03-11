# Team-granskning: Ny Widget-baserad Dashboard

## Sammanfattning av expertanalyser

### Deltagare i granskningen:
- **UX-designer** - Användarflöden och visuell design
- **Product Owner** - Datakrav och user stories
- **Fullstack-utvecklare** - Arkitektur och implementation
- **UX Researcher** - Tillgänglighet för långtidsarbetslösa

---

## 🔴 VIKTIG INSIGHT: 10 widgets är för mycket!

**UX Researchern varnar:**
> *"10 widgets är för överväldigande för vår målgrupp. Rekommendation: Max 6 synliga widgets med möjlighet att anpassa."*

### Rekommenderad struktur:

```
┌─────────────────────────────────────────┐
│  HÖG prioritet (alltid synlig)          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │  CV     │ │ Jobbsök │ │ Aktivit │   │
│  │  status │ │         │ │   et    │   │
│  └─────────┘ └─────────┘ └─────────┘   │
├─────────────────────────────────────────┤
│  LÅG prioritet (anpassningsbar)         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │Intresse-│ │ Kalender│ │  Brev   │   │
│  │  guide  │ │         │ │         │   │
│  └─────────┘ └─────────┘ └─────────┘   │
└─────────────────────────────────────────┘
```

---

## 🎨 Design-beslut

### Widget-kortspecifikation (UX-designer)

| Egenskap | Värde |
|----------|-------|
| **Höjd** | 280px (fast) |
| **Grid** | 2 kol (mobil), 3 kol (tablet), 4-5 kol (desktop) |
| **Gap** | 16-20px |
| **Hover** | translateY(-4px) + större skugga |
| **Fokus** | 3px teal ring |

### Färgschema per widget

| Widget | Primärfärg | Bakgrund |
|--------|-----------|----------|
| CV | Violet-600 | Violet-50 |
| Intresseguide | Teal-600 | Teal-50 |
| Jobbsökning | Blue-600 | Blue-50 |
| Ansökningar | Orange-600 | Orange-50 |
| Brev | Green-600 | Green-50 |
| Kalender | Rose-600 | Rose-50 |

---

## 📊 Datakrav per widget (Product Owner)

### 1. CV-widget (MUST)
```typescript
interface CVWidgetData {
  hasCV: boolean
  progress: number        // 0-100%
  atsScore: number        // 0-100
  lastEdited: string      // ISO date
  missingSections: string[]
}
```

**States:**
- Ej påbörjad → "Skapa CV"
- Påbörjad → Progress bar + "Fortsätt redigera"
- Komplett → "CV klart!" + ATS-score

### 2. Jobbsökning-widget (MUST)
```typescript
interface JobSearchWidgetData {
  savedJobsCount: number
  newJobsSinceLastVisit: number
  recentSavedJobs: Job[]  // 3 senaste
}
```

### 3. Ansöknings-widget (MUST)
```typescript
interface ApplicationsWidgetData {
  totalApplications: number
  statusBreakdown: {
    applied: number
    interview: number
    rejected: number
  }
  nextFollowUp: {
    company: string
    dueDate: string
  } | null
}
```

### 4. Intresseguide-widget (SHOULD)
```typescript
interface InterestWidgetData {
  hasCompletedGuide: boolean
  topRecommendations: string[]  // 3 yrken
  completedAt: string | null
}
```

### 5. Brev-widget (SHOULD)
```typescript
interface CoverLetterWidgetData {
  totalLetters: number
  recentLetters: CoverLetter[]  // 3 senaste
  templatesAvailable: number
}
```

### 6. Kalender-widget (COULD)
```typescript
interface CalendarWidgetData {
  upcomingEvents: Event[]       // 3 kommande
  eventsThisWeek: number
  hasConsultantMeeting: boolean
}
```

---

## ♿ Tillgänglighetskrav (UX Researcher)

### Empatisk kommunikation

| ❌ Undvik | ✅ Använd |
|-----------|-----------|
| "Endast 30% komplett" | "Du har påbörjat din profil!" |
| "Du har 5 ouppgifter" | "5 möjligheter att utforska" |
| "70% av andra är färdiga" | "Alla går i sin egen takt" |
| "Kom igång nu!" | "Utforska när du vill" |

### Progress-indikatorer (utan skuld)

```tsx
// Bra exempel:
if (progress < 25) {
  message = "Bra start! Ta den i din egen takt.";
} else if (progress < 75) {
  message = "Du kommer framåt - fortsätt när det passar dig.";
} else {
  message = "Bra jobbat! Du är redo när du känner dig redo.";
}
```

### Viktiga tillgänglighetskrav

1. **Klickytor:** Minimum 44×44px
2. **Kontrast:** 4.5:1 för text
3. **Reduced motion:** Respektera systeminställningar
4. **Tangentbord:** Full navigering möjlig
5. **Screen readers:** Aria-labels på alla interaktiva element

---

## 🏗️ Teknisk arkitektur (Fullstack-utvecklare)

### Filstruktur

```
client/src/
├── components/dashboard/
│   ├── DashboardGrid.tsx      # Grid-layout
│   ├── DashboardWidget.tsx    # Bas-komponent
│   ├── WidgetSkeleton.tsx     # Loading state
│   └── widgets/
│       ├── CVWidget.tsx
│       ├── JobSearchWidget.tsx
│       ├── ApplicationsWidget.tsx
│       ├── InterestWidget.tsx
│       ├── CoverLetterWidget.tsx
│       └── CalendarWidget.tsx
├── hooks/
│   └── useDashboardData.ts    # Centraliserad data
└── types/
    └── dashboard.ts
```

### Data-hantering

**Centraliserad approach** - Dashboard.tsx hämtar all data:

```typescript
// useDashboardData.ts
const { data, loading, error, refetch } = useDashboardData()

// Returnerar all data för alla widgets i ett objekt
```

**Fördelar:**
- Färre API-anrop
- Enkel loading state
- Bättre felhantering
- Caching möjlig

### Prestanda-optimering

1. **React.memo** på varje widget
2. **Batch-hämtning** av data
3. **Optimistisk UI** - visa cached data direkt
4. **Lazy loading** för tunga widgets (valfritt)

---

## 📋 Implementeringsordning

### Sprint 1: Grund (Dag 1-2)
1. Skapa `types/dashboard.ts`
2. Skapa `DashboardWidget.tsx` (bas-komponent)
3. Skapa `DashboardGrid.tsx`

### Sprint 2: Data (Dag 3-4)
4. Skapa `useDashboardData.ts`
5. Identifiera nödvändiga API-endpoints

### Sprint 3: Core Widgets (Dag 5-8)
6. **CVWidget** - Viktigast
7. **JobSearchWidget** - Hög användning
8. **ApplicationsWidget** - Viktigt för uppföljning

### Sprint 4: Secondary Widgets (Dag 9-12)
9. **InterestWidget**
10. **CoverLetterWidget**
11. **CalendarWidget**

### Sprint 5: Polish (Dag 13-14)
12. Loading states
13. Felhantering
14. Responsiv test
15. Tillgänglighetsgranskning

---

## 🎯 Acceptanskriterier

### Generellt
- [ ] Widgeten laddar inom 1 sekund
- [ ] Widgeten visar loading-state
- [ ] Widgeten hanterar fel gracefully
- [ ] Widgeten är responsiv
- [ ] CTA-knappen är tydlig och klickbar

### Per widget
- [ ] **CV:** Visar korrekt % baserat på ifyllda fält
- [ ] **Jobbsökning:** Visar nya jobb-badge endast om nya sedan sist
- [ ] **Ansökningar:** Visar uppföljnings-påminnelse om försenad
- [ ] **Intresseguide:** Visar "ej gjord" om inget resultat finns

### Tillgänglighet
- [ ] Kontrast 4.5:1 för all text
- [ ] Tangentbordsnavigering fungerar
- [ ] Aria-labels på alla interaktiva element
- [ ] Reduced motion support
- [ ] Inga automatiska animationer

---

## 💬 Expertcitat

> *"10 widgets är för överväldigande för vår målgrupp. Rekommendation: Max 6 synliga widgets med möjlighet att anpassa."*  
> — UX Researcher

> *"Användaren vill se värdet INNAN de investerar sin tid."*  
> — Product Owner

> *"Centraliserad data-hämtning ger färre anrop och enkel hantering."*  
> — Fullstack-utvecklare

> *"Fasta korthöjder (280px) ger snygg alignment med CSS Grid."*  
> — UX-designer

---

## ✅ Nästa steg

1. **Skapa typer och interfaces**
2. **Bygg bas-komponenten DashboardWidget**
3. **Implementera useDashboardData hook**
4. **Bygg 6 core widgets**
5. **Testa tillgänglighet**
