/**
 * Calendar Sync Component
 * Syncs career milestones and network follow-ups to calendar
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  RefreshCw,
  Check,
  AlertCircle,
  Bell,
  Target,
  Users,
  ChevronRight,
  Clock,
  Loader2
} from '@/components/ui/icons'
import { Button, Card } from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  calendarIntegration,
  type AggregatedReminder
} from '@/services/calendarIntegration'

interface CalendarSyncProps {
  showSync?: boolean
  showUpcoming?: boolean
  maxReminders?: number
  compact?: boolean
}

export function CalendarSync({
  showSync = true,
  showUpcoming = true,
  maxReminders = 5,
  compact = false
}: CalendarSyncProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ milestones: number; network: number } | null>(null)
  const [reminders, setReminders] = useState<AggregatedReminder[]>([])
  const [isLoadingReminders, setIsLoadingReminders] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    'Notification' in window && Notification.permission === 'granted'
  )

  const syncToCalendar = async () => {
    setIsSyncing(true)
    setSyncResult(null)
    try {
      const [milestoneResult, networkResult] = await Promise.all([
        calendarIntegration.syncMilestonesToCalendar(),
        calendarIntegration.syncNetworkFollowupsToCalendar()
      ])

      setSyncResult({
        milestones: milestoneResult.synced,
        network: networkResult.synced
      })

      // Reload reminders after sync
      await loadReminders()
    } catch (error) {
      console.error('Failed to sync to calendar:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const loadReminders = async () => {
    setIsLoadingReminders(true)
    try {
      const upcoming = await calendarIntegration.getAggregatedReminders(7)
      setReminders(upcoming.slice(0, maxReminders))
    } catch (error) {
      console.error('Failed to load reminders:', error)
    } finally {
      setIsLoadingReminders(false)
    }
  }

  const enableNotifications = async () => {
    const enabled = await calendarIntegration.initializeNotifications()
    setNotificationsEnabled(enabled)
  }

  const getSourceIcon = (source: AggregatedReminder['source']) => {
    switch (source) {
      case 'milestone':
        return <Target className="w-4 h-4" />
      case 'network':
        return <Users className="w-4 h-4" />
      case 'calendar':
        return <Calendar className="w-4 h-4" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  const getSourceColor = (source: AggregatedReminder['source']) => {
    switch (source) {
      case 'milestone':
        return 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400'
      case 'network':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
      case 'calendar':
        return 'bg-brand-100 dark:bg-brand-900/30 text-brand-900 dark:text-brand-400'
      default:
        return 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
    }
  }

  const getPriorityBadge = (priority: AggregatedReminder['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      case 'medium':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
      case 'low':
        return 'bg-brand-100 dark:bg-brand-900/30 text-brand-900 dark:text-brand-300'
    }
  }

  const formatDueDate = (date: Date) => {
    const now = new Date()
    const daysUntil = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntil < 0) return 'Försenad'
    if (daysUntil === 0) return 'Idag'
    if (daysUntil === 1) return 'Imorgon'
    if (daysUntil < 7) return `Om ${daysUntil} dagar`
    return date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })
  }

  // Load reminders on mount if showing upcoming
  useState(() => {
    if (showUpcoming) {
      loadReminders()
    }
  })

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={syncToCalendar}
          disabled={isSyncing}
          className="text-sm"
        >
          {isSyncing ? (
            <Loader2 className="w-4 h-4 animate-spin mr-1" />
          ) : (
            <Calendar className="w-4 h-4 mr-1" />
          )}
          Synka till kalender
        </Button>
        {syncResult && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Check className="w-3 h-3" />
            {syncResult.milestones + syncResult.network} synkade
          </span>
        )}
      </div>
    )
  }

  return (
    <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-sky-50 to-brand-50 dark:from-sky-900/20 dark:to-brand-900/20 border-b border-sky-100 dark:border-sky-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sky-900 dark:text-sky-100">
                Kalenderintegration
              </h3>
              <p className="text-sm text-sky-700 dark:text-sky-400">
                Synka milstolpar och uppföljningar
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Section */}
      {showSync && (
        <div className="p-4 border-b border-stone-100 dark:border-stone-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Button
              onClick={syncToCalendar}
              disabled={isSyncing}
              className="bg-sky-600 hover:bg-sky-700 text-white"
            >
              {isSyncing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Synka till kalender
            </Button>

            {syncResult && (
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-stone-600 dark:text-stone-400">
                  {syncResult.milestones} milstolpar, {syncResult.network} uppföljningar synkade
                </span>
              </div>
            )}

            {!notificationsEnabled && (
              <Button
                variant="outline"
                size="sm"
                onClick={enableNotifications}
                className="ml-auto"
              >
                <Bell className="w-4 h-4 mr-1" />
                Aktivera notiser
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Upcoming Reminders */}
      {showUpcoming && (
        <div>
          <div className="px-4 py-3 bg-stone-50 dark:bg-stone-900/50 border-b border-stone-100 dark:border-stone-700">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-stone-700 dark:text-stone-300 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Kommande påminnelser
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadReminders}
                disabled={isLoadingReminders}
                className="text-stone-500"
              >
                <RefreshCw className={cn('w-4 h-4', isLoadingReminders && 'animate-spin')} />
              </Button>
            </div>
          </div>

          {isLoadingReminders ? (
            <div className="p-6 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-sky-600 mx-auto" />
            </div>
          ) : reminders.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-stone-600 dark:text-stone-400">
                Inga kommande påminnelser
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-700">
              {reminders.map((reminder) => (
                <Link
                  key={reminder.id}
                  to={reminder.actionPath}
                  className="flex items-start gap-3 p-4 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
                >
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                    getSourceColor(reminder.source)
                  )}>
                    {getSourceIcon(reminder.source)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-medium text-stone-800 dark:text-stone-200 truncate">
                        {reminder.title}
                      </h5>
                      <span className={cn(
                        'px-1.5 py-0.5 text-xs font-medium rounded flex-shrink-0',
                        getPriorityBadge(reminder.priority)
                      )}>
                        {formatDueDate(reminder.dueDate)}
                      </span>
                    </div>
                    <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-1">
                      {reminder.description}
                    </p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-stone-400 flex-shrink-0 mt-1" />
                </Link>
              ))}
            </div>
          )}

          {reminders.length > 0 && (
            <div className="px-4 py-3 bg-stone-50 dark:bg-stone-900/50 border-t border-stone-100 dark:border-stone-700">
              <Link
                to="/calendar"
                className="text-sm text-sky-600 dark:text-sky-400 hover:underline flex items-center justify-center gap-1"
              >
                Visa kalender
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export default CalendarSync
