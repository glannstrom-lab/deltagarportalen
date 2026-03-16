import { Link } from 'react-router-dom'
import { BarChart3, TrendingUp, ChevronRight, Target, Zap, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SkillsWidgetProps {
  analyzedSkills?: number
  gapCount?: number
  matchScore?: number
  hasAnalysis?: boolean
  size?: 'mini' | 'medium' | 'large'
}

export function SkillsWidget({
  analyzedSkills = 0,
  gapCount = 0,
  matchScore = 0,
  hasAnalysis = false,
  size = 'medium'
}: SkillsWidgetProps) {
  const isGood = matchScore >= 70

  // MINI
  if (size === 'mini') {
    return (
      <Link
        to="/skills-gap-analysis"
        className="group flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-600 hover:shadow-md transition-all duration-200"
      >
        <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center flex-shrink-0">
          <BarChart3 size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Kompetens</p>
          <p className={cn("text-xs", hasAnalysis ? (isGood ? "text-emerald-600 dark:text-emerald-400" : "text-cyan-600 dark:text-cyan-400") : "text-slate-500 dark:text-slate-400")}>
            {hasAnalysis ? `${matchScore}%` : 'Analysera'}
          </p>
        </div>
        {hasAnalysis && gapCount > 0 && (
          <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded text-xs font-medium">
            {gapCount}
          </span>
        )}
      </Link>
    )
  }

  // MEDIUM
  if (size === 'medium') {
    return (
      <Link
        to="/skills-gap-analysis"
        className="group block bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <BarChart3 size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Kompetensanalys</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {hasAnalysis ? 'Analyserad' : 'Hitta styrkor'}
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors" />
        </div>

        {hasAnalysis ? (
          <div className="flex items-center gap-3">
            <span className={cn("text-2xl font-bold", isGood ? "text-emerald-600 dark:text-emerald-400" : "text-cyan-600 dark:text-cyan-400")}>
              {matchScore}%
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">matchning</span>
            {gapCount > 0 && (
              <span className="ml-auto px-2 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
                {gapCount} gap
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
            <Target size={16} />
            <span className="text-sm">Starta analys</span>
          </div>
        )}
      </Link>
    )
  }

  // LARGE
  return (
    <Link
      to="/skills-gap-analysis"
      className="group block bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-600 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-100 to-teal-100 dark:from-cyan-900/40 dark:to-teal-900/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <BarChart3 size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Kompetensanalys</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {hasAnalysis ? 'Dina kompetenser analyserade' : 'Hitta dina styrkor'}
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 mt-1 transition-colors" />
      </div>

      {/* Status card */}
      {hasAnalysis ? (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Matchning med mål</span>
            <span className={cn("text-lg font-bold", isGood ? "text-emerald-600 dark:text-emerald-400" : "text-cyan-600 dark:text-cyan-400")}>
              {matchScore}%
            </span>
          </div>
          <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
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
        <div className="flex items-center gap-4 p-4 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-800 mb-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center">
            <Zap size={24} className="text-cyan-500 dark:text-cyan-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-cyan-800 dark:text-cyan-300">Kom igång</p>
            <p className="text-xs text-cyan-600 dark:text-cyan-400">Identifiera kompetensgap</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-cyan-500 dark:text-cyan-400" />
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{analyzedSkills}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Analyserade</p>
        </div>
        <div className={cn("p-3 rounded-lg", gapCount > 0 ? "bg-amber-50 dark:bg-amber-900/20" : "bg-emerald-50 dark:bg-emerald-900/20")}>
          <div className="flex items-center gap-2">
            <Target size={16} className={gapCount > 0 ? "text-amber-500 dark:text-amber-400" : "text-emerald-500 dark:text-emerald-400"} />
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{gapCount}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Gap att fylla</p>
        </div>
      </div>

      {/* Action */}
      <div className="flex gap-2">
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400 rounded-lg text-xs font-medium group-hover:bg-cyan-200 dark:group-hover:bg-cyan-900/60 transition-colors">
          <Play size={12} />
          {hasAnalysis ? 'Se analys' : 'Starta analys'}
        </span>
      </div>
    </Link>
  )
}

export default SkillsWidget
