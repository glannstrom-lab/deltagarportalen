/**
 * JourneyTimeline - Activity history timeline
 */

import {
  FileText, Bookmark, Send, BookOpen, Edit3, Award,
  Trophy, TrendingUp, Flame, LogIn, Activity
} from '@/components/ui/icons'
import { Card } from '@/components/ui'
import type { JourneyActivity } from '@/types/journey.types'

interface JourneyTimelineProps {
  activities: JourneyActivity[]
  maxItems?: number
}

const iconMap: Record<string, typeof Activity> = {
  'file-text': FileText,
  'bookmark': Bookmark,
  'send': Send,
  'book-open': BookOpen,
  'edit-3': Edit3,
  'award': Award,
  'trophy': Trophy,
  'trending-up': TrendingUp,
  'flame': Flame,
  'log-in': LogIn,
  'activity': Activity
}

function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just nu'
  if (diffMins < 60) return `${diffMins} min sedan`
  if (diffHours < 24) return `${diffHours} tim sedan`
  if (diffDays === 1) return 'Igår'
  if (diffDays < 7) return `${diffDays} dagar sedan`

  return date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
}

function groupActivitiesByDate(activities: JourneyActivity[]): Record<string, JourneyActivity[]> {
  const groups: Record<string, JourneyActivity[]> = {}
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  for (const activity of activities) {
    const activityDate = new Date(activity.timestamp).toDateString()
    let groupKey: string

    if (activityDate === today) {
      groupKey = 'Idag'
    } else if (activityDate === yesterday) {
      groupKey = 'Igår'
    } else {
      groupKey = new Date(activity.timestamp).toLocaleDateString('sv-SE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      })
    }

    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(activity)
  }

  return groups
}

export function JourneyTimeline({ activities, maxItems = 10 }: JourneyTimelineProps) {
  const displayActivities = activities.slice(0, maxItems)
  const groupedActivities = groupActivitiesByDate(displayActivities)

  if (activities.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Din resa hittills</h3>
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700">
            Dina aktiviteter kommer att visas här när du börjar använda portalen.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Din resa hittills</h3>
        {activities.length > maxItems && (
          <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            Se alla →
          </button>
        )}
      </div>

      <div className="space-y-6">
        {Object.entries(groupedActivities).map(([dateGroup, dateActivities]) => (
          <div key={dateGroup}>
            <h4 className="text-sm font-medium text-slate-700 uppercase tracking-wide mb-3">
              {dateGroup}
            </h4>

            <div className="relative pl-6 space-y-4">
              {/* Vertical Line */}
              <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-200" />

              {dateActivities.map((activity, index) => {
                const Icon = iconMap[activity.icon || 'activity'] || Activity
                const isMilestone = activity.type === 'milestone_completed'
                const isBadge = activity.type === 'badge_unlocked'

                return (
                  <div key={activity.id} className="relative flex gap-4">
                    {/* Timeline Dot */}
                    <div className={`
                      absolute -left-4 w-4 h-4 rounded-full border-2 border-white
                      ${isMilestone || isBadge
                        ? 'bg-gradient-to-br from-yellow-400 to-amber-500'
                        : 'bg-indigo-500'
                      }
                    `} />

                    {/* Activity Content */}
                    <div className={`
                      flex-1 flex items-start gap-3 p-3 rounded-lg
                      ${isMilestone || isBadge
                        ? 'bg-amber-50 border border-amber-100'
                        : 'bg-slate-50'
                      }
                    `}>
                      <div className={`
                        w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                        ${isMilestone || isBadge
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-white text-slate-600'
                        }
                      `}>
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 text-sm">
                            {activity.title}
                          </span>
                          {activity.xpEarned > 0 && (
                            <span className="text-xs text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">
                              +{activity.xpEarned} XP
                            </span>
                          )}
                        </div>

                        {activity.description && (
                          <p className="text-xs text-slate-700 mt-0.5">
                            {activity.description}
                          </p>
                        )}

                        {activity.badgeUnlocked && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                            <Trophy className="w-3 h-3" />
                            <span>Badge: {activity.badgeUnlocked}</span>
                          </div>
                        )}
                      </div>

                      <span className="text-xs text-slate-600 flex-shrink-0">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default JourneyTimeline
