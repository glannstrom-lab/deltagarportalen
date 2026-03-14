import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutDashboard, Sparkles, Zap, TrendingUp, Target, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useEnergyStore, getWidgetsForEnergyLevel } from '@/stores/energyStore'
import { DashboardGrid } from '@/components/dashboard/DashboardGrid'
import { CompactWidgetFilter, type WidgetType } from '@/components/dashboard/CompactWidgetFilter'
import { type WidgetSize } from '@/components/dashboard/WidgetSizeSelector'
import { DashboardGridSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui'
import { CVWidget, JobSearchWidget, WellnessWidget, QuestsWidget } from '@/components/dashboard'
import { cn } from '@/lib/utils'

const allWidgets: WidgetType[] = ['cv', 'coverLetter', 'jobSearch', 'applications', 'career', 'interests', 'exercises', 'diary', 'wellness', 'knowledge', 'quests']

export default function OverviewTab() {
  const { user } = useAuthStore()
  const { data, loading, error, refetch } = useDashboardData()
  const { level: energyLevel } = useEnergyStore()
  
  const [visibleWidgets, setVisibleWidgets] = useState<WidgetType[]>(getWidgetsForEnergyLevel(energyLevel, allWidgets))
  const [widgetSizes] = useState<Record<WidgetType, WidgetSize>>({
    cv: 'medium', coverLetter: 'small', jobSearch: 'small', applications: 'small',
    career: 'small', interests: 'small', exercises: 'small', diary: 'small',
    wellness: 'small', knowledge: 'small', quests: 'medium'
  })

  if (loading) return <DashboardGridSkeleton count={4} />
  if (error) return <ErrorState title="Kunde inte ladda" message="Något gick fel" onRetry={refetch} />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Hej, {user?.firstName || 'där'}! 👋</h1>
          <p className="text-slate-500 mt-1">Här är din översikt för idag</p>
        </div>
        <Link to="/insights" className="flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 rounded-full text-sm font-medium hover:bg-violet-200">
          <Sparkles size={16} />
          <span className="hidden sm:inline">Mina insikter</span>
          <ChevronRight size={16} />
        </Link>
      </div>

      {/* Snabb-statistik */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickStat icon={<Target size={18} />} label="CV-progress" value={`${data?.cv?.progress || 0}%`} color="violet" />
        <QuickStat icon={<Zap size={18} />} label="Sparade jobb" value={data?.jobs?.savedCount || 0} color="blue" />
        <QuickStat icon={<TrendingUp size={18} />} label="Ansökningar" value={data?.applications?.total || 0} color="amber" />
        <QuickStat icon={<LayoutDashboard size={18} />} label="Quests" value={data?.quests?.completed || 0} color="emerald" />
      </div>

      {/* Filter */}
      <CompactWidgetFilter
        visibleWidgets={visibleWidgets}
        onToggleWidget={(id) => setVisibleWidgets(prev => prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id])}
        onShowAll={() => setVisibleWidgets(allWidgets)}
        onHideAll={() => setVisibleWidgets([])}
      />

      {/* Widgets */}
      <DashboardGrid>
        {visibleWidgets.includes('cv') && data && <CVWidget hasCV={data.cv.hasCV} progress={data.cv.progress} atsScore={data.cv.atsScore} size={widgetSizes.cv} />}
        {visibleWidgets.includes('jobSearch') && data && <JobSearchWidget savedCount={data.jobs.savedCount} size={widgetSizes.jobSearch} />}
        {visibleWidgets.includes('wellness') && data && <WellnessWidget completedActivities={data.wellness.completedActivities} streakDays={data.wellness.streakDays} moodToday={data.wellness.moodToday} size={widgetSizes.wellness} />}
        {visibleWidgets.includes('quests') && data && <QuestsWidget completedQuests={data.quests.completed} totalQuests={data.quests.total} streakDays={data.activity.streakDays} size={widgetSizes.quests} />}
      </DashboardGrid>
    </div>
  )
}

function QuickStat({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) {
  const colors: Record<string, string> = { violet: 'bg-violet-100 text-violet-700', blue: 'bg-blue-100 text-blue-700', amber: 'bg-amber-100 text-amber-700', emerald: 'bg-emerald-100 text-emerald-700' }
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-2", colors[color])}>{icon}</div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}
