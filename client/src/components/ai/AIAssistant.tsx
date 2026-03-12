/**
 * AI Assistant Component
 * Intelligent assistent som analyserar användardata och ger skräddarsydda rekommendationer
 */

import { useState, useEffect, useMemo } from 'react'
import { 
  Sparkles, 
  Target, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  ChevronRight,
  Zap,
  Calendar,
  Briefcase,
  FileText,
  BookHeart,
  X,
  RefreshCw,
  Lightbulb,
  Award
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

export interface AIRecommendation {
  id: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  type: 'action' | 'insight' | 'reminder'
  title: string
  description: string
  reasoning: string
  action: {
    label: string
    link: string
    autoComplete?: boolean
  }
  expectedOutcome: string
  deadline?: Date
  confidence: number // 0-100
}

interface AIAssistantProps {
  className?: string
  compact?: boolean
}

// Simulerad AI-analys (ersätts senare med riktig AI)
function generateAIRecommendations(
  userData: {
    cvProgress: number
    hasInterestResult: boolean
    savedJobsCount: number
    lastDiaryEntry: Date | null
    applicationsCount: number
    streakDays: number
    energyLevel: 'low' | 'medium' | 'high'
  }
): AIRecommendation[] {
  const recommendations: AIRecommendation[] = []

  // Critical: Jobb som snart stänger
  if (userData.savedJobsCount > 0) {
    recommendations.push({
      id: 'urgent-jobs',
      priority: 'critical',
      type: 'action',
      title: 'Spara jobb som snart stänger',
      description: `Du har ${userData.savedJobsCount} sparade jobb. Några av dem stänger inom kort.`,
      reasoning: 'Tidskritisk möjlighet - dessa annonser kanske inte finns tillgängliga om några dagar',
      action: {
        label: 'Se sparade jobb',
        link: '/dashboard/job-search'
      },
      expectedOutcome: 'Ökar chansen att komma i fråga för aktuella positioner',
      confidence: 85
    })
  }

  // Critical: CV inte klart men ska söka jobb
  if (userData.cvProgress < 80 && userData.savedJobsCount > 0) {
    recommendations.push({
      id: 'cv-incomplete',
      priority: 'critical',
      type: 'action',
      title: 'Färdigställ ditt CV',
      description: `Ditt CV är ${userData.cvProgress}% klart. Ett komplett CV ökar chanserna avsevärt.`,
      reasoning: 'Du har sparat jobb men CV:t behöver mer information för att göra intryck',
      action: {
        label: 'Fortsätt med CV',
        link: '/dashboard/cv'
      },
      expectedOutcome: 'Fler svar från arbetsgivare och bättre matchning',
      confidence: 92
    })
  }

  // High: Intresseguide inte gjord
  if (!userData.hasInterestResult) {
    recommendations.push({
      id: 'interest-guide',
      priority: 'high',
      type: 'action',
      title: 'Upptäck dina styrkor',
      description: 'Intresseguiden hjälper dig förstå vilka yrken som passar dig bäst.',
      reasoning: 'Att förstå dina intressen och personlighet ger riktning åt jobbsökningen',
      action: {
        label: 'Gör intresseguiden',
        link: '/dashboard/interest-guide'
      },
      expectedOutcome: 'Tydligare bild av lämpliga yrken och karriärvägar',
      confidence: 88
    })
  }

  // High: Ingen dagbok på länge
  if (!userData.lastDiaryEntry || daysSince(userData.lastDiaryEntry) > 7) {
    recommendations.push({
      id: 'diary-reminder',
      priority: 'high',
      type: 'reminder',
      title: 'Dags för reflektion',
      description: userData.lastDiaryEntry 
        ? `Det var ${daysSince(userData.lastDiaryEntry)} dagar sedan du skrev i dagboken.`
        : 'Att reflektera regelbundet hjälper dig se dina framsteg.',
      reasoning: 'Regelbunden reflektion korrelerar med högre motivation och bättre resultat',
      action: {
        label: 'Skriv i dagboken',
        link: '/dashboard/diary'
      },
      expectedOutcome: 'Ökad självinsikt och motivation genom att se framsteg',
      confidence: 75
    })
  }

  // Insight: Ansökningstakt
  if (userData.applicationsCount === 0 && userData.savedJobsCount > 3) {
    recommendations.push({
      id: 'application-insight',
      priority: 'medium',
      type: 'insight',
      title: 'Dags att gå från sparade till ansökta',
      description: 'Du har sparat flera intressanta jobb men inte sökt några än.',
      reasoning: 'Många fastnar i "perfektionism" - det är bättre att söka än att vänta på det perfekta tillfället',
      action: {
        label: 'Börja söka',
        link: '/dashboard/job-search'
      },
      expectedOutcome: 'Fler intervjuer och snabbare väg till jobb',
      confidence: 80
    })
  }

  // Insight: Streak
  if (userData.streakDays >= 3) {
    recommendations.push({
      id: 'streak-celebration',
      priority: 'medium',
      type: 'insight',
      title: `Imponerande! ${userData.streakDays} dagar i rad 🎉`,
      description: 'Du har varit aktiv flera dagar i rad. Fortsätt så!',
      reasoning: 'Konsekvens är nyckeln till framgång i jobbsökning',
      action: {
        label: 'Fortsätt momentum',
        link: '/dashboard'
      },
      expectedOutcome: 'Fortsatt motivation och regelbundna framsteg',
      confidence: 95
    })
  }

  // Energy-based recommendation
  if (userData.energyLevel === 'low') {
    recommendations.push({
      id: 'low-energy',
      priority: 'medium',
      type: 'insight',
      title: 'Ta det lugnt idag',
      description: 'Du har valt låg energinivå. Här är ett litet steg som ändå räknas:',
      reasoning: 'Små steg är bättre än inga steg alls - det bygger momentum',
      action: {
        label: 'Markera dagens humör',
        link: '/dashboard/diary'
      },
      expectedOutcome: 'Känsla av framsteg även på lågenergidagar',
      confidence: 90
    })
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
}

export function AIAssistant({ className, compact = false }: AIAssistantProps) {
  const navigate = useNavigate()
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [expandedReasoning, setExpandedReasoning] = useState<string | null>(null)

  // Hämta användardata och generera rekommendationer
  useEffect(() => {
    const loadUserData = () => {
      // Hämta data från localStorage
      const cvData = localStorage.getItem('cv-data')
      const interestResult = localStorage.getItem('interest-result')
      const savedJobs = localStorage.getItem('saved-jobs')
      const diaryEntries = localStorage.getItem('diary-entries')
      const settings = localStorage.getItem('deltagarportal-settings')

      const cvProgress = cvData ? calculateCVProgress(JSON.parse(cvData)) : 0
      const hasInterestResult = !!interestResult
      const savedJobsCount = savedJobs ? JSON.parse(savedJobs).length : 0
      
      const entries = diaryEntries ? JSON.parse(diaryEntries) : []
      const lastDiaryEntry = entries.length > 0 
        ? new Date(entries[entries.length - 1].date) 
        : null

      const energyLevel = settings 
        ? JSON.parse(settings)?.state?.energyLevel || 'medium'
        : 'medium'

      const userData = {
        cvProgress,
        hasInterestResult,
        savedJobsCount,
        lastDiaryEntry,
        applicationsCount: 0, // Ska hämtas från applications-store
        streakDays: calculateStreak(entries),
        energyLevel
      }

      const recs = generateAIRecommendations(userData)
      setRecommendations(recs)
      setIsLoading(false)
    }

    loadUserData()
    // Uppdatera var 5:e minut
    const interval = setInterval(loadUserData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const calculateCVProgress = (cv: any): number => {
    let total = 0, filled = 0
    const fields = ['firstName', 'lastName', 'email', 'workExperience', 'education', 'skills']
    fields.forEach(f => {
      total++
      if (cv[f] && (Array.isArray(cv[f]) ? cv[f].length > 0 : cv[f])) filled++
    })
    return Math.round((filled / total) * 100)
  }

  const calculateStreak = (entries: any[]): number => {
    if (entries.length === 0) return 0
    // Förenklad streak-beräkning
    return Math.min(entries.length, 7)
  }

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]))
  }

  const handleAction = (recommendation: AIRecommendation) => {
    navigate(recommendation.action.link)
  }

  const visibleRecommendations = recommendations.filter(r => !dismissed.has(r.id))
  const criticalCount = visibleRecommendations.filter(r => r.priority === 'critical').length

  if (isLoading) {
    return (
      <div className={cn('bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-200 p-6', className)}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center animate-pulse">
            <Sparkles className="w-5 h-5 text-violet-600" />
          </div>
          <div className="h-4 bg-violet-200 rounded w-32 animate-pulse" />
        </div>
        <div className="space-y-3">
          <div className="h-20 bg-white/50 rounded-xl animate-pulse" />
          <div className="h-20 bg-white/50 rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (visibleRecommendations.length === 0) {
    return (
      <div className={cn('bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-6', className)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Award className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-emerald-800">Bra jobbat! 🎉</h3>
            <p className="text-sm text-emerald-600">Just nu har du inga brådskande uppgifter.</p>
          </div>
        </div>
      </div>
    )
  }

  if (compact) {
    const topRecommendation = visibleRecommendations[0]
    return (
      <div className={cn('bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-200 p-4', className)}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full',
                topRecommendation.priority === 'critical' && 'bg-rose-100 text-rose-700',
                topRecommendation.priority === 'high' && 'bg-amber-100 text-amber-700',
                topRecommendation.priority === 'medium' && 'bg-blue-100 text-blue-700'
              )}>
                {topRecommendation.priority === 'critical' && 'Prioritet'}
                {topRecommendation.priority === 'high' && 'Rekommenderat'}
                {topRecommendation.priority === 'medium' && 'Tips'}
              </span>
            </div>
            <h4 className="font-semibold text-slate-800 text-sm">{topRecommendation.title}</h4>
            <p className="text-xs text-slate-600 mt-1">{topRecommendation.description}</p>
            <button
              onClick={() => handleAction(topRecommendation)}
              className="mt-2 text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
            >
              {topRecommendation.action.label}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-200 overflow-hidden', className)}>
      {/* Header */}
      <div className="p-6 border-b border-violet-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-violet-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Din AI-assistent</h3>
              <p className="text-sm text-slate-500">
                {criticalCount > 0 
                  ? `${criticalCount} brådskande uppgift${criticalCount > 1 ? 'er' : ''}`
                  : `${visibleRecommendations.length} rekommendation${visibleRecommendations.length > 1 ? 'er' : ''}`
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">AI-driven analys</span>
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Rekommendationer */}
      <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
        {visibleRecommendations.map((rec) => (
          <div
            key={rec.id}
            className={cn(
              'bg-white rounded-xl border-2 p-4 transition-all',
              rec.priority === 'critical' && 'border-rose-200 shadow-sm',
              rec.priority === 'high' && 'border-amber-200',
              rec.priority === 'medium' && 'border-violet-100'
            )}
          >
            <div className="flex items-start gap-3">
              {/* Priority icon */}
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                rec.priority === 'critical' && 'bg-rose-100',
                rec.priority === 'high' && 'bg-amber-100',
                rec.priority === 'medium' && 'bg-violet-100'
              )}>
                {rec.priority === 'critical' && <AlertCircle className="w-5 h-5 text-rose-600" />}
                {rec.priority === 'high' && <Target className="w-5 h-5 text-amber-600" />}
                {rec.priority === 'medium' && <Lightbulb className="w-5 h-5 text-violet-600" />}
              </div>

              <div className="flex-1 min-w-0">
                {/* Title and badges */}
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className="font-semibold text-slate-800">{rec.title}</h4>
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    rec.type === 'action' && 'bg-blue-100 text-blue-700',
                    rec.type === 'insight' && 'bg-emerald-100 text-emerald-700',
                    rec.type === 'reminder' && 'bg-amber-100 text-amber-700'
                  )}>
                    {rec.type === 'action' && 'Åtgärd'}
                    {rec.type === 'insight' && 'Insikt'}
                    {rec.type === 'reminder' && 'Påminnelse'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {rec.confidence}% säkerhet
                  </span>
                </div>

                <p className="text-sm text-slate-600">{rec.description}</p>

                {/* Reasoning (expandable) */}
                {expandedReasoning === rec.id && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-600 animate-in fade-in">
                    <p className="font-medium text-slate-700 mb-1">Varför rekommenderas detta:</p>
                    <p>{rec.reasoning}</p>
                    <p className="mt-2 text-emerald-700">
                      <span className="font-medium">Förväntat resultat:</span> {rec.expectedOutcome}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => handleAction(rec)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      rec.priority === 'critical'
                        ? 'bg-rose-600 text-white hover:bg-rose-700'
                        : 'bg-violet-600 text-white hover:bg-violet-700'
                    )}
                  >
                    {rec.action.label}
                  </button>
                  <button
                    onClick={() => setExpandedReasoning(expandedReasoning === rec.id ? null : rec.id)}
                    className="text-sm text-slate-500 hover:text-slate-700"
                  >
                    {expandedReasoning === rec.id ? 'Dölj' : 'Varför?'}
                  </button>
                  <button
                    onClick={() => handleDismiss(rec.id)}
                    className="text-sm text-slate-400 hover:text-slate-600 ml-auto"
                  >
                    Inte nu
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 bg-white/50 border-t border-violet-100">
        <p className="text-xs text-slate-500 text-center">
          💡 Rekommendationerna baseras på din aktivitet och data. 
          Ju mer du använder portalen, desto bättre blir förslagen.
        </p>
      </div>
    </div>
  )
}

export default AIAssistant
