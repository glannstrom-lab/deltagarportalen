import { memo } from 'react'
import { 
  Route, 
  Building2, 
  TrendingUp, 
  Lightbulb, 
  Target, 
  Compass, 
  GraduationCap, 
  ArrowRight,
  Briefcase,
  Wallet,
  Award,
  Sparkles,
  MapPin,
  ChevronRight,
  Star,
  Zap
} from 'lucide-react'
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

// Mock-data för löneindikationer och utbildningsinfo (kan ersättas med riktig data)
const occupationDetails: Record<string, { salary: string; education: string; demand: 'high' | 'medium' | 'low' }> = {
  'Mjukvaruutvecklare': { salary: '45-65k kr/mån', education: 'Högskola/YH', demand: 'high' },
  'Sjuksköterska': { salary: '35-50k kr/mån', education: 'Universitet', demand: 'high' },
  'Lärare': { salary: '32-45k kr/mån', education: 'Universitet', demand: 'medium' },
  'Ekonom': { salary: '35-55k kr/mån', education: 'Högskola', demand: 'medium' },
  'Byggnadsingenjör': { salary: '38-52k kr/mån', education: 'Högskola/YH', demand: 'high' },
}

const getDemandColor = (demand: 'high' | 'medium' | 'low') => {
  switch (demand) {
    case 'high': return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200'
    case 'low': return 'text-slate-600 bg-slate-50 border-slate-200'
  }
}

const getDemandLabel = (demand: 'high' | 'medium' | 'low') => {
  switch (demand) {
    case 'high': return 'Hög efterfrågan'
    case 'medium': return 'Stabil efterfrågan'
    case 'low': return 'Låg efterfrågan'
  }
}

