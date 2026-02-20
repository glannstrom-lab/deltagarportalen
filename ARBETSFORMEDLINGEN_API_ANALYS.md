# Arbetsförmedlingens API:er - Analys & Integrationsförslag

**Datum:** 2026-02-20  
**Projekt:** Deltagarportalen  
**API-källa:** [data.arbetsformedlingen.se](https://data.arbetsformedlingen.se/) & [jobtechdev.se](https://jobtechdev.se/)

---

## 📋 Sammanfattning

Arbetsförmedlingen erbjuder omfattande öppna API:er som kan avsevärt stärka deltagarportalen. De mest relevanta API:erna är:

1. **JobSearch API** - Sök bland alla platsannonser
2. **JobAd Enrichments** - AI-analys av jobbannonser
3. **JobEd Connect** - Koppling utbildning-yrke
4. **Taxonomi API** - Standardiserade yrkes- och kompetensbegrepp
5. **Historical Ads** - Statistik och trender

---

## 🔧 Tillgängliga API:er

### 1. JobSearch API ⭐ (HÖGSTA PRIORITET)

**URL:** `https://jobsearch.api.jobtechdev.se`

**Beskrivning:**  
Sök bland aktuella och historiska platsannonser från Platsbanken. Innehåller ca 10 000+ aktiva annonser.

**Endpoints:**
```
GET /search              # Sök annonser
GET /ad/{id}            # Hämta specifik annons
GET /complete           # Autocomplete för sök
GET /taxonomy/concepts  # Yrken, kommuner, etc.
```

**Nyckelfält i svar:**
- `headline` - Annonsrubrik
- `description.text` - Beskrivning
- `employer.name` - Arbetsgivare
- `workplace_address` - Adressuppgifter
- `must_have` - Krav (kompetenser, språk)
- `nice_to_have` - Meriterande
- `application_details` - Ansökningsinfo
- `occupation` - Yrkeskategori

**Implementationsstatus:** ✅ Redan implementerat i `arbetsformedlingenApi.ts`

---

### 2. JobAd Enrichments API ⭐ (HÖG PRIORITET)

**URL:** `https://enrichments.api.jobtechdev.se`

**Beskrivning:**  
AI-lösning som automatiskt extraherar kompetenser, yrken och annan relevant information ur jobbannonser. Använder Named Entity Recognition (NER).

**Endpoints:**
```
POST /enrichment        # Skicka text, få berikad data
GET /taxonomy/graph     # Relationer mellan begrepp
```

**Användningsområden:**
- **CV-matchning:** Identifiera vilka kompetenser som efterfrågas
- **Gap-analys:** Se vilka kompetenser användaren saknar
- **Nyckelordsoptimering:** Föreslå ord att inkludera i CV
- **Kompetenskartläggning:** Förstå vad som krävs för olika yrken

**Exempel på extraktion:**
```json
{
  "entities": [
    { "type": "skill", "label": "JavaScript", "frequency": 3 },
    { "type": "occupation", "label": "Systemutvecklare" },
    { "type": "language", "label": "Svenska" }
  ]
}
```

---

### 3. JobEd Connect API (MEDEL PRIORITET)

**URL:** `https://education-api.jobtechdev.se`

**Beskrivning:**  
Kopplar utbildningar till yrken baserat på kompetenser. Använder data från SUSA-navet.

**Endpoints:**
```
GET /match/education-to-occupation
GET /match/occupation-to-education
GET /search/educations
GET /search/occupations
```

**Användningsområden:**
- **Kompetensbedömning:** Se vilka utbildningar som leder till specifika yrken
- **Rekommendationer:** Föreslå utbildningar baserat på yrkesmål
- **Validering:** Jämför användarens utbildning med yrkeskrav

---

### 4. Taxonomi API (MEDEL PRIORITET)

**URL:** Ingår i JobSearch API

**Beskrivning:**  
Standardiserade begrepp för yrken, kompetenser, platser mm. Bygger på SSYK (Svensk standard för yrkesklassificering).

**Tillgängliga koncepttyper:**
- `occupation-name` - Yrkesbenämningar
- `skill` - Kompetenser
- `municipality` - Kommuner
- `region` - Län
- `employment-type` - Anställningsformer
- `language` - Språk

**Användningsområden:**
- **Autocomplete:** För sökfält
- **Filter:** Standardiserade filteralternativ
- **Kategorisering:** Gruppera jobb efter yrkesområden
- **Översättning:** Konsekvent terminologi

---

### 5. Historical Ads API (LÄGRE PRIORITET)

**URL:** `https://historical.api.jobtechdev.se`

**Beskrivning:**  
Historiska platsannonser för analys och statistik.

**Användningsområden:**
- **Trender:** Visa vilka kompetenser som växer
- **Lönestatistik:** Historisk löneutveckling
- **Efterfrågan:** Vilka yrken är mest efterfrågade över tid

---

### 6. JobSearch Trends API (LÄGRE PRIORITET)

**URL:** Del av JobSearch

**Beskrivning:**  
De mest populära sökorden på Platsbanken.

**Användningsområden:**
- **Marknadsinsikt:** Visa populära sökningar
- **Trendindikatorer:** Vad är hett just nu

---

## 💡 Integrationsförslag för Deltagarportalen

### Fas 1: Omedelbara förbättringar (Redan delvis implementerat)

#### 1.1 Jobbsök med riktiga annonser

**Status:** Grunden finns, behöver kopplas på

**Implementation:**
```typescript
// Ersätt mock-jobb med API-anrop
const searchJobs = async (filters: JobFilters) => {
  const afResult = await afApi.searchJobs({
    q: filters.search,
    municipality: filters.location,
    employment_type: filters.employmentType[0],
    limit: 50,
    offset: 0
  })
  
  // Konvertera AF-format till portalens format
  return afResult.hits.map(ad => convertAFJobToPortalJob(ad))
}
```

**Fördelar:**
- ✅ 10 000+ aktuella annonser
- ✅ Verkliga arbetsgivare
- ✅ Direktlänk till ansökan

---

### Fas 2: AI-driven matchning (JobAd Enrichments)

#### 2.1 Smart CV-matchning

**Beskrivning:**  
Använd JobAd Enrichments för att analysera jobbannonser och matcha mot användarens CV.

**Flöde:**
```
1. Användare hittar intressant jobb
2. Hämta och analysera annons med Enrichments API
3. Extrahera kompetenser och krav
4. Jämför med användarens CV
5. Visa matchningsprocent och saknade kompetenser
```

**UI-komponent:**
```typescript
interface JobMatchAnalysis {
  matchPercentage: number
  matchingSkills: string[]
  missingSkills: string[]
  suggestions: string[]
}
```

**Visa för användaren:**
- 🎯 Matchningsprocent (t.ex. "85% match")
- ✅ Kompetenser du har
- ❌ Kompetenser att utveckla
- 💡 Förslag på CV-justeringar

---

#### 2.2 Automatisk kompetensanalys

**Beskrivning:**  
När användare skapar CV, analysera deras text och föreslå kompetenser från taxonomin.

**Implementation:**
```typescript
const analyzeCVSkills = async (cvText: string) => {
  const enriched = await enrichmentApi.enrich(cvText)
  return enriched.entities
    .filter(e => e.type === 'skill')
    .map(e => e.label)
}
```

---

### Fas 3: Utbildningsvägledning (JobEd Connect)

#### 3.1 Koppling intresseguide → Utbildning → Jobb

**Beskrivning:**  
Använd resultatet från intresseguiden för att föreslå relevanta utbildningar och yrken.

**Flöde:**
```
1. Användare gör intresseguiden
2. Få yrkesförslag baserat på RIASEC/Big Five
3. Använd JobEd Connect för att hitta:
   - Vilka utbildningar leder till yrket
   - Vilka kompetenser behövs
   - Vilka jobb finns tillgängliga
4. Skapa en "karriärväg" för användaren
```

**UI-komponent - Karriärväg:**
```
┌─────────────────────────────────────────┐
│  DIN KARRIÄRVÄG                          │
├─────────────────────────────────────────┤
│                                          │
│  1. DIN PROFIL                           │
│     Social, hjälpsam, strukturerad      │
│                                          │
│     ↓                                    │
│                                          │
│  2. REKOMMENDERADE YRKEN                 │
│     • Undersköterska (92% match)        │
│     • Personlig assistent (88%)         │
│     • Förskollärare (85%)               │
│                                          │
│     ↓                                    │
│                                          │
│  3. KOMPETENSGAP                         │
│     Saknas: Vårdutbildning              │
│              HLR-certifiering           │
│                                          │
│     ↓                                    │
│                                          │
│  4. TILLGÄNGLIGA JOBB                    │
│     [Visa 47 lediga jobb]               │
│                                          │
└─────────────────────────────────────────┘
```

---

### Fas 4: Avancerade funktioner

#### 4.1 Prediktiv jobbsökning

**Beskrivning:**  
Använd historiska data för att förutsäga vilka jobb som kan passa användaren.

**Data:**
- Tidigare sökningar
- Sparade jobb
- CV-innehåll
- Intresseguiden-resultat

**Algoritm:**
```typescript
const getPredictedJobs = async (userProfile: UserProfile) => {
  // Hitta liknande användare
  const similarUsers = findSimilarUsers(userProfile)
  
  // Se vilka jobb de sökt/söker
  const popularJobs = getPopularJobsAmongUsers(similarUsers)
  
  // Filtrera bort redan sedda
  return popularJobs.filter(job => !userProfile.viewedJobs.includes(job.id))
}
```

---

#### 4.2 Lönestatistik och marknadsvärde

**Beskrivning:**  
Visa lönestatistik baserat på historiska annonser.

**Implementation:**
```typescript
const getSalaryStats = async (occupation: string) => {
  const historical = await historicalApi.search({
    occupation,
    has_salary_info: true,
    published_after: '2023-01-01'
  })
  
  return {
    average: calculateAverage(historical, 'salary'),
    median: calculateMedian(historical, 'salary'),
    range: { min, max },
    trend: calculateTrend(historical)
  }
}
```

**Visa för användaren:**
- 📊 Lönenivå för yrket
- 📈 Lönetrend (stigande/sjunkande)
- 🎯 Hur användarens profil matchar marknadsvärdet

---

#### 4.3 Kompetensprognoser

**Beskrivning:**  
Visa vilka kompetenser som växer mest i efterfrågan.

**Data från:** Historical Ads API + JobSearch Trends

**UI:**
```
Trendande kompetenser (senaste 12 mån):
┌──────────────────────────────┬──────────┐
│ Kompetens                    │ Tillväxt │
├──────────────────────────────┼──────────┤
│ AI/Maskininlärning          │ +156%    │
│ Hållbarhet/miljö            │ +89%     │
│ Digital kommunikation       │ +67%     │
│ Projektledning (Agile)      │ +45%     │
└──────────────────────────────┴──────────┘
```

---

## 🔌 Teknisk implementationsplan

### Steg 1: Uppdatera befintliga API-klienter

```typescript
// services/arbetsformedlingenApi.ts - Tillägg

export interface EnrichmentResult {
  entities: Array<{
    type: 'skill' | 'occupation' | 'language' | 'location'
    label: string
    frequency: number
  }>
  relations: Array<{
    source: string
    target: string
    type: string
  }>
}

class ArbetsformedlingenAPI {
  // Befintliga metoder...
  
  // NYTT: Berika jobbannons
  async enrichJobAd(text: string): Promise<EnrichmentResult> {
    return fetch('https://enrichments.api.jobtechdev.se/enrichment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    }).then(r => r.json())
  }
  
  // NYTT: Hämta kompetenser för yrke
  async getSkillsForOccupation(occupation: string): Promise<string[]> {
    const graph = await this.fetch('/taxonomy/graph', {
      concept: occupation,
      relation: 'has_skill'
    })
    return graph.related_concepts.map(c => c.label)
  }
  
  // NYTT: Sök med autocomplete
  async autocomplete(query: string, type: string = 'occupation'): Promise<any[]> {
    return this.fetch('/complete', {
      q: query,
      type,
      limit: 10
    })
  }
}
```

---

### Steg 2: Skapa nya komponenter

#### JobMatchAnalyzer.tsx
```typescript
// Analyserar matchning mellan CV och jobb

interface Props {
  cvData: CVData
  jobId: string
}

export function JobMatchAnalyzer({ cvData, jobId }: Props) {
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null)
  
  useEffect(() => {
    analyzeMatch()
  }, [cvData, jobId])
  
  const analyzeMatch = async () => {
    // 1. Hämta jobb
    const job = await afApi.getJobById(jobId)
    
    // 2. Berika med AI
    const enriched = await afApi.enrichJobAd(job.description.text)
    
    // 3. Jämför med CV
    const cvSkills = cvData.skills.map(s => s.name.toLowerCase())
    const requiredSkills = enriched.entities
      .filter(e => e.type === 'skill')
      .map(e => e.label.toLowerCase())
    
    // 4. Beräkna matchning
    const matching = requiredSkills.filter(s => 
      cvSkills.some(cs => cs.includes(s) || s.includes(cs))
    )
    
    setAnalysis({
      percentage: Math.round((matching.length / requiredSkills.length) * 100),
      matching: matching,
      missing: requiredSkills.filter(s => !matching.includes(s)),
      suggestions: generateSuggestions(cvData, job, enriched)
    })
  }
  
  return (
    <div className="match-analysis">
      <MatchPercentage value={analysis.percentage} />
      <SkillComparison 
        matching={analysis.matching}
        missing={analysis.missing}
      />
      <ImprovementSuggestions suggestions={analysis.suggestions} />
    </div>
  )
}
```

---

#### CareerPath.tsx
```typescript
// Visar karriärväg baserat på intresseguide + JobEd

interface Props {
  interestResult: InterestGuideResult
}

export function CareerPath({ interestResult }: Props) {
  const [path, setPath] = useState<CareerPathData | null>(null)
  
  useEffect(() => {
    loadCareerPath()
  }, [interestResult])
  
  const loadCareerPath = async () => {
    // 1. Konvertera RIASEC till yrkesförslag
    const occupations = riasecToOccupations(interestResult.riasec)
    
    // 2. För varje yrke, hämta utbildningsvägar
    const paths = await Promise.all(
      occupations.map(async occ => {
        const education = await jobEdApi.findEducationForOccupation(occ)
        const jobs = await afApi.searchJobs({ 
          occupation: occ,
          limit: 5 
        })
        return { occupation: occ, education, jobs }
      })
    )
    
    setPath(paths)
  }
  
  return (
    <div className="career-path">
      {path?.map((step, i) => (
        <CareerStep 
          key={i}
          step={step}
          isLast={i === path.length - 1}
        />
      ))}
    </div>
  )
}
```

---

### Steg 3: Integration med befintliga sidor

#### Uppdatera JobSearch.tsx

```typescript
// Lägg till AI-analys-knapp på varje jobbkort

<JobCard
  job={job}
  onAnalyze={() => setAnalyzingJob(job)}
/>

{analyzingJob && (
  <JobMatchAnalyzer
    cvData={cvData}
    jobId={analyzingJob.id}
  />
)}
```

#### Uppdatera InterestGuide-resultsidan

```typescript
// Lägg till karriärväg efter resultatet

<ResultsView result={result} />

<CareerPath 
  interestResult={result}
/>
```

---

## 📊 Dataflöden

### Flöde 1: Jobbsök med matchning
```
Användare söker jobb
        ↓
JobSearch API → Lista med annonser
        ↓
För varje jobb:
  - JobAd Enrichments → Extrahera kompetenser
  - Jämför med CV
  - Beräkna matchningsprocent
        ↓
Visa sorterat efter matchning
```

### Flöde 2: CV-optimering
```
Användare laddar upp/skriver CV
        ↓
JobAd Enrichments → Analysera CV
        ↓
Sök efter liknande jobb
        ↓
Analysera gemensamma krav
        ↓
Föreslå:
  - Saknade kompetenser
  - Nyckelord att inkludera
  - Formuleringsförslag
```

### Flöde 3: Karriärplanering
```
Intresseguiden-resultat
        ↓
RIASEC-profil → Yrkesförslag
        ↓
JobEd Connect → Utbildningsvägar
        ↓
Taxonomi API → Kompetenskrav
        ↓
JobSearch API → Tillgängliga jobb
        ↓
Sammanställ karriärväg
```

---

## 🎯 Prioritering & Implementationsordning

### Vecka 1-2: Grundläggande integration
- [ ] Koppla på riktigt JobSearch API
- [ ] Ersätt mock-jobb med API-data
- [ ] Implementera felhantering och loading states

### Vecka 3-4: AI-matchning
- [ ] Integrera JobAd Enrichments
- [ ] Bygg JobMatchAnalyzer-komponent
- [ ] Implementera CV-jämförelse

### Vecka 5-6: Karriärvägledning
- [ ] Integrera JobEd Connect
- [ ] Bygg CareerPath-komponent
- [ ] Koppla till intresseguiden

### Vecka 7-8: Avancerade funktioner
- [ ] Lönestatistik från historiska annonser
- [ ] Kompetenstrender
- [ ] Prediktiva rekommendationer

---

## 💰 API-kostnader & Begränsningar

**Goda nyheter:** Alla Arbetsförmedlingens API:er är **helt gratis**!

**Begränsningar:**
- Rate limits: Ca 100 requests/minut för de flesta API:er
- Ingen API-nyckel krävs för JobSearch
- Vissa API:er kräver registrering på jobtechdev.se

**Rekommendation:**
- Implementera cachning i frontend
- Använd React Query för effektiv datahämtning
- Debounce sökningar för att undvika onödiga anrop

---

## 🔒 Etiska överväganden

1. **Dataintegritet:**
   - Visa tydligt vilken data som kommer från Arbetsförmedlingen
   - Respektera användarens integritet vid analys

2. **AI-transparens:**
   - Förklara att matchning är AI-baserad
   - Ge användaren möjlighet att påverka resultatet

3. **Tillgänglighet:**
   - API:erna stödjer inte alltid svenska tecken perfekt
   - Testa noggrant med skärmläsare

---

## 📚 Resurser

- [JobSearch API Docs](https://jobsearch.api.jobtechdev.se/)
- [JobAd Enrichments GitLab](https://gitlab.com/arbetsformedlingen/enrichment/jobtech-jobad-enrichments)
- [JobEd Connect GitLab](https://gitlab.com/arbetsformedlingen/education/education-api)
- [Getting Started Code Examples](https://gitlab.com/arbetsformedlingen/job-ads/getting-started-code-examples/code-examples-start-here)

---

## ✅ Rekommendation

**Starta med:** JobSearch API + JobAd Enrichments

Dessa två API:er ger mest värde för deltagarna:
1. Verkliga jobb att söka
2. Personlig matchningsanalys
3. Konkreta förbättringsförslag för CV

Detta skiljer Deltagarportalen från generella jobbsajter och ger verkligt värde för arbetssökande, särskilt de som behöver extra stöd!
