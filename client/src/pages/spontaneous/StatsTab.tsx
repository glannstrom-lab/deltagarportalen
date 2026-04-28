/**
 * Stats Tab - View statistics and upcoming follow-ups
 */
import { useTranslation } from 'react-i18next'
import {
  Building2,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  Target,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useSpontaneousCompanies } from '@/hooks/useSpontaneousCompanies'
import { formatOrgNumber } from '@/services/bolagsverketApi'
import type { SpontaneousStatus } from '@/services/supabaseApi'

// Stat card component
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
}: {
  label: string
  value: number
  icon: typeof Building2
  color: string
  bgColor: string
}) {
  return (
    <Card className="p-4 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-stone-800 dark:text-stone-100">{value}</p>
          <p className="text-sm text-stone-600 dark:text-stone-400">{label}</p>
        </div>
      </div>
    </Card>
  )
}

export default function StatsTab() {
  const { t } = useTranslation()
  const { stats, companies, upcomingFollowups, isLoading } = useSpontaneousCompanies()

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    )
  }

  const totalCompanies = companies.length
  const totalContacted = stats.contacted + stats.waiting + stats.response_positive + stats.response_negative + stats.no_response
  const totalResponses = stats.response_positive + stats.response_negative
  const responseRate = totalContacted > 0 ? Math.round((totalResponses / totalContacted) * 100) : 0
  const positiveRate = totalResponses > 0 ? Math.round((stats.response_positive / totalResponses) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-stone-800 dark:text-stone-100">
          <TrendingUp className="w-5 h-5 text-[var(--c-solid)] dark:text-[var(--c-solid)]" />
          {t('spontaneous.stats.overview')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label={t('spontaneous.stats.totalSaved')}
            value={totalCompanies}
            icon={Building2}
            color="text-stone-600"
            bgColor="bg-stone-100 dark:bg-stone-800"
          />
          <StatCard
            label={t('spontaneous.stats.contacted')}
            value={totalContacted}
            icon={Send}
            color="text-blue-600"
            bgColor="bg-blue-100 dark:bg-blue-900/30"
          />
          <StatCard
            label={t('spontaneous.stats.responses')}
            value={totalResponses}
            icon={CheckCircle}
            color="text-green-600"
            bgColor="bg-green-100 dark:bg-green-900/30"
          />
          <StatCard
            label={t('spontaneous.stats.waiting')}
            value={stats.waiting}
            icon={Clock}
            color="text-amber-600"
            bgColor="bg-amber-100 dark:bg-amber-900/30"
          />
        </div>
      </div>

      {/* Response Rates */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-stone-800 dark:text-stone-100">
            <Target className="w-5 h-5 text-[var(--c-solid)] dark:text-[var(--c-solid)]" />
            {t('spontaneous.stats.responseRate')}
          </h3>

          {totalContacted > 0 ? (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1 text-stone-700 dark:text-stone-300">
                  <span>{t('spontaneous.stats.responses')}</span>
                  <span className="font-medium">{responseRate}%</span>
                </div>
                <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--c-solid)] rounded-full transition-all"
                    style={{ width: `${responseRate}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1 text-stone-700 dark:text-stone-300">
                  <span>{t('spontaneous.stats.positiveRate')}</span>
                  <span className="font-medium">{positiveRate}%</span>
                </div>
                <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${positiveRate}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-stone-600 dark:text-stone-400 text-sm">
              {t('spontaneous.stats.contactToSeeStats')}
            </p>
          )}
        </Card>

        <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <h3 className="font-semibold mb-4 text-stone-800 dark:text-stone-100">{t('spontaneous.stats.statusDistribution')}</h3>
          <div className="space-y-2">
            <StatusRow label={t('spontaneous.status.to_contact')} value={stats.to_contact} color="bg-blue-500" total={totalCompanies} />
            <StatusRow label={t('spontaneous.status.waiting')} value={stats.waiting} color="bg-amber-500" total={totalCompanies} />
            <StatusRow label={t('spontaneous.status.response_positive')} value={stats.response_positive} color="bg-emerald-500" total={totalCompanies} />
            <StatusRow label={t('spontaneous.status.response_negative')} value={stats.response_negative} color="bg-red-500" total={totalCompanies} />
            <StatusRow label={t('spontaneous.status.no_response')} value={stats.no_response} color="bg-orange-500" total={totalCompanies} />
          </div>
        </Card>
      </div>

      {/* Upcoming Follow-ups */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="font-semibold mb-4 flex items-center gap-2 text-stone-800 dark:text-stone-100">
          <Calendar className="w-5 h-5 text-[var(--c-solid)] dark:text-[var(--c-solid)]" />
          {t('spontaneous.followups.title')}
        </h3>

        {upcomingFollowups.length > 0 ? (
          <div className="space-y-3">
            {upcomingFollowups.map((company) => (
              <div
                key={company.id}
                className="flex items-center justify-between p-3 rounded-lg bg-stone-50 dark:bg-stone-900/50"
              >
                <div>
                  <p className="font-medium text-stone-800 dark:text-stone-100">{company.company_name}</p>
                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    {formatOrgNumber(company.org_number)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    {company.followup_date && new Date(company.followup_date).toLocaleDateString('sv-SE')}
                  </p>
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    {company.followup_date && getDaysUntil(new Date(company.followup_date), t)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-stone-600 dark:text-stone-400 text-sm">
            {t('spontaneous.followups.empty')}
          </p>
        )}
      </Card>

      {/* Tips */}
      <Card className="p-6 bg-gradient-to-br from-sky-50 to-[var(--c-bg)] dark:from-sky-900/20 dark:to-[var(--c-bg)]/30 border-sky-200 dark:border-sky-800">
        <h3 className="font-semibold mb-2 text-stone-800 dark:text-stone-100">{t('spontaneous.tips.title')}</h3>
        <ul className="text-sm text-stone-600 dark:text-stone-400 space-y-1.5">
          <li>{t('spontaneous.tips.tip1')}</li>
          <li>{t('spontaneous.tips.tip4')}</li>
          <li>{t('spontaneous.tips.tip3Stat')}</li>
          <li>{t('spontaneous.tips.tip4Stat')}</li>
        </ul>
      </Card>
    </div>
  )
}

// Helper components
function StatusRow({
  label,
  value,
  color,
  total,
}: {
  label: string
  value: number
  color: string
  total: number
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-28 truncate text-stone-700 dark:text-stone-300">{label}</span>
      <div className="flex-1 h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium w-8 text-right text-stone-700 dark:text-stone-300">{value}</span>
    </div>
  )
}

function getDaysUntil(date: Date, t: (key: string, options?: Record<string, unknown>) => string): string {
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return t('spontaneous.followups.overdue')
  if (diffDays === 0) return t('spontaneous.followups.today')
  if (diffDays === 1) return t('spontaneous.followups.tomorrow')
  return t('spontaneous.followups.daysLeft', { days: diffDays })
}
