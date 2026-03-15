import { Link } from 'react-router-dom'
import { Compass, Star, ChevronRight, Sparkles, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InterestWidgetProps {
  hasResult?: boolean
  topRecommendations?: { name: string; matchPercentage?: number }[]
  answeredQuestions?: number
  totalQuestions?: number
  size?: 'small' | 'medium'
}

export function InterestWidget({
  hasResult = false,
  topRecommendations = [],
  answeredQuestions = 0,
  totalQuestions = 36,
  size = 'small'
}: InterestWidgetProps) {
  const progress = Math.round((answeredQuestions / totalQuestions) * 100)
  const isInProgress = answeredQuestions > 0 && !hasResult
  const firstRecommendation = topRecommendations[0]

  if (size === 'small') {
    return (
      <Link
        to="/interest-guide"
        className={cn(
          "group block bg-white p-4 rounded-2xl border-2 transition-all duration-200",
          "hover:border-teal-300 hover:shadow-lg hover:-translate-y-0.5",
          "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2",
          hasResult ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200"
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center",
              hasResult ? "bg-emerald-100 text-emerald-600" : "bg-teal-100 text-teal-600"
            )}>
              {hasResult ? <Star size={18} /> : <Compass size={18} />}
            </div>
            <h3 className="font-semibold text-slate-800 text-sm">Intressen</h3>
          </div>
          <ChevronRight
            size={16}
            className="text-slate-300 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all"
          />
        </div>

        {isInProgress ? (
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
                <span className="text-xs font-bold text-slate-700">{progress}%</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-teal-600 font-medium">Pågår</span>
              <p className="text-xs text-slate-500">{answeredQuestions}/{totalQuestions} frågor</p>
            </div>
          </div>
        ) : hasResult ? (
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-emerald-600">{topRecommendations.length}</span>
            <span className="text-sm text-slate-500">matchningar</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Target size={16} className="text-teal-500" />
            <span className="text-sm text-slate-600">5 min • {totalQuestions} frågor</span>
          </div>
        )}

        {/* Progress bar for in-progress */}
        {isInProgress && (
          <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-teal-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </Link>
    )
  }

  // Medium size
  return (
    <Link
      to="/interest-guide"
      className={cn(
        "group block bg-white p-5 rounded-2xl border-2 transition-all duration-200",
        "hover:border-teal-300 hover:shadow-xl hover:-translate-y-0.5",
        "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2",
        hasResult ? "border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white" : "border-slate-200"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center shadow-sm",
            hasResult
              ? "bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600"
              : "bg-gradient-to-br from-teal-100 to-cyan-100 text-teal-600"
          )}>
            {hasResult ? <Star size={22} /> : <Compass size={22} />}
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Intressetest</h3>
            <p className="text-xs text-slate-500">
              {hasResult ? 'Resultat klart!' : isInProgress ? 'Fortsätt testet' : 'Hitta ditt drömyrke'}
            </p>
          </div>
        </div>
        <ChevronRight
          size={18}
          className="text-slate-300 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all mt-1"
        />
      </div>

      {/* Status card */}
      {hasResult ? (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100 mb-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Sparkles size={24} className="text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-800">Test klart!</p>
            {firstRecommendation && (
              <p className="text-xs text-emerald-600 truncate">Topp: {firstRecommendation.name}</p>
            )}
          </div>
        </div>
      ) : isInProgress ? (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Din progress</span>
            <span className="text-lg font-bold text-teal-600">{progress}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-teal-400 to-cyan-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-teal-50 border border-teal-100 mb-3">
          <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
            <Target size={24} className="text-teal-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-teal-800">Starta testet</p>
            <p className="text-xs text-teal-600">5 min • Personliga yrkesrekommendationer</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className={cn(
          "p-3 rounded-xl",
          hasResult ? "bg-emerald-50" : "bg-teal-50"
        )}>
          <div className="flex items-center gap-2">
            <Target size={16} className={hasResult ? "text-emerald-500" : "text-teal-500"} />
            <span className="text-lg font-bold text-slate-800">
              {hasResult ? topRecommendations.length : answeredQuestions}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {hasResult ? 'Matchningar' : 'Besvarade'}
          </p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-2">
            <Compass size={16} className="text-slate-500" />
            <span className="text-lg font-bold text-slate-800">{totalQuestions}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Totalt frågor</p>
        </div>
      </div>
    </Link>
  )
}

export default InterestWidget
