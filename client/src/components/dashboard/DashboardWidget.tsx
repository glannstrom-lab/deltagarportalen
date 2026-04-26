import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { LoadingState } from '@/components/ui/LoadingState'
import { AlertCircle, ArrowRight } from '@/components/ui/icons'
import type { DashboardWidgetProps, WidgetStat, WidgetStatus, WidgetColor } from '@/types/dashboard'

const SIDEBAR_COLOR = '#4f46e5'

const categoryColors: Record<WidgetColor, { bg: string; text: string }> = {
  brand: { bg: 'bg-brand-50', text: 'text-brand-900' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
  green: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-600' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
}

const statusConfig: Record<WidgetStatus, { barColor: string }> = {
  empty: { barColor: 'bg-slate-200' },
  'in-progress': { barColor: 'bg-amber-400' },
  complete: { barColor: 'bg-emerald-500' },
  error: { barColor: 'bg-rose-500' },
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
  primaryAction,
  onRetry,
  sizeSelector,
}: DashboardWidgetProps) {
  const colors = categoryColors[color]
  const statusInfo = statusConfig[status]

  if (loading) {
    return (
      <Card className="p-3" role="status">
        <LoadingState size="sm" message="" />
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-3 text-center" role="alert">
        <AlertCircle className="w-4 h-4 text-rose-500 mx-auto mb-1" />
        <p className="text-xs text-slate-600">{error}</p>
        {onRetry && (
          <button onClick={onRetry} className="text-xs text-sky-600 mt-1">Försök igen</button>
        )}
      </Card>
    )
  }

  return (
    <Card className="p-3 hover: transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <Link to={to} className="flex items-center gap-1.5 group min-w-0 flex-1">
          <div className={cn('w-6 h-6 rounded flex items-center justify-center shrink-0', colors.bg, colors.text)}>
            {icon}
          </div>
          <h3 className="font-medium text-slate-800 text-xs truncate group-hover:text-sky-600">
            {title}
          </h3>
        </Link>
        <div className="flex items-center shrink-0 ml-1">
          {sizeSelector}
          <Link to={to} className="p-0.5 text-slate-600 hover:text-slate-600">
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Progress bar - Ultra thin */}
      {progress > 0 && (
        <div className="mb-1.5">
          <div className="flex items-center justify-between text-xs mb-0.5">
            <span className="text-slate-600">{progress}%</span>
          </div>
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full', statusInfo.barColor)} style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="text-xs text-slate-600">
        {children}
      </div>

      {/* Action */}
      {primaryAction && (
        <div className="pt-1.5 mt-1.5 border-t border-slate-100">
          <Link
            to={to}
            className="block w-full py-1 px-2 text-white text-xs font-medium rounded text-center"
            style={{ backgroundColor: SIDEBAR_COLOR }}
          >
            {primaryAction.label}
          </Link>
        </div>
      )}
    </Card>
  )
}
