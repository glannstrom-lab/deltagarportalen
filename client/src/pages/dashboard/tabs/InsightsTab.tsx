/**
 * InsightsTab - Real analytics and personalized insights
 * Shows activity patterns, trends, and AI recommendations
 */

import { useState } from 'react'
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
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin mx-auto mb-3" aria-hidden="true" />
          <p className="text-slate-700">Analyserar dina mönster...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Brain className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">
          Kunde inte ladda insikter
        </h3>
        <p className="text-slate-700 mb-4">{error}</p>
        <Button onClick={refresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Försök igen
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Brain className="text-violet-500" size={28} />
            Mina insikter
          </h2>
          <p className="text-slate-700">Analys baserad på din aktivitet</p>
        </div>
        <Button onClick={refresh} variant="secondary" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Uppdatera
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={Activity}
          label="Aktiviteter denna vecka"
          value={data.activitySummary.thisWeek}
          trend={data.activitySummary.trend}
          changePercent={data.activitySummary.changePercent}
          color="violet"
        />
        <SummaryCard
          icon={Flame}
          label="Streak"
          value={`${data.streakDays} dagar`}
          color="orange"
        />
        <SummaryCard
          icon={Clock}
          label="Bästa tiden"
          value={`${data.mostActiveHour.toString().padStart(2, '0')}:00`}
          subtext={data.mostActiveDay}
          color="blue"
        />
        <SummaryCard
          icon={Smile}
          label="Genomsnittligt mående"
          value={data.averageMoodThisWeek > 0 ? `${data.averageMoodThisWeek}/5` : '-'}
          color="emerald"
        />
      </div>

      {/* Activity Chart */}
      <ActivityChart dailyActivity={data.dailyActivity} />

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity breakdown */}
        <ActivityBreakdown activities={data.activityByType} />

        {/* Weekly progress */}
        <WeeklyProgressChart progress={data.weeklyProgress} />
      </div>

      {/* Recommendations */}
      <RecommendationsSection
        recommendations={data.recommendations}
        expandedId={expandedRecommendation}
        onToggle={(id) => setExpandedRecommendation(expandedRecommendation === id ? null : id)}
      />

      {/* Patterns & Tips */}
      <PatternsSection
        mostActiveDay={data.mostActiveDay}
        mostActiveHour={data.mostActiveHour}
        conversionRate={data.applicationConversionRate}
        activitySummary={data.activitySummary}
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
    violet: 'bg-violet-100 text-violet-600',
    orange: 'bg-orange-100 text-orange-600',
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600'
  }

  const trendColors = {
    up: 'text-emerald-600',
    down: 'text-red-500',
    stable: 'text-slate-700'
  }

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", colorClasses[color])}>
        <Icon size={20} />
      </div>
      <p className="text-sm text-slate-700">{label}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        {trend && changePercent !== undefined && (
          <span className={cn("flex items-center text-sm font-medium", trendColors[trend])}>
            <TrendIcon size={14} className="mr-0.5" />
            {changePercent > 0 ? '+' : ''}{changePercent}%
          </span>
        )}
      </div>
      {subtext && <p className="text-xs text-slate-600 mt-1">{subtext}</p>}
    </div>
  )
}

// ============================================
// ACTIVITY CHART
// ============================================

interface ActivityChartProps {
  dailyActivity: DailyActivity[]
}

