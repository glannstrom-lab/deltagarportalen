/**
 * useInterestProfile - Hook for accessing RIASEC profile data
 * Provides interest guide results for personalization across the app
 */

import { useQuery } from '@tanstack/react-query'
import { interestGuideApi } from '@/services/cloudStorage'
import { calculateUserProfile } from '@/services/interestGuideData'

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

export interface RiasecType {
  code: keyof RiasecScores
  name: string
  nameSv: string
  description: string
  keywords: string[]
  occupationGroups: string[]
  articleCategories: string[]
  exerciseTypes: string[]
}

export interface InterestProfile {
  hasResult: boolean
  riasecScores: RiasecScores | null
  dominantTypes: Array<{ code: keyof RiasecScores; score: number }>
  recommendedOccupations: Array<{ name: string; matchPercentage: number }>
  completedAt: string | null
}

// ============================================
// RIASEC TYPE DEFINITIONS
// ============================================

export const RIASEC_TYPES: Record<keyof RiasecScores, RiasecType> = {
  realistic: {
    code: 'realistic',
    name: 'Realistic',
    nameSv: 'Realistisk',
    description: 'Föredrar praktiskt arbete med händerna, verktyg och maskiner',
    keywords: ['tekniker', 'mekaniker', 'elektriker', 'bygg', 'produktion', 'lager', 'fordon', 'underhåll'],
    occupationGroups: ['Bygg och anläggning', 'Tillverkning', 'Transport och lager', 'Lantbruk'],
    articleCategories: ['praktiska-tips', 'teknik', 'hantverk'],
    exerciseTypes: ['practical', 'hands-on', 'technical']
  },
  investigative: {
    code: 'investigative',
    name: 'Investigative',
    nameSv: 'Undersökande',
    description: 'Föredrar analytiskt arbete, forskning och problemlösning',
    keywords: ['utvecklare', 'analytiker', 'forskare', 'ingenjör', 'data', 'system', 'vetenskap'],
    occupationGroups: ['IT och data', 'Forskning', 'Hälsa och sjukvård', 'Teknik'],
    articleCategories: ['analys', 'teknik', 'forskning', 'it'],
    exerciseTypes: ['analytical', 'research', 'problem-solving']
  },
  artistic: {
    code: 'artistic',
    name: 'Artistic',
    nameSv: 'Konstnärlig',
    description: 'Föredrar kreativt arbete, design och självuttryck',
    keywords: ['designer', 'grafiker', 'skribent', 'kreativ', 'konst', 'media', 'kommunikation'],
    occupationGroups: ['Media och journalistik', 'Konst och design', 'Marknadsföring'],
    articleCategories: ['kreativitet', 'design', 'kommunikation', 'marknadsföring'],
    exerciseTypes: ['creative', 'design', 'writing']
  },
  social: {
    code: 'social',
    name: 'Social',
    nameSv: 'Social',
    description: 'Föredrar att arbeta med människor, hjälpa och undervisa',
    keywords: ['lärare', 'sjuksköterska', 'socialarbetare', 'vård', 'omsorg', 'undervisning', 'service'],
    occupationGroups: ['Hälsa och sjukvård', 'Pedagogik', 'Socialt arbete', 'Kundservice'],
    articleCategories: ['kommunikation', 'ledarskap', 'samarbete', 'service'],
    exerciseTypes: ['communication', 'teamwork', 'helping']
  },
  enterprising: {
    code: 'enterprising',
    name: 'Enterprising',
    nameSv: 'Företagsam',
    description: 'Föredrar att leda, påverka och driva projekt framåt',
    keywords: ['säljare', 'chef', 'projektledare', 'affärer', 'ledarskap', 'förhandling', 'strategi'],
    occupationGroups: ['Försäljning', 'Ledning', 'Ekonomi', 'Företagande'],
    articleCategories: ['ledarskap', 'försäljning', 'affärsutveckling', 'karriär'],
    exerciseTypes: ['leadership', 'sales', 'negotiation']
  },
  conventional: {
    code: 'conventional',
    name: 'Conventional',
    nameSv: 'Konventionell',
    description: 'Föredrar strukturerat arbete med rutiner och system',
    keywords: ['administratör', 'ekonom', 'redovisning', 'kontor', 'kvalitet', 'dokumentation'],
    occupationGroups: ['Kontor och administration', 'Ekonomi', 'Bank och försäkring'],
    articleCategories: ['organisation', 'administration', 'ekonomi', 'planering'],
    exerciseTypes: ['organization', 'detail-oriented', 'administrative']
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get dominant RIASEC types (top 3)
 */
export function getDominantTypes(scores: RiasecScores): Array<{ code: keyof RiasecScores; score: number }> {
  return Object.entries(scores)
    .map(([code, score]) => ({ code: code as keyof RiasecScores, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

/**
 * Get RIASEC code (e.g., "RIA" for Realistic-Investigative-Artistic)
 */
export function getRiasecCode(scores: RiasecScores): string {
  const dominant = getDominantTypes(scores)
  return dominant.map(d => d.code.charAt(0).toUpperCase()).join('')
}

/**
 * Check if a category matches user's interests
 */
export function categoryMatchesInterests(category: string, dominantTypes: Array<{ code: keyof RiasecScores }>): boolean {
  const categoryLower = category.toLowerCase()

  return dominantTypes.some(type => {
    const riasecType = RIASEC_TYPES[type.code]
    return riasecType.articleCategories.some(cat =>
      categoryLower.includes(cat) || cat.includes(categoryLower)
    ) || riasecType.keywords.some(kw => categoryLower.includes(kw))
  })
}

/**
 * Calculate match score between text and RIASEC profile
 */
export function calculateInterestMatch(text: string, scores: RiasecScores): number {
  const textLower = text.toLowerCase()
  const dominant = getDominantTypes(scores)
  let totalScore = 0
  let maxPossible = 0

  dominant.forEach(({ code, score }) => {
    const riasecType = RIASEC_TYPES[code]
    let typeMatches = 0

    riasecType.keywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        typeMatches++
      }
    })

    const typeScore = (typeMatches / riasecType.keywords.length) * score
    totalScore += typeScore
    maxPossible += score
  })

  return maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0
}

/**
 * Get personalized recommendations based on RIASEC
 */
export function getPersonalizedCategories(dominantTypes: Array<{ code: keyof RiasecScores }>): string[] {
  const categories = new Set<string>()

  dominantTypes.forEach(({ code }) => {
    const riasecType = RIASEC_TYPES[code]
    riasecType.articleCategories.forEach(cat => categories.add(cat))
  })

  return Array.from(categories)
}

/**
 * Get exercise types that match user's interests
 */
export function getMatchingExerciseTypes(dominantTypes: Array<{ code: keyof RiasecScores }>): string[] {
  const types = new Set<string>()

  dominantTypes.forEach(({ code }) => {
    const riasecType = RIASEC_TYPES[code]
    riasecType.exerciseTypes.forEach(t => types.add(t))
  })

  return Array.from(types)
}

// ============================================
// MAIN HOOK
// ============================================

export function useInterestProfile() {
  const query = useQuery({
    queryKey: ['interestProfile'],
    queryFn: async (): Promise<InterestProfile> => {
      try {
        // Check progress first to see if completed
        const progress = await interestGuideApi.getProgress()

        // If not completed, return early
        if (!progress?.is_completed) {
          return {
            hasResult: false,
            riasecScores: null,
            dominantTypes: [],
            recommendedOccupations: [],
            completedAt: null
          }
        }

        // Get the latest history entry with RIASEC scores
        const history = await interestGuideApi.getHistory(1)
        const latestResult = history?.[0]

        console.log('[useInterestProfile] Progress:', progress)
        console.log('[useInterestProfile] History:', history)
        console.log('[useInterestProfile] Latest result:', latestResult)

        if (!latestResult) {
          // Completed but no history - calculate RIASEC directly from progress.answers
          console.log('[useInterestProfile] No history, calculating from answers:', progress.answers)

          if (progress.answers && Object.keys(progress.answers).length > 0) {
            try {
              const calculated = calculateUserProfile(progress.answers as Record<string, number>)
              console.log('[useInterestProfile] Calculated profile:', calculated)

              if (calculated.riasec) {
                // Scale from 0-5 to 0-100 (multiply by 20)
                const riasecScores: RiasecScores = {
                  realistic: Math.round((calculated.riasec.R ?? 0) * 20),
                  investigative: Math.round((calculated.riasec.I ?? 0) * 20),
                  artistic: Math.round((calculated.riasec.A ?? 0) * 20),
                  social: Math.round((calculated.riasec.S ?? 0) * 20),
                  enterprising: Math.round((calculated.riasec.E ?? 0) * 20),
                  conventional: Math.round((calculated.riasec.C ?? 0) * 20)
                }
                console.log('[useInterestProfile] Calculated riasecScores:', riasecScores)

                const dominantTypes = getDominantTypes(riasecScores)

                return {
                  hasResult: true,
                  riasecScores,
                  dominantTypes,
                  recommendedOccupations: [],
                  completedAt: progress.updated_at || null
                }
              }
            } catch (calcError) {
              console.error('[useInterestProfile] Error calculating profile:', calcError)
            }
          }

          return {
            hasResult: true,
            riasecScores: null,
            dominantTypes: [],
            recommendedOccupations: [],
            completedAt: progress.updated_at || null
          }
        }

        // Extract RIASEC scores from history entry
        let riasecScores: RiasecScores | null = null

        // Check riasec_profile object format
        // Database stores with short keys: R, I, A, S, E, C
        console.log('[useInterestProfile] riasec_profile:', latestResult.riasec_profile)

        if (latestResult.riasec_profile) {
          const rp = latestResult.riasec_profile as Record<string, number>

          // Map short keys (R, I, A, S, E, C) to long keys (realistic, investigative, etc.)
          riasecScores = {
            realistic: rp.R ?? rp.realistic ?? 0,
            investigative: rp.I ?? rp.investigative ?? 0,
            artistic: rp.A ?? rp.artistic ?? 0,
            social: rp.S ?? rp.social ?? 0,
            enterprising: rp.E ?? rp.enterprising ?? 0,
            conventional: rp.C ?? rp.conventional ?? 0
          }
          console.log('[useInterestProfile] Mapped riasecScores:', riasecScores)
        }

        const dominantTypes = riasecScores ? getDominantTypes(riasecScores) : []

        // Extract recommended occupations
        const recommendedOccupations = (latestResult.top_occupations || [])
          .slice(0, 10)
          .map((occ: { name?: string; title?: string; matchPercentage?: number; match_percentage?: number }) => ({
            name: occ.name || occ.title || '',
            matchPercentage: occ.matchPercentage || occ.match_percentage || 0
          }))

        return {
          hasResult: true,
          riasecScores,
          dominantTypes,
          recommendedOccupations,
          completedAt: latestResult.completed_at || null
        }
      } catch (error) {
        console.error('Error fetching interest profile:', error)
        return {
          hasResult: false,
          riasecScores: null,
          dominantTypes: [],
          recommendedOccupations: [],
          completedAt: null
        }
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1
  })

  return {
    profile: query.data || {
      hasResult: false,
      riasecScores: null,
      dominantTypes: [],
      recommendedOccupations: [],
      completedAt: null
    },
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  }
}

export default useInterestProfile
