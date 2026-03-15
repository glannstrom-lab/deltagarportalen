# Åtgärdsplan: Översiktssidan (Dashboard)

**Baserad på:** Teamgranskning 2026-03-15  
**Prioritet:** Kritiska fel (P0) måste åtgärdas innan produktion  
**Tidsram:** 2-3 sprintar

---

## Sprint 1: Kritiska fixar (P0)

### Vecka 1-2

#### 🔴 Task 1.1: Fixa tillgänglighetsfel
**Betydelse:** Krav för WCAG 2.1 AA  
**Tidsåtgång:** 2-3 dagar  
**Ansvarig:** Frontend-utvecklare

```typescript
// TODO: Öka textstorlekar
// Fil: Alla widget-filer
// Ändra: text-[9px] → text-xs (minst 12px)
// Ändra: text-[10px] → text-xs

// TODO: Fixa kontrast i välkomstsektion
// Fil: OverviewTab.tsx
// Nu: text-violet-100
// Bör: text-white font-medium drop-shadow-sm

// TODO: Lägg till aria-labels
// Fil: Alla interaktiva element
<button aria-label="Ta bort CV widget">×</button>
```

**Acceptanskriterier:**
- [ ] All text minst 12px
- [ ] Kontrast minst 4.5:1 på allt innehåll
- [ ] Alla knappar har aria-label
- [ ] Testat med skärmläsare (NVDA/VoiceOver)

---

#### 🔴 Task 1.2: Fixa widget-props
**Betydelse:** Widgets visar inte korrekt data  
**Tidsåtgång:** 2 dagar  
**Ansvarig:** Frontend-utvecklare

```typescript
// TODO: Uppdatera getWidgetProps() i OverviewTab.tsx
// Lägg till saknade props:

// ExercisesWidget behöver:
totalExercises: data?.exercises?.totalExercises || 38,
completionRate: data?.exercises?.completionRate || 0,

// KnowledgeWidget behöver:
savedCount: data?.knowledge?.savedCount || 0,
totalArticles: data?.knowledge?.totalArticles || 0,

// InterestWidget behöver:
topRecommendations: data?.interest?.topRecommendations || [],
answeredQuestions: data?.interest?.answeredQuestions || 0,
```

**Acceptanskriterier:**
- [ ] Alla widgets får korrekta props
- [ ] Inga TypeScript-errors
- [ ] Widgets visar faktisk data från API

---

#### 🔴 Task 1.3: Strikt typing - ta bort `any`
**Betydelse:** Kodkvalitet och type-safety  
**Tidsåtgång:** 1-2 dagar  
**Ansvarig:** Frontend-utvecklare

```typescript
// TODO: Skapa typer för API-respons
// Fil: src/types/dashboard.ts

interface SavedJob {
  job_id: string
  job_data: {
    headline?: string
    employer?: { name?: string }
    workplace_address?: { municipality?: string }
    application_deadline?: string
  }
}

// TODO: Uppdatera useDashboardData.ts
// Ändra: (savedJob: any) → (savedJob: SavedJob)
// Ändra: calculateCVProgress(cv: any) → calculateCVProgress(cv: CVData)
```

**Acceptanskriterier:**
- [ ] Inga `any`-typer i dashboard-relaterade filer
- [ ] Alla funktioner har return-typer
- [ ] `strict: true` i tsconfig ger inga fel

---

#### 🔴 Task 1.4: Gör Intresseguide till standard-widget
**Betydelse:** Strategiskt viktigt för användarresan  
**Tidsåtgång:** 0.5 dag  
**Ansvarig:** Frontend-utvecklare

```typescript
// TODO: Ändra i OverviewTab.tsx rad 73
const [activeWidgets, setActiveWidgets] = useState<WidgetId[]>([
  'cv', 
  'interests',  // Lägg till denna
  'jobSearch', 
  'wellness', 
  'quests'
])
```

**Acceptanskriterier:**
- [ ] Intresseguide visas som standard för nya användare
- [ ] Widgeten laddas korrekt
- [ ] Alla tester passerar

---

## Sprint 2: Integrationer & Förbättringar (P1)

