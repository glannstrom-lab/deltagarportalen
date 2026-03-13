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
  Flame,
  RotateCcw,
  BarChart3
} from 'lucide-react'
import { DashboardWidget } from '../DashboardWidget'
import type { WidgetStatus } from '@/types/dashboard'
import type { WidgetSize } from '../WidgetSizeSelector'

interface InterestWidgetProps {
  hasResult: boolean
  topRecommendations?: { name: string; matchPercentage?: number }[]
  completedAt?: string | null
  // Nya props
  answeredQuestions?: number
  totalQuestions?: number
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

// RIASEC färger
const riasecColors: Record<string, { bg: string; text: string; border: string }> = {
  Realistic: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  Investigative: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  Artistic: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  Social: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  Enterprising: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  Conventional: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
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

// SMALL - Ultra kompakt med quiz-progress
function InterestWidgetSmall({ 
  hasResult, 
  topRecommendations = [], 
  answeredQuestions = 0,
  totalQuestions = 36,
  loading, 
  error, 
  onRetry 
}: Omit<InterestWidgetProps, 'size' | 'riasecProfile'>) {
  const getStatus = (): WidgetStatus => {
    if (!hasResult && answeredQuestions === 0) return 'empty'
    if (answeredQuestions > 0 && !hasResult) return 'in-progress'
    return 'complete'
  }

  const status = getStatus()
  const firstRecommendation = topRecommendations[0]
  const progress = Math.round((answeredQuestions / totalQuestions) * 100)

  // Om pågående quiz
  if (answeredQuestions > 0 && !hasResult) {
    return (
      <DashboardWidget
        title="Intressen"
        icon={<Compass size={14} />}
        to="/interest-guide"
        color="teal"
        status={status}
        progress={progress}
        loading={loading}
        error={error}
        onRetry={onRetry}
      >
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 shrink-0">
            <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="none" stroke="#e2e8f0" strokeWidth="3" />
              <circle 
                cx="16" cy="16" r="14" fill="none" 
                stroke="#14b8a6"
                strokeWidth="3" 
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 14 * progress / 100} ${2 * Math.PI * 14}`}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[9px] font-bold text-slate-700">{progress}%</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-teal-600">Pågår...</span>
            <p className="text-[10px] text-slate-500">{answeredQuestions}/{totalQuestions} frågor</p>
          </div>
        </div>
      </DashboardWidget>
    )
  }

  return (
    <DashboardWidget
      title="Intressen"
      icon={<Compass size={14} />}
      to="/interest-guide"
      color="teal"
      status={status}
      progress={hasResult ? 100 : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
    >
      <div className="flex items-center gap-2">
        {hasResult ? (
          <>
            <Star size={14} className="text-amber-500" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-emerald-600">Test klart!</span>
              {firstRecommendation && (
                <p className="text-[10px] text-slate-600 truncate">{firstRecommendation.name}</p>
              )}
            </div>
          </>
        ) : (
          <>
            <Compass size={14} className="text-teal-500" />
            <span className="text-[10px] text-slate-500">5 min • {totalQuestions} frågor</span>
          </>
        )}
      </div>
    </DashboardWidget>
  )
}

// MEDIUM - Med RIASEC-badge och quiz-progress
function InterestWidgetMedium({ 
  hasResult, 
  topRecommendations = [], 
  completedAt, 
  answeredQuestions = 0,
  totalQuestions = 36,
  riasecProfile,
  loading, 
  error, 
  onRetry 
}: InterestWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (!hasResult && answeredQuestions === 0) return 'empty'
    if (answeredQuestions > 0 && !hasResult) return 'in-progress'
    return 'complete'
  }

  const status = getStatus()
  const progress = Math.round((answeredQuestions / totalQuestions) * 100)

  // Om pågående quiz
  if (answeredQuestions > 0 && !hasResult) {
    return (
      <DashboardWidget
        title="Fortsätt intressetestet"
        icon={<Compass size={22} className="text-teal-500" />}
        to="/interest-guide"
        color="teal"
        status={status}
        progress={progress}
        loading={loading}
        error={error}
        onRetry={onRetry}
        primaryAction={{ label: 'Fortsätt testet' }}
      >
        <div className="space-y-4">
          {/* Progress */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 p-4 text-white">
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Target size={26} className="text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold">{answeredQuestions}/{totalQuestions}</p>
                <p className="text-sm text-teal-100">frågor besvarade</p>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/10">
              <div className="h-full bg-white/40 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <p className="text-sm text-slate-600 text-center">
            Du är nästan klar! Fortsätt för att få dina personliga rekommendationer.
          </p>
        </div>
      </DashboardWidget>
    )
  }

  return (
    <DashboardWidget
      title="Dina intressen"
      icon={<Compass size={22} className="text-teal-500" />}
      to="/interest-guide"
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
        {/* Status Header med RIASEC */}
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
          <div className="flex-1 min-w-0">
            {hasResult ? (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-slate-800">Dina topp-matchningar!</p>
                  <Sparkles size={16} className="text-amber-500" />
                </div>
                {/* RIASEC Badge */}
                {riasecProfile?.dominant && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${riasecColors[riasecProfile.dominant]?.bg || 'bg-slate-100'} ${riasecColors[riasecProfile.dominant]?.text || 'text-slate-700'} ${riasecColors[riasecProfile.dominant]?.border || 'border-slate-200'}`}>
                      {riasecProfile.dominant}
                    </span>
                    <span className="text-xs text-slate-500">
                      {topRecommendations.length} yrken matchar
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="font-bold text-slate-800">Nyfiken på din framtid?</p>
                <p className="text-sm text-slate-500">Testet tar bara 5 minuter</p>
              </>
            )}
          </div>
        </div>

