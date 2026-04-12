/**
 * Dashboard Page - Three expandable category sections
 * Onboarding, Skills Development, Planning & Documentation
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
  User, Compass, FileText, Search, Mail, Building2, ClipboardList,
  Check, ChevronDown, Loader2, Target, GraduationCap, Star,
  TrendingUp, Linkedin, BookOpen, Dumbbell, Calendar, NotebookPen,
  Smile, Globe, Bookmark
} from '@/components/ui/icons'

// Category item configuration
interface CategoryItem {
  id: string
  title: string
  description: string
  icon: React.ElementType
  path: string
  trackProgress?: keyof OnboardingProgress
}

// Onboarding items with progress tracking
const ONBOARDING_ITEMS: CategoryItem[] = [
  {
    id: 'profile',
    title: 'Min profil',
    description: 'Dina kontaktuppgifter',
    icon: User,
    path: '/profile',
    trackProgress: 'profile'
  },
  {
    id: 'interest',
    title: 'Intresseguiden',
    description: 'Upptäck passande yrken',
    icon: Compass,
    path: '/interest-guide',
    trackProgress: 'interest'
  },
  {
    id: 'cv',
    title: 'Mitt CV',
    description: 'Skapa ditt CV',
    icon: FileText,
    path: '/cv',
    trackProgress: 'cv'
  },
  {
    id: 'jobSearch',
    title: 'Sök jobb',
    description: 'Hitta lediga tjänster',
    icon: Search,
    path: '/job-search',
    trackProgress: 'jobSearch'
  },
  {
    id: 'coverLetter',
    title: 'Personligt brev',
    description: 'Skriv övertygande brev',
    icon: Mail,
    path: '/cover-letter',
    trackProgress: 'coverLetter'
  },
  {
    id: 'spontaneous',
    title: 'Spontanansökningar',
    description: 'Kontakta arbetsgivare direkt',
    icon: Building2,
    path: '/spontanansökan'
  },
  {
    id: 'applications',
    title: 'Mina ansökningar',
    description: 'Följ dina ansökningar',
    icon: ClipboardList,
    path: '/applications'
  }
]

// Skills development items
const SKILLS_ITEMS: CategoryItem[] = [
  {
    id: 'career',
    title: 'Karriär',
    description: 'Utforska karriärvägar',
    icon: Target,
    path: '/career'
  },
  {
    id: 'education',
    title: 'Utbildning',
    description: 'Hitta kurser och utbildningar',
    icon: GraduationCap,
    path: '/education'
  },
  {
    id: 'personalBrand',
    title: 'Personligt varumärke',
    description: 'Bygg din profil',
    icon: Star,
    path: '/personal-brand'
  },
  {
    id: 'skillsGap',
    title: 'Kompetensanalys',
    description: 'Identifiera utvecklingsområden',
    icon: TrendingUp,
    path: '/skills-gap-analysis'
  },
  {
    id: 'linkedin',
    title: 'LinkedIn',
    description: 'Optimera din profil',
    icon: Linkedin,
    path: '/linkedin-optimizer'
  },
  {
    id: 'knowledgeBase',
    title: 'Kunskapsbank',
    description: 'Artiklar och guider',
    icon: BookOpen,
    path: '/knowledge-base'
  },
  {
    id: 'exercises',
    title: 'Övningar',
    description: 'Träna och utvecklas',
    icon: Dumbbell,
    path: '/exercises'
  }
]

// Planning & documentation items
const PLANNING_ITEMS: CategoryItem[] = [
  {
    id: 'calendar',
    title: 'Kalender',
    description: 'Planera dina aktiviteter',
    icon: Calendar,
    path: '/calendar'
  },
  {
    id: 'diary',
    title: 'Dagbok',
    description: 'Reflektera och dokumentera',
    icon: NotebookPen,
    path: '/diary'
  },
  {
    id: 'wellness',
    title: 'Hälsa',
    description: 'Följ ditt mående',
    icon: Smile,
    path: '/wellness'
  },
  {
    id: 'international',
    title: 'Internationell guide',
    description: 'Jobba utomlands',
    icon: Globe,
    path: '/international'
  },
  {
    id: 'resources',
    title: 'Mina resurser',
    description: 'Sparade länkar och dokument',
    icon: Bookmark,
    path: '/resources'
  }
]

// Expandable category component
function ExpandableCategory({
  title,
  items,
  defaultExpanded = true,
  progress,
  colorScheme = 'teal'
}: {
  title: string
  items: CategoryItem[]
  defaultExpanded?: boolean
  progress?: OnboardingProgress
  colorScheme?: 'teal' | 'sky' | 'amber'
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  // Generate stable ID for ARIA
  const categoryId = `category-${title.toLowerCase().replace(/\s+/g, '-').replace(/[åä]/g, 'a').replace(/ö/g, 'o')}`

  const colors = {
    teal: {
      header: 'from-teal-50 to-teal-100/50 dark:from-teal-900/30 dark:to-teal-800/20',
      headerText: 'text-teal-800 dark:text-teal-300',
      headerIcon: 'text-teal-600 dark:text-teal-400',
      border: 'border-teal-200 dark:border-teal-800/50',
      itemBg: 'bg-white dark:bg-stone-800/50 hover:bg-teal-50 dark:hover:bg-teal-900/20',
      itemBorder: 'border-teal-100 dark:border-teal-800/30',
      iconBg: 'bg-teal-100 dark:bg-teal-900/40',
      iconColor: 'text-teal-600 dark:text-teal-400',
      completeBg: 'bg-emerald-100 dark:bg-emerald-900/40',
      completeIcon: 'text-emerald-600 dark:text-emerald-400'
    },
    sky: {
      header: 'from-sky-50 to-sky-100/50 dark:from-sky-900/30 dark:to-sky-800/20',
      headerText: 'text-sky-800 dark:text-sky-300',
      headerIcon: 'text-sky-600 dark:text-sky-400',
      border: 'border-sky-200 dark:border-sky-800/50',
      itemBg: 'bg-white dark:bg-stone-800/50 hover:bg-sky-50 dark:hover:bg-sky-900/20',
      itemBorder: 'border-sky-100 dark:border-sky-800/30',
      iconBg: 'bg-sky-100 dark:bg-sky-900/40',
      iconColor: 'text-sky-600 dark:text-sky-400',
      completeBg: 'bg-emerald-100 dark:bg-emerald-900/40',
      completeIcon: 'text-emerald-600 dark:text-emerald-400'
    },
    amber: {
      header: 'from-amber-50 to-amber-100/50 dark:from-amber-900/30 dark:to-amber-800/20',
      headerText: 'text-amber-800 dark:text-amber-300',
      headerIcon: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800/50',
      itemBg: 'bg-white dark:bg-stone-800/50 hover:bg-amber-50 dark:hover:bg-amber-900/20',
      itemBorder: 'border-amber-100 dark:border-amber-800/30',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      iconColor: 'text-amber-600 dark:text-amber-400',
      completeBg: 'bg-emerald-100 dark:bg-emerald-900/40',
      completeIcon: 'text-emerald-600 dark:text-emerald-400'
    }
  }

  const c = colors[colorScheme]

  // Calculate progress for onboarding
  const completedCount = progress
    ? items.filter(item => item.trackProgress && progress[item.trackProgress]).length
    : 0
  const trackableItems = items.filter(item => item.trackProgress).length
  const showProgress = trackableItems > 0 && progress

  return (
    <div className={cn('rounded-2xl border overflow-hidden', c.border)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={`${categoryId}-content`}
        className={cn(
          'w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r transition-colors',
          c.header
        )}
      >
        <div className="flex items-center gap-3">
          <h2 className={cn('text-lg font-semibold', c.headerText)}>{title}</h2>
          {showProgress && (
            <span className={cn(
              'px-2 py-0.5 text-xs font-medium rounded-full',
              completedCount === trackableItems
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                : 'bg-white/60 dark:bg-stone-700/60 text-stone-600 dark:text-stone-300'
            )}>
              {completedCount}/{trackableItems} klart
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'w-5 h-5 transition-transform',
            c.headerIcon,
            !isExpanded && '-rotate-90'
          )}
          aria-hidden="true"
        />
      </button>

      {/* Content */}
      {isExpanded && (
        <div
          id={`${categoryId}-content`}
          role="region"
          aria-label={title}
          className="p-4 bg-gradient-to-b from-white to-stone-50/50 dark:from-stone-900 dark:to-stone-950/50"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((item) => {
              const Icon = item.icon
              const isComplete = item.trackProgress && progress?.[item.trackProgress]

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={cn(
                    'flex flex-col items-center text-center p-4 rounded-xl border transition-all group',
                    c.itemBg,
                    c.itemBorder,
                    'hover:shadow-md hover:scale-[1.02]'
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110 relative',
                    isComplete ? c.completeBg : c.iconBg
                  )}>
                    <Icon className={cn('w-6 h-6', isComplete ? c.completeIcon : c.iconColor)} />
                    {isComplete && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-medium text-stone-800 dark:text-stone-200 mb-0.5">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2">
                    {item.description}
                  </p>
                </Link>
              )
            })}
          </div>
        </div>
      )}
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-teal-500 dark:text-teal-400 animate-spin mx-auto mb-3" />
          <p className="text-stone-600 dark:text-stone-400">Laddar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-transition">
      <div className="max-w-5xl mx-auto">
        <ConsultantRequestBanner />

        <div className="space-y-4">
          {/* Onboarding Section */}
          <ExpandableCategory
            title="Kom igång"
            items={ONBOARDING_ITEMS}
            progress={onboardingProgress}
            colorScheme="teal"
            defaultExpanded={true}
          />

          {/* Skills Development Section */}
          <ExpandableCategory
            title="Kompetensutveckling"
            items={SKILLS_ITEMS}
            colorScheme="sky"
            defaultExpanded={true}
          />

          {/* Planning & Documentation Section */}
          <ExpandableCategory
            title="Planera och dokumentera"
            items={PLANNING_ITEMS}
            colorScheme="amber"
            defaultExpanded={true}
          />
        </div>
      </div>
      <HelpButton content={helpContent.dashboard} />
    </div>
  )
}
