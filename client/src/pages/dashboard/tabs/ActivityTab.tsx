/**
 * ActivityTab - Aktivitet, påminnelser, timeline och quests
 * Allt som händer och ska hända
 */
import { motion } from 'framer-motion'
import { Clock, Calendar, CheckCircle2, Target, Zap, Flame, TrendingUp } from 'lucide-react'
import { useDashboardData } from '@/hooks/useDashboardData'
import { RemindersWidget } from '@/components/dashboard/widgets/RemindersWidget'
import { QuestsWidget } from '@/components/dashboard/widgets/QuestsWidget'
import { JourneyTimeline } from '@/components/analytics/JourneyTimeline'
import { cn } from '@/lib/utils'

export default function ActivityTab() {
  const { data, loading } = useDashboardData()

  if (loading) return <div className="p-8 text-center text-slate-500">Laddar aktivitet...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Min aktivitet</h2>
        <p className="text-slate-500">Påminnelser, quests och din resa</p>
      </div>

      {/* Påminnelser - alltid överst */}
      <div className="grid md:grid-cols-2 gap-6">
        <RemindersWidget size="medium" />
        
        {/* Dagens Quests */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Target size={20} className="text-violet-500" />
            Dagens quests
          </h3>
          {data && (
            <QuestsWidget 
              completedQuests={data.quests.completed} 
              totalQuests={data.quests.total}
              quests={data.quests.items}
              streakDays={data.activity.streakDays}
              size="medium"
            />
          )}
        </div>
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

      {/* Timeline */}
      <JourneyTimeline />
    </div>
  )
}

function ActivityCard({ icon, value, label, color }: { icon: React.ReactNode, value: string | number, label: string, color: string }) {
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
