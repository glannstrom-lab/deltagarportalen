# Fas 3 Implementationsspecifikation
## Avancerade Integrationer & AI-drivna Funktioner

**Version:** 1.0  
**Datum:** 2026-03-10  
**Status:** Påbörjad  
**Estimerad tid:** 6-8 veckor  
**Bygger på:** Fas 1 & 2

---

## 1. Översikt

### Vision
Transformera Deltagarportalen från en verktygslåda till en intelligent karriärguide som:
- Förutser användarens behov
- Ger personliga rekommendationer
- Automatiserar repetitiva uppgifter
- Skapar en enhetlig, sömlös upplevelse

### Success Metrics
- **80%** färre manuella steg per ansökan
- **60%** av användarna följer AI-rekommendationer
- **40%** ökning av återkommande användare
- Användare upplever portalen som "en guide, inte bara verktyg"

---

## 2. Feature 1: AI-driven Nästa-Steg Assistant

### 2.1 Beskrivning
En intelligent assistant som analyserar ALL data och ger skräddarsydda, konkreta nästa steg - inte bara generiska förslag.

### 2.2 AI-Analysmodell

```typescript
interface AIRecommendation {
  id: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  type: 'action' | 'insight' | 'reminder'
  title: string
  description: string
  reasoning: string  // Varför rekommenderas detta?
  action: {
    label: string
    link: string
    autoComplete?: boolean  // Kan göras automatiskt?
  }
  expectedOutcome: string
  deadline?: Date  // När bör detta göras?
  confidence: number  // 0-100, hur säker är AI:n?
}

// Analysera all data för att ge rekommendationer
function generateAIRecommendations(
  cv: CVData,
  applications: Application[],
  interestResult: InterestResult,
  diaryEntries: DiaryEntry[],
  activity: UserActivity[],
  savedJobs: SavedJob[]
): AIRecommendation[]
```

### 2.3 Exempel på AI-rekommendationer

```
🎯 CRITICAL: "Du har 3 sparade jobb som matchar ditt CV till 80%+ 
   men inte ansökt på 5+ dagar. Risk att annonserna stänger."
   → [Skapa ansökningar nu] [Sätt påminnelse]

💡 INSIGHT: "Din ansökningstakt har sjunkit 50% denna vecka. 
   Du verkar fastna i perfektionism." 
   → [Läs: Så undviker du perfektionism] [Boka möte med konsulent]

⏰ REMINDER: "Du har intervju med Telia imorgon kl 14:00. 
   Vill du förbereda dig?"
   → [Öppna intervjuguide] [Se företagsinfo]

🚀 ACTION: "Baserat på dina intressen - testa att söka 
   'UX-designer'. 12 nya jobb idag, din matchning: 85%."
   → [Se UX-designer jobb] [Uppdatera karriärmål]
```

### 2.4 UI/UX Design

```
┌─────────────────────────────────────────────────────────────────┐
│  🤖 DIN ASSISTENT                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🎯 PRIORITET (Gör detta idag)                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Du har 3 jobb med hög matchning som snart stänger      │   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │
│  │  Systemutvecklare - Spotify (89% match)                │   │
│  │  [Skapa ansökan] [Spara till imorgon] [Inte intresserad]│   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  Frontend-utvecklare - Klarna (82% match)              │   │
│  │  [Skapa ansökan] [Spara till imorgon] [Inte intresserad]│   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  💡 INSIGHTS (Baserat på din aktivitet)                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Din bästa ansökningstid är tisdag-fredag förmiddag     │   │
│  │  Just nu: Onsdag 10:30 - perfekt tid att söka!          │   │
│  │                                    [Sök jobb nu]        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  📅 KOMMANDE                                                    │
│  • Imorgon: Intervju med Telia kl 14:00                        │
│  • Fredag: Påminnelse - följ upp IKEA-ansökan                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Feature 2: Prediktiv Jobbmatchning med Embeddings

### 3.1 Beskrivning
Använd AI/ML (embeddings) för att matcha jobb på semantisk nivå - inte bara keywords.

### 3.2 Teknisk implementation

```typescript
// Generera embeddings för CV
interface CVEmbedding {
  userId: string
  embedding: number[]  // Vector representation
  generatedAt: string
}

