/**
 * jobMatching - Rena matchningsfunktioner för jobbmatchning.
 *
 * Utbruten ur components/jobs/MatchesTab.tsx (2026-07-03) — självständiga
 * funktioner utan React-beroenden: synonym-/titelmatchning, legitimations-
 * filter, preferensboostar och parallell förhämtning av AF-sökningar.
 * Statisk data ligger i data/jobMatchingData.ts.
 */

import { searchJobs, type PlatsbankenJob } from '@/services/arbetsformedlingenApi'
import {
  SKILL_SYNONYMS,
  JOB_TITLE_SYNONYMS,
  GENERIC_SKILLS,
  REQUIRED_LICENSES,
} from '@/data/jobMatchingData'

// ============================================
// TYPES
// ============================================

export type MatchSource = 'cv' | 'interest' | 'career'

export interface MatchedJob {
  job: PlatsbankenJob
  score: number
  source: MatchSource
  matchDetails: string[]
}

/** Profile preferences for filtering and boosting */
export interface MatchPreferences {
  employmentTypes: string[]  // 'fulltime', 'parttime', etc.
  remoteWork: 'yes' | 'no' | 'hybrid' | null
  driversLicense: string[]  // ['B', 'C', etc.]
  hasCar: boolean
  maxCommuteMinutes: number | null
  industries: string[]
}

// ============================================
// PREFETCH
// ============================================

/**
 * Förhämta flera AF-sökningar parallellt. Sökningarna är oberoende av
 * varandra — de seriella await:arna i käll-funktionerna lät användaren
 * vänta på upp till 5+8+8 anrop i RAD innan fliken visade något.
 * Fel per sökning sväljs (tom lista) så en trasig term inte fäller resten.
 */
export async function prefetchJobSearches(
  queries: string[],
  municipality?: string,
): Promise<Map<string, PlatsbankenJob[]>> {
  const map = new Map<string, PlatsbankenJob[]>()
  await Promise.all(
    queries.map(async (q) => {
      try {
        const r = await searchJobs({ query: q, municipality, limit: 25, publishedWithin: 'month' })
        map.set(q, r.hits)
      } catch (e) {
        console.error('Error searching for term:', q, e)
        map.set(q, [])
      }
    }),
  )
  return map
}

// ============================================
// SKILL & TITLE MATCHING
// ============================================

/**
 * Check if a skill is generic (should not be used for searching)
 */
export function isGenericSkill(skill: string): boolean {
  const skillLower = skill.toLowerCase().trim()

  // Direct match
  if (GENERIC_SKILLS.has(skillLower)) return true

  // Check if any generic skill is contained in this skill
  for (const generic of GENERIC_SKILLS) {
    if (skillLower.includes(generic) || generic.includes(skillLower)) {
      return true
    }
  }

  return false
}

/**
 * Check if a skill matches in job text (with synonyms)
 */
export function matchSkill(skill: string, jobText: string): boolean {
  const skillLower = skill.toLowerCase()

  // Direct match
  if (jobText.includes(skillLower)) return true

  // Check synonyms
  const synonyms = SKILL_SYNONYMS[skillLower] || []
  for (const syn of synonyms) {
    if (jobText.includes(syn)) return true
  }

  // Reverse lookup - check if skill is a synonym of something in the text
  for (const [key, syns] of Object.entries(SKILL_SYNONYMS)) {
    if (syns.includes(skillLower) && jobText.includes(key)) return true
  }

  // Partial word match for compound words
  if (skillLower.length > 4) {
    const words = skillLower.split(/[\s\-/]+/).filter(w => w.length > 3)
    for (const word of words) {
      if (jobText.includes(word)) return true
    }
  }

  return false
}

/**
 * Check if job title matches user's work title (with synonyms)
 */
