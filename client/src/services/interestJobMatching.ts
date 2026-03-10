/**
 * Interest to Job Matching - Fas 2
 * 
 * Kopplar samman intresseguideresultat med jobbsökning
 * för att visa relevanta jobbförslag baserat på användarens intressen.
 */

import type { PlatsbankenJob } from './arbetsformedlingenApi'

// ============================================
// TYPES
// ============================================

export interface RiasecScores {
  realistic: number
  investigative: number
  artistic: number
  social: number
  enterprising: number
  conventional: number
}

export interface JobInterestMatch {
  jobId: string
  job: PlatsbankenJob
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

// ============================================
// RIASEC TO JOB MAPPING
// ============================================

/**
 * Mappning av RIASEC-typer till yrkeskategorier och keywords
 */
const riasecJobMapping: Record<keyof RiasecScores, {
  occupationGroups: string[]
  keywords: string[]
}> = {
  realistic: {
    occupationGroups: [
      'Bygg och anläggning',
      'Tillverkning och produktion',
      'Transport och lager',
      'Lantbruk, skogsbruk och trädgård',
      'Mejeri och livsmedel'
    ],
    keywords: [
      'tekniker', 'mekaniker', 'elektriker', 'svetsare', 'montör',
      'bygg', 'snickare', 'målare', 'rörmokare', 'lantbruk',
      'fordon', 'maskin', 'underhåll', 'reparation', 'produktion',
      'lager', 'truck', 'logistik', 'distribution'
    ]
  },
  investigative: {
    occupationGroups: [
      'IT och data',
      'Forskning och utveckling',
      'Hälsa och sjukvård - specialister',
      'Teknik och naturvetenskap',
      'Ekonomi och analys'
    ],
    keywords: [
      'utvecklare', 'programmerare', 'analytiker', 'forskare', 'ingenjör',
      'system', 'data', 'analys', 'forskning', 'vetenskap',
      'mjukvara', 'kodning', 'algoritm', 'databas', 'nätverk',
      'laboratorium', 'testning', 'diagnos', 'utredning'
    ]
  },
  artistic: {
    occupationGroups: [
      'Media och journalistik',
      'Konst och design',
      'Marknadsföring och kommunikation',
      'Underhållning och evenemang',
      'Mode och textil'
    ],
    keywords: [
      'designer', 'grafiker', 'journalist', 'skribent', 'fotograf',
      'marknadsföring', 'kommunikation', 'kreativ', 'konst', 'design',
      'text', 'innehåll', 'sociala medier', 'pr', 'reklam',
      'illustration', 'animation', 'video', 'foto', 'layout'
    ]
  },
  social: {
    occupationGroups: [
      'Hälsa och sjukvård',
      'Pedagogik och undervisning',
      'Socialt arbete',
      'Kundservice och reception',
      'Hotell och restaurang'
    ],
    keywords: [
      'sjuksköterska', 'undersköterska', 'lärare', 'pedagog', 'socialsekreterare',
      'vård', 'omsorg', 'undervisning', 'barn', 'elever',
      'patient', 'kundservice', 'support', 'rådgivning', 'handledning',
      'restaurang', 'servering', 'hotell', 'reception', 'service'
    ]
  },
  enterprising: {
    occupationGroups: [
      'Försäljning och inköp',
      'Ledning och management',
      'Ekonomi och juridik',
      'Fastighet och säkerhet',
      'Företagande och entreprenörskap'
    ],
    keywords: [
      'säljare', 'account manager', 'chef', 'ledare', 'projektledare',
      'försäljning', 'affärer', 'kundrelationer', 'förhandling', 'strategi',
      'budget', 'resultat', 'tillväxt', 'marknad', 'nätverk',
      'entreprenör', 'företagande', 'konsult', 'rådgivare'
    ]
  },
  conventional: {
    occupationGroups: [
      'Kontor och administration',
      'Ekonomi och redovisning',
      'Lagar och myndigheter',
      'IT-support och drift',
      'Bank och försäkring'
    ],
    keywords: [
      'ekonom', 'redovisning', 'administratör', 'sekreterare', 'kontorist',
      'bokföring', 'fakturering', 'arkivering', 'dokumentation', 'rutiner',
      'kvalitet', 'kontroll', 'revision', 'beredning', 'registrering',
      'bank', 'försäkring', 'juridik', 'myndighet', 'offentlig'
    ]
  }
}

// ============================================
// MATCHING FUNCTIONS
// ============================================

/**
 * Identifiera de tre dominerande RIASEC-typerna
 */
function getDominantTypes(scores: RiasecScores): Array<{ type: string; score: number }> {
  return Object.entries(scores)
    .map(([type, score]) => ({ type, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

/**
 * Beräkna matchning mellan jobb och RIASEC-typer
 */
function calculateRiasecMatch(
  job: PlatsbankenJob,
  dominantTypes: Array<{ type: string; score: number }>
): { score: number; matchedTypes: string[] } {
  const jobText = `${job.headline} ${job.description?.text || ''}`.toLowerCase()
  let totalScore = 0
  const matchedTypes: string[] = []
  
  for (const { type, score } of dominantTypes) {
    const mapping = riasecJobMapping[type as keyof RiasecScores]
    let typeMatches = 0
    
    // Kolla keywords
    for (const keyword of mapping.keywords) {
      if (jobText.includes(keyword.toLowerCase())) {
        typeMatches++
      }
    }
    
    // Kolla yrkesgrupper
    const occupationType = job.occupation?.label || ''
    for (const group of mapping.occupationGroups) {
      if (occupationType.toLowerCase().includes(group.toLowerCase())) {
        typeMatches += 2 // Högre vikt för yrkesgrupp
      }
    }
    
    // Vikta poängen baserat på användarens RIASEC-score
    const weightedScore = (typeMatches * score * 100) / (mapping.keywords.length + mapping.occupationGroups.length * 2)
    totalScore += weightedScore
    
    if (typeMatches > 0) {
      matchedTypes.push(type)
    }
  }
  
  // Normalisera till 0-100
  const normalizedScore = Math.min(100, Math.round(totalScore / dominantTypes.length))
  
  return {
    score: normalizedScore,
    matchedTypes
  }
}

/**
 * Extrahera skills från jobbannons (förenklad version)
 */
function extractJobSkills(jobDescription: string): string[] {
  const skills = new Set<string>()
  const text = jobDescription.toLowerCase()
  
  const commonSkills = [
    'javascript', 'typescript', 'python', 'java', 'c#', 'react', 'angular', 'vue',
    'html', 'css', 'sql', 'git', 'docker', 'aws', 'azure', 'linux',
    'excel', 'powerpoint', 'word', 'sap', 'salesforce', 'office',
    'svenska', 'engelska', 'tyska', 'franska', 'spanska',
    'körkort', 'bil', 'truckkort', 'lyft', 'säkerhet'
  ]
  
  for (const skill of commonSkills) {
    if (text.includes(skill)) {
      skills.add(skill)
    }
  }
  
  return Array.from(skills)
}

/**
 * Beräkna keyword-matchning mellan jobb och användarens preferenser
 */
function calculateKeywordMatch(
  job: PlatsbankenJob,
  preferredRoles: string[]
): { score: number; matchedSkills: string[] } {
  const jobText = `${job.headline} ${job.description?.text || ''}`.toLowerCase()
  const matchedSkills: string[] = []
  let matches = 0
  
  // Kolla mot föredragna roller
  for (const role of preferredRoles) {
    const roleLower = role.toLowerCase()
    if (jobText.includes(roleLower)) {
      matches += 3 // Högre vikt för roll-match
      matchedSkills.push(role)
    }
  }
  
  // Extrahera och matcha skills från annonsen
  const jobSkills = extractJobSkills(job.description?.text || '')
  matches += jobSkills.length * 0.5
  matchedSkills.push(...jobSkills)
  
  // Beräkna score (max 100)
  const score = Math.min(100, Math.round((matches / (preferredRoles.length * 3 + 10)) * 100))
  
  return {
    score,
    matchedSkills: [...new Set(matchedSkills)] // Deduplicera
  }
}

// ============================================
// MAIN MATCHING FUNCTION
// ============================================

/**
 * Matcha jobb mot användarens intressen
 */
export function matchJobsToInterests(
  jobs: PlatsbankenJob[],
  riasecScores: RiasecScores,
  preferredRoles: string[] = []
): JobInterestMatch[] {
  const dominantTypes = getDominantTypes(riasecScores)
  
  const matches: JobInterestMatch[] = jobs.map(job => {
    const riasecMatch = calculateRiasecMatch(job, dominantTypes)
    const keywordMatch = calculateKeywordMatch(job, preferredRoles)
    
    // Vikta ihop till total score
    // RIASEC: 60%, Keywords: 40%
    const overallMatch = Math.round(
      (riasecMatch.score * 0.6) + (keywordMatch.score * 0.4)
    )
    
    return {
      jobId: job.id,
      job,
      overallMatch,
      riasecMatch,
      keywordMatch
    }
  })
  
  // Sortera efter matchningspoäng (högst först)
  return matches.sort((a, b) => b.overallMatch - a.overallMatch)
}

/**
 * Filtrera jobb baserat på matchningströskel
 */
export function filterJobsByMatchThreshold(
  matches: JobInterestMatch[],
  minThreshold: number = 50
): JobInterestMatch[] {
  return matches.filter(m => m.overallMatch >= minThreshold)
}

/**
 * Formatera matchningsresultat för visning
 */
export function formatMatchDescription(match: JobInterestMatch): string {
  const parts: string[] = []
  
  if (match.riasecMatch.matchedTypes.length > 0) {
    const typeNames = match.riasecMatch.matchedTypes.map(t => {
      switch (t) {
        case 'realistic': return 'Realistiskt'
        case 'investigative': return 'Undersökande'
        case 'artistic': return 'Konstnärligt'
        case 'social': return 'Socialt'
        case 'enterprising': return 'Företagsamt'
        case 'conventional': return 'Konventionellt'
        default: return t
      }
    })
    parts.push(typeNames.join(', '))
  }
  
  if (match.keywordMatch.matchedSkills.length > 0) {
    const skillCount = match.keywordMatch.matchedSkills.length
    parts.push(`${skillCount} matchande kompetenser`)
  }
  
  return parts.join(' • ') || 'Baserat på dina intressen'
}

// ============================================
// QUICK CHECKS
// ============================================

/**
 * Kolla snabbt om ett jobb matchar användarens intressen
 */
export function quickInterestMatch(
  job: PlatsbankenJob,
  riasecScores: RiasecScores
): { matches: boolean; score: number } {
  const dominantTypes = getDominantTypes(riasecScores)
  const riasecMatch = calculateRiasecMatch(job, dominantTypes)
  
  return {
    matches: riasecMatch.score >= 40,
    score: riasecMatch.score
  }
}
