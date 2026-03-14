import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutDashboard, Sparkles, Zap, TrendingUp, Target, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useDashboardData } from '@/hooks/useDashboardData'
import { QuestsWidget } from '@/components/dashboard/widgets/QuestsWidget'
import { cn } from '@/lib/utils'

export default function OverviewTab() {
  const { user } = useAuthStore()
  const { data, loading } = useDashboardData()

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

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
        <QuickStat 
          icon={<Target size={18} />} 
          label="CV-progress" 
          value={`${data?.cv?.progress || 0}%`} 
          color="violet" 
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
          label="Quests" 
          value={data?.quests?.completed || 0} 
          color="emerald" 
        />
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuestsWidget 
          completedQuests={data?.quests?.completed || 0} 
          totalQuests={data?.quests?.total || 3}
          streakDays={data?.activity?.streakDays || 0}
          size="small" 
        />
      </div>
    </div>
  )
}

function QuickStat({ icon, label, value, color }: { 
  icon: React.ReactNode, 
  label: string, 
  value: string | number, 
  color: string 
}) {
  const colors: Record<string, string> = { 
    violet: 'bg-violet-100 text-violet-700', 
    blue: 'bg-blue-100 text-blue-700', 
    amber: 'bg-amber-100 text-amber-700', 
    emerald: 'bg-emerald-100 text-emerald-700' 
  }
  
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-2", colors[color])}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}
