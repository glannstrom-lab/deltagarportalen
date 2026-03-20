/**
 * MatchesTab - Advanced Job Matching
 * Matches jobs against CV, Interest Guide (RIASEC), and Career Goals
 * With location filtering
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Sparkles, Target, CheckCircle, AlertCircle, FileText,
  Briefcase, MapPin, Heart, ExternalLink, ChevronDown,
  Loader2, RefreshCw, TrendingUp, Award, Compass, Star,
  Settings2, X, Filter, GraduationCap, Lightbulb
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { searchJobs, type PlatsbankenJob, SWEDISH_MUNICIPALITIES } from '@/services/arbetsformedlingenApi'
import { cvApi } from '@/services/supabaseApi'
import { interestGuideApi } from '@/services/cloudStorage'
import { calculateUserProfile } from '@/services/interestGuideData'
import { unifiedProfileApi } from '@/services/unifiedProfileApi'
import { useSavedJobs } from '@/hooks/useSavedJobs'
import { matchJobsToInterests, type RiasecScores, type JobInterestMatch } from '@/services/interestJobMatching'
import { cn } from '@/lib/utils'
import { Card, Button } from '@/components/ui'

// ============================================
// TYPES
// ============================================

type MatchSource = 'cv' | 'interest' | 'career'

interface MatchedJob {
  job: PlatsbankenJob
  totalScore: number
  cvScore: number
  interestScore: number
  careerScore: number
  matchingSkills: string[]
  missingSkills: string[]
  matchedInterestTypes: string[]
  matchedCareerKeywords: string[]
  primarySource: MatchSource
}

interface MatchFilters {
  sources: MatchSource[]
  municipalities: string[]
  minScore: number
}

interface UserProfile {
  skills: string[]
  workTitles: string[]
  riasecScores: RiasecScores | null
  careerGoals: {
    shortTerm: string
    longTerm: string
    preferredRoles: string[]
  } | null
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
  onToggle
}: {
  source: MatchSource
  label: string
  icon: React.ElementType
  active: boolean
  available: boolean
  onToggle: () => void
}) {
  const colors = {
    cv: 'bg-violet-100 text-violet-700 border-violet-300',
    interest: 'bg-amber-100 text-amber-700 border-amber-300',
    career: 'bg-teal-100 text-teal-700 border-teal-300'
  }

  return (
    <button
      onClick={onToggle}
      disabled={!available}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all",
        active && available ? colors[source] : "bg-white border-slate-200 text-slate-500",
        !available && "opacity-50 cursor-not-allowed",
        available && !active && "hover:border-slate-300"
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="font-medium text-sm">{label}</span>
      {!available && (
        <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full ml-1">
          Saknas
        </span>
      )}
    </button>
  )
}

function LocationSelector({
  selected,
  onChange
}: {
  selected: string[]
  onChange: (locations: string[]) => void
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
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white hover:border-slate-300 transition-colors"
      >
        <MapPin className="w-4 h-4 text-slate-500" />
        <span className="font-medium text-sm text-slate-700">
          {selected.length === 0
            ? 'Alla orter'
            : `${selected.length} ${selected.length === 1 ? 'ort' : 'orter'}`
          }
        </span>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-2 left-0 w-72 bg-white rounded-xl border border-slate-200 shadow-xl z-20 overflow-hidden">
            <div className="p-3 border-b border-slate-100">
              <input
                type="text"
                placeholder="Sök ort..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {selected.length > 0 && (
              <div className="p-2 border-b border-slate-100 bg-slate-50">
                <div className="flex flex-wrap gap-1">
                  {selected.map(loc => (
                    <button
                      key={loc}
                      onClick={() => toggleLocation(loc)}
                      className="flex items-center gap-1 px-2 py-1 bg-violet-100 text-violet-700 rounded-lg text-xs font-medium hover:bg-violet-200"
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
                <p className="text-sm text-slate-500 text-center py-4">Inga träffar</p>
              ) : (
                filteredMunicipalities.map(m => (
                  <button
                    key={m.concept_id}
                    onClick={() => toggleLocation(m.label)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      selected.includes(m.label)
                        ? "bg-violet-100 text-violet-700 font-medium"
                        : "hover:bg-slate-100 text-slate-700"
                    )}
                  >
                    {m.label}
                  </button>
                ))
              )}
            </div>

            {selected.length > 0 && (
              <div className="p-2 border-t border-slate-100">
                <button
                  onClick={() => onChange([])}
                  className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Rensa alla
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function MatchCard({
  matchedJob,
  onSave,
  isSaved
}: {
  matchedJob: MatchedJob
  onSave: (job: PlatsbankenJob) => void
  isSaved: boolean
}) {
  const { job, totalScore, cvScore, interestScore, careerScore, matchingSkills, missingSkills, matchedInterestTypes, matchedCareerKeywords, primarySource } = matchedJob
  const [showDetails, setShowDetails] = useState(false)

  const scoreColor = totalScore >= 70
    ? 'text-green-600 bg-green-100 border-green-200'
    : totalScore >= 50
      ? 'text-amber-600 bg-amber-100 border-amber-200'
      : 'text-slate-600 bg-slate-100 border-slate-200'

  const sourceColors = {
    cv: 'bg-violet-100 text-violet-700',
    interest: 'bg-amber-100 text-amber-700',
    career: 'bg-teal-100 text-teal-700'
  }

  const sourceLabels = {
    cv: 'CV',
    interest: 'Intressen',
    career: 'Karriärmål'
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header with match score */}
      <div className="flex items-start gap-4 p-5">
        <div className={cn(
          "w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border",
          scoreColor
        )}>
          <span className="text-lg font-bold">{totalScore}%</span>
          <span className="text-[10px] font-medium">match</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", sourceColors[primarySource])}>
              {sourceLabels[primarySource]}
            </span>
          </div>
          <h3 className="font-semibold text-slate-900 line-clamp-2 mb-1">
            {job.headline}
          </h3>
          <p className="text-sm text-slate-600 flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5" />
            {job.employer?.name || 'Okänt företag'}
          </p>
          {job.workplace_address?.municipality && (
            <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
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
              : "hover:bg-slate-100 text-slate-400 hover:text-red-500"
          )}
        >
          <Heart className={cn("w-5 h-5", isSaved && "fill-current")} />
        </button>
      </div>

      {/* Score breakdown */}
      <div className="px-5 pb-3">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700"
        >
          <Settings2 className="w-3 h-3" />
          Visa matchningsdetaljer
          <ChevronDown className={cn("w-3 h-3 transition-transform", showDetails && "rotate-180")} />
        </button>
      </div>

      {showDetails && (
        <div className="px-5 pb-4 space-y-3">
          {/* Score bars */}
          <div className="grid grid-cols-3 gap-2">
            {cvScore > 0 && (
              <div className="text-center">
                <div className="text-xs text-slate-500 mb-1">CV</div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width: `${cvScore}%` }} />
                </div>
                <div className="text-xs font-medium text-violet-600 mt-0.5">{cvScore}%</div>
              </div>
            )}
            {interestScore > 0 && (
              <div className="text-center">
                <div className="text-xs text-slate-500 mb-1">Intressen</div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${interestScore}%` }} />
                </div>
                <div className="text-xs font-medium text-amber-600 mt-0.5">{interestScore}%</div>
              </div>
            )}
            {careerScore > 0 && (
              <div className="text-center">
                <div className="text-xs text-slate-500 mb-1">Karriär</div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${careerScore}%` }} />
                </div>
                <div className="text-xs font-medium text-teal-600 mt-0.5">{careerScore}%</div>
              </div>
            )}
          </div>

          {/* Matching skills */}
          {matchingSkills.length > 0 && (
            <div>
              <p className="text-xs font-medium text-green-700 mb-1.5 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Matchande kompetenser
              </p>
              <div className="flex flex-wrap gap-1">
                {matchingSkills.slice(0, 5).map((skill, i) => (
                  <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                    {skill}
                  </span>
                ))}
                {matchingSkills.length > 5 && (
                  <span className="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded">
                    +{matchingSkills.length - 5}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Matched interest types */}
          {matchedInterestTypes.length > 0 && (
            <div>
              <p className="text-xs font-medium text-amber-700 mb-1.5 flex items-center gap-1">
                <Compass className="w-3 h-3" />
                Intressetyper
              </p>
              <div className="flex flex-wrap gap-1">
                {matchedInterestTypes.map((type, i) => (
                  <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded capitalize">
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Matched career keywords */}
          {matchedCareerKeywords.length > 0 && (
            <div>
              <p className="text-xs font-medium text-teal-700 mb-1.5 flex items-center gap-1">
                <Target className="w-3 h-3" />
                Karriärmatch
              </p>
              <div className="flex flex-wrap gap-1">
                {matchedCareerKeywords.slice(0, 4).map((kw, i) => (
                  <span key={i} className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing skills */}
          {missingSkills.length > 0 && (
            <div className="p-3 bg-amber-50 rounded-lg">
              <p className="text-xs font-medium text-amber-800 mb-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Kompetenser som efterfrågas
              </p>
              <div className="flex flex-wrap gap-1">
                {missingSkills.slice(0, 5).map((skill, i) => (
                  <span key={i} className="px-2 py-0.5 bg-white text-amber-700 text-xs rounded border border-amber-200">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50">
        <span className="text-xs text-slate-500">
          {new Date(job.publication_date).toLocaleDateString('sv-SE')}
        </span>
        <div className="flex items-center gap-2">
          {job.webpage_url && (
            <a
              href={job.webpage_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Ansök
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ type }: { type: 'no-data' | 'no-results' }) {
  if (type === 'no-data') {
    return (
      <Card className="p-12 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileText className="w-10 h-10 text-indigo-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-3">
          Skapa din profil först
        </h3>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          För att hitta de bästa matchningarna behöver vi veta mer om dig.
          Börja med att skapa ditt CV, ta intressetestet eller sätt upp karriärmål.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/cv">
            <Button size="lg">
              <FileText className="w-5 h-5 mr-2" />
              Skapa CV
            </Button>
          </Link>
          <Link to="/interest-guide">
            <Button variant="outline" size="lg">
              <Compass className="w-5 h-5 mr-2" />
              Ta intressetestet
            </Button>
          </Link>
          <Link to="/profile">
            <Button variant="outline" size="lg">
              <Target className="w-5 h-5 mr-2" />
              Sätt karriärmål
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-8 text-center">
      <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
      <p className="text-slate-500">
        Inga jobb matchar dina filterinställningar.
        Prova att ändra filter eller sänka minimikravet.
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [allJobs, setAllJobs] = useState<PlatsbankenJob[]>([])
  const [matchedJobs, setMatchedJobs] = useState<MatchedJob[]>([])

  // Filters
  const [filters, setFilters] = useState<MatchFilters>({
    sources: ['cv', 'interest', 'career'],
    municipalities: [],
    minScore: 0
  })

  // Check what data is available
  const hasCV = userProfile && userProfile.skills.length > 0
  const hasInterest = userProfile && userProfile.riasecScores !== null
  const hasCareer = userProfile && userProfile.careerGoals !== null

  // Load user profile data
  const loadUserProfile = useCallback(async () => {
    try {
      // Get CV data
      const cv = await cvApi.getCV()

      // Extract skills from various CV fields
      const skillsFromSkills = cv?.skills?.map((s: string | { name: string }) =>
        typeof s === 'string' ? s : s.name
      ) || []

      // Extract certifications (körkort, etc.)
      const skillsFromCertificates = cv?.certificates?.map((c: { name?: string }) =>
        c.name
      ).filter(Boolean) || []

      // Extract languages
      const skillsFromLanguages = cv?.languages?.map((l: string | { name?: string; language?: string }) =>
        typeof l === 'string' ? l : (l.name || l.language)
      ).filter(Boolean) || []

      // Combine all skills
      const skills = [...new Set([...skillsFromSkills, ...skillsFromCertificates, ...skillsFromLanguages])]

      const workTitles = cv?.work_experience?.map((e: { title?: string }) =>
        e.title
      ).filter(Boolean) || []

      // Get interest guide results from progress (where answers are actually stored)
      const interestProgress = await interestGuideApi.getProgress()
      let riasecScores: RiasecScores | null = null

      if (interestProgress?.is_completed && interestProgress.answers) {
        // Calculate RIASEC profile from answers
        const profile = calculateUserProfile(interestProgress.answers)
        if (profile?.riasec) {
          riasecScores = {
            realistic: profile.riasec.R || 0,
            investigative: profile.riasec.I || 0,
            artistic: profile.riasec.A || 0,
            social: profile.riasec.S || 0,
            enterprising: profile.riasec.E || 0,
            conventional: profile.riasec.C || 0
          }
        }
      }

      // Get unified profile for career goals
      const unifiedProfile = await unifiedProfileApi.getProfile()
      const careerGoals = unifiedProfile?.career?.careerGoals || null
      const preferredRoles = unifiedProfile?.career?.preferredRoles || []

      setUserProfile({
        skills,
        workTitles,
        riasecScores,
        careerGoals: careerGoals ? {
          ...careerGoals,
          preferredRoles
        } : null
      })

      return { skills, workTitles, riasecScores, careerGoals, preferredRoles }
    } catch (err) {
      console.error('Error loading profile:', err)
      return null
    }
  }, [])

  // Search and match jobs
  const searchAndMatchJobs = useCallback(async (profile: UserProfile, locations: string[]) => {
    // Build search queries from all sources
    const searchTerms: string[] = []

    // From CV
    if (profile.skills.length > 0) {
      searchTerms.push(...profile.skills.slice(0, 3))
    }
    if (profile.workTitles.length > 0) {
      searchTerms.push(...profile.workTitles.slice(0, 2))
    }

    // From career goals
    if (profile.careerGoals?.preferredRoles) {
      searchTerms.push(...profile.careerGoals.preferredRoles.slice(0, 2))
    }

    // Always add RIASEC-based search terms if profile exists
    // This ensures we find relevant jobs for interest matching
    if (profile.riasecScores) {
      const dominantTypes = Object.entries(profile.riasecScores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 2)
        .map(([type]) => type)

      // Expanded RIASEC search terms for better job discovery
      const riasecSearches: Record<string, string[]> = {
        realistic: ['tekniker', 'mekaniker', 'elektriker', 'montör', 'lager', 'produktion', 'bygg'],
        investigative: ['utvecklare', 'analytiker', 'ingenjör', 'IT', 'system', 'data'],
        artistic: ['designer', 'kreativ', 'marknadsföring', 'kommunikation', 'grafisk'],
        social: ['lärare', 'vård', 'omsorg', 'pedagog', 'kundservice', 'stöd'],
        enterprising: ['säljare', 'projektledare', 'chef', 'affär', 'konsult'],
        conventional: ['administratör', 'ekonom', 'redovisning', 'kontor', 'handläggare']
      }

      dominantTypes.forEach(type => {
        const terms = riasecSearches[type] || []
        // Add terms that aren't already included
        terms.forEach(term => {
          if (!searchTerms.some(s => s.toLowerCase().includes(term.toLowerCase()))) {
            searchTerms.push(term)
          }
        })
      })
    }

    // Search for jobs
    const searchQuery = [...new Set(searchTerms)].slice(0, 5).join(' ')
    const result = await searchJobs({
      query: searchQuery,
      municipality: locations.length === 1 ? locations[0] : undefined,
      limit: 100,
      publishedWithin: 'month'
    })

    // Filter by locations if multiple selected
    let filteredJobs = result.hits
    if (locations.length > 1) {
      filteredJobs = result.hits.filter(job =>
        locations.some(loc =>
          job.workplace_address?.municipality?.toLowerCase().includes(loc.toLowerCase())
        )
      )
    }

    return filteredJobs
  }, [])

  // Calculate match scores
  const calculateMatches = useCallback((
    jobs: PlatsbankenJob[],
    profile: UserProfile,
    activeSources: MatchSource[]
  ): MatchedJob[] => {
    return jobs.map(job => {
      const jobText = `${job.headline || ''} ${job.description?.text || ''} ${job.occupation?.label || ''}`.toLowerCase()

      // CV matching
      let cvScore = 0
      const matchingSkills: string[] = []
      const missingSkills: string[] = []

      if (activeSources.includes('cv') && profile.skills.length > 0) {
        const allUserSkills = [...profile.skills, ...profile.workTitles]

        // Check each user skill against job text
        allUserSkills.forEach(skill => {
          const skillLower = skill.toLowerCase()
          // Check for the skill or common variations
          if (jobText.includes(skillLower)) {
            matchingSkills.push(skill)
          }
          // Also check if job mentions a variation (e.g. job says "körkort" and user has "B-körkort")
          else if (skillLower.includes('körkort') && jobText.includes('körkort')) {
            matchingSkills.push(skill)
          }
        })

        // Extract missing skills from job
        const commonSkills = ['Excel', 'Word', 'PowerPoint', 'Teams', 'SAP', 'CRM',
          'projektledning', 'kommunikation', 'engelska', 'körkort', 'B-körkort',
          'Python', 'JavaScript', 'SQL', 'ledarskap', 'teamwork']

        // Helper to check if user has a skill (handles variations like "B-körkort" matching "körkort")
        const userHasSkill = (skill: string): boolean => {
          const skillLower = skill.toLowerCase()
          return allUserSkills.some(s => {
            const userSkillLower = s.toLowerCase()
            // Exact match
            if (userSkillLower === skillLower) return true
            // Check if skill contains the other (e.g. "B-körkort" contains "körkort")
            if (userSkillLower.includes(skillLower) || skillLower.includes(userSkillLower)) return true
            return false
          })
        }

        commonSkills.forEach(skill => {
          if (jobText.includes(skill.toLowerCase()) && !userHasSkill(skill)) {
            missingSkills.push(skill)
          }
        })

        cvScore = allUserSkills.length > 0
          ? Math.round((matchingSkills.length / allUserSkills.length) * 100)
          : 0
        cvScore = Math.min(cvScore + 15, 100) // Baseline boost
      }

      // Interest matching (RIASEC)
      let interestScore = 0
      const matchedInterestTypes: string[] = []

      if (activeSources.includes('interest') && profile.riasecScores) {
        const interestMatches = matchJobsToInterests([job], profile.riasecScores, [])
        if (interestMatches.length > 0) {
          interestScore = interestMatches[0].riasecMatch.score
          matchedInterestTypes.push(...interestMatches[0].riasecMatch.matchedTypes)
        }
      }

      // Career goal matching
      let careerScore = 0
      const matchedCareerKeywords: string[] = []

      if (activeSources.includes('career') && profile.careerGoals) {
        const careerText = `${profile.careerGoals.shortTerm} ${profile.careerGoals.longTerm}`.toLowerCase()
        const careerKeywords = careerText.split(/\s+/).filter(w => w.length > 3)

        // Check preferred roles
        profile.careerGoals.preferredRoles.forEach(role => {
          if (jobText.includes(role.toLowerCase())) {
            matchedCareerKeywords.push(role)
            careerScore += 25
          }
        })

        // Check career goal keywords
        careerKeywords.forEach(keyword => {
          if (jobText.includes(keyword) && !matchedCareerKeywords.includes(keyword)) {
            matchedCareerKeywords.push(keyword)
            careerScore += 5
          }
        })

        careerScore = Math.min(careerScore, 100)
      }

      // Calculate total weighted score
      let totalScore = 0
      let weights = 0

      // Count active sources for proper weighting
      const activeSourceCount = activeSources.length

      if (activeSources.includes('cv')) {
        if (cvScore > 0) {
          totalScore += cvScore * 0.4
          weights += 0.4
        }
      }
      if (activeSources.includes('interest')) {
        // Always add interest score if source is active (even if 0)
        // This ensures proper weighting when only interest is selected
        totalScore += interestScore * 0.35
        weights += 0.35
      }
      if (activeSources.includes('career')) {
        if (careerScore > 0) {
          totalScore += careerScore * 0.25
          weights += 0.25
        }
      }

      // Normalize if not all sources active
      if (weights > 0 && weights < 1) {
        totalScore = Math.round(totalScore / weights)
      } else {
        totalScore = Math.round(totalScore)
      }

      // Determine primary source
      let primarySource: MatchSource = 'cv'
      const maxScore = Math.max(cvScore, interestScore, careerScore)
      if (maxScore === interestScore && activeSources.includes('interest')) {
        primarySource = 'interest'
      } else if (maxScore === careerScore && activeSources.includes('career')) {
        primarySource = 'career'
      }

      return {
        job,
        totalScore,
        cvScore,
        interestScore,
        careerScore,
        matchingSkills,
        missingSkills: missingSkills.slice(0, 5),
        matchedInterestTypes,
        matchedCareerKeywords,
        primarySource
      }
    }).sort((a, b) => b.totalScore - a.totalScore)
  }, [])

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const profile = await loadUserProfile()

      if (!profile || (profile.skills.length === 0 && !profile.riasecScores && !profile.careerGoals)) {
        setUserProfile({
          skills: [],
          workTitles: [],
          riasecScores: null,
          careerGoals: null
        })
        setIsLoading(false)
        return
      }

      const profileData: UserProfile = {
        skills: profile.skills,
        workTitles: profile.workTitles,
        riasecScores: profile.riasecScores,
        careerGoals: profile.careerGoals ? {
          shortTerm: profile.careerGoals.shortTerm || '',
          longTerm: profile.careerGoals.longTerm || '',
          preferredRoles: profile.preferredRoles
        } : null
      }

      setUserProfile(profileData)

      const jobs = await searchAndMatchJobs(profileData, filters.municipalities)
      setAllJobs(jobs)

      const matched = calculateMatches(jobs, profileData, filters.sources)
      setMatchedJobs(matched)
    } catch (err) {
      console.error('Error loading matches:', err)
      setError('Kunde inte ladda matchningar')
    } finally {
      setIsLoading(false)
    }
  }, [loadUserProfile, searchAndMatchJobs, calculateMatches, filters.municipalities, filters.sources])

  // Initial load
  useEffect(() => {
    loadData()
  }, [])

  // Recalculate matches when filters change
  useEffect(() => {
    if (userProfile && allJobs.length > 0) {
      const matched = calculateMatches(allJobs, userProfile, filters.sources)
      setMatchedJobs(matched)
    }
  }, [filters.sources, userProfile, allJobs, calculateMatches])

  // Reload when locations change
  useEffect(() => {
    if (userProfile && !isLoading) {
      loadData()
    }
  }, [filters.municipalities])

  // Filter by minimum score
  const filteredJobs = useMemo(() =>
    matchedJobs.filter(m => m.totalScore >= filters.minScore),
    [matchedJobs, filters.minScore]
  )

  // Stats
  const stats = useMemo(() => ({
    high: matchedJobs.filter(m => m.totalScore >= 70).length,
    medium: matchedJobs.filter(m => m.totalScore >= 50 && m.totalScore < 70).length,
    total: matchedJobs.length
  }), [matchedJobs])

  const handleSave = async (job: PlatsbankenJob) => {
    await saveJob(job)
  }

  const toggleSource = (source: MatchSource) => {
    setFilters(prev => ({
      ...prev,
      sources: prev.sources.includes(source)
        ? prev.sources.filter(s => s !== source)
        : [...prev.sources, source]
    }))
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-600">Analyserar din profil och hittar matchningar...</p>
      </div>
    )
  }

  if (!hasCV && !hasInterest && !hasCareer) {
    return <EmptyState type="no-data" />
  }

  if (error) {
    return (
      <Card className="p-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 mb-2">Något gick fel</h3>
        <p className="text-slate-500 mb-4">{error}</p>
        <Button onClick={loadData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Försök igen
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with source toggles */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Smarta jobbmatchningar
            </h2>
            <p className="text-sm text-slate-500">
              Välj vilka datakällor som ska användas för matchning
            </p>
          </div>

          {/* Source toggles */}
          <div className="flex flex-wrap gap-2">
            <SourceToggle
              source="cv"
              label="Mitt CV"
              icon={FileText}
              active={filters.sources.includes('cv')}
              available={hasCV || false}
              onToggle={() => toggleSource('cv')}
            />
            <SourceToggle
              source="interest"
              label="Intresseguiden"
              icon={Compass}
              active={filters.sources.includes('interest')}
              available={hasInterest || false}
              onToggle={() => toggleSource('interest')}
            />
            <SourceToggle
              source="career"
              label="Karriärmål"
              icon={Target}
              active={filters.sources.includes('career')}
              available={hasCareer || false}
              onToggle={() => toggleSource('career')}
            />
          </div>

          {/* Location filter */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
            <span className="text-sm text-slate-600">Orter:</span>
            <LocationSelector
              selected={filters.municipalities}
              onChange={(locs) => setFilters(prev => ({ ...prev, municipalities: locs }))}
            />

            {/* Min score filter */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-slate-600">Minst:</span>
              <div className="flex gap-1">
                {[0, 30, 50, 70].map(score => (
                  <button
                    key={score}
                    onClick={() => setFilters(prev => ({ ...prev, minScore: score }))}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-lg transition-colors",
                      filters.minScore === score
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {score === 0 ? 'Alla' : `${score}%`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Bra match</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{stats.high}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">Möjliga</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">{stats.medium}</p>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Totalt</span>
          </div>
          <p className="text-2xl font-bold text-slate-700">{stats.total}</p>
        </div>
      </div>

      {/* Refresh button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="w-4 h-4 mr-1" />
          Uppdatera
        </Button>
      </div>

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <EmptyState type="no-results" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredJobs.map(matchedJob => (
            <MatchCard
              key={matchedJob.job.id}
              matchedJob={matchedJob}
              onSave={handleSave}
              isSaved={isSaved(matchedJob.job.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default MatchesTab
