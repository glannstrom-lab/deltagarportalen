import { useState, useEffect, lazy, Suspense, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Settings, Plus, ChevronRight, Flame, Target,
  FileText, Briefcase, Heart, BookOpen, Sparkles, ArrowRight,
  CheckCircle2, Lightbulb, Zap, Star, X, GripVertical,
  Calendar, MessageSquare, Linkedin, BarChart3, Maximize2, Minimize2
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useDashboardDataQuery } from '@/hooks/useDashboardData'
import type { DashboardWidgetData } from '@/types/dashboard'
import { useClickOutside } from '@/hooks/useClickOutside'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

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

// Widget configuration
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
type WidgetSize = 'mini' | 'medium' | 'large'

interface WidgetConfig {
  id: WidgetId
  size: WidgetSize
}

// Widget categories for grouping
type WidgetCategory = 'profile' | 'jobsearch' | 'activity' | 'learning'

const WIDGET_CATEGORIES: Record<WidgetCategory, { label: string; order: number }> = {
  profile: { label: 'Din profil', order: 1 },
  jobsearch: { label: 'Jobbsökning', order: 2 },
  activity: { label: 'Daglig aktivitet', order: 3 },
  learning: { label: 'Lärande & utveckling', order: 4 },
}

const WIDGET_INFO: Record<WidgetId, { label: string; icon: React.ElementType; color: string; category: WidgetCategory }> = {
  cv: { label: 'CV', icon: FileText, color: 'violet', category: 'profile' },
  interests: { label: 'Intressen', icon: Sparkles, color: 'teal', category: 'profile' },
  skills: { label: 'Kompetens', icon: BarChart3, color: 'cyan', category: 'profile' },
  linkedin: { label: 'LinkedIn', icon: Linkedin, color: 'blue', category: 'profile' },
  jobSearch: { label: 'Jobbsök', icon: Briefcase, color: 'blue', category: 'jobsearch' },
  interview: { label: 'Intervju', icon: MessageSquare, color: 'indigo', category: 'jobsearch' },
  quests: { label: 'Quests', icon: Target, color: 'amber', category: 'activity' },
  wellness: { label: 'Välmående', icon: Heart, color: 'rose', category: 'activity' },
  calendar: { label: 'Kalender', icon: Calendar, color: 'rose', category: 'activity' },
  exercises: { label: 'Övningar', icon: Zap, color: 'emerald', category: 'learning' },
  knowledge: { label: 'Kunskap', icon: BookOpen, color: 'amber', category: 'learning' },
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'cv', size: 'large' },
  { id: 'interests', size: 'medium' },  // Strategically important for user journey
  { id: 'quests', size: 'medium' },
  { id: 'jobSearch', size: 'medium' },
  { id: 'wellness', size: 'mini' },
  { id: 'exercises', size: 'mini' },
]

// Get next recommended action
function getNextAction(data: DashboardWidgetData | undefined): {
  title: string
  description: string
  link: string
  icon: React.ElementType
  color: string
  buttonText: string
} | null {
  if (!data) return null

  if (!data.cv?.hasCV && (data.cv?.progress || 0) < 20) {
    return {
      title: 'Skapa ditt CV',
      description: 'Bygg ett professionellt CV som får arbetsgivare att uppmärksamma dig',
      link: '/cv',
      icon: FileText,
      color: 'violet',
      buttonText: 'Börja nu'
    }
  }

  if (data.cv?.hasCV && (data.cv?.progress || 0) < 80) {
    return {
      title: 'Slutför ditt CV',
      description: `Ditt CV är ${data.cv.progress}% klart. Lägg till mer information för bättre resultat`,
      link: '/cv',
      icon: FileText,
      color: 'violet',
      buttonText: 'Fortsätt'
    }
  }

  if ((data.jobs?.savedCount || 0) === 0) {
    return {
      title: 'Hitta ditt nästa jobb',
      description: 'Sök bland tusentals lediga tjänster och spara de som passar dig',
      link: '/job-search',
      icon: Briefcase,
      color: 'blue',
      buttonText: 'Sök jobb'
    }
  }

  if (!data.wellness?.moodToday) {
    return {
      title: 'Hur mår du idag?',
      description: 'Logga ditt humör för att följa ditt välmående över tid',
      link: '/wellness',
      icon: Heart,
      color: 'rose',
      buttonText: 'Logga humör'
    }
  }

  if (!data.interest?.hasResult) {
    return {
      title: 'Upptäck dina styrkor',
      description: 'Ta intressetestet och få personliga yrkesrekommendationer',
      link: '/interest-guide',
      icon: Sparkles,
      color: 'teal',
      buttonText: 'Starta test'
    }
  }

  return null
}

