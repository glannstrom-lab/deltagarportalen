import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileText, ChevronRight, CheckCircle2, Sparkles, Edit, Download, Eye } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface CVWidgetProps {
  hasCV?: boolean
  progress?: number
  size?: 'mini' | 'medium' | 'large'
}

export function CVWidget({
  hasCV = false,
  progress = 0,
  size = 'medium'
}: CVWidgetProps) {
  const { t } = useTranslation()
  const isComplete = progress >= 100

  // MINI - Ultra compact
  if (size === 'mini') {
    return (
      <Link
        to="/cv"
        className={cn(
          "group flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border transition-all duration-200",
          "hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-md",
          isComplete ? "border-emerald-200 dark:border-emerald-700" : "border-slate-200 dark:border-slate-700"
        )}
      >
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
          isComplete ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" : "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400"
        )}>
          {isComplete ? <CheckCircle2 size={16} /> : <FileText size={16} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">CV</p>
          <p className={cn("text-xs", isComplete ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400")}>
            {isComplete ? t('cvWidget.complete') : `${progress}%`}
          </p>
        </div>
        <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors" />
      </Link>
    )
  }

  // MEDIUM - Standard card
  if (size === 'medium') {
    return (
      <Link
        to="/cv"
        className={cn(
          "group block bg-white dark:bg-slate-800 p-4 rounded-xl border transition-all duration-200",
          "hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-lg hover:-translate-y-0.5",
          isComplete ? "border-emerald-200 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-900/20" : "border-slate-200 dark:border-slate-700"
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center",
              isComplete ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" : "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400"
            )}>
              {isComplete ? <CheckCircle2 size={18} /> : <FileText size={18} />}
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{t('cvWidget.yourCV')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isComplete ? t('cvWidget.readyToSend') : hasCV ? t('cvWidget.inProgress') : t('cvWidget.getStarted')}
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors" />
        </div>

        <div className="flex items-center gap-3">
          <span className={cn(
            "text-2xl font-bold",
            isComplete ? "text-emerald-600 dark:text-emerald-400" : "text-violet-600 dark:text-violet-400"
          )}>
            {progress}%
          </span>
          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isComplete ? "bg-emerald-500" : "bg-violet-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Link>
    )
  }

  // LARGE - Full featured
  return (
    <Link
      to="/cv"
      className={cn(
        "group block bg-white dark:bg-slate-800 p-5 rounded-xl border transition-all duration-200",
        "hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-lg",
        isComplete ? "border-emerald-200 dark:border-emerald-700" : "border-slate-200 dark:border-slate-700"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            isComplete
              ? "bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 text-emerald-600 dark:text-emerald-400"
              : "bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40 text-violet-600 dark:text-violet-400"
          )}>
            {isComplete ? <CheckCircle2 size={24} /> : <FileText size={24} />}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('cvWidget.yourCV')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isComplete ? t('cvWidget.readyToUse') : hasCV ? t('cvWidget.continueWhereYouLeft') : t('cvWidget.createProfessionalCV')}
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:text-violet-500 dark:group-hover:text-violet-400 mt-1 transition-colors" />
      </div>

      {/* Progress Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-600 dark:text-slate-400">{t('cvWidget.progress')}</span>
          <span className={cn(
            "text-lg font-bold",
            isComplete ? "text-emerald-600 dark:text-emerald-400" : "text-violet-600 dark:text-violet-400"
          )}>
            {progress}%
          </span>
        </div>
        <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isComplete
                ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                : "bg-gradient-to-r from-violet-500 to-purple-500"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Status Card */}
      {isComplete ? (
        <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800 mb-4">
          <Sparkles size={20} className="text-emerald-500 dark:text-emerald-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{t('cvWidget.cvComplete')}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">{t('cvWidget.readyToSendToEmployers')}</p>
          </div>
        </div>
      ) : !hasCV ? (
        <div className="flex items-center gap-3 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-100 dark:border-violet-800 mb-4">
          <Sparkles size={20} className="text-violet-500 dark:text-violet-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-violet-800 dark:text-violet-300">{t('cvWidget.createYourCV')}</p>
            <p className="text-xs text-violet-600 dark:text-violet-400">{t('cvWidget.onlyTakesMinutes')}</p>
          </div>
        </div>
      ) : null}

      {/* Quick Actions */}
      <div className="flex gap-2">
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 group-hover:bg-violet-100 dark:group-hover:bg-violet-900/40 group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors">
          <Edit size={12} />
          {hasCV ? t('cvWidget.edit') : t('cvWidget.create')}
        </span>
        {hasCV && (
          <>
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300">
              <Eye size={12} />
              {t('cvWidget.preview')}
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300">
              <Download size={12} />
              {t('cvWidget.download')}
            </span>
          </>
        )}
      </div>
    </Link>
  )
}

export default CVWidget
