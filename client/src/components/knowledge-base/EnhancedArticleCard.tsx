/**
 * Enhanced Article Card
 * Accessible, WCAG 2.1 AA compliant article card
 */

import { Link } from 'react-router-dom'
import { ChevronRight, Bookmark, Star, Tag, Dumbbell, Clock } from 'lucide-react'
import ReadingTime from './ReadingTime'
import DifficultyBadge from './DifficultyBadge'
import { cn } from '@/lib/utils'

interface EnhancedArticleCardProps {
  article: {
    id: string
    title: string
    summary: string
    category: string
    tags?: string | string[]
    readingTime?: number
    difficulty?: 'easy' | 'medium' | 'detailed'
    helpfulnessRating?: number
    bookmarkCount?: number
    author?: string
    relatedExercises?: string[]
    energyLevel?: 'low' | 'medium' | 'high'
  }
  variant?: 'default' | 'compact' | 'featured'
  onClick?: () => void
  index?: number // For ARIA
  total?: number // For ARIA
}

export default function EnhancedArticleCard({ 
  article, 
  variant = 'default',
  onClick,
  index,
  total,
}: EnhancedArticleCardProps) {
  const tags = article.tags 
    ? Array.isArray(article.tags) 
      ? article.tags.slice(0, 3) 
      : article.tags.split(',').slice(0, 3)
    : []
  
  // Build ARIA label for accessibility
  const ariaLabel = [
    `Artikel: ${article.title}`,
    `Kategori: ${article.category}`,
    article.readingTime && `Lästid: ${article.readingTime} minuter`,
    article.difficulty && `Svårighetsgrad: ${article.difficulty === 'easy' ? 'Enkel' : article.difficulty === 'medium' ? 'Medel' : 'Detaljerad'}`,
    article.helpfulnessRating && `Betyg: ${article.helpfulnessRating} av 5`,
    index !== undefined && total !== undefined && `Artikel ${index + 1} av ${total}`,
  ].filter(Boolean).join('. ')

  if (variant === 'compact') {
    return (
      <Link
        to={`/knowledge-base/article/${article.id}`}
        onClick={onClick}
        className="group flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        aria-label={ariaLabel}
      >
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-800 group-hover:text-teal-700 truncate">
            {article.title}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            {article.readingTime && (
              <ReadingTime minutes={article.readingTime} variant="compact" />
            )}
          </div>
        </div>
        <ChevronRight size={16} className="text-slate-300 group-hover:text-teal-500" />
      </Link>
    )
  }

  if (variant === 'featured') {
    return (
      <Link
        to={`/knowledge-base/article/${article.id}`}
        onClick={onClick}
        className="group block bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-6 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        aria-label={ariaLabel}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <span className="inline-block px-2 py-1 bg-teal-100 text-teal-700 text-xs font-medium rounded-full mb-3">
              {article.category}
            </span>
            <h3 className="text-lg font-semibold text-slate-800 group-hover:text-teal-700 mb-2">
              {article.title}
            </h3>
            <p className="text-slate-600 text-sm line-clamp-2 mb-4">
              {article.summary}
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              {article.readingTime && (
                <ReadingTime minutes={article.readingTime} variant="compact" />
              )}
              {article.helpfulnessRating && (
                <span className="inline-flex items-center gap-1 text-sm text-amber-600">
                  <Star size={14} fill="currentColor" />
                  {article.helpfulnessRating}
                </span>
              )}
            </div>
          </div>
          <ChevronRight size={24} className="text-slate-300 group-hover:text-teal-500 mt-1 shrink-0" />
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={`/knowledge-base/article/${article.id}`}
      onClick={onClick}
      className="group block card hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
      aria-label={ariaLabel}
      role="article"
      aria-posinset={index ? index + 1 : undefined}
      aria-setsize={total}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={cn(
              "inline-block px-2 py-1 text-xs font-medium rounded-full",
              article.energyLevel === 'low' && "bg-sky-100 text-sky-700",
              article.energyLevel === 'medium' && "bg-amber-100 text-amber-700",
              article.energyLevel === 'high' && "bg-rose-100 text-rose-700",
              !article.energyLevel && "bg-teal-100 text-teal-700"
            )}>
              {article.category}
            </span>
            {article.energyLevel && (
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full",
                article.energyLevel === 'low' && "bg-sky-50 text-sky-600",
                article.energyLevel === 'medium' && "bg-amber-50 text-amber-600",
                article.energyLevel === 'high' && "bg-rose-50 text-rose-600",
              )}>
                <Clock className="w-3 h-3" />
                {article.energyLevel === 'low' ? 'Snabb' : article.energyLevel === 'medium' ? 'Medel' : 'Djupgående'}
              </span>
            )}
          </div>
          
          <h3 className="font-semibold text-slate-800 group-hover:text-teal-700 transition-colors mb-2">
            {article.title}
          </h3>
          
          <p className="text-sm text-slate-600 line-clamp-2 mb-3">
            {article.summary}
          </p>
          
          {/* Relaterade övningar */}
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
            
            {article.helpfulnessRating && (
              <span className="inline-flex items-center gap-1 text-sm text-amber-600">
                <Star size={14} fill="currentColor" />
                <span>{article.helpfulnessRating}</span>
              </span>
            )}
            
            {article.bookmarkCount !== undefined && article.bookmarkCount > 0 && (
              <span className="inline-flex items-center gap-1 text-sm text-slate-500">
                <Bookmark size={14} />
                <span>{article.bookmarkCount}</span>
              </span>
            )}
          </div>
          
          {tags.length > 0 && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {tags.map((tag, i) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs text-slate-500"
                >
                  <Tag size={10} />
                  {tag.trim()}
                  {i < tags.length - 1 && <span className="text-slate-300">•</span>}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <ChevronRight size={20} className="text-slate-300 group-hover:text-teal-500 mt-1 shrink-0" />
      </div>
    </Link>
  )
}
