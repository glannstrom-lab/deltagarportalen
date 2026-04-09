/**
 * ApplicationsAnalytics Component
 * Statistics and insights about job applications
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  TrendingUp, TrendingDown, BarChart3, PieChart,
  Clock, CheckCircle, XCircle, Send, Users, Trophy,
  Calendar, Target, Briefcase, ArrowRight
} from '@/components/ui/icons'
import { Card } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useApplications } from '@/hooks/useApplications'
import {
  APPLICATION_STATUS_CONFIG,
  getStatusLabel,
  type ApplicationStatus
} from '@/types/application.types'

interface StatCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon: React.ElementType
  trend?: { value: number; isPositive: boolean }
  color?: string
  bgColor?: string
}

function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'text-slate-600', bgColor = 'bg-slate-100' }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", bgColor)}>
          <Icon className={cn("w-5 h-5", color)} />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            trend.isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          )}>
            {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend.value}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm font-medium text-slate-700">{title}</p>
        {subtitle && <p className="text-xs text-slate-700 mt-1">{subtitle}</p>}
      </div>
    </Card>
  )
}

function StatusDistribution({ applicationsByStatus }: { applicationsByStatus: Record<ApplicationStatus, any[]> }) {
  const statusCounts = useMemo(() => {
    const counts: { status: ApplicationStatus; count: number; percentage: number }[] = []
    const total = Object.values(applicationsByStatus).flat().length

    Object.entries(applicationsByStatus).forEach(([status, apps]) => {
      if (apps.length > 0) {
        counts.push({
          status: status as ApplicationStatus,
          count: apps.length,
          percentage: Math.round((apps.length / total) * 100)
        })
      }
    })

    return counts.sort((a, b) => b.count - a.count)
  }, [applicationsByStatus])

  const total = statusCounts.reduce((sum, s) => sum + s.count, 0)

  if (total === 0) return null

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <PieChart className="w-5 h-5 text-violet-600" />
        <h3 className="font-semibold text-slate-900">Statusfördelning</h3>
      </div>

      {/* Visual bar */}
      <div className="h-4 rounded-full overflow-hidden flex mb-4">
        {statusCounts.map(({ status, percentage }) => {
          const config = APPLICATION_STATUS_CONFIG[status]
          return (
            <div
              key={status}
              className={cn("h-full", config.bgColor)}
              style={{ width: `${percentage}%` }}
              title={`${getStatusLabel(status)}: ${percentage}%`}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2">
        {statusCounts.slice(0, 6).map(({ status, count, percentage }) => {
          const config = APPLICATION_STATUS_CONFIG[status]
          return (
            <div key={status} className="flex items-center gap-2 text-sm">
              <span className={cn("w-3 h-3 rounded-full", config.bgColor)} />
              <span className="text-slate-600">{getStatusLabel(status)}</span>
              <span className="text-slate-600 ml-auto">{count}</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function ConversionFunnel({ applicationsByStatus }: { applicationsByStatus: Record<ApplicationStatus, any[]> }) {
  const stages = useMemo(() => {
    const applied = applicationsByStatus.applied?.length || 0
    const screening = applicationsByStatus.screening?.length || 0
    const phone = applicationsByStatus.phone?.length || 0
    const interview = applicationsByStatus.interview?.length || 0
    const assessment = applicationsByStatus.assessment?.length || 0
    const offer = applicationsByStatus.offer?.length || 0
    const accepted = applicationsByStatus.accepted?.length || 0

    const total = applied + screening + phone + interview + assessment + offer + accepted

    return [
      { label: 'Ansökt', count: applied, icon: Send },
      { label: 'Screening', count: screening, icon: Clock },
      { label: 'Telefonintervju', count: phone, icon: Users },
      { label: 'Intervju', count: interview, icon: Users },
      { label: 'Arbetsprov', count: assessment, icon: Briefcase },
      { label: 'Erbjudande', count: offer, icon: Trophy },
      { label: 'Accepterat', count: accepted, icon: CheckCircle },
    ].filter(s => s.count > 0 || total > 0)
  }, [applicationsByStatus])

  const maxCount = Math.max(...stages.map(s => s.count), 1)

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold text-slate-900">Ansökningstratt</h3>
      </div>

      <div className="space-y-3">
        {stages.map((stage, index) => {
          const width = Math.max((stage.count / maxCount) * 100, 5)
          const Icon = stage.icon
          return (
            <div key={stage.label} className="flex items-center gap-3">
              <div className="w-24 flex items-center gap-2 text-sm text-slate-600">
                <Icon className="w-4 h-4 text-slate-600" />
                {stage.label}
              </div>
              <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full flex items-center justify-end px-2"
                  style={{ width: `${width}%` }}
                >
                  <span className="text-xs font-medium text-white">{stage.count}</span>
                </div>
              </div>
              {index < stages.length - 1 && (
                <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function RecentActivity({ applications }: { applications: any[] }) {
  const recentApps = useMemo(() => {
    return [...applications]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
  }, [applications])

  if (recentApps.length === 0) return null

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-teal-600" />
        <h3 className="font-semibold text-slate-900">Senaste aktivitet</h3>
      </div>

      <div className="space-y-3">
        {recentApps.map((app) => {
          const config = APPLICATION_STATUS_CONFIG[app.status as ApplicationStatus]
          const companyName = app.companyName || (app.jobData as any)?.employer?.name || 'Okänt företag'
          const jobTitle = app.jobTitle || (app.jobData as any)?.headline || 'Okänd tjänst'

          return (
            <div key={app.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
              <div className={cn("w-2 h-2 rounded-full flex-shrink-0", config.bgColor)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{jobTitle}</p>
                <p className="text-xs text-slate-700">{companyName}</p>
              </div>
              <span className={cn("text-xs px-2 py-0.5 rounded-full", config.bgColor, config.color)}>
                {getStatusLabel(app.status)}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export function ApplicationsAnalytics() {
  const { t } = useTranslation()
  const { applications, applicationsByStatus, stats, staleApplications, isLoading } = useApplications()

  // Calculate additional metrics
  const metrics = useMemo(() => {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const recentApplications = applications.filter(
      app => new Date(app.createdAt) >= thirtyDaysAgo
    )

    const responseRate = stats.applied > 0
      ? Math.round(((stats.interview + stats.accepted + stats.rejected) / stats.applied) * 100)
      : 0

    const interviewRate = stats.applied > 0
      ? Math.round((stats.interview / stats.applied) * 100)
      : 0

    const successRate = (stats.interview + stats.accepted) > 0
      ? Math.round((stats.accepted / (stats.interview + stats.accepted)) * 100)
      : 0

    const avgDaysInPipeline = applications.length > 0
      ? Math.round(
          applications.reduce((sum, app) => {
            const days = Math.floor((now.getTime() - new Date(app.createdAt).getTime()) / (1000 * 60 * 60 * 24))
            return sum + days
          }, 0) / applications.length
        )
      : 0

    return {
      recentCount: recentApplications.length,
      responseRate,
      interviewRate,
      successRate,
      avgDaysInPipeline,
      staleCount: staleApplications.length
    }
  }, [applications, stats, staleApplications])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Totalt ansökningar"
          value={stats.total}
          subtitle={`${metrics.recentCount} senaste 30 dagarna`}
          icon={Briefcase}
          color="text-violet-600"
          bgColor="bg-violet-100"
        />
        <StatCard
          title="Aktiva"
          value={stats.active}
          subtitle="Pågående ansökningar"
          icon={Send}
          color="text-indigo-600"
          bgColor="bg-indigo-100"
        />
        <StatCard
          title="Intervjufrekvens"
          value={`${metrics.interviewRate}%`}
          subtitle="Av inskickade ansökningar"
          icon={Users}
          color="text-teal-600"
          bgColor="bg-teal-100"
        />
        <StatCard
          title="Behöver uppföljning"
          value={metrics.staleCount}
          subtitle="Ej uppdaterade 7+ dagar"
          icon={Clock}
          color={metrics.staleCount > 0 ? "text-amber-600" : "text-green-600"}
          bgColor={metrics.staleCount > 0 ? "bg-amber-100" : "bg-green-100"}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-2">
        <StatusDistribution applicationsByStatus={applicationsByStatus} />
        <ConversionFunnel applicationsByStatus={applicationsByStatus} />
      </div>

      {/* Additional metrics and activity */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-slate-900">Framgångsmått</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-600">Svarsfrekvens</span>
                <span className="font-medium text-slate-900">{metrics.responseRate}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${metrics.responseRate}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-600">Intervjufrekvens</span>
                <span className="font-medium text-slate-900">{metrics.interviewRate}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full"
                  style={{ width: `${metrics.interviewRate}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-600">Genomsnitt i pipeline</span>
                <span className="font-medium text-slate-900">{metrics.avgDaysInPipeline} dagar</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="md:col-span-2">
          <RecentActivity applications={applications} />
        </div>
      </div>

      {/* Empty state */}
      {stats.total === 0 && (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Ingen data än</h3>
          <p className="text-slate-700 max-w-md mx-auto">
            Börja spåra dina jobbansökningar för att se statistik och insikter om din ansökningsprocess.
          </p>
        </Card>
      )}
    </div>
  )
}

export default ApplicationsAnalytics
