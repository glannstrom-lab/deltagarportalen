/**
 * Smart Job Matching Service
 * Prediktiv jobbmatchning med semantisk analys
 */

export interface JobMatch {
  jobId: string
  title: string
  company: string
  location?: string
  description: string
  matchScore: number // 0-100
  semanticScore: number // 0-100
  keywordScore: number // 0-100
  reasoning: string
  skillGaps: string[]
  matchingSkills: string[]
  similarJobs?: string[] // Närliggande yrken att utforska
}

export interface SkillRecommendation {
  skill: string
  currentLevel?: 'beginner' | 'intermediate' | 'advanced'
  targetLevel: 'intermediate' | 'advanced' | 'expert'
  impact: 'high' | 'medium' | 'low'
  jobsUnlocked: number
  estimatedTime: string
  resources: string[]
}

// Nyckelord för olika yrkeskategorier
const occupationKeywords: Record<string, string[]> = {
  'utvecklare': ['javascript', 'typescript', 'react', 'node', 'python', 'java', 'sql', 'git', 'api', 'cloud'],
  'designer': ['figma', 'adobe', 'ui', 'ux', 'sketch', 'prototyping', 'user research', 'visual design'],
  'sjuksköterska': ['vård', 'patient', 'medicin', 'omvårdnad', 'hälsa', 'diagnos', 'behandling'],
  'lärare': ['pedagogik', 'undervisning', 'barn', 'elever', 'skola', 'utbildning', 'klassrum'],
  'ekonom': ['bokföring', 'redovisning', 'excel', 'budget', 'analys', 'finans', 'skatt'],
  'säljare': ['försäljning', 'kund', 'relation', 'mål', 'resultat', 'förhandling', 'kommunikation'],
}

// Semantiska relationer mellan yrken
const semanticRelations: Record<string, string[]> = {
  'frontend-utvecklare': ['backend-utvecklare', 'fullstack-utvecklare', 'ux-designer', 'devops-engineer'],
  'backend-utvecklare': ['frontend-utvecklare', 'fullstack-utvecklare', 'devops-engineer', 'systemarkitekt'],
  'sjuksköterska': ['undersköterska', 'läkare', 'vårdbiträde', ' specialistsjuksköterska'],
  'lärare': ['förskollärare', 'specialpedagog', 'rektor', 'skolledare'],
  'säljare': ['account manager', 'key account manager', 'försäljningschef', 'marknadsförare'],
  'kundtjänstmedarbetare': ['kundservice', 'support', 'kundrådgivare', 'försäljare'],
}

/**
 * Beräkna semantisk matchning mellan CV och jobb
 */
export function calculateSemanticMatch(
  cvText: string,
  jobDescription: string
): { score: number; matchingKeywords: string[]; missingKeywords: string[] } {
  const cvWords = extractKeywords(cvText.toLowerCase())
  const jobWords = extractKeywords(jobDescription.toLowerCase())
  
  const matchingKeywords: string[] = []
  const missingKeywords: string[] = []
  
  jobWords.forEach(word => {
    if (cvWords.includes(word) || cvWords.some(cvWord => isSimilar(word, cvWord))) {
      matchingKeywords.push(word)
    } else {
      missingKeywords.push(word)
    }
  })
  
  const score = jobWords.length > 0 
    ? Math.round((matchingKeywords.length / jobWords.length) * 100)
    : 0
  
  return { score, matchingKeywords, missingKeywords }
}

/**
 * Extrahera nyckelord från text
 */
function extractKeywords(text: string): string[] {
  // Enkel implementation - kan förbättras med NLP
  const commonWords = new Set(['och', 'eller', 'att', 'det', 'är', 'en', 'på', 'som', 'för', 'med', 'av', 'till', 'den', 'de', 'vi', 'ni', 'du', 'jag', 'man', 'ett', 'i', 'om', 'men', 'så', 'när', 'var', 'hur', 'vad', 'vem', 'varför', 'vilken', 'vilket', 'vilka'])
  
  return text
    .replace(/[^\w\såäöÅÄÖ]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.has(word))
}

/**
 * Kolla om två ord är liknande (förenklad implementation)
 */
function isSimilar(word1: string, word2: string): boolean {
  // Exakta matchningar
  if (word1 === word2) return true
  
  // Innehåller ena ordet det andra
  if (word1.includes(word2) || word2.includes(word1)) return true
  
  // Vanliga variationer
  const variations: Record<string, string[]> = {
    'javascript': ['js', 'ecmascript'],
    'typescript': ['ts'],
    'react': ['reactjs', 'react.js'],
    'python': ['py'],
    'sjuksköterska': ['sköterska', 'sjuksyster', 'rnt'],
    'lärare': ['pedagog', 'lärarinna', 'lärarexamen'],
  }
  
  for (const [base, variants] of Object.entries(variations)) {
    const allForms = [base, ...variants]
    if (allForms.includes(word1) && allForms.includes(word2)) return true
  }
  
  return false
}

/**
 * Hitta närliggande yrken baserat på semantiska relationer
 */
export function findSimilarOccupations(occupation: string): string[] {
  const normalized = occupation.toLowerCase()
  
  for (const [key, related] of Object.entries(semanticRelations)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return related
    }
  }
  
  return []
}

