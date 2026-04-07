/**
 * Job Matching Hook
 * Matches jobs based on CV skills, RIASEC profile, and user preferences
 * Combines data from multiple sources for intelligent job recommendations
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cvApi, interestApi } from '@/services/supabaseApi'
import { matchJobsToInterests, type JobInterestMatch, type RiasecScores } from '@/services/interestJobMatching'
import type { PlatsbankenJob } from '@/services/arbetsformedlingenApi'

// ============================================
// TYPES
// ============================================

export interface SkillMatch {
  skill: string
  isMatch: boolean
  isRequired: boolean
}

export interface JobMatchResult {
  job: PlatsbankenJob
  overallScore: number
  riasecScore: number
  skillScore: number
  matchedSkills: string[]
  missingSkills: string[]
  matchReasons: string[]
  category: 'excellent' | 'good' | 'potential' | 'low'
}

export interface CVSkillsData {
  skills: string[]
  title: string | null
  experience: string[]
  education: string[]
}

// ============================================
// SKILL EXTRACTION
// ============================================

/**
 * Extract skills from job description text
 */
function extractSkillsFromText(text: string): string[] {
  const lowerText = text.toLowerCase()
  const skills = new Set<string>()

  // Common Swedish skills and keywords
  const skillPatterns = [
    // Programming & IT
    'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'php', 'ruby',
    'react', 'angular', 'vue', 'node.js', 'nodejs', '.net', 'sql', 'nosql',
    'git', 'docker', 'kubernetes', 'aws', 'azure', 'linux', 'windows server',
    'html', 'css', 'sass', 'tailwind', 'bootstrap', 'figma', 'sketch',

    // Office & Tools
    'excel', 'word', 'powerpoint', 'office', 'microsoft 365', 'google workspace',
    'sap', 'salesforce', 'hubspot', 'jira', 'confluence', 'slack', 'teams',

    // Languages
    'svenska', 'engelska', 'tyska', 'franska', 'spanska', 'arabiska', 'mandarin',

    // Certifications & Licenses
    'körkort', 'truckkort', 'b-körkort', 'c-körkort', 'ce-körkort',
    'högtryck', 'svetsning', 'el-certifikat',

    // Soft skills (Swedish)
    'kommunikation', 'samarbete', 'ledarskap', 'projektledning', 'planering',
    'problemlösning', 'analytisk', 'kreativ', 'strukturerad', 'självständig',
    'kundservice', 'service', 'försäljning', 'presentation',

    // Industry specific
    'bokföring', 'redovisning', 'ekonomi', 'budget', 'administration',
    'lager', 'logistik', 'produktion', 'kvalitet', 'dokumentation',
    'vård', 'omsorg', 'pedagogik', 'undervisning',
  ]

  for (const skill of skillPatterns) {
    if (lowerText.includes(skill)) {
      skills.add(skill)
    }
  }

  return Array.from(skills)
}

/**
 * Normalize skills for comparison (case-insensitive, trimmed)
 */
function normalizeSkill(skill: string): string {
  return skill.toLowerCase().trim()
}

/**
 * Check if user skill matches a job skill (with fuzzy matching)
 */
function skillMatches(userSkill: string, jobSkill: string): boolean {
  const u = normalizeSkill(userSkill)
  const j = normalizeSkill(jobSkill)

  // Exact match
  if (u === j) return true

  // Partial match (one contains the other)
  if (u.includes(j) || j.includes(u)) return true

  // Common variations
  const variations: Record<string, string[]> = {
    'javascript': ['js', 'ecmascript'],
    'typescript': ['ts'],
    'python': ['py'],
    'c#': ['csharp', 'c-sharp'],
    'node.js': ['nodejs', 'node'],
    '.net': ['dotnet', 'dot net'],
    'microsoft office': ['office', 'ms office', 'office 365'],
    'svenska': ['swedish'],
    'engelska': ['english', 'eng'],
  }

  for (const [main, alts] of Object.entries(variations)) {
    if ((u === main || alts.includes(u)) && (j === main || alts.includes(j))) {
      return true
    }
  }

  return false
}

