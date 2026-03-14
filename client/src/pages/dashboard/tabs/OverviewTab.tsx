import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LayoutDashboard, Zap, TrendingUp, Target, ChevronRight, Sparkles, Clock } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useDashboardData } from '@/hooks/useDashboardData'
import { QuestsWidget } from '@/components/dashboard/widgets/QuestsWidget'
import { CVWidget } from '@/components/dashboard/widgets/CVWidget'
import { JobSearchWidget } from '@/components/dashboard/widgets/JobSearchWidget'
import { WellnessWidget } from '@/components/dashboard/widgets/WellnessWidget'
import { NextStepCard } from '@/components/dashboard/NextStepCard'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { SkeletonStats, SkeletonWidgets, SkeletonNextStep, SkeletonHeader } from '@/components/dashboard/SkeletonWidget'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { cn } from '@/lib/utils'
import '@/styles/animations.css'

// Color system for consistent theming
const colorSystem = {
  cv: {
    primary: 'violet',
    bg: 'bg-violet-50',
    bgHover: 'hover:bg-violet-100',
    text: 'text-violet-700',
    textDark: 'text-violet-900',
    border: 'border-violet-200',
    borderHover: 'hover:border-violet-300',
    ring: 'focus:ring-violet-500',
    shadow: 'shadow-violet-100'
  },
  jobs: {
    primary: 'blue',
    bg: 'bg-blue-50',
    bgHover: 'hover:bg-blue-100',
    text: 'text-blue-700',
    textDark: 'text-blue-900',
    border: 'border-blue-200',
    borderHover: 'hover:border-blue-300',
    ring: 'focus:ring-blue-500',
    shadow: 'shadow-blue-100'
  },
  wellness: {
    primary: 'rose',
    bg: 'bg-rose-50',
    bgHover: 'hover:bg-rose-100',
    text: 'text-rose-700',
    textDark: 'text-rose-900',
    border: 'border-rose-200',
    borderHover: 'hover:border-rose-300',
    ring: 'focus:ring-rose-500',
    shadow: 'shadow-rose-100'
  },
  quests: {
    primary: 'amber',
    bg: 'bg-amber-50',
    bgHover: 'hover:bg-amber-100',
    text: 'text-amber-700',
    textDark: 'text-amber-900',
    border: 'border-amber-200',
    borderHover: 'hover:border-amber-300',
    ring: 'focus:ring-amber-500',
    shadow: 'shadow-amber-100'
  },
  emerald: {
    primary: 'emerald',
    bg: 'bg-emerald-50',
    bgHover: 'hover:bg-emerald-100',
    text: 'text-emerald-700',
    textDark: 'text-emerald-900',
    border: 'border-emerald-200',
    borderHover: 'hover:border-emerald-300',
    ring: 'focus:ring-emerald-500',
    shadow: 'shadow-emerald-100'
  }
}

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

