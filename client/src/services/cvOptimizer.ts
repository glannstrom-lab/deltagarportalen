/**
 * CV Optimizer - Fas 2
 * 
 * Analyserar CV mot jobbannonser för att:
 * 1. Beräkna matchningspoäng
 * 2. Identifiera saknade keywords
 * 3. Ge förbättringsförslag
 */

import type { CVData } from './supabaseApi'

// ============================================
// TYPES
// ============================================

export interface KeywordMatch {
  word: string
  importance: 'high' | 'medium' | 'low'
  foundIn: 'skills' | 'experience' | 'summary' | 'missing'
  occurrences: number
}

export interface CVSuggestion {
  type: 'keyword' | 'length' | 'format' | 'achievement' | 'skills'
  message: string
  action?: string
  priority: 'high' | 'medium' | 'low'
}

export interface CVOptimizationResult {
  matchScore: number
  totalKeywords: number
  matchedKeywords: number
  missingKeywords: KeywordMatch[]
  suggestions: CVSuggestion[]
  sectionScores: {
    skills: number
    experience: number
    summary: number
    education: number
  }
}

// ============================================
// KEYWORD EXTRACTION
// ============================================

/**
 * Extrahera potentiella keywords från jobbannons
 */
function extractKeywords(jobDescription: string): Map<string, number> {
  const keywords = new Map<string, number>()
  
  // Rensa och normalisera text
  const cleanText = jobDescription
    .toLowerCase()
    .replace(/[^\w\sÅÄÖåäö]/g, ' ')
    .replace(/\s+/g, ' ')
  
  // Tekniska kompetenser och verktyg (hög prioritet)
  const technicalTerms = [
    // Programmering
    'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'ruby', 'php', 'go', 'rust',
    'swift', 'kotlin', 'scala', 'perl', 'r', 'matlab',
    
    // Frontend
    'react', 'vue', 'angular', 'svelte', 'html', 'css', 'sass', 'less', 'webpack',
    'vite', 'next.js', 'nuxt', 'gatsby', 'tailwind', 'bootstrap', 'material-ui',
    
    // Backend
    'node.js', 'express', 'django', 'flask', 'spring', 'laravel', 'rails', 'asp.net',
    'fastapi', 'nestjs', 'graphql', 'rest', 'api', 'microservices',
    
    // Databaser
    'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'firebase',
    'supabase', 'dynamodb', 'cassandra', 'neo4j',
    
    // DevOps/Cloud
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'gitlab', 'github actions',
    'terraform', 'ansible', 'nginx', 'apache', 'linux', 'unix',
    
    // Mobilt
    'react native', 'flutter', 'ionic', 'android', 'ios', 'xamarin', 'cordova',
    
    // Metoder
    'agil', 'scrum', 'kanban', 'devops', 'ci/cd', 'tdd', 'bdd', 'ddd',
    'lean', 'safe', 'extreme programming', 'pair programming',
    
    // Övrigt
    'git', 'jira', 'confluence', 'figma', 'sketch', 'adobe', 'photoshop',
    'illustrator', 'xd', 'invision', 'miro', 'notion', 'slack', 'teams'
  ]
  
  // Soft skills (medium prioritet)
  const softSkills = [
    'kommunikation', 'kommunikativ', 'samarbete', 'teamwork', 'ledarskap',
    'problemlösning', 'analytisk', 'kreativ', 'initiativtagande', 'självständig',
    'flexibel', 'anpassningsbar', 'strukturerad', 'ordningsam', 'noggrann',
    'resultatorienterad', 'målinriktad', 'kundorienterad', 'servicemedveten',
    'positiv', 'engagerad', 'driven', 'ambitiös', 'nyfiken', 'läraktig'
  ]
  
  // Yrkesroller (hög prioritet)
  const roles = [
    'utvecklare', 'developer', 'programmerare', 'kodare', 'arkitekt',
    'designer', 'ux', 'ui', 'grafiker', 'produktägare', 'product owner',
    'scrummaster', 'projektledare', 'projektledning', 'teamledare',
    'chef', 'manager', 'konsult', 'specialist', 'expert', 'analytiker',
    'analyst', 'testare', 'test', 'qa', 'support', 'drift', 'devops',
    'säljare', 'försäljning', 'marknadsföring', 'kommunikation', 'hr',
    'ekonom', 'redovisning', 'administration', 'kundservice', 'vård',
    'sjuksköterska', 'undersköterska', 'lärare', 'pedagog', 'montör',
    'tekniker', 'mekaniker', 'elektriker', 'bygg', 'snickare', 'målare'
  ]
  
  // Utbildningsnivåer
  const education = [
    'civilingenjör', 'högskoleingenjör', 'kandidatexamen', 'masterexamen',
    'doktorsexamen', 'phd', 'yrkeshögskola', 'yh', 'gymnasium',
    'eftergymnasial', 'akademisk', 'universitet', 'högskola'
  ]
  
  // Räkna förekomster
  const allTerms = [
    ...technicalTerms.map(t => ({ term: t, weight: 3 })),
    ...softSkills.map(t => ({ term: t, weight: 1 })),
    ...roles.map(t => ({ term: t, weight: 2 })),
    ...education.map(t => ({ term: t, weight: 2 }))
  ]
  
  for (const { term, weight } of allTerms) {
    const regex = new RegExp(`\\b${term}\\b`, 'gi')
    const matches = cleanText.match(regex)
    if (matches) {
      keywords.set(term, (matches.length * weight) + (keywords.get(term) || 0))
    }
  }
  
  // Extrahera även stora ord (potentiella egennamn/teknologier)
  const bigWords = cleanText
    .split(' ')
    .filter(w => w.length > 8 && !technicalTerms.includes(w))
    .reduce((acc, word) => {
      acc.set(word, (acc.get(word) || 0) + 1)
      return acc
    }, new Map<string, number>())
  
  // Lägg till stora ord med lägre vikt
  for (const [word, count] of bigWords) {
    if (count > 1) { // Måste förekomma minst 2 gånger
      keywords.set(word, (keywords.get(word) || 0) + count)
    }
  }
  
  return keywords
}

