/**
 * Dashboard Page - Gentle Journey
 * Shows onboarding until complete, then expandable module cards
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ConsultantRequestBanner } from '@/components/consultant/ConsultantRequestBanner'
import { HelpButton } from '@/components/HelpButton'
import { helpContent } from '@/data/helpContent'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { userApi, cvApi, coverLetterApi, type OnboardingProgress } from '@/services/supabaseApi'
import { interestGuideApi } from '@/services/cloudStorage'
import {
  User, Compass, FileText, Target, Search, Mail,
  Check, ChevronRight, ChevronDown, Sparkles, Cloud, Loader2,
  Heart, BookOpen, Calendar, TrendingUp, Briefcase, Award
} from '@/components/ui/icons'

// Onboarding steps
const ONBOARDING_STEPS = [
  { id: 'profile', title: 'Fyll i din profil', description: 'Lägg till dina kontaktuppgifter', icon: User, path: '/profile' },
  { id: 'interest', title: 'Gör intresseguiden', description: 'Upptäck vilka yrken som passar dig', icon: Compass, path: '/interest-guide' },
  { id: 'cv', title: 'Skapa ditt CV', description: 'Bygg ett professionellt CV', icon: FileText, path: '/cv' },
  { id: 'career', title: 'Utforska karriärvägar', description: 'Se möjligheter och utvecklingsvägar', icon: Target, path: '/career' },
  { id: 'jobSearch', title: 'Sök jobb', description: 'Hitta och spara intressanta jobb', icon: Search, path: '/job-search' },
  { id: 'coverLetter', title: 'Skriv personligt brev', description: 'Skapa ett övertygande brev', icon: Mail, path: '/cover-letter' }
] as const

// Module definitions for post-onboarding
const MODULES = [
  {
    id: 'jobsearch',
    title: 'Jobbsökning',
    description: 'Hitta och sök jobb, hantera ansökningar',
    icon: Briefcase,
    color: 'peach',
    links: [
      { label: 'Sök jobb', path: '/job-search', icon: Search },
      { label: 'Mina ansökningar', path: '/applications', icon: FileText },
      { label: 'Personligt brev', path: '/cover-letter', icon: Mail },
      { label: 'Spontanansökan', path: '/spontanansökan', icon: TrendingUp }
    ],
    stats: [
      { label: 'Sparade jobb', value: '—' },
      { label: 'Ansökningar', value: '—' }
    ]
  },
  {
    id: 'profile-cv',
    title: 'Profil & CV',
    description: 'Hantera din profil och ditt CV',
    icon: User,
    color: 'sky',
    links: [
      { label: 'Min profil', path: '/profile', icon: User },
      { label: 'Mitt CV', path: '/cv', icon: FileText },
      { label: 'Personligt varumärke', path: '/personal-brand', icon: Award }
    ],
    stats: [
      { label: 'Profil', value: '—' },
      { label: 'CV', value: '—' }
    ]
  },
  {
    id: 'career',
    title: 'Karriär & Utveckling',
    description: 'Utforska karriärvägar och utbildningar',
    icon: Target,
    color: 'lavender',
    links: [
      { label: 'Karriärvägar', path: '/career', icon: Target },
      { label: 'Intresseguide', path: '/interest-guide', icon: Compass },
      { label: 'Utbildningar', path: '/education', icon: BookOpen },
      { label: 'Lön & förhandling', path: '/salary', icon: TrendingUp }
    ],
    stats: [
      { label: 'Intresseprofil', value: '—' }
    ]
  },
  {
    id: 'wellbeing',
    title: 'Hälsa & Välmående',
    description: 'Ta hand om dig själv under jobbsökningen',
    icon: Heart,
    color: 'sage',
    links: [
      { label: 'Dagbok', path: '/diary', icon: BookOpen },
      { label: 'Hälsa', path: '/wellness', icon: Heart },
      { label: 'Övningar', path: '/exercises', icon: Sparkles }
    ],
    stats: []
  },
  {
    id: 'planning',
    title: 'Planering',
    description: 'Kalender och din jobbresa',
    icon: Calendar,
    color: 'teal',
    links: [
      { label: 'Kalender', path: '/calendar', icon: Calendar },
      { label: 'Min jobbresa', path: '/journey', icon: TrendingUp }
    ],
    stats: []
  }
]

const COLOR_CLASSES = {
  peach: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    accent: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400',
    hover: 'hover:bg-orange-100/50 dark:hover:bg-orange-900/30'
  },
  sky: {
    bg: 'bg-sky-50 dark:bg-sky-900/20',
    border: 'border-sky-200 dark:border-sky-800',
    accent: 'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400',
    hover: 'hover:bg-sky-100/50 dark:hover:bg-sky-900/30'
  },
  lavender: {
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    border: 'border-teal-200 dark:border-teal-800',
    accent: 'bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400',
    hover: 'hover:bg-teal-100/50 dark:hover:bg-teal-900/30'
  },
  sage: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    accent: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    hover: 'hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30'
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    border: 'border-teal-200 dark:border-teal-800',
    accent: 'bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400',
    hover: 'hover:bg-teal-100/50 dark:hover:bg-teal-900/30'
  }
}

function ModuleCard({ module, isExpanded, onToggle }: {
  module: typeof MODULES[0]
  isExpanded: boolean
  onToggle: () => void
}) {
  const colors = COLOR_CLASSES[module.color as keyof typeof COLOR_CLASSES]
  const Icon = module.icon

  return (
    <div className={cn(
      'rounded-2xl border-2 overflow-hidden transition-all duration-300',
      colors.border,
      isExpanded ? 'shadow-lg' : 'shadow-sm hover:shadow-md'
    )}>
      {/* Header - Always visible */}
      <button
        onClick={onToggle}
        className={cn(
          'w-full p-4 flex items-center gap-4 transition-colors text-left',
          colors.bg,
          colors.hover
        )}
      >
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', colors.accent)}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">{module.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{module.description}</p>
        </div>
        {module.stats.length > 0 && !isExpanded && (
          <div className="hidden sm:flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            {module.stats.slice(0, 2).map((stat, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="font-medium text-gray-700 dark:text-gray-300">{stat.value}</span>
                <span>{stat.label}</span>
              </span>
            ))}
          </div>
        )}
        <ChevronDown className={cn(
          'w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform',
          isExpanded && 'rotate-180'
        )} />
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className={cn('p-4 border-t', colors.border, 'bg-white dark:bg-stone-800')}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {module.links.map((link) => {
              const LinkIcon = link.icon
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-xl border transition-all',
                    'border-gray-100 dark:border-stone-600 hover:border-gray-200 dark:hover:border-stone-500 hover:bg-gray-50 dark:hover:bg-stone-700',
                    'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  <LinkIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm font-medium">{link.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function OnboardingView({ progress, profile }: { progress: OnboardingProgress; profile: any }) {
  const completedCount = ONBOARDING_STEPS.filter(step => progress[step.id as keyof OnboardingProgress]).length
  const totalSteps = ONBOARDING_STEPS.length
  const progressPercent = Math.round((completedCount / totalSteps) * 100)
  const nextStepIndex = ONBOARDING_STEPS.findIndex(step => !progress[step.id as keyof OnboardingProgress])

  return (
    <div className="max-w-2xl mx-auto">
      {/* Welcome Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-500 dark:from-teal-600 dark:to-teal-700 mb-4 shadow-lg shadow-teal-200 dark:shadow-none">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Hej{profile?.first_name ? `, ${profile.first_name}` : ''}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Följ stegen nedan för att komma igång med din jobbsökarresa.
        </p>
        <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-gray-500 dark:text-gray-400">
          <Cloud className="w-3.5 h-3.5" />
          <span>Synkas automatiskt</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-stone-800 rounded-2xl border border-gray-200 dark:border-stone-700 p-5 mb-6 shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Din framsteg</span>
          <span className="text-sm font-bold text-teal-600 dark:text-teal-400">{completedCount} av {totalSteps} klart</span>
        </div>
        <div className="h-3 bg-gray-100 dark:bg-stone-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-400 to-teal-500 dark:from-teal-500 dark:to-teal-600 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {ONBOARDING_STEPS.map((step, index) => {
          const isComplete = progress[step.id as keyof OnboardingProgress]
          const isNext = index === nextStepIndex
          const Icon = step.icon

          return (
            <Link
              key={step.id}
              to={step.path}
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl border-2 transition-all group',
                isComplete
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-700'
                  : isNext
                    ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-300 dark:border-teal-700 hover:border-teal-400 dark:hover:border-teal-600 shadow-sm dark:shadow-none'
                    : 'bg-white dark:bg-stone-800 border-gray-200 dark:border-stone-700 hover:border-gray-300 dark:hover:border-stone-600'
              )}
            >
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105',
                isComplete
                  ? 'bg-emerald-500 dark:bg-emerald-600 text-white'
                  : isNext
                    ? 'bg-teal-500 dark:bg-teal-600 text-white'
                    : 'bg-gray-100 dark:bg-stone-700 text-gray-500 dark:text-gray-400'
              )}>
                {isComplete ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={cn(
                    'font-semibold',
                    isComplete ? 'text-emerald-800 dark:text-emerald-300' : isNext ? 'text-teal-900 dark:text-teal-300' : 'text-gray-700 dark:text-gray-200'
                  )}>
                    {step.title}
                  </h3>
                  {isNext && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-teal-500 dark:bg-teal-600 text-white rounded-full">
                      NÄSTA
                    </span>
                  )}
                  {isComplete && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-full">
                      Klar
                    </span>
                  )}
                </div>
                <p className={cn(
                  'text-sm mt-0.5',
                  isComplete ? 'text-emerald-600 dark:text-emerald-400' : isNext ? 'text-teal-600 dark:text-teal-400' : 'text-gray-500 dark:text-gray-400'
                )}>
                  {step.description}
                </p>
              </div>

              <ChevronRight className={cn(
                'w-5 h-5 flex-shrink-0 transition-transform group-hover:translate-x-1',
                isComplete ? 'text-emerald-400 dark:text-emerald-500' : isNext ? 'text-teal-400 dark:text-teal-500' : 'text-gray-300 dark:text-gray-600'
              )} />
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function ModulesView({ profile }: { profile: any }) {
  const [expandedModules, setExpandedModules] = useState<string[]>(['jobsearch'])

  const toggleModule = (id: string) => {
    setExpandedModules(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Welcome back header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-500 dark:from-teal-600 dark:to-teal-700 mb-4 shadow-lg shadow-teal-200 dark:shadow-none">
          <Award className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">
          Välkommen tillbaka{profile?.first_name ? `, ${profile.first_name}` : ''}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Här är en översikt av dina verktyg och resurser.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Min profil', icon: User, path: '/profile', color: 'bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400' },
          { label: 'Sök jobb', icon: Search, path: '/job-search', color: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
          { label: 'Mitt CV', icon: FileText, path: '/cv', color: 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' },
          { label: 'Kalender', icon: Calendar, path: '/calendar', color: 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' }
        ].map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-stone-700 transition-all',
                'hover:shadow-md dark:hover:shadow-none hover:border-gray-300 dark:hover:border-stone-600 bg-white dark:bg-stone-800'
              )}
            >
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', item.color)}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{item.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Module cards */}
      <div className="space-y-3">
        {MODULES.map((module) => (
          <ModuleCard
            key={module.id}
            module={module}
            isExpanded={expandedModules.includes(module.id)}
            onToggle={() => toggleModule(module.id)}
          />
        ))}
      </div>

      {/* Helpful tip */}
      <div className="mt-8 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-200 dark:border-teal-800 text-center">
        <p className="text-sm text-teal-800 dark:text-teal-300">
          <Link to="/journey" className="font-medium underline hover:no-underline">Min Jobbresa</Link> ger dig en översikt av din utveckling och dina mål.
        </p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const { profile } = useAuthStore()
  const [onboardingProgress, setOnboardingProgress] = useState<OnboardingProgress>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProgress()
  }, [])

  const loadProgress = async () => {
    try {
      const [cloudProgress, interestGuideData, cvData, coverLetters] = await Promise.all([
        userApi.getOnboardingProgress(),
        interestGuideApi.getProgress().catch(() => null),
        cvApi.getCV().catch(() => null),
        coverLetterApi.getAll().catch(() => [])
      ])

      const interestCompleted = cloudProgress.interest || interestGuideData?.is_completed === true
      const cvCompleted = cloudProgress.cv || (cvData && (cvData.firstName || cvData.workExperience?.length > 0))
      const coverLetterCompleted = cloudProgress.coverLetter || (coverLetters && coverLetters.length > 0)

      setOnboardingProgress({
        profile: cloudProgress.profile,
        interest: interestCompleted,
        cv: cvCompleted,
        career: cloudProgress.career,
        jobSearch: cloudProgress.jobSearch,
        coverLetter: coverLetterCompleted
      })
    } catch (err) {
      console.error('Error loading progress:', err)
    } finally {
      setLoading(false)
    }
  }

  const allComplete = ONBOARDING_STEPS.every(step => onboardingProgress[step.id as keyof OnboardingProgress])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-teal-500 dark:text-teal-400 animate-spin mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">Laddar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-950 page-transition">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ConsultantRequestBanner />

        {allComplete ? (
          <ModulesView profile={profile} />
        ) : (
          <OnboardingView progress={onboardingProgress} profile={profile} />
        )}
      </div>
      <HelpButton content={helpContent.dashboard} />
    </div>
  )
}
