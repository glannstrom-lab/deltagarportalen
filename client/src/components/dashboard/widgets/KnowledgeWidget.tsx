import { memo, useState } from 'react'
import { 
  BookOpen, 
  Bookmark, 
  Clock, 
  ArrowRight, 
  Sparkles,
  GraduationCap,
  FileText,
  Target,
  Lightbulb,
  TrendingUp,
  Users,
  Heart,
  PlayCircle,
  ChevronRight,
  Library
} from 'lucide-react'
import { DashboardWidget } from '../DashboardWidget'
import type { WidgetStatus } from '@/types/dashboard'
import type { WidgetSize } from '../WidgetSizeSelector'

interface Article {
  id: string
  title: string
  category: string
  readTime: number
  thumbnail?: string
  isSaved?: boolean
  isNew?: boolean
}

interface KnowledgeWidgetProps {
  readCount?: number
  savedCount?: number
  totalArticles?: number
  recentlyRead?: Article[]
  recommendedArticle?: Article | null
  savedArticles?: Article[]
  categories?: { name: string; count: number; icon: string }[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  size?: WidgetSize
}

// Category colors for badges
const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  'CV-tips': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Intervjutips': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Söka jobb': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Arbetsmarknad': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Karriär': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'Nätverkande': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  'LinkedIn': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'Personlig utveckling': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
}

