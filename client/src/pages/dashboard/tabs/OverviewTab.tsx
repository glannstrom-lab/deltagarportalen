/**
 * Overview Tab - Simplified onboarding-focused view
 * Shows the user's journey through 6 steps
 * Progress is synced to cloud
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  User,
  Compass,
  FileText,
  Target,
  Search,
  Mail,
  Check,
  ChevronRight,
  Sparkles,
  Cloud,
  Loader2
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { userApi, cvApi, type OnboardingProgress } from '@/services/supabaseApi'
import { interestGuideApi } from '@/services/cloudStorage'

// Step configuration
interface Step {
  id: keyof OnboardingProgress
  title: string
  description: string
  icon: React.ElementType
  path: string
}

// Static step definitions
const STEPS: Step[] = [
  {
    id: 'profile',
    title: 'Fyll i din profil',
    description: 'Lägg till dina kontaktuppgifter',
    icon: User,
    path: '/profile'
  },
  {
    id: 'interest',
    title: 'Gör intresseguiden',
    description: 'Upptäck vilka yrken som passar dig',
    icon: Compass,
    path: '/interest-guide'
  },
  {
    id: 'cv',
    title: 'Skapa ditt CV',
    description: 'Bygg ett professionellt CV',
    icon: FileText,
    path: '/cv'
  },
  {
    id: 'career',
    title: 'Utforska karriärvägar',
    description: 'Se möjligheter och utvecklingsvägar',
    icon: Target,
    path: '/career'
  },
  {
    id: 'jobSearch',
    title: 'Sök jobb',
    description: 'Hitta och spara intressanta jobb',
    icon: Search,
    path: '/job-search'
  },
  {
    id: 'coverLetter',
    title: 'Skriv personligt brev',
    description: 'Skapa ett övertygande brev',
    icon: Mail,
    path: '/cover-letter'
  }
]

export default function OverviewTab() {
  const { profile } = useAuthStore()
  const { t } = useTranslation()

  const [onboardingProgress, setOnboardingProgress] = useState<OnboardingProgress>({})
  const [loading, setLoading] = useState(true)
  const [synced, setSynced] = useState(true)

  // Load onboarding progress from cloud
  useEffect(() => {
    loadProgress()
  }, [])

  const loadProgress = async () => {
    // Get localStorage values as fallback/merge source
    const localStorageProgress: OnboardingProgress = {
      profile: !!localStorage.getItem('profile-data'),
      interest: !!localStorage.getItem('interest-result'),
      cv: !!localStorage.getItem('cv-data'),
      career: !!localStorage.getItem('career-visited'),
      jobSearch: !!localStorage.getItem('saved-jobs'),
      coverLetter: !!localStorage.getItem('cover-letters')
    }

    try {
      // Fetch onboarding progress, interest guide status, and CV data in parallel
      const [cloudProgress, interestGuideData, cvData] = await Promise.all([
        userApi.getOnboardingProgress(),
        interestGuideApi.getProgress().catch(() => null),
        cvApi.getCV().catch(() => null)
      ])

      // Check if interest guide is completed from the actual progress data
      const interestCompleted = cloudProgress.interest ||
        localStorageProgress.interest ||
        interestGuideData?.is_completed === true

      // Check if CV is completed - user has saved a CV with meaningful content
      const cvCompleted = cloudProgress.cv ||
        localStorageProgress.cv ||
        (cvData && (cvData.firstName || cvData.workExperience?.length > 0 || cvData.skills?.length > 0))

      // If interest is completed but not in cloud, sync it
      if (interestCompleted && !cloudProgress.interest) {
        userApi.updateOnboardingStep('interest', true).catch(console.error)
        localStorage.setItem('interest-result', 'true')
      }

      // If CV is completed but not in cloud, sync it
      if (cvCompleted && !cloudProgress.cv) {
        userApi.updateOnboardingStep('cv', true).catch(console.error)
        localStorage.setItem('cv-data', 'true')
      }

      // Merge: use cloud value if true, otherwise use localStorage value, or check actual data
      const mergedProgress: OnboardingProgress = {
        profile: cloudProgress.profile || localStorageProgress.profile,
        interest: interestCompleted,
        cv: cvCompleted,
        career: cloudProgress.career || localStorageProgress.career,
        jobSearch: cloudProgress.jobSearch || localStorageProgress.jobSearch,
        coverLetter: cloudProgress.coverLetter || localStorageProgress.coverLetter
      }

      setOnboardingProgress(mergedProgress)
      setSynced(true)
    } catch (err) {
      console.error('Error loading onboarding progress:', err)
      // Use localStorage only on error
      setOnboardingProgress(localStorageProgress)
    } finally {
      setLoading(false)
    }
  }

  // Check if step is complete
  const isStepComplete = (stepId: keyof OnboardingProgress): boolean => {
    return !!onboardingProgress[stepId]
  }

  const completedCount = STEPS.filter(step => isStepComplete(step.id)).length
  const totalSteps = STEPS.length
  const progress = Math.round((completedCount / totalSteps) * 100)

  // Find the first incomplete step (next step to do)
  const nextStepIndex = STEPS.findIndex(step => !isStepComplete(step.id))
  const allComplete = nextStepIndex === -1

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-600">Laddar din framsteg...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          {allComplete
            ? 'Fantastiskt jobbat!'
            : `Hej${profile?.first_name ? `, ${profile.first_name}` : ''}!`
          }
        </h1>
        <p className="text-slate-600">
          {allComplete
            ? 'Du har slutfört alla steg. Fortsätt utforska appen!'
            : 'Följ stegen nedan för att komma igång med din jobbsökarresa.'
          }
        </p>
        {/* Cloud sync indicator */}
        <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-slate-400">
          <Cloud className="w-3.5 h-3.5" />
          <span>Synkas automatiskt</span>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-700">Din framsteg</span>
          <span className="text-sm font-bold text-indigo-600">{completedCount} av {totalSteps} klart</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {STEPS.map((step, index) => {
          const isComplete = isStepComplete(step.id)
          const isNext = index === nextStepIndex
          const Icon = step.icon

          return (
            <Link
              key={step.id}
              to={step.path}
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl border-2 transition-all group',
                isComplete
                  ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-300'
                  : isNext
                    ? 'bg-indigo-50 border-indigo-300 hover:border-indigo-400 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
              )}
            >
              {/* Step number / check */}
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105',
                isComplete
                  ? 'bg-emerald-500 text-white'
                  : isNext
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-400'
              )}>
                {isComplete ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <Icon className="w-6 h-6" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={cn(
                    'font-semibold',
                    isComplete ? 'text-emerald-800' : isNext ? 'text-indigo-900' : 'text-slate-700'
                  )}>
                    {step.title}
                  </h3>
                  {isNext && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-indigo-600 text-white rounded-full">
                      NÄSTA
                    </span>
                  )}
                  {isComplete && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                      Klar
                    </span>
                  )}
                </div>
                <p className={cn(
                  'text-sm mt-0.5',
                  isComplete ? 'text-emerald-600' : isNext ? 'text-indigo-600' : 'text-slate-500'
                )}>
                  {step.description}
                </p>
              </div>

              {/* Arrow */}
              <ChevronRight className={cn(
                'w-5 h-5 flex-shrink-0 transition-transform group-hover:translate-x-1',
                isComplete ? 'text-emerald-400' : isNext ? 'text-indigo-400' : 'text-slate-300'
              )} />
            </Link>
          )
        })}
      </div>

      {/* All complete celebration */}
      {allComplete && (
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            💡 Tips: Besök <Link to="/journey" className="text-indigo-600 hover:underline font-medium">Min Jobbresa</Link> för att följa din utveckling
          </p>
        </div>
      )}
    </div>
  )
}
