import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { LoadingState } from '@/components/ui/LoadingState'
import { AlertCircle } from 'lucide-react'
import type { DashboardWidgetProps, WidgetStat, WidgetStatus, WidgetColor } from '@/types/dashboard'

const colorStyles: Record<WidgetColor, string> = {
  violet: 'bg-violet-50 text-violet-600 border-violet-100',
  teal: 'bg-teal-50 text-teal-600 border-teal-100',
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
  orange: 'bg-orange-50 text-orange-600 border-orange-100',
  green: 'bg-green-50 text-green-600 border-green-100',
  rose: 'bg-rose-50 text-rose-600 border-rose-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
}

const statusConfig: Record<WidgetStatus, { label: string; barColor: string }> = {
  empty: { label: 'Kom igång', barColor: 'bg-slate-200' },
  'in-progress': { label: 'Påbörjad', barColor: 'bg-amber-400' },
  complete: { label: 'Redo', barColor: 'bg-emerald-500' },
  error: { label: 'Fel', barColor: 'bg-rose-500' },
}

function StatRow({ stat }: { stat: WidgetStat }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-slate-500">{stat.label}</span>
      <div className="flex items-center gap-1">
        <span className="font-medium text-slate-800">{stat.value}</span>
        {stat.trend === 'up' && <span className="text-emerald-500 text-xs">↑</span>}
        {stat.trend === 'down' && <span className="text-rose-500 text-xs">↓</span>}
      </div>
    </div>
  )
}

export function DashboardWidget({
  title,
  icon,
  to,
  color,
  status,
  progress = 0,
  loading = false,
  error,
  children,
  stats,
  primaryAction,
  secondaryAction,
  onRetry,
}: DashboardWidgetProps) {
  if (loading) {
    return (
      <Card className="h-[280px] p-5 flex items-center justify-center">
        <LoadingState size="sm" message="Laddar..." />
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="h-[280px] p-5 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6 text-rose-500" />
        </div>
        <p className="text-sm text-slate-600 mb-3">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm text-violet-600 hover:text-violet-700 font-medium"
          >
            Försök igen
          </button>
        )}
      </Card>
    )
  }

  return (
    <Card className="h-[280px] p-5 flex flex-col hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <Link to={to} className="flex items-center gap-3 group">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center border',
              colorStyles[color]
            )}
          >
            {icon}
          </div>
          <h3 className="font-semibold text-slate-800 group-hover:text-violet-600 transition-colors">
            {title}
          </h3>
        </Link>
        <Link
          to={to}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          aria-label={`Gå till ${title}`}
        >
          →
        </Link>
      </div>

      {/* Progress bar - dold om complete eller empty med 0% */}
      {(status !== 'complete' || progress > 0) && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500">{statusConfig[status].label}</span>
            {progress > 0 && <span className="font-medium text-slate-700">{progress}%</span>}
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', statusConfig[status].barColor)}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {children || (
          <div className="space-y-1">
            {stats?.map((stat, i) => (
              <StatRow key={i} stat={stat} />
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="pt-4 mt-auto border-t border-slate-100 flex gap-2">
        {primaryAction && (
          <Link
            to={to}
            onClick={primaryAction.onClick}
            className="flex-1 py-2 px-3 bg-violet-600 text-white text-sm font-medium rounded-lg text-center hover:bg-violet-700 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
          >
            {primaryAction.label}
          </Link>
        )}
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="flex-1 py-2 px-3 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </Card>
  )
}