const getCategoryStyle = (category: string) => {
  return categoryColors[category] || { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' }
}

// Category icon mapping
const getCategoryIcon = (iconName: string) => {
  const icons: Record<string, React.ReactNode> = {
    'file-text': <FileText size={14} />,
    'target': <Target size={14} />,
    'search': <TrendingUp size={14} />,
    'users': <Users size={14} />,
    'lightbulb': <Lightbulb size={14} />,
    'graduation-cap': <GraduationCap size={14} />,
  }
  return icons[iconName] || <BookOpen size={14} />
}

// SMALL - Compact reading stats with saved articles
function KnowledgeWidgetSmall({ 
  readCount = 0, 
  savedCount = 0,
  loading, 
  error, 
  onRetry 
}: Omit<KnowledgeWidgetProps, 'size' | 'totalArticles' | 'recentlyRead' | 'recommendedArticle' | 'savedArticles' | 'categories'>) {
  const getStatus = (): WidgetStatus => {
    if (readCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()
  const hasSaved = savedCount > 0

  return (
    <DashboardWidget
      title="Kunskapsbank"
      icon={<Library size={20} />}
      to="/knowledge-base"
      color="amber"
      status={status}
      progress={readCount > 0 ? 100 : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: readCount > 0 ? 'Fortsätt läsa' : 'Börja läsa',
      }}
    >
      <div className="space-y-3">
        {/* Main stats row */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center shadow-sm">
            <BookOpen size={22} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-800">{readCount}</span>
              <span className="text-xs text-slate-500">
                {readCount === 1 ? 'artikel' : 'artiklar'}
              </span>
            </div>
            <p className="text-xs text-slate-400">lästa</p>
          </div>
        </div>

        {/* Saved articles indicator */}
        {hasSaved ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-100">
            <Bookmark size={14} className="text-amber-500 fill-amber-500" />
            <span className="text-xs font-medium text-amber-700">
              {savedCount} sparad{savedCount !== 1 ? 'e' : ''} för senare
            </span>
          </div>
        ) : readCount === 0 ? (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles size={12} className="text-amber-400" />
            <span>CV-tips & intervjutips</span>
          </div>
        ) : null}
      </div>
    </DashboardWidget>
  )
}

// MEDIUM - Recent articles, categories, saved
function KnowledgeWidgetMedium({ 
  readCount = 0, 
  savedCount = 0, 
  recentlyRead = [],
  savedArticles = [],
  recommendedArticle,
  categories = [],
  loading, 
  error, 
  onRetry 
}: KnowledgeWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (readCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()
  const displayCategories = categories.length > 0 ? categories : [
    { name: 'CV-tips', count: 12, icon: 'file-text' },
    { name: 'Intervjutips', count: 8, icon: 'target' },
    { name: 'Söka jobb', count: 15, icon: 'search' },
  ]

  return (
    <DashboardWidget
      title="Kunskapsbank"
      icon={<Library size={22} />}
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
        label: `Sparade (${savedCount})`,
        onClick: () => {},
      } : undefined}
    >
      <div className="space-y-4">
        {/* Header stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center shadow-sm">
              <BookOpen size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">{readCount}</p>
              <p className="text-xs text-slate-500">lästa artiklar</p>
            </div>
          </div>
          {savedCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-100">
              <Bookmark size={14} className="text-amber-500 fill-amber-500" />
              <span className="text-sm font-semibold text-amber-700">{savedCount}</span>
              <span className="text-xs text-amber-600">sparade</span>
            </div>
          )}
        </div>

        {/* Categories pills */}
        <div className="flex flex-wrap gap-2">
          {displayCategories.slice(0, 4).map((cat) => {
            const style = getCategoryStyle(cat.name)
            return (
              <button
                key={cat.name}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all hover:shadow-sm ${style.bg} ${style.text} ${style.border}`}
              >
                {getCategoryIcon(cat.icon)}
                <span>{cat.name}</span>
                <span className="opacity-60">({cat.count})</span>
              </button>
            )
          })}
        </div>

        {/* Content area - conditional based on state */}
        {readCount === 0 ? (
          /* Empty state for new users */
          <div className="p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-xl border border-amber-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Lightbulb size={20} className="text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-900 mb-1">
                  Börja din läsresa
                </p>
                <p className="text-xs text-amber-700 mb-3">
                  Upptäck artiklar om CV-skrivande, intervjutips och jobbsökning.
                </p>
                <button className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-800">
                  Läs din första artikel
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Recent articles list */
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <Clock size={12} />
              Senast lästa
            </p>
            <div className="space-y-2">
              {(recentlyRead.length > 0 ? recentlyRead : savedArticles).slice(0, 2).map((article) => {
                const catStyle = getCategoryStyle(article.category)
                return (
                  <div 
                    key={article.id}
                    className="group flex items-start gap-3 p-2.5 bg-slate-50 hover:bg-amber-50/50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-amber-100"
                  >
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                      <FileText size={14} className="text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900 truncate">
                        {article.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${catStyle.bg} ${catStyle.text}`}>
                          {article.category}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                          <Clock size={10} />
                          {article.readTime} min
                        </span>
                      </div>
                    </div>
                    {article.isSaved && (
                      <Bookmark size={14} className="text-amber-500 fill-amber-500 flex-shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recommended article if no recent reads */}
        {readCount > 0 && recentlyRead.length === 0 && recommendedArticle && (
          <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-amber-500" />
              <span className="text-xs font-medium text-amber-700">Rekommenderas för dig</span>
            </div>
            <p className="text-sm font-medium text-slate-800 mb-1 line-clamp-1">{recommendedArticle.title}</p>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${getCategoryStyle(recommendedArticle.category).bg} ${getCategoryStyle(recommendedArticle.category).text}`}>
                {recommendedArticle.category}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock size={10} />
                {recommendedArticle.readTime} min
              </span>
            </div>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// LARGE - Grid of articles with thumbnails, category filters, reading history
function KnowledgeWidgetLarge({ 
  readCount = 0, 
  savedCount = 0, 
  totalArticles = 0, 
  recentlyRead = [],
  savedArticles = [],
  recommendedArticle,
  categories = [],
  loading, 
  error, 
  onRetry 
}: KnowledgeWidgetProps) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  
  const getStatus = (): WidgetStatus => {
    if (readCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()
  const progress = totalArticles > 0 ? Math.round((readCount / totalArticles) * 100) : 0

  // Sample articles for grid display
  const sampleArticles: Article[] = [
    { id: '1', title: 'Så skriver du ett CV som sticker ut', category: 'CV-tips', readTime: 5, isNew: true },
    { id: '2', title: '10 vanliga intervjufrågor och hur du svarar', category: 'Intervjutips', readTime: 8 },
    { id: '3', title: 'LinkedIn: Optimera din profil', category: 'LinkedIn', readTime: 6, isSaved: true },
    { id: '4', title: 'Nätverkande för introverta', category: 'Nätverkande', readTime: 4 },
    { id: '5', title: 'Så hanterar du arbetsintervjun digitalt', category: 'Intervjutips', readTime: 7 },
    { id: '6', title: 'Karriärbyte: Steg för steg-guide', category: 'Karriär', readTime: 10, isSaved: true },
  ]

  const displayCategories = categories.length > 0 ? categories : [
    { name: 'CV-tips', count: 12, icon: 'file-text' },
    { name: 'Intervjutips', count: 8, icon: 'target' },
    { name: 'Söka jobb', count: 15, icon: 'search' },
    { name: 'LinkedIn', count: 6, icon: 'users' },
    { name: 'Karriär', count: 9, icon: 'graduation-cap' },
    { name: 'Nätverkande', count: 7, icon: 'users' },
  ]

  const filteredArticles = activeFilter 
    ? sampleArticles.filter(a => a.category === activeFilter)
    : sampleArticles

  return (
    <DashboardWidget
      title="Kunskapsbank"
      icon={<Library size={24} />}
      to="/knowledge-base"
      color="amber"
      status={status}
      progress={readCount > 0 ? 100 : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: 'Utforska alla artiklar',
      }}
      secondaryAction={savedCount > 0 ? {
        label: `Sparade artiklar (${savedCount})`,
        onClick: () => {},
      } : undefined}
    >
      <div className="space-y-5">
        {/* Top stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <BookOpen size={22} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-amber-800">{readCount}</p>
              <p className="text-xs text-amber-600">lästa artiklar</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Bookmark size={22} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-amber-800">{savedCount}</p>
              <p className="text-xs text-amber-600">sparade</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <GraduationCap size={22} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-amber-800">{totalArticles || '50+'}</p>
              <p className="text-xs text-amber-600">artiklar totalt</p>
            </div>
          </div>
        </div>

        {/* Reading progress */}
        {readCount > 0 && (
          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-amber-500" />
                Din läs-progress
              </span>
              <span className="font-semibold text-amber-600">{progress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-400 to-orange-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Empty state for new users */}
        {readCount === 0 ? (
          <div className="p-5 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-xl border border-amber-100">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                <Heart size={28} className="text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold text-amber-900 mb-1">
                  Välkommen till kunskapsbanken!
                </p>
                <p className="text-sm text-amber-700 mb-4">
                  Här hittar du artiklar som hjälper dig i din jobbsökarresa. 
                  Allt från CV-tips till intervjuteknik och karriärråd.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {displayCategories.slice(0, 3).map((cat) => (
                    <button
                      key={cat.name}
                      className="p-3 bg-white rounded-xl text-center shadow-sm hover:shadow-md transition-shadow border border-amber-100"
                    >
                      <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                        {getCategoryIcon(cat.icon)}
                      </div>
                      <p className="text-xs font-medium text-slate-700">{cat.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Category filters */}
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1.5">
                <Sparkles size={12} className="text-amber-400" />
                Filtrera efter kategori
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveFilter(null)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeFilter === null
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Alla
                </button>
                {displayCategories.map((cat) => {
                  const style = getCategoryStyle(cat.name)
                  const isActive = activeFilter === cat.name
                  return (
                    <button
                      key={cat.name}
                      onClick={() => setActiveFilter(isActive ? null : cat.name)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        isActive
                          ? `${style.bg} ${style.text} ${style.border} shadow-sm`
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {getCategoryIcon(cat.icon)}
                      <span>{cat.name}</span>
                      <span className="opacity-60">({cat.count})</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Article cards grid */}
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1.5">
                <BookOpen size={12} />
                {activeFilter ? `Artiklar om ${activeFilter}` : 'Populära artiklar'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {filteredArticles.slice(0, 4).map((article) => {
                  const catStyle = getCategoryStyle(article.category)
                  return (
                    <div
                      key={article.id}
                      className="group p-3 bg-white rounded-xl border border-slate-100 hover:border-amber-200 hover:shadow-md transition-all cursor-pointer"
                    >
                      {/* Thumbnail placeholder */}
                      <div className="w-full h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg mb-2 flex items-center justify-center group-hover:from-amber-200 group-hover:to-orange-200 transition-all">
                        {article.category === 'CV-tips' && <FileText size={24} className="text-amber-600" />}
                        {article.category === 'Intervjutips' && <Target size={24} className="text-amber-600" />}
                        {article.category === 'LinkedIn' && <Users size={24} className="text-amber-600" />}
                        {article.category === 'Nätverkande' && <Heart size={24} className="text-amber-600" />}
                        {article.category === 'Karriär' && <GraduationCap size={24} className="text-amber-600" />}
                        {article.category === 'Söka jobb' && <TrendingUp size={24} className="text-amber-600" />}
                        {!['CV-tips', 'Intervjutips', 'LinkedIn', 'Nätverkande', 'Karriär', 'Söka jobb'].includes(article.category) && (
                          <BookOpen size={24} className="text-amber-600" />
                        )}
                      </div>
                      
                      {/* Category badge */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${catStyle.bg} ${catStyle.text}`}>
                          {article.category}
                        </span>
                        {article.isNew && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">
                            Ny
                          </span>
                        )}
                      </div>
                      
                      {/* Title */}
                      <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900 line-clamp-2 mb-2">
                        {article.title}
                      </p>
                      
                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock size={10} />
                          {article.readTime} min läsning
                        </span>
                        {article.isSaved ? (
                          <Bookmark size={14} className="text-amber-500 fill-amber-500" />
                        ) : (
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Bookmark size={14} className="text-slate-300 hover:text-amber-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Reading history section */}
        {readCount > 0 && recentlyRead.length > 0 && (
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <Clock size={14} className="text-amber-500" />
                Fortsätt där du slutade
              </p>
              <button className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-0.5">
                Visa alla
                <ChevronRight size={12} />
              </button>
            </div>
            <div className="space-y-2">
              {recentlyRead.slice(0, 2).map((article) => {
                const catStyle = getCategoryStyle(article.category)
                return (
                  <div 
                    key={article.id}
                    className="group flex items-center gap-3 p-2 bg-white rounded-lg hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <PlayCircle size={18} className="text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900 truncate">
                        {article.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${catStyle.bg} ${catStyle.text}`}>
                          {article.category}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {article.readTime} min kvar
                        </span>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-slate-300 group-hover:text-amber-400 transition-colors" />
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// Main component
export const KnowledgeWidget = memo(function KnowledgeWidget(props: KnowledgeWidgetProps) {
  const { size = 'small', ...rest } = props

  switch (size) {
    case 'large':
      return <KnowledgeWidgetLarge {...rest} size={size} />
    case 'medium':
      return <KnowledgeWidgetMedium {...rest} size={size} />
    case 'small':
    default:
      return <KnowledgeWidgetSmall {...rest} size={size} />
  }
})
