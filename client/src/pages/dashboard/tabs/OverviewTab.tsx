import { useState, useEffect, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { 
  LayoutDashboard, 
  ChevronRight, 
  Sparkles, 
  Settings,
  ChevronDown,
  Plus
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useDashboardData } from '@/hooks/useDashboardData'
import { NextStepCard } from '@/components/dashboard/NextStepCard'
import { SkeletonWidgets, SkeletonNextStep } from '@/components/dashboard/SkeletonWidget'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { cn } from '@/lib/utils'
import '@/styles/animations.css'

// Lazy load widgets for better performance
const CVWidget = lazy(() => import('@/components/dashboard/widgets/CVWidget'))
const JobSearchWidget = lazy(() => import('@/components/dashboard/widgets/JobSearchWidget'))
const WellnessWidget = lazy(() => import('@/components/dashboard/widgets/WellnessWidget'))
const QuestsWidget = lazy(() => import('@/components/dashboard/widgets/QuestsWidget'))
const CoverLetterWidget = lazy(() => import('@/components/dashboard/widgets/CoverLetterWidget'))
const ApplicationsWidget = lazy(() => import('@/components/dashboard/widgets/ApplicationsWidget'))
const CareerWidget = lazy(() => import('@/components/dashboard/widgets/CareerWidget'))
const ExercisesWidget = lazy(() => import('@/components/dashboard/widgets/ExercisesWidget'))
const KnowledgeWidget = lazy(() => import('@/components/dashboard/widgets/KnowledgeWidget'))
const DiaryWidget = lazy(() => import('@/components/dashboard/widgets/DiaryWidget'))
const InterestWidget = lazy(() => import('@/components/dashboard/widgets/InterestWidget'))

// Widget lazy loading map
const WIDGET_COMPONENTS = {
  cv: CVWidget,
  jobSearch: JobSearchWidget,
  wellness: WellnessWidget,
  quests: QuestsWidget,
  coverLetter: CoverLetterWidget,
  applications: ApplicationsWidget,
  career: CareerWidget,
  exercises: ExercisesWidget,
  knowledge: KnowledgeWidget,
  diary: DiaryWidget,
  interests: InterestWidget,
}

// Alla tillgängliga widget-typer
const ALL_WIDGETS = [
  { id: 'cv', label: 'CV' },
  { id: 'jobSearch', label: 'Jobbsök' },
  { id: 'wellness', label: 'Välmående' },
  { id: 'quests', label: 'Quests' },
  { id: 'coverLetter', label: 'Personligt brev' },
  { id: 'applications', label: 'Ansökningar' },
  { id: 'career', label: 'Karriär' },
  { id: 'exercises', label: 'Övningar' },
  { id: 'knowledge', label: 'Kunskapsbank' },
  { id: 'diary', label: 'Dagbok' },
  { id: 'interests', label: 'Intressen' },
] as const

type WidgetId = typeof ALL_WIDGETS[number]['id']

// Animation wrapper component
function AnimatedSection({ 
  children, 
  delay = 0, 
  className 
}: { 
  children: React.ReactNode
  delay?: number
  className?: string 
}) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div 
      className={cn(
        className,
        "transition-all duration-500",
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-5"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

// Widget wrapper component
function WidgetWrapper({ 
  children, 
  onRemove 
}: { 
  children: React.ReactNode
  onRemove?: () => void 
}) {
  return (
    <div className="relative group">
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-rose-100 text-rose-600 rounded-full 
                     flex items-center justify-center opacity-0 group-hover:opacity-100 
                     transition-opacity hover:bg-rose-200"
          title="Ta bort widget"
        >
          ×
        </button>
      )}
      {children}
    </div>
  )
}

export default function OverviewTab() {
  const { user } = useAuthStore()
  const { data, loading, error } = useDashboardData()
  
  // Default widgets som visas
  const [activeWidgets, setActiveWidgets] = useState<WidgetId[]>(['cv', 'jobSearch', 'wellness', 'quests'])
  const [showWidgetMenu, setShowWidgetMenu] = useState(false)

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonHeader />
        <SkeletonNextStep />
        <SkeletonWidgets count={4} />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">😕</span>
          </div>
          <h3 className="text-lg font-semibold text-rose-900 mb-2">
            Något gick fel
          </h3>
          <p className="text-sm text-rose-700 mb-4">
            Vi kunde inte ladda din översikt. Försök igen om en stund.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 transition-colors"
          >
            Ladda om sidan
          </button>
        </div>
      </div>
    )
  }

  const addWidget = (widgetId: WidgetId) => {
    if (!activeWidgets.includes(widgetId)) {
      setActiveWidgets([...activeWidgets, widgetId])
    }
  }

  const removeWidget = (widgetId: WidgetId) => {
    setActiveWidgets(activeWidgets.filter(id => id !== widgetId))
  }

  // Render widget based on ID with Suspense
  const renderWidget = (widgetId: WidgetId) => {
    const WidgetComponent = WIDGET_COMPONENTS[widgetId]
    const widgetData = {
      cv: { hasCV: data?.cv?.hasCV, progress: data?.cv?.progress },
      jobSearch: { savedCount: data?.jobs?.savedCount },
      wellness: { 
        completedActivities: data?.wellness?.completedActivities,
        streakDays: data?.wellness?.streakDays,
        moodToday: data?.wellness?.moodToday ? String(data.wellness.moodToday) : null
      },
      quests: { 
        completedQuests: data?.quests?.completed || 0, 
        totalQuests: data?.quests?.total || 3,
        streakDays: data?.activity?.streakDays || 0
      },
      coverLetter: { count: data?.coverLetters?.count || 0 },
      applications: { total: data?.applications?.total || 0 },
      career: { exploredCount: data?.interest?.hasResult ? 1 : 0 },
      exercises: { completedCount: data?.exercises?.completedExercises || 0 },
      knowledge: { readCount: data?.knowledge?.readCount || 0 },
      diary: { 
        upcomingEvents: data?.calendar?.upcomingEvents,
        eventsThisWeek: data?.calendar?.eventsThisWeek,
        hasConsultantMeeting: data?.calendar?.hasConsultantMeeting,
        streakDays: data?.activity?.streakDays
      },
      interests: { hasResult: data?.interest?.hasResult },
    }

    const getWidgetProps = () => {
      switch (widgetId) {
        case 'cv': return widgetData.cv
        case 'jobSearch': return widgetData.jobSearch
        case 'wellness': return widgetData.wellness
        case 'quests': return widgetData.quests
        case 'coverLetter': return { count: widgetData.coverLetter.count }
        case 'applications': return { total: widgetData.applications.total }
        case 'career': return { exploredCount: widgetData.career.exploredCount }
        case 'exercises': return { completedCount: widgetData.exercises.completedCount }
        case 'knowledge': return { readCount: widgetData.knowledge.readCount }
        case 'diary': return { 
        upcomingEvents: data?.calendar?.upcomingEvents,
        eventsThisWeek: data?.calendar?.eventsThisWeek,
        hasConsultantMeeting: data?.calendar?.hasConsultantMeeting,
        streakDays: data?.activity?.streakDays
      }
        case 'interests': return { hasResult: widgetData.interests.hasResult }
        default: return {}
      }
    }

    return (
      <ErrorBoundary fallback={
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-5">
          <p className="text-sm text-slate-500">Kunde inte ladda widget</p>
        </div>
      }>
        <Suspense fallback={
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
            <div className="h-8 bg-slate-200 rounded w-1/2"></div>
          </div>
        }>
          <WidgetComponent {...getWidgetProps()} size="small" />
        </Suspense>
      </ErrorBoundary>
    )
  }

  return (
    <div className="space-y-8">
      {/* Nästa steg - Kollapsad som standard */}
      <AnimatedSection delay={100}>
        {data && <NextStepCard data={data} />}
      </AnimatedSection>

      {/* Widgets Grid med expanderbar meny */}
      <AnimatedSection delay={200}>
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Dina verktyg
            </h2>
            <button
              onClick={() => setShowWidgetMenu(!showWidgetMenu)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium",
                "bg-white border-2 border-slate-200 text-slate-700",
                "hover:border-violet-300 hover:text-violet-700",
                "transition-all duration-200"
              )}
            >
              <Settings size={16} />
              <span>Anpassa</span>
              <ChevronDown 
                size={16} 
                className={cn("transition-transform", showWidgetMenu && "rotate-180")} 
              />
            </button>
          </div>

          {/* Expanderbar meny för att välja widgets */}
          {showWidgetMenu && (
            <div className="mb-6 p-4 bg-slate-50 rounded-2xl border-2 border-slate-200">
              <p className="text-sm text-slate-600 mb-3">
                Välj vilka verktyg du vill se:
              </p>
              <div className="flex flex-wrap gap-2">
                {ALL_WIDGETS.map(widget => {
                  const isActive = activeWidgets.includes(widget.id)
                  return (
                    <button
                      key={widget.id}
                      onClick={() => isActive ? removeWidget(widget.id) : addWidget(widget.id)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                        isActive 
                          ? "bg-violet-100 text-violet-700 border-2 border-violet-200" 
                          : "bg-white text-slate-600 border-2 border-slate-200 hover:border-violet-200"
                      )}
                    >
                      {isActive ? '✓ ' : '+ '}{widget.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          
          {/* Widgets Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeWidgets.map(widgetId => (
              <WidgetWrapper 
                key={widgetId} 
                onRemove={() => removeWidget(widgetId)}
              >
                {renderWidget(widgetId)}
              </WidgetWrapper>
            ))}
            
            {/* Add widget placeholder */}
            <button
              onClick={() => setShowWidgetMenu(true)}
              className={cn(
                "flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed",
                "border-slate-300 text-slate-400 hover:border-violet-300 hover:text-violet-500",
                "transition-all duration-200 min-h-[160px]"
              )}
            >
              <Plus size={32} />
              <span className="text-sm font-medium">Lägg till verktyg</span>
            </button>
          </div>
        </section>
      </AnimatedSection>

      {/* Empty state if no widgets */}
      {activeWidgets.length === 0 && (
        <AnimatedSection delay={300}>
          <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <LayoutDashboard size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              Inga verktyg valda
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Klicka på "Anpassa" för att välja vilka verktyg du vill se här
            </p>
            <button
              onClick={() => setShowWidgetMenu(true)}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors"
            >
              Välj verktyg
            </button>
          </div>
        </AnimatedSection>
      )}

      {/* Empty state if no data */}
      {!data?.cv?.hasCV && !data?.jobs?.savedCount && (
        <AnimatedSection delay={400}>
          <section className="pt-4">
            <EmptyState type="cv" />
          </section>
        </AnimatedSection>
      )}
    </div>
  )
}

// Widgets are imported lazily from @/components/dashboard/widgets/
