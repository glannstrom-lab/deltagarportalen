/**
 * Dashboard Page - Visual overview with real data
 * Features: Hero, KPIs, RIASEC chart, compact onboarding
 */
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ConsultantRequestBanner } from '@/components/consultant/ConsultantRequestBanner'
import { HelpButton } from '@/components/HelpButton'
import { helpContent } from '@/data/helpContent'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useInterestProfile, RIASEC_TYPES } from '@/hooks/useInterestProfile'
import {
  User, Compass, FileText, Search, Mail, ClipboardList,
  ChevronRight, Bookmark, Briefcase, Heart, Sparkles, FileUser,
  UserCheck, Flame, Zap, ArrowRight, Target
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
// ============================================
const ONBOARDING_STEPS = [
  { step: 1, id: 'profile', title: 'Fyll i din profil', description: 'Lägg till kontaktuppgifter', icon: User, path: '/profile', trackKey: 'profile' },
  { step: 2, id: 'interest', title: 'Gör intresseguiden', description: 'Upptäck passande yrken', icon: Compass, path: '/interest-guide', trackKey: 'interest' },
  { step: 3, id: 'cv', title: 'Skapa ditt CV', description: 'Bygg ett proffsigt CV', icon: FileUser, path: '/cv', trackKey: 'cv' },
  { step: 4, id: 'career', title: 'Utforska karriärvägar', description: 'Hitta din riktning', icon: Target, path: '/career', trackKey: 'career' },
  { step: 5, id: 'jobSearch', title: 'Sök efter jobb', description: 'Hitta lediga tjänster', icon: Search, path: '/job-search', trackKey: 'jobSearch' },
  { step: 6, id: 'coverLetter', title: 'Skriv personligt brev', description: 'Skapa övertygande brev', icon: Mail, path: '/cover-letter', trackKey: 'coverLetter' },
  { step: 7, id: 'applications', title: 'Följ dina ansökningar', description: 'Håll koll på status', icon: ClipboardList, path: '/applications', trackKey: 'applications' },
  { step: 8, id: 'interview', title: 'Öva på intervjuer', description: 'Träna med AI-simulatorn', icon: Briefcase, path: '/interview-simulator', trackKey: 'interview' },
]

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================
export default function DashboardPage() {
  const { t } = useTranslation()
  const { profile: authProfile } = useAuthStore()
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError, refetch } = useDashboardData()
  const { profile: interestProfile, isLoading: interestLoading } = useInterestProfile()

  // Calculate onboarding progress
  const getOnboardingProgress = () => {
    if (!dashboardData) return { completed: 0, total: ONBOARDING_STEPS.length, currentStep: 1 }

    let completed = 0
    let currentStep = 1

    // Check each step
    const progress: Record<string, boolean> = {
      profile: authProfile?.first_name ? true : false,
      interest: interestProfile?.hasResult || false,
      cv: dashboardData.cv?.hasCV || false,
      career: false, // Would need career data
      jobSearch: dashboardData.jobs?.savedCount > 0,
      coverLetter: dashboardData.coverLetters?.count > 0,
      applications: dashboardData.applications?.total > 0,
      interview: false, // Would need interview data
    }

    ONBOARDING_STEPS.forEach((step, i) => {
      if (progress[step.trackKey]) {
        completed++
      } else if (currentStep === 1 || (i > 0 && progress[ONBOARDING_STEPS[i-1].trackKey])) {
        currentStep = step.step
      }
    })

    return { completed, total: ONBOARDING_STEPS.length, currentStep, progress }
  }

  const onboardingProgress = getOnboardingProgress()
  // Fix: Prevent division by zero
  const progressPercent = Math.round((onboardingProgress.completed / (onboardingProgress.total || 1)) * 100)

  // Find first incomplete step for current step indicator
  const currentStepIndex = ONBOARDING_STEPS.findIndex(
    step => !onboardingProgress.progress?.[step.trackKey]
  )

  if (dashboardLoading || interestLoading) {
    return <DashboardSkeleton />
  }

  // Show error state if data failed to load
  if (dashboardError) {
    return <DashboardError error={dashboardError} onRetry={refetch} />
  }

  const firstName = authProfile?.first_name || 'Välkommen'
  const greeting = getGreeting()

  return (
    <div className="page-transition pb-8">
      <div className="max-w-5xl mx-auto">
        <ConsultantRequestBanner />

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-teal-50 via-white to-sky-50 dark:from-teal-900/20 dark:via-stone-900 dark:to-sky-900/20 rounded-2xl border border-teal-200 dark:border-teal-800/50 mb-4 sm:mb-6 overflow-hidden">
          <div className="px-4 py-4 sm:px-5 sm:py-5">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-teal-400 to-sky-400 dark:from-teal-500 dark:to-sky-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                <User className="w-6 h-6 sm:w-7 sm:h-7 text-white" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-teal-600 dark:text-teal-400 font-medium">{greeting}</p>
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
                  aria-label={`Jobbredo: ${progressPercent}% klart, ${onboardingProgress.completed} av ${onboardingProgress.total} steg avklarade`}
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
                  <p className="text-xs text-stone-500 dark:text-stone-400">Redo för jobb</p>
                  <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">
                    {onboardingProgress.completed}/{onboardingProgress.total} klart
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <KpiCard
            icon={FileText}
            label="CV-progress"
            value={`${dashboardData?.cv?.progress || 0}%`}
            subtext={dashboardData?.cv?.hasCV ? 'Uppdaterat' : 'Inte påbörjat'}
            color="teal"
            to="/cv"
          />
          <KpiCard
            icon={Bookmark}
            label="Sparade jobb"
            value={dashboardData?.jobs?.savedCount || 0}
            subtext={dashboardData?.jobs?.newMatches ? `${dashboardData.jobs.newMatches} nya` : undefined}
            color="sky"
            to="/job-search"
          />
          <KpiCard
            icon={ClipboardList}
            label="Ansökningar"
            value={dashboardData?.applications?.total || 0}
            subtext={dashboardData?.applications?.statusBreakdown?.interview ? `${dashboardData.applications.statusBreakdown.interview} intervjuer` : undefined}
            color="amber"
            to="/applications"
          />
          <KpiCard
            icon={Flame}
            label="Aktivitet"
            value={`${dashboardData?.activity?.streakDays || 0}d`}
            subtext="Daglig streak"
            color="emerald"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main content - 2/3 width */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {/* Onboarding Section */}
            <DashboardSection
              title="Kom igång"
              icon={Zap}
              badge={`${onboardingProgress.completed}/${onboardingProgress.total}`}
              colorScheme="teal"
              defaultExpanded={progressPercent < 100}
            >
              <div className="grid sm:grid-cols-2 gap-2">
                {ONBOARDING_STEPS.map((step, i) => (
                  <OnboardingStep
                    key={step.id}
                    step={step.step}
                    title={step.title}
                    description={step.description}
                    icon={step.icon}
                    isComplete={onboardingProgress.progress?.[step.trackKey] || false}
                    isCurrent={currentStepIndex === i}
                    to={step.path}
                  />
                ))}
              </div>
            </DashboardSection>

          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-3 sm:space-y-4">
            {/* RIASEC Profile */}
            {interestProfile?.hasResult && interestProfile.riasecScores && (
              <div className="bg-gradient-to-br from-teal-50 to-sky-50 dark:from-teal-900/20 dark:to-sky-900/20 rounded-2xl border border-teal-200 dark:border-teal-800/50 p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                  <h3 className="text-sm sm:text-base font-semibold text-teal-800 dark:text-teal-300">Din intresseprofil</h3>
                </div>
                <div className="flex justify-center">
                  <DashboardRiasecChart scores={interestProfile.riasecScores} size={160} />
                </div>
                <div className="mt-2 sm:mt-3 space-y-1 sm:space-y-1.5">
                  {interestProfile.dominantTypes.slice(0, 3).map((type, i) => {
                    const rt = RIASEC_TYPES[type.code]
                    return (
                      <div key={type.code} className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-xs sm:text-sm">{['🥇', '🥈', '🥉'][i]}</span>
                        <span className="flex-1 text-xs sm:text-sm text-stone-700 dark:text-stone-300">{rt.nameSv}</span>
                        <span className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400">{type.score}%</span>
                      </div>
                    )
                  })}
                </div>
                {/* Recommended occupations */}
                {interestProfile.recommendedOccupations?.length > 0 && (
                  <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-teal-200 dark:border-teal-800/50">
                    <p className="text-[10px] sm:text-xs font-medium text-teal-700 dark:text-teal-400 mb-1.5 sm:mb-2">Passande yrken:</p>
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
                  Se mer <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                </Link>
              </div>
            )}

            {/* Interest guide CTA if no result */}
            {!interestProfile?.hasResult && (
              <Link
                to="/interest-guide"
                className="block bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200 dark:border-amber-800/50 p-3 sm:p-4 hover:shadow-lg transition-shadow group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                aria-label="Upptäck dina styrkor - Gör intresseguiden"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-400 to-orange-400 dark:from-amber-500 dark:to-orange-500 rounded-xl flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-amber-800 dark:text-amber-300 truncate">Upptäck dina styrkor</h3>
                    <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400">Gör intresseguiden</p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300/80">
                  Svara på frågor och få personliga jobbförslag baserat på dina intressen.
                </p>
                <div className="flex items-center gap-1 mt-2 sm:mt-3 text-xs sm:text-sm font-medium text-amber-700 dark:text-amber-400 group-hover:translate-x-1 transition-transform" aria-hidden="true">
                  Starta nu <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </Link>
            )}

            {/* My Consultant (if has consultant) */}
            {authProfile?.consultant_id && (
              <Link
                to="/my-consultant"
                className="block bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-900/20 dark:to-indigo-900/20 rounded-2xl border border-sky-200 dark:border-sky-800/50 p-3 sm:p-4 hover:shadow-lg transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                aria-label="Min konsulent - Kommunicera och följ upp"
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-sky-400 to-indigo-400 dark:from-sky-500 dark:to-indigo-500 rounded-xl flex items-center justify-center shrink-0">
                    <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-semibold text-sky-800 dark:text-sky-300">Min konsulent</h3>
                    <p className="text-xs sm:text-sm text-sky-600 dark:text-sky-400">Kommunicera och följ upp</p>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400 dark:text-sky-500 shrink-0" aria-hidden="true" />
                </div>
              </Link>
            )}

            {/* Recent saved jobs */}
            {dashboardData?.jobs?.recentSavedJobs && dashboardData.jobs.recentSavedJobs.length > 0 && (
              <div className="bg-white dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-700 p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h3 className="text-sm sm:text-base font-semibold text-stone-800 dark:text-stone-200">Sparade jobb</h3>
                  <Link to="/job-search" className="text-[10px] sm:text-xs text-teal-600 dark:text-teal-400 hover:underline">
                    Visa alla
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
                  <h3 className="text-sm sm:text-base font-semibold text-stone-800 dark:text-stone-200">Välmående</h3>
                </div>
                {dashboardData.wellness.moodToday ? (
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                    Dagens mående: <span className="font-medium">{getMoodEmoji(dashboardData.wellness.moodToday)}</span>
                  </p>
                ) : (
                  <Link
                    to="/wellness"
                    className="text-xs sm:text-sm text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    Logga ditt mående idag →
                  </Link>
                )}
                {dashboardData.wellness.streakDays > 0 && (
                  <p className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 mt-1">
                    🔥 {dashboardData.wellness.streakDays} dagars streak
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <HelpButton content={helpContent.dashboard} />
    </div>
  )
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 10) return 'God morgon'
  if (hour < 12) return 'God förmiddag'
  if (hour < 18) return 'God eftermiddag'
  return 'God kväll'
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