// SMALL - Modern counter med prominent rekommendation
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
      to="/dashboard/career"
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
        {/* Modern counter med gradient background */}
        <div className="relative mb-3">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl blur opacity-20" />
          <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center border border-indigo-100">
            <Briefcase size={28} className="text-indigo-600" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-[10px] font-bold text-white">{exploredCount}</span>
            </div>
          </div>
        </div>
        
        <p className="text-sm font-medium text-slate-700">
          {exploredCount === 0 ? 'Inga yrken utforskade' : exploredCount === 1 ? '1 yrke' : `${exploredCount} yrken`}
        </p>
        
        {firstRecommendation && (
          <div className="mt-3 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200/50">
            <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide mb-0.5">Rekommenderas</p>
            <p className="text-xs font-medium text-slate-700 line-clamp-1">{firstRecommendation}</p>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// MEDIUM - Snyggare sparade vägar med progress bars, rekommendationer som taggar
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
      to="/dashboard/career"
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
        {/* Modern stats header */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl blur opacity-20" />
            <div className="relative w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
              <Briefcase size={22} className="text-indigo-600" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{exploredCount}</p>
            <p className="text-xs text-slate-500">utforskade yrken</p>
          </div>
        </div>

        {/* Sparade vägar med moderna progress bars */}
        {savedPaths.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Target size={12} className="text-indigo-500" />
              Dina sparade vägar
            </p>
            <div className="space-y-2">
              {savedPaths.slice(0, 2).map((path) => (
                <div 
                  key={path.id}
                  className="group p-2.5 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <MapPin size={12} className="text-indigo-600" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-700 transition-colors">{path.title}</span>
                    </div>
                    <span className="text-xs font-bold text-indigo-600">{path.progress}%</span>
                  </div>
                  {/* Animated progress bar */}
                  <div className="relative w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${path.progress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rekommendationer som moderna taggar */}
        {recommendedOccupations.length > 0 && !savedPaths.length && (
          <div>
            <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 mb-2">
              <Sparkles size={12} className="text-amber-500" />
              Rekommenderas för dig
            </p>
            <div className="flex flex-wrap gap-1.5">
              {recommendedOccupations.slice(0, 3).map((occ, i) => (
                <span 
                  key={i} 
                  className="px-2.5 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 text-xs font-medium rounded-lg border border-indigo-100 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer"
                >
                  {occ}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Modern empty state */}
        {exploredCount === 0 && recommendedOccupations.length === 0 && (
          <div className="p-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-50 rounded-xl border border-indigo-100/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Compass size={20} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-indigo-900">Upptäck yrkesmöjligheter</p>
                <p className="text-xs text-indigo-600 mt-0.5">Utforska yrken och hitta din väg</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// LARGE - Fullständig professionell karriärplanering
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
      to="/dashboard/career"
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
      <div className="space-y-5">
        {/* Header med stats - modern design */}
        <div className="grid grid-cols-2 gap-4">
          <div className="relative overflow-hidden p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Briefcase size={28} className="text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{exploredCount}</p>
                <p className="text-sm text-indigo-100">utforskade yrken</p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden p-4 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
                <Target size={28} className="text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{savedPaths.length}</p>
                <p className="text-sm text-slate-300">sparade vägar</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sparade vägar med milestones */}
        {savedPaths.length > 0 && (
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
            <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <MapPin size={16} className="text-indigo-500" />
              Dina sparade karriärvägar
            </p>
            <div className="grid grid-cols-2 gap-3">
              {savedPaths.slice(0, 4).map((path) => (
                <div 
                  key={path.id}
                  className="group p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
                >
                  {/* Progress indicator top */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                      style={{ width: `${path.progress}%` }}
                    />
                  </div>
                  
                  <div className="flex items-start gap-3 pt-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Target size={18} className="text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors truncate">{path.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{path.progress}% slutfört</p>
                    </div>
                  </div>
                  
                  {/* Milestone dots */}
                  <div className="flex items-center gap-1 mt-3">
                    {[0, 25, 50, 75, 100].map((milestone, idx) => (
                      <div 
                        key={idx}
                        className={`h-1.5 flex-1 rounded-full transition-all ${
                          path.progress >= milestone 
                            ? 'bg-gradient-to-r from-indigo-400 to-purple-400' 
                            : 'bg-slate-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rekommendationer som klickbara kort med löneindikationer */}
        {recommendedOccupations.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                Rekommenderade yrken för dig
              </p>
              <span className="text-xs text-slate-400">Klicka för att utforska</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {recommendedOccupations.slice(0, 4).map((occupation, index) => {
                const details = occupationDetails[occupation] || { 
                  salary: '35-55k kr/mån', 
                  education: 'Varierar', 
                  demand: 'medium' as const 
                }
                return (
                  <button
                    key={index}
                    className="group p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all text-left relative overflow-hidden"
                  >
                    {/* Hover gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors line-clamp-1 flex-1">
                          {occupation}
                        </h4>
                        <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-1" />
                      </div>
                      
                      {/* Löneindikation och utbildning */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-medium rounded-md border border-emerald-100">
                          <Wallet size={10} />
                          {details.salary}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-medium rounded-md border border-indigo-100">
                          <GraduationCap size={10} />
                          {details.education}
                        </span>
                      </div>
                      
                      {/* Efterfrågan badge */}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-md border ${getDemandColor(details.demand)}`}>
                        <TrendingUp size={10} />
                        {getDemandLabel(details.demand)}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Utforska mer sektion */}
        {exploredCount > 0 && (
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Compass size={20} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-indigo-900">Fortsätt utforska</p>
                  <p className="text-xs text-indigo-600">Hitta fler yrken som matchar dina intressen</p>
                </div>
              </div>
              <button className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm hover:shadow">
                Utforska
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Inspirerande empty state för nya användare */}
        {exploredCount === 0 && recommendedOccupations.length === 0 && (
          <div className="relative overflow-hidden p-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-50 rounded-2xl border border-indigo-100">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-200/20 to-indigo-200/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative">
              <div className="flex items-start gap-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl blur opacity-30" />
                  <div className="relative w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                    <GraduationCap size={40} className="text-indigo-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent mb-2">
                    Börja din karriärresa idag
                  </h3>
                  <p className="text-sm text-slate-600 mb-5 leading-relaxed">
                    Upptäck yrken som passar just dig. Utforska lönelägen, utbildningsvägar och framtidutsikter. 
                    Spara intressanta karriärvägar och följ din utveckling.
                  </p>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="group p-4 bg-white rounded-xl border border-indigo-100 hover:border-indigo-300 hover:shadow-lg transition-all text-center cursor-pointer">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Building2 size={24} className="text-indigo-600" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700">Utforska yrken</p>
                      <p className="text-[10px] text-slate-500 mt-1">Se 100+ yrken</p>
                    </div>
                    <div className="group p-4 bg-white rounded-xl border border-indigo-100 hover:border-indigo-300 hover:shadow-lg transition-all text-center cursor-pointer">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Wallet size={24} className="text-emerald-600" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700">Se löneläge</p>
                      <p className="text-[10px] text-slate-500 mt-1">Jämför löner</p>
                    </div>
                    <div className="group p-4 bg-white rounded-xl border border-indigo-100 hover:border-indigo-300 hover:shadow-lg transition-all text-center cursor-pointer">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Target size={24} className="text-purple-600" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700">Spara vägar</p>
                      <p className="text-[10px] text-slate-500 mt-1">Bygg din plan</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tips för aktiva användare */}
        {exploredCount > 0 && (
          <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap size={16} className="text-emerald-600" />
            </div>
            <p className="text-sm text-emerald-800">
              <span className="font-semibold">Bra jobbat!</span> Utforska fler yrken för att få ännu bättre rekommendationer.
            </p>
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
