import { Link } from 'react-router-dom'
import { Linkedin, TrendingUp, ChevronRight, CheckCircle2, Sparkles, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LinkedInWidgetProps {
  profileScore?: number
  optimizedSections?: number
  totalSections?: number
  hasAnalysis?: boolean
  size?: 'mini' | 'medium' | 'large'
}

export function LinkedInWidget({
  profileScore = 0,
  optimizedSections = 0,
  totalSections = 6,
  hasAnalysis = false,
  size = 'medium'
}: LinkedInWidgetProps) {
  const isOptimized = profileScore >= 80

  // MINI
  if (size === 'mini') {
    return (
      <Link
        to="/linkedin-optimizer"
        className={cn(
          "group flex items-center gap-3 bg-white p-3 rounded-xl border transition-all duration-200",
          "hover:border-blue-300 hover:shadow-md",
          isOptimized ? "border-emerald-200" : "border-slate-200"
        )}
      >
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
          isOptimized ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
        )}>
          <Linkedin size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">LinkedIn</p>
          <p className={cn("text-xs", hasAnalysis ? (isOptimized ? "text-emerald-600" : "text-blue-600") : "text-slate-500")}>
            {hasAnalysis ? `${profileScore}%` : 'Analysera'}
          </p>
        </div>
        {hasAnalysis && isOptimized && (
          <CheckCircle2 size={14} className="text-emerald-500" />
        )}
      </Link>
    )
  }

  // MEDIUM
  if (size === 'medium') {
    return (
      <Link
        to="/linkedin-optimizer"
        className={cn(
          "group block bg-white p-4 rounded-xl border transition-all duration-200",
          "hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5",
          isOptimized ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200"
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center",
              isOptimized ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
            )}>
              <Linkedin size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">LinkedIn</h3>
              <p className="text-xs text-slate-500">
                {hasAnalysis ? 'Profil analyserad' : 'Optimera profilen'}
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
        </div>

        {hasAnalysis ? (
          <div className="flex items-center gap-3">
            <span className={cn("text-2xl font-bold", isOptimized ? "text-emerald-600" : "text-blue-600")}>
              {profileScore}%
            </span>
            <span className="text-sm text-slate-500">profilstyrka</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-blue-600">
            <Sparkles size={16} />
            <span className="text-sm">Starta analys</span>
          </div>
        )}
      </Link>
    )
  }

  // LARGE
  return (
    <Link
      to="/linkedin-optimizer"
      className={cn(
        "group block bg-white p-5 rounded-xl border transition-all duration-200",
        "hover:border-blue-300 hover:shadow-lg",
        isOptimized ? "border-emerald-200" : "border-slate-200"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            isOptimized
              ? "bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600"
              : "bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-600"
          )}>
            <Linkedin size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">LinkedIn-optimering</h3>
            <p className="text-sm text-slate-500">
              {hasAnalysis ? 'Profil analyserad' : 'Analysera din profil'}
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 mt-1 transition-colors" />
      </div>

      {/* Status card */}
      {hasAnalysis ? (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Profilstyrka</span>
            <span className={cn("text-lg font-bold", isOptimized ? "text-emerald-600" : "text-blue-600")}>
              {profileScore}%
            </span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isOptimized
                  ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                  : "bg-gradient-to-r from-blue-400 to-cyan-500"
              )}
              style={{ width: `${profileScore}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 border border-blue-100 mb-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <Sparkles size={24} className="text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-800">Analysera din profil</p>
            <p className="text-xs text-blue-600">Få tips för att synas bättre</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={cn("p-3 rounded-lg", isOptimized ? "bg-emerald-50" : "bg-blue-50")}>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className={isOptimized ? "text-emerald-500" : "text-blue-500"} />
            <span className="text-lg font-bold text-slate-800">{profileScore}%</span>
          </div>
          <p className="text-xs text-slate-500">Profilstyrka</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-slate-500" />
            <span className="text-lg font-bold text-slate-800">{optimizedSections}/{totalSections}</span>
          </div>
          <p className="text-xs text-slate-500">Sektioner</p>
        </div>
      </div>

      {/* Action */}
      <div className="flex gap-2">
        <span className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
          isOptimized
            ? "bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200"
            : "bg-blue-100 text-blue-700 group-hover:bg-blue-200"
        )}>
          <Play size={12} />
          {hasAnalysis ? 'Se förslag' : 'Starta analys'}
        </span>
      </div>
    </Link>
  )
}

export default LinkedInWidget
