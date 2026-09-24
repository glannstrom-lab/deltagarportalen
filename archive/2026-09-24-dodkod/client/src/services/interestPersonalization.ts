/**
 * Interest-based Personalization Service
 * Personalizes content across the app based on RIASEC profile
 */

import type { EnhancedArticle } from './articleData'

// Re-export RiasecScores for use in other modules
export interface RiasecScores {
  realistic: number
  investigative: number
  artistic: number
  social: number
  enterprising: number
  conventional: number
}

interface RiasecType {
  code: keyof RiasecScores
  keywords: string[]
  articleCategories: string[]
}

// Simplified RIASEC types for this module
const RIASEC_TYPES: Record<keyof RiasecScores, RiasecType> = {
  realistic: {
    code: 'realistic',
    keywords: ['tekniker', 'mekaniker', 'elektriker', 'bygg', 'produktion', 'lager', 'fordon', 'underhåll'],
    articleCategories: ['tools', 'praktiska-tips', 'teknik']
  },
  investigative: {
    code: 'investigative',
    keywords: ['utvecklare', 'analytiker', 'forskare', 'ingenjör', 'data', 'system', 'vetenskap'],
    articleCategories: ['career-development', 'digital-presence', 'it']
  },
  artistic: {
    code: 'artistic',
    keywords: ['designer', 'grafiker', 'skribent', 'kreativ', 'konst', 'media', 'kommunikation'],
    articleCategories: ['digital-presence', 'networking', 'self-awareness']
  },
  social: {
    code: 'social',
    keywords: ['lärare', 'sjuksköterska', 'socialarbetare', 'vård', 'omsorg', 'undervisning', 'service'],
    articleCategories: ['interview', 'networking', 'wellness', 'self-awareness']
  },
  enterprising: {
    code: 'enterprising',
    keywords: ['säljare', 'chef', 'projektledare', 'affärer', 'ledarskap', 'förhandling', 'strategi'],
    articleCategories: ['career-development', 'networking', 'interview', 'job-search']
  },
  conventional: {
    code: 'conventional',
    keywords: ['administratör', 'ekonom', 'redovisning', 'kontor', 'kvalitet', 'dokumentation'],
    articleCategories: ['job-search', 'employment-law', 'tools']
  }
}

/**
 * Get dominant RIASEC types (top 3)
 */
