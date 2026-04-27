/**
 * Dashboard Page - Improved Design
 * Cleaner layout, focused onboarding, better visual hierarchy
 */
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ConsultantRequestBanner } from '@/components/consultant/ConsultantRequestBanner'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { useDashboardDataQuery } from '@/hooks/useDashboardData'
import { useInterestProfile } from '@/hooks/useInterestProfile'
import { useFocusMode } from '@/components/FocusModeProvider'
import FocusDashboard from './FocusDashboard'
import {
  User, Compass, FileText, Search, Mail,
  ChevronRight, ChevronDown, Bookmark, FileUser,
  Flame, ArrowRight, Sparkles
} from '@/components/ui/icons'

import { DashboardRiasecChart } from '@/components/dashboard/DashboardRiasecChart'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'
import { DashboardError } from '@/components/dashboard/DashboardError'

// Onboarding steps
const ONBOARDING_STEPS = [
  { step: 1, id: 'profile', titleKey: 'dashboard.onboarding.steps.profile.title', descriptionKey: 'dashboard.onboarding.steps.profile.description', icon: User, path: '/profile', trackKey: 'profile' },
  { step: 2, id: 'interest', titleKey: 'dashboard.onboarding.steps.interest.title', descriptionKey: 'dashboard.onboarding.steps.interest.description', icon: Compass, path: '/interest-guide', trackKey: 'interest' },
  { step: 3, id: 'cv', titleKey: 'dashboard.onboarding.steps.cv.title', descriptionKey: 'dashboard.onboarding.steps.cv.description', icon: FileUser, path: '/cv', trackKey: 'cv' },
  { step: 4, id: 'jobSearch', titleKey: 'dashboard.onboarding.steps.jobSearch.title', descriptionKey: 'dashboard.onboarding.steps.jobSearch.description', icon: Search, path: '/job-search', trackKey: 'jobSearch' },
  { step: 5, id: 'coverLetter', titleKey: 'dashboard.onboarding.steps.coverLetter.title', descriptionKey: 'dashboard.onboarding.steps.coverLetter.description', icon: Mail, path: '/cover-letter', trackKey: 'coverLetter' },
]

