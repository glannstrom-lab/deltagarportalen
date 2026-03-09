# 📊 Datastruktur och Algoritmer för Mikro-Lärande Hub

**Roll:** Data Analyst för Deltagarportalen  
**Datum:** 2026-03-09  
**Status:** Rekommendation för implementation

---

## 🎯 Sammanfattning

Denna analys presenterar en datadriven arkitektur för Mikro-Lärande Hub som:
- Intelligently matchar kurser mot kompetensgap
- Personaliserar rekommendationer baserat på användarbeteende
- Spårar kurs-effektivitet (jobbutfall)
- Ger handlingsbara insikter till både användare och konsulenter

---

## 1️⃣ KOMPETENSGAP-ANALYS

### 1.1 Datamodell för Kompetensgap

```sql
-- ============================================
-- TABELL: Kompetens-taxonomi (från AF)
-- ============================================
CREATE TABLE skill_taxonomy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_name TEXT NOT NULL UNIQUE,
    skill_slug TEXT NOT NULL UNIQUE, -- normaliserat format: "microsoft-excel"
    category TEXT NOT NULL, -- 'technical', 'soft', 'certification', 'language'
    ssyk_code TEXT, -- koppling till AF:s taxonomi
    af_concept_id TEXT, -- AF Taxonomy API ID
    synonyms TEXT[], -- ["Excel", "Kalkylblad", "Spreadsheet"]
    related_skills UUID[], -- kopplingar till andra skills
    frequency_rank INTEGER, -- hur vanlig i jobbannonser (1 = vanligast)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELL: Jobbannonser - extraherade kompetenser
-- ============================================
CREATE TABLE job_skills_required (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id TEXT NOT NULL, -- AF jobb-ID
    skill_id UUID REFERENCES skill_taxonomy(id),
    skill_name TEXT NOT NULL, -- denormaliserad för snabb sökning
    importance_score DECIMAL(3,2), -- 0.0-1.0 (krav vs meriterande)
    frequency_in_ads INTEGER DEFAULT 1, -- antal annonser som nämner
    extracted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(job_id, skill_id)
);

-- ============================================
-- TABELL: Användarens kompetensprofil (berikad)
-- ============================================
CREATE TABLE user_skill_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skill_taxonomy(id),
    skill_name TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('cv', 'manual', 'assessment', 'course_completion')),
    proficiency_level INTEGER CHECK (proficiency_level BETWEEN 1 AND 5), -- 1=grundläggande, 5=expert
    confidence_score DECIMAL(3,2), -- hur säker är vi på denna skill? (AI-extraktion)
    verified BOOLEAN DEFAULT FALSE, -- användaren har bekräftat
    added_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, skill_id)
);

-- Index för snabb sökning
CREATE INDEX idx_job_skills_skill_id ON job_skills_required(skill_id);
CREATE INDEX idx_job_skills_job_id ON job_skills_required(job_id);
CREATE INDEX idx_user_skill_profile_user_id ON user_skill_profile(user_id);
CREATE INDEX idx_user_skill_profile_skill_id ON user_skill_profile(skill_id);
```

### 1.2 Gap-Score Algoritm

```typescript
interface SkillGap {
  skillId: string;
  skillName: string;
  gapScore: number;          // 0-100, högre = större gap
  priority: 'critical' | 'high' | 'medium' | 'low';
  jobDemand: number;         // antal jobb som kräver
  userHasIt: boolean;
  proficiencyDelta: number;  // skillnaden mellan krav och användarens nivå
}

/**
 * Beräknar kompetensgap mellan användare och målyrke
 * 
 * Formel: gap_score = (importance × demand × recency) - (user_proficiency × confidence)
 */
function calculateSkillGap(
  userSkills: UserSkillProfile[],
  targetJobSkills: JobSkillRequired[],
  userCareerGoal: string
): SkillGap[] {
  
  const gaps: SkillGap[] = [];
  
  for (const jobSkill of targetJobSkills) {
    const userSkill = userSkills.find(us => us.skill_id === jobSkill.skill_id);
    
    // Grundberäkning
    const importance = jobSkill.importance_score;  // 0.0 - 1.0
    const demand = normalizeDemand(jobSkill.frequency_in_ads);  // 0.0 - 1.0
    const recency = getRecencyMultiplier(jobSkill.extracted_at);  // nyare data = viktigare
    
    // Beräkna gap
    let gapScore: number;
    
    if (!userSkill) {
      // Användaren har inte alls kompetensen
      gapScore = (importance * 0.4 + demand * 0.4 + recency * 0.2) * 100;
    } else {
      // Användaren har kompetensen men kanske på lägre nivå
      const userProficiency = (userSkill.proficiency_level || 3) / 5;  // normalisera till 0-1
      const confidence = userSkill.confidence_score || 0.7;
      const proficiencyDelta = Math.max(0, importance - userProficiency);
      
      gapScore = proficiencyDelta * (importance * 0.5 + demand * 0.3 + recency * 0.2) * 100;
    }
    
    // Prioritera baserat på gap-score
    const priority = gapScore > 70 ? 'critical' : 
                    gapScore > 50 ? 'high' : 
                    gapScore > 30 ? 'medium' : 'low';
    
    gaps.push({
      skillId: jobSkill.skill_id,
      skillName: jobSkill.skill_name,
      gapScore: Math.round(gapScore),
      priority,
      jobDemand: jobSkill.frequency_in_ads,
      userHasIt: !!userSkill,
      proficiencyDelta: userSkill ? Math.max(0, importance - (userSkill.proficiency_level / 5)) : 1.0
    });
  }
  
  // Sortera efter gap-score (fallande)
  return gaps.sort((a, b) => b.gapScore - a.gapScore);
}

// Hjälpfunktion: Normalisera efterfrågan
function normalizeDemand(frequency: number): number {
  // Logaritmisk skalning för att hantera stora skillnader
  return Math.min(1.0, Math.log10(frequency + 1) / 3);
}

// Hjälpfunktion: Recency-multiplier (nyare data är mer relevant)
function getRecencyMultiplier(extractedAt: Date): number {
  const daysAgo = (Date.now() - extractedAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysAgo < 30) return 1.0;
  if (daysAgo < 90) return 0.9;
  if (daysAgo < 180) return 0.75;
  return 0.6; // Data äldre än 6 månader
}
```

### 1.3 Synonymhantering

```typescript
/**
 * Normaliserar kompetensnamn för matchning
 * Använder AF Taxonomy API + intern synonym-databas
 */
class SkillNormalizer {
  private synonymMap: Map<string, string> = new Map();
  
  constructor() {
    // Ladda synonymer från skill_taxonomy-tabellen
    this.loadSynonyms();
  }
  
  async normalize(skillName: string): Promise<string> {
    // 1. Konvertera till gemener och ta bort extra mellanslag
    const normalized = skillName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s-]/g, '');
    
    // 2. Kolla om vi har en direkt match i synonymer
    if (this.synonymMap.has(normalized)) {
      return this.synonymMap.get(normalized)!;
    }
    
    // 3. Fuzzy match med Levenshtein-distance (typo-tolerans)
    const fuzzyMatch = await this.fuzzyMatch(normalized);
    if (fuzzyMatch.score > 0.85) {
      return fuzzyMatch.canonicalSkill;
    }
    
    // 4. Om ingen match, skapa ny normaliserad variant
    return this.createSlug(normalized);
  }
  
  private createSlug(name: string): string {
    return name
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  }
  
  // Exempel på synonymer som ska laddas
  private synonymExamples = {
    'excel': 'microsoft-excel',
    'kalkylblad': 'microsoft-excel',
    'spreadsheet': 'microsoft-excel',
    'word': 'microsoft-word',
    'powerpoint': 'microsoft-powerpoint',
    'ppt': 'microsoft-powerpoint',
    'js': 'javascript',
    'py': 'python',
    'react.js': 'react',
    'node.js': 'nodejs',
    'c#': 'csharp',
    'c++': 'cpp',
    'agilt': 'agile',
    'scrum-master': 'scrum',
    'projektledning': 'project-management',
    'ledarskap': 'leadership',
    'kundservice': 'customer-service',
    'sälj': 'sales'
  };
}
```

---

## 2️⃣ KURSMATCHNING

### 2.1 Databasstruktur för Kurser