export function matchJobTitle(userTitle: string, jobTitle: string, jobOccupation: string): { match: 'exact' | 'similar' | 'partial' | 'none' } {
  const titleLower = userTitle.toLowerCase()
  const jobTitleLower = jobTitle.toLowerCase()
  const jobOccLower = jobOccupation.toLowerCase()
  const combined = `${jobTitleLower} ${jobOccLower}`

  // Exact match
  if (jobTitleLower.includes(titleLower) || jobOccLower.includes(titleLower)) {
    return { match: 'exact' }
  }

  // Synonym match
  const synonyms = JOB_TITLE_SYNONYMS[titleLower] || []
  for (const syn of synonyms) {
    if (combined.includes(syn)) return { match: 'similar' }
  }

  // Reverse synonym lookup
  for (const [key, syns] of Object.entries(JOB_TITLE_SYNONYMS)) {
    if (syns.includes(titleLower) && combined.includes(key)) return { match: 'similar' }
  }

  // Partial word match
  const titleWords = titleLower.split(/[\s\-/,]+/).filter(w => w.length > 3)
  const matchedWords = titleWords.filter(word => combined.includes(word))
  if (matchedWords.length > 0) {
    return { match: 'partial' }
  }

  return { match: 'none' }
}

// ============================================
// PROFESSIONAL LICENSE CHECK
// ============================================

/**
 * Check if a job requires a professional license that the user doesn't have
 * Returns null if no license required, or the required license info if blocked
 */
export function checkRequiredLicense(
  jobTitle: string,
  jobText: string,
  userEducation: string[],
  userWorkTitles: string[]
): { blocked: boolean; requiredLicense: string | null } {
  const titleLower = jobTitle.toLowerCase()
  const textLower = jobText.toLowerCase()
  const userBackground = [...userEducation, ...userWorkTitles].map(s => s.toLowerCase()).join(' ')

  for (const [, license] of Object.entries(REQUIRED_LICENSES)) {
    // Check if job title matches a licensed profession
    const titleMatch = license.titlePatterns.some(pattern => {
      const patternLower = pattern.toLowerCase()
      return titleLower.includes(patternLower)
    })

    // Check if job explicitly requires the license
    const keywordMatch = license.keywords.some(keyword => textLower.includes(keyword.toLowerCase()))

    if (titleMatch || keywordMatch) {
      // Job requires this license - check if user has it
      const userHasLicense = license.titlePatterns.some(pattern => userBackground.includes(pattern.toLowerCase())) ||
                            license.keywords.some(keyword => userBackground.includes(keyword.toLowerCase()))

      if (!userHasLicense) {
        return { blocked: true, requiredLicense: license.description }
      }
    }
  }

  return { blocked: false, requiredLicense: null }
}

// ============================================
// PROFILE PREFERENCE MATCHING
// ============================================

/**
 * Check if job matches employment type preference
 */
export function matchesEmploymentType(job: PlatsbankenJob, preferredTypes: string[]): { matches: boolean; boost: number } {
  if (preferredTypes.length === 0) return { matches: true, boost: 0 }

  const jobType = job.employment_type?.label?.toLowerCase() || ''

  // Map Swedish job types to our preference keys
  const typeMapping: Record<string, string[]> = {
    'fulltime': ['heltid', 'tillsvidare', 'fast anställning'],
    'parttime': ['deltid', 'halvtid'],
    'temporary': ['vikariat', 'tidsbegränsad', 'visstid', 'säsong'],
    'freelance': ['frilans', 'konsult', 'uppdrag'],
    'internship': ['praktik', 'trainee', 'lärling']
  }

  for (const pref of preferredTypes) {
    const keywords = typeMapping[pref] || []
    if (keywords.some(kw => jobType.includes(kw))) {
      return { matches: true, boost: 10 }  // +10% for matching preference
    }
  }

  // If user wants specific types but job doesn't match, slight penalty
  return { matches: true, boost: -5 }
}

/**
 * Check if job matches remote work preference
 */
