import { memo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Compass, Star, ChevronRight, Target, Play } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface InterestWidgetProps {
  hasResult?: boolean
  topRecommendations?: { name: string; matchPercentage?: number }[]
  answeredQuestions?: number
  totalQuestions?: number
  size?: 'mini' | 'medium' | 'large'
}

export const InterestWidget = memo(function InterestWidget({
  hasResult = false,
  topRecommendations = [],
  answeredQuestions = 0,
  totalQuestions = 36,
  size = 'medium'
}: InterestWidgetProps) {
  const { t } = useTranslation()
  const progress = Math.round((answeredQuestions / totalQuestions) * 100)
  const isInProgress = answeredQuestions > 0 && !hasResult
  const firstRecommendation = topRecommendations[0]

  // MINI
  if (size === 'mini') {
    return (
      <Link
        to="/interest-guide"
        className={cn(
          "group flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border transition-all duration-200",
          "hover:border-brand-300 dark:hover:border-brand-900 hover:",
          hasResult ? "border-emerald-200 dark:border-emerald-700" : "border-slate-200 dark:border-slate-700"
        )}
      >
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
          hasResult ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" : "bg-brand-100 dark:bg-brand-900/40 text-brand-900 dark:text-brand-400"
        )}>
          {hasResult ? <Star size={16} /> : <Compass size={16} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t('interestWidget.interests')}</p>
          <p className={cn("text-xs", hasResult ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400")}>
            {hasResult ? t('interestWidget.done') : isInProgress ? `${progress}%` : t('interestWidget.fiveMin')}
          </p>
        </div>
        {hasResult && topRecommendations.length > 0 && (
          <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded text-xs font-medium">
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
          "group block bg-white dark:bg-slate-800 p-4 rounded-xl border transition-all duration-200",
          "hover:border-brand-300 dark:hover:border-brand-900 hover: hover:-translate-y-0.5",
          hasResult ? "border-emerald-200 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-900/20" : "border-slate-200 dark:border-slate-700"
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center",
              hasResult ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" : "bg-brand-100 dark:bg-brand-900/40 text-brand-900 dark:text-brand-400"
            )}>
              {hasResult ? <Star size={18} /> : <Compass size={18} />}
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{t('interestWidget.interestTest')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {hasResult ? t('interestWidget.resultReady') : isInProgress ? t('interestWidget.continueTest') : t('interestWidget.findCareer')}
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors" />
        </div>

        {isInProgress ? (
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-brand-900 dark:text-brand-400">{progress}%</span>
            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-700 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : hasResult ? (
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{topRecommendations.length}</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">{t('interestWidget.matches')}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-brand-900 dark:text-brand-400">
            <Target size={16} />
            <span className="text-sm">{t('interestWidget.timeAndQuestions', { questions: totalQuestions })}</span>
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
        "group block bg-white dark:bg-slate-800 p-5 rounded-xl border transition-all duration-200",
        "hover:border-brand-300 dark:hover:border-brand-900 hover:",
        hasResult ? "border-emerald-200 dark:border-emerald-700" : "border-slate-200 dark:border-slate-700"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            hasResult
              ? "bg-gradient-to-br from-emerald-100 to-brand-100 dark:from-emerald-900/40 dark:to-brand-900/40 text-emerald-600 dark:text-emerald-400"
              : "bg-gradient-to-br from-brand-100 to-cyan-100 dark:from-brand-900/40 dark:to-cyan-900/40 text-brand-900 dark:text-brand-400"
          )}>
            {hasResult ? <Star size={24} /> : <Compass size={24} />}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('interestWidget.interestTest')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {hasResult ? t('interestWidget.yourResultsReady') : isInProgress ? t('interestWidget.continueTest') : t('interestWidget.findDreamJob')}
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:text-brand-700 dark:group-hover:text-brand-400 mt-1 transition-colors" />
      </div>

      {/* Status Card */}
      {hasResult ? (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 mb-4">
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-2">{t('interestWidget.yourTopMatches')}</p>
          <div className="space-y-2">
            {topRecommendations.slice(0, 3).map((rec, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-emerald-700 dark:text-emerald-400">{rec.name}</span>
                {rec.matchPercentage && (
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{rec.matchPercentage}%</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : isInProgress ? (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">{t('interestWidget.yourProgress')}</span>
            <span className="text-lg font-bold text-brand-900 dark:text-brand-400">{progress}%</span>
          </div>
          <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-400 to-cyan-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900 mb-4">
          <div className="flex items-center gap-3">
            <Target size={24} className="text-brand-700 dark:text-brand-400" />
            <div>
              <p className="text-sm font-semibold text-brand-900 dark:text-brand-300">{t('interestWidget.startTest')}</p>
              <p className="text-xs text-brand-900 dark:text-brand-400">{t('interestWidget.personalRecommendations')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={cn("p-3 rounded-lg", hasResult ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-brand-50 dark:bg-brand-900/20")}>
          <div className="flex items-center gap-2">
            <Target size={16} className={hasResult ? "text-emerald-500 dark:text-emerald-400" : "text-brand-700 dark:text-brand-400"} />
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {hasResult ? topRecommendations.length : answeredQuestions}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{hasResult ? t('interestWidget.matches') : t('interestWidget.answered')}</p>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Compass size={16} className="text-slate-500 dark:text-slate-400" />
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{totalQuestions}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('interestWidget.totalQuestions')}</p>
        </div>
      </div>

      {/* Action */}
      <div className="flex gap-2">
        <span className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
          hasResult
            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/60"
            : "bg-brand-100 dark:bg-brand-900/40 text-brand-900 dark:text-brand-400 group-hover:bg-brand-200 dark:group-hover:bg-brand-900/60"
        )}>
          <Play size={12} />
          {hasResult ? t('interestWidget.seeResults') : isInProgress ? t('interestWidget.continue') : t('interestWidget.startTest')}
        </span>
      </div>
    </Link>
  )
})

export default InterestWidget
