/**
 * Enhanced Article Card
 */

import { Link } from 'react-router-dom'
import { ChevronRight, Tag, Dumbbell } from '@/components/ui/icons'
import ReadingTime from './ReadingTime'
import DifficultyBadge from './DifficultyBadge'
import { articleCategories } from '@/services/articleData'
import { cn } from '@/lib/utils'

// Create a map from category ID to Swedish name
const categoryNameMap: Record<string, string> = {}
articleCategories.forEach(cat => {
  categoryNameMap[cat.id] = cat.name
  cat.subcategories?.forEach(sub => {
    categoryNameMap[sub.id] = sub.name
  })
})

interface EnhancedArticleCardProps {
  article: {
    id: string
    title: string
    summary: string
    category: string
    tags?: string | string[]
    readingTime?: number
    difficulty?: 'easy-swedish' | 'easy' | 'medium' | 'detailed'
    author?: string
    relatedExercises?: string[]
  }
  variant?: 'default' | 'compact' | 'featured'
}

export default function EnhancedArticleCard({ 
  article, 
  variant = 'default',
}: EnhancedArticleCardProps) {
  const tags = article.tags 
    ? Array.isArray(article.tags) 
      ? article.tags.slice(0, 3) 
      : article.tags.split(',').slice(0, 3)
    : []
  
  // Build article URL
  const articleUrl = `/knowledge-base/article/${article.id}`

  if (variant === 'compact') {
    return (
      <Link
        to={articleUrl}
        className="group flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)] focus:ring-offset-2"
      >
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-stone-800 group-hover:text-[var(--c-text)] truncate">
            {article.title}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            {article.readingTime && (
              <ReadingTime minutes={article.readingTime} variant="compact" />
            )}
          </div>
        </div>
        <ChevronRight size={16} className="text-stone-300 group-hover:text-[var(--c-solid)]" />
      </Link>
    )
  }

  if (variant === 'featured') {
    return (
      <Link
        to={articleUrl}
        className="group block bg-gradient-to-br from-[var(--c-bg)] to-blue-50 rounded-xl p-6 hover:shadow-md transition-all"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <span className="inline-block px-2 py-1 bg-[var(--c-accent)]/40 text-[var(--c-text)] text-xs font-medium rounded-full mb-3">
              {categoryNameMap[article.category] || article.category}
            </span>
            <h3 className="text-lg font-semibold text-stone-800 group-hover:text-[var(--c-text)] mb-2">
              {article.title}
            </h3>
            <p className="text-stone-600 text-sm line-clamp-2 mb-4">
              {article.summary}
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              {article.readingTime && (
                <ReadingTime minutes={article.readingTime} variant="compact" />
              )}
            </div>
          </div>
          <ChevronRight size={24} className="text-stone-300 group-hover:text-[var(--c-solid)] mt-1 shrink-0" />
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={articleUrl}
      className="group block card hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-[var(--c-accent)]/40 text-[var(--c-text)]">
              {categoryNameMap[article.category] || article.category}
            </span>
          </div>
          
          <h3 className="font-semibold text-stone-800 group-hover:text-[var(--c-text)] transition-colors mb-2">
            {article.title}
          </h3>
          
          <p className="text-sm text-stone-600 line-clamp-2 mb-3">
            {article.summary}
          </p>
          
          {article.relatedExercises && article.relatedExercises.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <Dumbbell size={14} className="text-indigo-500" />
              <span className="text-xs text-indigo-600 font-medium">
                {article.relatedExercises.length} relaterad{article.relatedExercises.length > 1 ? 'a' : ''} övning{article.relatedExercises.length > 1 ? 'ar' : ''}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-3 flex-wrap">
            {article.readingTime && (
              <ReadingTime minutes={article.readingTime} variant="compact" />
            )}
            
            {article.difficulty && (
              <DifficultyBadge level={article.difficulty} size="sm" />
            )}
          </div>
          
          {tags.length > 0 && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {tags.map((tag, i) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs text-stone-700"
                >
                  <Tag size={10} />
                  {tag.trim()}
                  {i < tags.length - 1 && <span className="text-stone-300">•</span>}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <ChevronRight size={20} className="text-stone-300 group-hover:text-[var(--c-solid)] mt-1 shrink-0" />
      </div>
    </Link>
  )
}
