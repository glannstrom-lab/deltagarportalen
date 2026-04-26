/**
 * Dashboard Page - Clean Pastel Design
 * White/off-white backgrounds, soft pastel accents, no gradients
 * Simple layout with clear visual hierarchy
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
  Flame, ArrowRight, Heart
} from '@/components/ui/icons'

import { DashboardRiasecChart } from '@/components/dashboard/DashboardRiasecChart'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { OnboardingStep } from '@/components/dashboard/OnboardingStep'
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
  const [showAllSteps, setShowAllSteps] = useState(true)

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

  // Find next incomplete step
  const currentStepIndex = ONBOARDING_STEPS.findIndex(step => !onboardingProgress.progress?.[step.trackKey])
  const nextStep = currentStepIndex >= 0 ? ONBOARDING_STEPS[currentStepIndex] : null

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
        <div className="max-w-5xl mx-auto space-y-6">
          <ConsultantRequestBanner />

          {/* Header - Simple greeting */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-stone-500 dark:text-stone-400">{t(greetingKey)}</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-800 dark:text-stone-100">
                {firstName}
              </h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-stone-500 dark:text-stone-400">Redo för jobb</p>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'w-2 h-2 rounded-full',
                        i < onboardingProgress.completed ? 'bg-teal-500' : 'bg-stone-200 dark:bg-stone-700'
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  {onboardingProgress.completed}/{onboardingProgress.total}
                </span>
              </div>
            </div>
          </div>

          {/* Next Step Banner */}
          {nextStep && progressPercent < 100 && (
            <Link
              to={nextStep.path}
              className="block bg-teal-500 rounded-xl p-5 text-white hover:bg-teal-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
            >
              <p className="text-xs text-teal-100 uppercase tracking-wider font-medium mb-1">
                Ditt nästa steg
              </p>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold">{t(nextStep.titleKey)}</h2>
                  <p className="text-sm text-teal-100">{t(nextStep.descriptionKey)}</p>
                </div>
                <div className="flex items-center gap-2 bg-white text-teal-600 rounded-lg px-4 py-2 text-sm font-semibold shrink-0">
                  Starta <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          )}

          {/* KPI Cards - using semantic domain colors */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={FileText}
              label="CV-progress"
              value={`${dashboardData?.cv?.progress || 0}%`}
              subtext={dashboardData?.cv?.hasCV ? 'Uppdaterat' : 'Ej påbörjat'}
              color="coaching"
              to="/cv"
            />
            <KpiCard
              icon={Bookmark}
              label="Sparade jobb"
              value={dashboardData?.jobs?.savedCount || 0}
              subtext={dashboardData?.jobs?.savedCount ? 'Sparade' : 'Inga än'}
              color="info"
              to="/job-search"
            />
            <KpiCard
              icon={Mail}
              label="Ansökningar"
              value={dashboardData?.applications?.total || 0}
              subtext={dashboardData?.applications?.total ? 'Skickade' : 'Inga än'}
              color="activity"
              to="/applications"
            />
            <KpiCard
              icon={Flame}
              label="Aktivitet"
              value={dashboardData?.activity?.streakDays ? `${dashboardData.activity.streakDays}d` : 'Idag'}
              subtext="Aktiv"
              color="action"
            />
          </div>

          {/* Two column layout */}
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Main column */}
            <div className="lg:col-span-3 space-y-6">
              {/* Onboarding Section */}
              <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <h2 className="font-semibold text-stone-800 dark:text-stone-100">Kom igång</h2>
                  <span className="text-sm text-stone-500 dark:text-stone-400">
                    {onboardingProgress.completed} av {onboardingProgress.total}
                  </span>
                </div>
                <div className="p-4 space-y-1">
                  {ONBOARDING_STEPS.map((step, index) => (
                    <OnboardingStep
                      key={step.id}
                      step={step.step}
                      title={t(step.titleKey)}
                      description={t(step.descriptionKey)}
                      icon={step.icon}
                      isComplete={onboardingProgress.progress?.[step.trackKey] || false}
                      isCurrent={currentStepIndex === index}
                      to={step.path}
                    />
                  ))}
                </div>
              </div>

              {/* Recent Saved Jobs */}
              {dashboardData?.jobs?.recentSavedJobs && dashboardData.jobs.recentSavedJobs.length > 0 && (
                <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-stone-800 dark:text-stone-100">Senast sparade jobb</h3>
                    <Link to="/job-search" className="text-sm text-teal-600 dark:text-teal-400 hover:underline">
                      Visa alla
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {dashboardData.jobs.recentSavedJobs.slice(0, 3).map(job => (
                      <div key={job.id} className="p-3 rounded-lg bg-stone-50 dark:bg-stone-800">
                        <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{job.title}</p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">{job.company}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Interest Profile - coaching domain (purple/lila) */}
              {interestProfile?.hasResult && interestProfile.riasecScores ? (
                <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 p-5">
                  <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-4">
                    Din intresseprofil
                  </h3>
                  <div className="flex justify-center mb-4">
                    <DashboardRiasecChart scores={interestProfile.riasecScores} size={180} />
                  </div>
                  <div className="space-y-2">
                    {interestProfile.dominantTypes.slice(0, 3).map((type, i) => (
                      <div key={type.code} className="flex items-center justify-between text-sm">
                        <span className="text-stone-600 dark:text-stone-400">{t(`riasec.${type.code}`)}</span>
                        <span className="font-medium text-purple-900 dark:text-purple-400">{type.score}%</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    to="/interest-guide"
                    className="flex items-center justify-center gap-1 mt-4 py-2 text-sm text-purple-900 hover:text-purple-700 font-medium"
                  >
                    Se mer <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <Link
                  to="/interest-guide"
                  className="block bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-300 dark:border-purple-800 p-5 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center">
                      <Compass className="w-5 h-5 text-purple-900 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-stone-800 dark:text-stone-100">Hitta dina intressen</h3>
                      <p className="text-sm text-purple-900 dark:text-purple-400">Ta intresseguiden</p>
                    </div>
                  </div>
                  <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">
                    Upptäck vilka yrken som passar din personlighet
                  </p>
                  <span className="text-sm text-purple-900 dark:text-purple-400 font-medium">
                    Starta guiden →
                  </span>
                </Link>
              )}

              {/* Wellness - wellbeing domain (pink/rosa) */}
              <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-pink-50 dark:bg-pink-900/20 rounded-lg flex items-center justify-center">
                    <Heart className="w-5 h-5 text-pink-900 dark:text-pink-400" />
                  </div>
                  <h3 className="font-semibold text-stone-800 dark:text-stone-100">Välmående</h3>
                </div>
                <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">
                  Hur mår du idag?
                </p>
                <Link
                  to="/wellness"
                  className="inline-flex items-center gap-1 text-sm text-pink-900 dark:text-pink-400 hover:text-pink-700 font-medium"
                >
                  Logga ditt mående <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function getGreetingKey() {
  const hour = new Date().getHours()
  if (hour < 10) return 'dashboard.greetings.morning'
  if (hour < 12) return 'dashboard.greetings.lateMorning'
  if (hour < 18) return 'dashboard.greetings.afternoon'
  return 'dashboard.greetings.evening'
}
