import { Link } from 'react-router-dom'
import { Compass, Star, ChevronRight, Target, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InterestWidgetProps {
  hasResult?: boolean
  topRecommendations?: { name: string; matchPercentage?: number }[]
  answeredQuestions?: number
  totalQuestions?: number
  size?: 'mini' | 'medium' | 'large'
}

export function InterestWidget({
  hasResult = false,
  topRecommendations = [],
  answeredQuestions = 0,
  totalQuestions = 36,
  size = 'medium'
}: InterestWidgetProps) {
  const progress = Math.round((answeredQuestions / totalQuestions) * 100)
  const isInProgress = answeredQuestions > 0 && !hasResult
  const firstRecommendation = topRecommendations[0]

  // MINI
  if (size === 'mini') {
    return (
      <Link
        to="/interest-guide"
        className={cn(
          "group flex items-center gap-3 bg-white p-3 rounded-xl border transition-all duration-200",
          "hover:border-teal-300 hover:shadow-md",
          hasResult ? "border-emerald-200" : "border-slate-200"
        )}
      >
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
          hasResult ? "bg-emerald-100 text-emerald-600" : "bg-teal-100 text-teal-600"
        )}>
          {hasResult ? <Star size={16} /> : <Compass size={16} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">Intressen</p>
          <p className={cn("text-xs", hasResult ? "text-emerald-600" : "text-slate-500")}>
            {hasResult ? 'Klart!' : isInProgress ? `${progress}%` : '5 min'}
          </p>
        </div>
        {hasResult && topRecommendations.length > 0 && (
          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
            {topRecommendations.length}
          </span>
        )}
      </Link>
    )
  }

  // MEDIUM
  if (size === 'medium') {
    return (
      <Link
        to="/interest-guide"
        className={cn(
          "group block bg-white p-4 rounded-xl border transition-all duration-200",
          "hover:border-teal-300 hover:shadow-lg hover:-translate-y-0.5",
          hasResult ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200"
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center",
              hasResult ? "bg-emerald-100 text-emerald-600" : "bg-teal-100 text-teal-600"
            )}>
              {hasResult ? <Star size={18} /> : <Compass size={18} />}
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Intressetest</h3>
              <p className="text-xs text-slate-500">
                {hasResult ? 'Resultat klart!' : isInProgress ? 'Fortsätt testet' : 'Hitta din karriär'}
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-teal-500 transition-colors" />
        </div>

        {isInProgress ? (
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-teal-600">{progress}%</span>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-teal-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : hasResult ? (
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-emerald-600">{topRecommendations.length}</span>
            <span className="text-sm text-slate-500">matchningar</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-teal-600">
            <Target size={16} />
            <span className="text-sm">5 min • {totalQuestions} frågor</span>
          </div>
        )}
      </Link>
    )
  }

  // LARGE
  return (
    <Link
      to="/interest-guide"
      className={cn(
        "group block bg-white p-5 rounded-xl border transition-all duration-200",
        "hover:border-teal-300 hover:shadow-lg",
        hasResult ? "border-emerald-200" : "border-slate-200"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            hasResult
              ? "bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600"
              : "bg-gradient-to-br from-teal-100 to-cyan-100 text-teal-600"
          )}>
            {hasResult ? <Star size={24} /> : <Compass size={24} />}
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Intressetest</h3>
            <p className="text-sm text-slate-500">
              {hasResult ? 'Dina resultat är klara!' : isInProgress ? 'Fortsätt testet' : 'Hitta ditt drömyrke'}
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-slate-300 group-hover:text-teal-500 mt-1 transition-colors" />
      </div>

      {/* Status Card */}
      {hasResult ? (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 mb-4">
          <p className="text-sm font-semibold text-emerald-800 mb-2">Dina topp-matchningar</p>
          <div className="space-y-2">
            {topRecommendations.slice(0, 3).map((rec, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-emerald-700">{rec.name}</span>
                {rec.matchPercentage && (
                  <span className="text-xs font-medium text-emerald-600">{rec.matchPercentage}%</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : isInProgress ? (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Din progress</span>
            <span className="text-lg font-bold text-teal-600">{progress}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-100 mb-4">
          <div className="flex items-center gap-3">
            <Target size={24} className="text-teal-500" />
            <div>
              <p className="text-sm font-semibold text-teal-800">Starta testet</p>
              <p className="text-xs text-teal-600">5 min • Personliga yrkesrekommendationer</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={cn("p-3 rounded-lg", hasResult ? "bg-emerald-50" : "bg-teal-50")}>
          <div className="flex items-center gap-2">
            <Target size={16} className={hasResult ? "text-emerald-500" : "text-teal-500"} />
            <span className="text-lg font-bold text-slate-800">
              {hasResult ? topRecommendations.length : answeredQuestions}
            </span>
          </div>
          <p className="text-xs text-slate-500">{hasResult ? 'Matchningar' : 'Besvarade'}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Compass size={16} className="text-slate-500" />
            <span className="text-lg font-bold text-slate-800">{totalQuestions}</span>
          </div>
          <p className="text-xs text-slate-500">Totalt frågor</p>
        </div>
      </div>

      {/* Action */}
      <div className="flex gap-2">
        <span className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
          hasResult
            ? "bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200"
            : "bg-teal-100 text-teal-700 group-hover:bg-teal-200"
        )}>
          <Play size={12} />
          {hasResult ? 'Se resultat' : isInProgress ? 'Fortsätt' : 'Starta test'}
        </span>
      </div>
    </Link>
  )
}

export default InterestWidget
