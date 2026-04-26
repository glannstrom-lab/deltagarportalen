/**
 * MatchesTab - Job Matching with Three Independent Sources
 *
 * Each source (CV, Interest, Career) searches and matches jobs independently.
 * No combination or weighting - each source gives its own results.
 */

import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Sparkles, Target, CheckCircle, AlertCircle, FileText,
  Briefcase, MapPin, Heart, ExternalLink, ChevronDown,
  Loader2, RefreshCw, TrendingUp, Award, Compass,
  Settings2, X
} from '@/components/ui/icons'
import { Link } from 'react-router-dom'
import { searchJobs, type PlatsbankenJob, SWEDISH_MUNICIPALITIES } from '@/services/arbetsformedlingenApi'
import { cvApi } from '@/services/supabaseApi'
import { interestGuideApi } from '@/services/cloudStorage'
import { calculateUserProfile, calculateJobMatches } from '@/services/interestGuideData'
import { unifiedProfileApi } from '@/services/unifiedProfileApi'
import { useSavedJobs } from '@/hooks/useSavedJobs'
import { cn } from '@/lib/utils'
import { Card, Button } from '@/components/ui'

// ============================================
// TYPES
// ============================================

type MatchSource = 'cv' | 'interest' | 'career'

interface MatchedJob {
  job: PlatsbankenJob
  score: number
  source: MatchSource
  matchDetails: string[]
}

interface SourceData {
  cv: {
    available: boolean
    skills: string[]
    workTitles: string[]
  }
  interest: {
    available: boolean
    occupations: Array<{ name: string; matchPercentage: number }>
  }
  career: {
    available: boolean
    preferredRoles: string[]
    keywords: string[]
  }
}

// ============================================
// HELPER COMPONENTS
// ============================================

function SourceToggle({
  source,
  label,
  icon: Icon,
  active,
  available,
  count,
  missingLabel,
  onToggle
}: {
  source: MatchSource
  label: string
  icon: React.ElementType
  active: boolean
  available: boolean
  count: number
  missingLabel: string
  onToggle: () => void
}) {
  const colors = {
    cv: 'bg-brand-100 text-brand-900 border-brand-300',
    interest: 'bg-amber-100 text-amber-700 border-amber-300',
    career: 'bg-brand-100 text-brand-900 border-brand-300'
  }

  return (
    <button
      onClick={onToggle}
      disabled={!available}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all",
        active && available ? colors[source] : "bg-white dark:bg-stone-900 border-slate-200 dark:border-stone-700 text-slate-700 dark:text-stone-300",
        !available && "opacity-50 cursor-not-allowed",
        available && !active && "hover:border-slate-300 dark:hover:border-stone-600"
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="font-medium text-sm">{label}</span>
      {available && count > 0 && (
        <span className={cn(
          "text-xs px-2 py-0.5 rounded-full",
          active ? "bg-white/50" : "bg-slate-100"
        )}>
          {count}
        </span>
      )}
      {!available && (
        <span className="text-xs bg-slate-200 dark:bg-stone-700 px-2 py-0.5 rounded-full ml-1">
          {missingLabel}
        </span>
      )}
    </button>
  )
}