// ============================================
// MATCHING LOGIC
// ============================================

/**
 * Calculate skill match score between CV and job
 */
function calculateSkillMatchScore(
  cvSkills: string[],
  jobSkills: string[]
): { score: number; matched: string[]; missing: string[] } {
  if (jobSkills.length === 0) {
    return { score: 50, matched: [], missing: [] } // Neutral if no skills specified
  }

  const matched: string[] = []
  const missing: string[] = []

  for (const jobSkill of jobSkills) {
    const hasSkill = cvSkills.some(cvSkill => skillMatches(cvSkill, jobSkill))
    if (hasSkill) {
      matched.push(jobSkill)
    } else {
      missing.push(jobSkill)
    }
  }

  // Score: percentage of matched skills (minimum 0, max 100)
  const score = Math.round((matched.length / jobSkills.length) * 100)

  return { score, matched, missing }
}

/**
 * Generate human-readable match reasons
 */
function generateMatchReasons(
  skillScore: number,
  riasecScore: number,
  matchedSkills: string[],
  riasecTypes: string[]
): string[] {
  const reasons: string[] = []

  // Skill reasons
  if (matchedSkills.length >= 5) {
    reasons.push(`Stark match: ${matchedSkills.length} kompetenser`)
  } else if (matchedSkills.length >= 3) {
    reasons.push(`Bra match: ${matchedSkills.length} kompetenser`)
  } else if (matchedSkills.length > 0) {
    reasons.push(`Delvis match: ${matchedSkills.slice(0, 3).join(', ')}`)
  }

  // RIASEC reasons
  if (riasecScore >= 70) {
    reasons.push('Passar din personlighet')
  } else if (riasecScore >= 50) {
    reasons.push('Delvis intressematch')
  }

  // Personality type reasons
  if (riasecTypes.length > 0) {
    const typeNames: Record<string, string> = {
      realistic: 'Praktiskt',
      investigative: 'Analytiskt',
      artistic: 'Kreativt',
      social: 'Socialt',
      enterprising: 'Företagsamt',
      conventional: 'Strukturerat',
    }
    const matchedTypeNames = riasecTypes.map(t => typeNames[t] || t).slice(0, 2)
    if (matchedTypeNames.length > 0) {
      reasons.push(`${matchedTypeNames.join(' & ')} arbete`)
    }
  }

  return reasons
}

/**
 * Categorize match quality
 */
function categorizeMatch(overallScore: number): JobMatchResult['category'] {
  if (overallScore >= 80) return 'excellent'
  if (overallScore >= 60) return 'good'
  if (overallScore >= 40) return 'potential'
  return 'low'
}

// ============================================
// MAIN MATCHING FUNCTION
// ============================================

/**
 * Match jobs against user's CV and RIASEC profile
 */