```sql
-- ============================================
-- TABELL: Kurser (från olika providers)
-- ============================================
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Grundinformation
    title TEXT NOT NULL,
    description TEXT,
    provider TEXT NOT NULL, -- 'LinkedIn Learning', 'Coursera', 'Pluralsight', 'YouTube', etc.
    provider_course_id TEXT, -- ID hos provider
    url TEXT NOT NULL,
    
    -- Innehållsklassificering
    skill_tags UUID[], -- kopplade skills från skill_taxonomy
    topics TEXT[], -- fria taggar för sökning
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    
    -- Format och längd
    duration_minutes INTEGER, -- total längd
    is_micro_learning BOOLEAN DEFAULT FALSE, -- < 30 min?
    format TEXT CHECK (format IN ('video', 'interactive', 'reading', 'quiz', 'project')),
    
    -- Kvalitetsmätning
    rating_average DECIMAL(2,1), -- 0.0 - 5.0
    rating_count INTEGER DEFAULT 0,
    completion_rate DECIMAL(3,2), -- andel som klarar kursen (0.0 - 1.0)
    
    -- Kostnad
    is_free BOOLEAN DEFAULT FALSE,
    cost_sek INTEGER, -- null = gratis
    has_certificate BOOLEAN DEFAULT FALSE,
    
    -- Energinivå (för användare med låg energi)
    energy_level_required INTEGER CHECK (energy_level_required BETWEEN 1 AND 5), -- 1=låg energi OK
    
    -- Metadata
    language TEXT DEFAULT 'sv',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ, -- när vi senast uppdaterade från provider
    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================
-- TABELL: Kurs ↔ Skill-koppling
-- ============================================
CREATE TABLE course_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skill_taxonomy(id) ON DELETE CASCADE,
    relevance_score DECIMAL(3,2), -- 0.0-1.0 hur relevant är skill för kursen
    is_primary_skill BOOLEAN DEFAULT FALSE, -- huvudkompetens eller sekundär?
    UNIQUE(course_id, skill_id)
);

-- ============================================
-- TABELL: Användarens kursinteraktioner
-- ============================================
CREATE TABLE user_course_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    
    -- Interaktionstyp
    interaction_type TEXT NOT NULL CHECK (interaction_type IN (
        'viewed',           -- sett i listan
        'clicked',          -- klickat för info
        'started',          -- påbörjat
        'progress_25',      -- 25% klar
        'progress_50',      -- 50% klar
        'progress_75',      -- 75% klar
        'completed',        -- 100% klar
        'abandoned',        -- övergivit (ej aktiv > 14 dagar)
        'liked',            -- tumme upp
        'disliked',         -- tumme ner
        'saved',            -- sparat för senare
        'shared'            -- delat med konsulent
    )),
    
    -- Metadata
    context TEXT, -- var sågs kursen? 'gap_analysis', 'recommendation', 'search'
    metadata JSONB, -- extra data (t.ex. hur långt i kursen)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, course_id, interaction_type)
);

-- Index för snabb sökning
CREATE INDEX idx_courses_skills ON courses USING GIN(skill_tags);
CREATE INDEX idx_courses_topics ON courses USING GIN(topics);
CREATE INDEX idx_courses_energy ON courses(energy_level_required);
CREATE INDEX idx_courses_micro ON courses(is_micro_learning) WHERE is_micro_learning = TRUE;
CREATE INDEX idx_user_course_interactions_user_id ON user_course_interactions(user_id);
CREATE INDEX idx_user_course_interactions_course_id ON user_course_interactions(course_id);
```

### 2.2 Kurs-Relevans-Score Algoritm

```typescript
interface CourseRecommendation {
  course: Course;
  relevanceScore: number;      // 0-100
  matchFactors: {
    gapRelevance: number;      // hur väl täcker den ett gap
    skillMatch: number;        // överlapp med användarens önskade skills
    difficultyFit: number;     // matchar nuvarande nivå
    timeFit: number;           // passar tidsbudget
    energyFit: number;         // passar energinivå
    qualityScore: number;      // kursens kvalitet
    costScore: number;         // kostnad (gratis = högre)
  };
  reason: string;              // förklaring till användaren: "Täcker ditt gap i Excel"
}

/**
 * Huvudalgoritm för kursrekommendationer
 * 
 * Formel: relevance = w₁×gap + w₂×skill + w₃×difficulty + w₄×time + w₅×energy + w₆×quality + w₇×cost
 */
function calculateCourseRelevance(
  course: Course,
  userProfile: UserProfile,
  skillGaps: SkillGap[],
  userSkills: UserSkillProfile[],
  interactionHistory: UserCourseInteraction[]
): CourseRecommendation {
  
  // Vikter (kan A/B-testas)
  const weights = {
    gapRelevance: 0.30,    // 30% - viktigast att täcka gap
    skillMatch: 0.15,      // 15% - matcha önskade skills
    difficultyFit: 0.10,   // 10% - rätt svårighetsgrad
    timeFit: 0.10,         // 10% - passa tidsbudget
    energyFit: 0.15,       // 15% - energianpassning (viktigt för vår målgrupp!)
    qualityScore: 0.15,    // 15% - kursens kvalitet
    costScore: 0.05        // 5% - gratis är bättre men inte avgörande
  };
  
  // 1. Gap-relevans: Hur många gap täcker kursen?
  const gapRelevance = calculateGapRelevance(course, skillGaps);
  
  // 2. Skill-match: Matchar kursen användarens sparade skills?
  const skillMatch = calculateSkillMatch(course, userSkills);
  
  // 3. Svårighetsanpassning
  const difficultyFit = calculateDifficultyFit(course, userProfile);
  
  // 4. Tidsanpassning (föredra kortare för användare med låg energi)
  const timeFit = calculateTimeFit(course, userProfile);
  
  // 5. Energianpassning (KÄLLKRITERIE för vår målgrupp)
  const energyFit = calculateEnergyFit(course, userProfile);
  
  // 6. Kvalitetsscore
  const qualityScore = calculateQualityScore(course);
  
  // 7. Kostnad (gratis = 1.0, betalda skalas)
  const costScore = course.is_free ? 1.0 : Math.max(0, 1 - (course.cost_sek || 0) / 5000);
  
  // 8. Diversifiering: Straffa för mycket liknande rekommendationer
  const diversityPenalty = calculateDiversityPenalty(course, interactionHistory);
  
  // Beräkna total score
  const relevanceScore = (
    gapRelevance * weights.gapRelevance +
    skillMatch * weights.skillMatch +
    difficultyFit * weights.difficultyFit +
    timeFit * weights.timeFit +
    energyFit * weights.energyFit +
    qualityScore * weights.qualityScore +
    costScore * weights.costScore
  ) * (1 - diversityPenalty);
  
  // Generera förklaring till användaren
  const reason = generateRecommendationReason(course, skillGaps, gapRelevance);
  
  return {
    course,
    relevanceScore: Math.round(relevanceScore * 100),
    matchFactors: {
      gapRelevance,
      skillMatch,
      difficultyFit,
      timeFit,
      energyFit,
      qualityScore,
      costScore
    },
    reason
  };
}

// === Hjälpfunktioner ===

function calculateGapRelevance(course: Course, skillGaps: SkillGap[]): number {
  if (!course.skill_tags || skillGaps.length === 0) return 0;
  
  let totalGapScore = 0;
  let matchedGaps = 0;
  
  for (const gap of skillGaps) {
    if (course.skill_tags.includes(gap.skillId)) {
      totalGapScore += gap.gapScore / 100; // normalisera till 0-1
      matchedGaps++;
    }
  }
  
  // Bonus för att täcka flera gap
  const coverageBonus = Math.min(0.2, matchedGaps * 0.05);
  
  return Math.min(1.0, totalGapScore / Math.max(1, matchedGaps) + coverageBonus);
}

function calculateEnergyFit(course: Course, userProfile: UserProfile): number {
  // Användarens energinivå (1-5, där 1 = väldigt låg energi)
  const userEnergy = userProfile.energy_level || 3;
  
  // Kursens energikrav (1-5, där 1 = låg energi krävs)
  const courseEnergy = course.energy_level_required || 3;
  
  // Mikro-learning är bättre för låg energi
  const microBonus = course.is_micro_learning ? 0.2 : 0;
  
  // Ju lägre användarens energi, desto viktigare att kursen kräver lite energi
  const fit = 1 - Math.abs(userEnergy - courseEnergy) / 5;
  
  return Math.min(1.0, fit + microBonus);
}

function calculateTimeFit(course: Course, userProfile: UserProfile): number {
  const preferredMaxTime = userProfile.preferred_session_length || 30; // minuter
  const courseDuration = course.duration_minutes || 60;
  
  // Perfekt match = 1.0, för lång = straff
  if (courseDuration <= preferredMaxTime) return 1.0;
  if (courseDuration <= preferredMaxTime * 2) return 0.7;
  if (courseDuration <= preferredMaxTime * 3) return 0.4;
  return 0.2;
}

function calculateQualityScore(course: Course): number {
  const ratingScore = (course.rating_average || 3) / 5; // normalisera till 0-1
  const completionScore = course.completion_rate || 0.5;
  
  // Viktat genomsnitt
  return ratingScore * 0.6 + completionScore * 0.4;
}

function generateRecommendationReason(course: Course, skillGaps: SkillGap[], relevance: number): string {
  const matchedGap = skillGaps.find(gap => course.skill_tags?.includes(gap.skillId));
  
  if (matchedGap && relevance > 0.5) {
    return `Täcker ditt kompetensgap i ${matchedGap.skillName}`;
  }
  
  if (course.is_micro_learning) {
    return `Kort kurs (${course.duration_minutes} min) för när du har lite energi`;
  }
  
  if (course.is_free) {
    return `Gratis kurs med bra betyg (${course.rating_average}/5)`;
  }
  
  return `Populär kurs bland liknande användare`;
}
```

---

