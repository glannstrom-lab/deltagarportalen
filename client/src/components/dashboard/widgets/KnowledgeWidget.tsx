import { memo } from 'react'
import { BookOpen, Bookmark, Eye, Star, TrendingUp, Lightbulb, Clock, ArrowUpRight } from 'lucide-react'
import { DashboardWidget } from '../DashboardWidget'
import type { WidgetStatus } from '@/types/dashboard'

interface KnowledgeWidgetProps {
  readCount?: number
  savedCount?: number
  totalArticles?: number
  recentlyRead?: { id: string; title: string; category: string; readTime?: number }[]
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
      icon={<BookOpen size={22} />}
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
      <div className="mt-3 space-y-3">
        {/* Stort nummer med total */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center">
            <BookOpen size={28} className="text-amber-600" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-slate-800">{readCount}</p>
              {totalArticles > 0 && (
                <p className="text-sm text-slate-400">/ {totalArticles}</p>
              )}
            </div>
            <p className="text-sm text-slate-500">
              {readCount === 0 ? 'Inga artiklar lästa' : readCount === 1 ? 'artikel läst' : 'artiklar lästa'}
            </p>
          </div>
        </div>
        
        {/* Progress bar för läsning */}
        {totalArticles > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Din läs-progress</span>
              <span className="font-medium text-slate-700">{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div 
                className="bg-amber-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Visa senast lästa */}
        {recentlyRead.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-medium">Senast lästa:</p>
            <div className="space-y-2">
              {recentlyRead.slice(0, 2).map((article) => (
                <div 
                  key={article.id}
                  className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl"
                >
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Eye size={14} className="text-amber-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 line-clamp-1">
                      {article.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{article.category}</span>
                      {article.readTime && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {article.readTime} min
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Visa rekommenderad artikel */}
        {recommendedArticle && (
          <div className="p-3 bg-amber-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Star size={14} className="text-amber-500" />
              <span className="text-xs text-slate-500">Rekommenderas för dig:</span>
            </div>
            <p className="text-sm font-medium text-slate-700 line-clamp-2">
              {recommendedArticle.title}
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-500">
                {recommendedArticle.readTime} min läsning • {recommendedArticle.category}
              </span>
              <ArrowUpRight size={14} className="text-amber-500" />
            </div>
          </div>
        )}
        
        {/* Tom state */}
        {readCount === 0 && (
          <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-100">
            <div className="flex items-start gap-3">
              <Lightbulb size={20} className="text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900">Lär dig mer om jobbsökning</p>
                <p className="text-xs text-amber-700 mt-1">
                  Här hittar du artiklar om allt från CV-skrivande 
                  till intervjutips och arbetsmarknadsinfo.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Motivation */}
        {readCount > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <TrendingUp size={14} className="text-emerald-500" />
            <span>Fortsätt läsa för att utveckla dina jobbsökar-skills</span>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
})
