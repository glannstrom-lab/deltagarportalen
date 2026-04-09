import { memo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpen, Bookmark, ChevronRight, Sparkles } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface KnowledgeWidgetProps {
  readCount?: number
  savedCount?: number
  totalArticles?: number
  size?: 'mini' | 'medium' | 'large'
}

export const KnowledgeWidget = memo(function KnowledgeWidget({
  readCount = 0,
  savedCount = 0,
  totalArticles = 50,
  size = 'medium'
}: KnowledgeWidgetProps) {
  const { t } = useTranslation()
  const hasStarted = readCount > 0

  // MINI
  if (size === 'mini') {
    return (
      <Link
        to="/knowledge-base"
        className="group flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-md transition-all duration-200"
      >
        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
          <BookOpen size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t('knowledgeWidget.knowledge')}</p>
          <p className="text-xs text-slate-700 dark:text-slate-600">{t('knowledgeWidget.readCount', { count: readCount })}</p>
        </div>
        {savedCount > 0 && (
          <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded text-xs font-medium">
            {savedCount}
          </span>
        )}
      </Link>
    )
  }

  // MEDIUM
  if (size === 'medium') {
    return (
      <Link
        to="/knowledge-base"
        className="group block bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <BookOpen size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{t('knowledgeWidget.knowledgeBase')}</h3>
              <p className="text-xs text-slate-700 dark:text-slate-600">{t('knowledgeWidget.tipsAndGuides')}</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors" />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{readCount}</span>
          <span className="text-sm text-slate-700 dark:text-slate-600">{t('knowledgeWidget.articlesRead')}</span>
          {savedCount > 0 && (
            <span className="ml-auto flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
              <Bookmark size={10} className="fill-current" />
              {savedCount}
            </span>
          )}
        </div>
      </Link>
    )
  }

  // LARGE
  return (
    <Link
      to="/knowledge-base"
      className="group block bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <BookOpen size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('knowledgeWidget.knowledgeBase')}</h3>
            <p className="text-sm text-slate-700 dark:text-slate-600">
              {hasStarted ? t('knowledgeWidget.articlesReadCount', { count: readCount }) : t('knowledgeWidget.exploreArticles')}
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:text-amber-500 dark:group-hover:text-amber-400 mt-1 transition-colors" />
      </div>

      {/* Info Card */}
      {!hasStarted ? (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
            <Sparkles size={24} className="text-amber-500 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">{t('knowledgeWidget.startReading')}</p>
            <p className="text-xs text-amber-600 dark:text-amber-400">{t('knowledgeWidget.tipsDescription')}</p>
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-600">{t('knowledgeWidget.readArticles')}</span>
            <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{readCount}</span>
          </div>
          <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
              style={{ width: `${Math.min(100, (readCount / totalArticles) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-amber-500 dark:text-amber-400" />
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{readCount}</span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-600">{t('knowledgeWidget.read')}</p>
        </div>
        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Bookmark size={16} className="text-orange-500 dark:text-orange-400 fill-current" />
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{savedCount}</span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-600">{t('knowledgeWidget.saved')}</p>
        </div>
      </div>

      {/* Action */}
      <div className="flex gap-2">
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-medium group-hover:bg-amber-200 dark:group-hover:bg-amber-900/60 transition-colors">
          <BookOpen size={12} />
          {hasStarted ? t('knowledgeWidget.continueReading') : t('knowledgeWidget.startReading')}
        </span>
      </div>
    </Link>
  )
})

export default KnowledgeWidget