## 3️⃣ PERSONALISERING

### 3.1 Hybrid Recommendation System

```typescript
/**
 * Hybrid recommender som kombinerar:
 * 1. Content-based (baserat på CV, mål, gap)
 * 2. Collaborative filtering (vad har liknande användare tagit?)
 * 3. Knowledge-based (konsulentens rekommendationer)
 */
class HybridRecommender {
  
  /**
   * Huvudmetod för att generera rekommendationer
   */
  async getRecommendations(
    userId: string,
    context: 'dashboard' | 'gap_analysis' | 'skill_page' | 'consultant_suggested',
    limit: number = 5
  ): Promise<CourseRecommendation[]> {
    
    const userProfile = await this.getUserProfile(userId);
    const skillGaps = await this.getSkillGaps(userId);
    const userSkills = await this.getUserSkills(userId);
    const interactionHistory = await this.getInteractionHistory(userId);
    
    // Samla kandidater från olika källor
    const candidates: Course[] = [];
    
    // 1. Content-based (60% vikt)
    const contentBased = await this.contentBasedFilter(userProfile, skillGaps, userSkills);
    candidates.push(...contentBased.slice(0, limit * 2));
    
    // 2. Collaborative filtering (30% vikt) - om vi har tillräckligt med data
    if (await this.hasEnoughCollaborativeData(userId)) {
      const collaborative = await this.collaborativeFilter(userId, skillGaps);
      candidates.push(...collaborative.slice(0, limit));
    }
    
    // 3. Trending/populära (10% vikt) - för diversitet
    const trending = await this.getTrendingCourses(userProfile.target_occupation);
    candidates.push(...trending.slice(0, 2));
    
    // 4. Konsulentens förslag (hög prioritet om finns)
    const consultantPicks = await this.getConsultantRecommendations(userId);
    
    // Beräkna relevans för alla kandidater
    const scoredCandidates = candidates.map(course => 
      calculateCourseRelevance(course, userProfile, skillGaps, userSkills, interactionHistory)
    );
    
    // Lägg till konsulentens förslag med boostad score
    for (const course of consultantPicks) {
      const rec = calculateCourseRelevance(course, userProfile, skillGaps, userSkills, interactionHistory);
      rec.relevanceScore = Math.min(100, rec.relevanceScore + 20); // Boost!
      rec.reason = `Rekommenderad av din konsulent`;
      scoredCandidates.push(rec);
    }
    
    // Sortera och returnera
    return scoredCandidates
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }
  
  /**
   * Content-based filtering - baserat på användarens profil
   */
  private async contentBasedFilter(
    userProfile: UserProfile,
    skillGaps: SkillGap[],
    userSkills: UserSkillProfile[]
  ): Promise<Course[]> {
    
    // Top skills att fokusera på
    const topGaps = skillGaps.slice(0, 5).map(g => g.skillId);
    const desiredSkills = userSkills.filter(s => s.status === 'interested').map(s => s.skill_id);
    
    const relevantSkillIds = [...new Set([...topGaps, ...desiredSkills])];
    
    // Hämta kurser som matchar dessa skills
    const courses = await db.query(`
      SELECT c.*, cs.relevance_score
      FROM courses c
      JOIN course_skills cs ON c.id = cs.course_id
      WHERE cs.skill_id = ANY($1)
        AND c.is_active = TRUE
        AND (c.energy_level_required <= $2 OR $2 IS NULL)
      ORDER BY cs.relevance_score DESC, c.rating_average DESC
      LIMIT 20
    `, [relevantSkillIds, userProfile.energy_level]);
    
    return courses;
  }
  
  /**
   * Collaborative filtering - vad har liknande användare tagit?
   */
  private async collaborativeFilter(
    userId: string,
    skillGaps: SkillGap[]
  ): Promise<Course[]> {
    
    // Hitta liknande användare (som har liknande gap)
    const similarUsers = await this.findSimilarUsers(userId, skillGaps);
    
    if (similarUsers.length < 5) {
      return []; // Inte tillräckligt med data
    }
    
    // Hämta kurser som liknande användare har klarat
    const courses = await db.query(`
      SELECT c.*, COUNT(*) as completion_count,
             AVG(CASE WHEN uci.user_id = $1 THEN 1 ELSE 0 END) as user_completed
      FROM user_course_interactions uci
      JOIN courses c ON uci.course_id = c.id
      WHERE uci.user_id = ANY($2)
        AND uci.interaction_type = 'completed'
        AND uci.user_id != $1  -- Inte användarens egna
        AND NOT EXISTS (
          -- Exkludera kurser användaren redan gjort
          SELECT 1 FROM user_course_interactions 
          WHERE user_id = $1 AND course_id = c.id AND interaction_type = 'completed'
        )
      GROUP BY c.id
      HAVING COUNT(*) >= 2  -- Minst 2 liknande användare har klarat
      ORDER BY completion_count DESC, c.rating_average DESC
      LIMIT 10
    `, [userId, similarUsers.map(u => u.userId)]);
    
    return courses;
  }
  
  /**
   * Hitta liknande användare baserat på kompetensgap och mål
   */
  private async findSimilarUsers(
    userId: string,
    skillGaps: SkillGap[]
  ): Promise<{userId: string, similarity: number}[]> {
    
    const gapSkillIds = skillGaps.slice(0, 10).map(g => g.skillId);
    const userGoal = await this.getUserCareerGoal(userId);
    
    const similarUsers = await db.query(`
      SELECT 
        usp.user_id,
        COUNT(DISTINCT usp.skill_id) as shared_skills,
        MAX(CASE WHEN cp.target_occupation = $3 THEN 1 ELSE 0 END) as same_goal
      FROM user_skill_profile usp
      LEFT JOIN career_paths cp ON usp.user_id = cp.user_id
      WHERE usp.skill_id = ANY($1)
        AND usp.user_id != $2
      GROUP BY usp.user_id
      HAVING COUNT(DISTINCT usp.skill_id) >= 3  -- Minst 3 gemensamma skills
      ORDER BY same_goal DESC, shared_skills DESC
      LIMIT 50
    `, [gapSkillIds, userId, userGoal]);
    
    return similarUsers.map(u => ({
      userId: u.user_id,
      similarity: u.same_goal ? u.shared_skills * 1.5 : u.shared_skills
    }));
  }
  
  /**
   * Cold start-hantering för nya användare
   */
  private async handleColdStart(userId: string): Promise<Course[]> {
    const userProfile = await this.getUserProfile(userId);
    
    // Om användaren har en karriärmål, använd det
    if (userProfile.target_occupation) {
      return await this.getPopularCoursesForOccupation(userProfile.target_occupation);
    }
    
    // Annars fråga om intressen (från intresseguiden)
    const interestResults = await this.getInterestResults(userId);
    if (interestResults) {
      return await this.getCoursesForHollandCode(interestResults.holland_code);
    }
    
    // Sista utväg: populära kurser generellt
    return await this.getGenerallyPopularCourses();
  }
  
  /**
   * Kolla om vi har tillräckligt med data för collaborative filtering
   */
  private async hasEnoughCollaborativeData(userId: string): Promise<boolean> {
    const result = await db.query(`
      SELECT COUNT(*) as interaction_count
      FROM user_course_interactions
      WHERE user_id = $1
    `, [userId]);
    
    // Kräv minst 3 interaktioner för att hitta liknande användare
    return result[0].interaction_count >= 3;
  }
}
```

### 3.2 Cold Start Strategier

