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

type WidgetId = 'cv' | 'jobSearch' | 'wellness' | 'quests' | 'coverLetter' | 'applications' | 'career' | 'exercises' | 'knowledge' | 'diary' | 'interests'

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
  const { data, loading } = useDashboardData()
  
  // Default widgets
  const [activeWidgets, setActiveWidgets] = useState<WidgetId[]>(['cv', 'jobSearch', 'wellness', 'quests', 'coverLetter', 'applications', 'career', 'exercises', 'knowledge', 'diary', 'interests'])

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-48 mb-2" />
          <div className="h-4 bg-slate-200 rounded w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border-2 border-slate-200 p-5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
              <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const removeWidget = (widgetId: WidgetId) => {
    setActiveWidgets(activeWidgets.filter(id => id !== widgetId))
  }

  // Render widget based on ID with Suspense
  const renderWidget = (widgetId: WidgetId) => {
    const WidgetComponent = WIDGET_COMPONENTS[widgetId]
    
    const getWidgetProps = () => {
      switch (widgetId) {
        case 'cv': return { hasCV: data?.cv?.hasCV, progress: data?.cv?.progress }
        case 'jobSearch': return { savedCount: data?.jobs?.savedCount }
        case 'wellness': return { 
          completedActivities: data?.wellness?.completedActivities,
          streakDays: data?.wellness?.streakDays,
          moodToday: data?.wellness?.moodToday ? String(data.wellness.moodToday) : null
        }
        case 'quests': return { 
          completedQuests: data?.quests?.completed || 0, 
          totalQuests: data?.quests?.total || 3,
          streakDays: data?.activity?.streakDays || 0
        }
        case 'coverLetter': return { count: data?.coverLetters?.count || 0 }
        case 'applications': return { total: data?.applications?.total || 0 }
        case 'career': return { exploredCount: data?.interest?.hasResult ? 1 : 0 }
        case 'exercises': return { completedCount: data?.exercises?.completedExercises || 0 }
        case 'knowledge': return { readCount: data?.knowledge?.readCount || 0 }
        case 'diary': return { 
          upcomingEvents: data?.calendar?.upcomingEvents,
          eventsThisWeek: data?.calendar?.eventsThisWeek,
          hasConsultantMeeting: data?.calendar?.hasConsultantMeeting,
          streakDays: data?.activity?.streakDays
        }
        case 'interests': return { hasResult: data?.interest?.hasResult }
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
      {/* Välkomstsektion */}
      <AnimatedSection delay={100}>
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Hej{user?.first_name ? `, ${user.first_name}` : ''}! 👋
          </h1>
          <p className="text-violet-100">
            Välkommen till din personliga arbetsmarknadsportal.
          </p>
        </div>
      </AnimatedSection>

      {/* Widgets Grid */}
      <AnimatedSection delay={200}>
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            Dina verktyg
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeWidgets.map(widgetId => (
              <WidgetWrapper 
                key={widgetId} 
                onRemove={() => removeWidget(widgetId)}
              >
                {renderWidget(widgetId)}
              </WidgetWrapper>
            ))}
          </div>
        </section>
      </AnimatedSection>
    </div>
  )
}
