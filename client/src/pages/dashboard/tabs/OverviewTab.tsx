import { useState, useEffect } from 'react'
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
import { QuestsWidget } from '@/components/dashboard/widgets/QuestsWidget'
import { CVWidget } from '@/components/dashboard/widgets/CVWidget'
import { JobSearchWidget } from '@/components/dashboard/widgets/JobSearchWidget'
import { WellnessWidget } from '@/components/dashboard/widgets/WellnessWidget'
import { NextStepCard } from '@/components/dashboard/NextStepCard'
import { SkeletonWidgets, SkeletonNextStep, SkeletonHeader } from '@/components/dashboard/SkeletonWidget'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { cn } from '@/lib/utils'
import '@/styles/animations.css'

// Alla tillgängliga widget-typer
const ALL_WIDGETS = [
  { id: 'cv', label: 'CV', component: CVWidget },
  { id: 'jobSearch', label: 'Jobbsök', component: JobSearchWidget },
  { id: 'wellness', label: 'Välmående', component: WellnessWidget },
  { id: 'quests', label: 'Quests', component: QuestsWidget },
  { id: 'coverLetter', label: 'Personligt brev', component: CoverLetterWidget },
  { id: 'applications', label: 'Ansökningar', component: ApplicationsWidget },
  { id: 'career', label: 'Karriär', component: CareerWidget },
  { id: 'exercises', label: 'Övningar', component: ExercisesWidget },
  { id: 'knowledge', label: 'Kunskapsbank', component: KnowledgeWidget },
  { id: 'diary', label: 'Dagbok', component: DiaryWidget },
  { id: 'interests', label: 'Intressen', component: InterestsWidget },
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

  // Render widget based on ID
  const renderWidget = (widgetId: WidgetId) => {
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
      diary: { entriesCount: data?.calendar?.upcomingEvents?.length || 0 },
      interests: { hasResult: data?.interest?.hasResult },
    }

    switch (widgetId) {
      case 'cv':
        return <CVWidget {...widgetData.cv} size="small" />
      case 'jobSearch':
        return <JobSearchWidget {...widgetData.jobSearch} size="small" />
      case 'wellness':
        return <WellnessWidget {...widgetData.wellness} size="small" />
      case 'quests':
        return <QuestsWidget {...widgetData.quests} size="small" />
      case 'coverLetter':
        return <CoverLetterWidget count={widgetData.coverLetter.count} size="small" />
      case 'applications':
        return <ApplicationsWidget total={widgetData.applications.total} size="small" />
      case 'career':
        return <CareerWidget exploredCount={widgetData.career.exploredCount} size="small" />
      case 'exercises':
        return <ExercisesWidget completedCount={widgetData.exercises.completedCount} size="small" />
      case 'knowledge':
        return <KnowledgeWidget readCount={widgetData.knowledge.readCount} size="small" />
      case 'diary':
        return <DiaryWidget entriesCount={widgetData.diary.entriesCount} size="small" />
      case 'interests':
        return <InterestsWidget hasResult={widgetData.interests.hasResult} size="small" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <AnimatedSection delay={0}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Hej, {user?.firstName || 'där'}!
            </h1>
            <p className="text-base text-slate-500 mt-1">
              Här är din översikt för idag
            </p>
          </div>
          <Link 
            to="/insights" 
            className={cn(
              "inline-flex items-center justify-center gap-2 px-5 py-2.5",
              "bg-violet-100 text-violet-700 rounded-xl",
              "text-sm font-semibold",
              "hover:bg-violet-200 hover:shadow-lg hover:-translate-y-0.5",
              "transition-all duration-200"
            )}
          >
            <Sparkles size={18} />
            <span className="hidden sm:inline">Mina insikter</span>
            <span className="sm:hidden">Insikter</span>
            <ChevronRight size={18} className="hidden sm:block" />
          </Link>
        </div>
      </AnimatedSection>

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

// Placeholder widgets for pages that don't have widgets yet
function CoverLetterWidget({ count, size }: { count: number, size: string }) {
  return (
    <Link to="/cover-letter" className="block bg-white p-5 rounded-2xl border-2 border-slate-200 hover:border-rose-300 hover:shadow-lg transition-all group">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
          <span className="text-lg">✉️</span>
        </div>
        <h3 className="font-semibold text-slate-800">Personligt brev</h3>
      </div>
      <p className="text-2xl font-bold text-slate-900">{count}</p>
      <p className="text-sm text-slate-500">sparade brev</p>
    </Link>
  )
}

function ApplicationsWidget({ total, size }: { total: number, size: string }) {
  return (
    <Link to="/job-tracker" className="block bg-white p-5 rounded-2xl border-2 border-slate-200 hover:border-amber-300 hover:shadow-lg transition-all group">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
          <span className="text-lg">📋</span>
        </div>
        <h3 className="font-semibold text-slate-800">Ansökningar</h3>
      </div>
      <p className="text-2xl font-bold text-slate-900">{total}</p>
      <p className="text-sm text-slate-500">aktiva ansökningar</p>
    </Link>
  )
}

function CareerWidget({ exploredCount, size }: { exploredCount: number, size: string }) {
  return (
    <Link to="/career" className="block bg-white p-5 rounded-2xl border-2 border-slate-200 hover:border-teal-300 hover:shadow-lg transition-all group">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center">
          <span className="text-lg">🎯</span>
        </div>
        <h3 className="font-semibold text-slate-800">Karriär</h3>
      </div>
      <p className="text-2xl font-bold text-slate-900">{exploredCount}</p>
      <p className="text-sm text-slate-500">utforskade yrken</p>
    </Link>
  )
}

function ExercisesWidget({ completedCount, size }: { completedCount: number, size: string }) {
  return (
    <Link to="/exercises" className="block bg-white p-5 rounded-2xl border-2 border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all group">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
          <span className="text-lg">💪</span>
        </div>
        <h3 className="font-semibold text-slate-800">Övningar</h3>
      </div>
      <p className="text-2xl font-bold text-slate-900">{completedCount}</p>
      <p className="text-sm text-slate-500">genomförda övningar</p>
    </Link>
  )
}

function KnowledgeWidget({ readCount, size }: { readCount: number, size: string }) {
  return (
    <Link to="/knowledge-base" className="block bg-white p-5 rounded-2xl border-2 border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all group">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
          <span className="text-lg">📚</span>
        </div>
        <h3 className="font-semibold text-slate-800">Kunskapsbank</h3>
      </div>
      <p className="text-2xl font-bold text-slate-900">{readCount}</p>
      <p className="text-sm text-slate-500">lästa artiklar</p>
    </Link>
  )
}

function DiaryWidget({ entriesCount, size }: { entriesCount: number, size: string }) {
  return (
    <Link to="/diary" className="block bg-white p-5 rounded-2xl border-2 border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all group">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
          <span className="text-lg">📝</span>
        </div>
        <h3 className="font-semibold text-slate-800">Dagbok</h3>
      </div>
      <p className="text-2xl font-bold text-slate-900">{entriesCount}</p>
      <p className="text-sm text-slate-500">anteckningar</p>
    </Link>
  )
}

function InterestsWidget({ hasResult, size }: { hasResult: boolean, size: string }) {
  return (
    <Link to="/interest-guide" className="block bg-white p-5 rounded-2xl border-2 border-slate-200 hover:border-cyan-300 hover:shadow-lg transition-all group">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center">
          <span className="text-lg">💡</span>
        </div>
        <h3 className="font-semibold text-slate-800">Intressen</h3>
      </div>
      <p className="text-lg font-bold text-slate-900">{hasResult ? 'Genomförd' : 'Ej gjord'}</p>
      <p className="text-sm text-slate-500">intresseguide</p>
    </Link>
  )
}
