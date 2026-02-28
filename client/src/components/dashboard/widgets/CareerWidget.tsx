import { memo } from 'react'
import { Route, Building2, TrendingUp, Lightbulb, Target, Compass, GraduationCap } from 'lucide-react'
import { DashboardWidget } from '../DashboardWidget'
import type { WidgetStatus } from '@/types/dashboard'
import type { WidgetSize } from '../WidgetSizeSelector'

interface CareerWidgetProps {
  exploredCount?: number
  savedPaths?: { id: string; title: string; progress: number }[]
  recommendedOccupations?: string[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  size?: WidgetSize
}

export const CareerWidget = memo(function CareerWidget({
  exploredCount = 0,
  savedPaths = [],
  recommendedOccupations = [],
  loading,
  error,
  onRetry,
  size,
}: CareerWidgetProps) {
  // TODO: Implement different layouts based on size
  const getStatus = (): WidgetStatus => {
    if (exploredCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  return (
    <DashboardWidget
      title="Karriärvägar"
      icon={<Route size={22} />}
      to="/career"
      color="indigo"
      status={status}
      progress={exploredCount > 0 ? Math.min(100, exploredCount * 20) : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
      stats={[
        { label: 'Utforskade yrken', value: exploredCount },
        ...(savedPaths.length > 0 ? [{ label: 'Sparade vägar', value: savedPaths.length }] : []),
      ]}
      primaryAction={{
        label: exploredCount > 0 ? 'Utforska fler' : 'Hitta din väg',
      }}
    >
      <div className="mt-3 space-y-3">
        {/* Stort nummer med ikon */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center">
            <Compass size={28} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-800">{exploredCount}</p>
            <p className="text-sm text-slate-500">
              {exploredCount === 0 ? 'Inga yrken utforskade' : exploredCount === 1 ? 'yrke utforskat' : 'yrken utforskade'}
            </p>
          </div>
        </div>
        
        {/* Visa sparade karriärvägar */}
        {savedPaths.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-medium">Dina sparade vägar:</p>
            <div className="space-y-2">
              {savedPaths.slice(0, 2).map((path) => (
                <div 
                  key={path.id}
                  className="p-3 bg-indigo-50 rounded-xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target size={14} className="text-indigo-500" />
                      <span className="text-sm font-medium text-slate-700">{path.title}</span>
                    </div>
                    <span className="text-xs font-medium text-indigo-600">{path.progress}%</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-2">
                    <div 
                      className="bg-indigo-500 h-2 rounded-full transition-all"
                      style={{ width: `${path.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Visa rekommendationer */}
        {recommendedOccupations.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Lightbulb size={12} className="text-amber-500" />
              Rekommenderade yrken för dig:
            </p>
            <div className="flex flex-wrap gap-2">
              {recommendedOccupations.slice(0, 3).map((occupation, index) => (
                <span 
                  key={index}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs rounded-lg font-medium"
                >
                  {occupation}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Tom state */}
        {exploredCount === 0 && recommendedOccupations.length === 0 && (
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
            <div className="flex items-start gap-3">
              <GraduationCap size={20} className="text-indigo-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-indigo-900">Upptäck yrkesmöjligheter</p>
                <p className="text-xs text-indigo-700 mt-1">
                  Utforska olika yrken, se vad de kräver och hur mycket du kan tjäna. 
                  Hitta vägen till ditt drömjobb.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Tips för aktiva användare */}
        {exploredCount > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <TrendingUp size={14} className="text-emerald-500" />
            <span>Utforska fler yrken för att hitta din perfekta match</span>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
})