```typescript
/**
 * Strategier för nya användare utan historik
 */
class ColdStartStrategy {
  
  /**
   * Steg 1: Snabb profilering (max 3 frågor)
   */
  async quickOnboardingQuiz(userId: string): Promise<QuickProfile> {
    const questions = [
      {
        id: 'energy_level',
        question: 'Hur mycket ork har du för att lära dig nya saker just nu?',
        options: [
          { value: 1, label: 'Väldigt lite - jag behöver korta, enkla aktiviteter' },
          { value: 3, label: 'Lagom - jag klarar av 30-60 minuter i taget' },
          { value: 5, label: 'Mycket - jag kan fokusera i flera timmar' }
        ]
      },
      {
        id: 'learning_goal',
        question: 'Vad vill du uppnå?',
        options: [
          { value: 'job_now', label: 'Hitta jobb så snart som möjligt' },
          { value: 'career_change', label: 'Byta karriär' },
          { value: 'skill_up', label: 'Utveckla mina nuvarande kompetenser' },
          { value: 'explore', label: 'Utforska olika möjligheter' }
        ]
      },
      {
        id: 'time_available',
        question: 'Hur mycket tid kan du lägga per vecka?',
        options: [
          { value: 2, label: 'Max 2 timmar' },
          { value: 5, label: '2-5 timmar' },
          { value: 10, label: '5-10 timmar' },
          { value: 20, label: 'Mer än 10 timmar' }
        ]
      }
    ];
    
    return { questions };
  }
  
  /**
   * Steg 2: Generera första rekommendationer baserat på snabb-profil
   */
  async generateInitialRecommendations(
    userId: string,
    quickProfile: QuickProfileAnswers
  ): Promise<CourseRecommendation[]> {
    
    const recommendations: CourseRecommendation[] = [];
    
    // 1. Alltid rekommendera "Komma igång"-kurser för låg energi
    if (quickProfile.energy_level <= 2) {
      const lowEnergyCourses = await this.getMicroLearningStarters();
      recommendations.push(...lowEnergyCourses);
    }
    
    // 2. Baserat på mål
    switch (quickProfile.learning_goal) {
      case 'job_now':
        const jobSearchCourses = await this.getJobSearchEssentials();
        recommendations.push(...jobSearchCourses);
        break;
        
      case 'career_change':
        const careerCourses = await this.getCareerExplorationCourses();
        recommendations.push(...careerCourses);
        break;
        
      case 'skill_up':
        // Be om CV för att analysera nuvarande skills
        const cvSkills = await this.extractSkillsFromCV(userId);
        const skillCourses = await this.getSkillBuildingCourses(cvSkills);
        recommendations.push(...skillCourses);
        break;
    }
    
    // 3. Baserat på tillgänglig tid
    const maxDuration = quickProfile.time_available <= 2 ? 30 : 
                       quickProfile.time_available <= 5 ? 60 : 120;
    
    recommendations = recommendations.filter(r => 
      (r.course.duration_minutes || 60) <= maxDuration
    );
    
    return recommendations.slice(0, 5);
  }
  
  /**
   * Steg 3: Utforska mode - när användaren inte vet vad de vill
   */
  async getExplorationPaths(): Promise<ExplorationPath[]> {
    return [
      {
        id: 'digital_basics',
        title: 'Digitala grunder',
        description: 'Lär dig grunderna i Office, e-post och internet',
        icon: '💻',
        courseCount: 5,
        estimatedHours: 8
      },
      {
        id: 'communication',
        title: 'Kommunikation',
        description: 'Skriv tydligt, presentera muntligt, ge feedback',
        icon: '🗣️',
        courseCount: 4,
        estimatedHours: 6
      },
      {
        id: 'job_search',
        title: 'Söka jobb',
        description: 'CV, personligt brev, intervjuteknik, nätverk',
        icon: '🔍',
        courseCount: 6,
        estimatedHours: 10
      },
      {
        id: 'wellbeing',
        title: 'Välmående på jobbet',
        description: 'Stresshantering, arbetslivsbalans, återhämtning',
        icon: '🌱',
        courseCount: 3,
        estimatedHours: 4
      }
    ];
  }
}
```

---

## 4️⃣ FRAMGÅNGSMÄTNING

### 4.1 Databasstruktur för Effektmätning

```sql
-- ============================================
-- TABELL: Kursutfall och effektmätning
-- ============================================
CREATE TABLE course_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    
    -- Utfallsmätning
    completed_at TIMESTAMPTZ,
    time_spent_minutes INTEGER, -- faktisk tid (kan skilja sig från kurslängd)
    self_reported_skill_gain INTEGER CHECK (self_reported_skill_gain BETWEEN 1 AND 5),
    
    -- Långsiktiga utfall
    applied_to_job BOOLEAN DEFAULT FALSE, -- har sökt jobb där kursen nämndes
    got_interview BOOLEAN DEFAULT FALSE,
    got_job BOOLEAN DEFAULT FALSE,
    job_acquired_within_months INTEGER, -- hur snabbt fick jobb efter kursen
    
    -- Feedback
    rating_given INTEGER CHECK (rating_given BETWEEN 1 AND 5),
    would_recommend BOOLEAN,
    review_text TEXT,
    
    -- Spårning
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, course_id)
);

-- ============================================
-- TABELL: Lärandets påverkan på jobbsökning
-- ============================================
CREATE TABLE learning_job_impact (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Tidigare data (före kurser)
    baseline_cv_score INTEGER, -- ATS-score innan
    baseline_skill_count INTEGER,
    
    -- Efter kurser
    post_learning_cv_score INTEGER,
    post_learning_skill_count INTEGER,
    
    -- Jobbutfall
    jobs_applied_before INTEGER,
    jobs_applied_after INTEGER,
    interview_rate_before DECIMAL(3,2), -- % av ansökningar som ledde till intervju
    interview_rate_after DECIMAL(3,2),
    
    -- Tidsaspekter
    time_to_first_interview_days INTEGER,
    time_to_job_offer_days INTEGER,
    
    measured_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELL: Algoritmprestanda
-- ============================================
CREATE TABLE recommendation_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    algorithm_version TEXT NOT NULL, -- t.ex. "v2.3-content-collab"
    
    -- Kontext
    user_segment TEXT, -- 'low_energy', 'career_changer', 'job_seeker'
    
    -- Mätvärden
    recommendations_shown INTEGER,
    clicks INTEGER,
    starts INTEGER,
    completions INTEGER,
    
    -- Konvertering
    click_through_rate DECIMAL(3,2), -- clicks / shown
    start_rate DECIMAL(3,2), -- starts / clicks
    completion_rate DECIMAL(3,2), -- completions / starts
    job_outcome_rate DECIMAL(3,2), -- fick jobb / completions
    
    -- Användarnöjdhet
    avg_rating DECIMAL(2,1),
    
    measured_period_start DATE,
    measured_period_end DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index för analys
CREATE INDEX idx_course_outcomes_user_id ON course_outcomes(user_id);
CREATE INDEX idx_course_outcomes_course_id ON course_outcomes(course_id);
CREATE INDEX idx_course_outcomes_got_job ON course_outcomes(got_job) WHERE got_job = TRUE;
CREATE INDEX idx_rec_perf_version ON recommendation_performance(algorithm_version);
```

### 4.2 Effektmätningsalgoritmer

