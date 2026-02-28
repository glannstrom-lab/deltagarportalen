import { memo } from 'react'
import { BookOpen, Bookmark, Eye, Star, Lightbulb, Clock, ArrowRight, Search } from 'lucide-react'
import { DashboardWidget } from '../DashboardWidget'
import type { WidgetStatus } from '@/types/dashboard'
import type { WidgetSize } from '../WidgetSizeSelector'

interface KnowledgeWidgetProps {
  readCount?: number
  savedCount?: number
  totalArticles?: number
  recentlyRead?: { id: string; title: string; category: string; readTime?: number }[]
  recommendedArticle?: { title: string; readTime: number; category: string } | null
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  size?: WidgetSize
}

// SMALL - Enkel räknare
function KnowledgeWidgetSmall({ readCount = 0, loading, error, onRetry }: Omit<KnowledgeWidgetProps, 'size' | 'savedCount' | 'totalArticles' | 'recentlyRead' | 'recommendedArticle'>) {
  const getStatus = (): WidgetStatus => {
    if (readCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  return (
    <DashboardWidget
      title="Kunskap"
      icon={<BookOpen size={20} />}
      to="/knowledge-base"
      color="amber"
      status={status}
      progress={readCount > 0 ? 100 : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: readCount > 0 ? 'Läs mer' : 'Utforska',
      }}
    >
      <div className="flex flex-col items-center justify-center py-2 text-center">
        <BookOpen size={28} className="text-amber-500 mb-2" />
        <p className="text-3xl font-bold text-slate-800">{readCount}</p>
        <p className="text-sm text-slate-500">
          {readCount === 0 ? 'Inga artiklar' : readCount === 1 ? 'artikel' : 'artiklar'}
        </p>
      </div>
    </DashboardWidget>
  )
}

// MEDIUM - Senaste lästa + rekommendation
function KnowledgeWidgetMedium({ readCount = 0, savedCount = 0, recentlyRead = [], recommendedArticle, loading, error, onRetry }: KnowledgeWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (readCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  return (
    <DashboardWidget
      title="Kunskapsbank"
      icon={<BookOpen size={22} />}
      to="/knowledge-base"
      color="amber"
      status={status}
      progress={readCount > 0 ? 100 : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: 'Fortsätt läsa',
      }}
    >
      <div className="space-y-3">
        {/* Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <BookOpen size={24} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{readCount}</p>
              <p className="text-xs text-slate-500">lästa artiklar</p>
            </div>
          </div>
          {savedCount > 0 && (
            <div className="text-right">
              <p className="text-lg font-semibold text-amber-600">{savedCount}</p>
              <p className="text-xs text-slate-500">sparade</p>
            </div>
          )}
        </div>

        {/* Rekommenderad artikel */}
        {recommendedArticle && (
          <div className="p-3 bg-amber-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Star size={14} className="text-amber-500" />
              <span className="text-xs font-medium text-amber-700">Rekommenderas:</span>
            </div>
            <p className="text-sm font-medium text-slate-800 mb-1">{recommendedArticle.title}</p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{recommendedArticle.category}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {recommendedArticle.readTime} min
              </span>
            </div>
          </div>
        )}

        {/* Senaste lästa */}
        {recentlyRead.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400">Senast lästa:</p>
            <div className="space-y-1.5">
              {recentlyRead.slice(0, 2).map((article) => (
                <div 
                  key={article.id}
                  className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg"
                >
                  <Eye size={14} className="text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{article.title}</p>
                    <p className="text-xs text-slate-500">{article.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {readCount === 0 && (
          <div className="p-3 bg-amber-50 rounded-lg">
            <p className="text-sm text-amber-700">Lär dig mer om jobbsökning</p>
            <p className="text-xs text-amber-600 mt-1">CV-tips, intervjutips och mer</p>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// LARGE - Full kunskapsnavigering
function KnowledgeWidgetLarge({ readCount = 0, savedCount = 0, totalArticles = 0, recentlyRead = [], recommendedArticle, loading, error, onRetry }: KnowledgeWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (readCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()
  const progress = totalArticles > 0 ? Math.round((readCount / totalArticles) * 100) : 0

  return (
    <DashboardWidget
      title="Kunskapsbank"
      icon={<BookOpen size={24} />}
      to="/knowledge-base"
      color="amber"
      status={status}
      progress={readCount > 0 ? 100 : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: 'Utforska artiklar',
      }}
      secondaryAction={savedCount > 0 ? {
        label: 'Sparade',
        onClick: () => {},
      } : undefined}
    >
      <div className="space-y-4">
        {/* Header med stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <BookOpen size={24} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{readCount}</p>
              <p className="text-xs text-amber-600">lästa</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Bookmark size={24} className="text-slate-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-700">{savedCount}</p>
              <p className="text-xs text-slate-600">sparade</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Eye size={24} className="text-slate-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-700">{totalArticles || '--'}</p>
              <p className="text-xs text-slate-600">totalt</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {totalArticles > 0 && (
          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600">Din läs-progress</span>
              <span className="font-medium text-slate-800">{progress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-amber-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Grid: Rekommendation + Senaste */}
        <div className="grid grid-cols-2 gap-4">
          {/* Rekommenderad artikel */}
          {recommendedArticle && (
            <div className="p-4 bg-amber-50 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Star size={18} className="text-amber-500" />
                <span className="text-sm font-medium text-amber-700">Rekommenderas för dig</span>
              </div>
              <p className="font-medium text-slate-800 mb-2">{recommendedArticle.title}</p>
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                <span>{recommendedArticle.category}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {recommendedArticle.readTime} min
                </span>
              </div>
              <button className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium">
                Läs nu
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* Senaste lästa */}
          {recentlyRead.length > 0 ? (
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Eye size={18} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Senast lästa</span>
              </div>
              <div className="space-y-2">
                {recentlyRead.slice(0, 2).map((article) => (
                  <div 
                    key={article.id}
                    className="flex items-start gap-2 p-2 bg-white rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
                  >
                    <BookOpen size={14} className="text-amber-500 mt-1" />
                    <div>
                      <p className="text-sm text-slate-700 line-clamp-1">{article.title}</p>
                      <p className="text-xs text-slate-400">{article.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-center">
              <p className="text-sm text-slate-400">Inga lästa artiklar än</p>
            </div>
          )}
        </div>

        {/* Empty state */}
        {readCount === 0 && !recommendedArticle && (
          <div className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-100">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Lightbulb size={32} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-amber-900 mb-2">Lär dig mer om jobbsökning</p>
                <p className="text-sm text-amber-700 mb-4">
                  Här hittar du artiklar om allt från CV-skrivande till intervjutips 
                  och arbetsmarknadsinfo. Bygg dina kunskaper steg för steg.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-white rounded-xl text-center">
                    <BookOpen size={20} className="text-amber-500 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-700">CV-tips</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl text-center">
                    <Search size={20} className="text-amber-500 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-700">Intervjutips</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl text-center">
                    <Eye size={20} className="text-amber-500 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-700">Marknadsinfo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// Huvudkomponent
export const KnowledgeWidget = memo(function KnowledgeWidget(props: KnowledgeWidgetProps) {
  const { size = 'small', ...rest } = props

  switch (size) {
    case 'large':
      return <KnowledgeWidgetLarge {...rest} />
    case 'medium':
      return <KnowledgeWidgetMedium {...rest} />
    case 'small':
    default:
      return <KnowledgeWidgetSmall {...rest} />
  }
})
