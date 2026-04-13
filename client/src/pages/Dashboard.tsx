/**
 * Dashboard Page - Visual overview with real data
 * Features: Hero, KPIs, RIASEC chart, compact onboarding, quick actions
 */
import { useState, useEffect } from 'react'
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
  Check, ChevronDown, ChevronRight, Loader2, Target, GraduationCap, Star,
  TrendingUp, Linkedin, BookOpen, Dumbbell, Calendar, NotebookPen,
  Smile, Globe, Bookmark, Briefcase, Heart, Sparkles, FileUser,
  UserCheck, Award, Flame, Zap, Clock, ArrowRight
} from '@/components/ui/icons'

// ============================================
// RIASEC RADAR CHART COMPONENT (inline for dashboard)
// ============================================
function DashboardRiasecChart({ scores, size = 200 }: { scores: RiasecScores; size?: number }) {
  const center = size / 2
  const radius = (size / 2) - 30
  const keys: (keyof RiasecScores)[] = ['realistic', 'investigative', 'artistic', 'social', 'enterprising', 'conventional']
  const shortKeys = ['R', 'I', 'A', 'S', 'E', 'C']

  // Find max score to normalize
  const maxScore = Math.max(...keys.map(k => scores[k]), 1)

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2
    const r = (value / maxScore) * radius
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    }
  }

  const polygonPoints = keys.map((key, i) => {
    const point = getPoint(i, scores[key])
    return `${point.x},${point.y}`
  }).join(' ')

  const levelCircles = [0.25, 0.5, 0.75, 1].map((level, i) => (
    <circle
      key={i}
      cx={center}
      cy={center}
      r={level * radius}
      fill="none"
      className="stroke-stone-200 dark:stroke-stone-700"
      strokeWidth="1"
      strokeDasharray="3 3"
    />
  ))

  const axes = keys.map((_, i) => {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
    const endX = center + radius * Math.cos(angle)
    const endY = center + radius * Math.sin(angle)
    return (
      <line
        key={i}
        x1={center}
        y1={center}
        x2={endX}
        y2={endY}
        className="stroke-stone-200 dark:stroke-stone-700"
        strokeWidth="1"
      />
    )
  })

  const colors: Record<keyof RiasecScores, string> = {
    realistic: '#f59e0b',
    investigative: '#3b82f6',
    artistic: '#8b5cf6',
    social: '#10b981',
    enterprising: '#ef4444',
    conventional: '#6366f1'
  }

  const labels = keys.map((key, i) => {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
    const labelRadius = radius + 18
    const x = center + labelRadius * Math.cos(angle)
    const y = center + labelRadius * Math.sin(angle)

    return (
      <g key={key}>
        <circle
          cx={x}
          cy={y}
          r="12"
          fill={colors[key]}
        />
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-white text-[10px] font-bold"
        >
          {shortKeys[i]}
        </text>
      </g>
    )
  })

  return (
    <svg width={size} height={size} className="mx-auto">
      <defs>
        <linearGradient id="riasecGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {levelCircles}
      {axes}
      <polygon
        points={polygonPoints}
        fill="url(#riasecGrad)"
        stroke="#14b8a6"
        strokeWidth="2"
      />
      {keys.map((key, i) => {
        const point = getPoint(i, scores[key])
        return (
          <circle
            key={key}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="white"
            stroke={colors[key]}
            strokeWidth="2"
          />
        )
      })}
      {labels}
    </svg>
  )
}

// ============================================
// KPI CARD COMPONENT
// ============================================
function KpiCard({
  icon: Icon,
  label,
  value,
  subtext,
  color = 'teal',
  to
}: {
  icon: React.ElementType
  label: string
  value: string | number
  subtext?: string
  color?: 'teal' | 'sky' | 'amber' | 'emerald' | 'rose'
  to?: string
}) {
  const colorClasses = {
    teal: 'from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700',
    sky: 'from-sky-500 to-sky-600 dark:from-sky-600 dark:to-sky-700',
    amber: 'from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700',
    emerald: 'from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700',
    rose: 'from-rose-500 to-rose-600 dark:from-rose-600 dark:to-rose-700',
  }

  const content = (
    <div className={cn(
      'relative overflow-hidden rounded-xl p-3 sm:p-4 bg-gradient-to-br text-white shadow-lg',
      colorClasses[color],
      to && 'hover:scale-[1.02] transition-transform cursor-pointer'
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-white/80 text-[10px] sm:text-xs font-medium mb-0.5 sm:mb-1 truncate">{label}</p>
          <p className="text-xl sm:text-2xl font-bold">{value}</p>
          {subtext && <p className="text-white/70 text-[10px] sm:text-xs mt-0.5 sm:mt-1 truncate">{subtext}</p>}
        </div>
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      </div>
    </div>
  )

  return to ? <Link to={to}>{content}</Link> : content
}

// ============================================
// ONBOARDING STEP COMPONENT (compact)
// ============================================
function OnboardingStep({
  step,
  title,
  description,
  icon: Icon,
  isComplete,
  isCurrent,
  to
}: {
  step: number
  title: string
  description: string
  icon: React.ElementType
  isComplete: boolean
  isCurrent: boolean
  to: string
}) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl border transition-all group',
        isComplete
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50'
          : isCurrent
          ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-300 dark:border-teal-700 ring-2 ring-teal-400/30'
          : 'bg-white dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 hover:border-teal-300 dark:hover:border-teal-700'
      )}
    >
      <div className={cn(
        'w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0',
        isComplete
          ? 'bg-emerald-500 text-white'
          : isCurrent
          ? 'bg-teal-500 text-white'
          : 'bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400'
      )}>
        {isComplete ? (
          <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        ) : (
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[10px] sm:text-xs text-stone-400 dark:text-stone-500">Steg {step}</span>
          {isCurrent && !isComplete && (
            <span className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 rounded-full font-medium">
              Nu
            </span>
          )}
        </div>
        <p className={cn(
          'text-xs sm:text-sm font-medium truncate',
          isComplete ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-800 dark:text-stone-200'
        )}>
          {title}
        </p>
      </div>
      <ChevronRight className={cn(
        'w-4 h-4 shrink-0 transition-transform',
        isComplete ? 'text-emerald-400 dark:text-emerald-500' : 'text-stone-300 dark:text-stone-600 group-hover:translate-x-1'
      )} />
    </Link>
  )
}

