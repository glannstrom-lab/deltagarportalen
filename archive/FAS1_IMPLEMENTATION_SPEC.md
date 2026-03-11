# Fas 1 Implementationsspecifikation
## Quick Wins - Integrationer för smidigare deltagarresa

**Version:** 1.0  
**Datum:** 2026-03-10  
**Status:** Klar för utveckling  
**Estimerad tid:** 3-4 veckor  
**Estimerad kostnad:** ~60 000 kr

---

## Innehållsförteckning

1. [Översikt](#1-översikt)
2. [Feature 1: "Skapa Ansökan"-flöde](#2-feature-1-skapa-ansökan-flöde)
3. [Feature 2: Dashboard "Nästa Steg"](#3-feature-2-dashboard-nästa-steg)
4. [Feature 3: Kontextuella Quick Actions](#4-feature-3-kontextuella-quick-actions)
5. [Teknisk Arkitektur](#5-teknisk-arkitektur)
6. [Databasändringar](#6-databasändringar)
7. [Implementationsteg](#7-implementationsteg)
8. [Testplan](#8-testplan)

---

## 1. Översikt

### Mål
Skapa omedelbart värde för deltagarna genom tre snabba integrationer som minskar friktionen i den vanligaste användarresan: från jobbhittat till inskickad ansökan.

### Success Metrics
- Minskad tid från jobbhittat till ansökan (mål: 70 min → 30 min)
- Färre sidbyten per ansökan (mål: 8+ → 3-4)
- Ökad användning av jobbtracker (mål: +50%)

---

## 2. Feature 1: "Skapa Ansökan"-flöde

### 2.1 User Story
> Som deltagare vill jag, när jag hittar ett intressant jobb, kunna starta ansökningsprocessen direkt från jobbkortet så att jag slipper kopiera information manuellt mellan olika sidor.

### 2.2 UI/UX Design

#### Jobbkort (förbättring)
```
┌─────────────────────────────────────────────────────┐
│  [LOGO]  Systemutvecklare till företag AB           │
│          Stockholm • Heltid                         │
│                                                     │
│  Vi söker en erfaren systemutvecklare...            │
│                                                     │
│  [❤️ Spara]  [👁️ Visa]  [✉️ Skapa ansökan]        │
└─────────────────────────────────────────────────────┘
```

#### "Skapa Ansökan" Modal (NY)
```
┌────────────────────────────────────────────────────────────┐
│  Skapa ansökan för: Systemutvecklare till företag AB    [X]│
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  1️⃣  Förbered CV                                    │   │
│  │      [Optimera CV för detta jobb]                   │   │
│  │      Din matchning: 85%                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  2️⃣  Skriv personligt brev                          │   │
│  │      [Skriv brev med AI-hjälp]                      │   │
│  │      ✓ Jobbinfo förifylld                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  3️⃣  Lägg till i jobbtracker                        │   │
│  │      Status: [📝 Ansökt ▼]                          │   │
│  │      Anteckningar: [________________]               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│        [Avbryt]              [Spara & Skicka ansökan]       │
└────────────────────────────────────────────────────────────┘
```

### 2.3 Teknisk Specifikation

#### Komponenter att skapa/modifiera

**A. JobSearch.tsx (modifiera)**
```typescript
// Lägg till på varje jobbkort
<JobActionMenu 
  job={jobData}
  onCreateApplication={() => openApplicationModal(jobData)}
/>
```

**B. CreateApplicationModal.tsx (NY komponent)**
```typescript
interface CreateApplicationModalProps {
  jobData: JobData
  isOpen: boolean
  onClose: () => void
}

interface ApplicationWorkflow {
  step1_cv: {
    optimize: boolean
    matchScore?: number
  }
  step2_letter: {
    generateAI: boolean
    content?: string
  }
  step3_tracker: {
    status: 'SAVED' | 'APPLIED' | 'INTERVIEW'
    notes: string
  }
}
```

**C. API-endpoint (NY)**
```typescript
// POST /api/applications/create-from-job
{
  jobId: string,
  jobData: {
    headline: string,
    employer: string,
    description: string,
    url: string
  },
  workflow: ApplicationWorkflow
}

// Response
{
  success: true,
  data: {
    trackerEntryId: string,
    coverLetterId?: string,
    message: "Ansökan skapad och sparad"
  }
}
```

### 2.4 Dataflöde

```
Användare klickar "Skapa ansökan"
         │
         ▼
┌──────────────────────┐
│  1. Hämta CV-data    │
│  2. Analysera match  │
│  3. Förifyll formulär│
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Modal visas med:    │
│  - CV-matching       │
│  - PB-alternativ     │
│  - Tracker-formulär  │
└──────────┬───────────┘
           │
           ▼
Användare klickar "Spara"
           │
           ▼
┌──────────────────────┐
│  Samtidiga sparningar:│
│  - Jobbtracker        │
│  - Personligt brev    │
│  - (Valfritt) Status  │
└───────────────────────┘
```

---

## 3. Feature 2: Dashboard "Nästa Steg"

### 3.1 User Story
> Som deltagare vill jag se tydliga rekommendationer på dashboard om vad jag bör göra härnäst, baserat på min nuvarande status och tidigare aktivitet.

### 3.2 UI/UX Design

#### Dashboard Widget (NY - toppen av sidan)
```
┌─────────────────────────────────────────────────────────────────┐
│  👋 Hej Anna! Här är ditt nästa steg:                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  🎯 Du har 3 sparade jobb men har inte skrivit några     │   │
│  │     personliga brev ännu.                                │   │
│  │                                                          │   │
│  │     [Skriv personligt brev till Systemutvecklare AB]     │   │
│  │     [Se alla sparade jobb]                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Eller välj en annan aktivitet:                                 │
│  [🔍 Sök nya jobb]  [📄 Uppdatera CV]  [📊 Se statistik]        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Alternativa tillstånd för "Nästa Steg"

**Scenario A: Ny användare (inget CV)**
```
🎯 Varmt välkommen! Låt oss komma igång:
   [Skapa ditt första CV] - Det tar bara 5 minuter
```

**Scenario B: CV finns, inga sparade jobb**
```
🎯 Bra jobbat med CV:t! Nu är det dags att hitta jobb:
   [Sök jobb matchade för dig] - 12 nya annonser idag
```

**Scenario C: Sparade jobb, inga ansökningar**
```
🎯 Du har 5 sparade jobb. Skicka din första ansökan:
   [Skapa ansökan för Systemutvecklare AB]
```

**Scenario D: Aktiv jobbsökare**
```
🎯 Du är på rätt väg! 3 ansökningar denna vecka.
   [Fortsätt söka jobb]  [Skriv i dagboken]
```

### 3.3 Logik för nästa steg

```typescript
function getNextStep(userData: UserData): NextStep {
  const { hasCV, savedJobs, applications, lastActivity } = userData
  
  // Prioriteringsordning
  if (!hasCV) {
    return {
      type: 'CREATE_CV',
      message: 'Varmt välkommen! Låt oss komma igång',
      action: { label: 'Skapa ditt första CV', link: '/dashboard/cv' }
    }
  }
  
  if (savedJobs.length === 0) {
    return {
      type: 'SEARCH_JOBS',
      message: 'Bra jobbat med CV:t! Nu är det dags att hitta jobb',
      action: { label: 'Sök jobb', link: '/dashboard/job-search' }
    }
  }
  
  const jobsWithoutApplication = savedJobs.filter(j => j.status === 'SAVED')
  if (jobsWithoutApplication.length > 0) {
    return {
      type: 'CREATE_APPLICATION',
      message: `Du har ${jobsWithoutApplication.length} sparade jobb utan ansökan`,
      action: { 
        label: `Skapa ansökan för ${jobsWithoutApplication[0].title}`,
        link: `/dashboard/job-search?createApplication=${jobsWithoutApplication[0].id}`
      },
      secondaryAction: {
        label: 'Se alla sparade jobb',
        link: '/dashboard/job-tracker'
      }
    }
  }
  
  // Default - aktiv sökare
  return {
    type: 'CONTINUE_SEARCH',
    message: 'Du är på rätt väg! Fortsätt momentumet.',
    action: { label: 'Sök fler jobb', link: '/dashboard/job-search' }
  }
}
```

### 3.4 Komponenter

**A. NextStepWidget.tsx (NY)**
```typescript
interface NextStep {
  type: 'CREATE_CV' | 'SEARCH_JOBS' | 'CREATE_APPLICATION' | 'CONTINUE_SEARCH'
  message: string
  action: { label: string; link: string }
  secondaryAction?: { label: string; link: string }
}

export function NextStepWidget() {
  const userData = useUserData()
  const nextStep = getNextStep(userData)
  
  return (
    <div className="next-step-widget">
      <h2>Hej {userData.firstName}! Här är ditt nästa steg:</h2>
      <p>{nextStep.message}</p>
      <Button to={nextStep.action.link}>
        {nextStep.action.label}
      </Button>
      {nextStep.secondaryAction && (
        <Button variant="secondary" to={nextStep.secondaryAction.link}>
          {nextStep.secondaryAction.label}
        </Button>
      )}
    </div>
  )
}
```

---

## 4. Feature 3: Kontextuella Quick Actions

### 4.1 Beskrivning
Lägg till kontextberoende snabbåtgärder på relevanta ställen som förenklar vanliga arbetsflöden.

### 4.2 Implementationer

#### A. I CV-byggaren: "Sök jobb med detta CV"
```typescript
// Lägg till i CVBuilder.tsx, efter att CV sparats
<QuickActionBanner>
  <span>🎉 CV:t är sparat!</span>
  <Button to="/dashboard/job-search?cvReady=true">
    Sök jobb med detta CV
  </Button>
</QuickActionBanner>
```

#### B. I Jobbtracker: "Skapa personligt brev"
```typescript
// I JobTracker.tsx, för varje jobb
<ActionDropdown>
  <Item onClick={() => navigate(`/dashboard/cover-letter?jobId=${job.id}`)}>
    ✉️ Skriv personligt brev
  </Item>
  <Item onClick={() => navigate(`/dashboard/cv?optimizeFor=${job.id}`)}>
    📄 Optimera CV
  </Item>
</ActionDropdown>
```

#### C. I Kunskapsbanken: "Tillbaka till senaste aktivitet"
```typescript
// Lägg till flytande knapp när användaren läst en artikel
<FloatingActionButton 
  label="Tillbaka till jobbsökning"
  onClick={() => navigate('/dashboard/job-search')}
/>
```

#### D. Global "Snabbkommandon" (valfritt)
```typescript
// Ctrl+K eller Cmd+K för att öppna command palette
<CommandPalette 
  options={[
    { label: 'Sök jobb', action: () => navigate('/dashboard/job-search') },
    { label: 'Visa sparade jobb', action: () => navigate('/dashboard/job-tracker') },
    { label: 'Redigera CV', action: () => navigate('/dashboard/cv') },
    { label: 'Skriv personligt brev', action: () => navigate('/dashboard/cover-letter') },
  ]}
/>
```

---

## 5. Teknisk Arkitektur

### 5.1 Nya filer

```
client/src/
├── components/
│   └── workflow/
│       ├── CreateApplicationModal.tsx    # NY
│       ├── ApplicationStepper.tsx        # NY
│       ├── NextStepWidget.tsx            # NY
│       └── QuickActionBanner.tsx         # NY
├── hooks/
│   └── useNextStep.ts                    # NY
├── services/
│   └── workflowApi.ts                    # NY
└── lib/
    └── workflowLogic.ts                  # NY
```

### 5.2 Modifierade filer

```
client/src/
├── pages/
│   ├── JobSearch.tsx                     # + action menu
│   ├── Dashboard.tsx                     # + next step widget
│   ├── CVBuilder.tsx                     # + quick actions
│   └── JobTracker.tsx                    # + quick actions
└── components/
    └── job-search/
        └── JobCard.tsx                   # + skapa ansökan-knapp
```

---

## 6. Databasändringar

### 6.1 Nya tabeller (om nödvändigt)

Inga nya tabeller krävs, men vi lägger till kolumner:

```sql
-- Lägg till i saved_jobs för att spara ansökningsworkflow
ALTER TABLE saved_jobs ADD COLUMN application_workflow JSONB;

-- Exempel på data:
-- {
--   "cvOptimized": true,
--   "coverLetterId": "uuid",
--   "applicationDate": "2026-03-10",
--   "notes": "Skickade med referens"
-- }
```

### 6.2 Edge Functions (om nödvändigt)

```typescript
// supabase/functions/create-application/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { jobData, workflow } = await req.json()
  
  // 1. Skapa tracker entry
  const trackerEntry = await createTrackerEntry(jobData, workflow.step3_tracker)
  
  // 2. Skapa personligt brev om valt
  let coverLetterId = null
  if (workflow.step2_letter.generateAI) {
    coverLetterId = await generateCoverLetter(jobData, workflow.step2_letter)
  }
  
  // 3. Uppdatera tracker med brev-referens
  if (coverLetterId) {
    await linkCoverLetterToTracker(trackerEntry.id, coverLetterId)
  }
  
  return new Response(JSON.stringify({ 
    success: true, 
    data: { trackerEntryId: trackerEntry.id, coverLetterId }
  }))
})
```

---

## 7. Implementationsteg

### Vecka 1: Grundstruktur och "Skapa Ansökan"
- [ ] Dag 1-2: Skapa CreateApplicationModal-komponenten
- [ ] Dag 3-4: Integrera med JobSearch (lägg till knappar)
- [ ] Dag 5: Implementera API för att skapa ansökan

### Vecka 2: Dashboard "Nästa Steg"
- [ ] Dag 1-2: Skapa useNextStep-hook och logik
- [ ] Dag 3-4: Bygg NextStepWidget-komponenten
- [ ] Dag 5: Integrera i Dashboard + testning

### Vecka 3: Quick Actions och Polish
- [ ] Dag 1-2: Lägg till QuickActionBanner på relevanta ställen
- [ ] Dag 3-4: Förbättra JobTracker med actions
- [ ] Dag 5: UI/UX-polish och responsivitet

### Vecka 4: Testning och Deploy
- [ ] Dag 1-2: Enhetstester
- [ ] Dag 3: Användartestning med 3-5 deltagare
- [ ] Dag 4: Buggfixar och optimering
- [ ] Dag 5: Deploy till produktion

---

## 8. Testplan

### 8.1 Funktionella Tester

| Test | Förväntat resultat |
|------|-------------------|
| Klicka "Skapa ansökan" på jobbkort | Modal öppnas med förifylld jobbdata |
| Välj "Optimera CV" | CV visas med matchningspoäng |
| Välj "Skriv brev med AI" | Brev genereras med jobbinfo |
| Klicka "Spara & Skicka" | Tracker uppdateras, brev sparas |
| Ny användare loggar in | Dashboard visar "Skapa CV" |
| Användare med CV men inga jobb | Dashboard visar "Sök jobb" |
| Användare med sparade jobb | Dashboard visar "Skapa ansökan" |

### 8.2 Användartestning

**Testscenario:** "Din första ansökan"
1. Hitta ett jobb i jobbsökningen
2. Klicka "Skapa ansökan"
3. Följ flödet till completion
4. Verifiera att allt sparats korrekt

**Success criteria:**
- Användaren klarar flödet utan att behöva navigera till andra sidor
- Tid från start till mål: < 5 minuter
- Användaren upplever flödet som "sömlöst" (5/5 i betyg)

---

## Appendix A: API-kontrakt

### POST /api/workflow/create-application

**Request:**
```json
{
  "jobData": {
    "jobId": "af12345",
    "headline": "Systemutvecklare",
    "employer": "Företag AB",
    "description": "Vi söker...",
    "url": "https://arbetsformedlingen.se/..."
  },
  "workflow": {
    "step1_cv": {
      "optimize": true
    },
    "step2_letter": {
      "generateAI": true,
      "tone": "professional"
    },
    "step3_tracker": {
      "status": "APPLIED",
      "notes": "Skickade via mejl"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "trackerEntryId": "550e8400-e29b-41d4-a716-446655440000",
    "coverLetterId": "550e8400-e29b-41d4-a716-446655440001",
    "cvMatchScore": 85,
    "message": "Ansökan skapad och sparad"
  }
}
```

---

**Godkänt för implementation:** ✅

Nästa steg: Utvecklingsteamet börjar med Vecka 1 uppgifter.
