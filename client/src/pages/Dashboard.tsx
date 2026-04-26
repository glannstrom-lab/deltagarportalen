/**
 * Dashboard Page - Modern Bento Grid Layout
 * Features: Hero section, prioritized hierarchy, glassmorphism, animations
 * Updated: Bento grid, KPI cards with trends, wellness quick-select
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
import { useInterestProfile } from '@/hooks/useInterestProfile'
import {
  User, Compass, FileText, Search, Mail,
  ChevronRight, ChevronDown, Bookmark, Sparkles, FileUser,
  UserCheck, Flame, Zap, ArrowRight, Play, Target, TrendingUp
} from '@/components/ui/icons'

// Extracted dashboard components
import { DashboardRiasecChart } from '@/components/dashboard/DashboardRiasecChart'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { OnboardingStep } from '@/components/dashboard/OnboardingStep'
import { DashboardSection } from '@/components/dashboard/DashboardSection'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'
import { DashboardError } from '@/components/dashboard/DashboardError'
import { WellnessQuickCard } from '@/components/dashboard/WellnessQuickCard'


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
    <div key={i18n.language} className="animate-fade-in">
      {/* Skip link for keyboard/screen reader users - WCAG 2.4.1 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-teal-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:outline-none"
      >
        {t('dashboard.skipToContent')}
      </a>
      <main id="main-content" className="page-transition pb-8 sm:pb-10 lg:pb-12">
      {/* Responsive container */}
      <div className="max-w-full md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto space-y-4 sm:space-y-5 lg:space-y-6">
        <ConsultantRequestBanner />

        {/* ============================================
            HERO SECTION - Prioritized welcome
            ============================================ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-sky-50 dark:from-teal-900/30 dark:via-stone-900 dark:to-sky-900/20 rounded-3xl border border-teal-200/60 dark:border-teal-800/40 shadow-bento">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-teal-200/30 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-sky-200/30 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative px-5 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              {/* Avatar & Greeting */}
              <div className="flex items-center gap-4 flex-1">
                <div className="relative">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-teal-400 via-teal-500 to-sky-500 rounded-2xl lg:rounded-3xl flex items-center justify-center shadow-lg shadow-teal-200 dark:shadow-teal-900/30 shrink-0">
                    <User className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" aria-hidden="true" />
                  </div>
                  {/* Online indicator */}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white dark:border-stone-900 rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-sm sm:text-base text-teal-600 dark:text-teal-400 font-medium">{t(greetingKey)}</p>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-teal-800 dark:text-teal-200 truncate">
                    {firstName}!
                  </h1>
                </div>
              </div>

              {/* Progress Ring & Stats */}
              <div className="flex items-center gap-4 sm:gap-5 bg-white/60 dark:bg-stone-800/40 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-teal-100 dark:border-teal-800/30">
                <div
                  className="relative w-14 h-14 sm:w-16 sm:h-16"
                  role="progressbar"
                  aria-valuenow={progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={t('dashboard.progressAria', { percent: progressPercent, completed: onboardingProgress.completed, total: onboardingProgress.total })}
                >
                  <svg className="w-14 h-14 sm:w-16 sm:h-16 -rotate-90" aria-hidden="true">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="40%"
                      className="stroke-teal-100 dark:stroke-teal-900/50"
                      strokeWidth="6"
                      fill="none"
                    />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="40%"
                      className="stroke-teal-500 dark:stroke-teal-400 transition-all duration-1000 ease-out"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${progressPercent * 2.51} 251`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm sm:text-base font-bold text-teal-700 dark:text-teal-300" aria-hidden="true">
                    {progressPercent}%
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">{t('dashboard.readyForJobs')}</p>
                  <p className="text-base sm:text-lg font-bold text-teal-700 dark:text-teal-300">
                    {t('dashboard.progressCount', { completed: onboardingProgress.completed, total: onboardingProgress.total })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================
            NEXT STEP CTA - Primary action
            ============================================ */}
        {nextStep && progressPercent < 100 && (
          <Link
            to={nextStep.path}
            className="group block relative overflow-hidden bg-gradient-to-r from-teal-500 via-teal-500 to-sky-500 dark:from-teal-600 dark:via-teal-600 dark:to-sky-600 rounded-2xl lg:rounded-3xl text-white shadow-bento hover:shadow-bento-hover transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
            role="region"
            aria-label={t('dashboard.nextStep.aria')}
          >
            {/* Glassmorphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5" />
            <div className="absolute inset-0 shadow-inner-glow" />

            {/* Animated background shapes */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-sky-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />

            <div className="relative px-5 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-white/30 group-hover:scale-105 transition-all duration-300">
                  <nextStep.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs sm:text-sm text-white/80 font-medium">{t('dashboard.nextStep.title')}</span>
                    <span className="px-2 py-0.5 text-[10px] sm:text-xs font-bold bg-white/20 rounded-full">
                      Steg {nextStep.step}/{ONBOARDING_STEPS.length}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{t(nextStep.titleKey)}</h2>
                  <p className="text-sm sm:text-base text-white/80 truncate">{t(nextStep.descriptionKey)}</p>
                </div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shrink-0 group-hover:bg-white/30 group-hover:translate-x-1 transition-all duration-300">
                  <Play className="w-6 h-6 sm:w-7 sm:h-7 text-white ml-0.5" aria-hidden="true" />
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* ============================================
            BENTO GRID - Main content area
            ============================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-5 lg:gap-6">

          {/* KPI Cards Row - Full width on mobile, 2x2 on tablet, 4-col on desktop */}
          <div className="md:col-span-2 lg:col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <KpiCard
              icon={FileText}
              label={t('dashboard.kpi.cvProgress')}
              value={`${dashboardData?.cv?.progress || 0}%`}
              subtext={dashboardData?.cv?.hasCV ? t('dashboard.kpi.updated') : t('dashboard.kpi.notStarted')}
              color="teal"
              to="/cv"
              trend={dashboardData?.cv?.progress > 50 ? 'up' : 'neutral'}
            />
            <KpiCard
              icon={Bookmark}
              label={t('dashboard.kpi.savedJobs')}
              value={dashboardData?.jobs?.savedCount || 0}
              subtext={dashboardData?.jobs?.newMatches ? t('dashboard.kpi.newCount', { count: dashboardData.jobs.newMatches }) : undefined}
              color="sky"
              to="/job-search"
              trend={dashboardData?.jobs?.savedCount > 0 ? 'up' : 'neutral'}
            />
            <KpiCard
              icon={Target}
              label={t('dashboard.kpi.applications')}
              value={dashboardData?.applications?.total || 0}
              subtext={dashboardData?.applications?.statusBreakdown?.interview ? t('dashboard.kpi.interviewCount', { count: dashboardData.applications.statusBreakdown.interview }) : undefined}
              color="amber"
              to="/applications"
              trend={dashboardData?.applications?.statusBreakdown?.interview ? 'up' : 'neutral'}
            />
            <KpiCard
              icon={Flame}
              label={t('dashboard.kpi.recentActivity')}
              value={dashboardData?.activity?.streakDays ? `${dashboardData.activity.streakDays}d` : t('dashboard.kpi.today')}
              subtext={t('dashboard.kpi.keepGoing')}
              color="emerald"
              trend={dashboardData?.activity?.streakDays > 2 ? 'up' : 'neutral'}
            />
          </div>

          {/* Main Content Column */}
          <div className="md:col-span-1 lg:col-span-8 space-y-4 sm:space-y-5">
            {/* Onboarding Section */}
            <DashboardSection
              title={t('dashboard.onboarding.title')}
              icon={Zap}
              badge={`${onboardingProgress.completed}/${onboardingProgress.total}`}
              colorScheme="teal"
              defaultExpanded={progressPercent < 100}
            >
              <div id="onboarding-steps-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
              {/* Show more button */}
              {hiddenStepsCount > 0 && !showAllSteps && (
                <button
                  onClick={() => setShowAllSteps(true)}
                  className="mt-4 w-full py-2.5 px-4 text-sm font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100 dark:hover:bg-teal-900/50 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 hover:scale-[1.01]"
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
                  className="mt-4 w-full py-2.5 px-4 text-sm font-medium text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  aria-expanded="true"
                  aria-controls="onboarding-steps-grid"
                >
                  {t('dashboard.onboarding.showLess')}
                </button>
              )}
            </DashboardSection>

            {/* Recent Saved Jobs */}
            {dashboardData?.jobs?.recentSavedJobs && dashboardData.jobs.recentSavedJobs.length > 0 && (
              <div className="bg-white dark:bg-stone-900/50 rounded-2xl border border-stone-200/60 dark:border-stone-700/40 shadow-bento p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                      <Bookmark className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <h3 className="text-base font-semibold text-stone-800 dark:text-stone-200">
                      {t('dashboard.sidebar.savedJobs.title')}
                    </h3>
                  </div>
                  <Link
                    to="/job-search"
                    className="flex items-center gap-1 text-sm text-teal-600 dark:text-teal-400 hover:underline font-medium"
                  >
                    {t('dashboard.sidebar.savedJobs.viewAll')}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid gap-3">
                  {dashboardData.jobs.recentSavedJobs.slice(0, 3).map(job => (
                    <div
                      key={job.id}
                      className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-stone-50 to-sky-50/50 dark:from-stone-800/50 dark:to-sky-900/10 border border-stone-100 dark:border-stone-700/50 hover:shadow-sm transition-shadow"
                    >
                      <p className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">{job.title}</p>
                      <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{job.company}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Column */}
          <div className="md:col-span-1 lg:col-span-4 space-y-4 sm:space-y-5">
            {/* RIASEC Profile */}
            {interestProfile?.hasResult && interestProfile.riasecScores && (
              <div className="bg-gradient-to-br from-teal-50 via-white to-sky-50 dark:from-teal-900/20 dark:via-stone-900/50 dark:to-sky-900/20 rounded-2xl border border-teal-200/60 dark:border-teal-800/40 shadow-bento p-4 sm:p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-sky-500 flex items-center justify-center shadow-sm">
                    <Compass className="w-5 h-5 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-semibold text-teal-800 dark:text-teal-200">
                    {t('dashboard.sidebar.interestProfile')}
                  </h3>
                </div>
                <div className="flex justify-center -mx-2">
                  <DashboardRiasecChart scores={interestProfile.riasecScores} size={200} />
                </div>
                <div className="mt-4 space-y-2">
                  {interestProfile.dominantTypes.slice(0, 3).map((type, i) => (
                    <div key={type.code} className="flex items-center gap-2 p-2 rounded-lg bg-white/60 dark:bg-stone-800/40">
                      <span className="text-base">{['🥇', '🥈', '🥉'][i]}</span>
                      <span className="flex-1 text-sm text-stone-700 dark:text-stone-300">{t(`riasec.${type.code}`)}</span>
                      <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">{type.score}%</span>
                    </div>
                  ))}
                </div>
                {/* Recommended occupations */}
                {interestProfile.recommendedOccupations?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-teal-200/60 dark:border-teal-800/40">
                    <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider mb-2">
                      {t('dashboard.sidebar.suitableJobs')}
                    </p>
                    <div className="space-y-1.5">
                      {interestProfile.recommendedOccupations.slice(0, 3).map((occ, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-stone-600 dark:text-stone-400 truncate">{occ.name}</span>
                          <span className="text-teal-600 dark:text-teal-400 font-semibold ml-2">{occ.matchPercentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <Link
                  to="/interest-guide"
                  className="flex items-center justify-center gap-1.5 mt-4 py-2.5 text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-xl transition-colors"
                >
                  {t('dashboard.sidebar.seeMore')} <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            )}

            {/* Interest guide CTA if no result */}
            {!interestProfile?.hasResult && (
              <Link
                to="/interest-guide"
                className="group block relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50/80 to-white dark:from-amber-900/20 dark:via-orange-900/10 dark:to-stone-900/50 rounded-2xl border border-amber-200/60 dark:border-amber-800/40 shadow-bento p-4 sm:p-5 hover:shadow-bento-hover transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                aria-label={t('dashboard.sidebar.interestGuide.aria')}
              >
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-200/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200 dark:shadow-amber-900/30">
                      <Sparkles className="w-6 h-6 text-white" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-amber-800 dark:text-amber-200">{t('dashboard.sidebar.interestGuide.title')}</h3>
                      <p className="text-sm text-amber-600 dark:text-amber-400">{t('dashboard.sidebar.interestGuide.subtitle')}</p>
                    </div>
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-300/80 mb-3">
                    {t('dashboard.sidebar.interestGuide.description')}
                  </p>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-700 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
                    {t('dashboard.sidebar.interestGuide.startNow')} <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            )}

            {/* My Consultant */}
            {authProfile?.consultant_id && (
              <Link
                to="/my-consultant"
                className="group flex items-center gap-4 bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-sky-900/20 dark:via-stone-900/50 dark:to-indigo-900/20 rounded-2xl border border-sky-200/60 dark:border-sky-800/40 shadow-bento p-4 sm:p-5 hover:shadow-bento-hover transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                aria-label={t('dashboard.sidebar.consultant.aria')}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-200 dark:shadow-sky-900/30 shrink-0 group-hover:scale-105 transition-transform">
                  <UserCheck className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-sky-800 dark:text-sky-200">{t('dashboard.sidebar.consultant.title')}</h3>
                  <p className="text-sm text-sky-600 dark:text-sky-400">{t('dashboard.sidebar.consultant.subtitle')}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-sky-400 dark:text-sky-500 shrink-0 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </Link>
            )}

            {/* Wellness Quick Card */}
            <WellnessQuickCard
              moodToday={dashboardData?.wellness?.moodToday}
              streakDays={dashboardData?.wellness?.streakDays || 0}
            />
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
