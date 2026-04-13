/**
 * Dashboard Page - Clean Visual Design
 * Focus on clarity, visual hierarchy, and breathing room
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ConsultantRequestBanner } from '@/components/consultant/ConsultantRequestBanner'
import { HelpButton } from '@/components/HelpButton'
import { helpContent } from '@/data/helpContent'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useInterestProfile, RIASEC_TYPES, type RiasecScores } from '@/hooks/useInterestProfile'
import {
  User, Compass, FileText, Search, Mail, Building2, ClipboardList,
  Check, ChevronRight, Loader2, Target, GraduationCap,
  TrendingUp, Linkedin, BookOpen, Dumbbell, Calendar, NotebookPen,
  Smile, Briefcase, Sparkles, FileUser, UserCheck, Flame, ArrowRight, Mic
} from '@/components/ui/icons'

// ============================================
// RIASEC VISUAL CHART
// ============================================
function RiasecVisual({ scores }: { scores: RiasecScores }) {
  const keys: (keyof RiasecScores)[] = ['realistic', 'investigative', 'artistic', 'social', 'enterprising', 'conventional']
  const labels = ['R', 'I', 'A', 'S', 'E', 'C']
  const names = ['Realistisk', 'Undersökande', 'Konstnärlig', 'Social', 'Företagsam', 'Konventionell']
  const colors = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#6366f1']

  const maxScore = Math.max(...keys.map(k => scores[k]), 1)
  const sorted = keys.map((k, i) => ({ key: k, score: scores[k], label: labels[i], name: names[i], color: colors[i] }))
    .sort((a, b) => b.score - a.score)

  return (
    <div className="space-y-3">
      {sorted.slice(0, 3).map((item, i) => (
        <div key={item.key} className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md"
            style={{ backgroundColor: item.color }}
          >
            {item.label}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{item.name}</span>
              <span className="text-xs text-stone-500 dark:text-stone-400">{Math.round(item.score)}%</span>
            </div>
            <div className="h-2 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(item.score / maxScore) * 100}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================
// PROGRESS RING
// ============================================
function ProgressRing({ percent, size = 120 }: { percent: number; size?: number }) {
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-stone-100 dark:stroke-stone-700"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-teal-500 dark:stroke-teal-400"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-teal-600 dark:text-teal-400">{percent}%</span>
        <span className="text-xs text-stone-500 dark:text-stone-400">klart</span>
      </div>
    </div>
  )
}

// ============================================
// STEP INDICATOR
// ============================================
function StepIndicator({
  steps,
  currentStep,
  completedSteps
}: {
  steps: { id: string; label: string; path: string; icon: React.ElementType }[]
  currentStep: number
  completedSteps: Set<string>
}) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, i) => {
        const isComplete = completedSteps.has(step.id)
        const isCurrent = i === currentStep
        const Icon = step.icon

        return (
          <Link
            key={step.id}
            to={step.path}
            className="flex flex-col items-center group"
          >
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center transition-all',
              isComplete
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : isCurrent
                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30 ring-4 ring-teal-500/20'
                : 'bg-stone-100 dark:bg-stone-700 text-stone-400 dark:text-stone-500 group-hover:bg-stone-200 dark:group-hover:bg-stone-600'
            )}>
              {isComplete ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
            </div>
            <span className={cn(
              'text-xs mt-2 font-medium text-center',
              isComplete
                ? 'text-emerald-600 dark:text-emerald-400'
                : isCurrent
                ? 'text-teal-600 dark:text-teal-400'
                : 'text-stone-400 dark:text-stone-500'
            )}>
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <div className={cn(
                'absolute h-0.5 w-[calc(100%/7-1rem)] top-6 left-[calc(50%+1.5rem)]',
                isComplete ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-stone-200 dark:bg-stone-700'
              )} style={{ display: 'none' }} />
            )}
          </Link>
        )
      })}
    </div>
  )
}

// ============================================
// FEATURE CARD
// ============================================
function FeatureCard({
  icon: Icon,
  title,
  description,
  to,
  color = 'teal',
  badge
}: {
  icon: React.ElementType
  title: string
  description: string
  to: string
  color?: 'teal' | 'sky' | 'amber' | 'rose' | 'violet'
  badge?: string
}) {
  const colorClasses = {
    teal: 'from-teal-500 to-teal-600 shadow-teal-500/20',
    sky: 'from-sky-500 to-sky-600 shadow-sky-500/20',
    amber: 'from-amber-500 to-amber-600 shadow-amber-500/20',
    rose: 'from-rose-500 to-rose-600 shadow-rose-500/20',
    violet: 'from-violet-500 to-violet-600 shadow-violet-500/20',
  }

  return (
    <Link
      to={to}
      className="group relative bg-white dark:bg-stone-800 rounded-2xl p-5 border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 hover:shadow-xl transition-all duration-300"
    >
      {badge && (
        <span className="absolute top-3 right-3 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold rounded-full uppercase">
          {badge}
        </span>
      )}
      <div className={cn(
        'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg',
        colorClasses[color]
      )}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-stone-500 dark:text-stone-400">{description}</p>
      <ArrowRight className="absolute bottom-5 right-5 w-5 h-5 text-stone-300 dark:text-stone-600 group-hover:text-teal-500 dark:group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
    </Link>
  )
}

// ============================================
// STAT CARD
// ============================================
function StatCard({
  icon: Icon,
  value,
  label,
  color = 'teal',
  to
}: {
  icon: React.ElementType
  value: string | number
  label: string
  color?: 'teal' | 'sky' | 'amber' | 'emerald'
  to?: string
}) {
  const colorClasses = {
    teal: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30',
    sky: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30',
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30',
  }

  const content = (
    <div className={cn(
      'rounded-2xl p-5 text-center transition-all',
      colorClasses[color],
      to && 'hover:scale-105 cursor-pointer'
    )}>
      <Icon className="w-8 h-8 mx-auto mb-2 opacity-80" />
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-sm opacity-70">{label}</p>
    </div>
  )

  return to ? <Link to={to}>{content}</Link> : content
}

// ============================================
// ONBOARDING STEPS
// ============================================
const JOURNEY_STEPS = [
  { id: 'profile', label: 'Profil', path: '/profile', icon: User },
  { id: 'interest', label: 'Intressen', path: '/interest-guide', icon: Compass },
  { id: 'cv', label: 'CV', path: '/cv', icon: FileUser },
  { id: 'jobSearch', label: 'Jobb', path: '/job-search', icon: Search },
  { id: 'coverLetter', label: 'Brev', path: '/cover-letter', icon: Mail },
  { id: 'applications', label: 'Ansökningar', path: '/applications', icon: ClipboardList },
  { id: 'interview', label: 'Intervju', path: '/interview-simulator', icon: Mic },
]

// ============================================
// MAIN DASHBOARD
// ============================================
export default function DashboardPage() {
  const { t } = useTranslation()
  const { profile: authProfile } = useAuthStore()
  const { data: dashboardData, loading: dashboardLoading } = useDashboardData()
  const { profile: interestProfile, isLoading: interestLoading } = useInterestProfile()

  // Calculate progress
  const completedSteps = new Set<string>()
  if (authProfile?.first_name) completedSteps.add('profile')
  if (interestProfile?.hasResult) completedSteps.add('interest')
  if (dashboardData?.cv?.hasCV) completedSteps.add('cv')
  if (dashboardData?.jobs?.savedCount > 0) completedSteps.add('jobSearch')
  if (dashboardData?.coverLetters?.count > 0) completedSteps.add('coverLetter')
  if (dashboardData?.applications?.total > 0) completedSteps.add('applications')

  const currentStepIndex = JOURNEY_STEPS.findIndex(s => !completedSteps.has(s.id))
  const progressPercent = Math.round((completedSteps.size / JOURNEY_STEPS.length) * 100)

  if (dashboardLoading || interestLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-teal-500 dark:text-teal-400 animate-spin mx-auto mb-4" />
          <p className="text-stone-500 dark:text-stone-400">Laddar din översikt...</p>
        </div>
      </div>
    )
  }

  const firstName = authProfile?.first_name || 'du'
  const greeting = getGreeting()

  return (
    <div className="page-transition pb-12">
      <div className="max-w-6xl mx-auto">
        <ConsultantRequestBanner />

        {/* HERO SECTION */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 via-teal-600 to-sky-600 dark:from-teal-600 dark:via-teal-700 dark:to-sky-700 p-8 md:p-10 mb-8 text-white">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

          <div className="relative flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-left">
              <p className="text-teal-100 dark:text-teal-200 text-sm font-medium mb-2">{greeting}</p>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                Välkommen, {firstName}!
              </h1>
              <p className="text-teal-100 dark:text-teal-200 text-lg mb-6 max-w-md">
                {progressPercent < 100
                  ? `Du har kommit ${progressPercent}% på vägen mot ditt nästa jobb. Fortsätt så!`
                  : 'Fantastiskt! Du har slutfört alla steg. Nu är det dags att söka jobb!'}
              </p>
              <Link
                to={JOURNEY_STEPS[currentStepIndex]?.path || '/job-search'}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-teal-600 font-semibold rounded-xl hover:bg-teal-50 transition-colors shadow-lg shadow-black/10"
              >
                {progressPercent < 100 ? 'Fortsätt din resa' : 'Sök jobb nu'}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="shrink-0">
              <ProgressRing percent={progressPercent} size={140} />
            </div>
          </div>
        </div>

        {/* JOURNEY STEPS */}
        <div className="bg-white dark:bg-stone-800 rounded-3xl p-6 md:p-8 mb-8 border border-stone-200 dark:border-stone-700 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-6 text-center">Din resa mot nytt jobb</h2>
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[600px]">
              <StepIndicator
                steps={JOURNEY_STEPS}
                currentStep={currentStepIndex >= 0 ? currentStepIndex : JOURNEY_STEPS.length - 1}
                completedSteps={completedSteps}
              />
            </div>
          </div>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={FileText}
            value={`${dashboardData?.cv?.progress || 0}%`}
            label="CV-progress"
            color="teal"
            to="/cv"
          />
          <StatCard
            icon={Briefcase}
            value={dashboardData?.jobs?.savedCount || 0}
            label="Sparade jobb"
            color="sky"
            to="/job-search"
          />
          <StatCard
            icon={ClipboardList}
            value={dashboardData?.applications?.total || 0}
            label="Ansökningar"
            color="amber"
            to="/applications"
          />
          <StatCard
            icon={Flame}
            value={`${dashboardData?.activity?.streakDays || 0}d`}
            label="Aktivitets-streak"
            color="emerald"
          />
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Interest Profile Card */}
          {interestProfile?.hasResult && interestProfile.riasecScores ? (
            <div className="bg-white dark:bg-stone-800 rounded-3xl p-6 border border-stone-200 dark:border-stone-700 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <Compass className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-stone-800 dark:text-stone-200">Din intresseprofil</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Baserat på RIASEC-modellen</p>
                </div>
              </div>
              <RiasecVisual scores={interestProfile.riasecScores} />
              <Link
                to="/interest-guide"
                className="flex items-center justify-center gap-1 mt-5 text-sm text-violet-600 dark:text-violet-400 hover:underline font-medium"
              >
                Se fullständig profil <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <Link
              to="/interest-guide"
              className="group bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-3xl p-6 border border-amber-200 dark:border-amber-800/50 hover:shadow-xl transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-amber-800 dark:text-amber-300 mb-2">Upptäck dina styrkor</h3>
              <p className="text-amber-700 dark:text-amber-400/80 mb-4">
                Gör vår intresseguide och få personliga jobbförslag baserat på dina intressen och talanger.
              </p>
              <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold group-hover:gap-2 transition-all">
                Starta guiden <ArrowRight className="w-5 h-5" />
              </span>
            </Link>
          )}

          {/* Quick Actions */}
          <div className="bg-white dark:bg-stone-800 rounded-3xl p-6 border border-stone-200 dark:border-stone-700 shadow-sm">
            <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-5">Snabbåtgärder</h3>
            <div className="space-y-3">
              {[
                { icon: Search, label: 'Sök efter jobb', path: '/job-search', color: 'bg-teal-500' },
                { icon: FileUser, label: 'Redigera ditt CV', path: '/cv', color: 'bg-sky-500' },
                { icon: Mail, label: 'Skriv personligt brev', path: '/cover-letter', color: 'bg-violet-500' },
                { icon: Building2, label: 'Spontanansökan', path: '/spontanansökan', color: 'bg-amber-500' },
              ].map(action => (
                <Link
                  key={action.path}
                  to={action.path}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors group"
                >
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-white', action.color)}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="flex-1 font-medium text-stone-700 dark:text-stone-300">{action.label}</span>
                  <ChevronRight className="w-5 h-5 text-stone-300 dark:text-stone-600 group-hover:translate-x-1 transition-transform" />
                </Link>
              ))}
            </div>
          </div>

          {/* Consultant Card */}
          {authProfile?.consultant_id ? (
            <Link
              to="/my-consultant"
              className="group bg-gradient-to-br from-sky-50 to-indigo-100 dark:from-sky-900/30 dark:to-indigo-900/30 rounded-3xl p-6 border border-sky-200 dark:border-sky-800/50 hover:shadow-xl transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                <UserCheck className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-sky-800 dark:text-sky-300 mb-2">Min konsulent</h3>
              <p className="text-sky-700 dark:text-sky-400/80 mb-4">
                Kommunicera med din konsulent och följ upp dina mål tillsammans.
              </p>
              <span className="inline-flex items-center gap-1 text-sky-700 dark:text-sky-400 font-semibold group-hover:gap-2 transition-all">
                Öppna <ArrowRight className="w-5 h-5" />
              </span>
            </Link>
          ) : (
            <div className="bg-white dark:bg-stone-800 rounded-3xl p-6 border border-stone-200 dark:border-stone-700 shadow-sm">
              <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-5">Välmående</h3>
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-500/20">
                  <Smile className="w-8 h-8 text-white" />
                </div>
                {dashboardData?.wellness?.moodToday ? (
                  <p className="text-stone-600 dark:text-stone-400">
                    Dagens mående: <span className="text-2xl">{getMoodEmoji(dashboardData.wellness.moodToday)}</span>
                  </p>
                ) : (
                  <p className="text-stone-500 dark:text-stone-400 mb-3">Hur mår du idag?</p>
                )}
                <Link
                  to="/wellness"
                  className="inline-flex items-center gap-1 text-sm text-rose-600 dark:text-rose-400 font-medium hover:underline"
                >
                  {dashboardData?.wellness?.moodToday ? 'Se historik' : 'Logga ditt mående'} <ChevronRight className="w-4 h-4" />
                </Link>
                {dashboardData?.wellness?.streakDays > 0 && (
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-2">
                    🔥 {dashboardData.wellness.streakDays} dagars streak
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* FEATURE CARDS */}
        <h2 className="text-xl font-bold text-stone-800 dark:text-stone-200 mb-5">Utforska fler verktyg</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FeatureCard
            icon={Target}
            title="Karriärplanering"
            description="Utforska olika karriärvägar"
            to="/career"
            color="teal"
          />
          <FeatureCard
            icon={GraduationCap}
            title="Utbildning"
            description="Hitta kurser och utbildningar"
            to="/education"
            color="sky"
            badge="Ny"
          />
          <FeatureCard
            icon={Linkedin}
            title="LinkedIn"
            description="Optimera din profil"
            to="/linkedin-optimizer"
            color="violet"
          />
          <FeatureCard
            icon={TrendingUp}
            title="Kompetensanalys"
            description="Identifiera dina styrkor"
            to="/skills-gap-analysis"
            color="amber"
          />
          <FeatureCard
            icon={Mic}
            title="Intervjuträning"
            description="Öva med AI-simulatorn"
            to="/interview-simulator"
            color="rose"
          />
          <FeatureCard
            icon={BookOpen}
            title="Kunskapsbank"
            description="Artiklar och guider"
            to="/knowledge-base"
            color="teal"
          />
          <FeatureCard
            icon={Calendar}
            title="Kalender"
            description="Planera dina aktiviteter"
            to="/calendar"
            color="sky"
          />
          <FeatureCard
            icon={NotebookPen}
            title="Dagbok"
            description="Reflektera och dokumentera"
            to="/diary"
            color="amber"
          />
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
    '1': '😢', '2': '😕', '3': '😐', '4': '🙂', '5': '😊',
    'terrible': '😢', 'bad': '😕', 'okay': '😐', 'good': '🙂', 'great': '😊',
  }
  return moodMap[String(mood)] || '😐'
}
