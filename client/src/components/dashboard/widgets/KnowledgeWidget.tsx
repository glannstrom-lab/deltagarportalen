import { memo } from 'react'
import { BookOpen, Bookmark, Eye, Star, TrendingUp } from 'lucide-react'
import { DashboardWidget } from '../DashboardWidget'
import type { WidgetStatus } from '@/types/dashboard'

interface KnowledgeWidgetProps {
  readCount?: number
  savedCount?: number
  totalArticles?: number
  recentlyRead?: { id: string; title: string; category: string }[]
  recommendedArticle?: { title: string; readTime: number; category: string } | null
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

export const KnowledgeWidget = memo(function KnowledgeWidget({
  readCount = 0,
  savedCount = 0,
  totalArticles = 0,
  recentlyRead = [],
  recommendedArticle,
  loading,
  error,
  onRetry,
}: KnowledgeWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (readCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  // Beräkna progress genom artiklar
  const progress = totalArticles > 0 ? Math.round((readCount / totalArticles) * 100) : 0

  return (
    <DashboardWidget
      title="Kunskapsbank"
      icon={<BookOpen size={20} />}
      to="/knowledge"
      color="amber"
      status={status}
      progress={Math.min(100, progress)}
      loading={loading}
      error={error}
      onRetry={onRetry}
      stats={[
        { label: 'Lästa artiklar', value: readCount },
        ...(savedCount > 0 ? [{ label: 'Sparade', value: savedCount }] : []),
      ]}
      primaryAction={{
        label: readCount > 0 ? 'Läs mer' : 'Utforska',
      }}
    >
      {/* Visa senast lästa */}
      {recentlyRead.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-slate-500 mb-1">Senast lästa:</p>
          <div className="space-y-2">
            {recentlyRead.slice(0, 2).map((article) => (
              <div 
                key={article.id}
                className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg"
              >
                <Eye size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {article.title}
                  </p>
                  <p className="text-xs text-slate-500">{article.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Visa rekommenderad artikel */}
      {recommendedArticle && (
        <div className="mt-2">
          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <Star size={12} className="text-amber-500" />
            Rekommenderas:
          </p>
          <div className="p-2 bg-amber-50 rounded-lg">
            <p className="text-sm font-medium text-slate-700 line-clamp-2">
              {recommendedArticle.title}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {recommendedArticle.readTime} min läsning • {recommendedArticle.category}
            </p>
          </div>
        </div>
      )}
      
      {/* Tom state */}
      {readCount === 0 && (
        <div className="mt-2 p-3 bg-amber-50 rounded-lg">
          <p className="text-sm text-amber-700">
            Här hittar du artiklar om allt från CV-skrivande 
            till intervjutips och arbetsmarknadsinfo.
          </p>
        </div>
      )}
      
      {/* Visa progress mot alla artiklar */}
      {totalArticles > 0 && (
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <TrendingUp size={14} className="text-emerald-500" />
          <span>{readCount} av {totalArticles} artiklar lästa</span>
        </div>
      )}
    </DashboardWidget>
  )
})
