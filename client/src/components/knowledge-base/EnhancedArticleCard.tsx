import { Link } from 'react-router-dom'
import { ChevronRight, Bookmark, Star, Tag } from 'lucide-react'
import EnergyLevelBadge from './EnergyLevelBadge'
import ReadingTime from './ReadingTime'
import DifficultyBadge from './DifficultyBadge'

interface EnhancedArticleCardProps {
  article: {
    id: string
    title: string
    summary: string
    category: string
    tags?: string | string[]
    readingTime?: number
    difficulty?: 'easy' | 'medium' | 'detailed'
    energyLevel?: 'low' | 'medium' | 'high'
    helpfulnessRating?: number
    bookmarkCount?: number
    author?: string
  }
  variant?: 'default' | 'compact' | 'featured'
}

export default function EnhancedArticleCard({ article, variant = 'default' }: EnhancedArticleCardProps) {
  const tags = article.tags 
    ? Array.isArray(article.tags) 
      ? article.tags.slice(0, 3) 
      : article.tags.split(',').slice(0, 3)
    : []

  if (variant === 'compact') {
    return (
      <Link
        to={`/knowledge-base/${article.id}`}
        className="group flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-800 group-hover:text-teal-700 truncate">
            {article.title}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            {article.readingTime && (
              <ReadingTime minutes={article.readingTime} variant="compact" />
            )}
            {article.energyLevel && (
              <EnergyLevelBadge level={article.energyLevel} showLabel={false} size="sm" />
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
        to={`/knowledge-base/${article.id}`}
        className="group block bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-6 hover:shadow-md transition-all"
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
              {article.energyLevel && (
                <EnergyLevelBadge level={article.energyLevel} size="sm" />
              )}
              {article.helpfulnessRating && (
                <span className="inline-flex items-center gap-1 text-sm text-amber-600">
                  <Star size={14} fill="currentColor" />
                  {article.helpfulnessRating}
                </span>
              )}
            </div>
          </div>
          <ChevronRight size={24} className="text-slate-300 group-hover:text-teal-500 mt-1" />
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={`/knowledge-base/${article.id}`}
      className="group block card hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="inline-block px-2 py-1 bg-teal-100 text-teal-700 text-xs font-medium rounded-full">
              {article.category}
            </span>
            {article.energyLevel && (
              <EnergyLevelBadge level={article.energyLevel} showLabel={false} size="sm" />
            )}
          </div>
          
          <h3 className="font-semibold text-slate-800 group-hover:text-teal-700 transition-colors mb-2">
            {article.title}
          </h3>
          
          <p className="text-sm text-slate-600 line-clamp-2 mb-3">
            {article.summary}
          </p>
          
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
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs text-slate-500"
                >
                  <Tag size={10} />
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <ChevronRight size={20} className="text-slate-300 group-hover:text-teal-500 mt-1" />
      </div>
    </Link>
  )
}