// Next Step Card Component
function NextStepCard({ action }: { action: ReturnType<typeof getNextAction> }) {
  if (!action) return null

  const Icon = action.icon

  return (
    <Link
      to={action.link}
      className={cn(
        "group block bg-white rounded-2xl border-2 p-5 transition-all duration-200",
        "hover:shadow-lg hover:-translate-y-0.5",
        action.color === 'violet' && "border-violet-200 hover:border-violet-300",
        action.color === 'blue' && "border-blue-200 hover:border-blue-300",
        action.color === 'rose' && "border-rose-200 hover:border-rose-300",
        action.color === 'teal' && "border-teal-200 hover:border-teal-300",
      )}
    >
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-3">
        <Lightbulb size={14} className="text-amber-500" />
        Nästa steg
      </div>

      <div className="flex items-center gap-4">
        <div className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0",
          action.color === 'violet' && "bg-violet-100 text-violet-600",
          action.color === 'blue' && "bg-blue-100 text-blue-600",
          action.color === 'rose' && "bg-rose-100 text-rose-600",
          action.color === 'teal' && "bg-teal-100 text-teal-600",
        )}>
          <Icon size={28} />
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-slate-800 mb-1">{action.title}</h2>
          <p className="text-sm text-slate-500 line-clamp-2">{action.description}</p>
        </div>

        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all",
          "group-hover:gap-3",
          action.color === 'violet' && "bg-violet-600 text-white",
          action.color === 'blue' && "bg-blue-600 text-white",
          action.color === 'rose' && "bg-rose-600 text-white",
          action.color === 'teal' && "bg-teal-600 text-white",
        )}>
          {action.buttonText}
          <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  )
}

