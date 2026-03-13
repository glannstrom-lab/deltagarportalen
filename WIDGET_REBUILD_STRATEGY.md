# Widget Rebuild Strategi - Dashboard Widgets

## 📊 Översikt

**Mål:** Skapa widgets som exakt speglar faktisk sidfunktionalitet, inte mock-data.
**Ansats:** Analysera varje sida → Identifiera nyckeldata → Skapa widget som visar förhandsvisning.

---

## 📋 Sid-Inventering (31 sidor)

### 1. Huvudmoduler (Finns som widgets)

| Sida | Widget | Status | Nyckelfunktioner |
|------|--------|--------|------------------|
| `CVPage` | CVWidget | ✅ Finns | 5 tabs, PDF-export, ATS-analys, mallar |
| `CoverLetterPage` | CoverLetterWidget | ✅ Finns | 5 tabs, brevskrivare, mallar, statistik |
| `JobSearch` | JobSearchWidget | ✅ Finns | Platsbanken-sök, sparade jobb, filter |
| `JobTracker` | ApplicationsWidget | ✅ Finns | Ansökningsstatus, pipeline |
| `Career` | CareerWidget | ✅ Finns | Yrkesinfo, utbildningsvägar |
| `InterestGuide` | InterestsWidget | ✅ Finns | 36-frågor quiz, RIASEC-profil |
| `Exercises` | ExercisesWidget | ✅ Finns | 38 kategorier, frågeformulär |
| `Diary` | DiaryWidget | ✅ Finns | Kalender, mood tracking, uppgifter |
| `Wellness` | WellnessWidget | ✅ Finns | Hälsotips, dagliga aktiviteter |
| `KnowledgeBase` | KnowledgeWidget | ✅ Finns | 7 tabs, artiklar, bookmarks |

### 2. Tillgångssidor (Saknar widgets - NYA BEHOV)

| Sida | Förslag | Funktion | Datakälla |
|------|---------|----------|-----------|
| `InterviewSimulator` | InterviewWidget | Intervjuträning med AI | `POST /api/ai/intervju-simulator` |
| `LinkedInOptimizer` | LinkedInWidget | LinkedIn-textgenerering | `POST /api/ai/linkedin-optimering` |
| `CareerPlan` | CareerPlanWidget | AI-karriärplan | `POST /api/ai/karriarplan` |
| `SkillsGapAnalysis` | SkillsGapWidget | Kompetensgap-analys | `POST /api/ai/kompetensgap` |
| `Resources` | ResourcesWidget | Sparade resurser | `savedJobsApi`, `articleBookmarksApi` |
| `Calendar` | CalendarWidget | Kommande händelser | Kalender-events |

### 3. Profil/Inställningar (Saknar widgets - låg prio)

| Sida | Kommentar |
|------|-----------|
| `Profile` | Redan i topbar, låg prio |
| `UnifiedProfile` | Komplett profil, kan ha widget för % komplett |
| `Settings` | Inställningar, inte dashboard-värdig |

---

## 🎯 Widget-Specifika Strategier

### 1. CV Widget (Finns - Behöver förbättras)

**Nuvarande:**
- Visar CV-progress, ATS-score, missing sections

**Faktiska sidfunktioner (5 tabs):**
1. **Skapa CV** - Formulär med 7 sektioner
2. **Mina CV** - Lista med sparade CV:n
3. **Mallar** - 6 professionella mallar
4. **ATS-analys** - Nyckelordsmatchning
5. **CV-tips** - Artiklar och guider

**Föreslagen förbättring:**
```typescript
// Visa faktisk data från varje tab
interface CVWidgetData {
  // Tab 1: Skapa CV
  cvProgress: number;
  lastSaved: string;
  missingSections: string[];
  
  // Tab 2: Mina CV  
  savedCVs: { id, title, updatedAt, isDefault }[];
  
  // Tab 3: Mallar
  templateRecommendations: string[]; // baserat på bransch
  
  // Tab 4: ATS
  atsScore: number;
  keywordMatch: { found: string[]; missing: string[] };
  
  // Tab 5: Tips
  unreadTips: number;
  recommendedTip: { title, readTime };
}
```

**Actions:**
- "Fortsätt redigera" → `/cv` (till senaste sektionen)
- "Välj mall" → `/cv/templates`
- "Kör ATS-analys" → `/cv/ats`

---

### 2. Cover Letter Widget (Finns - Behöver förbättras)

