/**
 * AnalyticsTab - Analytics and Reporting Dashboard
 * Charts, trends, cohort analysis, and PDF export
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Target,
  Download,
  RefreshCw,
  PieChart,
  Activity,
  Award,
  Clock,
  AlertTriangle,
  Calendar,
  ChevronRight,
} from '@/components/ui/icons'
import { supabase } from '@/lib/supabase'
import { notifications } from '@/lib/toast'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BarChart } from '@/components/ui/BarChart'
import { LoadingState } from '@/components/ui/LoadingState'
import { cn } from '@/lib/utils'
import { ReportGeneratorDialog } from '@/components/consultant/ReportGeneratorDialog'
import { InsightsPanel } from '@/components/consultant/InsightsPanel'
import { consultantService } from '@/services/consultantService'
import type { ReportData } from '@/services/pdfReportGenerator'
// AR1: kohortberäkningen ligger i egen modul sedan 2026-08-17 — den gick inte
// att testa härifrån, och det var därför `QNaN NaN` kunde nå en skarp PDF.
import { calculateCohorts, type CohortData } from './cohorts'

import { computePlacementMetric, followupStatus } from './placeringsmatt'
// KK6: computeMonthlyProgress/calculateTrends/calculateGoalCategories utbrutna
// ur den här filen 2026-09-02, samma grepp som gav cohorts.ts sina tester.
import { computeMonthlyProgress, calculateTrends, calculateGoalCategories, type TrendData } from './analytics'

interface PlacementRow {
  id: string
  participantId: string
  participantName: string
  employerName: string
  jobTitle: string | null
  startDate: string | null
  followup3m: boolean
  followup6m: boolean
}

interface AnalyticsData {
  totalParticipants: number
  activeParticipants: number
  completedParticipants: number
  // AG3/KS1: alla registrerade placeringar (consultant_placements), oavsett
  // vald datumperiod — det talet KPI-kortet "Placeringar" visar.
  totalPlacements: number
  averageProgress: number
  cvCompletionRate: number
  jobApplicationRate: number
  averageTimeToPlacement: number | null
  goalsCompletionRate: number
  engagementRate: number
  monthlyProgress: Array<{ month: string; value: number }>
  statusDistribution: Array<{ label: string; value: number; color: string }>
  topGoalCategories: Array<{ category: string; count: number }>
}

interface StuckParticipant {
  participantId: string
  name: string
  reasons: string[]
}

interface InterventionGroup {
  participants: number
  avgGoalsCompleted: number
  engagedPct: number
}

interface InterventionEffect {
  withMeeting: InterventionGroup
  withoutMeeting: InterventionGroup
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
    amber: 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-solid)]',
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
            className="text-[var(--c-solid)] dark:text-[var(--c-solid)] transition-all duration-500"
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
  // KS7: ett fel (timeout, RLS, kvot) såg tidigare exakt likadant ut som "inga
  // deltagare" — samma skärm, ingen skillnad. Tre lägen krävs (laddar/fel/
  // klart), mönstret från ParticipantDetailPage.tsx (KV1), inte kopierat rakt
  // av eftersom den här fliken inte navigerar bort vid fel.
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [cohortData, setCohortData] = useState<CohortData[]>([])
  const [placementRows, setPlacementRows] = useState<PlacementRow[]>([])
  const [stuckList, setStuckList] = useState<StuckParticipant[]>([])
  const [interventionEffect, setInterventionEffect] = useState<InterventionEffect | null>(null)
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
    totalPlacements: 0,
    averageProgress: 0,
    cvCompletionRate: 0,
    jobApplicationRate: 0,
    averageTimeToPlacement: null,
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
      setError(null)
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
      const { data: participants, error: participantsError } = await supabase
        .from('consultant_dashboard_participants')
        .select('*')
        .eq('consultant_id', user.id)
      if (participantsError) throw participantsError

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

      // Fetch meetings last 30 days (för insatseffekt-analysen)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const { data: recentMeetings } = await supabase
        .from('consultant_meetings')
        .select('participant_id, scheduled_at, status')
        .eq('consultant_id', user.id)
        .gte('scheduled_at', thirtyDaysAgo.toISOString())
        .lte('scheduled_at', now.toISOString())
        .neq('status', 'cancelled')

      // Fetch previous period data for trend calculations
      const periodLength = now.getTime() - startDate.getTime()
      const previousPeriodEnd = startDate
      const previousPeriodStart = new Date(startDate.getTime() - periodLength)

      // OBS: vyn consultant_dashboard_participants saknar created_at (gav 400/42703 i prod).
      // assigned_at = när deltagaren kopplades till konsulenten — rätt mått för perioden.
      const { data: previousParticipants, error: previousError } = await supabase
        .from('consultant_dashboard_participants')
        .select('*')
        .eq('consultant_id', user.id)
        .gte('assigned_at', previousPeriodStart.toISOString())
        .lt('assigned_at', previousPeriodEnd.toISOString())
      if (previousError) throw previousError

      const { data: previousGoals } = await supabase
        .from('consultant_goals')
        .select('*')
        .eq('consultant_id', user.id)
        .gte('created_at', previousPeriodStart.toISOString())
        .lt('created_at', previousPeriodEnd.toISOString())

      // Calculate cohorts from all participants
      const cohorts = calculateCohorts(participants || [], allPlacementsData || [])
      setCohortData(cohorts)

      // AG3/KS1: lista över registrerade placeringar + uppföljningsstatus.
      // Namnet slås upp via participant_id — vyn har inget join mot placeringar.
      const participantNameById = new Map<string, string>(
        (participants || []).map((p: Record<string, unknown>) => [
          String(p.participant_id),
          `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Okänd deltagare',
        ])
      )
      const rows: PlacementRow[] = (allPlacementsData || [])
        .map((pl: Record<string, unknown>) => ({
          id: String(pl.id),
          participantId: String(pl.participant_id),
          participantName: participantNameById.get(String(pl.participant_id)) || 'Okänd deltagare',
          employerName: String(pl.employer_name ?? ''),
          jobTitle: (pl.job_title as string) ?? null,
          startDate: (pl.start_date as string) ?? null,
          followup3m: Boolean(pl.followup_3m),
          followup6m: Boolean(pl.followup_6m),
        }))
        .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))
      setPlacementRows(rows)

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
        // null = inga placeringar än. Visa aldrig ett påhittat default-snitt (tidigare 45).
        let avgPlacementTime: number | null = null
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

        // Verklig månadsserie: slutförda mål + placeringar per månad (riktiga timestamps)
        const monthlyData = computeMonthlyProgress(dateRange, goalsData || [], allPlacementsData || [])

        const statusData = [
          { label: t('consultant.analytics.status.active'), value: active, color: 'bg-emerald-500' },
          { label: t('consultant.analytics.status.inactive'), value: total - active - completed, color: 'bg-stone-400' },
          { label: t('consultant.analytics.status.completed'), value: completed, color: 'bg-blue-500' },
        ]

        // Calculate goal categories from real data
        const goalCategories = calculateGoalCategories(goalsData || [])

        // ==================== Riskerar att fastna ====================
        // Bygger på de signaler konsulenten faktiskt har tillgång till:
        // inloggning, senaste kontakt och målaktivitet. En deltagare listas
        // först vid minst två varningssignaler — en ensam signal är brus.
        const twentyOneDaysAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000)
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

        const stuck: StuckParticipant[] = participants
          .filter(p => p.status === 'ACTIVE')
          .map(p => {
            const reasons: string[] = []
            if (!p.last_login || new Date(p.last_login) < twentyOneDaysAgo) {
              reasons.push(t('consultant.analytics.stuck.reasonLogin'))
            }
            if (!p.last_contact_at || new Date(p.last_contact_at) < fourteenDaysAgo) {
              reasons.push(t('consultant.analytics.stuck.reasonContact'))
            }
            const pGoals = (goalsData || []).filter(g => g.participant_id === p.participant_id)
            const recentGoalActivity = pGoals.some(g =>
              (g.completed_at && new Date(g.completed_at) >= twentyOneDaysAgo) ||
              (g.created_at && new Date(g.created_at) >= twentyOneDaysAgo)
            )
            if (pGoals.length > 0 && !recentGoalActivity) {
              reasons.push(t('consultant.analytics.stuck.reasonGoals'))
            }
            return {
              participantId: p.participant_id,
              name: `${p.first_name} ${p.last_name}`,
              reasons,
            }
          })
          .filter(s => s.reasons.length >= 2)
          .sort((a, b) => b.reasons.length - a.reasons.length)
          .slice(0, 8)
        setStuckList(stuck)

        // ==================== Insatseffekt: möte ↔ aktivitet ====================
        // Jämför aktiva deltagare MED ≥1 möte senaste 30 dagarna mot dem UTAN.
        // Visas bara när båda grupperna har ≥3 deltagare — annars är
        // jämförelsen statistiskt meningslös och vi säger det istället.
        const activeParticipants = participants.filter(p => p.status === 'ACTIVE')
        const metPids = new Set((recentMeetings || []).map(m => m.participant_id))
        const groupWith = activeParticipants.filter(p => metPids.has(p.participant_id))
        const groupWithout = activeParticipants.filter(p => !metPids.has(p.participant_id))

        if (groupWith.length >= 3 && groupWithout.length >= 3) {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          const buildGroup = (group: typeof activeParticipants): InterventionGroup => {
            const pids = new Set(group.map(p => p.participant_id))
            const completed = (goalsData || []).filter(g =>
              pids.has(g.participant_id) &&
              g.status === 'COMPLETED' &&
              g.completed_at && new Date(g.completed_at) >= thirtyDaysAgo
            ).length
            const engaged = group.filter(p =>
              p.last_login && new Date(p.last_login) >= sevenDaysAgo
            ).length
            return {
              participants: group.length,
              avgGoalsCompleted: Math.round((completed / group.length) * 10) / 10,
              engagedPct: Math.round((engaged / group.length) * 100),
            }
          }
          setInterventionEffect({
            withMeeting: buildGroup(groupWith),
            withoutMeeting: buildGroup(groupWithout),
          })
        } else {
          setInterventionEffect(null)
        }

        setAnalytics({
          totalParticipants: total,
          activeParticipants: active,
          completedParticipants: completed,
          totalPlacements: (allPlacementsData || []).length,
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
    } catch (err) {
      // KS7: fel var tidigare bara en console.error + en toast som försvinner
      // efter några sekunder — resten av vyn visade sina defaultvärden (0/0/0),
      // vilket ser exakt ut som "inga deltagare". setError ger ett kvarstående,
      // korrekt läge med en "Försök igen"-knapp i stället.
      console.error('Error fetching analytics:', err)
      setError(t('consultant.analytics.loadError'))
      notifications.error(t('consultant.analytics.loadError'))
    } finally {
      setLoading(false)
    }
  }

  // AG3/KS1: kopplar in updatePlacementFollowup() (fanns, noll anropare).
  // Optimistisk lokal uppdatering; ett fel återställer INTE — konsulenten
  // ser felmeddelandet och kan försöka igen, hellre än att tyst tappa klicket.
  const handleToggleFollowup = async (
    placementId: string,
    field: 'followup_3m' | 'followup_6m',
    value: boolean
  ) => {
    try {
      await consultantService.updatePlacementFollowup(placementId, field, value)
      setPlacementRows(prev => prev.map(row => {
        if (row.id !== placementId) return row
        return field === 'followup_3m'
          ? { ...row, followup3m: value }
          : { ...row, followup6m: value }
      }))
    } catch (err) {
      console.error('[AnalyticsTab] kunde inte uppdatera uppföljningen:', err)
      notifications.error('Uppföljningen kunde inte sparas just nu.')
    }
  }

  // KK6 (2026-09-02): computeMonthlyProgress/calculateTrends/calculateGoalCategories
  // flyttade till analytics.ts — se importen ovan. Anropen nedan är oförändrade.

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
        [t('consultant.analytics.export.avgPlacementTime'), analytics.averageTimeToPlacement === null ? t('consultant.analytics.metrics.noPlacementsYet') : t('consultant.analytics.metrics.days', { count: analytics.averageTimeToPlacement })],
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
    averageTimeToPlacement: analytics.averageTimeToPlacement ?? 0,
    monthlyProgress: analytics.monthlyProgress,
    statusDistribution: analytics.statusDistribution,
    topGoalCategories: analytics.topGoalCategories,
    cohortData: cohortData.length > 0 ? cohortData : [
      { cohort: 'Ingen data', participants: 0, cvComplete: 0, placed: 0, avgTime: 0 },
    ],
  }

  // AG3/KS1: se computePlacementMetric ovan för varför det här ersätter
  // completedParticipants-baserad "placeringsgrad".
  const placementMetric = computePlacementMetric(analytics.totalPlacements, analytics.totalParticipants)

  if (loading) {
    return <LoadingState type="dashboard" />
  }

  // KS7: eget läge, skilt från laddning och skilt från "inga deltagare" —
  // annars ser ett trasigt anrop ut som en tom lista (portalens stående felklass).
  if (error) {
    return (
      <div className="text-center py-12" role="alert">
        <AlertTriangle className="w-10 h-10 mx-auto text-rose-500 mb-3" aria-hidden="true" />
        <p className="text-stone-700 dark:text-stone-200 font-medium">{error}</p>
        <div className="flex items-center justify-center gap-3 mt-4">
          <Button variant="outline" onClick={() => fetchAnalytics()}>
            {t('consultant.analytics.tryAgain')}
          </Button>
        </div>
      </div>
    )
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
          value={analytics.averageTimeToPlacement === null ? '–' : t('consultant.analytics.metrics.days', { count: analytics.averageTimeToPlacement })}
          subtitle={analytics.averageTimeToPlacement === null ? t('consultant.analytics.metrics.noPlacementsYet') : t('consultant.analytics.metrics.fromStartToJob')}
          icon={Clock}
          trend={trends.placementTime.value > 0 ? trends.placementTime : undefined}
          trendLabel={t('consultant.analytics.vsLastMonth')}
          color="blue"
        />
        <MetricCard
          title="Placeringar"
          value={placementMetric.hasPlacements ? placementMetric.value! : '—'}
          subtitle={placementMetric.hasPlacements
            ? t('consultant.analytics.metrics.placementRate', { rate: placementMetric.rate })
            : t('consultant.analytics.metrics.noPlacementsYet')}
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
            {/* KV5: kortet visar andelen med registrerat CV (has_cv), inte
                CV:ets kvalitet (ATS-poäng) — OverviewTab.tsx visar snitt-ATS
                under en annan nyckel (consultant.overview.cvQuality) och äger
                den. Den delade nyckeln keyMetrics.cvQuality användes bara
                här och var missvisande ("CV-kvalitet" om en täckningsgrad);
                locale-filerna ägs av en annan agent i den här omgången, så
                nyckeln lämnas orörd i sv.json/en.json — texten hårdkodas i
                stället, vilket redan är normen i konsulentvyn (DESIGN.md §2). */}
            <ProgressRing
              value={analytics.cvCompletionRate}
              size={100}
              strokeWidth={10}
              label="Andel med CV"
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
          {/* KK6: tomt underlag (inga mål alls) gav tidigare tre påhittade
              nollor ("CV-förbättring: 0 mål" osv.) — se calculateGoalCategories
              i analytics.ts. Ett tomt underlag visar nu en invit i stället. */}
          {analytics.topGoalCategories.length === 0 ? (
            <p className="text-sm text-stone-500 dark:text-stone-400 py-4">
              Inga mål registrerade än.
            </p>
          ) : (
            <div className="space-y-3">
              {analytics.topGoalCategories.map((goal, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-800 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 flex items-center justify-center text-xs font-bold text-[var(--c-text)] dark:text-[var(--c-solid)]">
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
          )}
        </Card>
      </div>

      {/* Riskerar att fastna & Insatseffekt */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Riskerar att fastna */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                {t('consultant.analytics.stuck.title')}
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-600">
                {t('consultant.analytics.stuck.subtitle')}
              </p>
            </div>
            <AlertTriangle className="w-5 h-5 text-stone-500 dark:text-stone-400" aria-hidden="true" />
          </div>
          {stuckList.length === 0 ? (
            <p className="text-sm text-stone-500 dark:text-stone-400 py-4">
              {t('consultant.analytics.stuck.empty')}
            </p>
          ) : (
            <ul className="space-y-2">
              {stuckList.map(s => (
                <li key={s.participantId}>
                  <Link
                    to={`/consultant/participants/${s.participantId}`}
                    className="flex items-center justify-between gap-3 p-3 bg-stone-50 dark:bg-stone-800 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-stone-900 dark:text-stone-100 truncate">
                        {s.name}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {s.reasons.join(' · ')}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-400 flex-shrink-0" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Insatseffekt */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                {t('consultant.analytics.effect.title')}
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-600">
                {t('consultant.analytics.effect.subtitle')}
              </p>
            </div>
            <Calendar className="w-5 h-5 text-stone-500 dark:text-stone-400" aria-hidden="true" />
          </div>
          {interventionEffect === null ? (
            <p className="text-sm text-stone-500 dark:text-stone-400 py-4">
              {t('consultant.analytics.effect.insufficient')}
            </p>
          ) : (
            <div className="space-y-4">
              {([
                { key: 'withMeeting' as const, label: t('consultant.analytics.effect.withMeeting') },
                { key: 'withoutMeeting' as const, label: t('consultant.analytics.effect.withoutMeeting') },
              ]).map(group => {
                const g = interventionEffect[group.key]
                return (
                  <div key={group.key} className="p-4 bg-stone-50 dark:bg-stone-800 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-medium text-stone-900 dark:text-stone-100">{group.label}</p>
                      <span className="text-xs text-stone-500 dark:text-stone-400">
                        {t('consultant.analytics.effect.participantCount', { count: g.participants })}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                          {g.avgGoalsCompleted}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          {t('consultant.analytics.effect.goalsPerParticipant')}
                        </p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                          {g.engagedPct}%
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          {t('consultant.analytics.effect.activeLastWeek')}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {t('consultant.analytics.effect.note')}
              </p>
            </div>
          )}
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

      {/* Placeringar & uppföljning (AG3/KS1) */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">
              Placeringar
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-600">
              Registrerade placeringar och deras uppföljning (3/6 månader)
            </p>
          </div>
          <Award className="w-5 h-5 text-stone-500 dark:text-stone-400" aria-hidden="true" />
        </div>
        {placementRows.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-400 py-4">
            Inga placeringar registrerade än. Klicka på &quot;Registrera placering&quot; högst upp för att lägga till den första.
          </p>
        ) : (
          <ul className="space-y-3">
            {placementRows.map(row => {
              const status = followupStatus({
                startDate: row.startDate,
                followup3m: row.followup3m,
                followup6m: row.followup6m,
              })
              return (
                <li key={row.id} className="p-4 bg-stone-50 dark:bg-stone-800 rounded-xl">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-medium text-stone-900 dark:text-stone-100 truncate">
                        {row.participantName} · {row.employerName}
                      </p>
                      <p className="text-sm text-stone-500 dark:text-stone-400 truncate">
                        {row.jobTitle ? `${row.jobTitle} · ` : ''}
                        {row.startDate
                          ? new Date(row.startDate).toLocaleDateString('sv-SE')
                          : 'Startdatum saknas'}
                      </p>
                    </div>
                    <span className={cn(
                      'text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap',
                      status.tone === 'done' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
                      status.tone === 'ok' && 'bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300',
                      status.tone === 'soon' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                      status.tone === 'due' && 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
                      status.tone === 'unknown' && 'bg-stone-200 text-stone-500 dark:bg-stone-700 dark:text-stone-400',
                    )}>
                      {status.text}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-3">
                    <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
                      <input
                        type="checkbox"
                        checked={row.followup3m}
                        onChange={e => handleToggleFollowup(row.id, 'followup_3m', e.target.checked)}
                        className="rounded border-stone-300"
                      />
                      3-månadersuppföljning gjord
                    </label>
                    <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
                      <input
                        type="checkbox"
                        checked={row.followup6m}
                        onChange={e => handleToggleFollowup(row.id, 'followup_6m', e.target.checked)}
                        className="rounded border-stone-300"
                      />
                      6-månadersuppföljning gjord
                    </label>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
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
