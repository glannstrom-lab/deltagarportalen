import { memo } from 'react'
import { Send, Clock, CheckCircle2, XCircle, Trophy, Building2, Calendar, AlertCircle, TrendingUp } from 'lucide-react'
import { DashboardWidget } from '../DashboardWidget'
import type { WidgetStatus } from '@/types/dashboard'

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
}

export const ApplicationsWidget = memo(function ApplicationsWidget({
  total,
  statusBreakdown = { applied: 0, interview: 0, rejected: 0, offer: 0 },
  nextFollowUp,
  loading,
  error,
  onRetry,
}: ApplicationsWidgetProps) {
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

  // Beräkna svarsfrekvens
  const responseRate = total > 0 
    ? Math.round(((statusBreakdown.interview + statusBreakdown.rejected + statusBreakdown.offer) / total) * 100)
    : 0

  return (
    <DashboardWidget
      title="Dina ansökningar"
      icon={<Send size={22} />}
      to="/job-tracker"
      color="orange"
      status={status}
      progress={total > 0 ? 100 : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
      stats={[
        { label: 'Totalt skickade', value: total },
        ...(responseRate > 0 ? [{ label: 'Svarsfrekvens', value: `${responseRate}%` }] : []),
      ]}
      primaryAction={{
        label: total > 0 ? 'Se alla ansökningar' : 'Registrera ansökan',
      }}
    >
      <div className="mt-3 space-y-3">
        {/* Stort nummer med ikon */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center">
            <Trophy size={28} className="text-orange-600" />
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-800">{total}</p>
            <p className="text-sm text-slate-500">
              {total === 0 ? 'Inga ansökningar' : total === 1 ? 'ansökan skickad' : 'ansökningar skickade'}
            </p>
          </div>
        </div>
        
        {/* Status-fördelning */}
        {total > 0 && (
          <div className="space-y-2">
            {/* Visual status bar */}
            <div className="flex gap-0.5 h-3 rounded-full overflow-hidden">
              {statusBreakdown.applied > 0 && (
                <div 
                  className="bg-blue-400" 
                  style={{ width: `${(statusBreakdown.applied / total) * 100}%` }}
                  title={`Skickade: ${statusBreakdown.applied}`}
                />
              )}
              {statusBreakdown.interview > 0 && (
                <div 
                  className="bg-amber-400" 
                  style={{ width: `${(statusBreakdown.interview / total) * 100}%` }}
                  title={`Intervjuer: ${statusBreakdown.interview}`}
                />
              )}
              {statusBreakdown.offer > 0 && (
                <div 
                  className="bg-emerald-400" 
                  style={{ width: `${(statusBreakdown.offer / total) * 100}%` }}
                  title={`Erbjudanden: ${statusBreakdown.offer}`}
                />
              )}
              {statusBreakdown.rejected > 0 && (
                <div 
                  className="bg-slate-300" 
                  style={{ width: `${(statusBreakdown.rejected / total) * 100}%` }}
                  title={`Avslag: ${statusBreakdown.rejected}`}
                />
              )}
            </div>
            
            {/* Status labels */}
            <div className="flex flex-wrap gap-2 text-xs">
              {statusBreakdown.applied > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg">
                  <Clock size={12} />
                  {statusBreakdown.applied} väntar svar
                </span>
              )}
              {statusBreakdown.interview > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-lg">
                  <Building2 size={12} />
                  {statusBreakdown.interview} intervjuer
                </span>
              )}
              {statusBreakdown.offer > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg">
                  <Trophy size={12} />
                  {statusBreakdown.offer} erbjudanden!
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Påminnelse om uppföljning */}
        {nextFollowUp && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-amber-500" />
              <span className="text-sm font-medium text-amber-900">Påminnelse</span>
            </div>
            <p className="text-sm text-amber-800">
              Följ upp hos <strong>{nextFollowUp.company}</strong>
            </p>
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <Calendar size={12} />
              {formatDate(nextFollowUp.dueDate)}
            </p>
          </div>
        )}
        
        {/* Tom state */}
        {total === 0 && (
          <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100">
            <div className="flex items-start gap-3">
              <Send size={20} className="text-orange-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-900">Håll koll på dina ansökningar</p>
                <p className="text-xs text-orange-700 mt-1">
                  Registrera varje ansökan så du kan följa upp och se vilka som ger svar. 
                  Det hjälper dig att bli mer strukturerad i ditt jobbsökande.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Motivation */}
        {total > 0 && statusBreakdown.interview === 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <TrendingUp size={14} className="text-emerald-500" />
            <span>Fortsätt skicka ansökningar - rätt jobb finns där ute!</span>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
})
