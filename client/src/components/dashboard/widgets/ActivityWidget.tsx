import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, Target, Flame } from '@/components/ui/icons'
import { DashboardWidget } from '../DashboardWidget'
import type { WidgetStatus } from '@/types/dashboard'

interface ActivityWidgetProps {
  weeklyApplications: number
  streakDays: number
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

export const ActivityWidget = memo(function ActivityWidget({
  weeklyApplications,
  streakDays,
  loading,
  error,
  onRetry,
}: ActivityWidgetProps) {
  const { t } = useTranslation()

  const getStatus = (): WidgetStatus => {
    if (weeklyApplications === 0 && streakDays === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  // Uppmuntrande meddelande baserat på aktivitet (utan streak-fokus)
  const getEncouragementMessage = () => {
    if (weeklyApplications > 0) return t('activityWidget.goodActive')
    return t('activityWidget.takeYourTime')
  }

  return (
    <DashboardWidget
      title={t('activityWidget.yourActivity')}
      icon={<TrendingUp size={20} />}
      to="/diary"
      color="rose"
      status={status}
      progress={Math.min(100, (weeklyApplications / 5) * 100)} // 5 ansökningar = 100%
      loading={loading}
      error={error}
      onRetry={onRetry}
      stats={[
        {
          label: t('activityWidget.thisWeek'),
          value: t('activityWidget.applicationsCount', { count: weeklyApplications })
        },
      ]}
      primaryAction={{
        label: t('activityWidget.seeActivity'),
      }}
    >

      
      {/* Uppmuntrande meddelande */}
      <div className="mt-3 flex items-start gap-2">
        <Target size={16} className="text-rose-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-slate-600">
          {getEncouragementMessage()}
        </p>
      </div>
      
      {/* Tips för tom state */}
      {weeklyApplications === 0 && streakDays === 0 && (
        <div className="mt-2 p-3 bg-rose-50 rounded-lg">
          <p className="text-sm text-rose-700">
            {t('activityWidget.lowActivityMessage')}
          </p>
        </div>
      )}
    </DashboardWidget>
  )
})
