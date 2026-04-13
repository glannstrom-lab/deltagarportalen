/**
 * Overview Tab - Dashboard with expandable category boxes
 * Three main sections: Onboarding, Skills Development, Planning & Documentation
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  User,
  Compass,
  FileText,
  Search,
  Mail,
  Building2,
  ClipboardList,
  Check,
  ChevronDown,
  Loader2,
  Target,
  GraduationCap,
  Star,
  TrendingUp,
  Linkedin,
  BookOpen,
  Dumbbell,
  Calendar,
  NotebookPen,
  Smile,
  Globe,
  Bookmark
} from '@/components/ui/icons'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { userApi, cvApi, coverLetterApi, type OnboardingProgress } from '@/services/supabaseApi'
import { interestGuideApi } from '@/services/cloudStorage'
import { careerPlanApi, skillsAnalysisApi, networkApi } from '@/services/careerApi'
import { RecommendationsPanel } from '@/components/recommendations'

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
          'w-full flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r transition-colors',
          c.header
        )}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <h2 className={cn('text-base sm:text-lg font-semibold', c.headerText)}>{title}</h2>
          {showProgress && (
            <span className={cn(
              'px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full',
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
            'w-4 h-4 sm:w-5 sm:h-5 transition-transform',
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
          className="p-3 sm:p-4 bg-gradient-to-b from-white to-stone-50/50 dark:from-stone-900 dark:to-stone-950/50"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {items.map((item) => {
              const Icon = item.icon
              const isComplete = item.trackProgress && progress?.[item.trackProgress]

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={cn(
                    'flex flex-col items-center text-center p-3 sm:p-4 rounded-xl border transition-all group',
                    c.itemBg,
                    c.itemBorder,
                    'hover:shadow-md hover:scale-[1.02]'
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-1.5 sm:mb-2 transition-transform group-hover:scale-110 relative',
                    isComplete ? c.completeBg : c.iconBg
                  )}>
                    <Icon className={cn('w-5 h-5 sm:w-6 sm:h-6', isComplete ? c.completeIcon : c.iconColor)} />
                    {isComplete && (
                      <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-200 mb-0.5 line-clamp-1">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 line-clamp-1 sm:line-clamp-2">
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

export default function OverviewTab() {
  const { profile } = useAuthStore()
  const { t } = useTranslation()

  const [onboardingProgress, setOnboardingProgress] = useState<OnboardingProgress>({})
  const [loading, setLoading] = useState(true)

  // Progress dashboard data
  const [progressData, setProgressData] = useState({
    careerPlanProgress: 0,
    careerPlanMilestones: 0,
    careerPlanCompleted: 0,
    skillsMatchPercentage: 0,
    networkContacts: 0,
    networkActiveThisMonth: 0
  })

  // Load onboarding progress from cloud
  useEffect(() => {
    loadProgress()
  }, [])

  const loadProgress = async () => {
    // Get localStorage values as fallback/merge source
    const localStorageProgress: OnboardingProgress = {
      profile: !!localStorage.getItem('profile-data'),
      interest: !!localStorage.getItem('interest-result'),
      cv: !!localStorage.getItem('cv-data'),
      career: !!localStorage.getItem('career-visited'),
      jobSearch: !!localStorage.getItem('saved-jobs'),
      coverLetter: !!localStorage.getItem('cover-letters')
    }

    try {
      // Fetch onboarding progress, interest guide status, CV data, cover letters, and progress data in parallel
      const [cloudProgress, interestGuideData, cvData, coverLetters, careerPlan, skillsAnalysis, contacts] = await Promise.all([
        userApi.getOnboardingProgress(),
        interestGuideApi.getProgress().catch(() => null),
        cvApi.getCV().catch(() => null),
        coverLetterApi.getAll().catch(() => []),
        careerPlanApi.getActive().catch(() => null),
        skillsAnalysisApi.getLatest().catch(() => null),
        networkApi.getAll().catch(() => [])
      ])

      // Calculate progress data
      const milestones = careerPlan?.milestones || []
      const completedMilestones = milestones.filter(m => m.is_completed).length
      const activeContacts = contacts.filter(c => {
        if (!c.last_contact_date) return false
        const daysSince = Math.floor((new Date().getTime() - new Date(c.last_contact_date).getTime()) / (1000 * 60 * 60 * 24))
        return daysSince < 30
      }).length

      setProgressData({
        careerPlanProgress: careerPlan?.total_progress || 0,
        careerPlanMilestones: milestones.length,
        careerPlanCompleted: completedMilestones,
        skillsMatchPercentage: skillsAnalysis?.match_percentage || 0,
        networkContacts: contacts.length,
        networkActiveThisMonth: activeContacts
      })

      // Check if interest guide is completed from the actual progress data
      const interestCompleted = cloudProgress.interest ||
        localStorageProgress.interest ||
        interestGuideData?.is_completed === true

      // Check if CV is completed - user has saved a CV with meaningful content
      const cvCompleted = cloudProgress.cv ||
        localStorageProgress.cv ||
        (cvData && (cvData.firstName || cvData.workExperience?.length > 0 || cvData.skills?.length > 0))

      // If interest is completed but not in cloud, sync it
      if (interestCompleted && !cloudProgress.interest) {
        userApi.updateOnboardingStep('interest', true).catch(console.error)
        localStorage.setItem('interest-result', 'true')
      }

      // If CV is completed but not in cloud, sync it
      if (cvCompleted && !cloudProgress.cv) {
        userApi.updateOnboardingStep('cv', true).catch(console.error)
        localStorage.setItem('cv-data', 'true')
      }

      // Check if cover letter is completed - user has created at least one cover letter
      const coverLetterCompleted = cloudProgress.coverLetter ||
        localStorageProgress.coverLetter ||
        (coverLetters && coverLetters.length > 0)

      // If cover letter is completed but not in cloud, sync it
      if (coverLetterCompleted && !cloudProgress.coverLetter) {
        userApi.updateOnboardingStep('coverLetter', true).catch(console.error)
        localStorage.setItem('cover-letters', 'true')
      }

      // Merge: use cloud value if true, otherwise use localStorage value, or check actual data
      const mergedProgress: OnboardingProgress = {
        profile: cloudProgress.profile || localStorageProgress.profile,
        interest: interestCompleted,
        cv: cvCompleted,
        career: cloudProgress.career || localStorageProgress.career,
        jobSearch: cloudProgress.jobSearch || localStorageProgress.jobSearch,
        coverLetter: coverLetterCompleted
      }

      setOnboardingProgress(mergedProgress)
    } catch (err) {
      console.error('Error loading onboarding progress:', err)
      // Use localStorage only on error
      setOnboardingProgress(localStorageProgress)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div
        className="flex items-center justify-center py-12"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" aria-hidden="true" />
          <p className="text-stone-600 dark:text-stone-400">Laddar...</p>
        </div>
      </div>
    )
  }

  // Calculate total onboarding progress
  const onboardingComplete = Object.values(onboardingProgress).filter(Boolean).length
  const onboardingTotal = 5 // profile, interest, cv, jobSearch, coverLetter

  return (
    <div className="space-y-3 sm:space-y-4 max-w-5xl mx-auto">
      {/* Progress Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3" role="region" aria-label="Din framgång">
        {/* Onboarding Progress */}
        <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-900/30 dark:to-teal-800/20 rounded-xl p-3 sm:p-4 border border-teal-200 dark:border-teal-800/50">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-teal-800 dark:text-teal-300 truncate">Kom igång</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-teal-900 dark:text-teal-100" aria-live="polite">
            {onboardingComplete}/{onboardingTotal}
          </div>
          <div className="h-1 sm:h-1.5 bg-teal-200 dark:bg-teal-900/50 rounded-full mt-1.5 sm:mt-2 overflow-hidden">
            <div
              className="h-full bg-teal-500 dark:bg-teal-400 rounded-full transition-all"
              style={{ width: `${(onboardingComplete / onboardingTotal) * 100}%` }}
              role="progressbar"
              aria-valuenow={(onboardingComplete / onboardingTotal) * 100}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {/* Career Plan Progress */}
        <Link
          to="/career?tab=plan"
          className="bg-gradient-to-br from-sky-50 to-sky-100/50 dark:from-sky-900/30 dark:to-sky-800/20 rounded-xl p-3 sm:p-4 border border-sky-200 dark:border-sky-800/50 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center shrink-0">
              <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-sky-800 dark:text-sky-300 truncate">Karriärplan</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-sky-900 dark:text-sky-100">
            {progressData.careerPlanProgress}%
          </div>
          <p className="text-[10px] sm:text-xs text-sky-700 dark:text-sky-400 mt-0.5 sm:mt-1 truncate">
            {progressData.careerPlanCompleted}/{progressData.careerPlanMilestones} milstolpar
          </p>
        </Link>

        {/* Skills Match */}
        <Link
          to="/career?tab=skills"
          className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/30 dark:to-emerald-800/20 rounded-xl p-3 sm:p-4 border border-emerald-200 dark:border-emerald-800/50 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-emerald-800 dark:text-emerald-300 truncate">Kompetensmatch</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-900 dark:text-emerald-100">
            {progressData.skillsMatchPercentage > 0 ? `${progressData.skillsMatchPercentage}%` : '–'}
          </div>
          <p className="text-[10px] sm:text-xs text-emerald-700 dark:text-emerald-400 mt-0.5 sm:mt-1 truncate">
            {progressData.skillsMatchPercentage > 0 ? 'mot drömjobbet' : 'Kör en analys'}
          </p>
        </Link>

        {/* Network */}
        <Link
          to="/career?tab=network"
          className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/30 dark:to-amber-800/20 rounded-xl p-3 sm:p-4 border border-amber-200 dark:border-amber-800/50 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-amber-800 dark:text-amber-300 truncate">Nätverk</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-900 dark:text-amber-100">
            {progressData.networkContacts}
          </div>
          <p className="text-[10px] sm:text-xs text-amber-700 dark:text-amber-400 mt-0.5 sm:mt-1 truncate">
            {progressData.networkActiveThisMonth} aktiva denna månad
          </p>
        </Link>
      </div>

      {/* AI Recommendations */}
      <RecommendationsPanel maxRecommendations={3} showTitle={true} />

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
  )
}
