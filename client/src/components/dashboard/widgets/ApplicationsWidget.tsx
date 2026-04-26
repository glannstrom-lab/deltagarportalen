import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Send, Clock, CheckCircle2, XCircle, Trophy, Building2, Calendar, AlertCircle, TrendingUp } from '@/components/ui/icons'
import { DashboardWidget } from '../DashboardWidget'
import type { WidgetStatus } from '@/types/dashboard'
import type { WidgetSize } from '../WidgetSizeSelector'

interface ApplicationsWidgetProps {
  total: number
  statusBreakdown?: {
    applied: number
    interview: number
    rejected: number
    offer: number
  }
  nextFollowUp?: {
    company: string
    jobTitle: string
    dueDate: string
  } | null
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  size?: WidgetSize
}

// SMALL - Totalt antal + nästa uppföljning
function ApplicationsWidgetSmall({ total, nextFollowUp, loading, error, onRetry }: Omit<ApplicationsWidgetProps, 'size' | 'statusBreakdown'>) {
  const { t } = useTranslation()
  const getStatus = (): WidgetStatus => {
    if (total === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return t('applicationsWidget.time.today')
    if (diffDays === 1) return t('applicationsWidget.time.tomorrow')
    if (diffDays < 0) return t('applicationsWidget.time.daysAgoShort', { count: Math.abs(diffDays) })
    return t('applicationsWidget.time.inDaysShort', { count: diffDays })
  }

  return (
    <DashboardWidget
      title={t('applicationsWidget.applications')}
      icon={<Send size={14} />}
      to="/job-search"
      color="orange"
      status={status}
      progress={total > 0 ? 100 : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
    >
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <Trophy size={14} className="text-orange-500" />
          <span className="text-lg font-bold text-slate-800 dark:text-stone-100">{total}</span>
        </div>
        <span className="text-xs text-slate-700 dark:text-stone-300">
          {t('applicationsWidget.applicationsCount', { count: total })}
        </span>
      </div>
      {nextFollowUp && (
        <p className="text-xs text-amber-600 mt-1">
          {t('applicationsWidget.followUp')} {formatDate(nextFollowUp.dueDate).toLowerCase()}
        </p>
      )}
    </DashboardWidget>
  )
}

// MEDIUM - Status-fördelning + uppföljning
function ApplicationsWidgetMedium({ total, statusBreakdown = { applied: 0, interview: 0, rejected: 0, offer: 0 }, nextFollowUp, loading, error, onRetry }: ApplicationsWidgetProps) {
  const { t } = useTranslation()
  const getStatus = (): WidgetStatus => {
    if (total === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()
  const { applied, interview, rejected, offer } = statusBreakdown

  // Formatera datum
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return t('applicationsWidget.time.today')
    if (diffDays === 1) return t('applicationsWidget.time.tomorrow')
    if (diffDays < 0) return t('applicationsWidget.time.daysAgo', { count: Math.abs(diffDays) })
    return t('applicationsWidget.time.inDays', { count: diffDays })
  }

  // Beräkna svarsfrekvens
  const responseRate = total > 0
    ? Math.round(((interview + rejected + offer) / total) * 100)
    : 0

  return (
    <DashboardWidget
      title={t('applicationsWidget.applications')}
      icon={<Send size={22} />}
      to="/job-search"
      color="orange"
      status={status}
      progress={total > 0 ? 100 : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: total > 0 ? t('applicationsWidget.followUp') : t('applicationsWidget.registerApplication'),
      }}
    >
      <div className="space-y-3">
        {/* Totalt + svarsfrekvens */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Trophy size={24} className="text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-stone-100">{total}</p>
              <p className="text-xs text-slate-700 dark:text-stone-300">{t('applicationsWidget.total')}</p>
            </div>
          </div>
          {responseRate > 0 && (
            <div className="text-right">
              <p className="text-lg font-semibold text-emerald-600">{responseRate}%</p>
              <p className="text-xs text-slate-700 dark:text-stone-300">{t('applicationsWidget.responseRate')}</p>
            </div>
          )}
        </div>

        {/* Status badges */}
        {total > 0 && (
          <div className="flex flex-wrap gap-2">
            {applied > 0 && (
              <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg">
                {t('applicationsWidget.status.waitingResponse', { count: applied })}
              </span>
            )}
            {interview > 0 && (
              <span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded-lg">
                {t('applicationsWidget.status.interviews', { count: interview })}
              </span>
            )}
            {offer > 0 && (
              <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-lg">
                {t('applicationsWidget.status.offers', { count: offer })}
              </span>
            )}
          </div>
        )}

        {/* Nästa uppföljning - prominently */}
        {nextFollowUp && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={14} className="text-amber-500" />
              <span className="text-xs font-medium text-amber-700">{t('applicationsWidget.reminder')}</span>
            </div>
            <p className="text-sm text-amber-800">
              {t('applicationsWidget.followUpCompany', { company: nextFollowUp.company })}
            </p>
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <Calendar size={12} />
              {formatDate(nextFollowUp.dueDate)}
            </p>
          </div>
        )}

        {/* Empty state */}
        {total === 0 && (
          <div className="p-3 bg-orange-50 rounded-lg">
            <p className="text-sm text-orange-700">{t('applicationsWidget.trackApplications')}</p>
            <p className="text-xs text-orange-600 mt-1">{t('applicationsWidget.registerToFollowUp')}</p>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// LARGE - Full pipeline-översikt
function ApplicationsWidgetLarge({ total, statusBreakdown = { applied: 0, interview: 0, rejected: 0, offer: 0 }, nextFollowUp, loading, error, onRetry }: ApplicationsWidgetProps) {
  const { t } = useTranslation()
  const getStatus = (): WidgetStatus => {
    if (total === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()
  const { applied, interview, rejected, offer } = statusBreakdown

  // Formatera datum
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return t('applicationsWidget.time.today')
    if (diffDays === 1) return t('applicationsWidget.time.tomorrow')
    if (diffDays < 0) return t('applicationsWidget.time.daysAgo', { count: Math.abs(diffDays) })
    return t('applicationsWidget.time.inDays', { count: diffDays })
  }

  // Beräkna svarsfrekvens
  const responseRate = total > 0
    ? Math.round(((interview + rejected + offer) / total) * 100)
    : 0

  return (
    <DashboardWidget
      title={t('applicationsWidget.applications')}
      icon={<Send size={24} />}
      to="/job-search"
      color="orange"
      status={status}
      progress={total > 0 ? 100 : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: t('applicationsWidget.newApplication'),
      }}
    >
      <div className="space-y-4">
        {/* Pipeline-översikt i grid */}
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 bg-blue-50 rounded-xl text-center">
            <Clock size={20} className="text-blue-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-blue-700">{applied}</p>
            <p className="text-xs text-blue-600">{t('applicationsWidget.pipeline.waiting')}</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-center">
            <Building2 size={20} className="text-amber-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-amber-700">{interview}</p>
            <p className="text-xs text-amber-600">{t('applicationsWidget.pipeline.interviews')}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-center">
            <Trophy size={20} className="text-emerald-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-emerald-700">{offer}</p>
            <p className="text-xs text-emerald-600">{t('applicationsWidget.pipeline.offers')}</p>
          </div>
          <div className="p-3 bg-slate-100 rounded-xl text-center">
            <XCircle size={20} className="text-slate-700 dark:text-stone-300 mx-auto mb-1" />
            <p className="text-xl font-bold text-slate-700 dark:text-stone-300">{rejected}</p>
            <p className="text-xs text-slate-600">{t('applicationsWidget.pipeline.rejected')}</p>
          </div>
        </div>

        {/* Progress bar för pipeline */}
        {total > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{t('applicationsWidget.yourPipeline')}</span>
              <span className="font-medium text-slate-800 dark:text-stone-100">{t('applicationsWidget.responseRatePercent', { rate: responseRate })}</span>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden">
              {applied > 0 && (
                <div className="bg-blue-400" style={{ width: `${(applied / total) * 100}%` }} />
              )}
              {interview > 0 && (
                <div className="bg-amber-400" style={{ width: `${(interview / total) * 100}%` }} />
              )}
              {offer > 0 && (
                <div className="bg-emerald-400" style={{ width: `${(offer / total) * 100}%` }} />
              )}
              {rejected > 0 && (
                <div className="bg-slate-300" style={{ width: `${(rejected / total) * 100}%` }} />
              )}
            </div>
          </div>
        )}

        {/* Nästa uppföljning - prominently */}
        {nextFollowUp ? (
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Calendar size={24} className="text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-amber-600">{t('applicationsWidget.upcomingFollowUp')}</p>
                <p className="font-semibold text-amber-800">{nextFollowUp.company}</p>
                <p className="text-sm text-amber-700">{nextFollowUp.jobTitle}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-amber-700">{formatDate(nextFollowUp.dueDate)}</p>
              </div>
            </div>
          </div>
        ) : total > 0 ? (
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 text-slate-600">
              <CheckCircle2 size={18} className="text-emerald-500" />
              <p className="text-sm">{t('applicationsWidget.noUpcomingFollowUps')}</p>
            </div>
          </div>
        ) : null}

        {/* Empty state */}
        {total === 0 && (
          <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Send size={28} className="text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-orange-900 mb-2">{t('applicationsWidget.trackApplications')}</p>
                <p className="text-sm text-orange-700 mb-4">
                  {t('applicationsWidget.trackDescription')}
                </p>
                <div className="flex items-center gap-4 text-sm text-orange-600">
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {t('applicationsWidget.benefits.followUpInTime')}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp size={14} />
                    {t('applicationsWidget.benefits.seeStats')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// Huvudkomponent
export const ApplicationsWidget = memo(function ApplicationsWidget(props: ApplicationsWidgetProps) {
  const { size = 'small', ...rest } = props

  switch (size) {
    case 'large':
      return <ApplicationsWidgetLarge {...rest} />
    case 'medium':
      return <ApplicationsWidgetMedium {...rest} />
    case 'small':
    default:
      return <ApplicationsWidgetSmall {...rest} />
  }
})