export function matchesRemoteWork(job: PlatsbankenJob, preference: 'yes' | 'no' | 'hybrid' | null): { matches: boolean; boost: number } {
  if (!preference) return { matches: true, boost: 0 }

  const jobText = `${job.headline || ''} ${job.description?.text || ''}`.toLowerCase()
  const remoteOption = job.remote_work?.option?.toLowerCase() || ''

  const isRemote = remoteOption.includes('remote') ||
    jobText.includes('distans') ||
    jobText.includes('remote') ||
    jobText.includes('hemarbete') ||
    jobText.includes('jobba hemifrån')

  const isHybrid = remoteOption.includes('hybrid') ||
    jobText.includes('hybrid') ||
    jobText.includes('delvis distans') ||
    jobText.includes('flexibel arbetsplats')

  if (preference === 'yes') {
    if (isRemote) return { matches: true, boost: 15 }
    if (isHybrid) return { matches: true, boost: 5 }
    return { matches: true, boost: -5 }
  }

  if (preference === 'hybrid') {
    if (isHybrid) return { matches: true, boost: 15 }
    if (isRemote) return { matches: true, boost: 5 }
    return { matches: true, boost: 0 }
  }

  // preference === 'no' - prefers on-site
  if (!isRemote && !isHybrid) return { matches: true, boost: 5 }
  return { matches: true, boost: 0 }
}

/**
 * Check if user has required driver's license
 */
export function matchesDriversLicense(job: PlatsbankenJob, userLicenses: string[]): { matches: boolean; boost: number; detail: string | null } {
  const jobText = `${job.headline || ''} ${job.description?.text || ''}`.toLowerCase()

  // Check for driver's license requirements
  const requiresLicense = jobText.includes('körkort') ||
    jobText.includes('b-körkort') ||
    jobText.includes('c-körkort') ||
    jobText.includes('ce-körkort') ||
    jobText.includes('truckkort')

  if (!requiresLicense) {
    return { matches: true, boost: 0, detail: null }
  }

  // Job requires license - check if user has it
  if (userLicenses.length === 0) {
    // User hasn't specified licenses, slight penalty for jobs requiring them
    return { matches: true, boost: -10, detail: 'Körkort krävs' }
  }

  // Check specific license types
  const hasB = userLicenses.some(l => l.toUpperCase() === 'B')
  const hasC = userLicenses.some(l => l.toUpperCase() === 'C')
  const hasCE = userLicenses.some(l => l.toUpperCase() === 'CE')

  if (jobText.includes('ce-körkort') || jobText.includes('ce körkort')) {
    if (hasCE) return { matches: true, boost: 15, detail: 'Du har CE-körkort ✓' }
    return { matches: true, boost: -15, detail: 'CE-körkort krävs' }
  }

  if (jobText.includes('c-körkort') || jobText.includes('c körkort')) {
    if (hasC || hasCE) return { matches: true, boost: 15, detail: 'Du har C-körkort ✓' }
    return { matches: true, boost: -15, detail: 'C-körkort krävs' }
  }

  if (jobText.includes('b-körkort') || jobText.includes('b körkort') ||
      (jobText.includes('körkort') && !jobText.includes('c-') && !jobText.includes('ce-'))) {
    if (hasB || hasC || hasCE) return { matches: true, boost: 10, detail: 'Du har B-körkort ✓' }
    return { matches: true, boost: -10, detail: 'B-körkort krävs' }
  }

  return { matches: true, boost: 0, detail: null }
}

/**
 * Apply all profile-based boosts/penalties to a match score
 */
export function applyProfileBoosts(
  job: PlatsbankenJob,
  baseScore: number,
  preferences: MatchPreferences,
  matchDetails: string[]
): { score: number; details: string[] } {
  let score = baseScore
  const details = [...matchDetails]

  // Employment type
  const empMatch = matchesEmploymentType(job, preferences.employmentTypes)
  score += empMatch.boost

  // Remote work
  const remoteMatch = matchesRemoteWork(job, preferences.remoteWork)
  score += remoteMatch.boost
  if (remoteMatch.boost > 0 && preferences.remoteWork === 'yes') {
    details.push('Distansarbete ✓')
  }

  // Driver's license
  const licenseMatch = matchesDriversLicense(job, preferences.driversLicense)
  score += licenseMatch.boost
  if (licenseMatch.detail && licenseMatch.boost > 0) {
    details.push(licenseMatch.detail)
  }

  // Car requirement
  if (preferences.hasCar) {
    const jobText = `${job.headline || ''} ${job.description?.text || ''}`.toLowerCase()
    if (jobText.includes('egen bil') || jobText.includes('tillgång till bil')) {
      score += 10
      details.push('Har bil ✓')
    }
  }

  // Cap score between 0 and 100
  score = Math.max(0, Math.min(100, score))

  return { score, details }
}
