/**
 * InsightsTab - Real analytics and personalized insights
 * Shows activity patterns, trends, and AI recommendations
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Brain, TrendingUp, TrendingDown, Minus, Target, Lightbulb,
  Calendar, ChevronDown, ChevronUp, BarChart3, Activity, Heart,
  Clock, Flame, Send, BookOpen, Briefcase, Smile, RefreshCw, Loader2
} from '@/components/ui/icons'
import { useInsights } from '@/hooks/useInsights'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import type { PersonalizedRecommendation, ActivityByType, DailyActivity, WeeklyProgress } from '@/services/insightsService'

export default function InsightsTab() {
  const { t } = useTranslation()
  const { data, isLoading, error, refresh } = useInsights()
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-12"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-brand-700 animate-spin mx-auto mb-3" aria-hidden="true" />
          <p className="text-slate-700 dark:text-stone-300">{t('dashboard.insights.analyzing')}</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <Brain className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-stone-100 mb-2">
          {t('dashboard.insights.errorTitle')}
        </h3>
        <p className="text-slate-700 dark:text-stone-300 mb-4">{error}</p>
        <Button onClick={refresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('common.tryAgain')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-stone-100 flex items-center gap-2">
            <Brain className="text-brand-700" size={28} />
            {t('dashboard.insights.title')}
          </h2>
          <p className="text-slate-700 dark:text-stone-300">{t('dashboard.insights.subtitle')}</p>
        </div>
        <Button onClick={refresh} variant="secondary" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('common.refresh')}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={Activity}
          label={t('dashboard.insights.activitiesThisWeek')}
          value={data.activitySummary.thisWeek}
          trend={data.activitySummary.trend}
          changePercent={data.activitySummary.changePercent}
          color="violet"
        />
        <SummaryCard
          icon={Flame}
          label={t('dashboard.insights.streak')}
          value={t('dashboard.insights.days', { count: data.streakDays })}
          color="orange"
        />
        <SummaryCard
          icon={Clock}
          label={t('dashboard.insights.bestTime')}
          value={`${data.mostActiveHour.toString().padStart(2, '0')}:00`}
          subtext={data.mostActiveDay}
          color="blue"
        />
        <SummaryCard
          icon={Smile}
          label={t('dashboard.insights.averageMood')}
          value={data.averageMoodThisWeek > 0 ? `${data.averageMoodThisWeek}/5` : '-'}
          color="emerald"
        />
      </div>

      {/* Activity Chart */}
      <ActivityChart dailyActivity={data.dailyActivity} t={t} />

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity breakdown */}
        <ActivityBreakdown activities={data.activityByType} t={t} />

        {/* Weekly progress */}
        <WeeklyProgressChart progress={data.weeklyProgress} t={t} />
      </div>

      {/* Recommendations */}
      <RecommendationsSection
        recommendations={data.recommendations}
        expandedId={expandedRecommendation}
        onToggle={(id) => setExpandedRecommendation(expandedRecommendation === id ? null : id)}
        t={t}
      />

      {/* Patterns & Tips */}
      <PatternsSection
        mostActiveDay={data.mostActiveDay}
        mostActiveHour={data.mostActiveHour}
        conversionRate={data.applicationConversionRate}
        activitySummary={data.activitySummary}
        t={t}
      />
    </div>
  )
}

// ============================================
// SUMMARY CARD
// ============================================

interface SummaryCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'stable'
  changePercent?: number
  subtext?: string
  color: 'violet' | 'orange' | 'blue' | 'emerald'
}

function SummaryCard({ icon: Icon, label, value, trend, changePercent, subtext, color }: SummaryCardProps) {
  const colorClasses = {
    violet: 'bg-brand-100 dark:bg-brand-900/40 text-brand-900 dark:text-brand-400',
    orange: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400',
    blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
  }

  const trendColors = {
    up: 'text-emerald-600 dark:text-emerald-400',
    down: 'text-red-500 dark:text-red-400',
    stable: 'text-slate-700 dark:text-stone-300'
  }

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-slate-200 dark:border-stone-700 p-4">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", colorClasses[color])}>
        <Icon size={20} />
      </div>
      <p className="text-sm text-slate-700 dark:text-stone-300">{label}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <p className="text-2xl font-bold text-slate-800 dark:text-stone-100">{value}</p>
        {trend && changePercent !== undefined && (
          <span className={cn("flex items-center text-sm font-medium", trendColors[trend])}>
            <TrendIcon size={14} className="mr-0.5" />
            {changePercent > 0 ? '+' : ''}{changePercent}%
          </span>
        )}
      </div>
      {subtext && <p className="text-xs text-slate-600 dark:text-stone-400 mt-1">{subtext}</p>}
    </div>
  )
}

