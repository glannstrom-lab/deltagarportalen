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
import {
  User, Compass, FileText, Search, Mail,
  ChevronRight, ChevronDown, Bookmark, FileUser,
  Flame, ArrowRight, Heart, Smile, Meh, Frown, Sparkles
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

      <main id="main-content" className="pb-8 sm:pb-10 lg:pb-12">
        <div className="max-w-5xl mx-auto space-y-5">
          <ConsultantRequestBanner />

          {/* Header with Progress */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-stone-500 dark:text-stone-400">{t(greetingKey)}</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-800 dark:text-stone-100">
                {firstName}
              </h1>
            </div>

            {/* Progress indicator - more visual */}
            <div className="flex items-center gap-3 bg-white dark:bg-stone-800 rounded-xl px-4 py-3 border border-stone-200 dark:border-stone-700">
              <div className="flex-1 min-w-[120px]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-stone-600 dark:text-stone-400">Redo för jobb</span>
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400">{progressPercent}%</span>
                </div>
                <div className="h-2 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full transition-all duration-500"
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
              className="flex items-center justify-between gap-4 bg-teal-500 rounded-xl px-5 py-4 text-white hover:bg-teal-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                  <nextStep.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-teal-100 font-medium">Nästa steg</p>
                  <h2 className="font-semibold truncate">{t(nextStep.titleKey)}</h2>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 shrink-0" />
            </Link>
          )}

          {/* Stats Grid - Improved empty states */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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

          {/* Two column layout */}
          <div className="grid lg:grid-cols-5 gap-5">
            {/* Main column */}
            <div className="lg:col-span-3 space-y-5">
              {/* Onboarding Section - Collapsed completed */}
              {remainingSteps.length > 0 && (
                <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
                  <div className="px-5 py-3 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                    <h2 className="font-semibold text-stone-800 dark:text-stone-100">Att göra</h2>
                    <span className="text-xs text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-full">
                      {remainingSteps.length} kvar
                    </span>
                  </div>
                  <div className="p-3 space-y-1">
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
                        className="w-full px-5 py-2.5 text-left text-sm text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center justify-between"
                      >
                        <span>{completedSteps.length} avklarade steg</span>
                        <ChevronDown className={cn('w-4 h-4 transition-transform', showCompletedSteps && 'rotate-180')} />
                      </button>
                      {showCompletedSteps && (
                        <div className="px-3 pb-3 space-y-1">
                          {completedSteps.map(step => (
                            <div key={step.id} className="flex items-center gap-3 p-2 text-sm text-stone-400 dark:text-stone-500">
                              <div className="w-6 h-6 bg-teal-100 dark:bg-teal-900/30 rounded flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-xl border border-teal-200 dark:border-teal-800 p-6 text-center">
                  <Sparkles className="w-10 h-10 text-teal-500 mx-auto mb-3" />
                  <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-1">
                    Alla steg avklarade!
                  </h2>
                  <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
                    Du är redo att söka jobb. Lycka till!
                  </p>
                  <Link
                    to="/job-search"
                    className="inline-flex items-center gap-2 bg-teal-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-teal-600 transition-colors"
                  >
                    Sök jobb <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {/* Recent Saved Jobs */}
              {dashboardData?.jobs?.recentSavedJobs && dashboardData.jobs.recentSavedJobs.length > 0 && (
                <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-stone-800 dark:text-stone-100">Sparade jobb</h3>
                    <Link to="/job-search" className="text-sm text-teal-600 dark:text-teal-400 hover:underline">
                      Visa alla
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {dashboardData.jobs.recentSavedJobs.slice(0, 3).map(job => (
                      <div key={job.id} className="p-3 rounded-lg bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors">
                        <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{job.title}</p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">{job.company}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar column */}
            <div className="lg:col-span-2 space-y-5">
              {/* Interest Profile */}
              {interestProfile?.hasResult && interestProfile.riasecScores ? (
                <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 p-5">
                  <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-4">
                    Din intresseprofil
                  </h3>
                  <div className="flex justify-center mb-4">
                    <DashboardRiasecChart scores={interestProfile.riasecScores} size={160} />
                  </div>
                  <div className="space-y-2">
                    {interestProfile.dominantTypes.slice(0, 3).map((type) => (
                      <div key={type.code} className="flex items-center justify-between text-sm">
                        <span className="text-stone-600 dark:text-stone-400">{t(`riasec.${type.code}`)}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${type.score}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-purple-600 dark:text-purple-400 w-8">{type.score}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link
                    to="/interest-guide"
                    className="flex items-center justify-center gap-1 mt-4 py-2 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium"
                  >
                    Se mer <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <Link
                  to="/interest-guide"
                  className="block bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-5 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center">
                      <Compass className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="font-semibold text-stone-800 dark:text-stone-100">Hitta dina intressen</h3>
                  </div>
                  <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">
                    Upptäck vilka yrken som passar din personlighet
                  </p>
                  <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                    Starta guiden →
                  </span>
                </Link>
              )}

              {/* Wellness - Quick mood buttons */}
              <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-pink-50 dark:bg-pink-900/20 rounded-lg flex items-center justify-center">
                    <Heart className="w-5 h-5 text-pink-500" />
                  </div>
                  <h3 className="font-semibold text-stone-800 dark:text-stone-100">Hur mår du?</h3>
                </div>

                {/* Quick mood buttons */}
                <div className="flex gap-2 mb-3">
                  <Link
                    to="/wellness?mood=good"
                    className="flex-1 flex flex-col items-center gap-1 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                  >
                    <Smile className="w-6 h-6 text-emerald-500" />
                    <span className="text-xs text-emerald-700 dark:text-emerald-400">Bra</span>
                  </Link>
                  <Link
                    to="/wellness?mood=okay"
                    className="flex-1 flex flex-col items-center gap-1 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                  >
                    <Meh className="w-6 h-6 text-amber-500" />
                    <span className="text-xs text-amber-700 dark:text-amber-400">Okej</span>
                  </Link>
                  <Link
                    to="/wellness?mood=low"
                    className="flex-1 flex flex-col items-center gap-1 p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
                  >
                    <Frown className="w-6 h-6 text-rose-400" />
                    <span className="text-xs text-rose-600 dark:text-rose-400">Lågt</span>
                  </Link>
                </div>

                <Link
                  to="/wellness"
                  className="block text-center text-sm text-pink-600 dark:text-pink-400 hover:text-pink-700 font-medium"
                >
                  Mer i Välmående →
                </Link>
              </div>
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
      className="bg-white dark:bg-stone-900 rounded-xl p-4 border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 transition-colors group"
    >
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3', colorStyles[color])}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      {status === 'empty' ? (
        <>
          <p className="text-lg font-bold text-stone-300 dark:text-stone-600">—</p>
          <p className="text-xs text-teal-600 dark:text-teal-400 font-medium group-hover:underline">{emptyText}</p>
        </>
      ) : (
        <>
          <p className="text-xl font-bold text-stone-800 dark:text-stone-100">{value}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400">{label}</p>
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
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-colors group',
        isCurrent
          ? 'bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800'
          : 'hover:bg-stone-50 dark:hover:bg-stone-800'
      )}
    >
      <div className={cn(
        'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
        isCurrent ? 'bg-teal-500 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-400 group-hover:bg-stone-200'
      )}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium',
          isCurrent ? 'text-stone-800 dark:text-stone-100' : 'text-stone-600 dark:text-stone-400'
        )}>
          {title}
        </p>
        <p className="text-xs text-stone-400 dark:text-stone-500 truncate">{description}</p>
      </div>
      {isCurrent && (
        <span className="text-xs text-white font-medium px-2 py-0.5 bg-teal-500 rounded-full shrink-0">
          Nästa
        </span>
      )}
      {!isCurrent && (
        <ChevronRight className="w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-stone-400 shrink-0" />
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
