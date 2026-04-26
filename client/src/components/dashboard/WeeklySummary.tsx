/**
 * WeeklySummary - Veckosammanfattning för användaren
 * Visar framsteg och motiverar fortsatt användning
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  Calendar,
  Target,
  ChevronDown,
  ChevronUp,
  Award,
  Zap,
  Briefcase,
  FileText,
  Heart
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { useDashboardData } from '@/hooks/useDashboardData'

interface WeeklyStats {
  cvProgress: number
  cvProgressChange: number
  jobsSaved: number
  applicationsSent: number
  wellnessDays: number
  questsCompleted: number
  totalTimeSpent: number // in minutes
}

interface WeeklySummaryProps {
  className?: string
}

export function WeeklySummary({ className }: WeeklySummaryProps) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const { data, loading } = useDashboardData()

  // Mock weekly stats - in production, fetch from API
  const stats: WeeklyStats = {
    cvProgress: data?.cv?.progress ?? 0,
    cvProgressChange: 15, // Mock: +15% this week
    jobsSaved: data?.jobs?.savedCount ?? 0,
    applicationsSent: data?.applications?.total ?? 0,
    wellnessDays: 3, // Mock
    questsCompleted: 12, // Mock
    totalTimeSpent: 145 // Mock: 2h 25min
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins} min`
    if (mins === 0) return `${hours} h`
    return `${hours} h ${mins} min`
  }

  const summaryItems = [
    {
      icon: <FileText size={18} />,
      label: t('dashboard.weeklySummary.cvProgress'),
      value: `${stats.cvProgress}%`,
      change: stats.cvProgressChange > 0 ? `+${stats.cvProgressChange}%` : null,
      changeType: 'positive' as const,
      color: 'text-teal-600 bg-teal-100'
    },
    {
      icon: <Briefcase size={18} />,
      label: t('dashboard.weeklySummary.jobsSaved'),
      value: stats.jobsSaved,
      change: null,
      changeType: 'neutral' as const,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      icon: <Target size={18} />,
      label: t('dashboard.weeklySummary.applications'),
      value: stats.applicationsSent,
      change: null,
      changeType: 'neutral' as const,
      color: 'text-amber-600 bg-amber-100'
    },
    {
      icon: <Heart size={18} />,
      label: t('dashboard.weeklySummary.wellnessDays'),
      value: `${stats.wellnessDays}/7`,
      change: null,
      changeType: 'neutral' as const,
      color: 'text-rose-600 bg-rose-100'
    },
    {
      icon: <Zap size={18} />,
      label: t('dashboard.weeklySummary.questsCompleted'),
      value: stats.questsCompleted,
      change: null,
      changeType: 'neutral' as const,
      color: 'text-yellow-600 bg-yellow-100'
    }
  ]

  // Get motivational message based on stats
  const getMotivationalMessage = () => {
    if (stats.cvProgress === 0) {
      return {
        title: t('dashboard.weeklySummary.motivation.getStarted.title'),
        message: t('dashboard.weeklySummary.motivation.getStarted.message')
      }
    }
    if (stats.cvProgress >= 100 && stats.applicationsSent > 0) {
      return {
        title: t('dashboard.weeklySummary.motivation.onTrack.title'),
        message: t('dashboard.weeklySummary.motivation.onTrack.message')
      }
    }
    if (stats.cvProgress >= 100) {
      return {
        title: t('dashboard.weeklySummary.motivation.cvComplete.title'),
        message: t('dashboard.weeklySummary.motivation.cvComplete.message')
      }
    }
    if (stats.cvProgressChange > 10) {
      return {
        title: t('dashboard.weeklySummary.motivation.greatWeek.title'),
        message: t('dashboard.weeklySummary.motivation.greatWeek.message', { progress: stats.cvProgressChange })
      }
    }
    if (stats.wellnessDays >= 5) {
      return {
        title: t('dashboard.weeklySummary.motivation.selfCare.title'),
        message: t('dashboard.weeklySummary.motivation.selfCare.message', { days: stats.wellnessDays })
      }
    }
    return {
      title: t('dashboard.weeklySummary.motivation.keepGoing.title'),
      message: t('dashboard.weeklySummary.motivation.keepGoing.message')
    }
  }

  const motivation = getMotivationalMessage()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-stone-900 dark:to-stone-800 rounded-2xl border border-slate-200 dark:border-stone-700 overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-100/50 dark:hover:bg-stone-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-100 to-teal-100 dark:from-sky-900/50 dark:to-teal-900/50 flex items-center justify-center">
            <Calendar size={20} className="text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-800 dark:text-stone-100">{t('dashboard.weeklySummary.yourWeek')}</h3>
            <p className="text-xs text-slate-700 dark:text-stone-300">
              {formatTime(stats.totalTimeSpent)} {t('dashboard.weeklySummary.activeTime')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-700 dark:text-stone-300">
            {isExpanded ? t('common.hide') : t('common.show')}
          </span>
          {isExpanded ? (
            <ChevronUp size={18} className="text-slate-600 dark:text-stone-400" />
          ) : (
            <ChevronDown size={18} className="text-slate-600 dark:text-stone-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-slate-200 dark:border-stone-700"
        >
          {/* Motivational Message */}
          <div className="p-4 bg-gradient-to-r from-teal-50 to-sky-50 dark:from-teal-900/30 dark:to-sky-900/30 border-b border-slate-200 dark:border-stone-700">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-stone-800 flex items-center justify-center shadow-sm">
                <Award size={16} className="text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-stone-100 text-sm">{motivation.title}</h4>
                <p className="text-sm text-slate-600 dark:text-stone-400 mt-0.5">{motivation.message}</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="p-4 grid grid-cols-2 gap-3">
            {summaryItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 bg-white dark:bg-stone-800 rounded-xl border border-slate-200 dark:border-stone-700"
              >
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", item.color)}>
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800 dark:text-stone-100">{item.value}</span>
                    {item.change && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center">
                        <TrendingUp size={10} className="mr-0.5" />
                        {item.change}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-700 dark:text-stone-300">{item.label}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Week Goals */}
          <div className="px-4 pb-4">
            <div className="p-3 bg-white dark:bg-stone-800 rounded-xl border border-slate-200 dark:border-stone-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700 dark:text-stone-300">{t('dashboard.weeklySummary.weekGoals')}</span>
                <span className="text-xs text-slate-700 dark:text-stone-300">{t('dashboard.weeklySummary.goalsProgress', { completed: 2, total: 3 })}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-stone-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '66%' }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="h-full bg-gradient-to-r from-teal-500 to-sky-500 rounded-full"
                />
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                    <TrendingUp size={12} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-slate-600 dark:text-stone-400 line-through">{t('dashboard.weeklySummary.goals.logWellness')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                    <TrendingUp size={12} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-slate-600 dark:text-stone-400 line-through">{t('dashboard.weeklySummary.goals.completeCV')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-stone-700 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-stone-500" />
                  </div>
                  <span className="text-slate-700 dark:text-stone-300">{t('dashboard.weeklySummary.goals.saveJobs')}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

// Compact inline version
export function WeeklySummaryBadge() {
  const { t } = useTranslation()
  const { data } = useDashboardData()

  // Mock: calculate weekly progress
  const weeklyProgress = 66

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-teal-100 to-sky-100 text-teal-700 text-xs font-medium">
      <TrendingUp size={14} />
      <span>{t('dashboard.weeklySummary.weekBadge', { progress: weeklyProgress })}</span>
    </div>
  )
}
