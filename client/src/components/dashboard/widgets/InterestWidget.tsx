import { memo } from 'react'
import { 
  Compass, 
  Sparkles, 
  CheckCircle2, 
  Lightbulb, 
  Target, 
  Award, 
  Star, 
  ArrowRight,
  Crown,
  Medal,
  Zap,
  TrendingUp,
  Heart,
  Gem,
  Trophy,
  Flame
} from 'lucide-react'
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

// Rank colors and styles
const rankStyles = {
  0: { 
    bg: 'bg-gradient-to-br from-amber-400 to-yellow-500', 
    text: 'text-white',
    icon: Crown,
    label: 'Bästa matchning!',
    color: 'text-amber-500',
    border: 'border-amber-200',
    glow: 'shadow-amber-200'
  },
  1: { 
    bg: 'bg-gradient-to-br from-slate-300 to-slate-400', 
    text: 'text-white',
    icon: Medal,
    label: 'Supermatch!',
    color: 'text-slate-500',
    border: 'border-slate-200',
    glow: 'shadow-slate-200'
  },
  2: { 
    bg: 'bg-gradient-to-br from-orange-400 to-amber-600', 
    text: 'text-white',
    icon: Award,
    label: 'Mycket bra match!',
    color: 'text-orange-500',
    border: 'border-orange-200',
    glow: 'shadow-orange-200'
  },
}

const getRankStyle = (index: number) => {
  return rankStyles[index as keyof typeof rankStyles] || {
    bg: 'bg-gradient-to-br from-teal-500 to-cyan-500',
    text: 'text-white',
    icon: Star,
    label: 'Bra match',
    color: 'text-teal-500',
    border: 'border-teal-200',
    glow: 'shadow-teal-200'
  }
}

// Match percentage based on rank
const getMatchPercentage = (index: number) => {
  if (index === 0) return 98
  if (index === 1) return 94
  if (index === 2) return 89
  return Math.max(85 - (index - 2) * 3, 60)
}

// Star rating based on rank
const getStarRating = (index: number) => {
  if (index === 0) return 5
  if (index === 1) return 5
  if (index === 2) return 4
  return Math.max(4 - Math.floor((index - 2) / 2), 2)
}

// SMALL - Inspiring with stars/compass animation feel
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
      icon={<Compass size={20} className="text-teal-500" />}
      to="/dashboard/interest-guide"
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
      <div className="flex flex-col items-center justify-center py-3 text-center">
        {hasResult ? (
          <>
            {/* Animated star burst effect */}
            <div className="relative mb-3">
              <div className="absolute inset-0 animate-pulse">
                <Sparkles size={32} className="text-amber-400 opacity-50" />
              </div>
              <div className="relative w-14 h-14 bg-gradient-to-br from-amber-100 to-yellow-50 rounded-full flex items-center justify-center shadow-lg shadow-amber-200/50">
                <Crown size={24} className="text-amber-500" />
              </div>
              {/* Floating stars */}
              <Star size={10} className="absolute -top-1 -right-1 text-amber-400 animate-pulse" />
              <Star size={8} className="absolute -bottom-1 -left-1 text-teal-400 animate-pulse delay-150" />
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
              <Sparkles size={14} className="text-amber-500" />
              <span className="text-sm font-bold">Test klart!</span>
            </div>
            {firstRecommendation && (
              <div className="space-y-1">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Din topp-match</p>
                <p className="text-sm font-semibold text-slate-700 line-clamp-1 bg-gradient-to-r from-amber-50 to-transparent px-2 py-0.5 rounded-full">
                  {firstRecommendation}
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Inspiring empty state with animated compass */}
            <div className="relative mb-3">
              <div className="absolute inset-0 bg-teal-400/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-teal-100 to-cyan-50 rounded-full flex items-center justify-center shadow-lg shadow-teal-200/50 group-hover:scale-105 transition-transform">
                <Compass size={28} className="text-teal-600" />
              </div>
              {/* Orbiting sparkles */}
              <Sparkles size={12} className="absolute -top-0.5 right-0 text-teal-400 animate-pulse" />
              <Sparkles size={10} className="absolute bottom-0 -left-1 text-cyan-400 animate-pulse delay-300" />
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-1">Upptäck din framtid!</p>
            <p className="text-xs text-slate-500">5 minuter • 20 frågor • Personliga resultat</p>
          </>
        )}
      </div>
    </DashboardWidget>
  )
}

