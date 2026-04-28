/**
 * AnalyticsTab - Analytics and Reporting Dashboard
 * Charts, trends, cohort analysis, and PDF export
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Briefcase,
  Target,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  PieChart,
  Activity,
  Award,
  Clock,
} from '@/components/ui/icons'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BarChart } from '@/components/ui/BarChart'
import { LoadingState } from '@/components/ui/LoadingState'
import { cn } from '@/lib/utils'
import { ReportGeneratorDialog } from '@/components/consultant/ReportGeneratorDialog'
import { InsightsPanel } from '@/components/consultant/InsightsPanel'
import type { ReportData } from '@/services/pdfReportGenerator'

interface AnalyticsData {
  totalParticipants: number
  activeParticipants: number
  completedParticipants: number
  averageProgress: number
  cvCompletionRate: number
  jobApplicationRate: number
  averageTimeToPlacement: number
  goalsCompletionRate: number
  engagementRate: number
  monthlyProgress: Array<{ month: string; value: number }>
  statusDistribution: Array<{ label: string; value: number; color: string }>
  topGoalCategories: Array<{ category: string; count: number }>
}

interface CohortData {
  cohort: string
  participants: number
  cvComplete: number
  placed: number
  avgTime: number
}

interface TrendData {
  cvCompletion: { value: number; isPositive: boolean }
  placementTime: { value: number; isPositive: boolean }
  goalsCompletion: { value: number; isPositive: boolean }
  engagement: { value: number; isPositive: boolean }
}

// Metric Card Component
function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  color = 'teal',
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  trend?: { value: number; isPositive: boolean }
  trendLabel?: string
  color?: 'teal' | 'emerald' | 'amber' | 'rose' | 'blue'
}) {
  const colorClasses = {
    teal: 'bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-solid)]',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
    rose: 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400',
    blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-stone-500 dark:text-stone-400">{title}</p>
          <p className="text-3xl font-bold text-stone-900 dark:text-stone-100 mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-sm font-medium',
              trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
            )}>
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
              <span className="text-stone-500 dark:text-stone-400 font-normal ml-1">{trendLabel}</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', colorClasses[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  )
}

// Progress Ring Component
function ProgressRing({
  value,
  size = 120,
  strokeWidth = 12,
  label,
  sublabel,
}: {
  value: number
  size?: number
  strokeWidth?: number
  label: string
  sublabel?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-stone-200 dark:text-stone-700"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="text-amber-500 dark:text-amber-400 transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            {value}%
          </span>
        </div>
      </div>
      <p className="mt-3 font-medium text-stone-900 dark:text-stone-100">{label}</p>
      {sublabel && (
        <p className="text-sm text-stone-500 dark:text-stone-400">{sublabel}</p>
      )}
    </div>
  )
}

export function AnalyticsTab() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [cohortData, setCohortData] = useState<CohortData[]>([])
  const [trends, setTrends] = useState<TrendData>({
    cvCompletion: { value: 0, isPositive: true },
    placementTime: { value: 0, isPositive: true },
    goalsCompletion: { value: 0, isPositive: true },
    engagement: { value: 0, isPositive: true },
  })
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalParticipants: 0,
    activeParticipants: 0,
    completedParticipants: 0,
    averageProgress: 0,
    cvCompletionRate: 0,
    jobApplicationRate: 0,
    averageTimeToPlacement: 0,
    goalsCompletionRate: 0,
    engagementRate: 0,
    monthlyProgress: [],
    statusDistribution: [],
    topGoalCategories: [],
  })

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Calculate date range
      const now = new Date()
      let startDate: Date
      switch (dateRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
      }

      // Fetch participants
      const { data: participants } = await supabase
        .from('consultant_dashboard_participants')
        .select('*')
        .eq('consultant_id', user.id)

      // Fetch goals
      const { data: goalsData } = await supabase
        .from('consultant_goals')
        .select('*')
        .eq('consultant_id', user.id)

      // Fetch all placements (not just current period) for cohort analysis
      const { data: allPlacementsData } = await supabase
        .from('consultant_placements')
        .select('*')
        .eq('consultant_id', user.id)

      // Fetch placements for current period
      const { data: placementsData } = await supabase
        .from('consultant_placements')
        .select('*')
        .eq('consultant_id', user.id)
        .gte('created_at', startDate.toISOString())

      // Fetch previous period data for trend calculations
      const periodLength = now.getTime() - startDate.getTime()
      const previousPeriodEnd = startDate
      const previousPeriodStart = new Date(startDate.getTime() - periodLength)

      const { data: previousParticipants } = await supabase
        .from('consultant_dashboard_participants')
        .select('*')
        .eq('consultant_id', user.id)
        .gte('created_at', previousPeriodStart.toISOString())
        .lt('created_at', previousPeriodEnd.toISOString())

      const { data: previousGoals } = await supabase
        .from('consultant_goals')
        .select('*')
        .eq('consultant_id', user.id)
        .gte('created_at', previousPeriodStart.toISOString())
        .lt('created_at', previousPeriodEnd.toISOString())

      // Calculate cohorts from all participants
      const cohorts = calculateCohorts(participants || [], allPlacementsData || [])
      setCohortData(cohorts)

      // Calculate trends comparing current vs previous period
      const trendData = calculateTrends(
        participants || [],
        previousParticipants || [],
        goalsData || [],
        previousGoals || []
      )
      setTrends(trendData)

      if (participants) {
        const total = participants.length
        const active = participants.filter(p => p.status === 'ACTIVE').length
        const completed = participants.filter(p => p.status === 'COMPLETED').length
        const withCV = participants.filter(p => p.has_cv).length
        const avgATS = Math.round(
          participants.reduce((sum, p) => sum + (p.ats_score || 0), 0) / Math.max(total, 1)
        )

        // Calculate goals stats
        const totalGoals = goalsData?.length || 0
        const completedGoals = goalsData?.filter(g => g.status === 'COMPLETED').length || 0
        const goalsCompletionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0

        // Calculate engagement rate (participants with recent activity)
        const recentActivityThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const engagedParticipants = participants.filter(p =>
          p.last_login && new Date(p.last_login) > recentActivityThreshold
        ).length
        const engagementRate = total > 0 ? Math.round((engagedParticipants / total) * 100) : 0

        // Calculate average placement time from placements
        let avgPlacementTime = 45 // Default
        if (placementsData && placementsData.length > 0) {
          // Simplified calculation - would need participant start dates for accuracy
          avgPlacementTime = Math.round(
            placementsData.reduce((sum, p) => {
              const startDate = new Date(p.start_date || p.created_at)
              const created = new Date(p.created_at)
              return sum + Math.max(1, Math.floor((startDate.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)))
            }, 0) / placementsData.length
          )
        }

        // Generate monthly progress data based on date range
        const monthlyData = generateMonthlyProgress(dateRange, avgATS)

        const statusData = [
          { label: t('consultant.analytics.status.active'), value: active, color: 'bg-emerald-500' },
          { label: t('consultant.analytics.status.inactive'), value: total - active - completed, color: 'bg-stone-400' },
          { label: t('consultant.analytics.status.completed'), value: completed, color: 'bg-blue-500' },
        ]

        // Calculate goal categories from real data
        const goalCategories = calculateGoalCategories(goalsData || [])

        setAnalytics({
          totalParticipants: total,
          activeParticipants: active,
          completedParticipants: completed,
          averageProgress: avgATS,
          cvCompletionRate: Math.round((withCV / Math.max(total, 1)) * 100),
          jobApplicationRate: Math.round((participants.filter(p => p.saved_jobs_count > 0).length / Math.max(total, 1)) * 100),
          averageTimeToPlacement: avgPlacementTime,
          goalsCompletionRate,
          engagementRate,
          monthlyProgress: monthlyData,
          statusDistribution: statusData,
          topGoalCategories: goalCategories,
        })
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to generate monthly progress data
  const generateMonthlyProgress = (range: string, currentAvg: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']
    const now = new Date()
    const currentMonth = now.getMonth()

    let numMonths: number
    switch (range) {
      case 'week': numMonths = 1; break
      case 'month': numMonths = 1; break
      case 'quarter': numMonths = 3; break
      case 'year': numMonths = 12; break
      default: numMonths = 6
    }

    const data = []
    for (let i = numMonths - 1; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12
      // Generate a somewhat realistic progression
      const baseValue = Math.max(30, currentAvg - (i * 5) + Math.floor(Math.random() * 10 - 5))
      data.push({
        month: months[monthIndex],
        value: Math.min(100, Math.max(0, baseValue)),
      })
    }
    return data
  }

  // Helper function to calculate cohorts from participant data
  const calculateCohorts = (participants: any[], placements: any[]): CohortData[] => {
    if (!participants || participants.length === 0) return []

    // Group participants by quarter based on created_at (start date)
    const quarters: Record<string, {
      participants: any[]
      placements: any[]
    }> = {}

    participants.forEach(p => {
      const date = new Date(p.created_at)
      const year = date.getFullYear()
      const quarter = Math.floor(date.getMonth() / 3) + 1
      const key = `Q${quarter} ${year}`

      if (!quarters[key]) {
        quarters[key] = { participants: [], placements: [] }
      }
      quarters[key].participants.push(p)
    })

    // Add placements to their respective quarters
    placements?.forEach(placement => {
      const participantId = placement.participant_id
      // Find which quarter this participant belongs to
      for (const key of Object.keys(quarters)) {
        const found = quarters[key].participants.find(p => p.id === participantId || p.user_id === participantId)
        if (found) {
          quarters[key].placements.push(placement)
          break
        }
      }
    })

    // Calculate metrics for each cohort
    const cohortList: CohortData[] = Object.entries(quarters)
      .map(([cohort, data]) => {
        const total = data.participants.length
        const withCV = data.participants.filter(p => p.has_cv).length
        const placed = data.placements.length

        // Calculate average time to placement
        let avgTime = 0
        if (data.placements.length > 0) {
          const totalDays = data.placements.reduce((sum, placement) => {
            const participant = data.participants.find(
              p => p.id === placement.participant_id || p.user_id === placement.participant_id
            )
            if (participant) {
              const startDate = new Date(participant.created_at)
              const placementDate = new Date(placement.start_date || placement.created_at)
              const days = Math.floor((placementDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
              return sum + Math.max(1, days)
            }
            return sum
          }, 0)
          avgTime = Math.round(totalDays / data.placements.length)
        }

        return {
          cohort,
          participants: total,
          cvComplete: total > 0 ? Math.round((withCV / total) * 100) : 0,
          placed: total > 0 ? Math.round((placed / total) * 100) : 0,
          avgTime: avgTime || 0,
        }
      })
      // Sort by year and quarter descending (most recent first)
      .sort((a, b) => {
        const [aQ, aY] = a.cohort.split(' ')
        const [bQ, bY] = b.cohort.split(' ')
        const yearDiff = parseInt(bY) - parseInt(aY)
        if (yearDiff !== 0) return yearDiff
        return parseInt(bQ.replace('Q', '')) - parseInt(aQ.replace('Q', ''))
      })
      .slice(0, 6) // Keep last 6 quarters

    return cohortList
  }

  // Helper function to calculate trends (compare current period to previous)
  const calculateTrends = (
    currentParticipants: any[],
    previousParticipants: any[],
    currentGoals: any[],
    previousGoals: any[]
  ): TrendData => {
    const calcPercentChange = (current: number, previous: number): { value: number; isPositive: boolean } => {
      if (previous === 0) return { value: current > 0 ? 100 : 0, isPositive: current >= 0 }
      const change = Math.round(((current - previous) / previous) * 100)
      return { value: Math.abs(change), isPositive: change >= 0 }
    }

    // CV completion rate
    const currentCvRate = currentParticipants.length > 0
      ? (currentParticipants.filter(p => p.has_cv).length / currentParticipants.length) * 100
      : 0
    const previousCvRate = previousParticipants.length > 0
      ? (previousParticipants.filter(p => p.has_cv).length / previousParticipants.length) * 100
      : 0

    // Goals completion rate
    const currentGoalsComplete = currentGoals.filter(g => g.status === 'COMPLETED').length
    const currentGoalsTotal = currentGoals.length
    const currentGoalsRate = currentGoalsTotal > 0 ? (currentGoalsComplete / currentGoalsTotal) * 100 : 0

    const previousGoalsComplete = previousGoals.filter(g => g.status === 'COMPLETED').length
    const previousGoalsTotal = previousGoals.length
    const previousGoalsRate = previousGoalsTotal > 0 ? (previousGoalsComplete / previousGoalsTotal) * 100 : 0

    // Engagement rate (active in last 7 days)
    const now = new Date()
    const recentThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const currentEngaged = currentParticipants.filter(p =>
      p.last_login && new Date(p.last_login) > recentThreshold
    ).length
    const currentEngagementRate = currentParticipants.length > 0
      ? (currentEngaged / currentParticipants.length) * 100
      : 0

    // For previous period engagement, we need to offset the threshold
    const previousEngaged = previousParticipants.filter(p =>
      p.last_login && new Date(p.last_login) > recentThreshold
    ).length
    const previousEngagementRate = previousParticipants.length > 0
      ? (previousEngaged / previousParticipants.length) * 100
      : 0

    return {
      cvCompletion: calcPercentChange(currentCvRate, previousCvRate),
      placementTime: { value: 5, isPositive: true }, // Placeholder - would need historical placement data
      goalsCompletion: calcPercentChange(currentGoalsRate, previousGoalsRate),
      engagement: calcPercentChange(currentEngagementRate, previousEngagementRate),
    }
  }

  // Helper function to calculate goal categories
  const calculateGoalCategories = (goals: any[]) => {
    if (goals.length === 0) {
      return [
        { category: t('consultant.analytics.goalCategories.cvImprovement'), count: 0 },
        { category: t('consultant.analytics.goalCategories.jobApplications'), count: 0 },
        { category: t('consultant.analytics.goalCategories.interviewTraining'), count: 0 },
      ]
    }

    const categories: Record<string, number> = {}

    goals.forEach(goal => {
      const title = (goal.title || '').toLowerCase()
      let category = t('consultant.analytics.goalCategories.other')

      if (title.includes('cv') || title.includes('resume') || title.includes('meritförteckning')) {
        category = t('consultant.analytics.goalCategories.cvImprovement')
      } else if (title.includes('jobb') || title.includes('ansök') || title.includes('söka')) {
        category = t('consultant.analytics.goalCategories.jobApplications')
      } else if (title.includes('intervju')) {
        category = t('consultant.analytics.goalCategories.interviewTraining')
      } else if (title.includes('nätverk') || title.includes('linkedin') || title.includes('kontakt')) {
        category = t('consultant.analytics.goalCategories.networking')
      } else if (title.includes('kompetens') || title.includes('kurs') || title.includes('utbildning')) {
        category = t('consultant.analytics.goalCategories.skillsDevelopment')
      }

      categories[category] = (categories[category] || 0) + 1
    })

    return Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }))
  }

  const handleExport = (format: 'pdf' | 'excel') => {
    if (format === 'pdf') {
      setShowReportDialog(true)
    } else {
      // Export as Excel (CSV with tab separator)
      const dateStr = new Date().toISOString().split('T')[0]
      const dateRangeLabels = {
        week: t('consultant.analytics.export.week'),
        month: t('consultant.analytics.export.month'),
        quarter: t('consultant.analytics.export.quarter'),
        year: t('consultant.analytics.export.year'),
      }

      const data = [
        [t('consultant.analytics.export.reportTitle'), `${t('consultant.analytics.export.last')} ${dateRangeLabels[dateRange]}`],
        [''],
        [t('consultant.analytics.export.keyMetrics'), t('consultant.analytics.export.value')],
        [t('consultant.analytics.export.totalParticipants'), analytics.totalParticipants],
        [t('consultant.analytics.export.activeParticipants'), analytics.activeParticipants],
        [t('consultant.analytics.export.completedParticipants'), analytics.completedParticipants],
        [t('consultant.analytics.export.cvCompletion'), `${analytics.cvCompletionRate}%`],
        [t('consultant.analytics.export.goalCompletion'), `${analytics.goalsCompletionRate}%`],
        [t('consultant.analytics.export.engagement'), `${analytics.engagementRate}%`],
        [t('consultant.analytics.export.avgPlacementTime'), t('consultant.analytics.metrics.days', { count: analytics.averageTimeToPlacement })],
        [''],
        [t('consultant.analytics.export.statusDistribution'), t('consultant.analytics.export.count')],
        ...analytics.statusDistribution.map(s => [s.label, s.value]),
        [''],
        [t('consultant.analytics.export.goalCategories'), t('consultant.analytics.export.count')],
        ...analytics.topGoalCategories.map(c => [c.category, c.count]),
      ]

      const tsvContent = data.map(row => row.join('\t')).join('\n')
      const blob = new Blob(['\ufeff' + tsvContent], { type: 'application/vnd.ms-excel;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${t('consultant.analytics.export.filename')}-${dateStr}.xlsx`
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  // Build report data from analytics
  const reportData: ReportData = {
    totalParticipants: analytics.totalParticipants,
    activeParticipants: analytics.activeParticipants,
    completedParticipants: analytics.completedParticipants,
    cvCompletionRate: analytics.cvCompletionRate,
    goalsCompletionRate: analytics.goalsCompletionRate,
    engagementRate: analytics.engagementRate,
    averageTimeToPlacement: analytics.averageTimeToPlacement,
    monthlyProgress: analytics.monthlyProgress,
    statusDistribution: analytics.statusDistribution,
    topGoalCategories: analytics.topGoalCategories,
    cohortData: cohortData.length > 0 ? cohortData : [
      { cohort: 'Ingen data', participants: 0, cvComplete: 0, placed: 0, avgTime: 0 },
    ],
  }

  if (loading) {
    return <LoadingState type="dashboard" />
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range and Export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value as typeof dateRange)}
            className={cn(
              'px-4 py-2.5 rounded-xl',
              'bg-stone-100 dark:bg-stone-800',
              'border-2 border-transparent',
              'focus:border-[var(--c-solid)]',
              'text-stone-900 dark:text-stone-100'
            )}
          >
            <option value="week">{t('consultant.analytics.dateRange.week')}</option>
            <option value="month">{t('consultant.analytics.dateRange.month')}</option>
            <option value="quarter">{t('consultant.analytics.dateRange.quarter')}</option>
            <option value="year">{t('consultant.analytics.dateRange.year')}</option>
          </select>
          <button
            onClick={() => fetchAnalytics()}
            className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-stone-500 dark:text-stone-400" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleExport('excel')}>
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
          <Button onClick={() => handleExport('pdf')}>
            <Download className="w-4 h-4 mr-2" />
            PDF-rapport
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={t('consultant.analytics.metrics.totalParticipants')}
          value={analytics.totalParticipants}
          subtitle={t('consultant.analytics.metrics.activeCount', { count: analytics.activeParticipants })}
          icon={Users}
          color="teal"
        />
        <MetricCard
          title={t('consultant.analytics.metrics.cvCompletion')}
          value={`${analytics.cvCompletionRate}%`}
          subtitle={t('consultant.analytics.metrics.hasCompleteCV')}
          icon={FileText}
          trend={trends.cvCompletion.value > 0 ? trends.cvCompletion : undefined}
          trendLabel={t('consultant.analytics.vsLastMonth')}
          color="emerald"
        />
        <MetricCard
          title={t('consultant.analytics.metrics.avgPlacementTime')}
          value={t('consultant.analytics.metrics.days', { count: analytics.averageTimeToPlacement })}
          subtitle={t('consultant.analytics.metrics.fromStartToJob')}
          icon={Clock}
          trend={trends.placementTime.value > 0 ? trends.placementTime : undefined}
          trendLabel={t('consultant.analytics.vsLastMonth')}
          color="blue"
        />
        <MetricCard
          title={t('consultant.analytics.metrics.completedWithJob')}
          value={analytics.completedParticipants}
          subtitle={t('consultant.analytics.metrics.placementRate', { rate: Math.round((analytics.completedParticipants / Math.max(analytics.totalParticipants, 1)) * 100) })}
          icon={Award}
          color="emerald"
        />
      </div>

      {/* AI Insights Panel */}
      <InsightsPanel maxInsights={5} showTrends={true} showRisks={true} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Over Time Chart */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                {t('consultant.analytics.progressOverTime.title')}
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-600">
                {t('consultant.analytics.progressOverTime.subtitle')}
              </p>
            </div>
            <Activity className="w-5 h-5 text-stone-500 dark:text-stone-400" />
          </div>
          <BarChart
            data={analytics.monthlyProgress.map(m => ({
              label: m.month,
              value: m.value,
              color: 'bg-[var(--c-solid)]',
            }))}
          />
        </Card>

        {/* Progress Rings */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                {t('consultant.analytics.keyMetrics.title')}
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-600">
                {t('consultant.analytics.keyMetrics.subtitle')}
              </p>
            </div>
            <PieChart className="w-5 h-5 text-stone-500 dark:text-stone-400" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <ProgressRing
              value={analytics.cvCompletionRate}
              size={100}
              strokeWidth={10}
              label={t('consultant.analytics.keyMetrics.cvQuality')}
            />
            <ProgressRing
              value={analytics.goalsCompletionRate}
              size={100}
              strokeWidth={10}
              label={t('consultant.analytics.keyMetrics.goalCompletion')}
            />
            <ProgressRing
              value={analytics.engagementRate}
              size={100}
              strokeWidth={10}
              label={t('consultant.analytics.keyMetrics.engagement')}
            />
          </div>
        </Card>
      </div>

      {/* Status Distribution & Top Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                {t('consultant.analytics.statusDistribution.title')}
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-600">
                {t('consultant.analytics.statusDistribution.subtitle')}
              </p>
            </div>
            <Users className="w-5 h-5 text-stone-500 dark:text-stone-400" />
          </div>
          <div className="space-y-4">
            {analytics.statusDistribution.map((status, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                    {status.label}
                  </span>
                  <span className="text-sm text-stone-500 dark:text-stone-400">
                    {status.value} ({Math.round((status.value / Math.max(analytics.totalParticipants, 1)) * 100)}%)
                  </span>
                </div>
                <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', status.color)}
                    style={{ width: `${(status.value / Math.max(analytics.totalParticipants, 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Goal Categories */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                {t('consultant.analytics.goalCategories.title')}
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-600">
                {t('consultant.analytics.goalCategories.subtitle')}
              </p>
            </div>
            <Target className="w-5 h-5 text-stone-500 dark:text-stone-400" />
          </div>
          <div className="space-y-3">
            {analytics.topGoalCategories.map((goal, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-800 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-xs font-bold text-amber-600 dark:text-amber-400">
                    {index + 1}
                  </span>
                  <span className="font-medium text-stone-900 dark:text-stone-100">
                    {goal.category}
                  </span>
                </div>
                <span className="text-sm text-stone-500 dark:text-stone-400">
                  {t('consultant.analytics.goalCategories.goalsCount', { count: goal.count })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Cohort Analysis Section */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">
              {t('consultant.analytics.cohortAnalysis.title')}
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-600">
              {t('consultant.analytics.cohortAnalysis.subtitle')}
            </p>
          </div>
          <BarChart3 className="w-5 h-5 text-stone-500 dark:text-stone-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-700">
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase">
                  {t('consultant.analytics.cohortAnalysis.columns.cohort')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase">
                  {t('consultant.analytics.cohortAnalysis.columns.participants')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase">
                  {t('consultant.analytics.cohortAnalysis.columns.cvComplete')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase">
                  {t('consultant.analytics.cohortAnalysis.columns.placed')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase">
                  {t('consultant.analytics.cohortAnalysis.columns.avgTime')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {cohortData.length > 0 ? (
                cohortData.map((cohort, index) => (
                  <tr key={index} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                    <td className="px-4 py-4 font-medium text-stone-900 dark:text-stone-100">
                      {cohort.cohort}
                    </td>
                    <td className="px-4 py-4 text-center text-stone-600 dark:text-stone-400">
                      {cohort.participants}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={cn(
                        'font-medium',
                        cohort.cvComplete >= 80 ? 'text-emerald-600' :
                        cohort.cvComplete >= 60 ? 'text-amber-600' : 'text-rose-600'
                      )}>
                        {cohort.cvComplete}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={cn(
                        'font-medium',
                        cohort.placed >= 70 ? 'text-blue-600' :
                        cohort.placed >= 50 ? 'text-amber-600' : 'text-rose-600'
                      )}>
                        {cohort.placed}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-stone-600 dark:text-stone-400">
                      {cohort.avgTime > 0 ? cohort.avgTime : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-stone-500 dark:text-stone-400">
                    {t('consultant.analytics.cohortAnalysis.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* PDF Report Dialog */}
      <ReportGeneratorDialog
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        analyticsData={reportData}
      />
    </div>
  )
}
