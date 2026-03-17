/**
 * MatchesTab - AI-matched jobs based on user's CV
 * Shows jobs sorted by match percentage
 */

import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Sparkles, Target, CheckCircle, AlertCircle, FileText,
  Briefcase, MapPin, Heart, ExternalLink, ChevronDown,
  Loader2, RefreshCw, TrendingUp, Award
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { searchJobs, type PlatsbankenJob } from '@/services/arbetsformedlingenApi'
import { cvApi, jobsApi } from '@/services/supabaseApi'
import { useSavedJobs } from '@/hooks/useSavedJobs'
import { cn } from '@/lib/utils'
import { Card, Button } from '@/components/ui'

interface MatchedJob {
  job: PlatsbankenJob
  matchScore: number
  matchingSkills: string[]
  missingSkills: string[]
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
  const { job, matchScore, matchingSkills, missingSkills } = matchedJob
  const [showDetails, setShowDetails] = useState(false)

  const scoreColor = matchScore >= 70
    ? 'text-green-600 bg-green-100'
    : matchScore >= 50
      ? 'text-amber-600 bg-amber-100'
      : 'text-slate-600 bg-slate-100'

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header with match score */}
      <div className="flex items-start gap-4 p-5">
        <div className={cn(
          "w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0",
          scoreColor
        )}>
          <span className="text-lg font-bold">{matchScore}%</span>
          <span className="text-[10px] font-medium">match</span>
        </div>

        <div className="flex-1 min-w-0">
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

      {/* Skills tags */}
      <div className="px-5 pb-4">
        {matchingSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {matchingSkills.slice(0, 4).map((skill, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-lg"
              >
                <CheckCircle className="w-3 h-3" />
                {skill}
              </span>
            ))}
            {matchingSkills.length > 4 && (
              <span className="px-2 py-1 bg-green-50 text-green-600 text-xs rounded-lg">
                +{matchingSkills.length - 4} till
              </span>
            )}
          </div>
        )}

        {missingSkills.length > 0 && !showDetails && (
          <button
            onClick={() => setShowDetails(true)}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3" />
            {missingSkills.length} kompetenser saknas
            <ChevronDown className="w-3 h-3" />
          </button>
        )}

        {showDetails && missingSkills.length > 0 && (
          <div className="mt-2 p-3 bg-amber-50 rounded-lg">
            <p className="text-xs font-medium text-amber-800 mb-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Kompetenser som efterfrågas:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {missingSkills.map((skill, i) => (
                <span key={i} className="px-2 py-1 bg-white text-amber-700 text-xs rounded border border-amber-200">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50">
        <span className="text-xs text-slate-500">
          Publicerad: {new Date(job.publication_date).toLocaleDateString('sv-SE')}
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

function ScoreFilter({
  minScore,
  onChange
}: {
  minScore: number
  onChange: (score: number) => void
}) {
  const options = [
    { value: 0, label: 'Alla' },
    { value: 30, label: '30%+' },
    { value: 50, label: '50%+' },
    { value: 70, label: '70%+' }
  ]

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-600">Minst:</span>
      <div className="flex gap-1">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg transition-colors",
              minScore === opt.value
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function MatchesTab() {
  const { t } = useTranslation()
  const { saveJob, isSaved } = useSavedJobs()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasCV, setHasCV] = useState(false)
  const [userSkills, setUserSkills] = useState<string[]>([])
  const [matchedJobs, setMatchedJobs] = useState<MatchedJob[]>([])
  const [minScore, setMinScore] = useState(0)

  // Load CV and find matches
  useEffect(() => {
    loadMatchedJobs()
  }, [])

  const loadMatchedJobs = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Get user's CV
      const cv = await cvApi.getCV()

      if (!cv || (!cv.skills?.length && !cv.work_experience?.length)) {
        setHasCV(false)
        setIsLoading(false)
        return
      }

      setHasCV(true)

      // Extract skills from CV
      const skills = cv.skills?.map((s: any) => s.name || s) || []
      const titleSkills = cv.title ? [cv.title] : []
      const experienceSkills = cv.work_experience?.map((e: any) => e.title).filter(Boolean) || []
      const allSkills = [...new Set([...skills, ...titleSkills, ...experienceSkills])]
      setUserSkills(allSkills)

      // Search for relevant jobs based on skills
      const searchQueries = allSkills.slice(0, 3).join(' ')
      const result = await searchJobs({
        query: searchQueries,
        limit: 50,
        publishedWithin: 'month'
      })

      // Calculate match scores
      const matched: MatchedJob[] = result.hits.map((job: PlatsbankenJob) => {
        const jobText = `${job.headline || ''} ${job.description?.text || ''} ${job.occupation?.label || ''}`.toLowerCase()

        const matchingSkills: string[] = []
        const missingSkills: string[] = []

        // Check each skill
        allSkills.forEach(skill => {
          if (jobText.includes(skill.toLowerCase())) {
            matchingSkills.push(skill)
          }
        })

        // Extract potential missing skills from job (simple extraction)
        const commonSkills = ['Excel', 'Word', 'PowerPoint', 'Teams', 'Outlook', 'SAP', 'CRM',
          'projektledning', 'kommunikation', 'engelska', 'svenska', 'körkort', 'B-körkort']
        commonSkills.forEach(skill => {
          if (jobText.includes(skill.toLowerCase()) && !allSkills.some(s => s.toLowerCase() === skill.toLowerCase())) {
            missingSkills.push(skill)
          }
        })

        // Calculate match score
        const matchScore = allSkills.length > 0
          ? Math.round((matchingSkills.length / allSkills.length) * 100)
          : 0

        return {
          job,
          matchScore: Math.min(matchScore + 20, 100), // Boost baseline
          matchingSkills,
          missingSkills: missingSkills.slice(0, 5)
        }
      })

      // Sort by match score
      matched.sort((a, b) => b.matchScore - a.matchScore)
      setMatchedJobs(matched)
    } catch (err) {
      console.error('Error loading matches:', err)
      setError('Kunde inte ladda matchningar')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter jobs by minimum score
  const filteredJobs = useMemo(() =>
    matchedJobs.filter(m => m.matchScore >= minScore),
    [matchedJobs, minScore]
  )

  const handleSave = async (job: PlatsbankenJob) => {
    await saveJob(job)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-600">Analyserar ditt CV och hittar matchningar...</p>
      </div>
    )
  }

  if (!hasCV) {
    return (
      <Card className="p-12 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileText className="w-10 h-10 text-indigo-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-3">
          Skapa ditt CV först
        </h3>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Vi behöver ditt CV för att kunna matcha dig med relevanta jobb.
          Lägg till dina kompetenser och erfarenheter så hittar vi de bästa matchningarna.
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
              <Target className="w-5 h-5 mr-2" />
              Ta intressetestet
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 mb-2">Något gick fel</h3>
        <p className="text-slate-500 mb-4">{error}</p>
        <Button onClick={loadMatchedJobs}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Försök igen
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Matchade jobb för dig
          </h2>
          <p className="text-sm text-slate-500">
            Baserat på {userSkills.length} kompetenser från ditt CV
          </p>
        </div>

        <div className="flex items-center gap-4">
          <ScoreFilter minScore={minScore} onChange={setMinScore} />
          <Button variant="outline" size="sm" onClick={loadMatchedJobs}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Uppdatera
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Bra matchningar</span>
          </div>
          <p className="text-2xl font-bold text-green-700">
            {matchedJobs.filter(m => m.matchScore >= 70).length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">Möjliga</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">
            {matchedJobs.filter(m => m.matchScore >= 50 && m.matchScore < 70).length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Totalt</span>
          </div>
          <p className="text-2xl font-bold text-slate-700">
            {matchedJobs.length}
          </p>
        </div>
      </div>

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-500">
            Inga jobb matchar dina filterinställningar.
            {minScore > 0 && " Prova att sänka minimikravet."}
          </p>
        </Card>
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