### Vecka 3-4

#### 🟡 Task 2.1: Migrera till React Query
**Betydelse:** Bättre caching och prestanda  
**Tidsåtgång:** 3 dagar  
**Ansvarig:** Frontend-utvecklare

```typescript
// TODO: Byt i OverviewTab.tsx
// Nu: const { data, loading } = useDashboardData()
// Bör: const { data, isLoading } = useDashboardDataQuery()

// TODO: Uppdatera loading-state
// {isLoading ? (...) : (...)}

// TODO: Uppdatera NextStepWidget och RemindersWidget
// Ta bort interna useDashboardData() anrop
// Använd props istället
```

**Acceptanskriterier:**
- [ ] React Query används istället för legacy hook
- [ ] Data cachas mellan renders
- [ ] Stale-while-revalidate fungerar
- [ ] Ingen dubbel data-hämtning

---

#### 🟡 Task 2.2: Lägg till useClickOutside för widget-menyn
**Betydelse:** Bättre UX  
**Tidsåtgång:** 0.5 dag  
**Ansvarig:** Frontend-utvecklare

```typescript
// TODO: Skapa hook
// Fil: src/hooks/useClickOutside.ts

export function useClickOutside(ref: RefObject<HTMLElement>, handler: () => void) {
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return
      handler()
    }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [ref, handler])
}

// TODO: Använd i OverviewTab
const menuRef = useRef<HTMLDivElement>(null)
useClickOutside(menuRef, () => setShowWidgetMenu(false))
```

**Acceptanskriterier:**
- [ ] Menyn stängs vid klick utanför
- [ ] Fungerar på både desktop och mobil
- [ ] Inga memory leaks

---

#### 🟡 Task 2.3: Gruppera widgets i sektioner
**Betydelse:** Bättre informationsarkitektur  
**Tidsåtgång:** 2 dagar  
**Ansvarig:** UX-designer + Frontend

```typescript
// TODO: Dela upp widgets i grupper
// Fil: OverviewTab.tsx

<section>
  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
    Din profil
  </h2>
  <div className="grid...">
    {profileWidgets.map(renderWidget)}
  </div>
</section>

<section>
  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
    Daglig aktivitet
  </h2>
  <div className="grid...">
    {activityWidgets.map(renderWidget)}
  </div>
</section>
```

**Acceptanskriterier:**
- [ ] Widgets grupperade logiskt
- [ ] Tydliga rubriker för varje grupp
- [ ] Responsivitet bevarad

---

#### 🟡 Task 2.4: Gör "ta bort" alltid synlig på touch
**Betydelse:** Tillgänglighet på mobil  
**Tidsåtgång:** 0.5 dag  
**Ansvarig:** Frontend-utvecklare

```typescript
// TODO: Uppdatera WidgetWrapper
<button 
  onClick={onRemove}
  className={cn(
    "absolute -top-2 -right-2 z-10 w-7 h-7",
    "md:opacity-0 md:group-hover:opacity-100",
    "opacity-100", // Alltid synlig på mobil
    "..."
  )}
>
```

**Acceptanskriterier:**
- [ ] Knappen synlig på touch-enheter
- [ ] Större touch-mål (44px)
- [ ] Fungerar på iOS och Android

---

## Sprint 3: Roadmap-förbättringar (P2)

### Vecka 5-6

#### 🟢 Task 3.1: Skapa "Kom igång"-guide
**Betydelse:** Bättre onboarding för nya användare  
**Tidsåtgång:** 3 dagar  
**Ansvarig:** UX-designer + Frontend

```typescript
// TODO: Skapa komponent
// Fil: src/components/dashboard/GettingStartedGuide.tsx

export function GettingStartedGuide({ userData }) {
  if (userData.cv?.hasCV && userData.interest?.hasResult) return null
  
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200">
      <h2>Välkommen! Låt oss komma igång 🚀</h2>
      {/* Steg-för-steg guide */}
    </div>
  )
}
```

**Acceptanskriterier:**
- [ ] Guide visas för nya användare
- [ ] Tydliga steg med progress
- [ ] Försvinner när grundläggande info är ifylld

