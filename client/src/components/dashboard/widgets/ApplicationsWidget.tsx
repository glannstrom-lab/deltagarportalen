import { memo } from 'react'
import { Send, Clock, CheckCircle2, XCircle, Trophy, Building2, Calendar, AlertCircle, TrendingUp } from 'lucide-react'
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
  const getStatus = (): WidgetStatus => {
    if (total === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  // Formatera datum
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Idag'
    if (diffDays === 1) return 'Imorgon'
    if (diffDays < 0) return `${Math.abs(diffDays)} dagar sedan`
    return `Om ${diffDays} dagar`
  }

  return (
    <DashboardWidget
      title="Ansökningar"
      icon={<Send size={20} />}
      to="/job-tracker"
      color="orange"
      status={status}
      progress={total > 0 ? 100 : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: total > 0 ? 'Se status' : 'Registrera',
      }}
    >
      <div className="flex flex-col items-center justify-center py-2 text-center">
        <Trophy size={28} className="text-orange-500 mb-2" />
        <p className="text-3xl font-bold text-slate-800">{total}</p>
        <p className="text-sm text-slate-500">
          {total === 0 ? 'Inga ansökningar' : total === 1 ? 'ansökan' : 'ansökningar'}
        </p>
        
        {/* Nästa uppföljning - viktigast */}
        {nextFollowUp && (
          <div className="mt-3 px-3 py-1.5 bg-amber-50 rounded-lg w-full">
            <p className="text-xs text-amber-600">Följ upp {formatDate(nextFollowUp.dueDate).toLowerCase()}</p>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// MEDIUM - Status-fördelning + uppföljning
function ApplicationsWidgetMedium({ total, statusBreakdown = { applied: 0, interview: 0, rejected: 0, offer: 0 }, nextFollowUp, loading, error, onRetry }: ApplicationsWidgetProps) {
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
    
    if (diffDays === 0) return 'Idag'
    if (diffDays === 1) return 'Imorgon'
    if (diffDays < 0) return `${Math.abs(diffDays)} dagar sedan`
    return `Om ${diffDays} dagar`
  }

  // Beräkna svarsfrekvens
  const responseRate = total > 0 
    ? Math.round(((interview + rejected + offer) / total) * 100)
    : 0

  return (
    <DashboardWidget
      title="Ansökningar"
      icon={<Send size={22} />}
      to="/job-tracker"
      color="orange"
      status={status}
      progress={total > 0 ? 100 : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: total > 0 ? 'Följ upp' : 'Registrera ansökan',
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
              <p className="text-2xl font-bold text-slate-800">{total}</p>
              <p className="text-xs text-slate-500">totalt</p>
            </div>
          </div>
          {responseRate > 0 && (
            <div className="text-right">
              <p className="text-lg font-semibold text-emerald-600">{responseRate}%</p>
              <p className="text-xs text-slate-500">svarsfrekvens</p>
            </div>
          )}
        </div>

        {/* Status badges */}
        {total > 0 && (
          <div className="flex flex-wrap gap-2">
            {applied > 0 && (
              <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg">
                {applied} väntar svar
              </span>
            )}
            {interview > 0 && (
              <span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded-lg">
                {interview} intervjuer
              </span>
            )}
            {offer > 0 && (
              <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-lg">
                {offer} erbjudanden!
              </span>
            )}
          </div>
        )}

        {/* Nästa uppföljning - prominently */}
        {nextFollowUp && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={14} className="text-amber-500" />
              <span className="text-xs font-medium text-amber-700">Påminnelse</span>
            </div>
            <p className="text-sm text-amber-800">
              Följ upp <strong>{nextFollowUp.company}</strong>
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
            <p className="text-sm text-orange-700">Håll koll på dina ansökningar</p>
            <p className="text-xs text-orange-600 mt-1">Registrera varje ansökan för att följa upp</p>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// LARGE - Full pipeline-översikt
function ApplicationsWidgetLarge({ total, statusBreakdown = { applied: 0, interview: 0, rejected: 0, offer: 0 }, nextFollowUp, loading, error, onRetry }: ApplicationsWidgetProps) {
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
    
    if (diffDays === 0) return 'Idag'
    if (diffDays === 1) return 'Imorgon'
    if (diffDays < 0) return `${Math.abs(diffDays)} dagar sedan`
    return `Om ${diffDays} dagar`
  }

  // Beräkna svarsfrekvens
  const responseRate = total > 0 
    ? Math.round(((interview + rejected + offer) / total) * 100)
    : 0

  return (
    <DashboardWidget
      title="Ansökningar"
      icon={<Send size={24} />}
      to="/job-tracker"
      color="orange"
      status={status}
      progress={total > 0 ? 100 : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: 'Ny ansökan',
      }}
      secondaryAction={total > 0 ? {
        label: 'Se alla',
        onClick: () => {},
      } : undefined}
    >
      <div className="space-y-4">
        {/* Pipeline-översikt i grid */}
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 bg-blue-50 rounded-xl text-center">
            <Clock size={20} className="text-blue-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-blue-700">{applied}</p>
            <p className="text-xs text-blue-600">Väntar svar</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-center">
            <Building2 size={20} className="text-amber-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-amber-700">{interview}</p>
            <p className="text-xs text-amber-600">Intervjuer</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-center">
            <Trophy size={20} className="text-emerald-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-emerald-700">{offer}</p>
            <p className="text-xs text-emerald-600">Erbjudanden</p>
          </div>
          <div className="p-3 bg-slate-100 rounded-xl text-center">
            <XCircle size={20} className="text-slate-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-slate-700">{rejected}</p>
            <p className="text-xs text-slate-600">Avslag</p>
          </div>
        </div>

        {/* Progress bar för pipeline */}
        {total > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Din ansöknings-pipeline</span>
              <span className="font-medium text-slate-800">{responseRate}% svarsfrekvens</span>
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
                <p className="text-sm text-amber-600">Kommande uppföljning</p>
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
              <p className="text-sm">Inga kommande uppföljningar just nu</p>
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
                <p className="text-lg font-semibold text-orange-900 mb-2">Håll koll på dina ansökningar</p>
                <p className="text-sm text-orange-700 mb-4">
                  Registrera varje ansökan så du kan följa upp och se vilka som ger svar. 
                  Det hjälper dig att bli mer strukturerad i ditt jobbsökande.
                </p>
                <div className="flex items-center gap-4 text-sm text-orange-600">
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    Följ upp i tid
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp size={14} />
                    Se statistik
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