**Faktiska sidfunktioner (5 tabs):**
1. **Skriv brev** - AI-assisterad brevskrivare med jobb-URL
2. **Mina brev** - Sparade personliga brev
3. **Ansökningar** - Kopplade till jobbansökningar
4. **Färdiga mallar** - Branschspecifika mallar
5. **Din statistik** - Antal brev, framgångsgrad

**Föreslagen förbättring:**
```typescript
interface CoverLetterWidgetData {
  // Tab 1: Skriv brev
  hasDraft: boolean;
  draftProgress: number;
  
  // Tab 2: Mina brev
  savedLetters: { id, jobTitle, company, createdAt }[];
  totalLetters: number;
  
  // Tab 3: Ansökningar
  activeApplications: number;
  pendingApplications: number;
  
  // Tab 4: Mallar
  popularTemplate: string;
  
  // Tab 5: Statistik
  weeklyLetters: number;
  successRate: number;
}
```

**Actions:**
- "Skriv nytt brev" → `/cover-letter`
- "Se mina brev" → `/cover-letter/my-letters`
- "Se statistik" → `/cover-letter/statistics`

---

### 3. JobSearch Widget (Finns - Behöver förbättras)

**Faktiska sidfunktioner:**
- Platsbanken-sökning med filter
- Spara/ta bort jobb
- Autocomplete-förslag
- Jobbdetaljer med modal
- Popular queries
- Create Application-flöde

**Föreslagen förbättring:**
```typescript
interface JobSearchWidgetData {
  // Sök
  recentSearches: string[];
  savedSearches: { query, filters, resultCount }[];
  
  // Jobb
  newJobsToday: number;
  savedJobs: { id, headline, employer, deadline }[];
  savedCount: number;
  
  // Rekommendationer
  recommendedJobs: PlatsbankenJob[]; // baserat på intresseguide
  
  // Ansökningar
  applicationDrafts: number;
}
```

**Actions:**
- "Sök jobb" → `/job-search`
- "Sparade jobb" → `/job-search?filter=saved`
- "Se rekommendationer" → `/job-search?recommended=true`

---

### 4. Applications Widget (JobTracker) (Finns - Behöver förbättring)

**Faktiska sidfunktioner:**
- Pipeline: Applied → Interview → Offer → Rejected
- Sök/filter bland ansökningar
- Detaljer per ansökan (företag, position, status, kontakt, notes)

**Föreslagen förbättring:**
```typescript
interface ApplicationsWidgetData {
  totalApplications: number;
  statusBreakdown: {
    applied: number;
    interview: number;
    offer: number;
    rejected: number;
  };
  recentApplications: { 
    id, company, position, status, 
    appliedDate, nextAction 
  }[];
  upcomingInterviews: { company, date, time, location }[];
  conversionRate: number; // applied → interview
}
```

**Actions:**
- "Se alla ansökningar" → `/applications`
- "Lägg till ansökan" → `/applications?action=new`
- "Kommande intervjuer" → `/applications?filter=interview`

---

### 5. Career Widget (Finns - Behöver förbättring)

**Faktiska sidfunktioner:**
- Utforska yrken (sök)
- Spara yrkesvägar
- Yrkesinfo med lönestatistik, efterfrågan, utbildningsvägar

**Föreslagen förbättring:**
```typescript
interface CareerWidgetData {
  exploredOccupations: number;
  savedPaths: { 
    occupation, 
    progress, 
    requiredEducation,
    salaryRange 
  }[];
  recommendedOccupations: { 
    title, 
    matchScore, // från intresseguide
    demand,
    salary 
  }[];
  salaryStatistics: {
    myTargetRange: string;
    marketAverage: string;
  };
}
```

**Actions:**
- "Utforska yrken" → `/career`
- "Mina sparade vägar" → `/career?tab=saved`
- "Se rekommendationer" → `/career?tab=recommended`

---

### 6. Interests Widget (InterestGuide) (Finns - Behöver förbättring)

**Faktiska sidfunktioner:**
- 36-frågor quiz över 4 sektioner
- RIASEC-profil (Realistic, Investigative, Artistic, Social, Enterprising, Conventional)
- Big Five-personlighet
- Spara progress i molnet
- Resultat med yrkesrekommendationer

**Föreslagen förbättring:**
```typescript
interface InterestsWidgetData {
  // Quiz-progress
  isCompleted: boolean;
  answeredQuestions: number;
  totalQuestions: 36;
  currentSection: string;
  completionPercentage: number;
  
  // Resultat
  riasecProfile: {
    dominant: string;
    secondary: string;
    scores: Record<string, number>;
  };
  bigFiveProfile: Record<string, number>;
  
  // Rekommendationer
  topOccupations: { title, matchPercentage }[];
  topEducations: { title, duration, matchPercentage }[];
  
  // Historik
  completedAt: string;
  canRetake: boolean; // efter 6 månader?
}
```