export default function DashboardPage() {
  const { t, i18n } = useTranslation()
  const { profile: authProfile } = useAuthStore()
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError, refetch } = useDashboardDataQuery()
  const { profile: interestProfile, isLoading: interestLoading } = useInterestProfile()
  const [showCompletedSteps, setShowCompletedSteps] = useState(false)
  const { isFocusMode, toggleFocusMode } = useFocusMode()

  // Calculate onboarding progress
  const onboardingProgress = useMemo(() => {
    if (!dashboardData) return { completed: 0, total: ONBOARDING_STEPS.length, progress: {} as Record<string, boolean> }

    const progress: Record<string, boolean> = {
      profile: authProfile?.first_name ? true : false,
      interest: interestProfile?.hasResult || false,
      cv: dashboardData.cv?.hasCV || false,
      jobSearch: dashboardData.jobs?.savedCount > 0,
      coverLetter: dashboardData.coverLetters?.count > 0,
    }

    const completed = Object.values(progress).filter(Boolean).length
    return { completed, total: ONBOARDING_STEPS.length, progress }
  }, [dashboardData, authProfile?.first_name, interestProfile?.hasResult])

  const progressPercent = Math.round((onboardingProgress.completed / (onboardingProgress.total || 1)) * 100)

  // Split steps into completed and remaining
  const completedSteps = ONBOARDING_STEPS.filter(step => onboardingProgress.progress?.[step.trackKey])
  const remainingSteps = ONBOARDING_STEPS.filter(step => !onboardingProgress.progress?.[step.trackKey])

  // Find next incomplete step
  const nextStep = remainingSteps[0] || null

  // In focus mode, show simplified dashboard (after all hooks)
  if (isFocusMode) {
    return <FocusDashboard onExitFocusMode={toggleFocusMode} />
  }

  if (dashboardLoading || interestLoading) {
    return <DashboardSkeleton />
  }

  if (dashboardError) {
    return <DashboardError error={dashboardError} onRetry={refetch} />
  }

  const firstName = authProfile?.first_name || t('dashboard.welcome')
  const greetingKey = getGreetingKey()

  return (
    <div key={i18n.language}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-teal-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        {t('dashboard.skipToContent')}
      </a>

      <main id="main-content" className="pb-6 sm:pb-8 lg:pb-12">
        <div className="max-w-5xl mx-auto space-y-4 sm:space-y-5">
          <ConsultantRequestBanner />

          {/* Header with Progress */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center justify-between sm:block">
              <div>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">{t(greetingKey)}</p>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-stone-800 dark:text-stone-100">
                  {firstName}
                </h1>
              </div>
              {/* Progress badge - mobile only */}
              <div className="flex sm:hidden items-center gap-1.5 bg-teal-50 dark:bg-teal-900/30 px-2.5 py-1 rounded-full">
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400">{progressPercent}%</span>
                {progressPercent === 100 && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
              </div>
            </div>

            {/* Progress indicator - desktop */}
            <div className="hidden sm:flex items-center gap-3 bg-white dark:bg-stone-800 rounded-xl px-4 py-3 border border-stone-200 dark:border-stone-700/50">
              <div className="flex-1 min-w-[120px]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-stone-600 dark:text-stone-400">{t('dashboard.readyForJob')}</span>
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400">{progressPercent}%</span>
                </div>
                <div className="h-2 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              {progressPercent === 100 && (
                <Sparkles className="w-5 h-5 text-amber-500" />
              )}
            </div>
          </div>

          {/* Next Step Banner - More compact */}
          {nextStep && progressPercent < 100 && (
            <Link
              to={nextStep.path}
              className="flex items-center justify-between gap-3 sm:gap-4 bg-teal-500 rounded-xl px-4 sm:px-5 py-3 sm:py-4 text-white hover:bg-teal-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                  <nextStep.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-teal-100 font-medium">{t('dashboard.nextStep')}</p>
                  <h2 className="text-sm sm:text-base font-semibold truncate">{t(nextStep.titleKey)}</h2>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            </Link>
          )}

          {/* Stats Grid - Improved empty states */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <StatCard
              icon={FileText}
              label="CV"
              value={dashboardData?.cv?.hasCV ? `${dashboardData.cv.progress}%` : '—'}
              status={dashboardData?.cv?.hasCV ? 'complete' : 'empty'}
              emptyText="Skapa ditt CV"
              to="/cv"
              color="purple"
            />
            <StatCard
              icon={Bookmark}
              label="Sparade jobb"
              value={dashboardData?.jobs?.savedCount || 0}
              status={dashboardData?.jobs?.savedCount > 0 ? 'active' : 'empty'}
              emptyText="Hitta jobb"
              to="/job-search"
              color="blue"
            />
            <StatCard
              icon={Mail}
              label="Ansökningar"
              value={dashboardData?.applications?.total || 0}
              status={dashboardData?.applications?.total > 0 ? 'active' : 'empty'}
              emptyText="Börja ansöka"
              to="/applications"
              color="peach"
            />
            <StatCard
              icon={Flame}
              label="Streak"
              value={dashboardData?.activity?.streakDays ? `${dashboardData.activity.streakDays}d` : '1d'}
              status="active"
              to="/diary"
              color="teal"
            />
          </div>

          {/* Two column layout - reordered for mobile: wellness first */}
          <div className="grid lg:grid-cols-5 gap-4 sm:gap-5">
            {/* Sidebar column - shows first on mobile */}
            <div className="lg:col-span-2 lg:order-2 space-y-4 sm:space-y-5">
{/* Interest Profile */}
              {interestProfile?.hasResult && interestProfile.riasecScores ? (
                <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700/50 p-4 sm:p-5">
                  <h3 className="text-sm sm:text-base font-semibold text-stone-800 dark:text-stone-100 mb-3 sm:mb-4">
                    {t('dashboard.yourInterestProfile')}
                  </h3>
                  <div className="flex justify-center mb-3 sm:mb-4">
                    <DashboardRiasecChart scores={interestProfile.riasecScores} size={140} />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    {interestProfile.dominantTypes.slice(0, 3).map((type) => (
                      <div key={type.code} className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-stone-600 dark:text-stone-400">{t(`riasec.${type.code}`)}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-12 sm:w-16 h-1.5 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${type.score}%` }}
                            />
                          </div>
                          <span className="text-[10px] sm:text-xs font-medium text-purple-600 dark:text-purple-400 w-7 sm:w-8">{type.score}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link
                    to="/interest-guide"
                    className="flex items-center justify-center gap-1 mt-3 sm:mt-4 py-2 text-xs sm:text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium"
                  >
                    {t('dashboard.seeMore')} <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <Link
                  to="/interest-guide"
                  className="block bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800/50 p-4 sm:p-5 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center">
                      <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-sm sm:text-base font-semibold text-stone-800 dark:text-stone-100">{t('dashboard.findYourInterests')}</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mb-2 sm:mb-3">
                    {t('dashboard.discoverCareers')}
                  </p>
                  <span className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 font-medium">
                    {t('dashboard.startGuide')} →
                  </span>
                </Link>
              )}
            </div>

            {/* Main column */}
            <div className="lg:col-span-3 lg:order-1 space-y-4 sm:space-y-5">
              {/* Onboarding Section - Collapsed completed */}
              {remainingSteps.length > 0 && (
                <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700/50 overflow-hidden">
                  <div className="px-4 sm:px-5 py-2.5 sm:py-3 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                    <h2 className="text-sm sm:text-base font-semibold text-stone-800 dark:text-stone-100">{t('dashboard.toDo')}</h2>
                    <span className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 sm:py-1 rounded-full">
                      {remainingSteps.length} {t('dashboard.remaining')}
                    </span>
                  </div>
                  <div className="p-2 sm:p-3 space-y-1">
                    {remainingSteps.map((step, index) => (
                      <OnboardingStepCompact
                        key={step.id}
                        title={t(step.titleKey)}
                        description={t(step.descriptionKey)}
                        icon={step.icon}
                        isCurrent={index === 0}
                        to={step.path}
                      />
                    ))}
                  </div>

                  {/* Completed steps toggle */}
                  {completedSteps.length > 0 && (
                    <div className="border-t border-stone-100 dark:border-stone-800">
                      <button
                        onClick={() => setShowCompletedSteps(!showCompletedSteps)}
                        className="w-full px-4 sm:px-5 py-2 sm:py-2.5 text-left text-xs sm:text-sm text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center justify-between"
                      >
                        <span>{t('dashboard.completedSteps', { count: completedSteps.length })}</span>
                        <ChevronDown className={cn('w-4 h-4 transition-transform', showCompletedSteps && 'rotate-180')} />
                      </button>
                      {showCompletedSteps && (
                        <div className="px-2 sm:px-3 pb-2 sm:pb-3 space-y-1">
                          {completedSteps.map(step => (
                            <div key={step.id} className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 text-xs sm:text-sm text-stone-400 dark:text-stone-500">
                              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-teal-100 dark:bg-teal-900/30 rounded flex items-center justify-center">
                                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <span className="line-through">{t(step.titleKey)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* All done celebration */}
              {remainingSteps.length === 0 && (
                <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-200 dark:border-teal-800/50 p-4 sm:p-6 text-center">
                  <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-teal-500 mx-auto mb-2 sm:mb-3" />
                  <h2 className="text-base sm:text-lg font-bold text-stone-800 dark:text-stone-100 mb-1">
                    {t('dashboard.allStepsComplete')}
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mb-3 sm:mb-4">
                    {t('dashboard.readyToApply')}
                  </p>
                  <Link
                    to="/job-search"
                    className="inline-flex items-center gap-2 bg-teal-500 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium hover:bg-teal-600 transition-colors"
                  >
                    {t('dashboard.searchJobs')} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {/* Recent Saved Jobs */}
              {dashboardData?.jobs?.recentSavedJobs && dashboardData.jobs.recentSavedJobs.length > 0 && (
                <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700/50 p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h3 className="text-sm sm:text-base font-semibold text-stone-800 dark:text-stone-100">{t('dashboard.savedJobs')}</h3>
                    <Link to="/job-search" className="text-xs sm:text-sm text-teal-600 dark:text-teal-400 hover:underline">
                      {t('dashboard.viewAll')}
                    </Link>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    {dashboardData.jobs.recentSavedJobs.slice(0, 3).map(job => (
                      <div key={job.id} className="p-2.5 sm:p-3 rounded-lg bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors">
                        <p className="text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-200 truncate">{job.title}</p>
                        <p className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 truncate">{job.company}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// Compact stat card component
function StatCard({
  icon: Icon,
  label,
  value,
  status,
  emptyText,
  to,
  color
}: {
  icon: React.ElementType
  label: string
  value: string | number
  status: 'empty' | 'active' | 'complete'
  emptyText?: string
  to: string
  color: 'purple' | 'blue' | 'peach' | 'teal'
}) {
  const colorStyles = {
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    peach: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    teal: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400',
  }

  return (
    <Link
      to={to}
      className="bg-white dark:bg-stone-900 rounded-xl p-3 sm:p-4 border border-stone-200 dark:border-stone-700/50 hover:border-stone-300 dark:hover:border-stone-600 transition-colors group"
    >
      <div className={cn('w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center mb-2 sm:mb-3', colorStyles[color])}>
        <Icon className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
      </div>
      {status === 'empty' ? (
        <>
          <p className="text-base sm:text-lg font-bold text-stone-300 dark:text-stone-600">—</p>
          <p className="text-[10px] sm:text-xs text-teal-600 dark:text-teal-400 font-medium group-hover:underline">{emptyText}</p>
        </>
      ) : (
        <>
          <p className="text-lg sm:text-xl font-bold text-stone-800 dark:text-stone-100">{value}</p>
          <p className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400">{label}</p>
        </>
      )}
    </Link>
  )
}

// Compact onboarding step
function OnboardingStepCompact({
  title,
  description,
  icon: Icon,
  isCurrent,
  to
}: {
  title: string
  description: string
  icon: React.ElementType
  isCurrent: boolean
  to: string
}) {
  const { t } = useTranslation()

  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg transition-colors group',
        isCurrent
          ? 'bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/50'
          : 'hover:bg-stone-50 dark:hover:bg-stone-800'
      )}
    >
      <div className={cn(
        'w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0',
        isCurrent ? 'bg-teal-500 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-400 group-hover:bg-stone-200'
      )}>
        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-xs sm:text-sm font-medium',
          isCurrent ? 'text-stone-800 dark:text-stone-100' : 'text-stone-600 dark:text-stone-400'
        )}>
          {title}
        </p>
        <p className="text-[10px] sm:text-xs text-stone-400 dark:text-stone-500 truncate">{description}</p>
      </div>
      {isCurrent && (
        <span className="text-[10px] sm:text-xs text-white font-medium px-1.5 sm:px-2 py-0.5 bg-teal-500 rounded-full shrink-0">
          {t('dashboard.next')}
        </span>
      )}
      {!isCurrent && (
        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-300 dark:text-stone-600 group-hover:text-stone-400 shrink-0" />
      )}
    </Link>
  )
}

function getGreetingKey() {
  const hour = new Date().getHours()
  if (hour < 10) return 'dashboard.greetings.morning'
  if (hour < 12) return 'dashboard.greetings.lateMorning'
  if (hour < 18) return 'dashboard.greetings.afternoon'
  return 'dashboard.greetings.evening'
}
