import { Flame, CheckCircle2, Target, TrendingUp } from 'lucide-react'
import { useDashboardData } from '@/hooks/useDashboardData'
import { QuestsWidget } from '@/components/dashboard/widgets/QuestsWidget'
import { cn } from '@/lib/utils'

export default function ActivityTab() {
  const { data, loading } = useDashboardData()

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
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
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Min aktivitet</h2>
        <p className="text-slate-500">Dina quests och din resa</p>
      </div>

      {/* Dagens Quests */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Target size={20} className="text-violet-500" />
          Dagens quests
        </h3>
        <QuestsWidget 
          completedQuests={data?.quests?.completed || 0} 
          totalQuests={data?.quests?.total || 3}
          streakDays={data?.activity?.streakDays || 0}
          size="medium"
        />
      </div>

      {/* Streak och statistik */}
      <div className="grid grid-cols-3 gap-4">
        <ActivityCard 
          icon={<Flame size={24} />}
          value={data?.activity?.streakDays || 0}
          label="Dagar i rad"
          color="orange"
        />
        <ActivityCard 
          icon={<CheckCircle2 size={24} />}
          value={data?.quests?.completed || 0}
          label="Quests klara"
          color="emerald"
        />
        <ActivityCard 
          icon={<TrendingUp size={24} />}
          value={`${data?.cv?.progress || 0}%`}
          label="CV färdigt"
          color="violet"
        />
      </div>
    </div>
  )
}

function ActivityCard({ icon, value, label, color }: { 
  icon: React.ReactNode, 
  value: string | number, 
  label: string, 
  color: string 
}) {
  const colors: Record<string, string> = {
    orange: 'bg-orange-100 text-orange-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    violet: 'bg-violet-100 text-violet-700',
  }
  
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 text-center">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3", colors[color])}>
        {icon}
      </div>
      <p className="text-3xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  )
}