**Actions:**
- "Fortsätt quiz" → `/interest-guide?continue=true`
- "Se min profil" → `/interest-guide?tab=results`
- "Gör om quiz" → `/interest-guide?reset=true`

---

### 7. Exercises Widget (Finns - Behöver förbättring)

**Faktiska sidfunktioner:**
- 38 kategorier av övningar
- Frågeformulär med flera steg
- Spara svar i Supabase
- Filter per kategori
- Svårighetsgrader (Lätt/Medel/Utmanande)

**Föreslagen förbättring:**
```typescript
interface ExercisesWidgetData {
  // Progress
  totalExercises: number;
  completedExercises: number;
  completionRate: number;
  
  // Senaste
  lastExercise: {
    id, title, category, completedAt,
    nextExercise: { id, title }
  };
  
  // Kategorier
  categoryProgress: {
    category: string;
    completed: number;
    total: number;
    color: string;
  }[];
  
  // Streak
  currentStreak: number;
  longestStreak: number;
  
  // Rekommendation
  recommendedExercise: { id, title, category, difficulty };
}
```

**Actions:**
- "Fortsätt övning" → `/exercises?id=${lastExercise.id}`
- "Se alla kategorier" → `/exercises`
- "Rekommenderad övning" → `/exercises?id=${recommended.id}`

---

### 8. Diary Widget (Finns - Behöver förbättring)

**Faktiska sidfunktioner:**
- Kalender (vecka/dag-vy)
- Händelser (intervjuer, möten, deadlines)
- Uppgifter kopplade till events
- Mood tracking (humör, energi, stress)
- Dagboksanteckningar
- Måluppföljning

**Föreslagen förbättring:**
```typescript
interface DiaryWidgetData {
  // Kalender
  upcomingEvents: { 
    id, title, date, time, type, location,
    tasksCompleted: number;
    tasksTotal: number;
  }[];
  eventsToday: number;
  eventsThisWeek: number;
  
  // Mål
  weeklyGoals: {
    applications: { target: number; current: number };
    interviews: { target: number; current: number };
    tasks: { target: number; current: number };
  };
  
  // Mood
  todaysMood: { level: 1-5; energy: 1-5; stress: 1-5 };
  moodTrend: 'up' | 'down' | 'stable';
  streakDays: number;
  
  // Dagbok
  hasEntryToday: boolean;
  recentEntries: { date, snippet }[];
}
```

**Actions:**
- "Se kalender" → `/diary`
- "Dagens uppgifter" → `/diary?tab=tasks`
- "Skriv dagbok" → `/diary?action=entry`

---

### 9. Wellness Widget (Finns - Behöver förbättring)

**Faktiska sidfunktioner:**
- 4 kategorier: Mental, Fysisk, Sömn, Social
- Dagliga aktiviteter (promenad, meditation, positiva saker, kontakta vän)
- Inspirerande citat
- Hälsotips
- Reflektionsfrågor
- Sparade svar

**Föreslagen förbättring:**
```typescript
interface WellnessWidgetData {
  // Dagliga aktiviteter
  dailyActivities: {
    id, title, completed, icon
  }[];
  completedToday: number;
  totalActivities: number;
  
  // Veckostatistik
  weeklyProgress: number; // % av aktiviteter gjorda
  currentStreak: number;
  
  // Tips
  todaysTip: { category, title, description };
  
  // Citat
  dailyQuote: { text, author };
  
  // Reflektion
  hasReflectionToday: boolean;
  lastReflectionDate: string;
}
```

**Actions:**
- "Markera aktivitet" (inline checkbox)
- "Dagens tips" → `/wellness?tab=tips`
- "Skriv reflektion" → `/wellness?action=reflect`

---

### 10. Knowledge Widget (KnowledgeBase) (Finns - Behöver förbättring)

**Faktiska sidfunktioner:**
- 7 tabs: För dig, Komma igång, Ämnen, Snabbhjälp, Min resa, Verktyg, Trendar
- Artikelvisning med lästid
- Bookmark-funktion
- Energinivå-filter (låg/medel/hög)
- Progress-tracking