```typescript
/**
 * Beräknar hur effektiv en kurs är för att få jobb
 */
class CourseEffectivenessAnalyzer {
  
  /**
   * Beräkna kursens "jobb-success-rate"
   */
  async calculateCourseJobSuccessRate(courseId: string): Promise<CourseEffectiveness> {
    
    const outcomes = await db.query(`
      SELECT 
        COUNT(*) as total_completions,
        SUM(CASE WHEN got_job = TRUE THEN 1 ELSE 0 END) as job_wins,
        SUM(CASE WHEN got_interview = TRUE THEN 1 ELSE 0 END) as interviews,
        AVG(time_to_job_offer_days) as avg_days_to_job,
        AVG(self_reported_skill_gain) as avg_skill_gain
      FROM course_outcomes
      WHERE course_id = $1 AND completed_at IS NOT NULL
    `, [courseId]);
    
    const result = outcomes[0];
    
    // Jämför med baseline (användare som INTE tagit kursen)
    const baseline = await this.getBaselineSuccessRate();
    
    const jobSuccessRate = result.total_completions > 0 
      ? result.job_wins / result.total_completions 
      : 0;
    
    const lift = jobSuccessRate / baseline.jobSuccessRate;
    
    return {
      courseId,
      totalCompletions: parseInt(result.total_completions),
      jobSuccessRate: Math.round(jobSuccessRate * 100),
      interviewRate: parseInt(result.total_completions) > 0 
        ? Math.round((result.interviews / result.total_completions) * 100)
        : 0,
      avgDaysToJob: Math.round(result.avg_days_to_job) || null,
      avgSkillGain: Math.round(result.avg_skill_gain * 10) / 10 || null,
      lift: Math.round(lift * 100) / 100, // 1.0 = samma som baseline, 2.0 = dubbelt så bra
      isStatisticallySignificant: parseInt(result.total_completions) >= 30 // Minst 30 datapunkter
    };
  }
  
  /**
   * Korrelationsanalys: Vilka kurser leder till jobb?
   */
  async correlationAnalysis(): Promise<CorrelationResult[]> {
    
    // Cohort-analys: jämför användare som tagit kurser vs inte
    const analysis = await db.query(`
      WITH course_takers AS (
        SELECT DISTINCT user_id
        FROM course_outcomes
        WHERE completed_at IS NOT NULL
          AND completed_at > NOW() - INTERVAL '6 months'
      ),
      user_outcomes AS (
        SELECT 
          p.id as user_id,
          CASE WHEN ct.user_id IS NOT NULL THEN TRUE ELSE FALSE END as took_courses,
          COUNT(DISTINCT ja.id) as job_applications,
          SUM(CASE WHEN ja.status = 'ACCEPTED' THEN 1 ELSE 0 END) as job_offers
        FROM profiles p
        LEFT JOIN course_takers ct ON p.id = ct.user_id
        LEFT JOIN job_applications ja ON p.id = ja.user_id
          AND ja.applied_at > NOW() - INTERVAL '6 months'
        WHERE p.created_at > NOW() - INTERVAL '12 months'
        GROUP BY p.id, ct.user_id
      )
      SELECT 
        took_courses,
        COUNT(*) as user_count,
        AVG(job_applications) as avg_applications,
        AVG(job_offers) as avg_job_offers,
        SUM(CASE WHEN job_offers > 0 THEN 1 ELSE 0 END)::FLOAT / COUNT(*) as success_rate
      FROM user_outcomes
      GROUP BY took_courses
    `);
    
    return analysis.map(row => ({
      group: row.took_courses ? 'Course Takers' : 'No Courses',
      userCount: parseInt(row.user_count),
      avgApplications: Math.round(row.avg_applications * 10) / 10,
      avgJobOffers: Math.round(row.avg_job_offers * 10) / 10,
      successRate: Math.round(row.success_rate * 100)
    }));
  }
  
  /**
   * Prediktiv modell: Vilka användare är på väg att få jobb?
   */
  async predictJobSuccess(userId: string): Promise<JobSuccessPrediction> {
    
    const userMetrics = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM course_outcomes 
         WHERE user_id = $1 AND completed_at IS NOT NULL) as courses_completed,
        (SELECT AVG(self_reported_skill_gain) FROM course_outcomes 
         WHERE user_id = $1) as avg_skill_gain,
        (SELECT COUNT(*) FROM user_skill_profile 
         WHERE user_id = $1) as skills_count,
        (SELECT COUNT(*) FROM job_applications 
         WHERE user_id = $1 AND applied_at > NOW() - INTERVAL '3 months') as recent_applications,
        (SELECT COUNT(*) FROM saved_jobs 
         WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 month') as jobs_saved
    `, [userId]);
    
    const m = userMetrics[0];
    
    // Enkel poängmodell (kan ersättas med ML)
    const score = 
      (parseInt(m.courses_completed) * 5) +
      (parseFloat(m.avg_skill_gain || 0) * 10) +
      (parseInt(m.skills_count) * 2) +
      (parseInt(m.recent_applications) * 3) +
      (parseInt(m.jobs_saved) * 1);
    
    // Kategorisera
    let prediction: 'high' | 'medium' | 'low';
    let confidence: number;
    
    if (score > 50) {
      prediction = 'high';
      confidence = Math.min(0.9, 0.5 + (score - 50) / 100);
    } else if (score > 25) {
      prediction = 'medium';
      confidence = 0.5;
    } else {
      prediction = 'low';
      confidence = Math.max(0.3, 0.5 - (25 - score) / 50);
    }
    
    return {
      userId,
      score,
      prediction, // sannolikhet för jobb inom 3 månader
      confidence,
      factors: {
        coursesImpact: parseInt(m.courses_completed) * 5,
        skillsImpact: parseInt(m.skills_count) * 2,
        activityImpact: (parseInt(m.recent_applications) * 3) + (parseInt(m.jobs_saved) * 1)
      },
      recommendations: this.generatePredictiveRecommendations(prediction, m)
    };
  }
  
  private generatePredictiveRecommendations(
    prediction: 'high' | 'medium' | 'low',
    metrics: any
  ): string[] {
    const recs: string[] = [];
    
    if (prediction === 'low') {
      if (parseInt(metrics.courses_completed) < 2) {
        recs.push('Påbörja fler kurser för att stärka din profil');
      }
      if (parseInt(metrics.recent_applications) < 3) {
        recs.push('Öka takten i jobbsökningen - sök minst 3 jobb i veckan');
      }
    } else if (prediction === 'medium') {
      recs.push('Du är på rätt väg! Fortsätt med dina kurser och ansökningar');
      if (parseFloat(metrics.avg_skill_gain || 0) < 3) {
        recs.push('Fokusera på kurser med högre praktiskt värde');
      }
    } else {
      recs.push('Bra jobbat! Din profil är stark - var inte rädd för att söka på mer avancerade positioner');
    }
    
    return recs;
  }
}
```

### 4.3 Feedback-loop för Algoritmen

```typescript
/**
 * Kontinuerlig förbättring av rekommendationsalgoritmen
 */
class AlgorithmFeedbackLoop {
  
  /**
   * Daglig uppdatering av kursranking baserat på utfall
   */
  async updateCourseRankings(): Promise<void> {
    
    // Hämta alla kurser med tillräckligt data
    const courses = await db.query(`
      SELECT course_id
      FROM course_outcomes
      WHERE completed_at IS NOT NULL
      GROUP BY course_id
      HAVING COUNT(*) >= 10
    `);
    
    for (const { course_id } of courses) {
      const effectiveness = await this.analyzer.calculateCourseJobSuccessRate(course_id);
      
      // Uppdatera kursens "quality score" baserat på verkliga utfall
      await db.query(`
        UPDATE courses
        SET 
          effectiveness_score = $1,
          job_success_rate = $2,
          updated_at = NOW()
        WHERE id = $3
      `, [
        effectiveness.lift,
        effectiveness.jobSuccessRate,
        course_id
      ]);
    }
  }
  
  /**
   * Veckovis algoritmjustering
   */
  async weeklyAlgorithmReview(): Promise<AlgorithmAdjustment> {
    
    // Jämför senaste veckan med föregående
    const comparison = await db.query(`
      SELECT 
        algorithm_version,
        AVG(click_through_rate) as avg_ctr,
        AVG(completion_rate) as avg_completion,
        AVG(job_outcome_rate) as avg_job_success
      FROM recommendation_performance
      WHERE measured_period_end > NOW() - INTERVAL '2 weeks'
      GROUP BY algorithm_version
    `);
    
    const current = comparison.find(c => c.algorithm_version === CURRENT_VERSION);
    const previous = comparison.find(c => c.algorithm_version !== CURRENT_VERSION);
    
    // Identifiera problem
    const issues: string[] = [];
    
    if (current.avg_ctr < previous?.avg_ctr * 0.9) {
      issues.push('CTR sjunker - rekommendationerna är mindre relevanta');
    }
    
    if (current.avg_completion < 0.3) {
      issues.push('Låg completion rate - kurser är för svåra eller för långa');
    }
    
    // Generera förslag
    const suggestions: string[] = [];
    
    if (issues.length > 0) {
      suggestions.push('Öka vikten på energy_fit för lågenergianvändare');
      suggestions.push('A/B-testa att visa färre men mer relevanta kurser');
    }
    
    return { issues, suggestions };
  }
  
  /**
   * Månatlig algoritmrevision
   */
  async monthlyAlgorithmRevision(): Promise<RevisionReport> {
    
    // 1. Segmentprestanda
    const segmentPerformance = await db.query(`
      SELECT 
        user_segment,
        AVG(job_outcome_rate) as job_success,
        AVG(completion_rate) as completion
      FROM recommendation_performance
      WHERE measured_period_end > NOW() - INTERVAL '1 month'
      GROUP BY user_segment
    `);
    
    // 2. Identifiera underpresterande segment
    const underperforming = segmentPerformance.filter(
      s => s.job_success < 0.1 || s.completion < 0.2
    );
    
    // 3. Generera åtgärdsförslag
    const actions: string[] = [];
    
    for (const segment of underperforming) {
      if (segment.user_segment === 'low_energy') {
        actions.push('Öka andelen mikro-learning för lågenergianvändare');
        actions.push('Inför "energimätare" som visar kursens energikrav');
      }
      if (segment.user_segment === 'career_changer') {
        actions.push('Förbättra gap-analys för karriärväxling');
        actions.push('Lägg till "brobyggande" kurser mellan yrken');
      }
    }
    
    return {
      segmentPerformance,
      underperformingSegments: underperforming.map(s => s.user_segment),
      recommendedActions: actions,
      nextRevisionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
  }
}
```

---

## 5️⃣ REKOMMENDATIONSFREKVENS OCH UI

### 5.1 Rekommendationsstrategi

```typescript
/**
 * Konfiguration för rekommendationsvisning
 */
const RECOMMENDATION_CONFIG = {
  dashboard: {
    maxItems: 3,
    refreshFrequency: 'daily', // ändras dagligen
    layout: 'horizontal_cards',
    priority: 'high_relevance_only', // bara score > 70
    showReason: true
  },
  
  dedicated_page: {
    maxItems: 10,
    refreshFrequency: 'on_interaction',
    layout: 'vertical_list_with_filters',
    priority: 'mixed', // balanserat mellan olika källor
    showReason: true,
    enableFiltering: true,
    enableSorting: true
  },
  
  gap_analysis: {
    maxItems: 5,
    refreshFrequency: 'on_gap_change',
    layout: 'gap_aligned', // en kurs per gap
    priority: 'gap_focused',
    showReason: true,
    showGapConnection: true // visa pil: "Täcker detta gap →"
  },
  
  notification: {
    maxItems: 1,
    frequency: 'max_twice_weekly',
    timing: 'optimal_engagement', // ML-baserad tidpunkt
    content: 'single_high_impact' // bara det mest relevanta
  }
};

/**
 * Hanterar "överväldigande" - förhindrar för många alternativ
 */
class OverwhelmPrevention {
  
  /**
   * Bestämmer hur många kurser som ska visas baserat på användarens tillstånd
   */
  async getOptimalNumberOfRecommendations(userId: string): Promise<number> {
    
    const userState = await this.assessUserState(userId);
    
    // Anpassa efter energinivå
    if (userState.energyLevel === 'very_low') {
      return 1; // Bara det absolut bästa valet
    }
    if (userState.energyLevel === 'low') {
      return 2;
    }
    
    // Anpassa efter beslutsutmattning
    if (userState.decisionsMadeToday > 10) {
      return 2; // Färre val sent på dagen
    }
    
    // Standard
    return 3;
  }
  
