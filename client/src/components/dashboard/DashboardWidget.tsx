import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { LoadingState } from '@/components/ui/LoadingState'
import { AlertCircle, ArrowRight } from 'lucide-react'
import type { DashboardWidgetProps, WidgetStat, WidgetStatus, WidgetColor } from '@/types/dashboard'

// Sidebar-färgen #4f46e5
const SIDEBAR_COLOR = '#4f46e5'

// Standardiserad färgpalett per kategori - alla widgets använder dessa
const categoryColors: Record<WidgetColor, { bg: string; text: string; border: string; iconBg: string }> = {
  // CV/Profil - Violet
  violet: {
    bg: 'bg-violet-50',
    text: 'text-violet-600',
    border: 'border-violet-100',
    iconBg: 'bg-violet-500'
  },
  // Jobbsökning - Blue
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-100',
    iconBg: 'bg-blue-500'
  },
  // Karriär/Intresse - Emerald
  green: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-100',
    iconBg: 'bg-emerald-500'
  },
  // Dagbok/Välmående - Rose
  rose: {
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    border: 'border-rose-100',
    iconBg: 'bg-rose-500'
  },
  // Kunskap/Utbildning - Amber
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-100',
    iconBg: 'bg-amber-500'
  },
  // Ansökningar - Indigo
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    border: 'border-indigo-100',
    iconBg: 'bg-indigo-500'
  },
  // Personliga brev - Teal
  teal: {
    bg: 'bg-teal-50',
    text: 'text-teal-600',
    border: 'border-teal-100',
    iconBg: 'bg-teal-500'
  },
  // Övningar/Aktivitet - Orange
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-100',
    iconBg: 'bg-orange-500'
  },
}

// Standardiserade status-stilar
const statusConfig: Record<WidgetStatus, { label: string; barColor: string; ariaLabel: string }> = {
  empty: { 
    label: 'Redo att börja', 
    barColor: 'bg-slate-200',
    ariaLabel: 'Ingen aktivitet påbörjad ännu'
  },
  'in-progress': { 
    label: 'Du är igång!', 
    barColor: 'bg-amber-400',
    ariaLabel: 'Påbörjad, fortsätt så'
  },
  complete: { 
    label: 'Bra jobbat!', 
    barColor: 'bg-emerald-500',
    ariaLabel: 'Slutförd'
  },
  error: { 
    label: 'Något gick fel', 
    barColor: 'bg-rose-500',
    ariaLabel: 'Ett fel har uppstått'
  },
}

function StatRow({ stat }: { stat: WidgetStat }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-slate-500">{stat.label}</span>
      <div className="flex items-center gap-1">
        <span className="font-medium text-slate-800">{stat.value}</span>
        {stat.trend === 'up' && <span className="text-emerald-500 text-xs" aria-label="Ökande trend">↑</span>}
        {stat.trend === 'down' && <span className="text-rose-500 text-xs" aria-label="Minskande trend">↓</span>}
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
  const colors = categoryColors[color]
  const statusInfo = statusConfig[status]

  if (loading) {
    return (
      <Card className="min-h-[140px] h-auto p-5 flex items-center justify-center" role="status" aria-live="polite">
        <LoadingState size="sm" message="Laddar..." />
      </Card>
    )
  }

  if (error) {
    return (
      <Card 
        className="min-h-[140px] h-auto p-5 flex flex-col items-center justify-center text-center" 
        role="alert" 
        aria-live="assertive"
      >
        <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center mb-2">
          <AlertCircle className="w-5 h-5 text-rose-500" aria-hidden="true" />
        </div>
        <p className="text-sm text-slate-600 mb-2">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded px-2 py-1"
          >
            Försök igen
          </button>
        )}
      </Card>
    )
  }

  return (
    <Card 
      className="min-h-[140px] h-full p-5 flex flex-col hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2"
      role="article"
      aria-label={`${title} - ${statusInfo.ariaLabel}`}
    >
      {/* Header - Standardiserad struktur */}
      <div className="flex items-start justify-between mb-3">
        <Link 
          to={to} 
          className="flex items-center gap-3 group min-w-0 flex-1 focus:outline-none"
          aria-label={`Gå till ${title}`}
        >
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center border-2 shrink-0 transition-colors',
              colors.bg,
              colors.text,
              colors.border
            )}
            aria-hidden="true"
          >
            {icon}
          </div>
          <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors text-sm truncate">
            {title}
          </h3>
        </Link>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {sizeSelector}
          <Link
            to={to}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label={`Gå till ${title}`}
            title={`Gå till ${title}`}
          >
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Progress bar - Standardiserad */}
      {(status !== 'complete' || progress > 0) && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500 font-medium">{statusInfo.label}</span>
            {progress > 0 && (
              <span className="font-semibold text-slate-700" aria-label={`${progress}% klart`}>
                {progress}%
              </span>
            )}
          </div>
          <div 
            className="h-2 bg-slate-100 rounded-full overflow-hidden" 
            role="progressbar" 
            aria-valuenow={progress} 
            aria-valuemin={0} 
            aria-valuemax={100}
            aria-label={`Framsteg: ${progress}%`}
          >
            <div
              className={cn('h-full rounded-full transition-all duration-500', statusInfo.barColor)}
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

      {/* Actions - Standardiserad footer-höjd */}
      <div className="pt-3 mt-auto border-t border-slate-100 flex gap-2 min-h-[44px]">
        {primaryAction && (
          <Link
            to={to}
            onClick={primaryAction.onClick}
            className="flex-1 py-2 px-3 text-white text-xs font-medium rounded-lg text-center transition-all duration-200 hover:opacity-90 flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
            style={{ backgroundColor: SIDEBAR_COLOR }}
          >
            <span className="truncate">{primaryAction.label}</span>
            <ArrowRight size={12} className="shrink-0" aria-hidden="true" />
          </Link>
        )}
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            disabled={secondaryAction.disabled}
            className="flex-1 py-2 px-3 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 truncate focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400"
          >
            {secondaryAction.icon}
            <span className="truncate">{secondaryAction.label}</span>
          </button>
        )}
      </div>
    </Card>
  )
}