// ============================================
// CV ANALYSIS
// ============================================

/**
 * Sök efter keyword i CV
 */
function findKeywordInCV(
  keyword: string, 
  cv: CVData
): { foundIn: 'skills' | 'experience' | 'summary' | 'missing', occurrences: number } {
  const lowerKeyword = keyword.toLowerCase()
  let occurrences = 0
  
  // Kolla skills
  if (cv.skills?.some(s => s.toLowerCase().includes(lowerKeyword))) {
    return { foundIn: 'skills', occurrences: 1 }
  }
  
  // Kolla summary
  if (cv.summary?.toLowerCase().includes(lowerKeyword)) {
    occurrences = (cv.summary.toLowerCase().match(new RegExp(lowerKeyword, 'g')) || []).length
    return { foundIn: 'summary', occurrences }
  }
  
  // Kolla work experience
  if (cv.work_experience) {
    for (const exp of cv.work_experience) {
      const text = `${exp.title || ''} ${exp.description || ''}`.toLowerCase()
      if (text.includes(lowerKeyword)) {
        occurrences = (text.match(new RegExp(lowerKeyword, 'g')) || []).length
        return { foundIn: 'experience', occurrences }
      }
    }
  }
  
  // Kolla education
  if (cv.education) {
    for (const edu of cv.education) {
      const text = `${edu.degree || ''} ${edu.school || ''}`.toLowerCase()
      if (text.includes(lowerKeyword)) {
        return { foundIn: 'experience', occurrences: 1 }
      }
    }
  }
  
  return { foundIn: 'missing', occurrences: 0 }
}

/**
 * Beräkna section scores
 */
function calculateSectionScores(
  cv: CVData, 
  matchedKeywords: Map<string, KeywordMatch>
): CVOptimizationResult['sectionScores'] {
  const skillsMatches = Array.from(matchedKeywords.values()).filter(k => k.foundIn === 'skills').length
  const expMatches = Array.from(matchedKeywords.values()).filter(k => k.foundIn === 'experience').length
  const summaryMatches = Array.from(matchedKeywords.values()).filter(k => k.foundIn === 'summary').length
  
  return {
    skills: Math.min(100, skillsMatches * 20),
    experience: Math.min(100, expMatches * 15),
    summary: Math.min(100, summaryMatches * 25),
    education: cv.education && cv.education.length > 0 ? 100 : 30
  }
}

/**
 * Generera förbättringsförslag
 */