  /**
   * Sorteringsstrategi för att minska beslutsångest
   */
  sortForDecisionEase(recommendations: CourseRecommendation[]): CourseRecommendation[] {
    
    // 1. Ta bort för lika alternativ (diversifiering)
    const diversified = this.removeTooSimilar(recommendations);
    
    // 2. Sortera så att bästa valet kommer först men inte "för perfekt"
    // (lite utmaning är OK)
    return diversified.sort((a, b) => {
      // Om skillnaden är liten (< 10 poäng), slumpa ordningen lite
      if (Math.abs(a.relevanceScore - b.relevanceScore) < 10) {
        return Math.random() - 0.5;
      }
      return b.relevanceScore - a.relevanceScore;
    });
  }
  
  /**
   * Markera "enkla" val för användare med låg energi
   */
  markEasyChoices(recommendations: CourseRecommendation[]): EnrichedRecommendation[] {
    return recommendations.map(rec => ({
      ...rec,
      easeIndicators: {
        isQuick: (rec.course.duration_minutes || 60) <= 15,
        isFree: rec.course.is_free,
        noPrerequisites: !rec.course.prerequisites || rec.course.prerequisites.length === 0,
        highCompletionRate: (rec.course.completion_rate || 0) > 0.7
      },
      recommendedFor: this.getRecommendedFor(rec)
    }));
  }
  
  private getRecommendedFor(rec: CourseRecommendation): string[] {
    const tags: string[] = [];
    
    if (rec.course.is_micro_learning) tags.push('lite_tid');
    if (rec.course.energy_level_required <= 2) tags.push('lite_energi');
    if (rec.course.is_free) tags.push('gratis');
    if (rec.matchFactors.gapRelevance > 0.8) tags.push('täcker_viktigt_gap');
    
    return tags;
  }
}
```

---

## 6️⃣ KPI:ER OCH DASHBOARDS

### 6.1 Rekommenderade KPI:er

```typescript
/**
 * KPI-definitioner för Mikro-Lärande Hub
 */
const LEARNING_HUB_KPIS = {
  
  // === ENGAGEMANG ===
  engagement: {
    clickThroughRate: {
      name: 'CTR (Click-Through Rate)',
      formula: 'clicks / recommendations_shown',
      target: '> 15%',
      frequency: 'daily'
    },
    courseStartRate: {
      name: 'Kursstartfrekvens',
      formula: 'starts / clicks',
      target: '> 40%',
      frequency: 'daily'
    },
    completionRate: {
      name: 'Fullföljandegrad',
      formula: 'completions / starts',
      target: '> 35%',
      frequency: 'weekly'
    },
    timeToStart: {
      name: 'Tid till start',
      formula: 'avg(hours between recommendation and start)',
      target: '< 48h',
      frequency: 'weekly'
    }
  },
  
  // === RELEVANS ===
  relevance: {
    averageRelevanceScore: {
      name: 'Genomsnittlig relevans',
      formula: 'avg(relevance_score of clicked courses)',
      target: '> 75',
      frequency: 'daily'
    },
    userSatisfaction: {
      name: 'Användarnöjdhet',
      formula: 'avg(rating_given)',
      target: '> 4.0 / 5',
      frequency: 'weekly'
    },
    negativeFeedbackRate: {
      name: 'Andel tumme ner',
      formula: 'dislikes / total_feedback',
      target: '< 10%',
      frequency: 'weekly'
    }
  },
  
  // === AFFÄRSVÄRDE (VIKTIGAST) ===
  businessValue: {
    courseToJobConversion: {
      name: 'Kurs → Jobb konvertering',
      formula: 'users_got_job / course_completions',
      target: '> 15%',
      frequency: 'monthly',
      description: 'Andel användare som får jobb inom 6 månader efter kurs'
    },
    skillGapClosure: {
      name: 'Kompetensgap-täckning',
      formula: 'gaps_closed / total_gaps_identified',
      target: '> 30%',
      frequency: 'monthly'
    },
    timeToEmployment: {
      name: 'Tid till anställning',
      formula: 'avg(days from first course to job offer)',
      target: '< 120 dagar',
      frequency: 'monthly',
      comparison: 'vs users without courses'
    },
    learningROI: {
      name: 'ROI på lärande',
      formula: '(avg_salary_increase for course_takers) / (time_invested * hourly_value)',
      target: '> 300%',
      frequency: 'quarterly'
    }
  },
  
  // === SEGMENTSPECIFIKA ===
  segments: {
    lowEnergyEngagement: {
      name: 'Engagemang låg energi',
      formula: 'completion_rate for energy_level <= 2',
      target: '> 25%',
      description: 'Särskilt viktigt för vår målgrupp'
    },
    careerChangerSuccess: {
      name: 'Karriärväxlare framgång',
      formula: 'job_in_new_field / total_career_changers',
      target: '> 20%'
    }
  },
  
  // === ALGORITM ===
  algorithm: {
    coverage: {
      name: 'Algoritmtäckning',
      formula: 'users_with_recommendations / active_users',
      target: '> 90%'
    },
    diversity: {
      name: 'Rekommendationsdiversitet',
      formula: 'unique_courses_recommended / total_recommendations',
      target: '0.3 - 0.7',
      description: 'För hög = för rörigt, för låg = för tråkigt'
    },
    coldStartResolution: {
      name: 'Cold start-lösning',
      formula: 'new_users_with_recommendations / new_users',
      target: '> 95% within 24h'
    }
  }
};
```

### 6.2 SQL för Dashboards

```sql
-- ============================================
-- DAGLIG ENGAGEMANGSDASHBOARD
-- ============================================
CREATE VIEW daily_engagement_dashboard AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(DISTINCT user_id) as active_users,
    
    -- CTR
    COUNT(CASE WHEN interaction_type = 'clicked' THEN 1 END)::FLOAT / 
        NULLIF(COUNT(CASE WHEN interaction_type = 'viewed' THEN 1 END), 0) as ctr,
    
    -- Start rate
    COUNT(CASE WHEN interaction_type = 'started' THEN 1 END)::FLOAT / 
        NULLIF(COUNT(CASE WHEN interaction_type = 'clicked' THEN 1 END), 0) as start_rate,
    
    -- Completion rate (veckofördröjning)
    COUNT(CASE WHEN interaction_type = 'completed' THEN 1 END)::FLOAT / 
        NULLIF(COUNT(CASE WHEN interaction_type = 'started' THEN 1 END), 0) as completion_rate
        
FROM user_course_interactions
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- ============================================
-- KURS-EFFEKTIVITETS-RANKING
-- ============================================
CREATE VIEW course_effectiveness_ranking AS
SELECT 
    c.id,
    c.title,
    c.provider,
    COUNT(co.id) as total_completions,
    
    -- Jobbframgång
    SUM(CASE WHEN co.got_job = TRUE THEN 1 ELSE 0 END)::FLOAT / 
        NULLIF(COUNT(co.id), 0) * 100 as job_success_rate,
    
    -- Intervjufrekvens
    SUM(CASE WHEN co.got_interview = TRUE THEN 1 ELSE 0 END)::FLOAT / 
        NULLIF(COUNT(co.id), 0) * 100 as interview_rate,
    
    -- Användarnöjdhet
    AVG(co.rating_given) as avg_rating,
    
