import { useState, useEffect, lazy, Suspense, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Settings, ChevronDown, Plus, ChevronRight, Flame, Target,
  FileText, Briefcase, Heart, BookOpen, Sparkles, ArrowRight,
  CheckCircle2, Circle, Lightbulb, Zap, Star, TrendingUp,
  Calendar, MessageSquare, Linkedin, BarChart3
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useDashboardData } from '@/hooks/useDashboardData'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import '@/styles/animations.css'

// Lazy load widgets
const CVWidget = lazy(() => import('@/components/dashboard/widgets/CVWidget'))
const JobSearchWidget = lazy(() => import('@/components/dashboard/widgets/JobSearchWidget'))
const WellnessWidget = lazy(() => import('@/components/dashboard/widgets/WellnessWidget'))
const QuestsWidget = lazy(() => import('@/components/dashboard/widgets/QuestsWidget'))
const ExercisesWidget = lazy(() => import('@/components/dashboard/widgets/ExercisesWidget'))
const KnowledgeWidget = lazy(() => import('@/components/dashboard/widgets/KnowledgeWidget'))
const InterestWidget = lazy(() => import('@/components/dashboard/widgets/InterestWidget'))
const CalendarWidget = lazy(() => import('@/components/dashboard/widgets/CalendarWidget'))
const InterviewWidget = lazy(() => import('@/components/dashboard/widgets/InterviewWidget'))
const LinkedInWidget = lazy(() => import('@/components/dashboard/widgets/LinkedInWidget'))
const SkillsWidget = lazy(() => import('@/components/dashboard/widgets/SkillsWidget'))

// Widget map
const WIDGET_COMPONENTS = {
  cv: CVWidget,
  jobSearch: JobSearchWidget,
  wellness: WellnessWidget,
  quests: QuestsWidget,
  exercises: ExercisesWidget,
  knowledge: KnowledgeWidget,
  interests: InterestWidget,
  calendar: CalendarWidget,
  interview: InterviewWidget,
  linkedin: LinkedInWidget,
  skills: SkillsWidget,
}

type WidgetId = keyof typeof WIDGET_COMPONENTS

const ALL_WIDGETS = [
  { id: 'cv', label: 'CV', icon: FileText, color: 'violet' },
  { id: 'jobSearch', label: 'Jobbsök', icon: Briefcase, color: 'blue' },
  { id: 'wellness', label: 'Välmående', icon: Heart, color: 'rose' },
  { id: 'quests', label: 'Quests', icon: Target, color: 'amber' },
  { id: 'exercises', label: 'Övningar', icon: Zap, color: 'emerald' },
  { id: 'knowledge', label: 'Kunskapsbank', icon: BookOpen, color: 'amber' },
  { id: 'interests', label: 'Intressen', icon: Sparkles, color: 'purple' },
  { id: 'calendar', label: 'Kalender', icon: Calendar, color: 'rose' },
  { id: 'interview', label: 'Intervjuträning', icon: MessageSquare, color: 'indigo' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'blue' },
  { id: 'skills', label: 'Kompetenser', icon: BarChart3, color: 'cyan' },
] as const

const DEFAULT_WIDGETS: WidgetId[] = ['cv', 'jobSearch', 'wellness', 'quests']