function ActivityChart({ dailyActivity }: ActivityChartProps) {
  const maxCount = Math.max(...dailyActivity.map(d => d.count), 1)

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <BarChart3 size={20} className="text-violet-500" />
        Aktivitet senaste 14 dagarna
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
                  isToday ? "bg-violet-500" : "bg-violet-200",
                  day.count === 0 && "bg-slate-100"
                )}
                title={`${day.date}: ${day.count} aktiviteter`}
              />
              <span className={cn(
                "text-xs",
                isToday ? "text-violet-600 font-medium" : "text-slate-600"
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
}

function ActivityBreakdown({ activities }: ActivityBreakdownProps) {
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
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Activity size={20} className="text-blue-500" />
        Aktivitetsfördelning
      </h3>
      {activities.length === 0 ? (
        <p className="text-slate-700 text-sm py-4 text-center">
          Ingen aktivitet registrerad ännu
        </p>
      ) : (
        <div className="space-y-3">
          {activities.map(activity => {
            const Icon = getIcon(activity.type)
            const percent = Math.round((activity.count / total) * 100)

            return (
              <div key={activity.type} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-slate-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-700">{activity.label}</span>
                    <span className="text-sm font-medium text-slate-800">{activity.count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
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
}

function WeeklyProgressChart({ progress }: WeeklyProgressChartProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Calendar size={20} className="text-emerald-500" />
        Veckoutveckling
      </h3>
      <div className="space-y-4">
        {progress.map(week => (
          <div key={week.week} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Vecka {week.week}</span>
              <span className="text-xs text-slate-600">
                {week.applications + week.exercises} aktiviteter
              </span>
            </div>
            <div className="flex gap-1 h-6">
              {week.applications > 0 && (
                <div
                  className="bg-emerald-500 rounded-l"
                  style={{ flex: week.applications }}
                  title={`${week.applications} ansökningar`}
                />
              )}
              {week.exercises > 0 && (
                <div
                  className="bg-blue-500"
                  style={{ flex: week.exercises }}
                  title={`${week.exercises} övningar`}
                />
              )}
              {week.applications === 0 && week.exercises === 0 && (
                <div className="flex-1 bg-slate-100 rounded" />
              )}
            </div>
          </div>
        ))}
        <div className="flex gap-4 mt-2 text-xs">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-emerald-500 rounded" />
            Ansökningar
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            Övningar
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
}

function RecommendationsSection({ recommendations, expandedId, onToggle }: RecommendationsSectionProps) {
  const priorityColors = {
    high: 'border-red-200 bg-red-50/50',
    medium: 'border-amber-200 bg-amber-50/50',
    low: 'border-slate-200'
  }

  const categoryIcons = {
    application: Send,
    learning: BookOpen,
    wellness: Heart,
    profile: Briefcase
  }

  return (
    <div>
      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Target size={20} className="text-violet-500" />
        Personliga rekommendationer
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
                "bg-white p-4 rounded-xl border transition-colors cursor-pointer hover:shadow-md",
                priorityColors[rec.priority]
              )}
              onClick={() => onToggle(rec.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    rec.priority === 'high' ? "bg-red-100" :
                    rec.priority === 'medium' ? "bg-amber-100" : "bg-violet-100"
                  )}>
                    <Icon size={18} className={cn(
                      rec.priority === 'high' ? "text-red-600" :
                      rec.priority === 'medium' ? "text-amber-600" : "text-violet-600"
                    )} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{rec.action}</h4>
                    <p className="text-sm text-emerald-600 font-medium">{rec.impact}</p>
                  </div>
                </div>
                {expandedId === rec.id ? (
                  <ChevronUp size={20} className="text-slate-600" />
                ) : (
                  <ChevronDown size={20} className="text-slate-600" />
                )}
              </div>
              {expandedId === rec.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-3 pt-3 border-t border-slate-100"
                >
                  <p className="text-sm text-slate-600">{rec.reason}</p>
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
}

function PatternsSection({ mostActiveDay, mostActiveHour, conversionRate, activitySummary }: PatternsSectionProps) {
  const patterns = [
    {
      text: `Du är mest aktiv på ${mostActiveDay}ar`,
      icon: Calendar
    },
    {
      text: `Din produktivaste tid är klockan ${mostActiveHour.toString().padStart(2, '0')}:00`,
      icon: Clock
    },
    activitySummary.total > 0 && {
      text: `Du har gjort ${activitySummary.total} aktiviteter de senaste 30 dagarna`,
      icon: Activity
    },
    conversionRate > 0 && {
      text: `${conversionRate}% av dina ansökningar leder till intervju`,
      icon: TrendingUp
    }
  ].filter(Boolean) as { text: string; icon: React.ElementType }[]

  if (patterns.length === 0) {
    return null
  }

  return (
    <div>
      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Lightbulb size={20} className="text-amber-500" />
        Dina mönster
      </h3>
      <div className="space-y-3">
        {patterns.map((pattern, index) => (
          <div key={index} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
              <pattern.icon size={14} className="text-violet-500" />
            </div>
            <p className="text-slate-700">{pattern.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
