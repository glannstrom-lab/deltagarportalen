/**
 * Matches Tab - AI-powered job suggestions based on CV and interest profile
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  Target,
  FileText,
  ClipboardList,
  RefreshCw,
  Bookmark,
  ExternalLink,
  MapPin,
  Building2,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Search,
} from 'lucide-react'
import { Button, LoadingState } from '@/components/ui'
import { interestGuideApi, platsbankenApi } from '@/services/cloudStorage'
import { calculateUserProfile, calculateJobMatches, type UserProfile } from '@/services/interestGuideData'
import type { JobAd } from '@/services/arbetsformedlingenApi'

interface MatchedJob {
  job: JobAd
  matchScore: number
  matchReasons: string[]
}

export default function MatchesTab() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [hasCV, setHasCV] = useState(false)
  const [matchedJobs, setMatchedJobs] = useState<MatchedJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)

        // Check for interest guide profile
        const interestData = await interestGuideApi.getProgress()
        if (interestData?.is_completed && interestData.answers) {
          const calculatedProfile = calculateUserProfile(interestData.answers)
          setProfile(calculatedProfile)
        }

        // Check for CV
        const cvData = localStorage.getItem('cv-data')
        setHasCV(!!cvData)

        // Load saved job IDs
        const saved = await platsbankenApi.getSavedJobs()
        setSavedJobIds(new Set(saved.map((j: any) => j.id)))

        // In a real implementation, this would call an AI service
        // For now, we'll show placeholder data
      } catch (err) {
        console.error('Failed to load profile data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const toggleSaveJob = async (job: JobAd) => {
    const isSaved = savedJobIds.has(job.id)

    if (isSaved) {
      await platsbankenApi.removeSavedJob(job.id)
      setSavedJobIds((prev) => {
        const next = new Set(prev)
        next.delete(job.id)
        return next
      })
    } else {
      await platsbankenApi.saveJob(job)
      setSavedJobIds((prev) => new Set(prev).add(job.id))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingState title="Analyserar din profil..." size="lg" />
      </div>
    )
  }

  // Check if user has completed profile
  const hasProfile = profile !== null
  const isProfileComplete = hasProfile && hasCV

  if (!hasProfile && !hasCV) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Få personliga jobbförslag</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Slutför din profil för att få AI-drivna jobbförslag baserat på dina intressen,
            personlighet och erfarenheter.
          </p>
        </div>

        {/* Setup Steps */}
        <div className="space-y-4">
          <div
            className={`bg-white rounded-xl border-2 p-5 transition-colors ${
              hasProfile ? 'border-green-200 bg-green-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  hasProfile
                    ? 'bg-green-500'
                    : 'bg-gradient-to-br from-indigo-500 to-purple-500'
                }`}
              >
                {hasProfile ? (
                  <CheckCircle2 className="w-6 h-6 text-white" />
                ) : (
                  <Target className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {hasProfile ? 'Intresseprofil klar!' : 'Gör intressetestet'}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {hasProfile
                    ? 'Vi har analyserat dina intressen och personlighetsdrag.'
                    : 'Svara på frågor om dina intressen och personlighet för att hitta yrken som passar dig.'}
                </p>
                {!hasProfile && (
                  <Link to="/interest-guide">
                    <Button className="gap-2">
                      Starta testet
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div
            className={`bg-white rounded-xl border-2 p-5 transition-colors ${
              hasCV ? 'border-green-200 bg-green-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  hasCV ? 'bg-green-500' : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                }`}
              >
                {hasCV ? (
                  <CheckCircle2 className="w-6 h-6 text-white" />
                ) : (
                  <FileText className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {hasCV ? 'CV uppladdat!' : 'Skapa eller ladda upp CV'}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {hasCV
                    ? 'Ditt CV används för att matcha jobb baserat på din erfarenhet.'
                    : 'Ditt CV hjälper oss hitta jobb som matchar din erfarenhet och kompetens.'}
                </p>
                {!hasCV && (
                  <Link to="/cv">
                    <Button variant="outline" className="gap-2">
                      Gå till CV
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
          <h3 className="font-semibold text-purple-900 mb-3">Fördelar med jobbmatchning</h3>
          <ul className="space-y-2 text-sm text-purple-800">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
              Personliga jobbförslag baserat på din profil
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
              Se hur väl varje jobb matchar dina intressen
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
              Spara tid genom att fokusera på relevanta jobb
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
              Upptäck yrken du kanske inte tänkt på
            </li>
          </ul>
        </div>
      </div>
    )
  }

  // User has at least partial profile - show matches or partial state
  return (
    <div className="space-y-6">
      {/* Profile Summary */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-900 mb-1">Din jobbprofil</h3>
              <p className="text-purple-700 text-sm">
                {isProfileComplete
                  ? 'Vi analyserar ditt CV och intresseprofil för att hitta matchande jobb.'
                  : hasProfile
                  ? 'Lägg till ditt CV för ännu bättre matchningar.'
                  : 'Gör intressetestet för att få personliga jobbförslag.'}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                    hasProfile ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Target className="w-3 h-3" />
                  Intresseprofil {hasProfile ? '✓' : 'saknas'}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                    hasCV ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  CV {hasCV ? '✓' : 'saknas'}
                </span>
              </div>
            </div>
          </div>
          <Button variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Uppdatera
          </Button>
        </div>
      </div>

      {/* Job Matches */}
      {matchedJobs.length > 0 ? (
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900">Jobb som matchar din profil</h2>
          {matchedJobs.map(({ job, matchScore, matchReasons }) => (
            <div
              key={job.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {matchScore}%
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{job.headline}</h3>
                    <p className="text-gray-600">{job.employer?.name}</p>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.workplace_address?.municipality || 'Ort ej angiven'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {matchReasons.map((reason, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => toggleSaveJob(job)}
                    className={savedJobIds.has(job.id) ? 'bg-amber-50 border-amber-200' : ''}
                  >
                    <Bookmark
                      className={`w-4 h-4 ${
                        savedJobIds.has(job.id) ? 'fill-amber-500 text-amber-500' : ''
                      }`}
                    />
                  </Button>
                  <Button className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Visa
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Sparkles className="w-16 h-16 text-purple-200 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Inga matchningar ännu</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            Vi letar efter jobb som matchar din profil. Kom tillbaka snart för att se nya förslag!
          </p>
          <Link to="/job-tracker">
            <Button variant="outline" className="gap-2">
              <Search className="w-4 h-4" />
              Sök jobb manuellt
            </Button>
          </Link>
        </div>
      )}

      {/* Tips */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          Tips för bättre matchningar
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• Håll ditt CV uppdaterat med senaste erfarenheter</li>
          <li>• Gör om intressetestet om dina intressen har ändrats</li>
          <li>• Lägg till fler kompetenser i din profil</li>
          <li>• Spara jobb du gillar - det förbättrar våra förslag</li>
        </ul>
      </div>
    </div>
  )
}
