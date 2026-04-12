/**
 * Insights Panel Component
 * Displays AI-driven insights about participants for consultants
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  RefreshCw,
  Users,
  Target,
  FileText,
  Briefcase,
  Award,
  Clock,
  AlertTriangle,
  Loader2
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  consultantInsights,
  type ParticipantInsight,
  type TrendData,
  type ParticipantRisk
} from '@/services/consultantInsights'
import { supabase } from '@/lib/supabase'

interface InsightsPanelProps {
  maxInsights?: number
  showTrends?: boolean
  showRisks?: boolean
  compact?: boolean
}

export function InsightsPanel({
  maxInsights = 5,
  showTrends = true,
  showRisks = true,
  compact = false
}: InsightsPanelProps) {
  const [insights, setInsights] = useState<ParticipantInsight[]>([])
  const [trends, setTrends] = useState<TrendData[]>([])
  const [risks, setRisks] = useState<ParticipantRisk[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'insights' | 'trends' | 'risks'>('insights')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [insightsData, trendsData, risksData] = await Promise.all([
        consultantInsights.generateParticipantInsights(user.id, maxInsights),
        showTrends ? consultantInsights.calculateTrends(user.id) : Promise.resolve([]),
        showRisks ? consultantInsights.assessParticipantRisks(user.id) : Promise.resolve([])
      ])

      setInsights(insightsData)
      setTrends(trendsData)
      setRisks(risksData.slice(0, 5))
    } catch (error) {
      console.error('Failed to load insights:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refresh = async () => {
    setIsRefreshing(true)
    await loadData()
    setIsRefreshing(false)
  }

  const getInsightIcon = (type: ParticipantInsight['type']) => {
    switch (type) {
      case 'engagement_drop':
        return <AlertTriangle className="w-4 h-4" />
      case 'goal_at_risk':
      case 'milestone_overdue':
        return <Target className="w-4 h-4" />
      case 'cv_improvement':
        return <FileText className="w-4 h-4" />
      case 'ready_for_jobs':
        return <Briefcase className="w-4 h-4" />
      case 'high_performer':
        return <Award className="w-4 h-4" />
      case 'needs_support':
        return <Users className="w-4 h-4" />
      default:
        return <Sparkles className="w-4 h-4" />
    }
  }

  const getInsightColor = (type: ParticipantInsight['type']) => {
    switch (type) {
      case 'engagement_drop':
      case 'goal_at_risk':
      case 'milestone_overdue':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
      case 'cv_improvement':
      case 'needs_support':
        return 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400'
      case 'ready_for_jobs':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
      case 'high_performer':
        return 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
      default:
        return 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
    }
  }

  const getPriorityBadge = (priority: ParticipantInsight['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      case 'medium':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
      case 'low':
        return 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
    }
  }

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'bg-red-500'
    if (score >= 40) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
          <span className="ml-2 text-stone-600 dark:text-stone-400">Analyserar data...</span>
        </div>
      </Card>
    )
  }

  if (compact) {
    const topInsight = insights[0]
    if (!topInsight) return null

    return (
      <Link
        to={topInsight.actionPath}
        className="flex items-center gap-3 p-4 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 hover:shadow-md transition-shadow"
      >
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', getInsightColor(topInsight.type))}>
          {getInsightIcon(topInsight.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-stone-800 dark:text-stone-200 truncate">{topInsight.title}</p>
          <p className="text-sm text-stone-500 dark:text-stone-400 truncate">{topInsight.description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-stone-400" />
      </Link>
    )
  }

  return (
    <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-b border-violet-100 dark:border-violet-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="font-semibold text-violet-900 dark:text-violet-100">
                AI-insikter
              </h3>
              <p className="text-sm text-violet-700 dark:text-violet-400">
                Baserat på deltagardata
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            disabled={isRefreshing}
            className="text-violet-600 dark:text-violet-400"
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      {(showTrends || showRisks) && (
        <div className="flex border-b border-stone-200 dark:border-stone-700">
          <button
            onClick={() => setActiveTab('insights')}
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium transition-colors',
              activeTab === 'insights'
                ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
            )}
          >
            Insikter ({insights.length})
          </button>
          {showTrends && (
            <button
              onClick={() => setActiveTab('trends')}
              className={cn(
                'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                activeTab === 'trends'
                  ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
              )}
            >
              Trender
            </button>
          )}
          {showRisks && (
            <button
              onClick={() => setActiveTab('risks')}
              className={cn(
                'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                activeTab === 'risks'
                  ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
              )}
            >
              Risker ({risks.length})
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto">
        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <>
            {insights.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
                  <Award className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-stone-600 dark:text-stone-400 font-medium">Inga insikter just nu</p>
                <p className="text-sm text-stone-500 dark:text-stone-500 mt-1">
                  Alla deltagare ser bra ut!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100 dark:divide-stone-700">
                {insights.map((insight) => (
                  <Link
                    key={`${insight.participantId}-${insight.type}`}
                    to={insight.actionPath}
                    className="flex items-start gap-3 p-4 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
                  >
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                      getInsightColor(insight.type)
                    )}>
                      {getInsightIcon(insight.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          'px-1.5 py-0.5 text-xs font-medium rounded',
                          getPriorityBadge(insight.priority)
                        )}>
                          {insight.priority === 'high' ? 'Hög' : insight.priority === 'medium' ? 'Medel' : 'Låg'}
                        </span>
                        {insight.metric && (
                          <span className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
                            {insight.trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                            {insight.trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
                            {insight.metric}
                          </span>
                        )}
                      </div>
                      <h4 className="font-medium text-stone-800 dark:text-stone-200 text-sm">
                        {insight.title}
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-2">
                        {insight.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs text-violet-600 dark:text-violet-400 hidden sm:inline">
                        {insight.actionLabel}
                      </span>
                      <ChevronRight className="w-4 h-4 text-stone-400" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && showTrends && (
          <div className="p-4 space-y-4">
            {trends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-900/50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-stone-700 dark:text-stone-300">{trend.label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                      {trend.current}{trend.label.includes('%') || trend.label.includes('poäng') ? '%' : ''}
                    </span>
                    <span className={cn(
                      'flex items-center gap-0.5 text-sm font-medium px-2 py-0.5 rounded',
                      trend.isPositive
                        ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30'
                        : 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30'
                    )}>
                      {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {trend.isPositive ? '+' : ''}{trend.change}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-stone-500 dark:text-stone-400">Förra perioden</p>
                  <p className="text-lg font-semibold text-stone-600 dark:text-stone-400">
                    {trend.previous}{trend.label.includes('%') || trend.label.includes('poäng') ? '%' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Risks Tab */}
        {activeTab === 'risks' && showRisks && (
          <>
            {risks.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
                  <Award className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-stone-600 dark:text-stone-400 font-medium">Inga riskdeltagare</p>
                <p className="text-sm text-stone-500 dark:text-stone-500 mt-1">
                  Alla deltagare är på rätt spår
                </p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100 dark:divide-stone-700">
                {risks.map((risk) => (
                  <div key={risk.participantId} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-stone-800 dark:text-stone-200">
                        {risk.participantName}
                      </h4>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', getRiskColor(risk.riskScore))}
                            style={{ width: `${risk.riskScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-stone-600 dark:text-stone-400">
                          {risk.riskScore}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 mb-2">
                      {risk.riskFactors.map((factor, i) => (
                        <p key={i} className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {factor}
                        </p>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {risk.recommendedActions.slice(0, 2).map((action, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded"
                        >
                          {action}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  )
}

export default InsightsPanel