// MEDIUM - Top 3 feel with gold/silver/bronze medals
function InterestWidgetMedium({ hasResult, topRecommendations = [], completedAt, loading, error, onRetry }: InterestWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (!hasResult) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  return (
    <DashboardWidget
      title="Dina intressen"
      icon={<Compass size={22} className="text-teal-500" />}
      to="/dashboard/interest-guide"
      color="teal"
      status={status}
      progress={hasResult ? 100 : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: hasResult ? 'Utforska dina matcher' : 'Starta testet',
      }}
    >
      <div className="space-y-4">
        {/* Status Header */}
        <div className="flex items-center gap-4">
          <div className={`
            w-14 h-14 rounded-xl flex items-center justify-center shadow-lg
            ${hasResult 
              ? 'bg-gradient-to-br from-amber-100 to-yellow-50 shadow-amber-200/50' 
              : 'bg-gradient-to-br from-teal-100 to-cyan-50 shadow-teal-200/50'
            }
          `}>
            {hasResult ? (
              <Trophy size={26} className="text-amber-500" />
            ) : (
              <Target size={26} className="text-teal-600" />
            )}
          </div>
          <div>
            {hasResult ? (
              <>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-800">Dina topp-matchningar!</p>
                  <Sparkles size={16} className="text-amber-500" />
                </div>
                <p className="text-sm text-slate-500">
                  {topRecommendations.length} yrken passar dig perfekt
                </p>
              </>
            ) : (
              <>
                <p className="font-bold text-slate-800">Nyfiken på din framtid?</p>
                <p className="text-sm text-slate-500">Testet tar bara 5 minuter</p>
              </>
            )}
          </div>
        </div>

        {/* Top 3 Recommendations with Medals */}
        {hasResult && topRecommendations.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Award size={12} />
              Topp 3 för dig
            </p>
            <div className="space-y-2">
              {topRecommendations.slice(0, 3).map((occupation, index) => {
                const style = getRankStyle(index)
                const RankIcon = style.icon
                return (
                  <div 
                    key={index}
                    className={`
                      flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200
                      hover:shadow-md hover:scale-[1.02] cursor-pointer group
                      ${index === 0 
                        ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200' 
                        : index === 1
                        ? 'bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200'
                        : index === 2
                        ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200'
                        : 'bg-teal-50/50 border-teal-100'
                      }
                    `}
                  >
                    {/* Medal/Rank */}
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center shadow-sm
                      ${style.bg}
                    `}>
                      <RankIcon size={16} className={style.text} />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate group-hover:text-teal-700 transition-colors">
                        {occupation}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${style.color}`}>
                          {style.label}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-bold text-teal-600">
                          {getMatchPercentage(index)}% match
                        </span>
                      </div>
                    </div>
                    
                    {/* Arrow */}
                    <ArrowRight size={16} className="text-slate-300 group-hover:text-teal-500 transition-colors" />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state - More inviting */}
        {!hasResult && (
          <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border border-teal-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Sparkles size={20} className="text-teal-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-teal-900 mb-1">
                  Hitta ditt drömyrke
                </p>
                <p className="text-xs text-teal-700 leading-relaxed">
                  Vårt intressetest matchar din personlighet med yrken som passar just dig. 
                  Få personliga rekommendationer på bara 5 minuter!
                </p>
              </div>
            </div>
            
            {/* Quick benefits */}
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-teal-100">
              <span className="flex items-center gap-1 text-xs text-teal-600">
                <CheckCircle2 size={12} className="text-teal-500" />
                20 frågor
              </span>
              <span className="flex items-center gap-1 text-xs text-teal-600">
                <CheckCircle2 size={12} className="text-teal-500" />
                Omedelbara resultat
              </span>
              <span className="flex items-center gap-1 text-xs text-teal-600">
                <CheckCircle2 size={12} className="text-teal-500" />
                100% gratis
              </span>
            </div>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// LARGE - Beautiful "Your Results" view with trophies, grid, ratings
function InterestWidgetLarge({ hasResult, topRecommendations = [], completedAt, loading, error, onRetry }: InterestWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (!hasResult) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  return (
    <DashboardWidget
      title="Dina intressen"
      icon={<Compass size={24} className="text-teal-500" />}
      to="/dashboard/interest-guide"
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
      <div className="space-y-5">
        {hasResult ? (
          <>
            {/* Beautiful Header with Trophies */}
            <div className="relative overflow-hidden p-5 bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-600 rounded-2xl text-white shadow-lg shadow-teal-200">
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4" />
              
              <div className="relative flex items-center gap-5">
                <div className="relative">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner">
                    <Trophy size={40} className="text-yellow-300" />
                  </div>
                  {/* Sparkle decorations */}
                  <Sparkles size={16} className="absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
                  <Star size={12} className="absolute -bottom-1 -left-1 text-yellow-200 animate-pulse delay-150" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                      🎉 Grattis!
                    </span>
                    {completedAt && (
                      <span className="text-xs text-teal-100">
                        {new Date(completedAt).toLocaleDateString('sv-SE')}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold mb-1">Dina resultat är klara!</h3>
                  <p className="text-teal-100 text-sm">
                    Vi har hittat <span className="font-bold text-white">{topRecommendations.length} yrken</span> som passar dig perfekt
                  </p>
                </div>
              </div>
            </div>

            {/* Top Match Highlight */}
            {topRecommendations.length > 0 && (
              <div className="p-4 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 rounded-xl border-2 border-amber-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200">
                      <Crown size={32} className="text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
                      1
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-1">
                      Din bästa matchning!
                    </p>
                    <p className="text-lg font-bold text-slate-800 mb-1">
                      {topRecommendations[0]}
                    </p>
                    <div className="flex items-center gap-3">
                      {/* Star rating */}
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={14} 
                            className={i < getStarRating(0) ? "text-amber-400 fill-amber-400" : "text-slate-300"}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-bold text-amber-600">98% match</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">Perfekt för dig!</span>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
                    Utforska
                  </button>
                </div>
              </div>
            )}

            {/* Grid of Occupations with Rankings */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <Medal size={16} className="text-teal-500" />
                Alla dina matchningar
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {topRecommendations.map((occupation, index) => {
                  const style = getRankStyle(index)
                  const RankIcon = style.icon
                  const percentage = getMatchPercentage(index)
                  const stars = getStarRating(index)
                  
                  return (
                    <div 
                      key={index}
                      className={`
                        group relative p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer
                        hover:shadow-lg hover:scale-[1.02]
                        ${index === 0 
                          ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300 shadow-amber-100' 
                          : 'bg-white border-slate-200 hover:border-teal-300 hover:bg-teal-50/30'
                        }
                      `}
                    >
                      {/* Rank Badge */}
                      <div className="absolute -top-2 -left-2">
                        <div className={`
                          w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-md
                          ${style.bg} ${style.text}
                        `}>
                          {index < 3 ? <RankIcon size={14} /> : index + 1}
                        </div>
                      </div>
                      
                      <div className="pt-3">
                        {/* Occupation Name */}
                        <h5 className={`
                          font-bold text-slate-800 mb-2 line-clamp-1
                          ${index === 0 ? 'text-base' : 'text-sm'}
                        `}>
                          {occupation}
                        </h5>
                        
                        {/* Match Info */}
                        <div className="flex items-center justify-between">
                          {/* Stars */}
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                size={index === 0 ? 14 : 12} 
                                className={i < stars ? "text-amber-400 fill-amber-400" : "text-slate-200"}
                              />
                            ))}
                          </div>
                          
                          {/* Percentage */}
                          <span className={`
                            font-bold
                            ${index === 0 ? 'text-amber-600 text-sm' : 'text-teal-600 text-xs'}
                          `}>
                            {percentage}%
                          </span>
                        </div>
                        
                        {/* CTA */}
                        <div className={`
                          mt-2 pt-2 border-t flex items-center justify-between
                          ${index === 0 ? 'border-amber-200' : 'border-slate-100'}
                        `}>
                          <span className="text-xs text-slate-500">
                            {index === 0 ? '🏆 Bästa valet!' : index < 3 ? '⭐ Topplacering' : '✓ Bra match'}
                          </span>
                          <ArrowRight size={14} className="text-slate-300 group-hover:text-teal-500 transition-colors" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Info & Tips */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border border-teal-100">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center shrink-0">
                    <Lightbulb size={16} className="text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-teal-900 mb-0.5">Tips!</p>
                    <p className="text-xs text-teal-700 leading-relaxed">
                      Klicka på ett yrke för att se löneläge, utbildningsvägar och arbetsuppgifter.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-100">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                    <TrendingUp size={16} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-900 mb-0.5">Nästa steg</p>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Spara dina favorityrken och boka möte med en arbetskonsulent.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Empty State - Inspiring and Inviting */}
            <div className="relative overflow-hidden">
              {/* Hero Section */}
              <div className="relative p-6 bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-600 rounded-2xl text-white shadow-lg shadow-teal-200">
                {/* Background decorations */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/4" />
                  <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
                </div>
                
                <div className="relative text-center">
                  {/* Animated compass */}
                  <div className="relative inline-flex mb-4">
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse" />
                    <div className="relative w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner">
                      <Compass size={44} className="text-white" />
                    </div>
                    {/* Floating elements */}
                    <Sparkles size={20} className="absolute -top-2 -right-2 text-yellow-300 animate-pulse" />
                    <Star size={14} className="absolute -bottom-1 -left-2 text-cyan-200 animate-pulse delay-200" />
                    <Zap size={14} className="absolute top-1/2 -right-4 text-yellow-200 animate-pulse delay-300" />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2">Upptäck dina styrkor!</h3>
                  <p className="text-teal-100 text-sm max-w-md mx-auto leading-relaxed">
                    Vårt intressetest hjälper dig hitta yrken som matchar din personlighet, 
                    dina värderingar och dina intressen. Få personliga rekommendationer på bara 5 minuter!
                  </p>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 bg-gradient-to-br from-teal-50 to-white rounded-xl border border-teal-100 text-center group hover:shadow-md hover:border-teal-200 transition-all">
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Target size={24} className="text-teal-600" />
                </div>
                <p className="text-sm font-bold text-slate-700 mb-1">Personliga matchningar</p>
                <p className="text-xs text-slate-500">Baserat på din unika profil</p>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-amber-50 to-white rounded-xl border border-amber-100 text-center group hover:shadow-md hover:border-amber-200 transition-all">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Heart size={24} className="text-amber-600" />
                </div>
                <p className="text-sm font-bold text-slate-700 mb-1">20 snabba frågor</p>
                <p className="text-xs text-slate-500">Tar bara 5 minuter</p>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-cyan-50 to-white rounded-xl border border-cyan-100 text-center group hover:shadow-md hover:border-cyan-200 transition-all">
                <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Gem size={24} className="text-cyan-600" />
                </div>
                <p className="text-sm font-bold text-slate-700 mb-1">Omedelbara resultat</p>
                <p className="text-xs text-slate-500">Se dina matcher direkt</p>
              </div>
            </div>

            {/* How it works */}
            <div className="p-4 bg-slate-50 rounded-xl">
              <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Flame size={16} className="text-orange-500" />
                Så här fungerar det
              </h4>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="w-10 h-10 bg-teal-500 text-white rounded-full flex items-center justify-center font-bold text-sm mb-2 mx-auto shadow-md shadow-teal-200">1</div>
                  <p className="text-xs font-medium text-slate-600">Svara på frågor</p>
                </div>
                <div className="flex-1 h-0.5 bg-slate-200 mx-2" />
                <div className="text-center">
                  <div className="w-10 h-10 bg-teal-500 text-white rounded-full flex items-center justify-center font-bold text-sm mb-2 mx-auto shadow-md shadow-teal-200">2</div>
                  <p className="text-xs font-medium text-slate-600">Vi analyserar</p>
                </div>
                <div className="flex-1 h-0.5 bg-slate-200 mx-2" />
                <div className="text-center">
                  <div className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-sm mb-2 mx-auto shadow-md shadow-amber-200">3</div>
                  <p className="text-xs font-medium text-slate-600">Få resultat!</p>
                </div>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" />
                100% gratis
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" />
                Ingen registrering krävs
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" />
                50+ yrkeskategorier
              </span>
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
