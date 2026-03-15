import { Link } from 'react-router-dom'
import { Linkedin, TrendingUp, ChevronRight, CheckCircle2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LinkedInWidgetProps {
  profileScore?: number
  optimizedSections?: number
  totalSections?: number
  hasAnalysis?: boolean
  size?: 'small' | 'medium'
}

export function LinkedInWidget({
  profileScore = 0,
  optimizedSections = 0,
  totalSections = 6,
  hasAnalysis = false,
  size = 'small'
}: LinkedInWidgetProps) {
  const progress = Math.round((optimizedSections / totalSections) * 100)
  const isOptimized = profileScore >= 80

  if (size === 'small') {
    return (
      <Link
        to="/linkedin-optimizer"
        className={cn(
          "group block bg-white p-4 rounded-2xl border-2 transition-all duration-200",
          "hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          isOptimized ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200"
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center",
              isOptimized ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
            )}>
              <Linkedin size={18} />
            </div>
            <h3 className="font-semibold text-slate-800 text-sm">LinkedIn</h3>
          </div>
          <ChevronRight
            size={16}
            className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all"
          />
        </div>

        {hasAnalysis ? (
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-2xl font-bold",
              isOptimized ? "text-emerald-600" : "text-slate-800"
            )}>
              {profileScore}%
            </span>
            <span className="text-sm text-slate-500">profilstyrka</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-500" />
            <span className="text-sm text-slate-600">Optimera din profil</span>
          </div>
        )}

        {hasAnalysis && (
          <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isOptimized ? "bg-emerald-500" : "bg-blue-500"
              )}
              style={{ width: `${profileScore}%` }}
            />
          </div>
        )}
      </Link>
    )
  }

  // Medium size
  return (
    <Link
      to="/linkedin-optimizer"
      className={cn(
        "group block bg-white p-5 rounded-2xl border-2 transition-all duration-200",
        "hover:border-blue-300 hover:shadow-xl hover:-translate-y-0.5",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        isOptimized ? "border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white" : "border-slate-200"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center shadow-sm",
            isOptimized
              ? "bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600"
              : "bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-600"
          )}>
            <Linkedin size={22} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">LinkedIn-optimering</h3>
            <p className="text-xs text-slate-500">
              {hasAnalysis ? 'Analyserad' : 'Analysera din profil'}
            </p>
          </div>
        </div>
        <ChevronRight
          size={18}
          className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all mt-1"
        />
      </div>

      {/* Status card */}
      {hasAnalysis ? (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Profilstyrka</span>
            <span className={cn(
              "text-lg font-bold",
              isOptimized ? "text-emerald-600" : "text-blue-600"
            )}>
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
        <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 border border-blue-100 mb-3">
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
      <div className="grid grid-cols-2 gap-3">
        <div className={cn(
          "p-3 rounded-xl",
          isOptimized ? "bg-emerald-50" : "bg-blue-50"
        )}>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className={isOptimized ? "text-emerald-500" : "text-blue-500"} />
            <span className="text-lg font-bold text-slate-800">{profileScore}%</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Profilstyrka</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-slate-500" />
            <span className="text-lg font-bold text-slate-800">{optimizedSections}/{totalSections}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Sektioner</p>
        </div>
      </div>
    </Link>
  )
}

export default LinkedInWidget