export function getDominantTypes(scores: RiasecScores): Array<{ code: keyof RiasecScores; score: number }> {
  return Object.entries(scores)
    .map(([code, score]) => ({ code: code as keyof RiasecScores, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

// ============================================
// RIASEC TO CATEGORY MAPPING
// ============================================

/**
 * Maps article categories to RIASEC types
 * Higher weight = stronger match
 */
export const CATEGORY_RIASEC_MAP: Record<string, Partial<Record<keyof RiasecScores, number>>> = {
  // Getting started - universal
  'getting-started': { realistic: 1, investigative: 1, artistic: 1, social: 1, enterprising: 1, conventional: 1 },

  // Self-awareness - strong for Social and Artistic
  'self-awareness': { social: 3, artistic: 2, investigative: 2, enterprising: 1 },

  // Job search - universal but stronger for Conventional and Enterprising
  'job-search': { conventional: 2, enterprising: 2, social: 1, investigative: 1 },

  // Interview - strong for Social and Enterprising
  'interview': { social: 3, enterprising: 3, conventional: 1 },

  // Networking - strong for Social and Enterprising
  'networking': { social: 3, enterprising: 3, artistic: 1 },

  // Digital presence - strong for Investigative and Artistic
  'digital-presence': { investigative: 2, artistic: 3, enterprising: 2 },

  // Employment law - strong for Conventional
  'employment-law': { conventional: 3, social: 1, investigative: 1 },

  // Career development - universal, stronger for Enterprising
  'career-development': { enterprising: 3, investigative: 2, social: 2, conventional: 1 },

  // Wellness - strong for Social
  'wellness': { social: 3, artistic: 2 },

  // Accessibility - strong for Social
  'accessibility': { social: 3, conventional: 1 },

  // Job market - universal
  'job-market': { investigative: 2, conventional: 2, enterprising: 2 },

  // Tools - strong for Conventional and Realistic
  'tools': { conventional: 3, realistic: 2, investigative: 1 },

  // Tech/IT
  'teknik': { investigative: 3, realistic: 2 },
  'it': { investigative: 3, realistic: 1 },

  // Creative
  'kreativitet': { artistic: 3 },
  'design': { artistic: 3, investigative: 1 },

  // Leadership
  'ledarskap': { enterprising: 3, social: 2 },

  // Communication
  'kommunikation': { social: 3, artistic: 2, enterprising: 2 },

  // Organization
  'organisation': { conventional: 3, enterprising: 1 },
  'administration': { conventional: 3 },
  'planering': { conventional: 3, enterprising: 1 },
}

// ============================================
// PERSONALIZATION FUNCTIONS
// ============================================

/**
 * Calculate relevance score for an article based on RIASEC profile
 */
export function calculateArticleRelevance(
  article: EnhancedArticle,
  riasecScores: RiasecScores
): number {
  const dominantTypes = getDominantTypes(riasecScores)
  let totalScore = 0

  // Check category match
  const categoryMapping = CATEGORY_RIASEC_MAP[article.category]
  if (categoryMapping) {
    dominantTypes.forEach(({ code, score }) => {
      const categoryWeight = categoryMapping[code] || 0
      totalScore += (categoryWeight * score) / 5 // Normalize score (0-5)
    })
  }

  // Check subcategory match
  if (article.subcategory) {
    const subcategoryMapping = CATEGORY_RIASEC_MAP[article.subcategory]
    if (subcategoryMapping) {
      dominantTypes.forEach(({ code, score }) => {
        const weight = subcategoryMapping[code] || 0
        totalScore += (weight * score) / 10 // Lower weight for subcategory
      })
    }
  }

  // Check tags for keyword matches
  const articleText = `${article.title} ${article.summary} ${article.tags.join(' ')}`.toLowerCase()
  dominantTypes.forEach(({ code, score }) => {
    const riasecType = RIASEC_TYPES[code]
    let keywordMatches = 0

    riasecType.keywords.forEach(keyword => {
      if (articleText.includes(keyword.toLowerCase())) {
        keywordMatches++
      }
    })

    if (keywordMatches > 0) {
      totalScore += (keywordMatches * score) / (riasecType.keywords.length * 2)
    }
  })

  // Normalize to 0-100
  return Math.min(100, Math.round(totalScore * 10))
}

/**
 * Sort and filter articles by RIASEC relevance
 */
export function personalizeArticles(
  articles: EnhancedArticle[],
  riasecScores: RiasecScores,
  minRelevance: number = 0
): Array<EnhancedArticle & { relevanceScore: number }> {
  return articles
    .map(article => ({
      ...article,
      relevanceScore: calculateArticleRelevance(article, riasecScores)
    }))
    .filter(article => article.relevanceScore >= minRelevance)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
}

/**
 * Get recommended categories based on RIASEC profile
 */
export function getRecommendedCategories(
  riasecScores: RiasecScores,
  limit: number = 5
): string[] {
  const dominantTypes = getDominantTypes(riasecScores)
  const categoryScores: Record<string, number> = {}

  Object.entries(CATEGORY_RIASEC_MAP).forEach(([category, mapping]) => {
    let score = 0
    dominantTypes.forEach(({ code, score: userScore }) => {
      const weight = mapping[code] || 0
      score += weight * userScore
    })
    categoryScores[category] = score
  })

  return Object.entries(categoryScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([category]) => category)
}

// ============================================
// EXERCISE PERSONALIZATION
// ============================================

export interface Exercise {
  id: string
  title: string
  category: string
  tags?: string[]
}

/**
 * Calculate exercise relevance based on RIASEC
 */
export function calculateExerciseRelevance(
  exercise: Exercise,
  riasecScores: RiasecScores
): number {
  const dominantTypes = getDominantTypes(riasecScores)
  let score = 0

  // Map exercise categories to RIASEC
  const exerciseCategoryMap: Record<string, Partial<Record<keyof RiasecScores, number>>> = {
    'Självkännedom': { social: 3, artistic: 2, investigative: 2 },
    'Jobbsökning': { conventional: 2, enterprising: 2, social: 1 },
    'Nätverkande': { social: 3, enterprising: 3 },
    'Digital närvaro': { investigative: 2, artistic: 2 },
    'Intervju': { social: 3, enterprising: 2 },
    'Kommunikation': { social: 3, artistic: 2, enterprising: 2 },
    'Ledarskap': { enterprising: 3, social: 2 },
    'Teknik': { investigative: 3, realistic: 2 },
    'Kreativitet': { artistic: 3 },
    'Planering': { conventional: 3, enterprising: 1 },
    'Välmående': { social: 2, artistic: 1 },
  }

  const mapping = exerciseCategoryMap[exercise.category]
  if (mapping) {
    dominantTypes.forEach(({ code, score: userScore }) => {
      const weight = mapping[code] || 0
      score += (weight * userScore) / 5
    })
  }

  // Check tags
  const exerciseText = `${exercise.title} ${exercise.tags?.join(' ') || ''}`.toLowerCase()
  dominantTypes.forEach(({ code, score: userScore }) => {
    const riasecType = RIASEC_TYPES[code]
    riasecType.keywords.forEach(keyword => {
      if (exerciseText.includes(keyword.toLowerCase())) {
        score += userScore / 10
      }
    })
  })

  return Math.min(100, Math.round(score * 10))
}

// ============================================
// JOB SEARCH PERSONALIZATION
// ============================================

/**
 * Get search terms based on RIASEC profile
 */
export function getInterestBasedSearchTerms(riasecScores: RiasecScores): string[] {
  const dominantTypes = getDominantTypes(riasecScores)
  const terms: string[] = []

  dominantTypes.forEach(({ code }) => {
    const riasecType = RIASEC_TYPES[code]
    // Add top keywords for each dominant type
    terms.push(...riasecType.keywords.slice(0, 3))
  })

  return [...new Set(terms)] // Deduplicate
}

/**
 * Get occupation groups based on RIASEC profile
 */
export function getRecommendedOccupationGroups(riasecScores: RiasecScores): string[] {
  const dominantTypes = getDominantTypes(riasecScores)
  const groups: string[] = []

  dominantTypes.forEach(({ code }) => {
    const riasecType = RIASEC_TYPES[code]
    groups.push(...riasecType.occupationGroups)
  })

  return [...new Set(groups)]
}

// ============================================
// COVER LETTER PERSONALIZATION
// ============================================

/**
 * Get personality strengths to highlight based on RIASEC
 */
export function getPersonalityStrengths(riasecScores: RiasecScores): string[] {
  const dominantTypes = getDominantTypes(riasecScores).slice(0, 2)
  const strengths: string[] = []

  const strengthMap: Record<keyof RiasecScores, string[]> = {
    realistic: ['praktisk', 'lösningsorienterad', 'tekniskt kunnig', 'resultatdriven'],
    investigative: ['analytisk', 'detaljorienterad', 'systematisk', 'kunskapstörstande'],
    artistic: ['kreativ', 'innovativ', 'flexibel', 'uttrycksfull'],
    social: ['empatisk', 'samarbetsinriktad', 'kommunikativ', 'hjälpsam'],
    enterprising: ['initiativrik', 'ledarskapsorienterad', 'övertygande', 'ambitiös'],
    conventional: ['organiserad', 'noggrann', 'pålitlig', 'strukturerad']
  }

  dominantTypes.forEach(({ code }) => {
    strengths.push(...strengthMap[code])
  })

  return strengths
}

/**
 * Get tips for cover letter based on RIASEC match with job
 */
export function getCoverLetterTips(
  userScores: RiasecScores,
  jobText: string
): string[] {
  const tips: string[] = []
  const dominantTypes = getDominantTypes(userScores)
  const jobTextLower = jobText.toLowerCase()

  // Check which RIASEC types match the job
  const matchingTypes: Array<keyof RiasecScores> = []

  dominantTypes.forEach(({ code }) => {
    const riasecType = RIASEC_TYPES[code]
    const hasMatch = riasecType.keywords.some(kw => jobTextLower.includes(kw.toLowerCase()))
    if (hasMatch) {
      matchingTypes.push(code)
    }
  })

  if (matchingTypes.length === 0) {
    tips.push('Detta jobb matchar kanske inte din typiska profil - fokusera på överförbara kompetenser')
    tips.push('Beskriv hur dina styrkor kan appliceras på nya områden')
  } else {
    matchingTypes.forEach(code => {
      switch (code) {
        case 'realistic':
          tips.push('Framhäv dina praktiska erfarenheter och tekniska färdigheter')
          break
        case 'investigative':
          tips.push('Beskriv ditt analytiska arbetssätt och problemlösningsförmåga')
          break
        case 'artistic':
          tips.push('Visa din kreativitet och förmåga att tänka utanför boxen')
          break
        case 'social':
          tips.push('Framhäv din kommunikationsförmåga och erfarenhet av samarbete')
          break
        case 'enterprising':
          tips.push('Beskriv situationer där du tagit initiativ och visat ledarskap')
          break
        case 'conventional':
          tips.push('Framhäv din noggrannhet och förmåga att arbeta strukturerat')
          break
      }
    })
  }

  return tips
}

/**
 * Calculate how well a text (e.g., job description) matches a RIASEC profile
 */
export function calculateInterestMatch(text: string, scores: RiasecScores): number {
  const textLower = text.toLowerCase()
  const dominantTypes = getDominantTypes(scores)
  let totalMatch = 0
  let maxPossible = 0

  dominantTypes.forEach(({ code, score }) => {
    const riasecType = RIASEC_TYPES[code]
    let keywordMatches = 0

    riasecType.keywords.forEach(keyword => {
      if (textLower.includes(keyword.toLowerCase())) {
        keywordMatches++
      }
    })

    // Weight by user's score in this type
    const matchRatio = keywordMatches / riasecType.keywords.length
    totalMatch += matchRatio * score
    maxPossible += score
  })

  if (maxPossible === 0) return 0
  return Math.round((totalMatch / maxPossible) * 100)
}

export default {
  calculateArticleRelevance,
  personalizeArticles,
  getRecommendedCategories,
  calculateExerciseRelevance,
  getInterestBasedSearchTerms,
  getRecommendedOccupationGroups,
  getPersonalityStrengths,
  getCoverLetterTips,
  calculateInterestMatch
}
