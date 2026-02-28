import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { LoadingState } from '@/components/ui/LoadingState'
import { AlertCircle, ArrowRight } from 'lucide-react'
import type { DashboardWidgetProps, WidgetStat, WidgetStatus, WidgetColor } from '@/types/dashboard'

// Sidebar-färgen #4f46e5
const SIDEBAR_COLOR = '#4f46e5'

// Förenklad färgpalett: 3 färger istället för 8
// primary = kärnfunktioner (CV, Profil)
// secondary = utforskning (Intressen, Karriär)  
// neutral = stödfunktioner (övriga)
const colorStyles: Record<WidgetColor, string> = {
  violet: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  teal: 'bg-teal-50 text-teal-600 border-teal-100',
  blue: 'bg-slate-50 text-slate-600 border-slate-100',
  orange: 'bg-slate-50 text-slate-600 border-slate-100',
  green: 'bg-teal-50 text-teal-600 border-teal-100',
  rose: 'bg-slate-50 text-slate-600 border-slate-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
}

const colorBgStyles: Record<WidgetColor, string> = {
  violet: 'bg-indigo-500',
  teal: 'bg-teal-500',
  blue: 'bg-slate-500',
  orange: 'bg-slate-500',
  green: 'bg-teal-500',
  rose: 'bg-slate-500',
  amber: 'bg-amber-500',
  indigo: 'bg-indigo-500',
}

const statusConfig: Record<WidgetStatus, { label: string; barColor: string }> = {
  empty: { label: 'Redo att börja', barColor: 'bg-slate-200' },
  'in-progress': { label: 'Du är igång!', barColor: 'bg-amber-400' },
  complete: { label: 'Bra jobbat!', barColor: 'bg-emerald-500' },
  error: { label: 'Något gick fel', barColor: 'bg-rose-500' },
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
  sizeSelector,
}: DashboardWidgetProps) {
  if (loading) {
    return (
      <Card className="min-h-[200px] h-auto p-5 flex items-center justify-center">
        <LoadingState size="sm" message="Laddar..." />
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="min-h-[200px] h-auto p-5 flex flex-col items-center justify-center text-center">
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
    <Card className="min-h-[200px] h-auto p-5 flex flex-col hover:shadow-md transition-shadow">
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
        <div className="flex items-center gap-1">
          {sizeSelector}
          <Link
            to={to}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label={`Gå till ${title}`}
            title={`Gå till ${title}`}
          >
            <ArrowRight size={16} />
          </Link>
        </div>
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
            className="flex-1 py-2.5 px-4 text-white text-sm font-medium rounded-xl text-center transition-all duration-200 hover:opacity-90 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center gap-2"
            style={{ 
              backgroundColor: SIDEBAR_COLOR,
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)'
            }}
          >
            {primaryAction.label}
            <ArrowRight size={16} />
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