function generateSuggestions(
  cv: CVData,
  missingKeywords: KeywordMatch[],
  sectionScores: CVOptimizationResult['sectionScores']
): CVSuggestion[] {
  const suggestions: CVSuggestion[] = []
  
  // Saknade keywords (high priority)
  const highPriorityMissing = missingKeywords
    .filter(k => k.importance === 'high')
    .slice(0, 5)
  
  if (highPriorityMissing.length > 0) {
    const keywords = highPriorityMissing.map(k => `"${k.word}"`).join(', ')
    suggestions.push({
      type: 'keyword',
      message: `Lägg till dessa viktiga keywords från annonsen: ${keywords}`,
      action: 'Uppdatera din kompetenslista',
      priority: 'high'
    })
  }
  
  // Sammanfattning
  if (!cv.summary || cv.summary.length < 100) {
    suggestions.push({
      type: 'length',
      message: 'Din sammanfattning är för kort. Rekommenderat: 3-4 rader som beskriver vem du är.',
      action: 'Förläng sammanfattningen',
      priority: 'high'
    })
  }
  
  // Skills
  if (!cv.skills || cv.skills.length < 5) {
    suggestions.push({
      type: 'skills',
      message: `Du har ${cv.skills?.length || 0} kompetenser. Lägg till minst ${5 - (cv.skills?.length || 0)} till för bättre synlighet.`,
      action: 'Lägg till kompetenser',
      priority: 'medium'
    })
  }
  
  // Achievement-formuleringar
  if (sectionScores.experience < 60) {
    suggestions.push({
      type: 'achievement',
      message: 'Förbättra dina arbetsbeskrivningar med konkreta resultat (t.ex. "ökade försäljning med 25%").',
      action: 'Uppdatera erfarenheter',
      priority: 'medium'
    })
  }
  
  // Utbildning
  if (sectionScores.education < 50) {
    suggestions.push({
      type: 'format',
      message: 'Lägg till din utbildning för att komplettera profilen.',
      priority: 'low'
    })
  }
  
  return suggestions.sort((a, b) => {
    const priority = { high: 3, medium: 2, low: 1 }
    return priority[b.priority] - priority[a.priority]
  })
}

// ============================================
// MAIN ANALYSIS FUNCTION
// ============================================

/**
 * Analysera CV mot jobbannons
 */
export function analyzeCVForJob(
  cv: CVData,
  jobDescription: string
): CVOptimizationResult {
  // Extrahera keywords från jobbannons
  const jobKeywords = extractKeywords(jobDescription)
  
  // Matcha mot CV
  const matchedKeywords = new Map<string, KeywordMatch>()
  const missingKeywords: KeywordMatch[] = []
  
  for (const [keyword, weight] of jobKeywords) {
    const match = findKeywordInCV(keyword, cv)
    
    // Bara inkludera viktiga keywords (weight > 2)
    if (weight >= 2) {
      if (match.foundIn !== 'missing') {
        matchedKeywords.set(keyword, {
          word: keyword,
          importance: weight >= 6 ? 'high' : weight >= 3 ? 'medium' : 'low',
          foundIn: match.foundIn,
          occurrences: match.occurrences
        })
      } else {
        missingKeywords.push({
          word: keyword,
          importance: weight >= 6 ? 'high' : weight >= 3 ? 'medium' : 'low',
          foundIn: 'missing',
          occurrences: 0
        })
      }
    }
  }
  
  // Sortera saknade keywords efter vikt
  missingKeywords.sort((a, b) => {
    const importance = { high: 3, medium: 2, low: 1 }
    return importance[b.importance] - importance[a.importance]
  })
  
  // Beräkna section scores
  const sectionScores = calculateSectionScores(cv, matchedKeywords)
  
  // Beräkna total match score
  const sectionAvg = Object.values(sectionScores).reduce((a, b) => a + b, 0) / 4
  const keywordRatio = matchedKeywords.size / (matchedKeywords.size + missingKeywords.length)
  const matchScore = Math.round((sectionAvg * 0.6) + (keywordRatio * 100 * 0.4))
  
  // Generera förslag
  const suggestions = generateSuggestions(cv, missingKeywords, sectionScores)
  
  return {
    matchScore,
    totalKeywords: matchedKeywords.size + missingKeywords.length,
    matchedKeywords: matchedKeywords.size,
    missingKeywords: missingKeywords.slice(0, 10), // Begränsa till top 10
    suggestions,
    sectionScores
  }
}

// ============================================
// QUICK SCORE (för listvisning)
// ============================================

/**
 * Snabb beräkning av matchningspoäng (för listvisning)
 * Använder förenklad analys för bättre prestanda
 */
export function calculateQuickMatchScore(
  cv: CVData,
  jobTitle: string,
  jobDescription: string
): number {
  const analysis = analyzeCVForJob(cv, `${jobTitle} ${jobDescription}`)
  return analysis.matchScore
}