    -- Lift jämfört med baseline
    (SUM(CASE WHEN co.got_job = TRUE THEN 1 ELSE 0 END)::FLOAT / 
        NULLIF(COUNT(co.id), 0)) / 
        (SELECT SUM(CASE WHEN got_job = TRUE THEN 1 ELSE 0 END)::FLOAT / 
            NULLIF(COUNT(*), 0) FROM course_outcomes) as lift

FROM courses c
LEFT JOIN course_outcomes co ON c.id = co.course_id
WHERE co.completed_at IS NOT NULL
GROUP BY c.id, c.title, c.provider
HAVING COUNT(co.id) >= 10  -- Minst 10 för statistisk signifikans
ORDER BY job_success_rate DESC;

-- ============================================
-- SEGMENTANALYS
-- ============================================
CREATE VIEW user_segment_analysis AS
WITH user_segments AS (
    SELECT 
        p.id as user_id,
        CASE 
            WHEN ug.current_streak > 7 THEN 'highly_engaged'
            WHEN ug.current_streak > 0 THEN 'moderately_engaged'
            ELSE 'at_risk'
        END as engagement_segment,
        COALESCE(
            (SELECT AVG(energy_level_required) FROM courses c 
             JOIN user_course_interactions uci ON c.id = uci.course_id 
             WHERE uci.user_id = p.id),
            3
        ) as avg_course_energy
    FROM profiles p
    LEFT JOIN user_gamification ug ON p.id = ug.user_id
)
SELECT 
    engagement_segment,
    CASE 
        WHEN avg_course_energy <= 2 THEN 'low_energy_user'
        WHEN avg_course_energy >= 4 THEN 'high_energy_user'
        ELSE 'medium_energy_user'
    END as energy_segment,
    COUNT(*) as user_count,
    AVG((SELECT COUNT(*) FROM course_outcomes co WHERE co.user_id = us.user_id AND co.got_job = TRUE))::FLOAT /
        NULLIF(AVG((SELECT COUNT(*) FROM course_outcomes co WHERE co.user_id = us.user_id)), 0) as job_success_rate
FROM user_segments us
GROUP BY engagement_segment, energy_segment;
```

---

## 7️⃣ A/B-TEST FÖRSLAG

### 7.1 Prioriterade Test

```typescript
/**
 * A/B-test plan för Mikro-Lärande Hub
 */
const AB_TEST_PLAN = [
  {
    id: 'test-001',
    name: 'Antal rekommendationer',
    hypothesis: 'Färre alternativ leder till högre konvertering för lågenergianvändare',
    variants: [
      { name: 'control', count: 5 },
      { name: 'fewer', count: 3 },
      { name: 'minimal', count: 1 }
    ],
    segment: 'energy_level <= 2',
    metrics: ['click_through_rate', 'start_rate', 'completion_rate'],
    duration: '2 weeks',
    sampleSize: 200
  },
  
  {
    id: 'test-002',
    name: 'Förklaringstext',
    hypothesis: 'Specifika förklaringar ökar click-through mer än generiska',
    variants: [
      { name: 'generic', text: 'Rekommenderad för dig' },
      { name: 'gap', text: 'Täcker ditt gap i {skill_name}' },
      { name: 'social', text: '{X} liknande användare har tagit denna' },
      { name: 'outcome', text: '{Y}% som tagit denna har fått jobb' }
    ],
    metrics: ['click_through_rate', 'user_satisfaction'],
    duration: '3 weeks',
    sampleSize: 500
  },
  
  {
    id: 'test-003',
    name: 'Sortering',
    hypothesis: 'Energi-anpassad sortering ökar completion rate',
    variants: [
      { name: 'relevance', sortBy: 'relevance_score' },
      { name: 'energy', sortBy: 'energy_level_required ASC' },
      { name: 'duration', sortBy: 'duration_minutes ASC' },
      { name: 'hybrid', sortBy: 'weighted(relevance, energy_fit)' }
    ],
    segment: 'energy_level <= 2',
    metrics: ['start_rate', 'completion_rate'],
    duration: '2 weeks',
    sampleSize: 300
  },
  
  {
    id: 'test-004',
    name: 'Konsulent-involvering',
    hypothesis: 'Konsulentens rekommendationer får högre prioritet',
    variants: [
      { name: 'standard', consultantBoost: 0 },
      { name: 'badge', consultantBoost: 0, showBadge: true },
      { name: 'boost', consultantBoost: 20 },
      { name: 'top', consultantBoost: 100 } // alltid först
    ],
    metrics: ['click_through_rate', 'completion_rate', 'user_satisfaction'],
    duration: '4 weeks',
    sampleSize: 400
  },
  
  {
    id: 'test-005',
    name: 'Gap-visualisering',
    hypothesis: 'Visuell koppling mellan gap och kurs ökar motivation',
    variants: [
      { name: 'list', showGapConnection: false },
      { name: 'connected', showGapConnection: true, style: 'arrow' },
      { name: 'progress', showGapConnection: true, style: 'progress_bar' }
    ],
    metrics: ['start_rate', 'completion_rate', 'skillGapClosure'],
    duration: '3 weeks',
    sampleSize: 400
  },
  
  {
    id: 'test-006',
    name: 'Cold start onboarding',
    hypothesis: 'Färre frågor i onboarding ökar aktivering',
    variants: [
      { name: 'detailed', questions: 8 },
      { name: 'standard', questions: 5 },
      { name: 'minimal', questions: 3 },
      { name: 'none', questions: 0, useDefault: true }
    ],
    metrics: ['onboarding_completion', 'first_course_start', '7_day_retention'],
    duration: '4 weeks',
    sampleSize: 600
  }
];

/**
 * Testanalys
 */
class ABTestAnalyzer {
  
  async analyzeTest(testId: string): Promise<TestResult> {
    const test = AB_TEST_PLAN.find(t => t.id === testId);
    
    // Hämta data för varje variant
    const variantResults = await Promise.all(
      test.variants.map(async v => {
        const metrics = await this.calculateMetrics(testId, v.name, test.metrics);
        return { variant: v.name, metrics };
      })
    );
    
    // Statistisk signifikans
    const control = variantResults.find(v => v.variant === 'control');
    const winner = this.findWinner(control, variantResults.filter(v => v !== control));
    
    return {
      testId,
      variantResults,
      winner: winner?.variant,
      confidence: winner?.confidence,
      recommendation: winner ? `Implementera variant "${winner.variant}"` : 'Fortsätt testa'
    };
  }
  
  private findWinner(control: VariantResult, variants: VariantResult[]): Winner | null {
    // Enkel t-test för signifikans
    let bestVariant = null;
    let highestConfidence = 0;
    
    for (const variant of variants) {
      const improvement = (variant.metrics.ctr - control.metrics.ctr) / control.metrics.ctr;
      const confidence = this.calculateConfidence(control, variant);
      
      if (improvement > 0.1 && confidence > 0.95 && confidence > highestConfidence) {
        bestVariant = variant;
        highestConfidence = confidence;
      }
    }
    
    return bestVariant ? { variant: bestVariant.variant, confidence: highestConfidence } : null;
  }
}
```

---

## 8️⃣ ITERATIONSPLAN

### 8.1 Fasindelning

```
FAS 1: MVP (Vecka 1-4)
───────────────────────
✓ Databasstruktur för kurser och interaktioner
✓ Enkel content-based filtering (CV → skills → courses)
✓ Gap-analys med grundläggande matching
✓ Dashboard-widget: 3 rekommendationer
✓ Grundläggande KPI-tracking

Mätvärden att nå:
- CTR > 10%
- 50+ kurser i databasen
- 100% av användare får rekommendationer

FAS 2: FÖRBÄTTRAD PERSONALISERING (Vecka 5-8)
─────────────────────────────────────────────
✓ Synonymhantering för kompetenser
✓ Energy-level anpassning
✓ Cold-start strategi
✓ Mikro-learning identifiering
✓ A/B-test framework

Mätvärden att nå:
- CTR > 15%
- Completion rate > 25%
- A/B-test pågår för 3 hypoteser

FAS 3: AVANCERAD REKOMMENDATION (Vecka 9-12)
────────────────────────────────────────────
✓ Collaborative filtering
✓ Hybrid-algoritm (content + collaborative)
✓ Feedback-loop implementerad
✓ Prediktiv modell för jobbsuccess
✓ Konsulent-dashboard med insikter

Mätvärden att nå:
- Jobbsuccess rate > 10% för kurs-takers
- Relevance score > 75
- 3+ A/B-tester avslutade med signifikanta resultat

FAS 4: OPTIMERING OCH SKALNING (Vecka 13+)
──────────────────────────────────────────
✓ ML-baserad rekommendation (ersätt heuristics)
✓ Real-time learning (algoritmen uppdateras kontinuerligt)
✓ Segment-specifika modeller
✓ Integration med fler kursproviders

Mätvärden att nå:
- Jobbsuccess rate > 15%
- CTR > 20%
- Completion rate > 35%
- ROI > 300%
```

### 8.2 Månatlig Gransknings-Checklista

```markdown
## Data Analyst - Månatlig Granskning

### Algoritmprestanda
- [ ] CTR trend över tid
- [ ] Completion rate per segment
- [ ] Relevance score distribution
- [ ] Algoritmversion jämförelse

### Affärsvärde
- [ ] Kurs → Jobb konvertering
- [ ] Tid till anställning (med vs utan kurser)
- [ ] Löneutveckling för kurs-takers
- [ ] Konsulent-feedback på rekommendationer

### Användarupplevelse
- [ ] Enkätresultat om rekommendationer
- [ ] Heatmaps på rekommendationssektionen
- [ ] Vanligaste sökningar (vad hittar användare inte?)
- [ ] Avhopp vid kursstart (varför?)

### Datakvalitet
- [ ] Täckning i skill_taxonomy
- [ ] Kursdata freshness
- [ ] Missing data i user profiles
- [ ] Outliers i interaktionsdata

### Åtgärder
- [ ] Prioriterade A/B-tester för nästa månad
- [ ] Algoritmjusteringar baserat på data
- [ ] Nya kurser att lägga till
- [ ] Segment som behöver extra uppmärksamhet
```

---

## 9️⃣ SQL MIGRATION - FULL IMPLEMENTATION

```sql
-- ============================================
-- MIKRO-LÄRANDE HUB - KOMPLETT DATABASSTRUKTUR
-- ============================================

-- 1. KOMPETENS-TAXONOMI
CREATE TABLE skill_taxonomy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_name TEXT NOT NULL UNIQUE,
    skill_slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL CHECK (category IN ('technical', 'soft', 'certification', 'language', 'industry')),
    ssyk_code TEXT,
    af_concept_id TEXT,
    synonyms TEXT[] DEFAULT '{}',
    related_skills UUID[] DEFAULT '{}',
    frequency_rank INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. JOBB-KOMPETENSER (från AF API)
CREATE TABLE job_skills_required (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id TEXT NOT NULL,
    skill_id UUID REFERENCES skill_taxonomy(id),
    skill_name TEXT NOT NULL,
    importance_score DECIMAL(3,2) DEFAULT 0.5,
    frequency_in_ads INTEGER DEFAULT 1,
    extracted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(job_id, skill_id)
);

-- 3. ANVÄNDARENS KOMPETENSPROFIL
CREATE TABLE user_skill_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skill_taxonomy(id),
    skill_name TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('cv', 'manual', 'assessment', 'course_completion')),
    proficiency_level INTEGER CHECK (proficiency_level BETWEEN 1 AND 5),
    confidence_score DECIMAL(3,2) DEFAULT 0.7,
    verified BOOLEAN DEFAULT FALSE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, skill_id)
);