---

#### 🟢 Task 3.2: Standardisera widget-komponenter
**Betydelse:** Konsistent design, lättare underhåll  
**Tidsåtgång:** 4-5 dagar  
**Ansvarig:** Frontend-utvecklare

```typescript
// TODO: Skapa unified widget-komponent
// Fil: src/components/dashboard/UnifiedWidget.tsx

interface UnifiedWidgetProps {
  id: string
  title: string
  icon: LucideIcon
  color: 'violet' | 'blue' | 'rose' | 'amber' | 'teal'
  status: 'empty' | 'in-progress' | 'complete'
  progress?: number
  to: string
  children: React.ReactNode
}

// Alla widgets bör använda denna bas-komponent
```

**Acceptanskriterier:**
- [ ] Alla widgets använder samma bas-struktur
- [ ] Konsistent padding, typography, färger
- [ ] Lätt att lägga till nya widgets

---

#### 🟢 Task 3.3: Dark mode
**Betydelse:** Modern funktion, användarpreferens  
**Tidsåtgång:** 2-3 dagar  
**Ansvarig:** Frontend-utvecklare

```typescript
// TODO: Lägg till dark mode-klasser
// Exempel:
<div className="bg-white dark:bg-slate-800 rounded-2xl...">
  <h3 className="text-slate-800 dark:text-slate-100...">
```

**Acceptanskriterier:**
- [ ] Dark mode fungerar på hela dashboarden
- [ ] Toggle-knapp i inställningar
- [ ] Sparas i localStorage

---

## 🔮 Framtida förbättringar (Ej planerade än)

### Konsulent-dashboard (B2B)
**Prioritet:** Hög (affärskritiskt)  
**Tidsåtgång:** 2-3 veckor  
**Beskrivning:** Separat vy för arbetskonsulenter att se alla sina deltagare

### Platsbanken-integration
**Prioritet:** Medel  
**Tidsåtgång:** 2 veckor  
**Beskrivning:** Hämta jobb direkt från Arbetsförmedlingen

### RIASEC-smart jobbmatchning
**Prioritet:** Medel  
**Tidsåtgång:** 1-2 veckor  
**Beskrivning:** Koppla intresseguide-resultat till jobbförslag

---

## 📈 Mätpunkter (KPI:er)

För att mäta framgång med förbättringarna:

| KPI | Baslinje | Mål (3 mån) | Hur mäta |
|-----|----------|-------------|----------|
| Dashboard retention | - | +25% | Analytics-event "dashboard_view" |
| Widget-interaktion | - | 80% interagerar med ≥2 widgets | Klick-tracking per widget |
| Tillgänglighetsscore | - | 95+ Lighthouse | Lighthouse CI |
| Laddtid | - | <2s | Web Vitals |

---

## 🎯 Definition of Done (för alla tasks)

- [ ] Kod review godkänd av minst 1 person
- [ ] Alla tester passerar (`npm test`)
- [ ] Bygget fungerar (`npm run build`)
- [ ] Inga TypeScript-errors
- [ ] Testat i Chrome, Firefox, Safari
- [ ] Testat på mobil (iOS + Android)
- [ ] Tillgänglighetstestat (axe-core eller Lighthouse)
- [ ] Dokumentation uppdaterad (om nödvändigt)

---

## 👥 Ansvarsfördelning

| Roll | Ansvar |
|------|--------|
| **Frontend-utvecklare** | Implementation av alla tekniska tasks |
| **UX-designer** | Design av nya komponenter, granskning |
| **QA/Testare** | Testa alla ändringar, skriva testfall |
| **Product Manager** | Prioritering, beslut vid osäkerhet |
| **Copywriter** | Textgranskning, micro-copy |

---

## 📅 Tidslinje

```
Vecka 1-2:  Sprint 1 (P0 - Kritiska fixar)
Vecka 3-4:  Sprint 2 (P1 - Integrationer)
Vecka 5-6:  Sprint 3 (P2 - Förbättringar)
Vecka 7+:   Framtida förbättringar
```

---

**Nästa steg:** Fördela tasks till teammedlemmar och starta Sprint 1!
