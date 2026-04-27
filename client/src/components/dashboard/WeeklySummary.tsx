/**
 * WeeklySummary - Veckosammanfattning för användaren
 * Visar framsteg och motiverar fortsatt användning
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Calendar,
  Target,
  ChevronDown,
  ChevronUp,
  Award,
  Zap,
  Briefcase,
  FileText,
  Heart,
  Check,
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { useDashboardData } from '@/hooks/useDashboardData'

interface WeeklySummaryProps {
  className?: string
}

export function WeeklySummary({ className }: WeeklySummaryProps) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const { data, loading } = useDashboardData()

  // Riktig data från Supabase via useDashboardData
  const stats = {
    cvProgress: data?.cv?.progress ?? 0,
    jobsSaved: data?.jobs?.savedCount ?? 0,
    applicationsSent: data?.applications?.total ?? 0,
    wellnessStreak: data?.wellness?.streakDays ?? 0,
    questsCompleted: data?.quests?.completed ?? 0,
    questsTotal: data?.quests?.total ?? 0,
    questItems: data?.quests?.items ?? [],
  }

  const summaryItems = [
    {
      icon: <FileText size={18} />,
      label: t('dashboard.weeklySummary.cvProgress'),
      value: `${stats.cvProgress}%`,
      color: 'text-brand-900 bg-brand-50',
    },
    {
      icon: <Briefcase size={18} />,
      label: t('dashboard.weeklySummary.jobsSaved'),
      value: stats.jobsSaved,
      color: 'text-blue-700 bg-blue-50',
    },
    {
      icon: <Target size={18} />,
      label: t('dashboard.weeklySummary.applications'),
      value: stats.applicationsSent,
      color: 'text-amber-700 bg-amber-50',
    },
    {
      icon: <Heart size={18} />,
      label: t('dashboard.weeklySummary.wellnessDays'),
      value: stats.wellnessStreak > 0 ? `${stats.wellnessStreak} dgr` : '—',
      color: 'text-rose-700 bg-rose-50',
    },
    {
      icon: <Zap size={18} />,
      label: t('dashboard.weeklySummary.questsCompleted'),
      value: stats.questsTotal > 0 ? `${stats.questsCompleted}/${stats.questsTotal}` : '—',
      color: 'text-amber-700 bg-amber-50',
    },
  ]

  // Motivationsmeddelande baserat på faktisk data
  const getMotivationalMessage = () => {
    if (loading) {
      return { title: '', message: '' }
    }
    if (stats.cvProgress === 0) {
      return {
        title: t('dashboard.weeklySummary.motivation.getStarted.title'),
        message: t('dashboard.weeklySummary.motivation.getStarted.message'),
      }
    }
    if (stats.cvProgress >= 100 && stats.applicationsSent > 0) {
      return {
        title: t('dashboard.weeklySummary.motivation.onTrack.title'),
        message: t('dashboard.weeklySummary.motivation.onTrack.message'),
      }
    }
    if (stats.cvProgress >= 100) {
      return {
        title: t('dashboard.weeklySummary.motivation.cvComplete.title'),
        message: t('dashboard.weeklySummary.motivation.cvComplete.message'),
      }
    }
    if (stats.wellnessStreak >= 5) {
      return {
        title: t('dashboard.weeklySummary.motivation.selfCare.title'),
        message: t('dashboard.weeklySummary.motivation.selfCare.message', { days: stats.wellnessStreak }),
      }
    }
    return {
      title: t('dashboard.weeklySummary.motivation.keepGoing.title'),
      message: t('dashboard.weeklySummary.motivation.keepGoing.message'),
    }
  }

  const motivation = getMotivationalMessage()
  const goalsProgress = stats.questsTotal > 0
    ? Math.round((stats.questsCompleted / stats.questsTotal) * 100)
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-900 focus-visible:ring-inset"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
            <Calendar size={20} className="text-brand-900 dark:text-brand-300" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-stone-800 dark:text-stone-100">
              {t('dashboard.weeklySummary.yourWeek')}
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              {stats.questsTotal > 0
                ? t('dashboard.weeklySummary.goalsProgress', {
                    completed: stats.questsCompleted,
                    total: stats.questsTotal,
                  })
                : t('common.loading', 'Laddar…')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-stone-600 dark:text-stone-400">
            {isExpanded ? t('common.hide') : t('common.show')}
          </span>
          {isExpanded ? (
            <ChevronUp size={18} className="text-stone-600 dark:text-stone-400" />
          ) : (
            <ChevronDown size={18} className="text-stone-600 dark:text-stone-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-stone-200 dark:border-stone-700"
        >
          {/* Motivational Message */}
          {motivation.title && (
            <div className="p-4 bg-brand-50/50 dark:bg-brand-900/20 border-b border-stone-200 dark:border-stone-700">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-stone-800 flex items-center justify-center">
                  <Award size={16} className="text-brand-900 dark:text-brand-300" />
                </div>
                <div>
                  <h4 className="font-semibold text-stone-800 dark:text-stone-100 text-sm">
                    {motivation.title}
                  </h4>
                  <p className="text-sm text-stone-600 dark:text-stone-400 mt-0.5">{motivation.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="p-4 grid grid-cols-2 gap-3">
            {summaryItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-700/50 rounded-lg border border-stone-200 dark:border-stone-700"
              >
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', item.color)}>
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-stone-800 dark:text-stone-100 block">
                    {item.value}
                  </span>
                  <span className="text-xs text-stone-600 dark:text-stone-400">{item.label}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Week Goals - från riktiga quests */}
          {stats.questItems.length > 0 && (
            <div className="px-4 pb-4">
              <div className="p-3 bg-stone-50 dark:bg-stone-700/50 rounded-lg border border-stone-200 dark:border-stone-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                    {t('dashboard.weeklySummary.weekGoals')}
                  </span>
                  <span className="text-xs text-stone-600 dark:text-stone-400">
                    {t('dashboard.weeklySummary.goalsProgress', {
                      completed: stats.questsCompleted,
                      total: stats.questsTotal,
                    })}
                  </span>
                </div>
                <div className="w-full h-2 bg-stone-200 dark:bg-stone-600 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${goalsProgress}%` }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="h-full bg-brand-900 rounded-full"
                  />
                </div>
                <div className="mt-3 space-y-2">
                  {stats.questItems.slice(0, 5).map((quest) => (
                    <div key={quest.id} className="flex items-center gap-2 text-sm">
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center',
                          quest.completed
                            ? 'bg-brand-50 dark:bg-brand-900/40'
                            : 'bg-stone-100 dark:bg-stone-700'
                        )}
                      >
                        {quest.completed ? (
                          <Check size={12} className="text-brand-900 dark:text-brand-300" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-stone-300 dark:bg-stone-500" />
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-stone-700 dark:text-stone-300',
                          quest.completed && 'line-through text-stone-500 dark:text-stone-500'
                        )}
                      >
                        {quest.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}

// Compact inline version
export function WeeklySummaryBadge() {
  const { t } = useTranslation()
  const { data } = useDashboardData()

  const total = data?.quests?.total ?? 0
  const completed = data?.quests?.completed ?? 0
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  if (total === 0) return null

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-900 dark:text-brand-300 text-xs font-medium">
      <Zap size={14} />
      <span>{t('dashboard.weeklySummary.weekBadge', { progress })}</span>
    </div>
  )
}
