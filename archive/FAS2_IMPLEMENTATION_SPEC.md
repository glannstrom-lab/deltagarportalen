# Fas 2 Implementationsspecifikation
## Strukturella Integrationer - Unified Profil & Smarta Rekommendationer

**Version:** 1.0  
**Datum:** 2026-03-10  
**Status:** Påbörjad  
**Estimerad tid:** 4-6 veckor  
**Bygger på:** DOKUMENT_INTEGRATION_ANALYS.md

---

## 1. Översikt

### Mål
Fas 2 fokuserar på strukturella förbättringar som skapar en enhetlig upplevelse:
- **Unified Profil** - All data på ett ställe
- **CV-optimering** för specifika jobb
- **Smartare rekommendationer** baserat på intressen
- **Kontextuell kunskapsbank**

### Success Metrics
- 50% färre sidbyten per session (från 4.2 till 2.8)
- 70% kompletta CV:n (från 45%)
- Högre engagemang i intresseguide → jobbsök-flödet

---

## 2. Feature 1: Unified Profil-sida

### 2.1 Vision
En enda sida där all profilinformation samlas och återanvänds överallt.

### 2.2 UI/UX Design

```
┌─────────────────────────────────────────────────────────────────┐
│  MIN PROFIL                                    [Redigera]       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [FOTO]  Anna Svensson                                  │   │
│  │          anna@email.com • 070-123 45 67                │   │
│  │          Stockholm                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  TABS: [Profil] [Karriär] [Inställningar]                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  KÄRNPROFIL (används i CV, brev, ansökningar)          │   │
│  │  ─────────────────────────────────────────             │   │
│  │  Sammanfattning: [Redigera...]                         │   │
│  │  Kompetenser:    [JavaScript] [React] [+ Lägg till]    │   │
│  │  Språk:          Svenska (modersmål), Engelska (bra)   │   │
│  │                                                        │   │
│  │  ANVÄNDS I: ✅ CV  ✅ Personligt brev  ✅ Profiler    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  KARRIÄRPROFIL                                          │   │
│  │  ─────────────                                          │   │
│  │  Intresseguide: Social, Konventionell, Realistisk      │   │
│  │  Karriärmål:    Hitta jobb inom vården                 │   │
│  │  Föredragna roller: Sjuksköterska, Undersköterska      │   │
│  │                                                        │   │
│  │  [Se intresseguideresultat] [Uppdatera mål]            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Teknisk Specifikation

**A. UnifiedProfilePage.tsx (NY)**
```typescript
interface UnifiedProfileData {
  // Core profile (shared across modules)
  core: {
    firstName: string
    lastName: string
    email: string
    phone: string
    location: string
    summary: string
    profileImage?: string
  }
  
  // Professional info (from CV)
  professional: {
    skills: string[]
    languages: Array<{ language: string; level: string }>
    workExperience: WorkExperience[]
    education: Education[]
  }
  
  // Career profile (from interest guide + user input)
  career: {
    riasecScores?: RiasecResult
    topOccupations?: string[]
    careerGoals?: {
      shortTerm: string
      longTerm: string
    }
    preferredRoles: string[]
  }
  
