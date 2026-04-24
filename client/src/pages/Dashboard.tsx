/**
 * Dashboard Page - Visual overview with real data
 * Features: Hero, KPIs, RIASEC chart, compact onboarding
 * Updated: Next step CTA, limited visible steps for less overwhelm
 */
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ConsultantRequestBanner } from '@/components/consultant/ConsultantRequestBanner'
import { HelpButton } from '@/components/HelpButton'
import { helpContent } from '@/data/helpContent'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { useDashboardDataQuery } from '@/hooks/useDashboardData'
import { useInterestProfile, RIASEC_TYPES } from '@/hooks/useInterestProfile'
import {
  User, Compass, FileText, Search, Mail, ClipboardList,
  ChevronRight, ChevronDown, Bookmark, Heart, Sparkles, FileUser,
  UserCheck, Flame, Zap, ArrowRight, Play
} from '@/components/ui/icons'

// Extracted dashboard components
import { DashboardRiasecChart } from '@/components/dashboard/DashboardRiasecChart'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { OnboardingStep } from '@/components/dashboard/OnboardingStep'
import { DashboardSection } from '@/components/dashboard/DashboardSection'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'
import { DashboardError } from '@/components/dashboard/DashboardError'


// ============================================
// ONBOARDING STEPS DATA
// Reducerat från 8 till 5 steg för att minska kognitiv belastning
// ============================================
const ONBOARDING_STEPS = [
  { step: 1, id: 'profile', titleKey: 'dashboard.onboarding.steps.profile.title', descriptionKey: 'dashboard.onboarding.steps.profile.description', icon: User, path: '/profile', trackKey: 'profile' },
  { step: 2, id: 'interest', titleKey: 'dashboard.onboarding.steps.interest.title', descriptionKey: 'dashboard.onboarding.steps.interest.description', icon: Compass, path: '/interest-guide', trackKey: 'interest' },
  { step: 3, id: 'cv', titleKey: 'dashboard.onboarding.steps.cv.title', descriptionKey: 'dashboard.onboarding.steps.cv.description', icon: FileUser, path: '/cv', trackKey: 'cv' },
  { step: 4, id: 'jobSearch', titleKey: 'dashboard.onboarding.steps.jobSearch.title', descriptionKey: 'dashboard.onboarding.steps.jobSearch.description', icon: Search, path: '/job-search', trackKey: 'jobSearch' },
  { step: 5, id: 'coverLetter', titleKey: 'dashboard.onboarding.steps.coverLetter.title', descriptionKey: 'dashboard.onboarding.steps.coverLetter.description', icon: Mail, path: '/cover-letter', trackKey: 'coverLetter' },
]

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================

// Number of onboarding steps to show by default (reduces overwhelm)
const VISIBLE_STEPS_COUNT = 3

