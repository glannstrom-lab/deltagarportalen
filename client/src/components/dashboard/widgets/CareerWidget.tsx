import { memo } from 'react'
import { Route, Building2, TrendingUp, Lightbulb, Target, Compass, GraduationCap, ArrowRight } from 'lucide-react'
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

// SMALL - Antal utforskade + rekommendation
function CareerWidgetSmall({ exploredCount = 0, recommendedOccupations = [], loading, error, onRetry }: Omit<CareerWidgetProps, 'size' | 'savedPaths'>) {
  const getStatus = (): WidgetStatus => {
    if (exploredCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()
  const firstRecommendation = recommendedOccupations[0]

  return (
    <DashboardWidget
      title="Karriär"
      icon={<Route size={20} />}
      to="/career"
      color="indigo"
      status={status}
      progress={exploredCount > 0 ? Math.min(100, exploredCount * 20) : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: exploredCount > 0 ? 'Utforska mer' : 'Hitta väg',
      }}
    >
      <div className="flex flex-col items-center justify-center py-2 text-center">
        <Compass size={28} className="text-indigo-500 mb-2" />
        <p className="text-3xl font-bold text-slate-800">{exploredCount}</p>
        <p className="text-sm text-slate-500">
          {exploredCount === 0 ? 'Inga yrken utforskade' : exploredCount === 1 ? 'yrke' : 'yrken'}
        </p>
        
        {firstRecommendation && (
          <p className="mt-2 text-xs text-indigo-600 line-clamp-1">{firstRecommendation}</p>
        )}
      </div>
    </DashboardWidget>
  )
}

// MEDIUM - Utforskade + sparade vägar
function CareerWidgetMedium({ exploredCount = 0, savedPaths = [], recommendedOccupations = [], loading, error, onRetry }: CareerWidgetProps) {
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
      primaryAction={{
        label: exploredCount > 0 ? 'Utforska fler' : 'Hitta din väg',
      }}
    >
      <div className="space-y-3">
        {/* Stats */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Compass size={24} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{exploredCount}</p>
            <p className="text-xs text-slate-500">utforskade yrken</p>
          </div>
        </div>

        {/* Sparade vägar */}
        {savedPaths.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400">Dina sparade vägar:</p>
            <div className="space-y-1.5">
              {savedPaths.slice(0, 2).map((path) => (
                <div 
                  key={path.id}
                  className="p-2 bg-indigo-50/50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{path.title}</span>
                    <span className="text-xs text-indigo-600">{path.progress}%</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-1.5">
                    <div 
                      className="bg-indigo-400 h-1.5 rounded-full"
                      style={{ width: `${path.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rekommendationer */}
        {recommendedOccupations.length > 0 && !savedPaths.length && (
          <div>
            <p className="text-xs text-slate-400 mb-1.5">Rekommenderas:</p>
            <div className="flex flex-wrap gap-1">
              {recommendedOccupations.slice(0, 3).map((occ, i) => (
                <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                  {occ}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {exploredCount === 0 && recommendedOccupations.length === 0 && (
          <div className="p-3 bg-indigo-50 rounded-lg">
            <p className="text-sm text-indigo-700">Upptäck yrkesmöjligheter</p>
            <p className="text-xs text-indigo-600 mt-1">Utforska olika yrken och hitta din väg</p>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// LARGE - Full analys med yrken och vägar
function CareerWidgetLarge({ exploredCount = 0, savedPaths = [], recommendedOccupations = [], loading, error, onRetry }: CareerWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (exploredCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  return (
    <DashboardWidget
      title="Karriärvägar"
      icon={<Route size={24} />}
      to="/career"
      color="indigo"
      status={status}
      progress={exploredCount > 0 ? Math.min(100, exploredCount * 20) : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: 'Utforska yrken',
      }}
      secondaryAction={savedPaths.length > 0 ? {
        label: 'Mina sparade',
        onClick: () => {},
      } : undefined}
    >
      <div className="space-y-4">
        {/* Header med stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-xl">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Compass size={28} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-indigo-700">{exploredCount}</p>
              <p className="text-sm text-indigo-600">utforskade yrken</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Target size={28} className="text-slate-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-700">{savedPaths.length}</p>
              <p className="text-sm text-slate-600">sparade vägar</p>
            </div>
          </div>
        </div>

        {/* Sparade vägar med progress */}
        {savedPaths.length > 0 && (
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-sm font-medium text-slate-700 mb-3">Dina sparade karriärvägar:</p>
            <div className="grid grid-cols-2 gap-3">
              {savedPaths.slice(0, 4).map((path) => (
                <div 
                  key={path.id}
                  className="p-3 bg-white rounded-xl hover:shadow-sm transition-shadow cursor-pointer group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={16} className="text-indigo-500" />
                    <span className="text-sm font-medium text-slate-800">{path.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div 
                        className="bg-indigo-500 h-2 rounded-full transition-all"
                        style={{ width: `${path.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-indigo-600">{path.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rekommendationer */}
        {recommendedOccupations.length > 0 && (
          <div className="p-4 bg-indigo-50/50 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={18} className="text-amber-500" />
              <p className="text-sm font-medium text-slate-700">Rekommenderade yrken för dig:</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {recommendedOccupations.map((occupation, index) => (
                <button
                  key={index}
                  className="px-4 py-2 bg-white text-slate-700 text-sm rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors"
                >
                  {occupation}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {exploredCount === 0 && recommendedOccupations.length === 0 && (
          <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <GraduationCap size={32} className="text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-indigo-900 mb-2">Upptäck yrkesmöjligheter</p>
                <p className="text-sm text-indigo-700 mb-4">
                  Utforska olika yrken, se vad de kräver och hur mycket du kan tjäna. 
                  Hitta vägen till ditt drömjobb genom att kartlägga dina intressen.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-white rounded-xl text-center">
                    <Building2 size={20} className="text-indigo-500 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-700">Utforska yrken</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl text-center">
                    <TrendingUp size={20} className="text-indigo-500 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-700">Se löneläge</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl text-center">
                    <Target size={20} className="text-indigo-500 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-700">Spara vägar</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        {exploredCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <TrendingUp size={16} className="text-emerald-500" />
            <span>Utforska fler yrken för att hitta din perfekta match</span>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// Huvudkomponent
export const CareerWidget = memo(function CareerWidget(props: CareerWidgetProps) {
  const { size = 'small', ...rest } = props

  switch (size) {
    case 'large':
      return <CareerWidgetLarge {...rest} />
    case 'medium':
      return <CareerWidgetMedium {...rest} />
    case 'small':
    default:
      return <CareerWidgetSmall {...rest} />
  }
})