        {/* Top Recommendations */}
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
                const matchPercentage = occupation.matchPercentage || (98 - index * 4)
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
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center shadow-sm
                      ${style.bg}
                    `}>
                      <RankIcon size={16} className={style.text} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate group-hover:text-teal-700 transition-colors">
                        {occupation.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${style.color}`}>
                          {style.label}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-bold text-teal-600">
                          {matchPercentage}% match
                        </span>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-slate-300 group-hover:text-teal-500 transition-colors" />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!hasResult && answeredQuestions === 0 && (
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
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// LARGE - Med full RIASEC-profil
function InterestWidgetLarge({ 
  hasResult, 
  topRecommendations = [], 
  completedAt, 
  answeredQuestions = 0,
  totalQuestions = 36,
  riasecProfile,
  loading, 
  error, 
  onRetry 
}: InterestWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (!hasResult && answeredQuestions === 0) return 'empty'
    if (answeredQuestions > 0 && !hasResult) return 'in-progress'
    return 'complete'
  }

  const status = getStatus()
  const progress = Math.round((answeredQuestions / totalQuestions) * 100)

  // Om pågående quiz
  if (answeredQuestions > 0 && !hasResult) {
    return (
      <DashboardWidget
        title="Fortsätt intressetestet"
        icon={<Compass size={24} className="text-teal-500" />}
        to="/interest-guide"
        color="teal"
        status={status}
        progress={progress}
        loading={loading}
        error={error}
        onRetry={onRetry}
        primaryAction={{ label: 'Fortsätt testet' }}
      >
        <div className="space-y-5">
          {/* Progress Card */}
          <div className="relative overflow-hidden p-6 bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-600 rounded-2xl text-white shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4" />
            
            <div className="relative text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
                <Target size={40} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Du är på väg!</h3>
              <p className="text-teal-100 text-sm mb-4">
                {answeredQuestions} av {totalQuestions} frågor besvarade
              </p>
              <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-teal-50 rounded-xl border border-teal-100 text-center">
              <p className="text-3xl font-bold text-teal-600">{totalQuestions - answeredQuestions}</p>
              <p className="text-sm text-teal-700">frågor kvar</p>
            </div>
            <div className="p-4 bg-cyan-50 rounded-xl border border-cyan-100 text-center">
              <p className="text-3xl font-bold text-cyan-600">~{Math.ceil((totalQuestions - answeredQuestions) * 0.5)}</p>
              <p className="text-sm text-cyan-700">minuter kvar</p>
            </div>
          </div>
        </div>
      </DashboardWidget>
    )
  }

  return (
    <DashboardWidget
      title="Dina intressen"
      icon={<Compass size={24} className="text-teal-500" />}
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
    >
      <div className="space-y-5">
        {hasResult ? (
          <>
            {/* Header med RIASEC */}
            <div className="relative overflow-hidden p-5 bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-600 rounded-2xl text-white shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4" />
              
              <div className="relative">
                <div className="flex items-start gap-5">
                  <div className="relative">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <Trophy size={40} className="text-yellow-300" />
                    </div>
                    <Sparkles size={16} className="absolute -top-1 -right-1 text-yellow-300" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                        🎉 Test klart!
                      </span>
                      {completedAt && (
                        <span className="text-xs text-teal-100">
                          {new Date(completedAt).toLocaleDateString('sv-SE')}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold mb-1">Dina resultat är klara!</h3>
                    <p className="text-teal-100 text-sm">
                      {topRecommendations.length} yrken matchar din profil
                    </p>
                  </div>
                </div>

                {/* RIASEC Profil */}
                {riasecProfile && (
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <p className="text-xs text-teal-100 mb-2 flex items-center gap-1">
                      <BarChart3 size={12} />
                      Din personlighetsprofil (RIASEC)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {riasecProfile.dominant && (
                        <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                          {riasecProfile.dominant}
                        </span>
                      )}
                      {riasecProfile.secondary && (
                        <span className="px-3 py-1 bg-white/10 rounded-full text-sm">
                          + {riasecProfile.secondary}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Topp-matchning */}
            {topRecommendations.length > 0 && (
              <div className="p-4 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 rounded-xl border-2 border-amber-200">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Crown size={32} className="text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      1
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-1">
                      Din bästa matchning!
                    </p>
                    <p className="text-lg font-bold text-slate-800 mb-1">
                      {topRecommendations[0].name}
                    </p>
                    <span className="text-sm font-bold text-amber-600">
                      {topRecommendations[0].matchPercentage || 98}% match
                    </span>
                  </div>
                  <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors">
                    Utforska
                  </button>
                </div>
              </div>
            )}

            {/* Alla matchningar */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <Medal size={16} className="text-teal-500" />
                Alla dina matchningar
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {topRecommendations.slice(0, 4).map((occupation, index) => {
                  const style = getRankStyle(index)
                  const RankIcon = style.icon
                  return (
                    <div 
                      key={index}
                      className="group p-3 rounded-xl border bg-white border-slate-200 hover:border-teal-300 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${style.bg}`}>
                          <RankIcon size={12} className={style.text} />
                        </div>
                        <span className="text-xs font-bold text-teal-600">
                          {occupation.matchPercentage || (98 - index * 4)}%
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-700 line-clamp-1">
                        {occupation.name}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Gör om-knapp */}
            <button className="w-full flex items-center justify-center gap-2 p-3 text-sm text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-colors">
              <RotateCcw size={16} />
              Gör testet igen
            </button>
          </>
        ) : (
          <>
            {/* Empty State */}
            <div className="relative overflow-hidden p-6 bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-600 rounded-2xl text-white shadow-lg">
              <div className="text-center">
                <div className="inline-flex mb-4">
                  <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Compass size={44} className="text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">Upptäck dina styrkor!</h3>
                <p className="text-teal-100 text-sm">
                  Hitta yrken som matchar din personlighet på bara 5 minuter
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 bg-teal-50 rounded-xl text-center">
                <Target size={24} className="text-teal-600 mx-auto mb-2" />
                <p className="text-sm font-bold">Personliga matchningar</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl text-center">
                <Heart size={24} className="text-amber-600 mx-auto mb-2" />
                <p className="text-sm font-bold">{totalQuestions} frågor</p>
              </div>
              <div className="p-4 bg-cyan-50 rounded-xl text-center">
                <Gem size={24} className="text-cyan-600 mx-auto mb-2" />
                <p className="text-sm font-bold">Omedelbara resultat</p>
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