// Generera embeddings för jobb
interface JobEmbedding {
  jobId: string
  headline: string
  description: string
  embedding: number[]
  occupationField: string
}

// Semantisk matchning
function calculateSemanticSimilarity(
  cvEmbedding: number[],
  jobEmbedding: number[]
): number  // 0-100

// Hitta jobb som är "nära" men inte exakta matchningar
function findSimilarJobs(
  targetJob: JobEmbedding,
  allJobs: JobEmbedding[],
  threshold: number = 0.7
): JobEmbedding[]
```

### 3.3 Features

1. **Semantisk matchning**
   - "React-utvecklare" matchar "Frontend-utvecklare med React"
   - "Sjuksköterska" matchar "Undersköterska med påbyggnad"

2. **Utforska närliggande roller**
   - "Gillade du Systemutvecklare? Testa DevOps!"
   - "Dina skills passar även för: Tech lead, Scrum master"

3. **Förutse framtida matchningar**
   - "Om du lär dig TypeScript (2 veckor) → 15 nya jobb"

### 3.4 UI

```
┌─────────────────────────────────────────────────────────────────┐
│  🔮 SMARTA MATCHNINGAR                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Baserat på din profil hittade vi jobb du kanske missat:       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🎯 DevOps-ingenjör - Volvo (92% semantisk match)       │   │
│  │     "Din backend-bakgrund + intresse för drift matchar" │   │
│  │     [Se jobb] [Varför matchar detta?]                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  💡 Tech Lead - TietoEVRY (78% match)                   │   │
│  │     "Nästa steg i karriären? Du har ledaregenskaper"    │   │
│  │     [Se jobb] [Läs om karriärväg]                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  🔮 MED DENNA KOMPETENS SKULLE DU MATCHA FLER JOBB:            │
│  • TypeScript → +15 jobb  [Lär dig nu]                         │
│  • AWS → +8 jobb  [Lär dig nu]                                 │
│  • Agil certifiering → +12 jobb  [Lär dig nu]                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Feature 3: Sammanslagen "Min Resa"-modul

### 4.1 Vision
Slå samman Dagbok, Jobbtracker, och Aktiviteter till en enhetlig tidslinje.

### 4.2 UI/UX Design

```
┌─────────────────────────────────────────────────────────────────┐
│  📖 MIN RESA                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Allt] [Ansökningar] [Intervjuer] [Dagbok] [Övningar]         │
│                                                                 │
│  📅 IDAG - Onsdag 10 mars                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📝 Dagbok                                              │   │
│  │  "Kändes bra att skicka ansökan till Spotify idag.     │   │
│  │   Fick positiv feedback från konsulenten."             │   │
│  │  😊 Humör: Positiv  •  Energinivå: 7/10                │   │
│  │                                    [Redigera]          │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  ✉️  Skickat ansökan - Spotify (auto)                   │   │
│  │  Status: Ansökt  •  Matchning: 89%                     │   │
│  │  [Se ansökan] [Följ upp om 1 vecka]                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  📅 IGÅR - Tisdag 9 mars                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  💪  Genomförde övning: "Nätverkande på LinkedIn"       │   │
│  │  Tid: 15 min  •  Resultat: 3 nya kontakter             │   │
│  │                                    [Se detaljer]        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  📅 FÖRRA VECKAN                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🗣️  Intervju - Telia                                   │   │
│  │  Resultat: Väntar på svar  •  Upplevelse: Positiv      │   │
│  │  Anteckningar: "Bra stämning, tekniska frågor..."      │   │
│  │                                    [Se intervjuanteckningar]│
│  ├─────────────────────────────────────────────────────────┤   │
│  │  📝 Dagbok                                              │   │
│  │  "Nervös inför intervjun men förberedde mig väl."      │   │
│  │  😐 Humör: Nervös  •  Energinivå: 5/10                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  📊 SAMMANFATTNING FÖR MARS                                     │
│  • 5 ansökningar  •  2 intervjuer  •  Humör: 📈 Positiv trend │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Datastruktur

```typescript
interface JourneyEntry {
  id: string
  userId: string
  date: string
  type: 'diary' | 'application' | 'interview' | 'exercise' | 'milestone'
  
