import { useState, useEffect, lazy, Suspense } from 'react'
import { Settings, ChevronDown, Plus } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useDashboardData } from '@/hooks/useDashboardData'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { cn } from '@/lib/utils'
import '@/styles/animations.css'

// Lazy load widgets - ENDAST de som fungerar
const CVWidget = lazy(() => import('@/components/dashboard/widgets/CVWidget'))
const JobSearchWidget = lazy(() => import('@/components/dashboard/widgets/JobSearchWidget'))
const WellnessWidget = lazy(() => import('@/components/dashboard/widgets/WellnessWidget'))
const QuestsWidget = lazy(() => import('@/components/dashboard/widgets/QuestsWidget'))
const ExercisesWidget = lazy(() => import('@/components/dashboard/widgets/ExercisesWidget'))
const KnowledgeWidget = lazy(() => import('@/components/dashboard/widgets/KnowledgeWidget'))
const InterestWidget = lazy(() => import('@/components/dashboard/widgets/InterestWidget'))

// Widget map - 7 fungerande widgets
const WIDGET_COMPONENTS = {
  cv: CVWidget,
  jobSearch: JobSearchWidget,
  wellness: WellnessWidget,
  quests: QuestsWidget,
  exercises: ExercisesWidget,
  knowledge: KnowledgeWidget,
  interests: InterestWidget,
}

type WidgetId = keyof typeof WIDGET_COMPONENTS

const ALL_WIDGETS = [
  { id: 'cv', label: 'CV' },
  { id: 'jobSearch', label: 'Jobbsök' },
  { id: 'wellness', label: 'Välmående' },
  { id: 'quests', label: 'Quests' },
  { id: 'exercises', label: 'Övningar' },
  { id: 'knowledge', label: 'Kunskapsbank' },
  { id: 'interests', label: 'Intressen' },
] as const

// Animation wrapper
function AnimatedSection({ children, delay = 0, className }: { children: React.ReactNode, delay?: number, className?: string }) {
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div className={cn(className, "transition-all duration-500", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5")} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

// Widget wrapper
function WidgetWrapper({ children, onRemove }: { children: React.ReactNode, onRemove?: () => void }) {
  return (
    <div className="relative group">
      {onRemove && (
        <button 
          onClick={onRemove} 
          className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-200 md:opacity-0 opacity-100" 
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
  const [activeWidgets, setActiveWidgets] = useState<WidgetId[]>(['cv', 'jobSearch', 'wellness', 'quests'])
  const [showWidgetMenu, setShowWidgetMenu] = useState(false)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-48 mb-2" />
          <div className="h-4 bg-slate-200 rounded w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

  const addWidget = (widgetId: WidgetId) => {
    if (!activeWidgets.includes(widgetId)) {
      setActiveWidgets([...activeWidgets, widgetId])
    }
  }

  const removeWidget = (widgetId: WidgetId) => {
    setActiveWidgets(activeWidgets.filter(id => id !== widgetId))
  }

  const renderWidget = (widgetId: WidgetId) => {
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
        default: return {}
      }
    }

    return (
      <ErrorBoundary fallback={<div className="bg-white rounded-2xl border-2 border-slate-200 p-5"><p className="text-sm text-slate-500">Kunde inte ladda widget</p></div>}>
        <Suspense fallback={<div className="bg-white rounded-2xl border-2 border-slate-200 p-5 animate-pulse"><div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div><div className="h-8 bg-slate-200 rounded w-1/2"></div></div>}>
          <WidgetComponent {...getWidgetProps()} size="small" />
        </Suspense>
      </ErrorBoundary>
    )
  }

  return (
    <div className="space-y-8">
      {/* Välkomstsektion */}
      <AnimatedSection delay={100}>
        <div className="bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
          <h1 className="text-2xl font-bold mb-2 drop-shadow-sm">Hej{user?.first_name ? `, ${user.first_name}` : ''}! 👋</h1>
          <p className="text-white/90 font-medium drop-shadow-sm">Välkommen till din personliga arbetsmarknadsportal.</p>
        </div>
      </AnimatedSection>

      {/* Widgets Grid */}
      <AnimatedSection delay={200}>
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Dina verktyg</h2>
            <button 
              onClick={() => setShowWidgetMenu(!showWidgetMenu)} 
              className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white border-2 border-slate-200 text-slate-700 hover:border-violet-300 hover:text-violet-700 transition-all")}
              aria-label={showWidgetMenu ? "Stäng anpassningsmeny" : "Öppna anpassningsmeny"}
              aria-expanded={showWidgetMenu}
            >
              <Settings size={16} aria-hidden="true" />
              <span>Anpassa</span>
              <ChevronDown size={16} className={cn("transition-transform", showWidgetMenu && "rotate-180")} aria-hidden="true" />
            </button>
          </div>

          {showWidgetMenu && (
            <div className="mb-6 p-4 bg-slate-50 rounded-2xl border-2 border-slate-200">
              <p className="text-sm text-slate-600 mb-3">Välj vilka verktyg du vill se:</p>
              <div className="flex flex-wrap gap-2">
                {ALL_WIDGETS.map(widget => {
                  const isActive = activeWidgets.includes(widget.id as WidgetId)
                  return (
                    <button 
                      key={widget.id} 
                      onClick={() => isActive ? removeWidget(widget.id as WidgetId) : addWidget(widget.id as WidgetId)} 
                      className={cn("px-4 py-2 rounded-xl text-sm font-medium transition-all", isActive ? "bg-violet-100 text-violet-700 border-2 border-violet-200" : "bg-white text-slate-600 border-2 border-slate-200 hover:border-violet-200")}
                      aria-label={isActive ? `Ta bort ${widget.label}` : `Lägg till ${widget.label}`}
                      aria-pressed={isActive}
                    >
                      {isActive ? '✓ ' : '+ '}{widget.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeWidgets.map(widgetId => (
              <WidgetWrapper key={widgetId} onRemove={() => removeWidget(widgetId)}>{renderWidget(widgetId)}</WidgetWrapper>
            ))}
            
            <button 
              onClick={() => setShowWidgetMenu(true)} 
              className={cn("flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-violet-300 hover:text-violet-500 transition-all min-h-[160px]")}
              aria-label="Lägg till nytt verktyg"
            >
              <Plus size={32} aria-hidden="true" />
              <span className="text-sm font-medium">Lägg till verktyg</span>
            </button>
          </div>
        </section>
      </AnimatedSection>

      {activeWidgets.length === 0 && (
        <AnimatedSection delay={300}>
          <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Inga verktyg valda</h3>
            <p className="text-sm text-slate-500 mb-4">Klicka på "Anpassa" för att välja verktyg</p>
            <button 
              onClick={() => setShowWidgetMenu(true)} 
              className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700"
              aria-label="Öppna verktygsmeny"
            >Välj verktyg</button>
          </div>
        </AnimatedSection>
      )}
    </div>
  )
}