export default function DashboardPage() {
  const { t, i18n } = useTranslation()
  const { profile: authProfile } = useAuthStore()
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError, refetch } = useDashboardDataQuery()
  const { profile: interestProfile, isLoading: interestLoading } = useInterestProfile()
  const [showAllSteps, setShowAllSteps] = useState(false)

  // Calculate onboarding progress (memoized for performance)
  const onboardingProgress = useMemo(() => {
    if (!dashboardData) return { completed: 0, total: ONBOARDING_STEPS.length, currentStep: 1, progress: {} as Record<string, boolean> }

    let completed = 0
    let currentStep = 1

    // Check each step (5 core steps)
    const progress: Record<string, boolean> = {
      profile: authProfile?.first_name ? true : false,
      interest: interestProfile?.hasResult || false,
      cv: dashboardData.cv?.hasCV || false,
      jobSearch: dashboardData.jobs?.savedCount > 0,
      coverLetter: dashboardData.coverLetters?.count > 0,
    }

    ONBOARDING_STEPS.forEach((step, i) => {
      if (progress[step.trackKey]) {
        completed++
      } else if (currentStep === 1 || (i > 0 && progress[ONBOARDING_STEPS[i-1].trackKey])) {
        currentStep = step.step
      }
    })

    return { completed, total: ONBOARDING_STEPS.length, currentStep, progress }
  }, [dashboardData, authProfile?.first_name, interestProfile?.hasResult])

  // Fix: Prevent division by zero
  const progressPercent = Math.round((onboardingProgress.completed / (onboardingProgress.total || 1)) * 100)

  // Find first incomplete step for current step indicator
  const currentStepIndex = ONBOARDING_STEPS.findIndex(
    step => !onboardingProgress.progress?.[step.trackKey]
  )

  // Get the next recommended step (first incomplete)
  const nextStep = currentStepIndex >= 0 ? ONBOARDING_STEPS[currentStepIndex] : null

  // Get visible steps (memoized for performance)
  const visibleSteps = useMemo(() => {
    if (showAllSteps) return ONBOARDING_STEPS

    const completedSteps = ONBOARDING_STEPS.filter(
      step => onboardingProgress.progress?.[step.trackKey]
    )
    const incompleteSteps = ONBOARDING_STEPS.filter(
      step => !onboardingProgress.progress?.[step.trackKey]
    ).slice(0, VISIBLE_STEPS_COUNT)

    return [...completedSteps, ...incompleteSteps]
  }, [showAllSteps, onboardingProgress.progress])

  const hiddenStepsCount = ONBOARDING_STEPS.length - visibleSteps.length

  // Check if user has any activity (for hiding KPI cards for new users)
  const hasAnyActivity = useMemo(() => {
    if (!dashboardData) return false
    return (
      (dashboardData.cv?.progress || 0) > 0 ||
      (dashboardData.jobs?.savedCount || 0) > 0 ||
      (dashboardData.applications?.total || 0) > 0 ||
      (dashboardData.activity?.streakDays || 0) > 0
    )
  }, [dashboardData])

  if (dashboardLoading || interestLoading) {
    return <DashboardSkeleton />
  }

  // Show error state if data failed to load
  if (dashboardError) {
    return <DashboardError error={dashboardError} onRetry={refetch} />
  }

  const firstName = authProfile?.first_name || t('dashboard.welcome')
  const greetingKey = getGreetingKey()

  return (
    <div key={i18n.language}>
      {/* Skip link for keyboard/screen reader users - WCAG 2.4.1 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-teal-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:outline-none"
      >
        {t('dashboard.skipToContent')}
      </a>
      <main id="main-content" className="page-transition pb-8 sm:pb-10 lg:pb-12">
      {/* Responsive container: full width mobile, contained tablet/desktop */}
      <div className="max-w-full md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto">
        <ConsultantRequestBanner />

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-teal-50 via-white to-sky-50 dark:from-teal-900/20 dark:via-stone-900 dark:to-sky-900/20 rounded-2xl border border-teal-200 dark:border-teal-800/50 mb-4 sm:mb-6 overflow-hidden">
          <div className="px-4 py-4 sm:px-5 sm:py-5">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-teal-400 to-sky-400 dark:from-teal-500 dark:to-sky-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                <User className="w-6 h-6 sm:w-7 sm:h-7 text-white" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-teal-600 dark:text-teal-400 font-medium">{t(greetingKey)}</p>
                <h1 className="text-lg sm:text-xl font-bold text-teal-800 dark:text-teal-300 truncate">
                  {firstName}!
                </h1>
              </div>
              {/* Progress ring - visible on all screens */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className="relative w-10 h-10 sm:w-12 sm:h-12"
                  role="progressbar"
                  aria-valuenow={progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={t('dashboard.progressAria', { percent: progressPercent, completed: onboardingProgress.completed, total: onboardingProgress.total })}
                >
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 -rotate-90" aria-hidden="true">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="35%"
                      className="stroke-teal-100 dark:stroke-teal-900/50"
                      strokeWidth="4"
                      fill="none"
                    />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="35%"
                      className="stroke-teal-500 dark:stroke-teal-400"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${progressPercent * 1.26} 126`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs font-bold text-teal-700 dark:text-teal-300" aria-hidden="true">
                    {progressPercent}%
                  </span>
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-xs text-stone-500 dark:text-stone-400">{t('dashboard.readyForJobs')}</p>
                  <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">
                    {t('dashboard.progressCount', { completed: onboardingProgress.completed, total: onboardingProgress.total })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards - Only show if user has some activity (reduces "shame dashboard" for new users) */}
        {hasAnyActivity && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-5 lg:mb-6">
            <KpiCard
              icon={FileText}
              label={t('dashboard.kpi.cvProgress')}
              value={`${dashboardData?.cv?.progress || 0}%`}
              subtext={dashboardData?.cv?.hasCV ? t('dashboard.kpi.updated') : t('dashboard.kpi.notStarted')}
              color="teal"
              to="/cv"
            />
            <KpiCard
              icon={Bookmark}
              label={t('dashboard.kpi.savedJobs')}
              value={dashboardData?.jobs?.savedCount || 0}
              subtext={dashboardData?.jobs?.newMatches ? t('dashboard.kpi.newCount', { count: dashboardData.jobs.newMatches }) : undefined}
              color="sky"
              to="/job-search"
            />
            <KpiCard
              icon={ClipboardList}
              label={t('dashboard.kpi.applications')}
              value={dashboardData?.applications?.total || 0}
              subtext={dashboardData?.applications?.statusBreakdown?.interview ? t('dashboard.kpi.interviewCount', { count: dashboardData.applications.statusBreakdown.interview }) : undefined}
              color="amber"
              to="/applications"
            />
            <KpiCard
              icon={Flame}
              label={t('dashboard.kpi.recentActivity')}
              value={dashboardData?.activity?.streakDays ? `${dashboardData.activity.streakDays}d` : t('dashboard.kpi.today')}
              subtext={t('dashboard.kpi.keepGoing')}
              color="emerald"
            />
          </div>
        )}

        {/* Next Step CTA - Prominent single action, touch-optimized */}
        {nextStep && progressPercent < 100 && (
          <Link
            to={nextStep.path}
            className="block mb-4 sm:mb-5 lg:mb-6 bg-gradient-to-r from-teal-500 to-sky-500 dark:from-teal-600 dark:to-sky-600 rounded-2xl p-4 sm:p-5 md:p-6 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.005] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 group"
            role="region"
            aria-label={t('dashboard.nextStep.aria')}
          >
            <div className="flex items-center gap-3 sm:gap-4 md:gap-5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white/20 backdrop-blur rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-white/30 transition-colors">
                <nextStep.icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm md:text-sm text-white/80 font-medium mb-0.5 md:mb-1">{t('dashboard.nextStep.title')}</p>
                <h2 className="text-base sm:text-lg md:text-xl font-bold truncate">{t(nextStep.titleKey)}</h2>
                <p className="text-xs sm:text-sm md:text-base text-white/80 truncate">{t(nextStep.descriptionKey)}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white/20 backdrop-blur rounded-full flex items-center justify-center shrink-0 group-hover:bg-white/30 transition-colors">
                <Play className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white ml-0.5" aria-hidden="true" />
              </div>
            </div>
          </Link>
        )}

        {/* Responsive grid: 1 col mobile, 2 col tablet (sidebar below), 3 col desktop */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {/* Main content - full on mobile, 2/2 on tablet, 2/3 on desktop */}
          <div className="md:col-span-2 lg:col-span-2 space-y-3 sm:space-y-4">
            {/* Onboarding Section - Shows limited steps to reduce overwhelm */}
            <DashboardSection
              title={t('dashboard.onboarding.title')}
              icon={Zap}
              badge={`${onboardingProgress.completed}/${onboardingProgress.total}`}
              colorScheme="teal"
              defaultExpanded={progressPercent < 100}
            >
              {/* Onboarding grid: 1 col mobile, 2 col tablet+, 3 col wide desktop */}
              <div id="onboarding-steps-grid" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3">
                {visibleSteps.map((step) => {
                  const stepIndex = ONBOARDING_STEPS.findIndex(s => s.id === step.id)
                  return (
                    <OnboardingStep
                      key={step.id}
                      step={step.step}
                      title={t(step.titleKey)}
                      description={t(step.descriptionKey)}
                      icon={step.icon}
                      isComplete={onboardingProgress.progress?.[step.trackKey] || false}
                      isCurrent={currentStepIndex === stepIndex}
                      to={step.path}
                    />
                  )
                })}
              </div>
              {/* Show more button if there are hidden steps */}
              {hiddenStepsCount > 0 && !showAllSteps && (
                <button
                  onClick={() => setShowAllSteps(true)}
                  className="mt-3 w-full py-2 px-3 text-sm font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100 dark:hover:bg-teal-900/50 rounded-lg transition-colors flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  aria-expanded="false"
                  aria-controls="onboarding-steps-grid"
                >
                  <ChevronDown className="w-4 h-4" aria-hidden="true" />
                  {t('dashboard.onboarding.showMore', { count: hiddenStepsCount })}
                </button>
              )}
              {showAllSteps && hiddenStepsCount > 0 && (
                <button
                  onClick={() => setShowAllSteps(false)}
                  className="mt-3 w-full py-2 px-3 text-sm font-medium text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  aria-expanded="true"
                  aria-controls="onboarding-steps-grid"
                >
                  {t('dashboard.onboarding.showLess')}
                </button>
              )}
            </DashboardSection>

          </div>

          {/* Sidebar - full on mobile, 2-col grid on tablet, 1/3 on desktop */}
          <div className="md:col-span-2 lg:col-span-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
            {/* RIASEC Profile */}
            {interestProfile?.hasResult && interestProfile.riasecScores && (
              <div className="bg-gradient-to-br from-teal-50 to-sky-50 dark:from-teal-900/20 dark:to-sky-900/20 rounded-2xl border border-teal-200 dark:border-teal-800/50 p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                  <h3 className="text-sm sm:text-base font-semibold text-teal-800 dark:text-teal-300">{t('dashboard.sidebar.interestProfile')}</h3>
                </div>
                <div className="flex justify-center">
                  <DashboardRiasecChart scores={interestProfile.riasecScores} size={160} />
                </div>
                <div className="mt-2 sm:mt-3 space-y-1 sm:space-y-1.5">
                  {interestProfile.dominantTypes.slice(0, 3).map((type, i) => {
                    return (
                      <div key={type.code} className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-xs sm:text-sm">{['🥇', '🥈', '🥉'][i]}</span>
                        <span className="flex-1 text-xs sm:text-sm text-stone-700 dark:text-stone-300">{t(`riasec.${type.code}`)}</span>
                        <span className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400">{type.score}%</span>
                      </div>
                    )
                  })}
                </div>
                {/* Recommended occupations */}
                {interestProfile.recommendedOccupations?.length > 0 && (
                  <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-teal-200 dark:border-teal-800/50">
                    <p className="text-[10px] sm:text-xs font-medium text-teal-700 dark:text-teal-400 mb-1.5 sm:mb-2">{t('dashboard.sidebar.suitableJobs')}</p>
                    <div className="space-y-0.5 sm:space-y-1">
                      {interestProfile.recommendedOccupations.slice(0, 3).map((occ, i) => (
                        <div key={i} className="flex items-center justify-between text-[10px] sm:text-xs">
                          <span className="text-stone-600 dark:text-stone-400 truncate">{occ.name}</span>
                          <span className="text-teal-600 dark:text-teal-400 font-medium ml-2">{occ.matchPercentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <Link
                  to="/interest-guide"
                  className="flex items-center justify-center gap-1 mt-2 sm:mt-3 text-xs sm:text-sm text-teal-600 dark:text-teal-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 rounded"
                >
                  {t('dashboard.sidebar.seeMore')} <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                </Link>
              </div>
            )}

            {/* Interest guide CTA if no result */}
            {!interestProfile?.hasResult && (
              <Link
                to="/interest-guide"
                className="block bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200 dark:border-amber-800/50 p-3 sm:p-4 hover:shadow-lg transition-shadow group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                aria-label={t('dashboard.sidebar.interestGuide.aria')}
              >
                <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-400 to-orange-400 dark:from-amber-500 dark:to-orange-500 rounded-xl flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-amber-800 dark:text-amber-300 truncate">{t('dashboard.sidebar.interestGuide.title')}</h3>
                    <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400">{t('dashboard.sidebar.interestGuide.subtitle')}</p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300/80">
                  {t('dashboard.sidebar.interestGuide.description')}
                </p>
                <div className="flex items-center gap-1 mt-2 sm:mt-3 text-xs sm:text-sm font-medium text-amber-700 dark:text-amber-400 group-hover:translate-x-1 transition-transform" aria-hidden="true">
                  {t('dashboard.sidebar.interestGuide.startNow')} <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </Link>
            )}

            {/* My Consultant (if has consultant) */}
            {authProfile?.consultant_id && (
              <Link
                to="/my-consultant"
                className="block bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-900/20 dark:to-indigo-900/20 rounded-2xl border border-sky-200 dark:border-sky-800/50 p-3 sm:p-4 hover:shadow-lg transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                aria-label={t('dashboard.sidebar.consultant.aria')}
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-sky-400 to-indigo-400 dark:from-sky-500 dark:to-indigo-500 rounded-xl flex items-center justify-center shrink-0">
                    <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-semibold text-sky-800 dark:text-sky-300">{t('dashboard.sidebar.consultant.title')}</h3>
                    <p className="text-xs sm:text-sm text-sky-600 dark:text-sky-400">{t('dashboard.sidebar.consultant.subtitle')}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400 dark:text-sky-500 shrink-0" aria-hidden="true" />
                </div>
              </Link>
            )}

            {/* Recent saved jobs */}
            {dashboardData?.jobs?.recentSavedJobs && dashboardData.jobs.recentSavedJobs.length > 0 && (
              <div className="bg-white dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-700 p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h3 className="text-sm sm:text-base font-semibold text-stone-800 dark:text-stone-200">{t('dashboard.sidebar.savedJobs.title')}</h3>
                  <Link to="/job-search" className="text-[10px] sm:text-xs text-teal-600 dark:text-teal-400 hover:underline">
                    {t('dashboard.sidebar.savedJobs.viewAll')}
                  </Link>
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  {dashboardData.jobs.recentSavedJobs.slice(0, 3).map(job => (
                    <div key={job.id} className="p-1.5 sm:p-2 rounded-lg bg-stone-50 dark:bg-stone-900/50">
                      <p className="text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-200 truncate">{job.title}</p>
                      <p className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 truncate">{job.company}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Wellness quick card */}
            {dashboardData?.wellness && (
              <div className="bg-white dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-700 p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 dark:text-rose-400" aria-hidden="true" />
                  <h3 className="text-sm sm:text-base font-semibold text-stone-800 dark:text-stone-200">{t('dashboard.sidebar.wellness.title')}</h3>
                </div>
                {dashboardData.wellness.moodToday ? (
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                    {t('dashboard.sidebar.wellness.todaysMood')}: <span className="font-medium">{getMoodEmoji(dashboardData.wellness.moodToday)}</span>
                  </p>
                ) : (
                  <Link
                    to="/wellness"
                    className="text-xs sm:text-sm text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    {t('dashboard.sidebar.wellness.logToday')} →
                  </Link>
                )}
                {dashboardData.wellness.streakDays > 0 && (
                  <p className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 mt-1">
                    🔥 {t('dashboard.sidebar.wellness.streak', { days: dashboardData.wellness.streakDays })}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <HelpButton content={helpContent.dashboard} />
    </main>
    </div>
  )
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getGreetingKey() {
  const hour = new Date().getHours()
  if (hour < 10) return 'dashboard.greetings.morning'
  if (hour < 12) return 'dashboard.greetings.lateMorning'
  if (hour < 18) return 'dashboard.greetings.afternoon'
  return 'dashboard.greetings.evening'
}

function getMoodEmoji(mood: number | string) {
  const moodMap: Record<string, string> = {
    '1': '😢',
    '2': '😕',
    '3': '😐',
    '4': '🙂',
    '5': '😊',
    'terrible': '😢',
    'bad': '😕',
    'okay': '😐',
    'good': '🙂',
    'great': '😊',
  }
  return moodMap[String(mood)] || '😐'
}