export function matchJobsWithCV(
  jobs: PlatsbankenJob[],
  cvData: CVSkillsData | null,
  riasecScores: RiasecScores | null
): JobMatchResult[] {
  const cvSkills = cvData?.skills || []

  // Get RIASEC matches if available
  let riasecMatches: JobInterestMatch[] = []
  if (riasecScores) {
    riasecMatches = matchJobsToInterests(jobs, riasecScores, [])
  }

  // Create a map for quick RIASEC lookup
  const riasecMap = new Map<string, JobInterestMatch>()
  for (const match of riasecMatches) {
    riasecMap.set(match.jobId, match)
  }

  // Match each job
  const results: JobMatchResult[] = jobs.map(job => {
    // Extract skills from job
    const jobText = `${job.headline || ''} ${job.description?.text || ''}`
    const jobSkills = extractSkillsFromText(jobText)

    // Calculate skill match
    const skillMatch = calculateSkillMatchScore(cvSkills, jobSkills)

    // Get RIASEC match
    const riasecMatch = riasecMap.get(job.id)
    const riasecScore = riasecMatch?.overallMatch || 0
    const riasecTypes = riasecMatch?.riasecMatch.matchedTypes || []

    // Calculate overall score (weighted average)
    // Skills: 50%, RIASEC: 30%, Title match: 20%
    let overallScore = 0

    if (riasecScores && cvSkills.length > 0) {
      // Both CV and RIASEC available
      overallScore = (skillMatch.score * 0.5) + (riasecScore * 0.3)

      // Bonus for title match
      if (cvData?.title && job.headline) {
        const titleLower = cvData.title.toLowerCase()
        const headlineLower = job.headline.toLowerCase()
        if (headlineLower.includes(titleLower) || titleLower.includes(headlineLower)) {
          overallScore += 20
        }
      }
    } else if (cvSkills.length > 0) {
      // Only CV available
      overallScore = skillMatch.score * 0.8
    } else if (riasecScores) {
      // Only RIASEC available
      overallScore = riasecScore * 0.8
    } else {
      // Neither available - can't calculate meaningful match
      overallScore = 0
    }

    // Cap at 100
    overallScore = Math.min(100, Math.round(overallScore))

    // Generate match reasons
    const matchReasons = generateMatchReasons(
      skillMatch.score,
      riasecScore,
      skillMatch.matched,
      riasecTypes
    )

    return {
      job,
      overallScore,
      riasecScore,
      skillScore: skillMatch.score,
      matchedSkills: skillMatch.matched,
      missingSkills: skillMatch.missing,
      matchReasons,
      category: categorizeMatch(overallScore),
    }
  })

  // Sort by overall score
  return results.sort((a, b) => b.overallScore - a.overallScore)
}

// ============================================
// HOOK
// ============================================

export function useJobMatching(jobs: PlatsbankenJob[]) {
  // Fetch CV data
  const { data: cv } = useQuery({
    queryKey: ['cvForMatching'],
    queryFn: () => cvApi.getCV(),
    staleTime: 5 * 60 * 1000,
  })

  // Fetch RIASEC data
  const { data: riasecResult } = useQuery({
    queryKey: ['riasecForMatching'],
    queryFn: () => interestApi.getResult(),
    staleTime: 10 * 60 * 1000,
  })

  // Extract CV skills data
  const cvData: CVSkillsData | null = useMemo(() => {
    if (!cv) return null
    return {
      skills: cv.skills || [],
      title: cv.title || null,
      experience: (cv.work_experience || []).map((e: { company?: string; position?: string }) =>
        `${e.position || ''} ${e.company || ''}`
      ),
      education: (cv.education || []).map((e: { degree?: string; school?: string }) =>
        `${e.degree || ''} ${e.school || ''}`
      ),
    }
  }, [cv])

  // Extract RIASEC scores
  const riasecScores: RiasecScores | null = useMemo(() => {
    if (!riasecResult) return null

    if (riasecResult.riasec_profile?.scores) {
      return riasecResult.riasec_profile.scores as RiasecScores
    }

    if (typeof riasecResult.realistic === 'number') {
      return {
        realistic: riasecResult.realistic || 0,
        investigative: riasecResult.investigative || 0,
        artistic: riasecResult.artistic || 0,
        social: riasecResult.social || 0,
        enterprising: riasecResult.enterprising || 0,
        conventional: riasecResult.conventional || 0,
      }
    }

    return null
  }, [riasecResult])

  // Match jobs
  const matchedJobs = useMemo(() => {
    if (!jobs || jobs.length === 0) return []
    return matchJobsWithCV(jobs, cvData, riasecScores)
  }, [jobs, cvData, riasecScores])

  // Filter helpers
  const excellentMatches = matchedJobs.filter(j => j.category === 'excellent')
  const goodMatches = matchedJobs.filter(j => j.category === 'good')
  const potentialMatches = matchedJobs.filter(j => j.category === 'potential')

  return {
    matchedJobs,
    excellentMatches,
    goodMatches,
    potentialMatches,
    hasCV: !!cvData && cvData.skills.length > 0,
    hasRiasec: !!riasecScores,
    cvSkillsCount: cvData?.skills.length || 0,
  }
}

export default useJobMatching
