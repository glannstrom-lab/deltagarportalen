import { memo } from 'react'
import { Compass, Sparkles, CheckCircle2 } from 'lucide-react'
import { DashboardWidget } from '../DashboardWidget'
import type { WidgetStatus } from '@/types/dashboard'

interface InterestWidgetProps {
  hasResult: boolean
  topRecommendations?: string[]
  completedAt?: string | null
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

export const InterestWidget = memo(function InterestWidget({
  hasResult,
  topRecommendations = [],
  completedAt,
  loading,
  error,
  onRetry,
}: InterestWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (!hasResult) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  // Formatera datum
  const getTimeAgo = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Idag'
    if (diffDays === 1) return 'Igår'
    if (diffDays < 30) return `${diffDays} dagar sedan`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} månader sedan`
    return `${Math.floor(diffDays / 365)} år sedan`
  }

  return (
    <DashboardWidget
      title="Dina intressen"
      icon={<Compass size={20} />}
      to="/interest-guide"
      color="teal"
      status={status}
      progress={hasResult ? 100 : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
      stats={[
        { 
          label: 'Status', 
          value: hasResult ? 'Test genomfört' : 'Ej påbörjat' 
        },
        ...(completedAt ? [{ 
          label: 'Genomfört', 
          value: getTimeAgo(completedAt) 
        }] : []),
      ]}
      primaryAction={{
        label: hasResult ? 'Se dina resultat' : 'Gör testet',
      }}
    >
      {/* Visa topp-rekommendationer om det finns */}
      {hasResult && topRecommendations.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-slate-500 mb-2">Dina topp-matchningar:</p>
          <div className="space-y-2">
            {topRecommendations.slice(0, 3).map((occupation, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 p-2 bg-teal-50 rounded-lg"
              >
                <Sparkles size={14} className="text-teal-500 flex-shrink-0" />
                <span className="text-sm font-medium text-slate-700 truncate">
                  {occupation}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Tom state med info */}
      {!hasResult && (
        <div className="mt-2 p-3 bg-teal-50 rounded-lg">
          <p className="text-sm text-teal-700">
            Intresseguiden hjälper dig upptäcka yrken som passar din personlighet. 
            Testet tar bara några minuter.
          </p>
        </div>
      )}
      
      {/* Complete state med bekräftelse */}
      {hasResult && (
        <div className="flex items-center gap-2 text-emerald-600 mt-2">
          <CheckCircle2 size={16} />
          <span className="text-sm">Bra jobbat med att utforska dina intressen!</span>
        </div>
      )}
    </DashboardWidget>
  )
})