// Compact Widget Selector with category grouping
function WidgetSelector({
  activeWidgets,
  onToggle,
  onClose
}: {
  activeWidgets: WidgetConfig[]
  onToggle: (id: WidgetId) => void
  onClose: () => void
}) {
  const activeIds = activeWidgets.map(w => w.id)

  // Group widgets by category
  const widgetsByCategory = Object.entries(WIDGET_INFO).reduce((acc, [id, info]) => {
    if (!acc[info.category]) acc[info.category] = []
    acc[info.category].push({ id: id as WidgetId, ...info })
    return acc
  }, {} as Record<WidgetCategory, Array<{ id: WidgetId; label: string; icon: React.ElementType; color: string; category: WidgetCategory }>>)

  return (
    <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Lägg till widgets</span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 rounded-lg"
          aria-label="Stäng widget-menyn"
        >
          <X size={14} className="text-slate-400" />
        </button>
      </div>
      <div className="space-y-3">
        {Object.entries(WIDGET_CATEGORIES)
          .sort(([, a], [, b]) => a.order - b.order)
          .map(([categoryKey, categoryInfo]) => {
            const categoryWidgets = widgetsByCategory[categoryKey as WidgetCategory] || []
            if (categoryWidgets.length === 0) return null

            return (
              <div key={categoryKey}>
                <p className="text-xs font-medium text-slate-400 mb-1.5 px-1">{categoryInfo.label}</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {categoryWidgets.map(({ id, label, icon: Icon }) => {
                    const isActive = activeIds.includes(id)
                    return (
                      <button
                        key={id}
                        onClick={() => onToggle(id)}
                        className={cn(
                          "flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium transition-all",
                          isActive
                            ? "bg-violet-100 text-violet-700 ring-1 ring-violet-200"
                            : "hover:bg-slate-50 text-slate-600"
                        )}
                        aria-label={isActive ? `Ta bort ${label} widget` : `Lägg till ${label} widget`}
                        aria-pressed={isActive}
                      >
                        <Icon size={16} aria-hidden="true" />
                        <span className="truncate w-full text-center">{label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}

// Draggable Widget Wrapper
function DraggableWidget({
  config,
  children,
  onRemove,
  onResize,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
  isEditing
}: {
  config: WidgetConfig
  children: React.ReactNode
  onRemove: () => void
  onResize: (size: WidgetSize) => void
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
  isDragging: boolean
  isEditing: boolean
}) {
  const sizes: WidgetSize[] = ['mini', 'medium', 'large']
  const currentIndex = sizes.indexOf(config.size)

  return (
    <div
      draggable={isEditing}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        "relative transition-all duration-200",
        config.size === 'mini' && "col-span-1",
        config.size === 'medium' && "col-span-1 sm:col-span-2",
        config.size === 'large' && "col-span-1 sm:col-span-2 lg:col-span-3",
        isDragging && "opacity-50 scale-95",
        isEditing && "cursor-grab active:cursor-grabbing"
      )}
    >
      {isEditing && (
        <div className="absolute -top-1 -left-1 -right-1 -bottom-1 border-2 border-dashed border-violet-300 rounded-2xl pointer-events-none z-0" />
      )}

      {isEditing && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-white rounded-full shadow-md border border-slate-200 px-2 py-1">
          <button
            onClick={() => onResize(sizes[Math.max(0, currentIndex - 1)])}
            disabled={currentIndex === 0}
            className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30 touch-manipulation active:scale-95 transition-transform"
            title="Mindre"
            aria-label="Minska widget-storlek"
          >
            <Minimize2 size={14} className="text-slate-500" aria-hidden="true" />
          </button>
          <span className="text-xs font-medium text-slate-400 px-1">{config.size}</span>
          <button
            onClick={() => onResize(sizes[Math.min(2, currentIndex + 1)])}
            disabled={currentIndex === 2}
            className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30 touch-manipulation active:scale-95 transition-transform"
            title="Större"
            aria-label="Öka widget-storlek"
          >
            <Maximize2 size={14} className="text-slate-500" aria-hidden="true" />
          </button>
        </div>
      )}

      {isEditing && (
        <>
          <button
            onClick={onRemove}
            className="absolute -top-3 -right-3 z-20 w-8 h-8 md:w-6 md:h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 active:scale-95 transition-all touch-manipulation"
            title="Ta bort"
            aria-label="Ta bort widget"
          >
            <X size={16} className="md:w-3 md:h-3" aria-hidden="true" />
          </button>
          <div
            className="absolute top-1/2 -left-4 -translate-y-1/2 z-20 p-2 bg-white rounded-xl shadow-md border border-slate-200 cursor-grab active:cursor-grabbing touch-manipulation"
            role="button"
            aria-label="Dra för att flytta widget"
            tabIndex={0}
          >
            <GripVertical size={16} className="text-slate-400" aria-hidden="true" />
          </div>
        </>
      )}

      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

// Onboarding for new users
function NewUserOnboarding({ userName }: { userName?: string }) {
  const steps = [
    { id: 1, title: 'Skapa ditt CV', description: 'Bygg ett professionellt CV', icon: FileText, link: '/cv', color: 'from-violet-500 to-purple-600' },
    { id: 2, title: 'Hitta jobb', description: 'Sök bland lediga tjänster', icon: Briefcase, link: '/job-search', color: 'from-blue-500 to-cyan-600' },
    { id: 3, title: 'Lär dig mer', description: 'Tips för jobbsökningen', icon: BookOpen, link: '/knowledge-base', color: 'from-amber-500 to-orange-600' },
  ]

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="text-xs font-medium text-white/70">Välkommen till Jobin</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Hej{userName ? `, ${userName}` : ''}! 👋</h1>
          <p className="text-white/80 text-sm">Kom igång med tre enkla steg.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {steps.map((step) => (
          <Link
            key={step.id}
            to={step.link}
            className="group relative bg-white rounded-xl p-4 border border-slate-200 hover:border-violet-300 hover:shadow-md transition-all"
          >
            <div className="absolute -top-2 -left-2 w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center text-xs font-bold">
              {step.id}
            </div>
            <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3", step.color)}>
              <step.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-slate-800 text-sm mb-0.5">{step.title}</h3>
            <p className="text-xs text-slate-500">{step.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function OverviewTab() {
  const { user } = useAuthStore()
  const { data, isLoading } = useDashboardDataQuery()
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS)
  const [showSelector, setShowSelector] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [prefsLoaded, setPrefsLoaded] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const selectorRef = useRef<HTMLDivElement>(null)

  const isNewUser = !data?.cv?.hasCV && (data?.cv?.progress || 0) < 10 && (data?.jobs?.savedCount || 0) === 0
  const nextAction = getNextAction(data)

  // Close selector on outside click
  useClickOutside(selectorRef, () => setShowSelector(false), showSelector)

  // Load preferences
  useEffect(() => {
    if (!user?.id || prefsLoaded) return

    const load = async () => {
      try {
        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('dashboard_widgets, dashboard_widget_config')
          .eq('user_id', user.id)
          .maybeSingle()

        if (prefs?.dashboard_widget_config) {
          setWidgets(prefs.dashboard_widget_config)
        } else if (prefs?.dashboard_widgets) {
          // Migrate old format
          setWidgets(prefs.dashboard_widgets.map((id: string) => ({ id, size: 'medium' as WidgetSize })))
        }
      } catch (err) {
        console.warn('Error loading preferences:', err)
      } finally {
        setPrefsLoaded(true)
      }
    }
    load()
  }, [user?.id, prefsLoaded])

  // Save preferences
  const savePreferences = useCallback(async (newWidgets: WidgetConfig[]) => {
    if (!user?.id) return
    setIsSaving(true)
    try {
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      const payload = {
        dashboard_widget_config: newWidgets,
        dashboard_widgets: newWidgets.map(w => w.id),
        updated_at: new Date().toISOString()
      }

      if (existing) {
        await supabase.from('user_preferences').update(payload).eq('user_id', user.id)
      } else {
        await supabase.from('user_preferences').insert({ user_id: user.id, ...payload })
      }
    } catch (err) {
      console.error('Error saving:', err)
    } finally {
      setIsSaving(false)
    }
  }, [user?.id])

  const toggleWidget = (id: WidgetId) => {
    const exists = widgets.find(w => w.id === id)
    const newWidgets = exists
      ? widgets.filter(w => w.id !== id)
      : [...widgets, { id, size: 'medium' as WidgetSize }]
    setWidgets(newWidgets)
    savePreferences(newWidgets)
  }

  const removeWidget = (index: number) => {
    const newWidgets = widgets.filter((_, i) => i !== index)
    setWidgets(newWidgets)
    savePreferences(newWidgets)
  }

  const resizeWidget = (index: number, size: WidgetSize) => {
    const newWidgets = [...widgets]
    newWidgets[index] = { ...newWidgets[index], size }
    setWidgets(newWidgets)
    savePreferences(newWidgets)
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newWidgets = [...widgets]
    const [dragged] = newWidgets.splice(draggedIndex, 1)
    newWidgets.splice(index, 0, dragged)
    setWidgets(newWidgets)
    setDraggedIndex(index)
  }

  const handleDrop = () => {
    setDraggedIndex(null)
    savePreferences(widgets)
  }

  const getWidgetProps = (id: WidgetId) => {
    switch (id) {
      case 'cv': return { hasCV: data?.cv?.hasCV, progress: data?.cv?.progress || 0 }
      case 'jobSearch': return { savedCount: data?.jobs?.savedCount || 0, newMatches: data?.jobs?.newMatches || 0 }
      case 'wellness': return {
        completedActivities: data?.wellness?.completedActivities || 0,
        streakDays: data?.wellness?.streakDays || 0,
        moodToday: data?.wellness?.moodToday ? String(data.wellness.moodToday) : null
      }
      case 'quests': return {
        completedQuests: data?.quests?.completed || 0,
        totalQuests: data?.quests?.total || 3,
        streakDays: data?.activity?.streakDays || 0
      }
      case 'exercises': return {
        completedCount: data?.exercises?.completedExercises || 0,
        totalExercises: data?.exercises?.totalExercises || 38,
        completionRate: data?.exercises?.completionRate || 0,
        streakDays: data?.exercises?.streakDays || 0
      }
      case 'knowledge': return {
        readCount: data?.knowledge?.readCount || 0,
        savedCount: data?.knowledge?.savedCount || 0,
        totalArticles: data?.knowledge?.totalArticles || 50
      }
      case 'interests': return {
        hasResult: data?.interest?.hasResult || false,
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
        averageScore: data?.interview?.averageScore || 0
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

  const renderWidget = (config: WidgetConfig) => {
    const Component = WIDGET_COMPONENTS[config.id]
    const props = getWidgetProps(config.id)

    return (
      <ErrorBoundary fallback={<div className="bg-white rounded-xl border border-slate-200 p-4 text-sm text-slate-500">Fel vid laddning</div>}>
        <Suspense fallback={
          <div className={cn(
            "bg-white rounded-xl border border-slate-200 animate-pulse",
            config.size === 'mini' && "h-20",
            config.size === 'medium' && "h-32",
            config.size === 'large' && "h-48"
          )}>
            <div className="p-4">
              <div className="h-3 bg-slate-200 rounded w-1/3 mb-2" />
              <div className="h-5 bg-slate-200 rounded w-1/2" />
            </div>
          </div>
        }>
          <Component {...props} size={config.size} />
        </Suspense>
      </ErrorBoundary>
    )
  }

  // Loading
  if (isLoading || !prefsLoaded) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse col-span-2" />
          ))}
        </div>
      </div>
    )
  }

  // New user
  if (isNewUser) {
    return <NewUserOnboarding userName={user?.first_name} />
  }

  return (
    <div className="space-y-4">
      {/* Next Step Card */}
      {nextAction && <NextStepCard action={nextAction} />}

      {/* Quick Stats Bar */}
      <div className="flex items-center gap-3 text-sm">
        {(data?.activity?.streakDays || 0) > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full border border-orange-200">
            <Flame size={14} className="text-orange-500" />
            <span className="font-medium">{data?.activity?.streakDays} dagar i rad</span>
          </div>
        )}
        {(data?.quests?.completed || 0) > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
            <Target size={14} className="text-amber-500" />
            <span className="font-medium">{data?.quests?.completed}/{data?.quests?.total || 3} quests</span>
          </div>
        )}
        {(data?.cv?.progress || 0) >= 100 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span className="font-medium">CV klart</span>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isSaving && <span className="text-xs text-slate-400">Sparar...</span>}
        </div>
        <div className="flex items-center gap-2 relative" ref={selectorRef}>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              isEditing ? "bg-violet-100 text-violet-700" : "text-slate-500 hover:bg-slate-100"
            )}
            aria-label={isEditing ? 'Avsluta redigering av widgets' : 'Redigera widgets'}
            aria-pressed={isEditing}
          >
            <Settings size={14} aria-hidden="true" />
            {isEditing ? 'Klar' : 'Redigera'}
          </button>
          <button
            onClick={() => setShowSelector(!showSelector)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 transition-all"
            aria-label="Lägg till widget"
            aria-expanded={showSelector}
            aria-haspopup="true"
          >
            <Plus size={14} aria-hidden="true" />
            Lägg till
          </button>
          {showSelector && (
            <WidgetSelector
              activeWidgets={widgets}
              onToggle={toggleWidget}
              onClose={() => setShowSelector(false)}
            />
          )}
        </div>
      </div>

      {/* Widget Grid - Grouped by category when not editing */}
      {isEditing ? (
        // Flat grid when editing (for drag-and-drop)
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {widgets.map((config, index) => (
            <DraggableWidget
              key={`${config.id}-${index}`}
              config={config}
              onRemove={() => removeWidget(index)}
              onResize={(size) => resizeWidget(index, size)}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={handleDrop}
              isDragging={draggedIndex === index}
              isEditing={isEditing}
            >
              {renderWidget(config)}
            </DraggableWidget>
          ))}
        </div>
      ) : (
        // Grouped by category when viewing
        <div className="space-y-6">
          {Object.entries(WIDGET_CATEGORIES)
            .sort(([, a], [, b]) => a.order - b.order)
            .map(([categoryKey, categoryInfo]) => {
              const categoryWidgets = widgets.filter(
                w => WIDGET_INFO[w.id].category === categoryKey
              )
              if (categoryWidgets.length === 0) return null

              return (
                <section key={categoryKey}>
                  <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">
                    {categoryInfo.label}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    {categoryWidgets.map((config) => {
                      const index = widgets.findIndex(w => w.id === config.id)
                      return (
                        <DraggableWidget
                          key={`${config.id}-${index}`}
                          config={config}
                          onRemove={() => removeWidget(index)}
                          onResize={(size) => resizeWidget(index, size)}
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={handleDrop}
                          isDragging={draggedIndex === index}
                          isEditing={isEditing}
                        >
                          {renderWidget(config)}
                        </DraggableWidget>
                      )
                    })}
                  </div>
                </section>
              )
            })}
        </div>
      )}

      {widgets.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm text-slate-500 mb-3">Inga widgets ännu</p>
          <button
            onClick={() => setShowSelector(true)}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
          >
            Lägg till widgets
          </button>
        </div>
      )}
    </div>
  )
}