export default function OverviewTab() {
  const { user } = useAuthStore()
  const { data, loading, error } = useDashboardData()
  const [widgetOrder, setWidgetOrder] = useState(['cv', 'jobs', 'wellness', 'quests'])
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null)

  // Loading state with staggered skeletons
  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonHeader />
        <SkeletonNextStep />
        <SkeletonStats count={4} />
        <div>
          <div className="h-6 bg-slate-200 rounded w-32 mb-4 animate-pulse" />
          <SkeletonWidgets count={4} />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 text-center animate-fade-in-up">
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

  // Drag and drop handlers
  const handleDragStart = (widgetId: string) => {
    setDraggedWidget(widgetId)
  }

  const handleDragOver = (e: React.DragEvent, targetWidget: string) => {
    e.preventDefault()
    if (draggedWidget && draggedWidget !== targetWidget) {
      const newOrder = [...widgetOrder]
      const draggedIdx = newOrder.indexOf(draggedWidget)
      const targetIdx = newOrder.indexOf(targetWidget)
      
      newOrder.splice(draggedIdx, 1)
      newOrder.splice(targetIdx, 0, draggedWidget)
      
      setWidgetOrder(newOrder)
    }
  }

  const handleDragEnd = () => {
    setDraggedWidget(null)
  }

  // Render widget based on type
  const renderWidget = (type: string) => {
    const widgetProps = {
      draggable: true,
      onDragStart: () => handleDragStart(type),
      onDragOver: (e: React.DragEvent) => handleDragOver(e, type),
      onDragEnd: handleDragEnd,
      className: cn(
        "transition-all duration-200",
        draggedWidget === type && "opacity-50 scale-105 rotate-1"
      )
    }

    switch (type) {
      case 'cv':
        return (
          <div key="cv" {...widgetProps}>
            <CVWidget 
              hasCV={data?.cv?.hasCV} 
              progress={data?.cv?.progress} 
              size="small" 
            />
          </div>
        )
      case 'jobs':
        return (
          <div key="jobs" {...widgetProps}>
            <JobSearchWidget 
              savedCount={data?.jobs?.savedCount} 
              size="small" 
            />
          </div>
        )
      case 'wellness':
        return (
          <div key="wellness" {...widgetProps}>
            <WellnessWidget 
              completedActivities={data?.wellness?.completedActivities}
              streakDays={data?.wellness?.streakDays}
              moodToday={data?.wellness?.moodToday}
              size="small" 
            />
          </div>
        )
      case 'quests':
        return (
          <div key="quests" {...widgetProps}>
            <QuestsWidget 
              completedQuests={data?.quests?.completed || 0} 
              totalQuests={data?.quests?.total || 3}
              streakDays={data?.activity?.streakDays || 0}
              size="small" 
            />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-8">
      {/* Header - Tydlig typografi */}
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
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
            )}
          >
            <Sparkles size={18} />
            <span className="hidden sm:inline">Mina insikter</span>
            <span className="sm:hidden">Insikter</span>
            <ChevronRight size={18} className="hidden sm:block" />
          </Link>
        </div>
      </AnimatedSection>

      {/* Nästa steg - Kollapsbar */}
      <AnimatedSection delay={100}>
        {data && <NextStepCard data={data} />}
      </AnimatedSection>

      {/* Quick Actions - Ny sektion! */}
      <AnimatedSection delay={200}>
        <QuickActions />
      </AnimatedSection>

      {/* Snabb-statistik - Förbättrad grid och typografi */}
      <AnimatedSection delay={300}>
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Din veckoöversikt
            </h2>
            <Link 
              to="/activity" 
              className="text-sm font-medium text-violet-600 hover:text-violet-700 flex items-center gap-1"
            >
              Se allt
              <ChevronRight size={16} />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickStat 
              icon={<Target size={20} />} 
              label="CV-progress" 
              value={`${data?.cv?.progress || 0}%`} 
              color="violet"
              trend={data?.cv?.progress === 100 ? 'Klar!' : undefined}
              delay={0}
            />
            <QuickStat 
              icon={<Zap size={20} />} 
              label="Sparade jobb" 
              value={data?.jobs?.savedCount || 0} 
              color="blue"
              delay={50}
            />
            <QuickStat 
              icon={<TrendingUp size={20} />} 
              label="Ansökningar" 
              value={data?.applications?.total || 0} 
              color="amber"
              delay={100}
            />
            <QuickStat 
              icon={<LayoutDashboard size={20} />} 
              label="Quests idag" 
              value={`${data?.quests?.completed || 0}/${data?.quests?.total || 3}`} 
              color="emerald"
              delay={150}
            />
          </div>
        </section>
      </AnimatedSection>

      {/* Widgets Grid - Drag & Drop */}
      <AnimatedSection delay={400}>
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Dina verktyg
            </h2>
            <p className="text-xs text-slate-500">
              Dra för att ordna
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {widgetOrder.map((widgetType) => renderWidget(widgetType))}
          </div>
        </section>
      </AnimatedSection>

      {/* Empty state if no data */}
      {!data?.cv?.hasCV && !data?.jobs?.savedCount && (
        <AnimatedSection delay={500}>
          <section className="pt-4">
            <EmptyState type="cv" />
          </section>
        </AnimatedSection>
      )}
    </div>
  )
}

interface QuickStatProps {
  icon: React.ReactNode
  label: string
  value: string | number
  color: 'violet' | 'blue' | 'amber' | 'emerald' | 'rose' | 'slate'
  trend?: string
  delay?: number
}

function QuickStat({ icon, label, value, color, trend, delay = 0 }: QuickStatProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  const colors = colorSystem[color as keyof typeof colorSystem] || colorSystem.violet
  
  return (
    <div 
      className={cn(
        "group bg-white p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300",
        "border-slate-200",
        "hover:border-slate-300 hover:shadow-xl hover:-translate-y-1",
        "focus-within:ring-2 focus-within:ring-violet-500 focus-within:ring-offset-2",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={cn(
        "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-200",
        colors.bg,
        colors.text,
        "group-hover:scale-110"
      )}>
        {icon}
      </div>
      <div className="flex items-baseline gap-2 flex-wrap">
        <p className="text-2xl sm:text-3xl font-bold text-slate-900">{value}</p>
        {trend && (
          <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", colors.bg, colors.text)}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-slate-500 mt-1">{label}</p>
    </div>
  )
}
