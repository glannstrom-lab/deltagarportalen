# 🔧 Kod-förslag: Nya Tab-konfigurationer

**Konkreta implementationsexempel för de nya flikarna**

---

## 1. Wellness Tabs (5 flikar)

```typescript
// client/src/data/wellnessTabs.ts
import type { Tab } from '@/components/layout/PageTabs'
import {
  Heart,
  Zap,
  CalendarDays,
  Brain,
  Siren,
} from 'lucide-react'

export const wellnessTabs: Tab[] = [
  { 
    id: 'health', 
    label: 'Hälsa', 
    path: '/wellness', 
    icon: Heart,
    description: 'Välmående och hälsotips'
  },
  { 
    id: 'energy', 
    label: 'Energi', 
    path: '/wellness/energy', 
    icon: Zap,
    description: 'Spåra din energi och planera aktiviteter'
  },
  { 
    id: 'routines', 
    label: 'Rutiner', 
    path: '/wellness/routines', 
    icon: CalendarDays,
    description: 'Bygg hållbara dagliga rutiner'
  },
  { 
    id: 'cognitive', 
    label: 'Kognitiv träning', 
    path: '/wellness/cognitive', 
    icon: Brain,
    description: 'Träna minne och koncentration'
  },
  { 
    id: 'crisis', 
    label: 'Akut stöd', 
    path: '/wellness/crisis', 
    icon: Siren,
    description: 'Hjälp vid psykisk ohälsa',
    variant: 'danger' // Röd styling för akut
  },
]
```

---

## 2. Career Tabs (6 flikar)

```typescript
// client/src/data/careerTabs.ts
import type { Tab } from '@/components/layout/PageTabs'
import {
  Compass,
  Network,
  Accessibility,
  Building2,
  Target,
  BarChart3,
} from 'lucide-react'

export const careerTabs: Tab[] = [
  { 
    id: 'explore', 
    label: 'Utforska yrken', 
    path: '/career', 
    icon: Compass,
    description: 'Upptäck nya yrkesmöjligheter'
  },
  { 
    id: 'network', 
    label: 'Nätverk', 
    path: '/career/network', 
    icon: Network,
    description: 'Bygg och underhåll ditt nätverk',
    badge: 'Ny!' 
  },
  { 
    id: 'adaptation', 
    label: 'Anpassning', 
    path: '/career/adaptation', 
    icon: Accessibility,
    description: 'Arbetsanpassning och stöd',
    badge: 'Ny!'
  },
  { 
    id: 'companies', 
    label: 'Företag', 
    path: '/career/companies', 
    icon: Building2,
    description: 'Utforska arbetsgivare',
    badge: 'Ny!'
  },
  { 
    id: 'plan', 
    label: 'Karriärplan', 
    path: '/career-plan', 
    icon: Target,
    description: 'Skapa din karriärväg'
  },
  { 
    id: 'skills', 
    label: 'Kompetens', 
    path: '/skills-gap', 
    icon: BarChart3,
    description: 'Analysera och utveckla kompetenser'
  },
]
```

---

## 3. JobTracker Tabs (2 flikar)

```typescript
// client/src/data/jobTrackerTabs.ts
import type { Tab } from '@/components/layout/PageTabs'
import {
  List,
  LineChart,
} from 'lucide-react'

export const jobTrackerTabs: Tab[] = [
  { 
    id: 'applications', 
    label: 'Ansökningar', 
    path: '/job-tracker', 
    icon: List,
    description: 'Hantera dina jobbansökningar'
  },
  { 
    id: 'analytics', 
    label: 'Analys', 
    path: '/job-tracker/analytics', 
    icon: LineChart,
    description: 'Insikter om ditt jobbsökande',
    badge: 'Ny!'
  },
]
```

---

## 4. KnowledgeBase Tabs (8 flikar)

```typescript
// client/src/data/knowledgeTabs.ts
import type { Tab } from '@/components/layout/PageTabs'
import {
  Sparkles,
  Rocket,
  BookOpen,
  AlertCircle,
  Route,
  Wrench,
  Flame,
  Users,
} from 'lucide-react'

export const knowledgeTabs: Tab[] = [
  { 
    id: 'for-you', 
    label: 'För dig', 
    path: '/knowledge-base', 
    icon: Sparkles 
  },
  { 
    id: 'getting-started', 
    label: 'Komma igång', 
    path: '/knowledge-base?tab=getting-started', 
    icon: Rocket 
  },
  { 
    id: 'topics', 
    label: 'Ämnen', 
    path: '/knowledge-base?tab=topics', 
    icon: BookOpen 
  },
  { 
    id: 'quick-help', 
    label: 'Snabbhjälp', 
    path: '/knowledge-base?tab=quick-help', 
    icon: AlertCircle 
  },
  { 
    id: 'my-journey', 
    label: 'Min resa', 
    path: '/knowledge-base?tab=my-journey', 
    icon: Route 
  },
  { 
    id: 'tools', 
    label: 'Verktyg', 
    path: '/knowledge-base?tab=tools', 
    icon: Wrench 
  },
  { 
    id: 'trending', 
    label: 'Trendar', 
    path: '/knowledge-base?tab=trending', 
    icon: Flame 
  },
  { 
    id: 'stories', 
    label: 'Berättelser', 
    path: '/knowledge-base?tab=stories', 
    icon: Users,
    badge: 'Ny!'
  },
]
```

---

## 5. Dashboard Tabs (2 flikar)