// ============================================
// ACTIVITY CHART
// ============================================

interface ActivityChartProps {
  dailyActivity: DailyActivity[]
  t: (key: string, options?: Record<string, unknown>) => string
}

function ActivityChart({ dailyActivity, t }: ActivityChartProps) {
  const maxCount = Math.max(...dailyActivity.map(d => d.count), 1)

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-slate-200 dark:border-stone-700 p-6">
      <h3 className="font-semibold text-slate-800 dark:text-stone-100 mb-4 flex items-center gap-2">
        <BarChart3 size={20} className="text-brand-700" />
        {t('dashboard.insights.activityLast14Days')}
      </h3>
      <div className="flex items-end justify-between gap-1 h-32">
        {dailyActivity.map((day, index) => {
          const height = day.count > 0 ? Math.max(10, (day.count / maxCount) * 100) : 4
          const isToday = index === dailyActivity.length - 1

          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  "w-full max-w-8 rounded-t-sm",
                  isToday ? "bg-brand-700" : "bg-brand-200 dark:bg-brand-900",
                  day.count === 0 && "bg-slate-100 dark:bg-stone-700"
                )}
                title={`${day.date}: ${t('dashboard.insights.activitiesCount', { count: day.count })}`}
              />
              <span className={cn(
                "text-xs",
                isToday ? "text-brand-900 dark:text-brand-400 font-medium" : "text-slate-600 dark:text-stone-400"
              )}>
                {day.dayName}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// ACTIVITY BREAKDOWN
// ============================================

interface ActivityBreakdownProps {
  activities: ActivityByType[]
  t: (key: string, options?: Record<string, unknown>) => string
}

function ActivityBreakdown({ activities, t }: ActivityBreakdownProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'application_sent': return Send
      case 'article_read': return BookOpen
      case 'job_saved': return Briefcase
      case 'exercise_completed': return Target
      default: return Activity
    }
  }

  const total = activities.reduce((sum, a) => sum + a.count, 0)

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-slate-200 dark:border-stone-700 p-6">
      <h3 className="font-semibold text-slate-800 dark:text-stone-100 mb-4 flex items-center gap-2">
        <Activity size={20} className="text-blue-500" />
        {t('dashboard.insights.activityBreakdown')}
      </h3>
      {activities.length === 0 ? (
        <p className="text-slate-700 dark:text-stone-300 text-sm py-4 text-center">
          {t('dashboard.insights.noActivityYet')}
        </p>
      ) : (
        <div className="space-y-3">
          {activities.map(activity => {
            const Icon = getIcon(activity.type)
            const percent = Math.round((activity.count / total) * 100)

            return (
              <div key={activity.type} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-stone-700 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-slate-600 dark:text-stone-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-700 dark:text-stone-300">{activity.label}</span>
                    <span className="text-sm font-medium text-slate-800 dark:text-stone-100">{activity.count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-stone-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      className="h-full bg-blue-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================
// WEEKLY PROGRESS
// ============================================

interface WeeklyProgressChartProps {
  progress: WeeklyProgress[]
  t: (key: string, options?: Record<string, unknown>) => string
}

function WeeklyProgressChart({ progress, t }: WeeklyProgressChartProps) {
  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-slate-200 dark:border-stone-700 p-6">
      <h3 className="font-semibold text-slate-800 dark:text-stone-100 mb-4 flex items-center gap-2">
        <Calendar size={20} className="text-emerald-500" />
        {t('dashboard.insights.weeklyProgress')}
      </h3>
      <div className="space-y-4">
        {progress.map(week => (
          <div key={week.week} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-stone-400">{t('dashboard.insights.week', { number: week.week })}</span>
              <span className="text-xs text-slate-600 dark:text-stone-400">
                {t('dashboard.insights.activitiesCount', { count: week.applications + week.exercises })}
              </span>
            </div>
            <div className="flex gap-1 h-6">
              {week.applications > 0 && (
                <div
                  className="bg-emerald-500 rounded-l"
                  style={{ flex: week.applications }}
                  title={t('dashboard.insights.applicationsCount', { count: week.applications })}
                />
              )}
              {week.exercises > 0 && (
                <div
                  className="bg-blue-500"
                  style={{ flex: week.exercises }}
                  title={t('dashboard.insights.exercisesCount', { count: week.exercises })}
                />
              )}
              {week.applications === 0 && week.exercises === 0 && (
                <div className="flex-1 bg-slate-100 dark:bg-stone-700 rounded" />
              )}
            </div>
          </div>
        ))}
        <div className="flex gap-4 mt-2 text-xs text-slate-700 dark:text-stone-300">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-emerald-500 rounded" />
            {t('dashboard.insights.applications')}
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            {t('dashboard.insights.exercises')}
          </span>
        </div>
      </div>
    </div>
  )
}

// ============================================
// RECOMMENDATIONS
// ============================================

interface RecommendationsSectionProps {
  recommendations: PersonalizedRecommendation[]
  expandedId: string | null
  onToggle: (id: string) => void
  t: (key: string, options?: Record<string, unknown>) => string
}

function RecommendationsSection({ recommendations, expandedId, onToggle, t }: RecommendationsSectionProps) {
  const priorityColors = {
    high: 'border-red-200 dark:border-red-700 bg-red-50/50 dark:bg-red-900/20',
    medium: 'border-amber-200 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/20',
    low: 'border-slate-200 dark:border-stone-700'
  }

  const categoryIcons = {
    application: Send,
    learning: BookOpen,
    wellness: Heart,
    profile: Briefcase
  }

  return (
    <div>
      <h3 className="font-semibold text-slate-800 dark:text-stone-100 mb-4 flex items-center gap-2">
        <Target size={20} className="text-brand-700" />
        {t('dashboard.insights.personalRecommendations')}
      </h3>
      <div className="space-y-3">
        {recommendations.map((rec, index) => {
          const Icon = categoryIcons[rec.category]

          return (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "bg-white dark:bg-stone-900 p-4 rounded-xl border transition-colors cursor-pointer hover:",
                priorityColors[rec.priority]
              )}
              onClick={() => onToggle(rec.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    rec.priority === 'high' ? "bg-red-100 dark:bg-red-900/40" :
                    rec.priority === 'medium' ? "bg-amber-100 dark:bg-amber-900/40" : "bg-brand-100 dark:bg-brand-900/40"
                  )}>
                    <Icon size={18} className={cn(
                      rec.priority === 'high' ? "text-red-600 dark:text-red-400" :
                      rec.priority === 'medium' ? "text-amber-600 dark:text-amber-400" : "text-brand-900 dark:text-brand-400"
                    )} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-stone-100">{rec.action}</h4>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{rec.impact}</p>
                  </div>
                </div>
                {expandedId === rec.id ? (
                  <ChevronUp size={20} className="text-slate-600 dark:text-stone-400" />
                ) : (
                  <ChevronDown size={20} className="text-slate-600 dark:text-stone-400" />
                )}
              </div>
              {expandedId === rec.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-3 pt-3 border-t border-slate-100 dark:border-stone-700"
                >
                  <p className="text-sm text-slate-600 dark:text-stone-400">{rec.reason}</p>
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// PATTERNS
// ============================================

interface PatternsSectionProps {
  mostActiveDay: string
  mostActiveHour: number
  conversionRate: number
  activitySummary: { total: number; trend: string }
  t: (key: string, options?: Record<string, unknown>) => string
}

function PatternsSection({ mostActiveDay, mostActiveHour, conversionRate, activitySummary, t }: PatternsSectionProps) {
  const patterns = [
    {
      text: t('dashboard.insights.patterns.mostActiveDay', { day: mostActiveDay }),
      icon: Calendar
    },
    {
      text: t('dashboard.insights.patterns.productiveTime', { time: mostActiveHour.toString().padStart(2, '0') + ':00' }),
      icon: Clock
    },
    activitySummary.total > 0 && {
      text: t('dashboard.insights.patterns.activitiesLast30Days', { count: activitySummary.total }),
      icon: Activity
    },
    conversionRate > 0 && {
      text: t('dashboard.insights.patterns.conversionRate', { rate: conversionRate }),
      icon: TrendingUp
    }
  ].filter(Boolean) as { text: string; icon: React.ElementType }[]

  if (patterns.length === 0) {
    return null
  }

  return (
    <div>
      <h3 className="font-semibold text-slate-800 dark:text-stone-100 mb-4 flex items-center gap-2">
        <Lightbulb size={20} className="text-amber-500" />
        {t('dashboard.insights.yourPatterns')}
      </h3>
      <div className="space-y-3">
        {patterns.map((pattern, index) => (
          <div key={index} className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-stone-800 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-stone-700 flex items-center justify-center flex-shrink-0">
              <pattern.icon size={14} className="text-brand-700" />
            </div>
            <p className="text-slate-700 dark:text-stone-300">{pattern.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