function LocationSelector({
  selected,
  onChange,
  labels
}: {
  selected: string[]
  onChange: (locations: string[]) => void
  labels: {
    allLocations: string
    location: string
    locations: string
    searchLocation: string
    noResults: string
    clearAll: string
  }
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredMunicipalities = useMemo(() =>
    SWEDISH_MUNICIPALITIES.filter(m =>
      m.label.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 20),
    [search]
  )

  const toggleLocation = (location: string) => {
    if (selected.includes(location)) {
      onChange(selected.filter(l => l !== location))
    } else {
      onChange([...selected, location])
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:border-slate-300 dark:hover:border-stone-600 transition-colors"
      >
        <MapPin className="w-4 h-4 text-slate-700 dark:text-stone-300" />
        <span className="font-medium text-sm text-slate-700 dark:text-stone-300">
          {selected.length === 0
            ? labels.allLocations
            : `${selected.length} ${selected.length === 1 ? labels.location : labels.locations}`
          }
        </span>
        <ChevronDown className={cn("w-4 h-4 text-slate-600 dark:text-stone-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-2 left-0 w-72 bg-white dark:bg-stone-900 rounded-xl border border-slate-200 dark:border-stone-700 z-20 overflow-hidden">
            <div className="p-3 border-b border-slate-100 dark:border-stone-700">
              <input
                type="text"
                placeholder={labels.searchLocation}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
              />
            </div>

            {selected.length > 0 && (
              <div className="p-2 border-b border-slate-100 dark:border-stone-700 bg-slate-50 dark:bg-stone-800">
                <div className="flex flex-wrap gap-1">
                  {selected.map(loc => (
                    <button
                      key={loc}
                      onClick={() => toggleLocation(loc)}
                      className="flex items-center gap-1 px-2 py-1 bg-brand-100 text-brand-900 rounded-lg text-xs font-medium hover:bg-brand-200"
                    >
                      {loc}
                      <X className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto p-2">
              {filteredMunicipalities.length === 0 ? (
                <p className="text-sm text-slate-700 dark:text-stone-300 text-center py-4">{labels.noResults}</p>
              ) : (
                filteredMunicipalities.map(m => (
                  <button
                    key={m.concept_id}
                    onClick={() => toggleLocation(m.label)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      selected.includes(m.label)
                        ? "bg-brand-100 text-brand-900 font-medium"
                        : "hover:bg-slate-100 dark:hover:bg-stone-800 text-slate-700 dark:text-stone-300"
                    )}
                  >
                    {m.label}
                  </button>
                ))
              )}
            </div>

            {selected.length > 0 && (
              <div className="p-2 border-t border-slate-100 dark:border-stone-700">
                <button
                  onClick={() => onChange([])}
                  className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  {labels.clearAll}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// Memoized to prevent unnecessary re-renders when filtering/sorting doesn't change this card's data
const MatchCard = memo(function MatchCard({
  matchedJob,
  onSave,
  isSaved,
  labels
}: {
  matchedJob: MatchedJob
  onSave: (job: PlatsbankenJob) => void
  isSaved: boolean
  labels: {
    match: string
    cv: string
    interest: string
    career: string
    unknownCompany: string
    showMatchDetails: string
    matchesOn: string
    apply: string
  }
}) {
  const { job, score, source, matchDetails } = matchedJob
  const [showDetails, setShowDetails] = useState(false)

  const scoreColor = score >= 70
    ? 'text-brand-900 bg-brand-100 border-brand-200'
    : score >= 50
      ? 'text-amber-600 bg-amber-100 border-amber-200'
      : 'text-slate-600 bg-slate-100 border-slate-200'

  const sourceConfig = {
    cv: { color: 'bg-brand-100 text-brand-900', label: labels.cv, icon: FileText },
    interest: { color: 'bg-amber-100 text-amber-700', label: labels.interest, icon: Compass },
    career: { color: 'bg-brand-100 text-brand-900', label: labels.career, icon: Target }
  }

  const config = sourceConfig[source]

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-slate-200 dark:border-stone-700 overflow-hidden hover: transition-shadow">
      <div className="flex items-start gap-4 p-5">
        <div className={cn(
          "w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border",
          scoreColor
        )}>
          <span className="text-lg font-bold">{score}%</span>
          <span className="text-[10px] font-medium">{labels.match}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", config.color)}>
              {config.label}
            </span>
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-stone-100 line-clamp-2 mb-1">
            {job.headline}
          </h3>
          <p className="text-sm text-slate-600 dark:text-stone-400 flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5" />
            {job.employer?.name || labels.unknownCompany}
          </p>
          {job.workplace_address?.municipality && (
            <p className="text-sm text-slate-700 dark:text-stone-300 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5" />
              {job.workplace_address.municipality}
            </p>
          )}
        </div>

        <button
          onClick={() => onSave(job)}
          disabled={isSaved}
          className={cn(
            "p-2 rounded-lg transition-colors",
            isSaved
              ? "bg-red-100 text-red-600"
              : "hover:bg-slate-100 dark:hover:bg-stone-800 text-slate-600 dark:text-stone-400 hover:text-red-500"
          )}
        >
          <Heart className={cn("w-5 h-5", isSaved && "fill-current")} />
        </button>
      </div>

      {matchDetails.length > 0 && (
        <div className="px-5 pb-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-xs text-slate-700 dark:text-stone-300 hover:text-slate-700 dark:hover:text-stone-200"
          >
            <Settings2 className="w-3 h-3" />
            {labels.showMatchDetails}
            <ChevronDown className={cn("w-3 h-3 transition-transform", showDetails && "rotate-180")} />
          </button>
        </div>
      )}

      {showDetails && matchDetails.length > 0 && (
        <div className="px-5 pb-4">
          <p className="text-xs font-medium text-slate-600 dark:text-stone-400 mb-1.5 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-brand-900" />
            {labels.matchesOn}
          </p>
          <div className="flex flex-wrap gap-1">
            {matchDetails.slice(0, 6).map((detail, i) => (
              <span key={i} className={cn("px-2 py-0.5 text-xs rounded", config.color)}>
                {detail}
              </span>
            ))}
            {matchDetails.length > 6 && (
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-stone-800 text-slate-600 dark:text-stone-400 text-xs rounded">
                +{matchDetails.length - 6}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-stone-700 bg-slate-50 dark:bg-stone-800">
        <span className="text-xs text-slate-700 dark:text-stone-300">
          {new Date(job.publication_date).toLocaleDateString('sv-SE')}
        </span>
        {job.webpage_url && (
          <a
            href={job.webpage_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            {labels.apply}
          </a>
        )}
      </div>
    </div>
  )
})

function EmptyState({ type, labels }: {
  type: 'no-data' | 'no-results'
  labels: {
    createProfileFirst: string
    createProfileDesc: string
    createCV: string
    takeInterestGuide: string
    setCareerGoals: string
    noJobsFound: string
  }
}) {
  if (type === 'no-data') {
    return (
      <Card className="p-12 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-brand-100 to-sky-100 rounded-xl flex items-center justify-center mx-auto mb-6">
          <FileText className="w-10 h-10 text-brand-900" />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 dark:text-stone-100 mb-3">
          {labels.createProfileFirst}
        </h3>
        <p className="text-slate-700 dark:text-stone-300 mb-8 max-w-md mx-auto">
          {labels.createProfileDesc}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/cv">
            <Button size="lg">
              <FileText className="w-5 h-5 mr-2" />
              {labels.createCV}
            </Button>
          </Link>
          <Link to="/interest-guide">
            <Button variant="outline" size="lg">
              <Compass className="w-5 h-5 mr-2" />
              {labels.takeInterestGuide}
            </Button>
          </Link>
          <Link to="/profile">
            <Button variant="outline" size="lg">
              <Target className="w-5 h-5 mr-2" />
              {labels.setCareerGoals}
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-8 text-center">
      <Sparkles className="w-12 h-12 text-slate-300 dark:text-stone-600 mx-auto mb-4" />
      <p className="text-slate-700 dark:text-stone-300">
        {labels.noJobsFound}
      </p>
    </Card>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function MatchesTab() {
  const { t } = useTranslation()
  const { saveJob, isSaved } = useSavedJobs()

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

  // Load source data (CV, Interest, Career)
  const loadSourceData = useCallback(async (): Promise<SourceData> => {
    // Load CV
    const cv = await cvApi.getCV()
    const skills = cv?.skills?.map((s: string | { name: string }) =>
      typeof s === 'string' ? s : s.name
    ).filter(Boolean) || []
    const certificates = cv?.certificates?.map((c: { name?: string }) => c.name).filter(Boolean) || []
    const languages = cv?.languages?.map((l: string | { name?: string; language?: string }) =>
      typeof l === 'string' ? l : (l.name || l.language)
    ).filter(Boolean) || []
    const allSkills = [...new Set([...skills, ...certificates, ...languages])]
    const workTitles = cv?.work_experience?.map((e: { title?: string }) => e.title).filter(Boolean) || []

    // Load Interest Guide
    const interestProgress = await interestGuideApi.getProgress()
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

    // Load Career Goals
    const unifiedProfile = await unifiedProfileApi.getProfile()
    const preferredRoles = unifiedProfile?.career?.preferredRoles || []
    const careerGoals = unifiedProfile?.career?.careerGoals
    const careerKeywords: string[] = []
    if (careerGoals?.shortTerm) {
      careerKeywords.push(...careerGoals.shortTerm.split(/\s+/).filter((w: string) => w.length > 4))
    }
    if (careerGoals?.longTerm) {
      careerKeywords.push(...careerGoals.longTerm.split(/\s+/).filter((w: string) => w.length > 4))
    }

    return {
      cv: {
        available: allSkills.length > 0 || workTitles.length > 0,
        skills: allSkills,
        workTitles
      },
      interest: {
        available: occupations.length > 0,
        occupations
      },
      career: {
        available: preferredRoles.length > 0,
        preferredRoles,
        keywords: [...new Set(careerKeywords)].slice(0, 10)
      }
    }
  }, [])

  // Search and match jobs for CV
  const searchCvJobs = useCallback(async (data: SourceData['cv'], locations: string[]): Promise<MatchedJob[]> => {
    if (!data.available) return []

    const searchTerms = [...data.skills.slice(0, 3), ...data.workTitles.slice(0, 2)]
    if (searchTerms.length === 0) return []

    const result = await searchJobs({
      query: searchTerms.join(' '),
      municipality: locations.length === 1 ? locations[0] : undefined,
      limit: 50,
      publishedWithin: 'month'
    })

    let jobs = result.hits
    if (locations.length > 1) {
      jobs = jobs.filter(job =>
        locations.some(loc => job.workplace_address?.municipality?.toLowerCase().includes(loc.toLowerCase()))
      )
    }

    // Match each job
    return jobs.map(job => {
      const jobText = `${job.headline || ''} ${job.description?.text || ''} ${job.occupation?.label || ''}`.toLowerCase()
      const matchDetails: string[] = []
      let matchCount = 0

      // Check skills
      data.skills.forEach(skill => {
        const skillLower = skill.toLowerCase()
        if (jobText.includes(skillLower) || (skillLower.includes('körkort') && jobText.includes('körkort'))) {
          matchDetails.push(skill)
          matchCount++
        }
      })

      // Check work titles
      data.workTitles.forEach(title => {
        if (jobText.includes(title.toLowerCase())) {
          matchDetails.push(title)
          matchCount++
        }
      })

      const totalItems = data.skills.length + data.workTitles.length
      const score = totalItems > 0
        ? Math.min(100, Math.round((matchCount / Math.min(totalItems, 5)) * 100))
        : 0

      return {
        job,
        score: Math.max(score, matchDetails.length > 0 ? 30 : 0),
        source: 'cv' as MatchSource,
        matchDetails
      }
    })
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score)
  }, [])

  // Search and match jobs for Interest
  const searchInterestJobs = useCallback(async (data: SourceData['interest'], locations: string[]): Promise<MatchedJob[]> => {
    if (!data.available || data.occupations.length === 0) return []

    // Helper to extract clean search terms from occupation name
    const getSearchTerms = (name: string): string[] => {
      // Split on / and extract parts, remove parentheses content
      return name
        .split('/')
        .map(part => part.replace(/\(.*?\)/g, '').trim())
        .filter(part => part.length > 2)
    }

    const topOccupations = data.occupations.slice(0, 8)
    const allJobs: MatchedJob[] = []
    const seenJobIds = new Set<string>()

    // Collect all unique search terms
    const searchTermsUsed = new Set<string>()

    for (const occ of topOccupations) {
      const searchTerms = getSearchTerms(occ.name)

      for (const searchTerm of searchTerms) {
        // Skip if we already searched this term
        if (searchTermsUsed.has(searchTerm.toLowerCase())) continue
        searchTermsUsed.add(searchTerm.toLowerCase())

        try {
          const result = await searchJobs({
            query: searchTerm,
            municipality: locations.length === 1 ? locations[0] : undefined,
            limit: 25,
            publishedWithin: 'month'
          })

          let jobs = result.hits
          if (locations.length > 1) {
            jobs = jobs.filter(job =>
              locations.some(loc => job.workplace_address?.municipality?.toLowerCase().includes(loc.toLowerCase()))
            )
          }

          jobs.forEach(job => {
            if (seenJobIds.has(job.id)) return
            seenJobIds.add(job.id)

            const jobTitle = (job.headline || '').toLowerCase()
            const jobOccupation = (job.occupation?.label || '').toLowerCase()
            const jobText = `${jobTitle} ${jobOccupation}`
            const searchTermLower = searchTerm.toLowerCase()

            // Calculate match quality
            let matchQuality = 0
            const matchDetails: string[] = []

            // Direct match in title
            if (jobTitle.includes(searchTermLower)) {
              matchQuality = 100
              matchDetails.push(searchTerm)
            }
            // Direct match in occupation label
            else if (jobOccupation.includes(searchTermLower)) {
              matchQuality = 90
              matchDetails.push(searchTerm)
            }
            // Word match
            else {
              const searchWords = searchTermLower.split(/\s+/).filter(w => w.length > 3)
              const matchedWords = searchWords.filter(w => jobText.includes(w))
              if (matchedWords.length > 0) {
                matchQuality = 70 + (matchedWords.length / searchWords.length) * 20
                matchDetails.push(searchTerm)
              } else {
                // Still related since search returned it
                matchQuality = 50
                matchDetails.push(searchTerm + ' (relaterat)')
              }
            }

            // Final score combines match quality with occupation recommendation percentage
            const score = Math.round((matchQuality / 100) * occ.matchPercentage)

            allJobs.push({
              job,
              score: Math.max(score, 30),
              source: 'interest' as MatchSource,
              matchDetails
            })
          })
        } catch (e) {
          console.error('Error searching for term:', searchTerm, e)
        }
      }
    }

    // Deduplicate and keep best score for each job
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

  // Search and match jobs for Career
  const searchCareerJobs = useCallback(async (data: SourceData['career'], locations: string[]): Promise<MatchedJob[]> => {
    if (!data.available || data.preferredRoles.length === 0) return []

    const allJobs: MatchedJob[] = []
    const seenJobIds = new Set<string>()

    // Search for each preferred role
    for (const role of data.preferredRoles.slice(0, 5)) {
      try {
        const result = await searchJobs({
          query: role,
          municipality: locations.length === 1 ? locations[0] : undefined,
          limit: 20,
          publishedWithin: 'month'
        })

        let jobs = result.hits
        if (locations.length > 1) {
          jobs = jobs.filter(job =>
            locations.some(loc => job.workplace_address?.municipality?.toLowerCase().includes(loc.toLowerCase()))
          )
        }

        jobs.forEach(job => {
          if (seenJobIds.has(job.id)) return
          seenJobIds.add(job.id)

          const jobText = `${job.headline || ''} ${job.description?.text || ''}`.toLowerCase()
          const matchDetails: string[] = []
          let score = 0

          // Check preferred roles
          if (jobText.includes(role.toLowerCase())) {
            matchDetails.push(role)
            score += 40
          }

          // Check keywords
          data.keywords.forEach(keyword => {
            if (jobText.includes(keyword.toLowerCase())) {
              matchDetails.push(keyword)
              score += 10
            }
          })

          if (matchDetails.length > 0) {
            allJobs.push({
              job,
              score: Math.min(100, score),
              source: 'career' as MatchSource,
              matchDetails
            })
          }
        })
      } catch (e) {
        console.error('Error searching for role:', role, e)
      }
    }

    return allJobs
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

      // Load jobs for each available source in parallel
      const [cvResults, interestResults, careerResults] = await Promise.all([
        data.cv.available ? searchCvJobs(data.cv, municipalities) : Promise.resolve([]),
        data.interest.available ? searchInterestJobs(data.interest, municipalities) : Promise.resolve([]),
        data.career.available ? searchCareerJobs(data.career, municipalities) : Promise.resolve([])
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

  const handleSave = async (job: PlatsbankenJob) => {
    await saveJob(job)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-10 h-10 text-sky-600 animate-spin mb-4" />
        <p className="text-slate-600 dark:text-stone-400">{t('jobs.matches.searching')}</p>
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
    return <EmptyState type="no-data" labels={emptyStateLabels} />
  }

  if (error) {
    return (
      <Card className="p-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 dark:text-stone-300 mb-2">{t('common.error')}</h3>
        <p className="text-slate-700 dark:text-stone-300 mb-4">{error}</p>
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
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-slate-200 dark:border-stone-700 p-5">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-stone-100 flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              {t('jobs.matches.title')}
            </h2>
            <p className="text-sm text-slate-700 dark:text-stone-300">
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
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-stone-700">
            <span className="text-sm text-slate-600 dark:text-stone-400">{t('jobs.matches.locationsLabel')}:</span>
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
        <div className="bg-gradient-to-br from-brand-50 to-emerald-50 rounded-xl p-4 border border-brand-100">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-brand-900" />
            <span className="text-sm font-medium text-brand-900">{t('jobs.matches.stats.goodMatch')}</span>
          </div>
          <p className="text-2xl font-bold text-brand-900">{stats.high}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">{t('jobs.matches.stats.possible')}</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">{stats.medium}</p>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-stone-800 dark:to-stone-800 rounded-xl p-4 border border-slate-100 dark:border-stone-700">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="w-4 h-4 text-slate-600 dark:text-stone-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-stone-300">{t('jobs.matches.stats.total')}</span>
          </div>
          <p className="text-2xl font-bold text-slate-700 dark:text-stone-200">{stats.total}</p>
        </div>
      </div>

      {/* Refresh button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="w-4 h-4 mr-1" />
          {t('jobs.matches.refresh')}
        </Button>
      </div>

      {/* Jobs Grid */}
      {currentJobs.length === 0 ? (
        <EmptyState type="no-results" labels={emptyStateLabels} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {currentJobs.map(matchedJob => (
            <MatchCard
              key={matchedJob.job.id}
              matchedJob={matchedJob}
              onSave={handleSave}
              isSaved={isSaved(matchedJob.job.id)}
              labels={matchCardLabels}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default MatchesTab
