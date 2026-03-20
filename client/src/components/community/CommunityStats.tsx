/**
 * CommunityStats - Shows community statistics
 */

import { Users, Zap, Heart, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommunityStatsProps {
  stats: {
    totalMembers: number
    activeToday: number
    cheersToday: number
    applicationsThisWeek: number
  } | null
  isLoading?: boolean
}

export function CommunityStats({ stats, isLoading }: CommunityStatsProps) {
  const items = [
    {
      label: 'Medlemmar',
      value: stats?.totalMembers || 0,
      icon: Users,
      color: 'text-violet-600',
      bgColor: 'bg-violet-100'
    },
    {
      label: 'Aktiva idag',
      value: stats?.activeToday || 0,
      icon: Zap,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100'
    },
    {
      label: 'Hejarop idag',
      value: stats?.cheersToday || 0,
      icon: Heart,
      color: 'text-rose-600',
      bgColor: 'bg-rose-100'
    },
    {
      label: 'Ansökningar (7d)',
      value: stats?.applicationsThisWeek || 0,
      icon: Send,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    }
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
            <div className="w-10 h-10 bg-slate-200 rounded-lg mb-2" />
            <div className="h-6 bg-slate-200 rounded w-12 mb-1" />
            <div className="h-4 bg-slate-100 rounded w-20" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map(item => (
        <div
          key={item.label}
          className="bg-white rounded-xl p-4 border border-slate-100 hover:shadow-sm transition-shadow"
        >
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-2", item.bgColor)}>
            <item.icon className={cn("w-5 h-5", item.color)} />
          </div>
          <div className="text-2xl font-bold text-slate-800">{item.value}</div>
          <div className="text-sm text-slate-500">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

export default CommunityStats