**Föreslagen förbättring:**
```typescript
interface KnowledgeWidgetData {
  // Progress
  totalArticles: number;
  readArticles: number;
  bookmarks: number;
  completionPercentage: number;
  
  // Rekommendationer (För dig)
  recommendedArticles: { 
    id, title, category, readingTime, 
    isBookmarked, progress 
  }[];
  
  // Fortsätt läsa
  inProgressArticle: { id, title, progress };
  
  // Snabbhjälp
  quickHelpArticles: { title, url }[];
  
  // Trendar
  trendingTopics: string[];
}
```

**Actions:**
- "Fortsätt läsa" → `/knowledge-base?article=${id}`
- "Se bokmärken" → `/knowledge-base?tab=my-journey`
- "Snabbhjälp" → `/knowledge-base?tab=quick-help`

---

## 🆕 NYA WIDGETS ATT SKAPA

### 11. InterviewWidget (NY)

**Från:** `InterviewSimulator.tsx`

**Data:**
```typescript
interface InterviewWidgetData {
  sessionsCompleted: number;
  lastSession: { role, company, questionsCount, date };
  averageFeedback: number; // 1-5
  commonWeaknesses: string[];
  
  // Snabbstart
  quickStartRoles: string[]; // baserat på sparade jobb
  
  // Streak
  practiceStreak: number;
}
```

**Visning:**
- "Du har övat intervju 3 gånger denna vecka 🔥"
- Snabbval: "Öva för Frontend-utvecklare" (från sparat jobb)
- Senaste feedback: "Bra på att ge konkreta exempel"

**Actions:**
- "Öva intervju" → `/interview-simulator`
- "Se historik" → `/interview-simulator?tab=history`

---

### 12. LinkedInWidget (NY)

**Från:** `LinkedInOptimizer.tsx`

**Data:**
```typescript
interface LinkedInWidgetData {
  generationsCount: { headline, about, post, connection };
  lastGenerated: { type, text, date };
  copiedCount: number;
  
  // Tips
  profileScore: number;
  improvementTips: string[];
}
```

**Visning:**
- "Generera LinkedIn-text med AI"
- Snabbval: Headline / About / Inlägg / Kontakt
- Senast kopierad: "Frontend-utvecklare | React..."

**Actions:**
- "Skapa headline" → `/linkedin-optimizer?tab=headline`
- "Skriv bio" → `/linkedin-optimizer?tab=about`
- "Skapa inlägg" → `/linkedin-optimizer?tab=post`

---

### 13. CareerPlanWidget (NY)

**Från:** `CareerPlan.tsx`

**Data:**
```typescript
interface CareerPlanWidgetData {
  hasPlan: boolean;
  plan: {
    current: string;
    goal: string;
    timeline: string;
    milestones: { step, timeframe, completed }[];
  };
  progress: number;
  nextMilestone: { title, deadline };
}
```

**Visning:**
- Om plan finns: Progress bar + nästa delmål
- Om ingen plan: "Skapa din karriärplan med AI"

**Actions:**
- "Se min plan" → `/career-plan`
- "Uppdatera plan" → `/career-plan?action=edit`
- "Skapa plan" → `/career-plan` (om ny)

---

### 14. SkillsGapWidget (NY)

**Från:** `SkillsGapAnalysis.tsx`

**Data:**
```typescript
interface SkillsGapWidgetData {
  analysesCount: number;
  lastAnalysis: {
    dreamJob: string;
    matchPercentage: number;
    missingSkills: string[];
    recommendations: string[];
  };
  
  // Sparade
  savedComparisons: { cvSnapshot, jobTitle, date }[];
}
```

**Visning:**
- Senaste analys: "75% match mot Projektledare"
- Saknade kompetenser lista (3-5 st)
- "Analysera nytt drömjobb"

**Actions:**
- "Se analys" → `/skills-gap-analysis`
- "Analysera nytt" → `/skills-gap-analysis?action=new`

---

### 15. ResourcesWidget (NY)

**Från:** `Resources.tsx`

**Data:**
```typescript
interface ResourcesWidgetData {
  // Sparat innehåll
  savedJobs: number;
  bookmarks: number;
  uploadedFiles: number;
  
  // Senaste
  recentSavedJobs: { title, company, savedAt }[];
  recentBookmarks: { title, category }[];
  
  // Snabbåtkomst
  quickAccess: { type, title, url }[];
}
```

**Visning:**
- "Du har 12 sparade jobb och 8 bokmärken"
- Lista: Senaste 3 sparade jobb
- Senaste 3 bokmärken

**Actions:**
- "Alla resurser" → `/resources`
- "Sparade jobb" → `/resources?tab=jobs`
- "Bokmärken" → `/resources?tab=bookmarks`

---

