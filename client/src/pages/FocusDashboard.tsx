/**
 * FocusDashboard - NPF-anpassad förenklad dashboard
 *
 * Designad för användare med neuropsykiatriska funktionsvariationer (ADHD, autism, etc.)
 * - Ett tydligt nästa steg i fokus
 * - Minimal statistik
 * - Stora, klickbara kort
 * - Max 3-4 synliga element åt gången
 */

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { useDashboardDataQuery } from '@/hooks/useDashboardData'
import { useInterestProfile } from '@/hooks/useInterestProfile'
import { cn } from '@/lib/utils'
import {
  User, Compass, FileText, Search, Mail,
  ArrowRight, Sparkles, Check, Loader2
} from '@/components/ui/icons'

// Simplified onboarding steps (same as Dashboard but fewer details shown)
const ONBOARDING_STEPS = [
  { id: 'profile', titleKey: 'focusDashboard.steps.profile', icon: User, path: '/profile', trackKey: 'profile' },
  { id: 'interest', titleKey: 'focusDashboard.steps.interest', icon: Compass, path: '/interest-guide', trackKey: 'interest' },
  { id: 'cv', titleKey: 'focusDashboard.steps.cv', icon: FileText, path: '/cv', trackKey: 'cv' },
  { id: 'jobSearch', titleKey: 'focusDashboard.steps.jobSearch', icon: Search, path: '/job-search', trackKey: 'jobSearch' },
  { id: 'coverLetter', titleKey: 'focusDashboard.steps.coverLetter', icon: Mail, path: '/cover-letter', trackKey: 'coverLetter' },
]

interface FocusDashboardProps {
  onExitFocusMode?: () => void
}