// Animation wrapper
function AnimatedSection({ children, delay = 0, className }: { children: React.ReactNode, delay?: number, className?: string }) {
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div className={cn(className, "transition-all duration-500", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

// Determine if user is new (for onboarding)
function isNewUser(data: ReturnType<typeof useDashboardData>['data']): boolean {
  if (!data) return true
  const hasCV = data.cv?.hasCV || (data.cv?.progress || 0) > 10
  const hasQuests = (data.quests?.completed || 0) > 0
  const hasJobs = (data.jobs?.savedCount || 0) > 0
  return !hasCV && !hasQuests && !hasJobs
}

// Get next recommended action
function getNextAction(data: ReturnType<typeof useDashboardData>['data']): {
  title: string
  description: string
  link: string
  icon: React.ElementType
  color: string
  priority: 'high' | 'medium' | 'low'
} | null {
  if (!data) return null

  // Priority 1: Create CV if not started
  if (!data.cv?.hasCV && (data.cv?.progress || 0) < 20) {
    return {
      title: 'Skapa ditt CV',
      description: 'Första steget till ditt nya jobb',
      link: '/cv',
      icon: FileText,
      color: 'violet',
      priority: 'high'
    }
  }

  // Priority 2: Complete CV if started but not done
  if (data.cv?.hasCV && (data.cv?.progress || 0) < 80) {
    const missing = data.cv?.missingSections?.[0]
    const sectionNames: Record<string, string> = {
      summary: 'profil',
      work_experience: 'arbetslivserfarenhet',
      education: 'utbildning',
      skills: 'kompetenser'
    }
    return {
      title: 'Fortsätt med ditt CV',
      description: missing ? `Lägg till ${sectionNames[missing] || missing}` : `${data.cv.progress}% klart`,
      link: '/cv',
      icon: FileText,
      color: 'violet',
      priority: 'high'
    }
  }

  // Priority 3: Start job search
  if ((data.jobs?.savedCount || 0) === 0) {
    return {
      title: 'Sök jobb',
      description: 'Hitta jobb som passar dig',
      link: '/job-search',
      icon: Briefcase,
      color: 'blue',
      priority: 'medium'
    }
  }

  // Priority 4: Complete quests
  if ((data.quests?.completed || 0) < (data.quests?.total || 3)) {
    const remaining = (data.quests?.total || 3) - (data.quests?.completed || 0)
    return {
      title: `${remaining} quest${remaining > 1 ? 's' : ''} kvar`,
      description: 'Slutför dagens mål',
      link: '/activity',
      icon: Target,
      color: 'amber',
      priority: 'medium'
    }
  }

  // Priority 5: Log wellness
  if (!data.wellness?.moodToday) {
    return {
      title: 'Hur mår du idag?',
      description: 'Logga ditt humör',
      link: '/wellness',
      icon: Heart,
      color: 'rose',
      priority: 'low'
    }
  }

  return null
}

// Onboarding component for new users
function NewUserOnboarding({ userName }: { userName?: string }) {
  const steps = [
    {
      id: 1,
      title: 'Skapa ditt CV',
      description: 'Bygg ett professionellt CV på några minuter',
      icon: FileText,
      link: '/cv',
      color: 'from-violet-500 to-purple-600'
    },
    {
      id: 2,
      title: 'Hitta jobb',
      description: 'Sök bland tusentals lediga tjänster',
      icon: Briefcase,
      link: '/job-search',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      id: 3,
      title: 'Lär dig mer',
      description: 'Tips och guider för din jobbsökning',
      icon: BookOpen,
      link: '/knowledge-base',
      color: 'from-amber-500 to-orange-600'
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome hero */}
      <AnimatedSection delay={100}>
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span className="text-sm font-medium text-white/80">Välkommen till Jobin</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              Hej{userName ? `, ${userName}` : ''}! 👋
            </h1>
            <p className="text-lg text-white/90 max-w-xl mb-6">
              Här får du alla verktyg du behöver för att hitta ditt nästa jobb.
              Kom igång med tre enkla steg.
            </p>

            {/* Quick stats placeholder */}
            <div className="flex flex-wrap gap-4">
              <div className="px-4 py-2 bg-white/15 backdrop-blur-sm rounded-xl">
                <span className="text-2xl font-bold">3</span>
                <span className="text-sm text-white/80 ml-2">steg till ditt CV</span>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Getting started steps */}
      <AnimatedSection delay={200}>
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Kom igång
          </h2>

          <div className="grid sm:grid-cols-3 gap-4">
            {steps.map((step, index) => (
              <Link
                key={step.id}
                to={step.link}
                className="group relative bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-violet-300 hover:shadow-lg transition-all duration-300"
              >
                {/* Step number */}
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-slate-800 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                  {step.id}
                </div>

                {/* Icon */}
                <div className={cn(
                  "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform",
                  step.color
                )}>
                  <step.icon className="w-7 h-7 text-white" />
                </div>

                <h3 className="font-semibold text-slate-800 mb-1 group-hover:text-violet-700 transition-colors">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  {step.description}
                </p>

                <div className="flex items-center text-sm font-medium text-violet-600 group-hover:text-violet-700">
                  Börja nu
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Tips section */}
      <AnimatedSection delay={300}>
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Star className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-900 mb-1">Visste du?</h3>
              <p className="text-sm text-amber-800">
                Arbetssökande med ett uppdaterat CV får i snitt 40% fler svar från arbetsgivare.
                Börja med att skapa ditt CV så hjälper vi dig resten av vägen!
              </p>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </div>
  )
}

// Improved Hero section
function HeroSection({
  userName,
  streakDays,
  questsCompleted,
  questsTotal,
  cvProgress,
  nextAction
}: {
  userName?: string
  streakDays: number
  questsCompleted: number
  questsTotal: number
  cvProgress: number
  nextAction: ReturnType<typeof getNextAction>
}) {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 10) return 'God morgon'
    if (hour < 18) return 'Hej'
    return 'God kväll'
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />

      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left: Greeting & Status */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-1">
            {getGreeting()}{userName ? `, ${userName}` : ''}! 👋
          </h1>

          {/* Status row */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {questsTotal > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full">
                <Target className="w-4 h-4" />
                {questsCompleted}/{questsTotal} quests
              </span>
            )}
            {streakDays > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/30 backdrop-blur-sm rounded-full text-amber-100">
                <Flame className="w-4 h-4 text-amber-300" />
                {streakDays} dagar i rad
              </span>
            )}
            {cvProgress > 0 && cvProgress < 100 && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full">
                <FileText className="w-4 h-4" />
                CV {cvProgress}%
              </span>
            )}
          </div>
        </div>

        {/* Right: Next action CTA */}
        {nextAction && (
          <Link
            to={nextAction.link}
            className="flex items-center gap-3 px-4 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-all group"
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              nextAction.color === 'violet' && "bg-violet-400/30",
              nextAction.color === 'blue' && "bg-blue-400/30",
              nextAction.color === 'amber' && "bg-amber-400/30",
              nextAction.color === 'rose' && "bg-rose-400/30",
            )}>
              <nextAction.icon className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">{nextAction.title}</p>
              <p className="text-xs text-white/70">{nextAction.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/60 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>
    </div>
  )
}

// Widget wrapper with improved styling
function WidgetWrapper({ children, onRemove, size = 'normal' }: { children: React.ReactNode, onRemove?: () => void, size?: 'normal' | 'large' }) {
  return (
    <div className={cn(
      "relative group",
      size === 'large' && "sm:col-span-2"
    )}>
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-200"
          title="Ta bort widget"
          aria-label="Ta bort widget"
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
      {children}
    </div>
  )
}

export default function OverviewTab() {
  const { user } = useAuthStore()
  const { data, loading } = useDashboardData()
  const [activeWidgets, setActiveWidgets] = useState<WidgetId[]>(DEFAULT_WIDGETS)
  const [showWidgetMenu, setShowWidgetMenu] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [prefsLoaded, setPrefsLoaded] = useState(false)

  // Check if new user
  const showOnboarding = isNewUser(data)
  const nextAction = getNextAction(data)

  // Load widget preferences from Supabase
  useEffect(() => {
    if (!user?.id || prefsLoaded) return

    const loadPreferences = async () => {
      try {
        const { data: prefs, error } = await supabase
          .from('user_preferences')
          .select('dashboard_widgets')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) {
          console.warn('Could not load preferences:', error.message)
          setPrefsLoaded(true)
          return
        }

        if (prefs?.dashboard_widgets && Array.isArray(prefs.dashboard_widgets)) {
          const validWidgets = prefs.dashboard_widgets.filter(
            (w: string): w is WidgetId => w in WIDGET_COMPONENTS
          )
          if (validWidgets.length > 0) {
            setActiveWidgets(validWidgets)
          }
        }
      } catch (err) {
        console.warn('Error loading preferences:', err)
      } finally {
        setPrefsLoaded(true)
      }
    }

    loadPreferences()
  }, [user?.id, prefsLoaded])

  // Save widget preferences to Supabase
  const savePreferences = useCallback(async (widgets: WidgetId[]) => {
    if (!user?.id) return

    setIsSaving(true)

    try {
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (existing) {
        await supabase
          .from('user_preferences')
          .update({
            dashboard_widgets: widgets,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
      } else {
        await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            dashboard_widgets: widgets
          })
      }
    } catch (err) {
      console.error('Error saving preferences:', err)
    } finally {
      setIsSaving(false)
    }
  }, [user?.id])

  const addWidget = (widgetId: WidgetId) => {
    if (!activeWidgets.includes(widgetId)) {
      const newWidgets = [...activeWidgets, widgetId]
      setActiveWidgets(newWidgets)
      savePreferences(newWidgets)
    }
  }

  const removeWidget = (widgetId: WidgetId) => {
    const newWidgets = activeWidgets.filter(id => id !== widgetId)
    setActiveWidgets(newWidgets)
    savePreferences(newWidgets)
  }

  const renderWidget = (widgetId: WidgetId, size: 'small' | 'medium' = 'small') => {
    const WidgetComponent = WIDGET_COMPONENTS[widgetId]

    const getWidgetProps = () => {
      switch (widgetId) {
        case 'cv': return { hasCV: data?.cv?.hasCV, progress: data?.cv?.progress }
        case 'jobSearch': return { savedCount: data?.jobs?.savedCount }
        case 'wellness': return { completedActivities: data?.wellness?.completedActivities, streakDays: data?.wellness?.streakDays, moodToday: data?.wellness?.moodToday ? String(data.wellness.moodToday) : null }
        case 'quests': return { completedQuests: data?.quests?.completed || 0, totalQuests: data?.quests?.total || 3, streakDays: data?.activity?.streakDays || 0 }
        case 'exercises': return {
          completedCount: data?.exercises?.completedExercises || 0,
          totalExercises: data?.exercises?.totalExercises || 38,
          completionRate: data?.exercises?.completionRate || 0
        }
        case 'knowledge': return {
          readCount: data?.knowledge?.readCount || 0,
          savedCount: data?.knowledge?.savedCount || 0,
          totalArticles: data?.knowledge?.totalArticles || 0
        }
        case 'interests': return {
          hasResult: data?.interest?.hasResult,
          topRecommendations: data?.interest?.topRecommendations || [],
          answeredQuestions: data?.interest?.answeredQuestions || 0,
          totalQuestions: data?.interest?.totalQuestions || 36
        }
        case 'calendar': return {
          upcomingEvents: data?.calendar?.upcomingEvents || 0,
          nextEvent: data?.calendar?.nextEvent || null,
          eventsThisWeek: data?.calendar?.eventsThisWeek || 0
        }
        case 'interview': return {
          completedSessions: data?.interview?.completedSessions || 0,
          averageScore: data?.interview?.averageScore || 0,
          lastPractice: data?.interview?.lastPractice || null
        }
        case 'linkedin': return {
          profileScore: data?.linkedin?.profileScore || 0,
          optimizedSections: data?.linkedin?.optimizedSections || 0,
          hasAnalysis: data?.linkedin?.hasAnalysis || false
        }
        case 'skills': return {
          analyzedSkills: data?.skills?.analyzedSkills || 0,
          gapCount: data?.skills?.gapCount || 0,
          matchScore: data?.skills?.matchScore || 0,
          hasAnalysis: data?.skills?.hasAnalysis || false
        }
        default: return {}
      }
    }

    return (
      <ErrorBoundary fallback={<div className="bg-white rounded-2xl border-2 border-slate-200 p-5"><p className="text-sm text-slate-500">Kunde inte ladda widget</p></div>}>
        <Suspense fallback={
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
            <div className="h-8 bg-slate-200 rounded w-1/2"></div>
          </div>
        }>
          <WidgetComponent {...getWidgetProps()} size={size} />
        </Suspense>
      </ErrorBoundary>
    )
  }

  // Loading state
  if (loading || !prefsLoaded) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-gradient-to-r from-slate-200 to-slate-300 rounded-2xl h-32" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl border-2 border-slate-200 p-5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
              <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // New user onboarding view
  if (showOnboarding) {
    return <NewUserOnboarding userName={user?.first_name} />
  }

  // Regular dashboard view
  return (
    <div className="space-y-6">
      {/* Improved Hero Section */}
      <AnimatedSection delay={100}>
        <HeroSection
          userName={user?.first_name}
          streakDays={data?.activity?.streakDays || 0}
          questsCompleted={data?.quests?.completed || 0}
          questsTotal={data?.quests?.total || 3}
          cvProgress={data?.cv?.progress || 0}
          nextAction={nextAction}
        />
      </AnimatedSection>

      {/* Primary Widgets - Larger cards for CV and Quests */}
      <AnimatedSection delay={150}>
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-violet-500" />
              Din progress
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CV Widget - Always show prominently */}
            {activeWidgets.includes('cv') && (
              <WidgetWrapper onRemove={() => removeWidget('cv')}>
                {renderWidget('cv', 'medium')}
              </WidgetWrapper>
            )}

            {/* Quests Widget - Always show prominently */}
            {activeWidgets.includes('quests') && (
              <WidgetWrapper onRemove={() => removeWidget('quests')}>
                {renderWidget('quests', 'medium')}
              </WidgetWrapper>
            )}
          </div>
        </section>
      </AnimatedSection>

      {/* Secondary Widgets Grid */}
      <AnimatedSection delay={200}>
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Dina verktyg</h2>
            <div className="flex items-center gap-2">
              {isSaving && (
                <span className="text-xs text-slate-400">Sparar...</span>
              )}
              <button
                onClick={() => setShowWidgetMenu(!showWidgetMenu)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  showWidgetMenu
                    ? "bg-violet-100 text-violet-700"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
                aria-label={showWidgetMenu ? "Stäng anpassningsmeny" : "Öppna anpassningsmeny"}
                aria-expanded={showWidgetMenu}
              >
                <Settings size={14} />
                <span>Anpassa</span>
                <ChevronDown size={14} className={cn("transition-transform", showWidgetMenu && "rotate-180")} />
              </button>
            </div>
          </div>

          {/* Widget selector menu */}
          {showWidgetMenu && (
            <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-sm text-slate-600 mb-3">Välj vilka verktyg du vill se:</p>
              <div className="flex flex-wrap gap-2">
                {ALL_WIDGETS.map(widget => {
                  const isActive = activeWidgets.includes(widget.id as WidgetId)
                  const Icon = widget.icon
                  return (
                    <button
                      key={widget.id}
                      onClick={() => isActive ? removeWidget(widget.id as WidgetId) : addWidget(widget.id as WidgetId)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                        isActive
                          ? "bg-violet-100 text-violet-700 border border-violet-200"
                          : "bg-white text-slate-600 border border-slate-200 hover:border-violet-200"
                      )}
                      aria-pressed={isActive}
                    >
                      <Icon size={14} />
                      {widget.label}
                      {isActive && <CheckCircle2 size={14} className="text-violet-600" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Widget grid - excluding cv and quests which are shown above */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeWidgets
              .filter(id => id !== 'cv' && id !== 'quests')
              .map(widgetId => (
                <WidgetWrapper key={widgetId} onRemove={() => removeWidget(widgetId)}>
                  {renderWidget(widgetId)}
                </WidgetWrapper>
              ))}

            {/* Add widget button */}
            <button
              onClick={() => setShowWidgetMenu(true)}
              className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-violet-300 hover:text-violet-500 hover:bg-violet-50/50 transition-all min-h-[140px]"
              aria-label="Lägg till nytt verktyg"
            >
              <Plus size={28} />
              <span className="text-sm font-medium">Lägg till</span>
            </button>
          </div>
        </section>
      </AnimatedSection>

      {/* Empty state */}
      {activeWidgets.length === 0 && (
        <AnimatedSection delay={250}>
          <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-violet-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Inga verktyg valda</h3>
            <p className="text-sm text-slate-500 mb-4">Klicka på "Anpassa" för att välja verktyg</p>
            <button
              onClick={() => setShowWidgetMenu(true)}
              className="px-6 py-2.5 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors"
            >
              Välj verktyg
            </button>
          </div>
        </AnimatedSection>
      )}
    </div>
  )
}
