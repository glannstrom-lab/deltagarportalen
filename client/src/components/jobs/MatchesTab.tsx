/**
 * MatchesTab - Job Matching with Three Independent Sources
 *
 * Each source (CV, Interest, Career) searches and matches jobs independently.
 * No combination or weighting - each source gives its own results.
 *
 * Uppdelad 2026-07-03: statisk matchningsdata ligger i data/jobMatchingData.ts,
 * rena matchningsfunktioner i services/jobMatching.ts och subkomponenter i
 * components/jobs/matches/. Här finns källdata-inläsning, de tre
 * sökfunktionerna, state och komposition.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Sparkles, Target, AlertCircle, FileText,
  Briefcase, Loader2, RefreshCw, TrendingUp, Award, Compass,
  Settings2, Car
} from '@/components/ui/icons'
import { Link } from 'react-router-dom'
import type { PlatsbankenJob } from '@/services/arbetsformedlingenApi'
import {
  prefetchJobSearches,
  isGenericSkill,
  matchSkill,
  matchJobTitle,
  checkRequiredLicense,
  applyProfileBoosts,
  type MatchSource,
  type MatchedJob,
  type MatchPreferences
} from '@/services/jobMatching'
import { cvApi } from '@/services/cvApi'
import { userApi } from '@/services/userApi'
import { interestGuideApi } from '@/services/cloudStorage'
import { calculateUserProfile, calculateJobMatches } from '@/services/interestGuideData'
import { unifiedProfileApi } from '@/services/unifiedProfileApi'
import { useSavedJobs } from '@/hooks/useSavedJobs'
import { Card, Button } from '@/components/ui'
import { SourceToggle } from './matches/SourceToggle'
import { LocationSelector } from './matches/LocationSelector'
import { MatchCard } from './matches/MatchCard'
import { MatchesEmptyState } from './matches/MatchesEmptyState'

// ============================================
// TYPES
// ============================================

interface SourceData {
  cv: {
    available: boolean
    skills: string[]
    workTitles: string[]
    education: string[]
  }
  interest: {
    available: boolean
    occupations: Array<{ name: string; matchPercentage: number }>
  }
  career: {
    available: boolean
    preferredRoles: string[]
    desiredJobs: string[]  // From focus mode / profile
    keywords: string[]
  }
  // Profile preferences for filtering and boosting
  preferences: MatchPreferences
}

// ============================================
// MAIN COMPONENT
// ============================================

export function MatchesTab() {
  const { t } = useTranslation()
  const { saveJob, removeJob, isSaved } = useSavedJobs()

  // State
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sourceData, setSourceData] = useState<SourceData | null>(null)
  const [activeSource, setActiveSource] = useState<MatchSource>('cv')
  const [municipalities, setMunicipalities] = useState<string[]>([])

  // Jobs per source
  const [cvJobs, setCvJobs] = useState<MatchedJob[]>([])
  const [interestJobs, setInterestJobs] = useState<MatchedJob[]>([])
  const [careerJobs, setCareerJobs] = useState<MatchedJob[]>([])

  // Load source data (CV, Interest, Career, Profile Preferences)
  const loadSourceData = useCallback(async (): Promise<SourceData> => {
    // Load all data sources in parallel for speed
    const [cv, interestProgress, unifiedProfile, profilePrefs] = await Promise.all([
      cvApi.getCV(),
      interestGuideApi.getProgress(),
      unifiedProfileApi.getProfile(),
      userApi.getPreferences().catch(() => null)
    ])

    // === CV DATA ===
    const skills = cv?.skills?.map((s: string | { name: string }) =>
      typeof s === 'string' ? s : s.name
    ).filter(Boolean) || []
    const certificates = cv?.certificates?.map((c: { name?: string }) => c.name).filter(Boolean) || []
    const languages = cv?.languages?.map((l: string | { name?: string; language?: string }) =>
      typeof l === 'string' ? l : (l.name || l.language)
    ).filter(Boolean) || []
    const allSkills = [...new Set([...skills, ...certificates, ...languages])]

    // Extract work titles - check both camelCase and snake_case (API returns camelCase)
    const workExperiences = cv?.workExperience || cv?.work_experience || []
    const workTitles = workExperiences.map((e: { title?: string; position?: string; role?: string; job_title?: string }) =>
      e.title || e.position || e.role || e.job_title
    ).filter(Boolean) || []

    const education = cv?.education?.map((e: { degree?: string; field?: string }) =>
      `${e.degree || ''} ${e.field || ''}`.trim()
    ).filter(Boolean) || []

    // === INTEREST GUIDE DATA ===
    let occupations: Array<{ name: string; matchPercentage: number }> = []
    if (interestProgress?.is_completed && interestProgress.answers) {
      try {
        const profile = calculateUserProfile(interestProgress.answers)
        if (profile) {
          const matches = calculateJobMatches(profile)
          occupations = matches
            .filter(m => m.matchPercentage >= 50)
            .slice(0, 15)
            .map(m => ({ name: m.occupation.name, matchPercentage: m.matchPercentage }))
        }
      } catch (e) {
        console.error('Error calculating interest matches:', e)
      }
    }

    // === CAREER GOALS DATA ===
    const preferredRoles = unifiedProfile?.career?.preferredRoles || []
    const careerGoals = unifiedProfile?.career?.careerGoals
    const careerKeywords: string[] = []
    if (careerGoals?.shortTerm) {
      careerKeywords.push(...careerGoals.shortTerm.split(/\s+/).filter((w: string) => w.length > 4))
    }
    if (careerGoals?.longTerm) {
      careerKeywords.push(...careerGoals.longTerm.split(/\s+/).filter((w: string) => w.length > 4))
    }

    // Get desired_jobs from profile preferences (DesiredOccupation[]).
    // För legacy-konsumenter mappar vi till labels (strängar) sorterade på prio.
    const desiredJobsRaw = profilePrefs?.desired_jobs || []
    const desiredJobs = [...desiredJobsRaw]
      .sort((a, b) => a.priority - b.priority)
      .map((j) => j.label)

    // === PROFILE PREFERENCES (for filtering/boosting) ===
    const preferences: SourceData['preferences'] = {
      employmentTypes: profilePrefs?.availability?.employmentTypes || [],
      remoteWork: profilePrefs?.availability?.remoteWork || null,
      driversLicense: profilePrefs?.mobility?.driversLicense || [],
      hasCar: profilePrefs?.mobility?.hasCar || false,
      maxCommuteMinutes: profilePrefs?.mobility?.maxCommuteMinutes || null,
      industries: profilePrefs?.work_preferences?.industries || []
    }

    // Combine preferred roles with desired jobs (dedup)
    const allCareerRoles = [...new Set([...preferredRoles, ...desiredJobs])]

    return {
      cv: {
        available: allSkills.length > 0 || workTitles.length > 0 || education.length > 0,
        skills: allSkills,
        workTitles,
        education
      },
      interest: {
        available: occupations.length > 0,
        occupations
      },
      career: {
        available: allCareerRoles.length > 0 || desiredJobs.length > 0,
        preferredRoles: allCareerRoles,
        desiredJobs,
        keywords: [...new Set(careerKeywords)].slice(0, 10)
      },
      preferences
    }
  }, [])

  // Search and match jobs for CV (based on skills, experience, education)
  // BALANCED APPROACH: Trust API results, score based on relevance quality
  const searchCvJobs = useCallback(async (
    data: SourceData['cv'],
    locations: string[],
    preferences: SourceData['preferences']
  ): Promise<MatchedJob[]> => {
    if (!data.available) return []

    // Filter out generic skills for scoring (but keep them for minor bonuses)
    const specificSkills = data.skills.filter(skill => !isGenericSkill(skill))


    // Build search terms from work titles first, then skills/education
    const searchTerms = [
      ...data.workTitles,
      ...specificSkills.slice(0, 2),
      ...data.education.slice(0, 1)
    ].filter(Boolean)

    if (searchTerms.length === 0) {
      return []
    }

    const allJobs: MatchedJob[] = []
    const seenJobIds = new Set<string>()

    // Search for each term separately to get diverse results —
    // förhämtade parallellt i stället för seriellt
    const cvTerms = searchTerms.slice(0, 5)
    const prefetchedCv = await prefetchJobSearches(cvTerms, locations.length === 1 ? locations[0] : undefined)
    for (const searchTerm of cvTerms) {
      try {
        let jobs = prefetchedCv.get(searchTerm) ?? []

        // Filter by location if multiple selected
        if (locations.length > 1) {
          jobs = jobs.filter(job =>
            locations.some(loc => job.workplace_address?.municipality?.toLowerCase().includes(loc.toLowerCase()))
          )
        }

        // Filter out jobs requiring licenses user doesn't have
        jobs = jobs.filter(job => {
          const jobFullText = `${job.headline || ''} ${job.description?.text || ''}`.toLowerCase()
          const licenseCheck = checkRequiredLicense(job.headline || '', jobFullText, data.education, data.workTitles)
          return !licenseCheck.blocked
        })

        for (const job of jobs) {
          if (seenJobIds.has(job.id)) continue
          seenJobIds.add(job.id)

          const jobOccupation = (job.occupation?.label || '').toLowerCase()
          const jobHeadline = (job.headline || '').toLowerCase()
          const jobText = `${jobHeadline} ${job.description?.text || ''}`.toLowerCase()
          const searchTermLower = searchTerm.toLowerCase()
          const matchDetails: string[] = []

          // ========== BASE SCORE (20 points) ==========
          // Job was returned by API for this search term, so it's relevant
          let totalScore = 20
          matchDetails.push(`Hittades via sökningen ”${searchTerm}”`)

          // ========== TITLE/OCCUPATION MATCHING (bonus 0-30 points) ==========
          let titleBonus = 0

          // Check work titles for matches
          for (const userTitle of data.workTitles) {
            const titleResult = matchJobTitle(userTitle, jobHeadline, jobOccupation)
            if (titleResult.match === 'exact') {
              titleBonus = Math.max(titleBonus, 30)
              matchDetails.push(`Du har jobbat som ${userTitle}`)
            } else if (titleResult.match === 'similar') {
              titleBonus = Math.max(titleBonus, 20)
              matchDetails.push(`Liknar din roll som ${userTitle}`)
            } else if (titleResult.match === 'partial') {
              titleBonus = Math.max(titleBonus, 10)
              matchDetails.push(`Relaterat till din erfarenhet som ${userTitle}`)
            }
          }

          // Extra bonus if search term appears directly in headline/occupation
          if (jobHeadline.includes(searchTermLower)) {
            titleBonus = Math.max(titleBonus, 25)
          } else if (jobOccupation.includes(searchTermLower)) {
            titleBonus = Math.max(titleBonus, 20)
          } else if (jobText.includes(searchTermLower)) {
            titleBonus = Math.max(titleBonus, 10)
          }

          totalScore += titleBonus

          // ========== SPECIFIC SKILL MATCHING (0-30 points) ==========
          let skillMatches = 0
          for (const skill of specificSkills) {
            if (matchSkill(skill, jobText)) {
              if (skillMatches < 3) matchDetails.push(skill)
              skillMatches++
            }
          }
          // 10 points per skill, max 30
          totalScore += Math.min(skillMatches * 10, 30)

          // ========== EDUCATION MATCHING (0-15 points) ==========
          let hasEducationMatch = false
          for (const edu of data.education) {
            const words = edu.toLowerCase().split(/\s+/).filter(w => w.length > 3)
            if (words.some(word => jobText.includes(word))) {
              hasEducationMatch = true
              matchDetails.push('Matchar din utbildning')
              break
            }
          }
          if (hasEducationMatch) totalScore += 15

          // All jobs start with 20 base points since API already filtered for relevance

          // Apply profile preference boosts
          const { score, details } = applyProfileBoosts(job, totalScore, preferences, matchDetails)

          allJobs.push({
            job,
            score: Math.round(Math.min(score, 100)),
            source: 'cv' as MatchSource,
            matchDetails: details
          })
        }
      } catch (e) {
        console.error('Error searching for term:', searchTerm, e)
      }
    }

    // Sort by score and return top results
    return allJobs
      .sort((a, b) => b.score - a.score)
      .slice(0, 50)
  }, [])

  // Search and match jobs for Interest (based on RIASEC/interest guide occupations)
  const searchInterestJobs = useCallback(async (
    data: SourceData['interest'],
    locations: string[],
    preferences: SourceData['preferences'],
    userEducation: string[],
    userWorkTitles: string[]
  ): Promise<MatchedJob[]> => {
    if (!data.available || data.occupations.length === 0) return []

    // Helper to extract clean search terms from occupation name
    const getSearchTerms = (name: string): string[] => {
      return name
        .split('/')
        .map(part => part.replace(/\(.*?\)/g, '').trim())
        .filter(part => part.length > 2)
    }

    const topOccupations = data.occupations.slice(0, 8)
    const allJobs: MatchedJob[] = []
    const seenJobIds = new Set<string>()
    const searchTermsUsed = new Set<string>()

    // Samla (yrke, sökterm)-paren först och förhämta alla sökningar
    // parallellt — de seriella await:arna i dubbelloopen var flaskhalsen.
    const termPairs: Array<{ occ: (typeof topOccupations)[number]; searchTerm: string }> = []
    for (const occ of topOccupations) {
      for (const searchTerm of getSearchTerms(occ.name)) {
        if (searchTermsUsed.has(searchTerm.toLowerCase())) continue
        searchTermsUsed.add(searchTerm.toLowerCase())
        termPairs.push({ occ, searchTerm })
      }
    }
    const prefetchedInterest = await prefetchJobSearches(
      termPairs.map((p) => p.searchTerm),
      locations.length === 1 ? locations[0] : undefined,
    )

    for (const { occ, searchTerm } of termPairs) {
        try {
          let jobs = prefetchedInterest.get(searchTerm) ?? []
          if (locations.length > 1) {
            jobs = jobs.filter(job =>
              locations.some(loc => job.workplace_address?.municipality?.toLowerCase().includes(loc.toLowerCase()))
            )
          }

          // Filter out jobs requiring professional licenses user doesn't have
          jobs = jobs.filter(job => {
            const jobFullText = `${job.headline || ''} ${job.description?.text || ''}`.toLowerCase()
            const licenseCheck = checkRequiredLicense(
              job.headline || '',
              jobFullText,
              userEducation,
              userWorkTitles
            )
            return !licenseCheck.blocked
          })

          jobs.forEach(job => {
            if (seenJobIds.has(job.id)) return
            seenJobIds.add(job.id)

            const jobTitle = (job.headline || '').toLowerCase()
            const jobOccupation = (job.occupation?.label || '').toLowerCase()
            const jobText = `${jobTitle} ${jobOccupation}`
            const searchTermLower = searchTerm.toLowerCase()

            // Calculate base match quality based on how well job matches the occupation
            let matchQuality = 0
            const matchDetails: string[] = []

            // Direct match in title (best)
            if (jobTitle.includes(searchTermLower)) {
              matchQuality = 100
              matchDetails.push(`Intresse: ${occ.name}`)
            }
            // Direct match in occupation label
            else if (jobOccupation.includes(searchTermLower)) {
              matchQuality = 90
              matchDetails.push(`Intresse: ${occ.name}`)
            }
            // Partial word match
            else {
              const searchWords = searchTermLower.split(/\s+/).filter(w => w.length > 3)
              const matchedWords = searchWords.filter(w => jobText.includes(w))
              if (matchedWords.length > 0) {
                matchQuality = 70 + (matchedWords.length / searchWords.length) * 20
                matchDetails.push(`Passar ditt intresse för ${occ.name}`)
              } else {
                matchQuality = 50
                matchDetails.push(`Relaterat yrke`)
              }
            }

            // Combine match quality with user's interest percentage
            // If user has 85% match to "Programmerare" and job matches "Programmerare" 100%,
            // base score = (100/100) * 85 = 85
            const baseScore = Math.round((matchQuality / 100) * occ.matchPercentage)

            // Apply profile preference boosts
            const { score, details } = applyProfileBoosts(job, baseScore, preferences, matchDetails)

            allJobs.push({
              job,
              score: Math.max(score, 30),
              source: 'interest' as MatchSource,
              matchDetails: details
            })
          })
        } catch (e) {
          console.error('Error processing term:', searchTerm, e)
        }
    }

    // Deduplicate - keep best score for each job
    const jobMap = new Map<string, MatchedJob>()
    allJobs.forEach(match => {
      const existing = jobMap.get(match.job.id)
      if (!existing || match.score > existing.score) {
        jobMap.set(match.job.id, match)
      }
    })

    return Array.from(jobMap.values())
      .filter(m => m.score >= 30)
      .sort((a, b) => b.score - a.score)
      .slice(0, 50)
  }, [])

  // Search and match jobs for Career (based on desired jobs and career goals)
  const searchCareerJobs = useCallback(async (
    data: SourceData['career'],
    locations: string[],
    preferences: SourceData['preferences'],
    userEducation: string[],
    userWorkTitles: string[]
  ): Promise<MatchedJob[]> => {
    // Career matching uses both preferredRoles AND desiredJobs
    const searchRoles = data.preferredRoles.length > 0
      ? data.preferredRoles
      : data.desiredJobs

    if (searchRoles.length === 0) return []

    const allJobs: MatchedJob[] = []
    const seenJobIds = new Set<string>()

    // Search for each career role/desired job — förhämtade parallellt
    const careerRoles = searchRoles.slice(0, 8)
    const prefetchedCareer = await prefetchJobSearches(careerRoles, locations.length === 1 ? locations[0] : undefined)
    for (const role of careerRoles) {
      try {
        let jobs = prefetchedCareer.get(role) ?? []
        if (locations.length > 1) {
          jobs = jobs.filter(job =>
            locations.some(loc => job.workplace_address?.municipality?.toLowerCase().includes(loc.toLowerCase()))
          )
        }

        // Filter out jobs requiring professional licenses user doesn't have
        jobs = jobs.filter(job => {
          const jobFullText = `${job.headline || ''} ${job.description?.text || ''}`.toLowerCase()
          const licenseCheck = checkRequiredLicense(
            job.headline || '',
            jobFullText,
            userEducation,
            userWorkTitles
          )
          return !licenseCheck.blocked
        })

        jobs.forEach(job => {
          if (seenJobIds.has(job.id)) return
          seenJobIds.add(job.id)

          const jobTitle = (job.headline || '').toLowerCase()
          const jobOccupation = (job.occupation?.label || '').toLowerCase()
          const jobText = `${jobTitle} ${job.description?.text || ''} ${jobOccupation}`.toLowerCase()
          const roleLower = role.toLowerCase()
          const matchDetails: string[] = []
          let baseScore = 0

          // Check if this is from desiredJobs (higher weight - user explicitly wants this)
          const isDesiredJob = data.desiredJobs.some(dj => dj.toLowerCase() === roleLower)

          // Direct title match (best)
          if (jobTitle.includes(roleLower)) {
            baseScore = isDesiredJob ? 90 : 75
            matchDetails.push(isDesiredJob ? `Önskat yrke: ${role}` : `Karriärmål: ${role}`)
          }
          // Occupation label match
          else if (jobOccupation.includes(roleLower)) {
            baseScore = isDesiredJob ? 80 : 65
            matchDetails.push(isDesiredJob ? `Önskat yrke: ${role}` : `Karriärmål: ${role}`)
          }
          // Description match
          else if (jobText.includes(roleLower)) {
            baseScore = isDesiredJob ? 60 : 50
            matchDetails.push(`Nära ditt mål: ${role}`)
          }

          // Check career keywords for additional boost
          let keywordBoost = 0
          data.keywords.forEach(keyword => {
            if (keyword.length > 4 && jobText.includes(keyword.toLowerCase())) {
              keywordBoost += 5
              if (matchDetails.length < 4) {
                matchDetails.push(keyword)
              }
            }
          })
          baseScore += Math.min(keywordBoost, 20) // Cap keyword boost at 20

          if (baseScore >= 30) {
            // Apply profile preference boosts
            const { score, details } = applyProfileBoosts(job, baseScore, preferences, matchDetails)

            allJobs.push({
              job,
              score: Math.min(100, Math.round(score)),
              source: 'career' as MatchSource,
              matchDetails: details
            })
          }
        })
      } catch (e) {
        console.error('Error searching for role:', role, e)
      }
    }

    // Deduplicate - keep best score
    const jobMap = new Map<string, MatchedJob>()
    allJobs.forEach(match => {
      const existing = jobMap.get(match.job.id)
      if (!existing || match.score > existing.score) {
        jobMap.set(match.job.id, match)
      }
    })

    return Array.from(jobMap.values())
      .filter(m => m.score >= 30)
      .sort((a, b) => b.score - a.score)
      .slice(0, 50)
  }, [])

  // Load all data
  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await loadSourceData()
      setSourceData(data)

      // Set default active source to first available
      if (data.cv.available) {
        setActiveSource('cv')
      } else if (data.interest.available) {
        setActiveSource('interest')
      } else if (data.career.available) {
        setActiveSource('career')
      }

      // Load jobs for each available source in parallel (pass preferences to each)
      // Also pass CV education/workTitles for license filtering in all sources
      const userEducation = data.cv.education || []
      const userWorkTitles = data.cv.workTitles || []

      const [cvResults, interestResults, careerResults] = await Promise.all([
        data.cv.available ? searchCvJobs(data.cv, municipalities, data.preferences) : Promise.resolve([]),
        data.interest.available ? searchInterestJobs(data.interest, municipalities, data.preferences, userEducation, userWorkTitles) : Promise.resolve([]),
        data.career.available ? searchCareerJobs(data.career, municipalities, data.preferences, userEducation, userWorkTitles) : Promise.resolve([])
      ])

      setCvJobs(cvResults)
      setInterestJobs(interestResults)
      setCareerJobs(careerResults)
    } catch (err) {
      console.error('Error loading matches:', err)
      setError(t('jobs.matches.errorLoading'))
    } finally {
      setIsLoading(false)
    }
  }, [loadSourceData, searchCvJobs, searchInterestJobs, searchCareerJobs, municipalities])

  // Initial load
  useEffect(() => {
    loadData()
  }, [])

  // Reload when municipalities change
  useEffect(() => {
    if (sourceData && !isLoading) {
      loadData()
    }
  }, [municipalities])

  // Get current jobs based on active source
  const currentJobs = useMemo(() => {
    switch (activeSource) {
      case 'cv': return cvJobs
      case 'interest': return interestJobs
      case 'career': return careerJobs
      default: return []
    }
  }, [activeSource, cvJobs, interestJobs, careerJobs])

  // Stats
  const stats = useMemo(() => ({
    high: currentJobs.filter(m => m.score >= 70).length,
    medium: currentJobs.filter(m => m.score >= 50 && m.score < 70).length,
    total: currentJobs.length
  }), [currentJobs])

  // Visa bra matchningar (score >= 50) först — 50 kort i ett svep är en
  // överväldigande vägg (~23 skärmar på mobil). Resten bakom "Visa fler".
  const [showAllMatches, setShowAllMatches] = useState(false)
  useEffect(() => { setShowAllMatches(false) }, [activeSource, municipalities])
  const goodJobs = useMemo(() => currentJobs.filter(m => m.score >= 50), [currentJobs])
  const displayedJobs = showAllMatches || goodJobs.length === 0 ? currentJobs : goodJobs
  const hiddenCount = currentJobs.length - displayedJobs.length

  // Toggle: spara/av-spara — knappen var tidigare disabled när jobbet var
  // sparat, så av-sparning var omöjlig här (inkonsekvent mot Sök-fliken).
  const handleSave = async (job: PlatsbankenJob) => {
    if (isSaved(job.id)) {
      await removeJob(job.id)
    } else {
      await saveJob(job)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-10 h-10 text-sky-600 animate-spin mb-4" />
        <p className="text-stone-600 dark:text-stone-400">{t('jobs.matches.searching')}</p>
      </div>
    )
  }

  const hasAnyData = sourceData && (sourceData.cv.available || sourceData.interest.available || sourceData.career.available)

  const emptyStateLabels = {
    createProfileFirst: t('jobs.matches.createProfileFirst'),
    createProfileDesc: t('jobs.matches.createProfileDesc'),
    createCV: t('jobs.matches.createCV'),
    takeInterestGuide: t('jobs.matches.takeInterestGuide'),
    setCareerGoals: t('jobs.matches.setCareerGoals'),
    noJobsFound: t('jobs.matches.noJobsFound')
  }

  if (!hasAnyData) {
    return <MatchesEmptyState type="no-data" labels={emptyStateLabels} />
  }

  if (error) {
    return (
      <Card className="p-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-stone-700 dark:text-stone-300 mb-2">{t('common.error')}</h3>
        <p className="text-stone-700 dark:text-stone-300 mb-4">{error}</p>
        <Button onClick={loadData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('common.tryAgain')}
        </Button>
      </Card>
    )
  }

  const locationLabels = {
    allLocations: t('jobs.matches.allLocations'),
    location: t('jobs.matches.location'),
    locations: t('jobs.matches.locations'),
    searchLocation: t('jobs.matches.searchLocation'),
    noResults: t('jobs.matches.noResults'),
    clearAll: t('jobs.matches.clearAll')
  }

  const matchCardLabels = {
    match: t('jobs.matches.match'),
    levelStrong: t('jobs.matches.level.strong', 'Stark'),
    levelGood: t('jobs.matches.level.good', 'Bra'),
    levelPossible: t('jobs.matches.level.possible', 'Möjlig'),
    cv: t('jobs.matches.sources.cv'),
    interest: t('jobs.matches.sources.interest'),
    career: t('jobs.matches.sources.career'),
    unknownCompany: t('common.employerNotSpecified'),
    showMatchDetails: t('jobs.matches.showMatchDetails'),
    matchesOn: t('jobs.matches.matchesOn'),
    apply: t('jobs.card.apply')
  }

  return (
    <div className="space-y-6">
      {/* Header with source tabs */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 p-5">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              {t('jobs.matches.title')}
            </h2>
            <p className="text-sm text-stone-700 dark:text-stone-300">
              {t('jobs.matches.subtitle')}
            </p>
          </div>

          {/* Source tabs */}
          <div className="flex flex-wrap gap-2">
            <SourceToggle
              source="cv"
              label={t('jobs.matches.sources.myCV')}
              icon={FileText}
              active={activeSource === 'cv'}
              available={sourceData?.cv.available || false}
              count={cvJobs.length}
              missingLabel={t('jobs.matches.missing')}
              onToggle={() => setActiveSource('cv')}
            />
            <SourceToggle
              source="interest"
              label={t('jobs.matches.sources.interestGuide')}
              icon={Compass}
              active={activeSource === 'interest'}
              available={sourceData?.interest.available || false}
              count={interestJobs.length}
              missingLabel={t('jobs.matches.missing')}
              onToggle={() => setActiveSource('interest')}
            />
            <SourceToggle
              source="career"
              label={t('jobs.matches.sources.careerGoals')}
              icon={Target}
              active={activeSource === 'career'}
              available={sourceData?.career.available || false}
              count={careerJobs.length}
              missingLabel={t('jobs.matches.missing')}
              onToggle={() => setActiveSource('career')}
            />
          </div>

          {/* Location filter */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-stone-100 dark:border-stone-700">
            <span className="text-sm text-stone-600 dark:text-stone-400">{t('jobs.matches.locationsLabel')}:</span>
            <LocationSelector
              selected={municipalities}
              onChange={setMunicipalities}
              labels={locationLabels}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-green-100">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">{t('jobs.matches.stats.goodMatch')}</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{stats.high}</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-100">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">{t('jobs.matches.stats.possible')}</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">{stats.medium}</p>
        </div>
        <div className="bg-stone-50 dark:bg-stone-800 rounded-xl p-4 border border-stone-100 dark:border-stone-700">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="w-4 h-4 text-stone-600 dark:text-stone-400" />
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{t('jobs.matches.stats.total')}</span>
          </div>
          <p className="text-2xl font-bold text-stone-700 dark:text-stone-200">{stats.total}</p>
        </div>
      </div>

      {/* Profile preferences info */}
      {sourceData?.preferences && (
        sourceData.preferences.employmentTypes.length > 0 ||
        sourceData.preferences.remoteWork ||
        sourceData.preferences.driversLicense.length > 0
      ) && (
        <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800/50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900/40 rounded-lg flex items-center justify-center shrink-0">
              <Settings2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sky-800 dark:text-sky-200 text-sm mb-1">
                {t('jobs.matches.preferencesUsed', 'Dina preferenser påverkar matchningen')}
              </h4>
              <div className="flex flex-wrap gap-2 text-xs">
                {sourceData.preferences.employmentTypes.length > 0 && (
                  <span className="px-2 py-1 bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 rounded-full">
                    {sourceData.preferences.employmentTypes.map(t =>
                      t === 'fulltime' ? 'Heltid' : t === 'parttime' ? 'Deltid' : t
                    ).join(', ')}
                  </span>
                )}
                {sourceData.preferences.remoteWork && (
                  <span className="px-2 py-1 bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 rounded-full">
                    {sourceData.preferences.remoteWork === 'yes' ? 'Distansarbete' :
                     sourceData.preferences.remoteWork === 'hybrid' ? 'Hybrid' : 'På plats'}
                  </span>
                )}
                {sourceData.preferences.driversLicense.length > 0 && (
                  <span className="px-2 py-1 bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 rounded-full flex items-center gap-1">
                    <Car className="w-3 h-3" />
                    Körkort {sourceData.preferences.driversLicense.join(', ')}
                  </span>
                )}
                {sourceData.preferences.hasCar && (
                  <span className="px-2 py-1 bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 rounded-full">
                    Har bil
                  </span>
                )}
              </div>
            </div>
            <Link to="/profile" className="text-xs text-sky-600 dark:text-sky-400 hover:underline shrink-0">
              Ändra
            </Link>
          </div>
        </div>
      )}

      {/* Refresh button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="w-4 h-4 mr-1" />
          {t('jobs.matches.refresh')}
        </Button>
      </div>

      {/* Jobs Grid */}
      {currentJobs.length === 0 ? (
        <MatchesEmptyState type="no-results" labels={emptyStateLabels} />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {displayedJobs.map(matchedJob => (
              <MatchCard
                key={matchedJob.job.id}
                matchedJob={matchedJob}
                onSave={handleSave}
                isSaved={isSaved(matchedJob.job.id)}
                labels={matchCardLabels}
              />
            ))}
          </div>
          {hiddenCount > 0 && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={() => setShowAllMatches(true)}>
                {t('jobs.matches.showMoreMatches', { count: hiddenCount })}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default MatchesTab