```typescript
// client/src/data/dashboardTabs.ts
import type { Tab } from '@/components/layout/PageTabs'
import {
  LayoutDashboard,
  Trophy,
} from 'lucide-react'

export const dashboardTabs: Tab[] = [
  { 
    id: 'overview', 
    label: 'Översikt', 
    path: '/', 
    icon: LayoutDashboard,
    description: 'Din personliga översikt'
  },
  { 
    id: 'quests', 
    label: 'Mina Quests', 
    path: '/dashboard/quests', 
    icon: Trophy,
    description: 'Dagliga utmaningar och belöningar',
    badge: 'Ny!'
  },
]
```

---

## 🔄 Uppdaterad getTabsForPath-funktion

```typescript
// client/src/data/pageTabs.ts

// Lägg till imports
import { wellnessTabs } from './wellnessTabs'
import { jobTrackerTabs } from './jobTrackerTabs'
import { dashboardTabs } from './dashboardTabs'

// Uppdatera funktionen
export function getTabsForPath(path: string): Tab[] {
  if (path.startsWith('/cv')) return cvTabs
  if (path.startsWith('/cover-letter')) return coverLetterTabs
  if (path.startsWith('/career')) return careerTabs
  if (path.startsWith('/wellness')) return wellnessTabs
  if (path.startsWith('/job-tracker') || path.startsWith('/applications')) return jobTrackerTabs
  if (path.startsWith('/knowledge-base')) return knowledgeTabs
  if (path.startsWith('/resources')) return resourcesTabs
  if (path.startsWith('/profile') || path.startsWith('/settings')) return profileTabs
  if (path.startsWith('/dashboard')) return dashboardTabs
  return [] // Dashboard använder egen navigering
}
```

---

## 📁 Föreslagen Mappstruktur

```
client/src/
├── data/
│   ├── wellnessTabs.ts          # NY
│   ├── jobTrackerTabs.ts        # NY
│   ├── dashboardTabs.ts         # NY
│   ├── careerTabs.ts            # UPPDATERA
│   ├── knowledgeTabs.ts         # UPPDATERA
│   └── pageTabs.ts              # UPPDATERA
│
├── pages/
│   ├── wellness/
│   │   ├── WellnessPage.tsx     # Befintlig (wrapper)
│   │   ├── HealthTab.tsx        # Befintlig (rename)
│   │   ├── EnergyTab.tsx        # NY
│   │   ├── RoutinesTab.tsx      # NY
│   │   ├── CognitiveTab.tsx     # NY
│   │   └── CrisisTab.tsx        # NY
│   │
│   ├── career/
│   │   ├── CareerPage.tsx       # Wrapper
│   │   ├── ExploreTab.tsx       # Befintlig
│   │   ├── NetworkTab.tsx       # NY
│   │   ├── AdaptationTab.tsx    # NY
│   │   ├── CompaniesTab.tsx     # NY
│   │   ├── PlanTab.tsx          # Befintlig (CareerPlan)
│   │   └── SkillsTab.tsx        # Befintlig (SkillsGap)
│   │
│   ├── job-tracker/
│   │   ├── JobTrackerPage.tsx   # Wrapper
│   │   ├── ApplicationsTab.tsx  # Befintlig
│   │   └── AnalyticsTab.tsx     # NY
│   │
│   ├── knowledge-base/
│   │   ├── KnowledgeBasePage.tsx  # Wrapper
│   │   ├── ForYouTab.tsx          # Befintlig
│   │   ├── ...                    # Andra befintliga
│   │   └── StoriesTab.tsx         # NY
│   │
│   └── dashboard/
│       ├── DashboardPage.tsx    # Wrapper
│       ├── OverviewTab.tsx      # Befintlig (nuvarande Dashboard)
│       └── QuestsTab.tsx        # NY
│
└── components/
    └── wellness/                # NY mapp
        ├── EnergyTracker.tsx
        ├── RoutineBuilder.tsx
        ├── CrisisSupport.tsx
        └── CognitiveExercise.tsx
```

---

## 🎨 UI-förslag: Tab Bar med Badge

```tsx
// Förslag på uppdaterad Tab-komponent med badge-stöd

interface Tab {
  id: string
  label: string
  path: string
  icon: LucideIcon
  description?: string
  badge?: string
  variant?: 'default' | 'danger' | 'success'
}

// Exempel på rendering
<TabButton 
  icon={Zap}
  label="Energi"
  badge="Ny!"
  description="Spåra din energi"
/>

<TabButton 
  icon={Siren}
  label="Akut stöd"
  variant="danger"
  description="Hjälp vid kris"
/>
```

---

## ⚡ Snabbstart: Implementera Första Fliken

**Steg 1:** Skapa tab-konfiguration  
**Steg 2:** Uppdatera routing  
**Steg 3:** Skapa placeholder-komponent  
**Steg 4:** Iterera funktionalitet

### Exempel: Energi-fliken (Minimal Viable)

```tsx
// client/src/pages/wellness/EnergyTab.tsx
import { PageLayout } from '@/components/layout'

export default function EnergyTab() {
  return (
    <PageLayout
      title="Energi & Daglig Planering"
      description="Spåra din energi och få förslag på aktiviteter"
    >
      <div className="grid gap-6">
        {/* Energidagbok */}
        <EnergyLogCard />
        
        {/* Dagens förslag */}
        <ActivitySuggestions />
        
        {/* Veckovis översikt */}
        <WeeklyEnergyChart />
      </div>
    </PageLayout>
  )
}
```

---

*Dessa konfigurationer är redo att implementeras. Börja med Wellness-flikarna för högsta impact!*
