import { memo } from 'react'
import { Compass, Sparkles, CheckCircle2, Lightbulb, Target, Award, Star, ArrowRight } from 'lucide-react'
import { DashboardWidget } from '../DashboardWidget'
import type { WidgetStatus } from '@/types/dashboard'
import type { WidgetSize } from '../WidgetSizeSelector'

interface InterestWidgetProps {
  hasResult: boolean
  topRecommendations?: string[]
  completedAt?: string | null
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  size?: WidgetSize
}

// SMALL - Fokus på resultat eller CTA
function InterestWidgetSmall({ hasResult, topRecommendations = [], loading, error, onRetry }: Omit<InterestWidgetProps, 'size'>) {
  const getStatus = (): WidgetStatus => {
    if (!hasResult) return 'empty'
    return 'complete'
  }

  const status = getStatus()
  const firstRecommendation = topRecommendations[0]

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
      primaryAction={{
        label: hasResult ? 'Se resultat' : 'Gör testet',
      }}
    >
      <div className="flex flex-col items-center justify-center py-2 text-center">
        {hasResult ? (
          <>
            <div className="flex items-center gap-1 text-emerald-600 mb-1">
              <CheckCircle2 size={16} />
              <span className="text-sm font-medium">Test klart!</span>
            </div>
            {firstRecommendation && (
              <p className="text-sm text-slate-600 line-clamp-2">
                {firstRecommendation}
              </p>
            )}
          </>
        ) : (
          <>
            <Sparkles size={24} className="text-teal-500 mb-2" />
            <p className="text-sm text-slate-500">Upptäck vad som passar dig</p>
          </>
        )}
      </div>
    </DashboardWidget>
  )
}

// MEDIUM - Visa flera rekommendationer
function InterestWidgetMedium({ hasResult, topRecommendations = [], completedAt, loading, error, onRetry }: InterestWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (!hasResult) return 'empty'
    return 'complete'
  }

  const status = getStatus()

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
      primaryAction={{
        label: hasResult ? 'Utforska resultat' : 'Starta testet',
      }}
    >
      <div className="space-y-3">
        {/* Status */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
            {hasResult ? (
              <Award size={24} className="text-teal-600" />
            ) : (
              <Target size={24} className="text-teal-600" />
            )}
          </div>
          <div>
            {hasResult ? (
              <>
                <p className="font-semibold text-slate-800">Test genomfört!</p>
                <p className="text-sm text-slate-500">
                  {topRecommendations.length} yrken matchar dig
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-slate-800">Nyfiken på vad som passar dig?</p>
                <p className="text-sm text-slate-500">Testet tar bara några minuter</p>
              </>
            )}
          </div>
        </div>

        {/* Top recommendations */}
        {hasResult && topRecommendations.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-slate-400">Dina topp-matchningar:</p>
            <div className="space-y-1.5">
              {topRecommendations.slice(0, 3).map((occupation, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 p-2 bg-teal-50/50 rounded-lg"
                >
                  <span className="text-xs font-bold text-teal-600 w-5">#{index + 1}</span>
                  <span className="text-sm text-slate-700">{occupation}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!hasResult && (
          <div className="p-3 bg-teal-50 rounded-lg">
            <p className="text-sm text-teal-700">
              Intresseguiden hjälper dig hitta yrken som matchar din personlighet
            </p>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// LARGE - Fullständig analys
function InterestWidgetLarge({ hasResult, topRecommendations = [], completedAt, loading, error, onRetry }: InterestWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (!hasResult) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  return (
    <DashboardWidget
      title="Dina intressen"
      icon={<Compass size={24} />}
      to="/interest-guide"
      color="teal"
      status={status}
      progress={hasResult ? 100 : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: hasResult ? 'Se fullständigt resultat' : 'Starta testet',
      }}
      secondaryAction={hasResult ? {
        label: 'Gör om testet',
        onClick: () => {},
      } : undefined}
    >
      <div className="space-y-4">
        {hasResult ? (
          <>
            {/* Header med resultat */}
            <div className="flex items-center gap-4 p-4 bg-teal-50 rounded-xl">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Award size={32} className="text-teal-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-800">Ditt intressetest är klart!</p>
                <p className="text-sm text-slate-500">
                  {topRecommendations.length} yrken matchar din profil
                </p>
                {completedAt && (
                  <p className="text-xs text-slate-400 mt-1">
                    Genomfört {new Date(completedAt).toLocaleDateString('sv-SE')}
                  </p>
                )}
              </div>
            </div>

            {/* Alla rekommendationer */}
            <div className="grid grid-cols-2 gap-3">
              {topRecommendations.map((occupation, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-teal-50/50 transition-colors cursor-pointer group"
                >
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
                    ${index === 0 ? 'bg-amber-100 text-amber-600' : ''}
                    ${index === 1 ? 'bg-slate-200 text-slate-600' : ''}
                    ${index === 2 ? 'bg-orange-100 text-orange-600' : ''}
                    ${index > 2 ? 'bg-slate-100 text-slate-500' : ''}
                  `}>
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-teal-700">
                    {occupation}
                  </span>
                  <ArrowRight size={14} className="ml-auto text-slate-300 group-hover:text-teal-500" />
                </div>
              ))}
            </div>

            {/* Info */}
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
              <Lightbulb size={18} className="text-amber-500 mt-0.5" />
              <p className="text-sm text-slate-600">
                Dessa yrken matchar dina intressen och personlighetsdrag. 
                Utforska varje yrke för att lära dig mer om löneläge, utbildningsvägar och arbetsuppgifter.
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Empty state för stor widget */}
            <div className="p-6 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border border-teal-100">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Compass size={32} className="text-teal-600" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-semibold text-teal-900 mb-2">Upptäck dina styrkor</p>
                  <p className="text-sm text-teal-700 mb-4">
                    Intresseguiden är ett snabbt test som hjälper dig förstå vilka yrken 
                    som passar din personlighet och dina intressen. Testet tar bara 5 minuter 
                    och ger dig personliga rekommendationer.
                  </p>
                  <div className="flex items-center gap-4 text-sm text-teal-600">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={14} />
                      5 minuter
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={14} />
                      20 frågor
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={14} />
                      Personliga resultat
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl text-center">
                <Target size={20} className="text-teal-500 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-700">Få personliga matchningar</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-center">
                <Star size={20} className="text-teal-500 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-700">Utforska yrkesvägar</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-center">
                <Lightbulb size={20} className="text-teal-500 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-700">Förstå dina styrkor</p>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardWidget>
  )
}

// Huvudkomponent
export const InterestWidget = memo(function InterestWidget(props: InterestWidgetProps) {
  const { size = 'small', ...rest } = props

  switch (size) {
    case 'large':
      return <InterestWidgetLarge {...rest} />
    case 'medium':
      return <InterestWidgetMedium {...rest} />
    case 'small':
    default:
      return <InterestWidgetSmall {...rest} />
  }
})
