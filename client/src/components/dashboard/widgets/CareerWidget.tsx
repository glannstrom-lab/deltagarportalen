import { memo } from 'react'
import { Route, Briefcase, Target, Sparkles, Users, Accessibility, Building2, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DashboardWidget } from '../DashboardWidget'
import type { WidgetStatus } from '@/types/dashboard'
import type { WidgetSize } from '../WidgetSizeSelector'

interface CareerWidgetProps {
  exploredCount?: number
  savedPaths?: { id: string; title: string; progress: number }[]
  recommendedOccupations?: { name: string; matchPercentage?: number }[]
  riasecProfile?: {
    dominant: string
    secondary: string
    scores: Record<string, number>
  } | null
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  size?: WidgetSize
}

// SMALL - Ultra kompakt
function CareerWidgetSmall({ 
  exploredCount = 0, 
  recommendedOccupations = [], 
  loading, 
  error, 
  onRetry 
}: Omit<CareerWidgetProps, 'size' | 'savedPaths' | 'riasecProfile'>) {
  const getStatus = (): WidgetStatus => {
    if (exploredCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()
  const firstRecommendation = recommendedOccupations[0]

  return (
    <DashboardWidget
      title="Karriär"
      icon={<Route size={14} />}
      to="/career"
      color="indigo"
      status={status}
      progress={exploredCount > 0 ? Math.min(100, exploredCount * 20) : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
    >
      <div className="flex items-center gap-2">
        <Briefcase size={14} className="text-indigo-500" />
        <div className="flex items-center gap-1">
          <span className="text-lg font-bold text-slate-800">{exploredCount}</span>
          <span className="text-[10px] text-slate-500">
            {exploredCount === 0 ? 'yrken' : exploredCount === 1 ? 'yrke' : 'yrken'}
          </span>
        </div>
        {firstRecommendation && (
          <span className="text-[9px] bg-amber-100 text-amber-600 px-1 py-0.5 rounded truncate max-w-[80px]">
            {firstRecommendation}
          </span>
        )}
      </div>
    </DashboardWidget>
  )
}

// MEDIUM - Balanserad överblick
function CareerWidgetMedium({ 
  exploredCount = 0, 
  savedPaths = [], 
  recommendedOccupations = [], 
  riasecProfile,
  loading, 
  error, 
  onRetry 
}: CareerWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (exploredCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()

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
        label: exploredCount > 0 ? 'Utforska' : 'Hitta väg',
      }}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Briefcase size={22} className="text-indigo-500" />
          <div>
            <p className="text-2xl font-bold text-slate-800">{exploredCount}</p>
            <p className="text-xs text-slate-500">utforskade yrken</p>
          </div>
        </div>

        {recommendedOccupations.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {recommendedOccupations.slice(0, 3).map((occ, i) => (
              <span 
                key={i} 
                className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-md border border-indigo-100"
              >
                {occ.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// LARGE - Fullständig överblick med nya tabs
function CareerWidgetLarge({ 
  exploredCount = 0, 
  savedPaths = [], 
  recommendedOccupations = [], 
  riasecProfile,
  loading, 
  error, 
  onRetry 
}: CareerWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (exploredCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  // Nya career tabs som snabblänkar
  const careerTabs = [
    { id: 'network', label: 'Nätverk', icon: Users, path: '/career/network', color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
    { id: 'adaptation', label: 'Anpassning', icon: Accessibility, path: '/career/adaptation', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'companies', label: 'Företag', icon: Building2, path: '/career/companies', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  ]

  return (
    <DashboardWidget
      title="Karriär"
      icon={<Route size={22} />}
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
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Briefcase size={28} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-800">{exploredCount}</p>
            <p className="text-sm text-slate-500">utforskade yrken</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-bold text-slate-800">{savedPaths.length}</p>
            <p className="text-sm text-slate-500">sparade vägar</p>
          </div>
        </div>

        {recommendedOccupations.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Sparkles size={14} className="text-amber-500" />
              Rekommenderas för dig
            </p>
            <div className="flex flex-wrap gap-2">
              {recommendedOccupations.slice(0, 4).map((occ, i) => (
                <span 
                  key={i} 
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm rounded-lg border border-indigo-100"
                >
                  {occ.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Snabblänkar till nya career tabs */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Karriärverktyg:</p>
          <div className="grid grid-cols-3 gap-2">
            {careerTabs.map((tab) => (
              <Link
                key={tab.id}
                to={tab.path}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all hover:shadow-sm ${tab.color}`}
              >
                <tab.icon size={18} />
                <span className="text-xs font-medium">{tab.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {exploredCount === 0 && (
          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <div className="flex items-center gap-3">
              <Target size={24} className="text-indigo-500" />
              <div>
                <p className="font-semibold text-indigo-900">Upptäck yrkesmöjligheter</p>
                <p className="text-sm text-indigo-600">Utforska yrken och hitta din väg</p>
              </div>
            </div>
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
