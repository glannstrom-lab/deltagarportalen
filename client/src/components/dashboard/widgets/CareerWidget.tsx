import { memo } from 'react'
import { Route, Building2, TrendingUp, Lightbulb } from 'lucide-react'
import { DashboardWidget } from '../DashboardWidget'
import type { WidgetStatus } from '@/types/dashboard'

interface CareerWidgetProps {
  exploredCount?: number
  savedPaths?: { id: string; title: string; progress: number }[]
  recommendedOccupations?: string[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

export const CareerWidget = memo(function CareerWidget({
  exploredCount = 0,
  savedPaths = [],
  recommendedOccupations = [],
  loading,
  error,
  onRetry,
}: CareerWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (exploredCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  return (
    <DashboardWidget
      title="Karriärvägar"
      icon={<Route size={20} />}
      to="/career"
      color="indigo"
      status={status}
      progress={exploredCount > 0 ? Math.min(100, exploredCount * 20) : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
      stats={[
        { label: 'Utforskade yrken', value: exploredCount },
      ]}
      primaryAction={{
        label: exploredCount > 0 ? 'Utforska fler' : 'Hitta din väg',
      }}
    >
      {/* Visa sparade karriärvägar om det finns */}
      {savedPaths.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-slate-500 mb-2">Sparade vägar:</p>
          <div className="space-y-2">
            {savedPaths.slice(0, 2).map((path) => (
              <div 
                key={path.id}
                className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg"
              >
                <TrendingUp size={14} className="text-indigo-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {path.title}
                  </p>
                  <div className="w-full bg-indigo-100 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-indigo-500 h-1.5 rounded-full"
                      style={{ width: `${path.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Visa rekommendationer om det finns */}
      {recommendedOccupations.length > 0 && exploredCount === 0 && (
        <div className="mt-2">
          <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
            <Lightbulb size={12} className="text-amber-500" />
            Förslag för dig:
          </p>
          <div className="flex flex-wrap gap-2">
            {recommendedOccupations.slice(0, 3).map((occupation, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md"
              >
                {occupation}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Tom state */}
      {exploredCount === 0 && recommendedOccupations.length === 0 && (
        <div className="mt-2 p-3 bg-indigo-50 rounded-lg">
          <p className="text-sm text-indigo-700">
            Upptäck olika yrken och karriärvägar. 
            Se vad som krävs och hur du kan komma dit.
          </p>
        </div>
      )}
    </DashboardWidget>
  )
})