-- 4. KURSER
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    provider TEXT NOT NULL,
    provider_course_id TEXT,
    url TEXT NOT NULL,
    skill_tags UUID[] DEFAULT '{}',
    topics TEXT[] DEFAULT '{}',
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    duration_minutes INTEGER,
    is_micro_learning BOOLEAN DEFAULT FALSE,
    format TEXT CHECK (format IN ('video', 'interactive', 'reading', 'quiz', 'project')),
    rating_average DECIMAL(2,1),
    rating_count INTEGER DEFAULT 0,
    completion_rate DECIMAL(3,2),
    is_free BOOLEAN DEFAULT FALSE,
    cost_sek INTEGER,
    has_certificate BOOLEAN DEFAULT FALSE,
    energy_level_required INTEGER CHECK (energy_level_required BETWEEN 1 AND 5) DEFAULT 3,
    effectiveness_score DECIMAL(3,2) DEFAULT 1.0,
    job_success_rate INTEGER DEFAULT 0,
    language TEXT DEFAULT 'sv',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

-- 5. KURS ↔ SKILL KOPPLING
CREATE TABLE course_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skill_taxonomy(id) ON DELETE CASCADE,
    relevance_score DECIMAL(3,2) DEFAULT 0.5,
    is_primary_skill BOOLEAN DEFAULT FALSE,
    UNIQUE(course_id, skill_id)
);

-- 6. ANVÄNDARINTERAKTIONER
CREATE TABLE user_course_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN (
        'viewed', 'clicked', 'started', 'progress_25', 'progress_50', 
        'progress_75', 'completed', 'abandoned', 'liked', 'disliked', 'saved', 'shared'
    )),
    context TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id, interaction_type)
);

-- 7. KURSUTFALL
CREATE TABLE course_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ,
    time_spent_minutes INTEGER,
    self_reported_skill_gain INTEGER CHECK (self_reported_skill_gain BETWEEN 1 AND 5),
    applied_to_job BOOLEAN DEFAULT FALSE,
    got_interview BOOLEAN DEFAULT FALSE,
    got_job BOOLEAN DEFAULT FALSE,
    job_acquired_within_months INTEGER,
    rating_given INTEGER CHECK (rating_given BETWEEN 1 AND 5),
    would_recommend BOOLEAN,
    review_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- 8. REKOMMENDATIONSPREFORMANCE
CREATE TABLE recommendation_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    algorithm_version TEXT NOT NULL DEFAULT 'v1.0',
    user_segment TEXT,
    recommendations_shown INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    starts INTEGER DEFAULT 0,
    completions INTEGER DEFAULT 0,
    click_through_rate DECIMAL(3,2),
    start_rate DECIMAL(3,2),
    completion_rate DECIMAL(3,2),
    job_outcome_rate DECIMAL(3,2),
    avg_rating DECIMAL(2,1),
    measured_period_start DATE,
    measured_period_end DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. KONSULENTREKOMMENDATIONER
CREATE TABLE consultant_course_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    reason TEXT,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(consultant_id, participant_id, course_id)
);

-- INDEX
CREATE INDEX idx_skill_taxonomy_slug ON skill_taxonomy(skill_slug);
CREATE INDEX idx_job_skills_job_id ON job_skills_required(job_id);
CREATE INDEX idx_job_skills_skill_id ON job_skills_required(skill_id);
CREATE INDEX idx_user_skill_profile_user_id ON user_skill_profile(user_id);
CREATE INDEX idx_courses_skills ON courses USING GIN(skill_tags);
CREATE INDEX idx_courses_energy ON courses(energy_level_required);
CREATE INDEX idx_courses_micro ON courses(is_micro_learning) WHERE is_micro_learning = TRUE;
CREATE INDEX idx_user_course_interactions_user_id ON user_course_interactions(user_id);
CREATE INDEX idx_user_course_interactions_course_id ON user_course_interactions(course_id);
CREATE INDEX idx_course_outcomes_user_id ON course_outcomes(user_id);
CREATE INDEX idx_course_outcomes_got_job ON course_outcomes(got_job) WHERE got_job = TRUE;

-- RLS
ALTER TABLE skill_taxonomy ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_skills_required ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skill_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_course_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultant_course_recommendations ENABLE ROW LEVEL SECURITY;

-- Policies (alla kan läsa taxonomi och kurser, bara egna data kan skrivas)
CREATE POLICY "Public read skill taxonomy" ON skill_taxonomy FOR SELECT USING (true);
CREATE POLICY "Public read courses" ON courses FOR SELECT USING (is_active = true);
CREATE POLICY "Users manage own skill profile" ON user_skill_profile FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own interactions" ON user_course_interactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own outcomes" ON course_outcomes FOR SELECT USING (auth.uid() = user_id);

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_skill_profile_updated_at BEFORE UPDATE ON user_skill_profile FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_outcomes_updated_at BEFORE UPDATE ON course_outcomes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- SEED DATA - Exempelkompetenser
INSERT INTO skill_taxonomy (skill_name, skill_slug, category, synonyms) VALUES
('Microsoft Excel', 'microsoft-excel', 'technical', ARRAY['Excel', 'Kalkylblad', 'Spreadsheet']),
('Microsoft Word', 'microsoft-word', 'technical', ARRAY['Word', 'Textbehandling']),
('Python', 'python', 'technical', ARRAY['Py', 'Python programming']),
('JavaScript', 'javascript', 'technical', ARRAY['JS', 'JavaScript programming']),
('Projektledning', 'project-management', 'soft', ARRAY['Projektledare', 'Project management']),
('Kommunikation', 'communication', 'soft', ARRAY['Kommunikationsförmåga', 'Kommunikativ']),
('Kundservice', 'customer-service', 'soft', ARRAY['Kundbemötande', 'Kundsupport']),
('Svenska', 'swedish-language', 'language', ARRAY['Svenska språket']),
('Engelska', 'english-language', 'language', ARRAY['English']);

-- SEED DATA - Exempelkurser
INSERT INTO courses (title, provider, url, duration_minutes, is_micro_learning, is_free, energy_level_required, difficulty_level) VALUES
('Excel Grundkurs - Del 1', 'LinkedIn Learning', 'https://linkedin.com/learning/excel-grund', 15, true, false, 2, 'beginner'),
('Excel Grundkurs - Del 2', 'LinkedIn Learning', 'https://linkedin.com/learning/excel-grund-2', 20, true, false, 2, 'beginner'),
('Kommunikation på jobbet', 'YouTube', 'https://youtube.com/watch/comm', 25, true, true, 1, 'beginner'),
('Python för nybörjare', 'Coursera', 'https://coursera.org/python', 120, false, true, 4, 'beginner'),
('Projektledning A-Ö', 'Pluralsight', 'https://pluralsight.com/proj', 180, false, false, 3, 'intermediate');

COMMENT ON TABLE courses IS 'Kurser för Mikro-Lärande Hub';
COMMENT ON TABLE user_course_interactions IS 'Spårar alla användarinteraktioner med kurser';
COMMENT ON TABLE course_outcomes IS 'Mäter långsiktiga utfall av kurstagande';
```

---

## 📋 SAMMANFATTNING

### Prioriterade Åtgärder

| Prioritet | Åtgärd | Impact | Effort |
|-----------|--------|--------|--------|
| P0 | Implementera databasstruktur | Hög | Låg |
| P0 | Grundläggande gap-analys | Hög | Medel |
| P1 | Content-based rekommendationer | Hög | Medel |
| P1 | Energy-level anpassning | Mycket hög* | Låg |
| P2 | A/B-test framework | Medel | Medel |
| P2 | Cold-start strategi | Hög | Medel |
| P3 | Collaborative filtering | Medel | Hög |
| P3 | Prediktiv modell | Hög | Hög |

*Särskilt viktigt för vår målgrupp med långtidsarbetslöshet

### Framgångskriterier

1. **30 dagar:** Alla användare får personliga rekommendationer
2. **60 dagar:** CTR > 15%, completion rate > 25%
3. **90 dagar:** Kurs → Jobb konvertering > 10%
4. **180 dagar:** Algoritmen har lärt sig och förbättrats baserat på feedback

---

*Analys framtagen av Data Analyst*  
*Deltagarportalen - 2026-03-09*
