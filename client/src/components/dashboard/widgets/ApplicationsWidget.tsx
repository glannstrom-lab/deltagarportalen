import { memo } from 'react'
import { Send, Clock, CheckCircle2, XCircle, Trophy } from 'lucide-react'
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

  return (
    <DashboardWidget
      title="Dina ansökningar"
      icon={<Send size={20} />}
      to="/job-tracker"
      color="orange"
      status={status}
      progress={total > 0 ? 100 : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
      stats={[
        { label: 'Totalt skickade', value: total },
        ...(statusBreakdown.interview > 0 ? [{ 
          label: 'Intervjuer', 
          value: statusBreakdown.interview,
          trend: 'up' as const
        }] : []),
      ]}
      primaryAction={{
        label: total > 0 ? 'Se alla ansökningar' : 'Registrera ansökan',
      }}
    >
      {/* Visa status-fördelning om det finns ansökningar */}
      {total > 0 && (
        <div className="mt-2 space-y-2">
          {/* Mini status bars */}
          <div className="flex gap-1 h-2 rounded-full overflow-hidden">
            {statusBreakdown.applied > 0 && (
              <div 
                className="bg-blue-400" 
                style={{ width: `${(statusBreakdown.applied / total) * 100}%` }}
              />
            )}
            {statusBreakdown.interview > 0 && (
              <div 
                className="bg-amber-400" 
                style={{ width: `${(statusBreakdown.interview / total) * 100}%` }}
              />
            )}
            {statusBreakdown.offer > 0 && (
              <div 
                className="bg-emerald-400" 
                style={{ width: `${(statusBreakdown.offer / total) * 100}%` }}
              />
            )}
          </div>
          
          {/* Status labels */}
          <div className="flex flex-wrap gap-3 text-xs">
            {statusBreakdown.applied > 0 && (
              <span className="flex items-center gap-1 text-slate-600">
                <CheckCircle2 size={12} className="text-blue-500" />
                {statusBreakdown.applied} skickade
              </span>
            )}
            {statusBreakdown.interview > 0 && (
              <span className="flex items-center gap-1 text-slate-600">
                <Clock size={12} className="text-amber-500" />
                {statusBreakdown.interview} intervjuer
              </span>
            )}
            {statusBreakdown.offer > 0 && (
              <span className="flex items-center gap-1 text-slate-600">
                <Trophy size={12} className="text-emerald-500" />
                {statusBreakdown.offer} erbjudanden!
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Påminnelse om uppföljning */}
      {nextFollowUp && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
          <p className="text-xs text-amber-700 font-medium mb-1">Påminnelse:</p>
          <p className="text-sm text-amber-800">
            Följ upp hos {nextFollowUp.company}
          </p>
          <p className="text-xs text-amber-600 mt-1">
            {formatDate(nextFollowUp.dueDate)}
          </p>
        </div>
      )}
      
      {/* Tom state med uppmuntran */}
      {total === 0 && (
        <div className="mt-2 p-3 bg-orange-50 rounded-lg">
          <p className="text-sm text-orange-700">
            När du skickar en ansökan kan du registrera den här för att hålla koll på alla dina möjligheter.
          </p>
        </div>
      )}
    </DashboardWidget>
  )
})
