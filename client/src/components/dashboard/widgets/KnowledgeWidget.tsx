import { Link } from 'react-router-dom'
import { BookOpen, Bookmark, ChevronRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KnowledgeWidgetProps {
  readCount?: number
  savedCount?: number
  totalArticles?: number
  size?: 'small' | 'medium'
}

export function KnowledgeWidget({
  readCount = 0,
  savedCount = 0,
  totalArticles = 50,
  size = 'small'
}: KnowledgeWidgetProps) {
  const hasStarted = readCount > 0

  if (size === 'small') {
    return (
      <Link
        to="/knowledge-base"
        className={cn(
          "group block bg-white p-4 rounded-2xl border-2 transition-all duration-200",
          "hover:border-amber-300 hover:shadow-lg hover:-translate-y-0.5",
          "focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2",
          "border-slate-200"
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <BookOpen size={18} />
            </div>
            <h3 className="font-semibold text-slate-800 text-sm">Kunskap</h3>
          </div>
          <ChevronRight
            size={16}
            className="text-slate-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-800">{readCount}</span>
            <span className="text-sm text-slate-500">{readCount === 1 ? 'läst' : 'lästa'}</span>
          </div>

          {savedCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
              <Bookmark size={10} className="fill-current" />
              {savedCount}
            </span>
          )}
        </div>

        {!hasStarted && (
          <p className="text-xs text-amber-600 mt-2">Utforska artiklar</p>
        )}
      </Link>
    )
  }

  // Medium size
  return (
    <Link
      to="/knowledge-base"
      className={cn(
        "group block bg-white p-5 rounded-2xl border-2 transition-all duration-200",
        "hover:border-amber-300 hover:shadow-xl hover:-translate-y-0.5",
        "focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2",
        "border-slate-200"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600 flex items-center justify-center shadow-sm">
            <BookOpen size={22} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Kunskapsbank</h3>
            <p className="text-xs text-slate-500">
              {hasStarted ? `${readCount} artiklar lästa` : 'Utforska artiklar'}
            </p>
          </div>
        </div>
        <ChevronRight
          size={18}
          className="text-slate-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all mt-1"
        />
      </div>

      {/* Info card */}
      {!hasStarted ? (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 border border-amber-100 mb-3">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <Sparkles size={24} className="text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">Börja läsa</p>
            <p className="text-xs text-amber-600">Tips om CV, intervjuer och jobbsökning</p>
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Lästa artiklar</span>
            <span className="text-lg font-bold text-amber-600">{readCount}</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-amber-400 to-orange-500"
              style={{ width: `${Math.min(100, (readCount / totalArticles) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-amber-50 rounded-xl">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-amber-500" />
            <span className="text-lg font-bold text-slate-800">{readCount}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Lästa</p>
        </div>
        <div className="p-3 bg-orange-50 rounded-xl">
          <div className="flex items-center gap-2">
            <Bookmark size={16} className="text-orange-500 fill-current" />
            <span className="text-lg font-bold text-slate-800">{savedCount}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Sparade</p>
        </div>
      </div>
    </Link>
  )
}

export default KnowledgeWidget
