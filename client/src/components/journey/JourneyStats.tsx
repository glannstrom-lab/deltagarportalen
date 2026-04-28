/**
 * JourneyStats - Detailed statistics display
 */

import {
  TrendingUp, Flame, Star, Send, BookOpen, FileText,
  Target, Calendar, Award
} from '@/components/ui/icons'
import { Card } from '@/components/ui'
import type { JourneyStats as JourneyStatsType } from '@/types/journey.types'

interface JourneyStatsProps {
  stats: JourneyStatsType
}

export function JourneyStats({ stats }: JourneyStatsProps) {
  const statItems = [
    {
      icon: TrendingUp,
      label: 'Total XP',
      value: stats.totalXP.toLocaleString('sv-SE'),
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    {
      icon: Star,
      label: 'Nivå',
      value: `${stats.level} - ${stats.levelTitle}`,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100'
    },
    {
      icon: Flame,
      label: 'Nuvarande streak',
      value: `${stats.currentStreak} dagar`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      icon: Calendar,
      label: 'Dagar aktiv',
      value: stats.daysActive.toString(),
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    },
    {
      icon: Target,
      label: 'Milstolpar',
      value: `${stats.milestonesCompleted}/${stats.totalMilestones}`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      icon: Award,
      label: 'Badges',
      value: `${stats.badgesUnlocked}/${stats.totalBadges}`,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100'
    },
    {
      icon: Send,
      label: 'Ansökningar',
      value: stats.applicationsCount.toString(),
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      icon: BookOpen,
      label: 'Artiklar lästa',
      value: stats.articlesRead.toString(),
      color: 'text-[var(--c-text)]',
      bgColor: 'bg-[var(--c-accent)]/40'
    },
    {
      icon: FileText,
      label: 'CV-framsteg',
      value: `${stats.cvProgress}%`,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100'
    }
  ]

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-stone-900 mb-6">Din statistik</h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {statItems.map(item => {
          const Icon = item.icon
          return (
            <div
              key={item.label}
              className="flex items-center gap-3 p-3 rounded-xl bg-stone-50"
            >
              <div className={`w-10 h-10 rounded-lg ${item.bgColor} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div>
                <div className="text-sm text-stone-700">{item.label}</div>
                <div className="font-semibold text-stone-900">{item.value}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Longest streak highlight */}
      {stats.longestStreak > 0 && (
        <div className="mt-6 pt-4 border-t border-stone-100">
          <div className="flex items-center gap-2 text-sm text-stone-600">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>Längsta streak: <strong className="text-stone-900">{stats.longestStreak} dagar</strong></span>
          </div>
        </div>
      )}
    </Card>
  )
}

export default JourneyStats
