import { memo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Linkedin, TrendingUp, ChevronRight, CheckCircle2, Sparkles, Play } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface LinkedInWidgetProps {
  profileScore?: number
  optimizedSections?: number
  totalSections?: number
  hasAnalysis?: boolean
  size?: 'mini' | 'medium' | 'large'
}

export const LinkedInWidget = memo(function LinkedInWidget({
  profileScore = 0,
  optimizedSections = 0,
  totalSections = 6,
  hasAnalysis = false,
  size = 'medium'
}: LinkedInWidgetProps) {
  const { t } = useTranslation()
  const isOptimized = profileScore >= 80

  // MINI
  if (size === 'mini') {
    return (
      <Link
        to="/linkedin-optimizer"
        className={cn(
          "group flex items-center gap-3 bg-white dark:bg-stone-900 p-3 rounded-xl border transition-all duration-200",
          "hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md",
          isOptimized ? "border-emerald-200 dark:border-emerald-700" : "border-stone-200 dark:border-stone-700"
        )}
      >
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
          isOptimized ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" : "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
        )}>
          <Linkedin size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">LinkedIn</p>
          <p className={cn("text-xs", hasAnalysis ? (isOptimized ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400") : "text-stone-700 dark:text-stone-400")}>
            {hasAnalysis ? `${profileScore}%` : t('linkedInWidget.analyze')}
          </p>
        </div>
        {hasAnalysis && isOptimized && (
          <CheckCircle2 size={14} className="text-emerald-500 dark:text-emerald-400" />
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
          "group block bg-white dark:bg-stone-900 p-4 rounded-xl border transition-all duration-200",
          "hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg hover:-translate-y-0.5",
          isOptimized ? "border-emerald-200 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-900/20" : "border-stone-200 dark:border-stone-700"
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center",
              isOptimized ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" : "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
            )}>
              <Linkedin size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-sm">LinkedIn</h3>
              <p className="text-xs text-stone-700 dark:text-stone-400">
                {hasAnalysis ? t('linkedInWidget.profileAnalyzed') : t('linkedInWidget.optimizeProfile')}
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-stone-300 dark:text-stone-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
        </div>

        {hasAnalysis ? (
          <div className="flex items-center gap-3">
            <span className={cn("text-2xl font-bold", isOptimized ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400")}>
              {profileScore}%
            </span>
            <span className="text-sm text-stone-700 dark:text-stone-400">{t('linkedInWidget.profileStrength')}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Sparkles size={16} />
            <span className="text-sm">{t('linkedInWidget.startAnalysis')}</span>
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
        "group block bg-white dark:bg-stone-900 p-5 rounded-xl border transition-all duration-200",
        "hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg",
        isOptimized ? "border-emerald-200 dark:border-emerald-700" : "border-stone-200 dark:border-stone-700"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            isOptimized
              ? "bg-gradient-to-br from-emerald-100 to-[var(--c-accent)]/40 dark:from-emerald-900/40 dark:to-[var(--c-bg)]/40 text-emerald-600 dark:text-emerald-400"
              : "bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 text-blue-600 dark:text-blue-400"
          )}>
            <Linkedin size={24} />
          </div>
          <div>
            <h3 className="font-bold text-stone-800 dark:text-stone-100">{t('linkedInWidget.linkedInOptimization')}</h3>
            <p className="text-sm text-stone-700 dark:text-stone-400">
              {hasAnalysis ? t('linkedInWidget.profileAnalyzed') : t('linkedInWidget.analyzeYourProfile')}
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-stone-300 dark:text-stone-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 mt-1 transition-colors" />
      </div>

      {/* Status card */}
      {hasAnalysis ? (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-stone-600 dark:text-stone-400">{t('linkedInWidget.profileStrength')}</span>
            <span className={cn("text-lg font-bold", isOptimized ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400")}>
              {profileScore}%
            </span>
          </div>
          <div className="h-3 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isOptimized
                  ? "bg-gradient-to-r from-emerald-400 to-[var(--c-solid)]"
                  : "bg-gradient-to-r from-blue-400 to-cyan-500"
              )}
              style={{ width: `${profileScore}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 mb-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <Sparkles size={24} className="text-blue-500 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">{t('linkedInWidget.analyzeYourProfile')}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">{t('linkedInWidget.getTipsForVisibility')}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={cn("p-3 rounded-lg", isOptimized ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-blue-50 dark:bg-blue-900/20")}>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className={isOptimized ? "text-emerald-500 dark:text-emerald-400" : "text-blue-500 dark:text-blue-400"} />
            <span className="text-lg font-bold text-stone-800 dark:text-stone-100">{profileScore}%</span>
          </div>
          <p className="text-xs text-stone-700 dark:text-stone-400">{t('linkedInWidget.profileStrength')}</p>
        </div>
        <div className="p-3 bg-stone-50 dark:bg-stone-700/50 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-stone-700 dark:text-stone-400" />
            <span className="text-lg font-bold text-stone-800 dark:text-stone-100">{optimizedSections}/{totalSections}</span>
          </div>
          <p className="text-xs text-stone-700 dark:text-stone-400">{t('linkedInWidget.sections')}</p>
        </div>
      </div>

      {/* Action */}
      <div className="flex gap-2">
        <span className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
          isOptimized
            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/60"
            : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/60"
        )}>
          <Play size={12} />
          {hasAnalysis ? t('linkedInWidget.viewSuggestions') : t('linkedInWidget.startAnalysis')}
        </span>
      </div>
    </Link>
  )
})

export default LinkedInWidget
