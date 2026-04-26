/**
 * Dashboard Page - Clean, minimal design
 * Single accent color (#0F6E56), neutral KPI cards
 * Only "Next Step" banner has colored background
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
  ChevronRight, ChevronDown, Bookmark, FileUser,
  Flame, ArrowRight
} from '@/components/ui/icons'

import { DashboardRiasecChart } from '@/components/dashboard/DashboardRiasecChart'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { OnboardingStep } from '@/components/dashboard/OnboardingStep'
import { DashboardSection } from '@/components/dashboard/DashboardSection'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'
import { DashboardError } from '@/components/dashboard/DashboardError'

// Onboarding steps
const ONBOARDING_STEPS = [
  { step: 1, id: 'profile', titleKey: 'dashboard.onboarding.steps.profile.title', descriptionKey: 'dashboard.onboarding.steps.profile.description', icon: User, path: '/profile', trackKey: 'profile' },
  { step: 2, id: 'interest', titleKey: 'dashboard.onboarding.steps.interest.title', descriptionKey: 'dashboard.onboarding.steps.interest.description', icon: Compass, path: '/interest-guide', trackKey: 'interest' },
  { step: 3, id: 'cv', titleKey: 'dashboard.onboarding.steps.cv.title', descriptionKey: 'dashboard.onboarding.steps.cv.description', icon: FileUser, path: '/cv', trackKey: 'cv' },
  { step: 4, id: 'coverLetter', titleKey: 'dashboard.onboarding.steps.coverLetter.title', descriptionKey: 'dashboard.onboarding.steps.coverLetter.description', icon: Mail, path: '/cover-letter', trackKey: 'coverLetter' },
  { step: 5, id: 'jobSearch', titleKey: 'dashboard.onboarding.steps.jobSearch.title', descriptionKey: 'dashboard.onboarding.steps.jobSearch.description', icon: Search, path: '/job-search', trackKey: 'jobSearch' },
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
      coverLetter: dashboardData.coverLetters?.count > 0,
      jobSearch: dashboardData.jobs?.savedCount > 0,
    }

    const completed = Object.values(progress).filter(Boolean).length
    return { completed, total: ONBOARDING_STEPS.length, progress }
  }, [dashboardData, authProfile?.first_name, interestProfile?.hasResult])

  const progressPercent = Math.round((onboardingProgress.completed / onboardingProgress.total) * 100)

  // Find next incomplete step
  const nextStep = ONBOARDING_STEPS.find(step => !onboardingProgress.progress?.[step.trackKey])

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
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-brand-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
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
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
                {firstName}
              </h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-stone-500 dark:text-stone-400">Redo för jobb</p>
              <p className="text-lg font-semibold text-brand-600">
                {progressPercent}% · {onboardingProgress.completed} av {onboardingProgress.total} klart
              </p>
            </div>
          </div>

          {/* Next Step Banner - THE ONLY colored element - always show if not 100% */}
          {nextStep && (
            <Link
              to={nextStep.path}
              className="block bg-brand-600 rounded-xl p-5 sm:p-6 text-white hover:bg-brand-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              <p className="text-xs text-white/70 uppercase tracking-wider font-medium mb-1">
                Ditt nästa steg
              </p>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold">{t(nextStep.titleKey)}</h2>
                  <p className="text-sm text-white/70 truncate">{t(nextStep.descriptionKey)}</p>
                </div>
                <div className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors rounded-lg px-4 py-2 text-sm font-medium shrink-0">
                  Starta <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          )}

          {/* KPI Cards - Neutral white backgrounds */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={FileText}
              label="CV-progress"
              value={`${dashboardData?.cv?.progress || 0}%`}
              subtext={dashboardData?.cv?.hasCV ? 'Uppdaterat' : 'Inga ännu'}
              status={dashboardData?.cv?.hasCV ? 'updated' : 'pending'}
              to="/cv"
            />
            <KpiCard
              icon={Bookmark}
              label="Sparade jobb"
              value={dashboardData?.jobs?.savedCount || 0}
              subtext={dashboardData?.jobs?.savedCount ? 'Sparade' : 'Inga än'}
              status={dashboardData?.jobs?.savedCount ? 'active' : 'pending'}
              to="/job-search"
            />
            <KpiCard
              icon={Mail}
              label="Ansökningar"
              value={dashboardData?.applications?.total || 0}
              subtext={dashboardData?.applications?.total ? 'Skickade' : 'Inga än'}
              status={dashboardData?.applications?.total ? 'active' : 'pending'}
              to="/applications"
            />
            <KpiCard
              icon={Flame}
              label="Senaste aktivitet"
              value={dashboardData?.activity?.streakDays ? `${dashboardData.activity.streakDays}d` : 'Idag'}
              subtext="Aktiv"
              status="active"
            />
          </div>

          {/* Two column layout */}
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Main column */}
            <div className="lg:col-span-3">
              <DashboardSection
                title="Kom igång"
                badge={`${onboardingProgress.completed} av ${onboardingProgress.total}`}
                progress={progressPercent}
              >
                <div className="space-y-0">
                  {(showAllSteps ? ONBOARDING_STEPS : ONBOARDING_STEPS.slice(0, 3)).map((step, index) => (
                    <OnboardingStep
                      key={step.id}
                      step={step.step}
                      title={t(step.titleKey)}
                      description={t(step.descriptionKey)}
                      icon={step.icon}
                      isComplete={onboardingProgress.progress?.[step.trackKey] || false}
                      isCurrent={!onboardingProgress.progress?.[step.trackKey] &&
                        ONBOARDING_STEPS.slice(0, index).every(s => onboardingProgress.progress?.[s.trackKey])}
                      to={step.path}
                    />
                  ))}
                </div>

                {!showAllSteps && ONBOARDING_STEPS.length > 3 && (
                  <button
                    onClick={() => setShowAllSteps(true)}
                    className="mt-3 flex items-center justify-center gap-1 w-full py-2 text-sm text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                    Visa alla steg
                  </button>
                )}
              </DashboardSection>
            </div>

            {/* Sidebar column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Interest Profile */}
              {interestProfile?.hasResult && interestProfile.riasecScores ? (
                <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 p-5">
                  <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-4">
                    Din intresseprofil
                  </h3>
                  <div className="flex justify-center mb-4">
                    <DashboardRiasecChart scores={interestProfile.riasecScores} size={180} />
                  </div>
                  <div className="space-y-2">
                    {interestProfile.dominantTypes.slice(0, 2).map((type) => (
                      <div key={type.code} className="flex items-center justify-between text-sm">
                        <span className="text-stone-600 dark:text-stone-400">{t(`riasec.${type.code}`)}</span>
                        <span className="font-medium text-stone-900 dark:text-stone-100">{type.score}%</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    to="/interest-guide"
                    className="flex items-center justify-center gap-1 mt-4 py-2 text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
                  >
                    Visa mer <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <Link
                  to="/interest-guide"
                  className="block bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 p-5 hover:border-brand-600 transition-colors group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center">
                      <Compass className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-stone-900 dark:text-stone-100">Hitta dina intressen</h3>
                      <p className="text-sm text-stone-500">Ta intresseguiden</p>
                    </div>
                  </div>
                  <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">
                    Upptäck vilka yrken som passar din personlighet
                  </p>
                  <span className="text-sm text-brand-600 font-medium group-hover:underline">
                    Starta guiden →
                  </span>
                </Link>
              )}

              {/* Wellness - simplified */}
              <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 p-5">
                <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-3">
                  Välmående
                </h3>
                <Link
                  to="/wellness"
                  className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                >
                  Logga ditt mående idag →
                </Link>
              </div>
            </div>
          </div>
        </div>
        <HelpButton content={helpContent.dashboard} />
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
