import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutDashboard, Zap, TrendingUp, Target, ChevronRight, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useDashboardData } from '@/hooks/useDashboardData'
import { QuestsWidget } from '@/components/dashboard/widgets/QuestsWidget'
import { CVWidget } from '@/components/dashboard/widgets/CVWidget'
import { JobSearchWidget } from '@/components/dashboard/widgets/JobSearchWidget'
import { WellnessWidget } from '@/components/dashboard/widgets/WellnessWidget'
import { NextStepCard } from '@/components/dashboard/NextStepCard'
import { SkeletonStats, SkeletonWidgets, SkeletonNextStep, SkeletonHeader } from '@/components/dashboard/SkeletonWidget'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { cn } from '@/lib/utils'

export default function OverviewTab() {
  const { user } = useAuthStore()
  const { data, loading, error } = useDashboardData()

  // Loading state
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

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header - Responsiv för 320px */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Hej, {user?.firstName || 'där'}! 👋
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            Här är din översikt för idag
          </p>
        </div>
        <Link 
          to="/insights" 
          className={cn(
            "inline-flex items-center justify-center gap-2 px-4 py-2.5",
            "bg-violet-100 text-violet-700 rounded-xl",
            "text-sm font-medium",
            "hover:bg-violet-200 hover:shadow-md",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
          )}
        >
          <Sparkles size={16} />
          <span className="hidden sm:inline">Mina insikter</span>
          <span className="sm:hidden">Insikter</span>
          <ChevronRight size={16} className="hidden sm:block" />
        </Link>
      </div>

      {/* Nästa steg - Kollapsbar */}
      {data && <NextStepCard data={data} />}

      {/* Snabb-statistik - Responsiv grid */}
      <section>
        <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">
          Din statistik
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <QuickStat 
            icon={<Target size={18} />} 
            label="CV-progress" 
            value={`${data?.cv?.progress || 0}%`} 
            color="violet" 
            trend={data?.cv?.progress === 100 ? 'Klar!' : undefined}
          />
          <QuickStat 
            icon={<Zap size={18} />} 
            label="Sparade jobb" 
            value={data?.jobs?.savedCount || 0} 
            color="blue" 
          />
          <QuickStat 
            icon={<TrendingUp size={18} />} 
            label="Ansökningar" 
            value={data?.applications?.total || 0} 
            color="amber" 
          />
          <QuickStat 
            icon={<LayoutDashboard size={18} />} 
            label="Quests idag" 
            value={`${data?.quests?.completed || 0}/${data?.quests?.total || 3}`} 
            color="emerald" 
          />
        </div>
      </section>

      {/* Widgets Grid */}
      <section>
        <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">
          Dina verktyg
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <CVWidget 
            hasCV={data?.cv?.hasCV} 
            progress={data?.cv?.progress} 
            size="small" 
          />
          <JobSearchWidget 
            savedCount={data?.jobs?.savedCount} 
            size="small" 
          />
          <WellnessWidget 
            completedActivities={data?.wellness?.completedActivities}
            streakDays={data?.wellness?.streakDays}
            moodToday={data?.wellness?.moodToday}
            size="small" 
          />
          <QuestsWidget 
            completedQuests={data?.quests?.completed || 0} 
            totalQuests={data?.quests?.total || 3}
            streakDays={data?.activity?.streakDays || 0}
            size="small" 
          />
        </div>
      </section>

      {/* Empty state if no data */}
      {!data?.cv?.hasCV && !data?.jobs?.savedCount && (
        <section className="pt-4">
          <EmptyState type="cv" />
        </section>
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
}

function QuickStat({ icon, label, value, color, trend }: QuickStatProps) {
  const colors: Record<string, { bg: string; icon: string; text: string }> = { 
    violet: { 
      bg: 'bg-violet-50 group-hover:bg-violet-100', 
      icon: 'text-violet-600',
      text: 'text-violet-900'
    }, 
    blue: { 
      bg: 'bg-blue-50 group-hover:bg-blue-100', 
      icon: 'text-blue-600',
      text: 'text-blue-900'
    }, 
    amber: { 
      bg: 'bg-amber-50 group-hover:bg-amber-100', 
      icon: 'text-amber-600',
      text: 'text-amber-900'
    }, 
    emerald: { 
      bg: 'bg-emerald-50 group-hover:bg-emerald-100', 
      icon: 'text-emerald-600',
      text: 'text-emerald-900'
    },
    rose: {
      bg: 'bg-rose-50 group-hover:bg-rose-100',
      icon: 'text-rose-600',
      text: 'text-rose-900'
    },
    slate: {
      bg: 'bg-slate-50 group-hover:bg-slate-100',
      icon: 'text-slate-600',
      text: 'text-slate-900'
    }
  }
  
  const colorSet = colors[color]
  
  return (
    <div className={cn(
      "group bg-white p-3 sm:p-4 rounded-xl border-2 border-slate-200 transition-all duration-200",
      "hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5",
      "focus-within:ring-2 focus-within:ring-violet-500 focus-within:ring-offset-2"
    )}>
      <div className={cn(
        "w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-2 sm:mb-3 transition-colors",
        colorSet.bg
      )}>
        <span className={colorSet.icon}>{icon}</span>
      </div>
      <div className="flex items-baseline gap-1 flex-wrap">
        <p className="text-xl sm:text-2xl font-bold text-slate-800">{value}</p>
        {trend && (
          <span className={cn("text-xs font-medium", colorSet.text)}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-xs sm:text-sm text-slate-500">{label}</p>
    </div>
  )
}
