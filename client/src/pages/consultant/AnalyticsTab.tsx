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
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BarChart } from '@/components/ui/BarChart'
import { LoadingState } from '@/components/ui/LoadingState'
import { cn } from '@/lib/utils'
import { ReportGeneratorDialog } from '@/components/consultant/ReportGeneratorDialog'
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

// Metric Card Component
function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'violet',
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  trend?: { value: number; isPositive: boolean }
  color?: 'violet' | 'emerald' | 'amber' | 'rose' | 'blue'
}) {
  const colorClasses = {
    violet: 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400',
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
              <span className="text-stone-400 font-normal ml-1">vs förra månaden</span>
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
            className="text-violet-600 dark:text-violet-400 transition-all duration-500"
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

      // Fetch participants
      const { data: participants } = await supabase
        .from('consultant_dashboard_participants')
        .select('*')
        .eq('consultant_id', user.id)

      if (participants) {
        const total = participants.length
        const active = participants.filter(p => p.status === 'ACTIVE').length
        const completed = participants.filter(p => p.status === 'COMPLETED').length
        const withCV = participants.filter(p => p.has_cv).length
        const avgATS = Math.round(
          participants.reduce((sum, p) => sum + (p.ats_score || 0), 0) / Math.max(total, 1)
        )

        // Mock data for charts (TODO: Replace with real data)
        const monthlyData = [
          { month: 'Jan', value: 45 },
          { month: 'Feb', value: 52 },
          { month: 'Mar', value: 58 },
          { month: 'Apr', value: 63 },
          { month: 'Maj', value: 70 },
          { month: 'Jun', value: 75 },
        ]

        const statusData = [
          { label: 'Aktiva', value: active, color: 'bg-emerald-500' },
          { label: 'Inaktiva', value: total - active - completed, color: 'bg-stone-400' },
          { label: 'Avslutade', value: completed, color: 'bg-blue-500' },
        ]

        setAnalytics({
          totalParticipants: total,
          activeParticipants: active,
          completedParticipants: completed,
          averageProgress: avgATS,
          cvCompletionRate: Math.round((withCV / Math.max(total, 1)) * 100),
          jobApplicationRate: 68, // Mock
          averageTimeToPlacement: 45, // Mock - days
          goalsCompletionRate: 72, // Mock
          engagementRate: 85, // Mock
          monthlyProgress: monthlyData,
          statusDistribution: statusData,
          topGoalCategories: [
            { category: 'CV-förbättring', count: 24 },
            { category: 'Jobbansökningar', count: 18 },
            { category: 'Intervjuträning', count: 12 },
            { category: 'Nätverkande', count: 8 },
            { category: 'Kompetensutveckling', count: 6 },
          ],
        })
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = (format: 'pdf' | 'excel') => {
    if (format === 'pdf') {
      setShowReportDialog(true)
    } else {
      // TODO: Implement Excel export
      console.log('Exporting as Excel')
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
    cohortData: [
      { cohort: 'Q1 2024', participants: 12, cvComplete: 92, placed: 75, avgTime: 38 },
      { cohort: 'Q4 2023', participants: 15, cvComplete: 87, placed: 80, avgTime: 42 },
      { cohort: 'Q3 2023', participants: 18, cvComplete: 94, placed: 83, avgTime: 45 },
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
              'focus:border-violet-500',
              'text-stone-900 dark:text-stone-100'
            )}
          >
            <option value="week">Senaste veckan</option>
            <option value="month">Senaste månaden</option>
            <option value="quarter">Senaste kvartalet</option>
            <option value="year">Senaste året</option>
          </select>
          <button
            onClick={() => fetchAnalytics()}
            className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-stone-600 dark:text-stone-400" />
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
          title="Totalt deltagare"
          value={analytics.totalParticipants}
          subtitle={`${analytics.activeParticipants} aktiva`}
          icon={Users}
          color="violet"
        />
        <MetricCard
          title="CV-komplettering"
          value={`${analytics.cvCompletionRate}%`}
          subtitle="Har komplett CV"
          icon={FileText}
          trend={{ value: 8, isPositive: true }}
          color="emerald"
        />
        <MetricCard
          title="Genomsnittlig placeringstid"
          value={`${analytics.averageTimeToPlacement} dagar`}
          subtitle="Från start till jobb"
          icon={Clock}
          trend={{ value: 5, isPositive: true }}
          color="blue"
        />
        <MetricCard
          title="Avslutade med jobb"
          value={analytics.completedParticipants}
          subtitle={`${Math.round((analytics.completedParticipants / Math.max(analytics.totalParticipants, 1)) * 100)}% placeringsgrad`}
          icon={Award}
          color="emerald"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Over Time Chart */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                Framsteg över tid
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Genomsnittlig CV-poäng per månad
              </p>
            </div>
            <Activity className="w-5 h-5 text-stone-400" />
          </div>
          <BarChart
            data={analytics.monthlyProgress.map(m => ({
              label: m.month,
              value: m.value,
              color: 'bg-violet-600',
            }))}
          />
        </Card>

        {/* Progress Rings */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                Nyckeltal
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Översikt av viktiga mätvärden
              </p>
            </div>
            <PieChart className="w-5 h-5 text-stone-400" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <ProgressRing
              value={analytics.cvCompletionRate}
              size={100}
              strokeWidth={10}
              label="CV-kvalitet"
            />
            <ProgressRing
              value={analytics.goalsCompletionRate}
              size={100}
              strokeWidth={10}
              label="Måluppfyllelse"
            />
            <ProgressRing
              value={analytics.engagementRate}
              size={100}
              strokeWidth={10}
              label="Engagemang"
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
                Statusfördelning
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Fördelning av deltagare per status
              </p>
            </div>
            <Users className="w-5 h-5 text-stone-400" />
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
                Vanligaste målkategorierna
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Mest frekventa måltyper bland deltagare
              </p>
            </div>
            <Target className="w-5 h-5 text-stone-400" />
          </div>
          <div className="space-y-3">
            {analytics.topGoalCategories.map((goal, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-800 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-xs font-bold text-violet-600 dark:text-violet-400">
                    {index + 1}
                  </span>
                  <span className="font-medium text-stone-900 dark:text-stone-100">
                    {goal.category}
                  </span>
                </div>
                <span className="text-sm text-stone-500 dark:text-stone-400">
                  {goal.count} mål
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
              Kohortanalys
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Jämförelse mellan deltagargrupper baserat på startdatum
            </p>
          </div>
          <BarChart3 className="w-5 h-5 text-stone-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-700">
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase">
                  Kohort
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase">
                  Deltagare
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase">
                  CV-komplett
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase">
                  Placerade
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase">
                  Snitt tid (dagar)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              <tr className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                <td className="px-4 py-4 font-medium text-stone-900 dark:text-stone-100">
                  Q1 2024
                </td>
                <td className="px-4 py-4 text-center text-stone-600 dark:text-stone-400">12</td>
                <td className="px-4 py-4 text-center">
                  <span className="text-emerald-600 font-medium">92%</span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="text-blue-600 font-medium">75%</span>
                </td>
                <td className="px-4 py-4 text-center text-stone-600 dark:text-stone-400">38</td>
              </tr>
              <tr className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                <td className="px-4 py-4 font-medium text-stone-900 dark:text-stone-100">
                  Q4 2023
                </td>
                <td className="px-4 py-4 text-center text-stone-600 dark:text-stone-400">15</td>
                <td className="px-4 py-4 text-center">
                  <span className="text-emerald-600 font-medium">87%</span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="text-blue-600 font-medium">80%</span>
                </td>
                <td className="px-4 py-4 text-center text-stone-600 dark:text-stone-400">42</td>
              </tr>
              <tr className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                <td className="px-4 py-4 font-medium text-stone-900 dark:text-stone-100">
                  Q3 2023
                </td>
                <td className="px-4 py-4 text-center text-stone-600 dark:text-stone-400">18</td>
                <td className="px-4 py-4 text-center">
                  <span className="text-emerald-600 font-medium">94%</span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="text-blue-600 font-medium">83%</span>
                </td>
                <td className="px-4 py-4 text-center text-stone-600 dark:text-stone-400">45</td>
              </tr>
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
