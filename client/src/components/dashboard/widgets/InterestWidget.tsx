import { memo } from 'react'
import { Compass, Sparkles, CheckCircle2, Lightbulb, Target, Award, Star } from 'lucide-react'
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
      icon={<Compass size={22} />}
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
          value: hasResult ? 'Du har gjort testet!' : 'Nyfiken på dina intressen?' 
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
      <div className="mt-3 space-y-3">
        {/* Status-indikator */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center">
            {hasResult ? (
              <Award size={28} className="text-teal-600" />
            ) : (
              <Target size={28} className="text-teal-600" />
            )}
          </div>
          <div>
            {hasResult ? (
              <>
                <p className="text-lg font-bold text-slate-800">Test klart!</p>
                <p className="text-sm text-slate-500">
                  {topRecommendations.length > 0 
                    ? `${topRecommendations.length} yrken matchar dig` 
                    : 'Se vilka yrken som passar dig'}
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-slate-800">Nyfiken på vad som passar dig?</p>
                <p className="text-sm text-slate-500">Testet tar bara några minuter</p>
              </>
            )}
          </div>
        </div>
        
        {/* Visa topp-rekommendationer */}
        {hasResult && topRecommendations.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-medium">Dina topp-matchningar:</p>
            <div className="space-y-2">
              {topRecommendations.slice(0, 3).map((occupation, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-3 bg-teal-50 rounded-xl"
                >
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    {index === 0 && <Star size={14} className="text-amber-500" />}
                    {index === 1 && <Star size={14} className="text-slate-400" />}
                    {index === 2 && <Star size={14} className="text-orange-400" />}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{occupation}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Tom state */}
        {!hasResult && (
          <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border border-teal-100">
            <div className="flex items-start gap-3">
              <Lightbulb size={20} className="text-teal-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-teal-900">Vad passar just dig?</p>
                <p className="text-xs text-teal-700 mt-1">
                  Intresseguiden hjälper dig upptäcka yrken som matchar din personlighet. 
                  Testet tar bara några minuter.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Complete state bekräftelse */}
        {hasResult && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl">
            <CheckCircle2 size={18} className="text-emerald-500" />
            <span className="text-sm text-emerald-700">
              Bra jobbat med att utforska dina intressen!
            </span>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
})