// ============================================
// QUICK ACTION BUTTON
// ============================================
function QuickAction({
  icon: Icon,
  label,
  to,
  color = 'teal'
}: {
  icon: React.ElementType
  label: string
  to: string
  color?: 'teal' | 'sky' | 'amber'
}) {
  const colorClasses = {
    teal: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-900/60',
    sky: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-900/60',
    amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60',
  }

  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors',
        colorClasses[color]
      )}
    >
      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      {label}
    </Link>
  )
}

// ============================================
// COLLAPSIBLE SECTION
// ============================================
function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultExpanded = true,
  badge,
  colorScheme = 'teal'
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  defaultExpanded?: boolean
  badge?: string
  colorScheme?: 'teal' | 'sky' | 'amber'
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const sectionId = `section-${title.toLowerCase().replace(/\s+/g, '-').replace(/[åäö]/g, 'a')}`

  const colors = {
    teal: {
      header: 'bg-teal-50 dark:bg-teal-900/20',
      headerText: 'text-teal-800 dark:text-teal-300',
      headerIcon: 'text-teal-600 dark:text-teal-400',
      border: 'border-teal-200 dark:border-teal-800/50',
    },
    sky: {
      header: 'bg-sky-50 dark:bg-sky-900/20',
      headerText: 'text-sky-800 dark:text-sky-300',
      headerIcon: 'text-sky-600 dark:text-sky-400',
      border: 'border-sky-200 dark:border-sky-800/50',
    },
    amber: {
      header: 'bg-amber-50 dark:bg-amber-900/20',
      headerText: 'text-amber-800 dark:text-amber-300',
      headerIcon: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800/50',
    }
  }

  const c = colors[colorScheme]

  return (
    <div className={cn('rounded-2xl border overflow-hidden', c.border)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={`${sectionId}-content`}
        className={cn('w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3', c.header)}
      >
        <div className="flex items-center gap-2">
          <Icon className={cn('w-4 h-4 sm:w-5 sm:h-5', c.headerIcon)} />
          <span className={cn('text-sm sm:text-base font-semibold', c.headerText)}>{title}</span>
          {badge && (
            <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full bg-white/60 dark:bg-stone-800/60 text-stone-600 dark:text-stone-300">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn('w-4 h-4 sm:w-5 sm:h-5 transition-transform', c.headerIcon, !isExpanded && '-rotate-90')}
          aria-hidden="true"
        />
      </button>
      {isExpanded && (
        <div id={`${sectionId}-content`} className="p-3 sm:p-4 bg-white dark:bg-stone-900/50">
          {children}
        </div>
      )}
    </div>
  )
}

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
  const { data: dashboardData, loading: dashboardLoading } = useDashboardData()
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
  const progressPercent = Math.round((onboardingProgress.completed / onboardingProgress.total) * 100)

  // Find first incomplete step for current step indicator
  const currentStepIndex = ONBOARDING_STEPS.findIndex(
    step => !onboardingProgress.progress?.[step.trackKey]
  )

  if (dashboardLoading || interestLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-teal-500 dark:text-teal-400 animate-spin mx-auto mb-3" />
          <p className="text-stone-600 dark:text-stone-400">Laddar översikt...</p>
        </div>
      </div>
    )
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
                <User className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-teal-600 dark:text-teal-400 font-medium">{greeting}</p>
                <h1 className="text-lg sm:text-xl font-bold text-teal-800 dark:text-teal-300 truncate">
                  {firstName}!
                </h1>
              </div>
              {/* Progress ring - visible on all screens */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative w-10 h-10 sm:w-12 sm:h-12">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 -rotate-90">
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
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs font-bold text-teal-700 dark:text-teal-300">
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
            <CollapsibleSection
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
            </CollapsibleSection>

            {/* Quick Actions */}
            <CollapsibleSection
              title="Snabbåtgärder"
              icon={Sparkles}
              colorScheme="sky"
              defaultExpanded={true}
            >
              <div className="flex flex-wrap gap-2">
                <QuickAction icon={Search} label="Sök jobb" to="/job-search" color="teal" />
                <QuickAction icon={FileUser} label="Redigera CV" to="/cv" color="teal" />
                <QuickAction icon={Mail} label="Nytt brev" to="/cover-letter" color="sky" />
                <QuickAction icon={Building2} label="Spontanansökan" to="/spontanansökan" color="sky" />
                <QuickAction icon={NotebookPen} label="Dagbok" to="/diary" color="amber" />
                <QuickAction icon={Smile} label="Logga mående" to="/wellness" color="amber" />
              </div>
            </CollapsibleSection>

            {/* Skills & Development */}
            <CollapsibleSection
              title="Utveckling"
              icon={TrendingUp}
              colorScheme="amber"
              defaultExpanded={false}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                {[
                  { icon: Target, label: 'Karriär', path: '/career' },
                  { icon: GraduationCap, label: 'Utbildning', path: '/education' },
                  { icon: Star, label: 'Varumärke', path: '/personal-brand' },
                  { icon: Linkedin, label: 'LinkedIn', path: '/linkedin-optimizer' },
                  { icon: TrendingUp, label: 'Kompetensanalys', path: '/skills-gap-analysis' },
                  { icon: BookOpen, label: 'Kunskapsbank', path: '/knowledge-base' },
                ].map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
                  >
                    <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-stone-700 dark:text-stone-300 truncate">{item.label}</span>
                  </Link>
                ))}
              </div>
            </CollapsibleSection>

            {/* Wellness & Planning */}
            <CollapsibleSection
              title="Välmående & Planering"
              icon={Heart}
              colorScheme="sky"
              defaultExpanded={false}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                {[
                  { icon: Calendar, label: 'Kalender', path: '/calendar' },
                  { icon: NotebookPen, label: 'Dagbok', path: '/diary' },
                  { icon: Smile, label: 'Hälsa', path: '/wellness' },
                  { icon: Dumbbell, label: 'Övningar', path: '/exercises' },
                  { icon: Globe, label: 'Internationellt', path: '/international' },
                  { icon: Bookmark, label: 'Resurser', path: '/resources' },
                ].map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 hover:border-sky-300 dark:hover:border-sky-700 transition-colors"
                  >
                    <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-stone-700 dark:text-stone-300 truncate">{item.label}</span>
                  </Link>
                ))}
              </div>
            </CollapsibleSection>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-3 sm:space-y-4">
            {/* RIASEC Profile */}
            {interestProfile?.hasResult && interestProfile.riasecScores && (
              <div className="bg-gradient-to-br from-teal-50 to-sky-50 dark:from-teal-900/20 dark:to-sky-900/20 rounded-2xl border border-teal-200 dark:border-teal-800/50 p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 dark:text-teal-400" />
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
                  className="flex items-center justify-center gap-1 mt-2 sm:mt-3 text-xs sm:text-sm text-teal-600 dark:text-teal-400 hover:underline"
                >
                  Se mer <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Link>
              </div>
            )}

            {/* Interest guide CTA if no result */}
            {!interestProfile?.hasResult && (
              <Link
                to="/interest-guide"
                className="block bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200 dark:border-amber-800/50 p-3 sm:p-4 hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-400 to-orange-400 dark:from-amber-500 dark:to-orange-500 rounded-xl flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-amber-800 dark:text-amber-300 truncate">Upptäck dina styrkor</h3>
                    <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400">Gör intresseguiden</p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300/80">
                  Svara på frågor och få personliga jobbförslag baserat på dina intressen.
                </p>
                <div className="flex items-center gap-1 mt-2 sm:mt-3 text-xs sm:text-sm font-medium text-amber-700 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
                  Starta nu <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </Link>
            )}

            {/* My Consultant (if has consultant) */}
            {authProfile?.consultant_id && (
              <Link
                to="/my-consultant"
                className="block bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-900/20 dark:to-indigo-900/20 rounded-2xl border border-sky-200 dark:border-sky-800/50 p-3 sm:p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-sky-400 to-indigo-400 dark:from-sky-500 dark:to-indigo-500 rounded-xl flex items-center justify-center shrink-0">
                    <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-semibold text-sky-800 dark:text-sky-300">Min konsulent</h3>
                    <p className="text-xs sm:text-sm text-sky-600 dark:text-sky-400">Kommunicera och följ upp</p>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400 dark:text-sky-500 shrink-0" />
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
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 dark:text-rose-400" />
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
