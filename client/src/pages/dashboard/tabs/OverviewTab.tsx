/**
 * Overview Tab - Simplified onboarding-focused view
 * Shows the user's journey through 6 steps
 */

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
  Sparkles
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

// Step configuration
interface Step {
  id: string
  title: string
  description: string
  icon: React.ElementType
  path: string
  checkComplete: () => boolean
}

// Check completion status from localStorage/state
const getSteps = (): Step[] => [
  {
    id: 'profile',
    title: 'Fyll i din profil',
    description: 'Lägg till dina kontaktuppgifter',
    icon: User,
    path: '/profile',
    checkComplete: () => {
      try {
        const profile = localStorage.getItem('profile-data')
        if (!profile) return false
        const parsed = JSON.parse(profile)
        return !!(parsed.firstName && parsed.email)
      } catch {
        return false
      }
    }
  },
  {
    id: 'interest',
    title: 'Gör intresseguiden',
    description: 'Upptäck vilka yrken som passar dig',
    icon: Compass,
    path: '/interest-guide',
    checkComplete: () => {
      return !!localStorage.getItem('interest-result')
    }
  },
  {
    id: 'cv',
    title: 'Skapa ditt CV',
    description: 'Bygg ett professionellt CV',
    icon: FileText,
    path: '/cv',
    checkComplete: () => {
      try {
        const cv = localStorage.getItem('cv-data')
        if (!cv) return false
        const parsed = JSON.parse(cv)
        return !!(parsed.firstName && (parsed.workExperience?.length > 0 || parsed.skills?.length > 0))
      } catch {
        return false
      }
    }
  },
  {
    id: 'career',
    title: 'Utforska karriärvägar',
    description: 'Se möjligheter och utvecklingsvägar',
    icon: Target,
    path: '/career',
    checkComplete: () => {
      return !!localStorage.getItem('career-visited')
    }
  },
  {
    id: 'job-search',
    title: 'Sök jobb',
    description: 'Hitta och spara intressanta jobb',
    icon: Search,
    path: '/job-search',
    checkComplete: () => {
      try {
        const saved = localStorage.getItem('saved-jobs')
        if (!saved) return false
        const parsed = JSON.parse(saved)
        return Array.isArray(parsed) && parsed.length > 0
      } catch {
        return false
      }
    }
  },
  {
    id: 'cover-letter',
    title: 'Skriv personligt brev',
    description: 'Skapa ett övertygande brev',
    icon: Mail,
    path: '/cover-letter',
    checkComplete: () => {
      try {
        const letters = localStorage.getItem('cover-letters')
        if (!letters) return false
        const parsed = JSON.parse(letters)
        return Array.isArray(parsed) && parsed.length > 0
      } catch {
        return false
      }
    }
  }
]

export default function OverviewTab() {
  const { profile } = useAuthStore()
  const { t } = useTranslation()

  const steps = getSteps()
  const completedSteps = steps.filter(step => step.checkComplete())
  const completedCount = completedSteps.length
  const totalSteps = steps.length
  const progress = Math.round((completedCount / totalSteps) * 100)

  // Find the first incomplete step (next step to do)
  const nextStepIndex = steps.findIndex(step => !step.checkComplete())
  const allComplete = nextStepIndex === -1

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
        {steps.map((step, index) => {
          const isComplete = step.checkComplete()
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