/**
 * Analysera kompetensgap
 */
export function analyzeSkillGaps(
  userSkills: string[],
  requiredSkills: string[]
): { gaps: string[]; matching: string[]; recommendations: SkillRecommendation[] } {
  const gaps: string[] = []
  const matching: string[] = []
  
  requiredSkills.forEach(skill => {
    const hasSkill = userSkills.some(userSkill => 
      isSimilar(skill.toLowerCase(), userSkill.toLowerCase())
    )
    if (hasSkill) {
      matching.push(skill)
    } else {
      gaps.push(skill)
    }
  })
  
  // Generera rekommendationer för gaps
  const recommendations: SkillRecommendation[] = gaps.slice(0, 5).map(skill => ({
    skill,
    targetLevel: 'intermediate',
    impact: gaps.indexOf(skill) < 2 ? 'high' : 'medium',
    jobsUnlocked: Math.floor(Math.random() * 10) + 5, // Simulerat värde
    estimatedTime: Math.floor(Math.random() * 4 + 2) + ' veckor',
    resources: [
      'Online-kurs på Coursera',
      'Övningar på LinkedIn Learning',
      'Praktiska projekt'
    ]
  }))
  
  return { gaps, matching, recommendations }
}

/**
 * Förutse framtida matchningar baserat på nuvarande skills
 */
export function predictFutureMatches(
  currentSkills: string[],
  potentialNewSkill: string
): { 
  currentMatchCount: number
  predictedMatchCount: number
  newJobsUnlocked: string[]
} {
  // Simulerad prediktion
  const baseMatches = Math.floor(Math.random() * 20) + 10
  const newMatches = Math.floor(Math.random() * 15) + baseMatches
  
  const newJobsUnlocked = [
    'Senior ' + potentialNewSkill + ' Specialist',
    potentialNewSkill + ' Konsult',
    potentialNewSkill + ' Team Lead'
  ]
  
  return {
    currentMatchCount: baseMatches,
    predictedMatchCount: newMatches,
    newJobsUnlocked
  }
}

/**
 * Hitta bästa jobbmatchningar
 */
export function findBestJobMatches(
  userProfile: {
    cvText: string
    skills: string[]
    interests: string[]
    riasecScores?: Record<string, number>
  },
  jobs: Array<{
    id: string
    title: string
    company: string
    description: string
    requiredSkills: string[]
  }>
): JobMatch[] {
  return jobs.map(job => {
    // Semantisk matchning
    const semanticMatch = calculateSemanticMatch(userProfile.cvText, job.description)
    
    // Skill-matchning
    const skillAnalysis = analyzeSkillGaps(userProfile.skills, job.requiredSkills)
    const skillScore = Math.round((skillAnalysis.matching.length / job.requiredSkills.length) * 100)
    
    // Kombinerad score
    const combinedScore = Math.round(
      semanticMatch.score * 0.4 + 
      skillScore * 0.6
    )
    
    // Generera reasoning
    let reasoning = ''
    if (combinedScore >= 80) {
      reasoning = `Utmärkt matchning! Du har ${skillAnalysis.matching.length} av ${job.requiredSkills.length} efterfrågade kompetenser.`
    } else if (combinedScore >= 60) {
      reasoning = `God matchning. Du har flera relevanta kompetenser men kan behöva utveckla vissa områden.`
    } else {
      reasoning = `Grundläggande matchning. Detta kan vara en möjlighet att lära dig nya saker.`
    }
    
    // Hitta liknande jobb
    const similarJobs = findSimilarOccupations(job.title)
    
    return {
      jobId: job.id,
      title: job.title,
      company: job.company,
      description: job.description,
      matchScore: combinedScore,
      semanticScore: semanticMatch.score,
      keywordScore: skillScore,
      reasoning,
      skillGaps: skillAnalysis.gaps,
      matchingSkills: skillAnalysis.matching,
      similarJobs
    }
  }).sort((a, b) => b.matchScore - a.matchScore)
}

/**
 * Generera personlig jobbstrategi
 */
export function generateJobStrategy(
  userProfile: {
    topSkills: string[]
    experience: string[]
    interests: string[]
    location: string
  }
): {
  primaryStrategy: string
  secondaryStrategies: string[]
  targetCompanies: string[]
  timeline: string
} {
  const strategies = [
    'Fokusera på dina starkaste kompetenser och bygg portfolio',
    'Nätverka aktivt på LinkedIn och branschevent',
    'Sök brett men med kvalitet - anpassa varje ansökan',
    'Överväg att bredda din kompetens med online-kurser',
    'Kontakta bemanningsföretag för att få foten innanför dörren'
  ]
  
  return {
    primaryStrategy: strategies[0],
    secondaryStrategies: strategies.slice(1, 3),
    targetCompanies: [
      'Företag som värdesätter ' + userProfile.topSkills[0],
      'Växande startups inom ' + userProfile.interests[0],
      'Större etablerade företag i ' + userProfile.location
    ],
    timeline: 'Beräknad tid till första intervju: 2-4 veckor med konsekvent jobbsökning'
  }
}

export default {
  calculateSemanticMatch,
  findSimilarOccupations,
  analyzeSkillGaps,
  predictFutureMatches,
  findBestJobMatches,
  generateJobStrategy
}