  // Gemensamma fält
  title: string
  description: string
  mood?: 'great' | 'good' | 'neutral' | 'bad' | 'terrible'
  energyLevel?: number  // 1-10
  
  // Typ-specifika fält (sparas som JSONB)
  metadata: {
    // För application
    jobId?: string
    jobTitle?: string
    company?: string
    status?: 'applied' | 'interview' | 'rejected' | 'offer'
    matchScore?: number
    
    // För interview
    interviewType?: 'phone' | 'video' | 'inperson'
    interviewers?: string[]
    notes?: string
    followUpDate?: string
    
    // För exercise
    exerciseId?: string
    exerciseName?: string
    duration?: number
    completionRate?: number
    
    // För milestone
    milestoneType?: 'first_application' | 'first_interview' | '100_applications' | 'job_offer'
  }
  
  // AI-genererad insikt
  aiInsight?: string
  
  createdAt: string
}
```

---

## 5. Feature 4: Sammanslagen "Karriär"-modul

### 5.1 Vision
Slå samman Intresseguide, Karriärväg, och Utbildningsväg.

### 5.2 UI/UX Design

```
┌─────────────────────────────────────────────────────────────────┐
│  🧭 MIN KARRIÄR                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🧬 DINA INTRESSEN (RIASEC)                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Social •••••○○○○ 67%                                   │   │
│  │  Konventionell ••••○○○○○ 54%                            │   │
│  │  Realistisk •••○○○○○○○ 41%                              │   │
│  │                                    [Gör om test]        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  🎯 TOPP 5 YRKESMATCHNINGAR                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  1. Sjuksköterska (94%)                                 │   │
│  │     🔥 Hett just nu: 45 lediga jobb inom 20 km          │   │
│  │     [Se jobb] [Läs om yrket] [Utbildningsväg]          │   │
│  │  ─────────────────────────────────────────────────────  │   │
│  │  2. Lärare (89%)                                        │   │
│  │     Lediga jobb: 12  •  Utbildning: 3 år               │   │
│  │  ─────────────────────────────────────────────────────  │   │
│  │  3. Undersköterska (85%)                                │   │
│  │  ...                                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  🗺️ DIN KARRIÄRVÄG                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │   NU ──────► NÄSTA ──────► FRAMTID                     │   │
│  │   ━━━━━━━━━   ━━━━━━━━━   ━━━━━━━━━                    │   │
│  │   Underskö-   Sjukskö-    Specialist-                  │   │
│  │   terska      terska      sjuksköterska                │   │
│  │   (1 år)      (3 år)      (5+ år)                      │   │
│  │     ●──────────●──────────●                            │   │
│  │                                                         │   │
│  │   [Vad behöver jag?]  [Hur lång tid?]  [Lön?]          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  🎓 REKOMMENDERADE UTBILDNINGAR                                 │
│  • Sjuksköterskeprogrammet - Karolinska                        │
│    Start: Augusti 2026  •  Antagningspoäng: 22.5               │
│  • Specialistutbildning inom intensivvård                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Implementationsteg

### Vecka 1-2: AI Nästa-Steg Assistant
- [ ] Dag 1-3: Skapa AI-analysmotor (data aggregation)
- [ ] Dag 4-6: Recommendation engine
- [ ] Dag 7-8: AIAssistant-komponent
- [ ] Dag 9-10: Integrera med Dashboard

### Vecka 3-4: Embeddings & Prediktiv Matchning
- [ ] Dag 1-3: Setup embeddings (OpenAI eller lokal)
- [ ] Dag 4-6: CV→Embedding pipeline
- [ ] Dag 7-8: Jobb→Embedding pipeline
- [ ] Dag 9-10: Semantisk matchning + UI

