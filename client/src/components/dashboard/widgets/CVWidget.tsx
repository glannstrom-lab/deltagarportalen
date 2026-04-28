import { memo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileText, ChevronRight, CheckCircle2, Sparkles, Edit, Download, Eye } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface CVWidgetProps {
  hasCV?: boolean
  progress?: number
  size?: 'mini' | 'medium' | 'large'
}

export const CVWidget = memo(function CVWidget({
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
          "group flex items-center gap-3 bg-white dark:bg-stone-800 p-3 rounded-xl border transition-all duration-200",
          "hover:border-[var(--c-accent)] dark:hover:border-[var(--c-solid)] hover:shadow-md",
          isComplete ? "border-emerald-200 dark:border-emerald-700" : "border-stone-200 dark:border-stone-700"
        )}
      >
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
          isComplete ? "bg-emerald-100 dark:bg-emerald-900/40 text-[var(--c-text)] dark:text-[var(--c-text)]" : "bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-text)]"
        )}>
          {isComplete ? <CheckCircle2 size={16} /> : <FileText size={16} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">CV</p>
          <p className={cn("text-xs", isComplete ? "text-[var(--c-text)] dark:text-[var(--c-text)]" : "text-stone-500 dark:text-stone-400")}>
            {isComplete ? t('cvWidget.complete') : `${progress}%`}
          </p>
        </div>
        <ChevronRight size={14} className="text-stone-300 dark:text-stone-600 group-hover:text-[var(--c-solid)] dark:group-hover:text-[var(--c-text)] transition-colors" />
      </Link>
    )
  }

  // MEDIUM - Standard card
  if (size === 'medium') {
    return (
      <Link
        to="/cv"
        className={cn(
          "group block bg-white dark:bg-stone-800 p-4 rounded-xl border transition-all duration-200",
          "hover:border-[var(--c-accent)] dark:hover:border-[var(--c-solid)] hover:shadow-lg hover:-translate-y-0.5",
          isComplete ? "border-emerald-200 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-900/20" : "border-stone-200 dark:border-stone-700"
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center",
              isComplete ? "bg-emerald-100 dark:bg-emerald-900/40 text-[var(--c-text)] dark:text-[var(--c-text)]" : "bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-text)]"
            )}>
              {isComplete ? <CheckCircle2 size={18} /> : <FileText size={18} />}
            </div>
            <div>
              <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-sm">{t('cvWidget.yourCV')}</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {isComplete ? t('cvWidget.readyToSend') : hasCV ? t('cvWidget.inProgress') : t('cvWidget.getStarted')}
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-stone-300 dark:text-stone-600 group-hover:text-[var(--c-solid)] dark:group-hover:text-[var(--c-text)] transition-colors" />
        </div>

        <div className="flex items-center gap-3">
          <span className={cn(
            "text-2xl font-bold",
            isComplete ? "text-[var(--c-text)] dark:text-[var(--c-text)]" : "text-[var(--c-text)] dark:text-[var(--c-text)]"
          )}>
            {progress}%
          </span>
          <div className="flex-1 h-2 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isComplete ? "bg-emerald-500" : "bg-[var(--c-solid)]"
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
        "group block bg-white dark:bg-stone-800 p-5 rounded-xl border transition-all duration-200",
        "hover:border-[var(--c-accent)] dark:hover:border-[var(--c-solid)] hover:shadow-lg",
        isComplete ? "border-emerald-200 dark:border-emerald-700" : "border-stone-200 dark:border-stone-700"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            isComplete
              ? "bg-gradient-to-br from-[var(--c-accent)]/40 to-emerald-200 dark:from-[var(--c-bg)]/40 dark:to-emerald-800/40 text-[var(--c-text)] dark:text-[var(--c-text)]"
              : "bg-gradient-to-br from-[var(--c-accent)]/40 to-sky-100 dark:from-[var(--c-bg)]/40 dark:to-sky-900/40 text-[var(--c-text)] dark:text-[var(--c-text)]"
          )}>
            {isComplete ? <CheckCircle2 size={24} /> : <FileText size={24} />}
          </div>
          <div>
            <h3 className="font-bold text-stone-800 dark:text-stone-100">{t('cvWidget.yourCV')}</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {isComplete ? t('cvWidget.readyToUse') : hasCV ? t('cvWidget.continueWhereYouLeft') : t('cvWidget.createProfessionalCV')}
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-stone-300 dark:text-stone-600 group-hover:text-[var(--c-solid)] dark:group-hover:text-[var(--c-text)] mt-1 transition-colors" />
      </div>

      {/* Progress Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-stone-500 dark:text-stone-400">{t('cvWidget.progress')}</span>
          <span className={cn(
            "text-lg font-bold",
            isComplete ? "text-[var(--c-text)] dark:text-[var(--c-text)]" : "text-[var(--c-text)] dark:text-[var(--c-text)]"
          )}>
            {progress}%
          </span>
        </div>
        <div className="h-3 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isComplete
                ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                : "bg-gradient-to-r from-[var(--c-solid)] to-sky-500"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Status Card */}
      {isComplete ? (
        <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800 mb-4">
          <Sparkles size={20} className="text-emerald-500 dark:text-[var(--c-text)]" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{t('cvWidget.cvComplete')}</p>
            <p className="text-xs text-[var(--c-text)] dark:text-[var(--c-text)]">{t('cvWidget.readyToSendToEmployers')}</p>
          </div>
        </div>
      ) : !hasCV ? (
        <div className="flex items-center gap-3 p-3 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/20 rounded-lg border border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50 mb-4">
          <Sparkles size={20} className="text-[var(--c-solid)] dark:text-[var(--c-text)]" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--c-text)] dark:text-[var(--c-text)]">{t('cvWidget.createYourCV')}</p>
            <p className="text-xs text-[var(--c-text)] dark:text-[var(--c-text)]">{t('cvWidget.onlyTakesMinutes')}</p>
          </div>
        </div>
      ) : null}

      {/* Quick Actions */}
      <div className="flex gap-2">
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 dark:bg-stone-700 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-300 group-hover:bg-[var(--c-accent)]/40 dark:group-hover:bg-[var(--c-bg)]/40 group-hover:text-[var(--c-text)] dark:group-hover:text-[var(--c-text)] transition-colors">
          <Edit size={12} />
          {hasCV ? t('cvWidget.edit') : t('cvWidget.create')}
        </span>
        {hasCV && (
          <>
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 dark:bg-stone-700 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-300">
              <Eye size={12} />
              {t('cvWidget.preview')}
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 dark:bg-stone-700 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-300">
              <Download size={12} />
              {t('cvWidget.download')}
            </span>
          </>
        )}
      </div>
    </Link>
  )
})

export default CVWidget
