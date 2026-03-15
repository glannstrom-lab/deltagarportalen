import { Link } from 'react-router-dom'
import { BarChart3, TrendingUp, ChevronRight, Target, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SkillsWidgetProps {
  analyzedSkills?: number
  gapCount?: number
  matchScore?: number
  hasAnalysis?: boolean
  size?: 'small' | 'medium'
}

export function SkillsWidget({
  analyzedSkills = 0,
  gapCount = 0,
  matchScore = 0,
  hasAnalysis = false,
  size = 'small'
}: SkillsWidgetProps) {
  const isGood = matchScore >= 70

  if (size === 'small') {
    return (
      <Link
        to="/skills-gap-analysis"
        className={cn(
          "group block bg-white p-4 rounded-2xl border-2 transition-all duration-200",
          "hover:border-cyan-300 hover:shadow-lg hover:-translate-y-0.5",
          "focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2",
          "border-slate-200"
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center">
              <BarChart3 size={18} />
            </div>
            <h3 className="font-semibold text-slate-800 text-sm">Kompetenser</h3>
          </div>
          <ChevronRight
            size={16}
            className="text-slate-300 group-hover:text-cyan-500 group-hover:translate-x-0.5 transition-all"
          />
        </div>

        {hasAnalysis ? (
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-2xl font-bold",
              isGood ? "text-emerald-600" : "text-slate-800"
            )}>
              {matchScore}%
            </span>
            <span className="text-sm text-slate-500">matchning</span>
            {gapCount > 0 && (
              <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                {gapCount} gap
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Target size={16} className="text-cyan-500" />
            <span className="text-sm text-slate-600">Analysera kompetenser</span>
          </div>
        )}
      </Link>
    )
  }

  // Medium size
  return (
    <Link
      to="/skills-gap-analysis"
      className={cn(
        "group block bg-white p-5 rounded-2xl border-2 transition-all duration-200",
        "hover:border-cyan-300 hover:shadow-xl hover:-translate-y-0.5",
        "focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2",
        "border-slate-200"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-100 to-teal-100 text-cyan-600 flex items-center justify-center shadow-sm">
            <BarChart3 size={22} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Kompetensanalys</h3>
            <p className="text-xs text-slate-500">
              {hasAnalysis ? 'Analyserad' : 'Hitta dina styrkor'}
            </p>
          </div>
        </div>
        <ChevronRight
          size={18}
          className="text-slate-300 group-hover:text-cyan-500 group-hover:translate-x-0.5 transition-all mt-1"
        />
      </div>

      {/* Status card */}
      {hasAnalysis ? (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Matchning med mål</span>
            <span className={cn(
              "text-lg font-bold",
              isGood ? "text-emerald-600" : "text-cyan-600"
            )}>
              {matchScore}%
            </span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isGood
                  ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                  : "bg-gradient-to-r from-cyan-400 to-teal-500"
              )}
              style={{ width: `${matchScore}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-cyan-50 border border-cyan-100 mb-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
            <Zap size={24} className="text-cyan-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-cyan-800">Kom igång</p>
            <p className="text-xs text-cyan-600">Identifiera kompetensgap</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-cyan-50 rounded-xl">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-cyan-500" />
            <span className="text-lg font-bold text-slate-800">{analyzedSkills}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Analyserade</p>
        </div>
        <div className={cn(
          "p-3 rounded-xl",
          gapCount > 0 ? "bg-amber-50" : "bg-emerald-50"
        )}>
          <div className="flex items-center gap-2">
            <Target size={16} className={gapCount > 0 ? "text-amber-500" : "text-emerald-500"} />
            <span className="text-lg font-bold text-slate-800">{gapCount}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Gap att fylla</p>
        </div>
      </div>
    </Link>
  )
}

export default SkillsWidget