  // Usage tracking
  usage: {
    cvLastUpdated?: string
    coverLettersCount: number
    applicationsCount: number
  }
}
```

**B. unifiedProfileApi.ts (NY)**
```typescript
export const unifiedProfileApi = {
  async getProfile(): Promise<UnifiedProfileData>
  async updateCore(data: Partial<CoreProfile>): Promise<void>
  async updateCareer(data: Partial<CareerProfile>): Promise<void>
  async syncFromCV(): Promise<void>  // Importera från CV
  async syncToCV(): Promise<void>    // Exportera till CV
}
```

---

## 3. Feature 2: CV-optimering för Specifikt Jobb

### 3.1 Vision
Analysera CV mot jobbannons och visa exakt vad som saknas för bättre matchning.

### 3.2 UI/UX Design (i CreateApplicationModal)

```
┌─────────────────────────────────────────────────────────────┐
│  📄 CV - OPTIMERING FÖR DETTA JOBB                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Din matchning: 68%                                         │
│  [████████████░░░░░░░░]                                     │
│                                                             │
│  🔍 SAKNADE KEYWORDS FRÅN ANNONSEN:                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • "React" - lägg till i dina kompetenser          │   │
│  │  • "Agil utveckling" - nämns inte i ditt CV        │   │
│  │  • "TypeScript" - lägg till om du har erfarenhet   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  💡 FÖRBÄTTRINGSTIPS:                                       │
│  • Din sammanfattning är för kort (rekommenderat: 3-4 rader)│
│  • Lägg till siffror i dina resultat (t.ex. "ökade försäljning│
│    med 25%")                                                │
│                                                             │
│  [Optimera CV nu] [Använd nuvarande CV]                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Teknisk Specifikation

**A. cvOptimizer.ts (NY)**
```typescript
interface CVOptimizationResult {
  matchScore: number
  missingKeywords: {
    word: string
    importance: 'high' | 'medium' | 'low'
    foundIn: 'skills' | 'experience' | 'summary' | 'missing'
  }[]
  suggestions: {
    type: 'keyword' | 'length' | 'format' | 'achievement'
    message: string
    action?: string
  }[]
}

export function analyzeCVForJob(
  cv: CVData, 
  jobDescription: string
): CVOptimizationResult
```

**B. Keyword-extraktion**
- Extrahera tekniska termer från jobbannons
- Matcha mot CV:s skills, experience, summary
- Prioritera baserat på frekvens och position i annons

---

## 4. Feature 3: Integration Interest → Jobbsök

### 4.1 Vision
Använd intresseguideresultat för att föreslå relevanta jobb automatiskt.

### 4.2 UI/UX Design

```
┌─────────────────────────────────────────────────────────────────┐
│  SÖK JOBB                                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🎯 JOBB MATCHADE FÖR DIG                               │   │
│  │  Baserat på dina intressen: Social, Konventionell       │   │
│  │                                                         │   │
│  │  12 nya jobb idag!                                      │   │
│  │  [Se matchade jobb] [Ändra intresseinställningar]       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Sökresultat för "sjuksköterska":                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Sjuksköterska - Södersjukhuset                         │   │
│  │  Stockholm • Heltid                                     │   │
│  │  ★ 94% match med dina intressen                         │   │
│  │  [Skapa ansökan]                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Teknisk Specifikation

**A. interestJobMatching.ts (NY)**
```typescript
interface JobInterestMatch {
  jobId: string
  overallMatch: number  // 0-100
  riasecMatch: {
    score: number
    matchedTypes: string[]
  }
  keywordMatch: {
    score: number
    matchedSkills: string[]
  }
}

export function matchJobsToInterests(
  jobs: PlatsbankenJob[],
  interestResult: InterestResult
): JobInterestMatch[]
```

**B. JobSearch-filter för intressen**
- Query-param: `?matched=true`
- Filtrera/sortera jobb baserat på matchningspoäng
- Visa matchningsprocent på varje jobbkort

---

## 5. Feature 4: Kontextuell Kunskapsbank

### 5.1 Vision
Visa rätt artikel vid rätt tillfälle, baserat på vad användaren gör.

### 5.2 UI/UX Design

```
# På CV-sidan:
┌─────────────────────────────────────────────────────────────┐
│  💡 TIPS FÖR CV                                             │
│  ─────────────                                              │
│  • Så skriver du en sammanfattning som fångar intresse     │
│  • ATS-optimering: 10 saker rekryterare letar efter        │
│  • Vanliga CV-misstag att undvika                          │
│  [Läs mer i kunskapsbanken]                                 │
└─────────────────────────────────────────────────────────────┘

# På Jobbtracker (när status = "intervju"):
┌─────────────────────────────────────────────────────────────┐
│  🎯 FÖRBEREDELSER INFÖR INTERVJU                           │
│  ───────────────────────────────                            │
│  • 15 vanliga intervjufrågor och hur du svarar             │
│  • Så förbereder du dig på en video-intervju               │
│  • Klädkod: Vad ska jag ha på mig?                         │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Teknisk Specifikation

**A. ContextualKnowledgeWidget.tsx (NY)**
```typescript
type ContextType = 
  | 'cv-building'
  | 'cover-letter-writing'
  | 'job-searching'
  | 'interview-prep'
  | 'rejection-handling'
  | 'salary-negotiation'

interface ContextualKnowledgeWidgetProps {
  context: ContextType
  maxArticles?: number
}
```

**B. Article-taggar**
Lägg till i articleData.ts:
```typescript
interface Article {
  // ... befintliga fält
  contexts?: ContextType[]  // Vilka sidor artikeln är relevant för
  keywords?: string[]       // För sökning
}
```

---

## 6. Implementationsteg

### Vecka 1-2: Unified Profil
- [ ] Dag 1-3: Skapa UnifiedProfilePage-komponenten
- [ ] Dag 4-5: unifiedProfileApi.ts service
- [ ] Dag 6-7: Integration med befintligt CV
- [ ] Dag 8-10: Profilbild och grundläggande info

### Vecka 3-4: CV-optimering
- [ ] Dag 1-3: cvOptimizer.ts med keyword-extraktion
- [ ] Dag 4-5: Uppdatera CreateApplicationModal med optimering
- [ ] Dag 6-8: UI för matchningsresultat
- [ ] Dag 9-10: Testing och finjustering

### Vecka 5-6: Interest → Jobb + Kunskapsbank
- [ ] Dag 1-3: interestJobMatching.ts
- [ ] Dag 4-5: JobSearch-filter för matcher
- [ ] Dag 6-7: ContextualKnowledgeWidget
- [ ] Dag 8-10: Artikel-taggar och integration

---

## 7. Databasändringar

### 7.1 Nya kolumner

```sql
-- unified_profile tabell (ny)
CREATE TABLE unified_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Core profile
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  location TEXT,
  summary TEXT,
  profile_image_url TEXT,
  
  -- Career profile
  career_goals JSONB DEFAULT '{}',
  preferred_roles TEXT[] DEFAULT '{}',
  
  -- Metadata
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Lägg till kontext-taggar i artiklar
ALTER TABLE articles ADD COLUMN contexts TEXT[] DEFAULT '{}';
ALTER TABLE articles ADD COLUMN keywords TEXT[] DEFAULT '{}';
```

---

## 8. Testplan

### Funktionella Tester

| Test | Förväntat resultat |
|------|-------------------|
| Öppna Unified Profil | All data visas från olika källor |
| Uppdatera profil | Ändringar syns i CV och brev |
| CV-optimering för jobb | Saknade keywords identifieras |
| Jobbsök med intressefilter | Matchade jobb visas först |
| Kunskapsbank-widget på CV-sidan | CV-relaterade artiklar visas |

---

**Godkänt för implementation:** ✅

Nästa steg: Börja med Unified Profil-sidan.