### 16. CalendarWidget (NY)

**Från:** `Calendar.tsx`

**Data:**
```typescript
interface CalendarWidgetData {
  today: { events: number; tasks: number };
  upcoming: { date, title, type, time }[];
  thisWeek: { events: number; deadlines: number };
  
  // Påminnelser
  reminders: { task, deadline, event }[];
}
```

**Visning:**
- Dagens agenda (2-3 händelser)
- Kommande deadlines
- "Du har 2 intervjuer denna vecka"

**Actions:**
- "Se kalender" → `/calendar`
- "Lägg till händelse" → `/calendar?action=new`

---

## 🏗️ Implementeringsordning

### Fas 1: Förbättra existerande widgets
1. ✅ CVWidget - Lägg till sparade CV:n och ATS-data
2. ✅ CoverLetterWidget - Lägg till brev-lista och statistik
3. ✅ JobSearchWidget - Lägg till sparade jobb och rekommendationer
4. ✅ ApplicationsWidget - Förbättra pipeline-visning
5. ✅ CareerWidget - Lägg till sparade vägar

### Fas 2: Nya viktiga widgets
6. 🆕 InterviewWidget - Intervjuträning
7. 🆕 LinkedInWidget - LinkedIn-optimering
8. 🆕 ResourcesWidget - Sparat innehåll
9. 🆕 CalendarWidget - Kalender/agenda

### Fas 3: Avancerade widgets
10. 🆕 CareerPlanWidget - Karriärplan
11. 🆕 SkillsGapWidget - Kompetensgap
12. 🆕 InterestsWidget - Förbättra med RIASEC-data

---

## 📐 Design-Principer

### 1. Kompaktitet (Redan på plats)
- p-3 padding
- h-6 icons
- Ultra-thin progress bars (h-1)
- Compact text (text-xs, text-sm)

### 2. Informativ densitet
- Max 3-4 datapunkter i small
- Max 6-8 datapunkter i medium
- Max 10-12 datapunkter i large

### 3. Action-orienterad
- Varje widget måste ha minst 1 CTA
- CTAs ska gå till specifik tab/action på sidan
- Inga placeholder-handlers

### 4. Kontextuell
- Visa data som är relevant just nu
- Prioritera ofullständiga uppgifter
- Visa streaks/progress för motivation

---

## 🔌 API-Integrationer

### Befintliga hooks att använda:
```typescript
// Använd dessa i widgets:
const { savedJobs } = useSavedJobs();
const { data: articles } = useArticles();
const { data: bookmarks } = useBookmarks();
const dashboardData = useDashboardData();

// Supabase direkt:
const { data: cvs } = await supabase.from('cvs').select('*');
const { data: letters } = await supabase.from('cover_letters').select('*');
const { data: applications } = await supabase.from('applications').select('*');
const { data: events } = await supabase.from('calendar_events').select('*');
const { data: exercises } = await supabase.from('exercise_answers').select('*');
```

### Nya API-anrop som behövs:
```typescript
// Interview
POST /api/ai/intervju-simulator

// LinkedIn
POST /api/ai/linkedin-optimering

// CareerPlan
POST /api/ai/karriarplan

// SkillsGap
POST /api/ai/kompetensgap
```

---

## 📱 Responsivitet

### Mobile (< 768px)
- Alla widgets small size
- Single column grid
- Minimal text
- Stora touch-targets

### Tablet (768px - 1024px)
- 2-column grid
- Mixed sizes (small/medium)

### Desktop (> 1024px)
- 3-4 column grid
- All sizes available
- Size-selector i header

---

## ✅ Accepteranskriterier

- [ ] Varje widget visar faktisk data från Supabase
- [ ] Inga mock-data visas (om inte användaren är ny)
- [ ] Alla actions länkar till riktiga sidor/tabs
- [ ] Widgets uppdateras automatiskt när data ändras
- [ ] Loading states visas vid data-hämtning
- [ ] Error states hanteras gracefully
- [ ] Tomma states ger vägledning ("Börja här")
- [ ] Streaks/progress visas tydligt
- [ ] Alla widgets följer kompakt design

---

## 🚀 Nästa steg

1. **Prioritera** - Välj 3-4 widgets att förbättra först
2. **Data** - Skapa/uppdatera hooks för saknad data
3. **Design** - Uppdatera widget-komponenter
4. **Testa** - Verifiera med riktig data
5. **Iterate** - Förbättra baserat på feedback

---

*Senast uppdaterad: 2026-03-13*
*Strategi skapad av: Utvecklarteamet*