export default function FocusDashboard({ onExitFocusMode }: FocusDashboardProps) {
  const { t } = useTranslation()
  const { profile: authProfile } = useAuthStore()
  const { data: dashboardData, isLoading: dashboardLoading } = useDashboardDataQuery()
  const { profile: interestProfile, isLoading: interestLoading } = useInterestProfile()

  // Calculate onboarding progress
  const onboardingProgress = useMemo(() => {
    if (!dashboardData) return { completed: 0, total: ONBOARDING_STEPS.length, progress: {} as Record<string, boolean>, nextStep: ONBOARDING_STEPS[0] }

    const progress: Record<string, boolean> = {
      profile: authProfile?.first_name ? true : false,
      interest: interestProfile?.hasResult || false,
      cv: dashboardData.cv?.hasCV || false,
      jobSearch: dashboardData.jobs?.savedCount > 0,
      coverLetter: dashboardData.coverLetters?.count > 0,
    }

    const completed = Object.values(progress).filter(Boolean).length
    const nextStep = ONBOARDING_STEPS.find(step => !progress[step.trackKey]) || null

    return { completed, total: ONBOARDING_STEPS.length, progress, nextStep }
  }, [dashboardData, authProfile?.first_name, interestProfile?.hasResult])

  const progressPercent = Math.round((onboardingProgress.completed / (onboardingProgress.total || 1)) * 100)
  const firstName = authProfile?.first_name || t('focusDashboard.defaultName', 'du')
  const allDone = progressPercent === 100

  if (dashboardLoading || interestLoading) {
    return (
      <div className="max-w-lg mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto pb-8">
      {/* Greeting */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-2">
          {t('focusDashboard.greeting', 'Hej {{name}}!', { name: firstName })}
        </h1>
        <p className="text-stone-500 dark:text-stone-400">
          {allDone
            ? t('focusDashboard.allDone', 'Du är redo att söka jobb!')
            : t('focusDashboard.progress', 'Du har gjort {{percent}}% av din jobbprofil', { percent: progressPercent })
          }
        </p>
      </div>

      {/* Large Progress Indicator */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700/50 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-stone-600 dark:text-stone-400">
            {t('focusDashboard.progressLabel', 'Din framgång')}
          </span>
          <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
            {progressPercent}%
          </span>
        </div>
        <div className="h-4 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-4">
          {ONBOARDING_STEPS.map((step) => {
            const isComplete = onboardingProgress.progress[step.trackKey]
            const Icon = step.icon
            return (
              <div
                key={step.id}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  isComplete
                    ? 'bg-teal-500 text-white'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-400'
                )}
              >
                {isComplete ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Next Step - Primary Focus */}
      {onboardingProgress.nextStep && !allDone && (
        <Link
          to={onboardingProgress.nextStep.path}
          className={cn(
            'block bg-teal-500 rounded-2xl p-6 mb-6 text-white',
            'hover:bg-teal-600 transition-colors',
            'focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/50'
          )}
        >
          <p className="text-teal-100 text-sm font-medium mb-1">
            {t('focusDashboard.nextStep', 'Ditt nästa steg')}
          </p>
          <h2 className="text-xl font-bold mb-3">
            {t(onboardingProgress.nextStep.titleKey)}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-teal-100">
              {t('focusDashboard.tapToStart', 'Tryck för att börja')}
            </span>
            <ArrowRight className="w-5 h-5" />
          </div>
        </Link>
      )}

      {/* All Done Celebration */}
      {allDone && (
        <div className="bg-teal-50 dark:bg-teal-900/20 rounded-2xl border border-teal-200 dark:border-teal-800/50 p-6 mb-6 text-center">
          <Sparkles className="w-12 h-12 text-teal-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2">
            {t('focusDashboard.congratulations', 'Bra jobbat!')}
          </h2>
          <p className="text-stone-600 dark:text-stone-400 mb-4">
            {t('focusDashboard.readyToApply', 'Du har en komplett jobbprofil. Dags att börja söka!')}
          </p>
          <Link
            to="/job-search"
            className={cn(
              'inline-flex items-center gap-2 bg-teal-500 text-white px-6 py-3 rounded-xl font-semibold',
              'hover:bg-teal-600 transition-colors'
            )}
          >
            {t('focusDashboard.searchJobs', 'Sök jobb')}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      )}

      {/* Simple Quick Actions - Max 3 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-2">
          {t('focusDashboard.quickActions', 'Genvägar')}
        </h3>

        <QuickActionCard
          to="/cv"
          icon={FileText}
          title={t('focusDashboard.actions.cv', 'Mitt CV')}
          subtitle={dashboardData?.cv?.hasCV
            ? t('focusDashboard.actions.cvComplete', 'Komplett')
            : t('focusDashboard.actions.cvIncomplete', 'Börja här')
          }
          isComplete={dashboardData?.cv?.hasCV}
        />

        <QuickActionCard
          to="/job-search"
          icon={Search}
          title={t('focusDashboard.actions.jobs', 'Sök jobb')}
          subtitle={dashboardData?.jobs?.savedCount
            ? t('focusDashboard.actions.jobsSaved', '{{count}} sparade', { count: dashboardData.jobs.savedCount })
            : t('focusDashboard.actions.jobsNone', 'Hitta ditt drömjobb')
          }
        />

        <QuickActionCard
          to="/cover-letter"
          icon={Mail}
          title={t('focusDashboard.actions.coverLetter', 'Personligt brev')}
          subtitle={dashboardData?.coverLetters?.count
            ? t('focusDashboard.actions.coverLetterCount', '{{count}} brev', { count: dashboardData.coverLetters.count })
            : t('focusDashboard.actions.coverLetterNone', 'Skapa med AI')
          }
        />
      </div>

      {/* Exit Focus Mode Link */}
      {onExitFocusMode && (
        <button
          onClick={onExitFocusMode}
          className="w-full mt-8 text-center text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
        >
          {t('focusDashboard.exitFocusMode', 'Byt till vanligt läge')}
        </button>
      )}
    </div>
  )
}

// ============================================
// HELPER COMPONENTS
// ============================================

interface QuickActionCardProps {
  to: string
  icon: React.ElementType
  title: string
  subtitle: string
  isComplete?: boolean
}

function QuickActionCard({ to, icon: Icon, title, subtitle, isComplete }: QuickActionCardProps) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl border transition-colors',
        'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700/50',
        'hover:border-teal-500 dark:hover:border-teal-500',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500'
      )}
    >
      <div className={cn(
        'w-12 h-12 rounded-xl flex items-center justify-center',
        isComplete
          ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400'
          : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
      )}>
        {isComplete ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-stone-800 dark:text-stone-100">{title}</p>
        <p className="text-sm text-stone-500 dark:text-stone-400">{subtitle}</p>
      </div>
      <ArrowRight className="w-5 h-5 text-stone-400" />
    </Link>
  )
}