### Vecka 5-6: "Min Resa" (Dagbok + Tracker)
- [ ] Dag 1-3: JourneyEntry datamodell + API
- [ ] Dag 4-6: Tidslinje-komponent
- [ ] Dag 7-8: Migration av befintlig data
- [ ] Dag 9-10: AI-insikter från resan

### Vecka 7-8: "Karriär" (Intresse + Utbildning)
- [ ] Dag 1-3: UnifiedCareerPage
- [ ] Dag 4-5: Karriärvägs-visualisering
- [ ] Dag 6-7: Utbildningsintegration
- [ ] Dag 8-10: Polish + testning

---

## 7. Teknisk Arkitektur

### Nya tjänster
```
client/src/
├── services/
│   ├── ai/
│   │   ├── aiAssistant.ts           # AI-rekommendationer
│   │   ├── embeddings.ts            # Embedding-generering
│   │   └── semanticMatching.ts      # Semantisk matchning
│   └── journey/
│       ├── journeyApi.ts            # Min Resa API
│       └── journeyInsights.ts       # AI-insikter från resa
└── components/
    ├── ai/
    │   ├── AIAssistant.tsx          # Huvud AI-widget
    │   ├── SmartJobMatches.tsx      # Prediktiva matchningar
    │   └── InsightCard.tsx          # AI-insikt-kort
    └── journey/
        ├── JourneyTimeline.tsx      # Tidslinje
        ├── JourneyEntryCard.tsx     # Entry-kort
        └── CareerPathMap.tsx        # Karriärvägskarta
```

### Backend/Edge Functions
```
supabase/functions/
├── generate-embedding/              # Generera embeddings
├── ai-recommendations/              # AI-rekommendationer
└── semantic-search/                 # Semantisk jobbsökning
```

---

## 8. AI/ML Stack

### Alternativ 1: OpenAI (Snabbast)
- **Embeddings:** `text-embedding-3-small`
- **Rekommendationer:** GPT-4 med function calling
- **Fördel:** Hög kvalitet, enkel implementation
- **Nackdel:** Kostnad, extern beroende

### Alternativ 2: Lokal/Self-hosted (Mer kontroll)
- **Embeddings:** sentence-transformers (all-MiniLM-L6-v2)
- **Rekommendationer:** Regelbaserad + enkel ML
- **Fördel:** Gratis, offline, datasekretess
- **Nackdel:** Lägre kvalitet, mer arbete

### Rekommendation: Hybrid
- **Fas 3 MVP:** OpenAI för snabb implementation
- **Fas 4:** Migrera till lokal/låg-kostnad lösning

---

## 9. Databasändringar

```sql
-- AI-rekommendationer
CREATE TABLE ai_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  priority TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  reasoning TEXT,
  action_link TEXT,
  action_label TEXT,
  expected_outcome TEXT,
  deadline TIMESTAMP,
  confidence INTEGER,
  shown_at TIMESTAMP,
  acted_at TIMESTAMP,
  dismissed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Embeddings för CV
CREATE TABLE cv_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  embedding VECTOR(1536),  -- OpenAI dimension
  generated_at TIMESTAMP DEFAULT NOW()
);

-- Embeddings för jobb (cache)
CREATE TABLE job_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id TEXT NOT NULL,
  job_data JSONB NOT NULL,
  embedding VECTOR(1536),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(job_id)
);

-- Journey entries (unified diary + tracker + activity)
CREATE TABLE journey_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  mood TEXT,
  energy_level INTEGER,
  metadata JSONB DEFAULT '{}',
  ai_insight TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Index för vektor-sökning
CREATE INDEX idx_job_embeddings_vector ON job_embeddings USING ivfflat (embedding vector_cosine_ops);
```

---

**Godkänt för implementation:** ✅

Nästa steg: Börja med AI Nästa-Steg Assistant!
