/**
 * Artikelkort.
 *
 * Två saker rättade 2026-08-22:
 *
 * 1. **Inga `dark:`-varianter fanns.** `.card` byter bakgrund med temat
 *    (`--bg-card` → `#1c1917`), men texten satt fast på `text-stone-800/700/600`.
 *    Uppmätt: kortrubriken 1,15:1, taggarna 1,70:1, sammanfattningen 2,28:1 —
 *    mot kravet 4,5:1. Elva kortrubriker per skärm var i praktiken osynliga.
 * 2. **Kategorinamnet slogs upp i en lokal karta byggd ur `articleCategories`**,
 *    som plattade ihop huvud- och underkategorier. Tre id:n fanns i båda, och
 *    det sista vann — så `job-search` och `interview` tappade sina namn. Nu
 *    kommer namnet ur `data/artikelkategorier.ts`, samma register som
 *    landningen och artikelsidan läser.
 */

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Tag, Dumbbell } from '@/components/ui/icons'
import ReadingTime from './ReadingTime'
import DifficultyBadge from './DifficultyBadge'
import { kategoriNamn } from '@/data/artikelkategorier'

interface EnhancedArticleCardProps {
  article: {
    id: string
    title: string
    summary: string
    category: string
    tags?: string[]
    readingTime?: number
    difficulty?: 'easy-swedish' | 'easy' | 'medium' | 'detailed'
    author?: string
    relatedExercises?: string[]
  }
  variant?: 'default' | 'compact'
  /** Rubriknivå. Listläget ligger under en `h2`, gridläget likaså — men
   *  kompaktvarianten satt fast på `h4` och gav ett hopp h2→h4. */
  headingLevel?: 'h3' | 'h4'
}

export default function EnhancedArticleCard({
  article,
  variant = 'default',
  headingLevel = 'h3',
}: EnhancedArticleCardProps) {
  const { t } = useTranslation()
  const Rubrik = headingLevel
  const tags = (article.tags ?? []).slice(0, 3)
  const articleUrl = `/knowledge-base/article/${article.id}`

  if (variant === 'compact') {
    return (
      <Link
        to={articleUrl}
        className="group flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)] focus:ring-offset-2"
      >
        <div className="flex-1 min-w-0">
          <Rubrik className="font-medium text-stone-800 dark:text-stone-100 group-hover:text-[var(--c-text)] truncate">
            {article.title}
          </Rubrik>
          {article.readingTime && (
            <div className="mt-1">
              <ReadingTime minutes={article.readingTime} variant="compact" />
            </div>
          )}
        </div>
        <ChevronRight size={16} className="text-stone-400 dark:text-stone-500 group-hover:text-[var(--c-solid)]" aria-hidden="true" />
      </Link>
    )
  }

  return (
    <Link to={articleUrl} className="group block card h-full hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-[var(--c-bg)] text-[var(--c-text)] border border-[var(--c-accent)]">
              {kategoriNamn(t, article.category)}
            </span>
          </div>

          <Rubrik className="font-semibold text-stone-900 dark:text-stone-100 group-hover:text-[var(--c-text)] transition-colors mb-2">
            {article.title}
          </Rubrik>

          <p className="text-sm text-stone-600 dark:text-stone-300 line-clamp-2 mb-3">
            {article.summary}
          </p>

          {article.relatedExercises && article.relatedExercises.length > 0 && (
            <div className="flex items-center gap-2 mb-3 text-[var(--c-text)]">
              <Dumbbell size={14} aria-hidden="true" />
              <span className="text-xs font-medium">
                {t('knowledgeBase.relatedExercises', {
                  count: article.relatedExercises.length,
                  defaultValue_one: '1 relaterad övning',
                  defaultValue_other: '{{count}} relaterade övningar',
                  defaultValue: '{{count}} relaterade övningar',
                })}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            {article.readingTime && <ReadingTime minutes={article.readingTime} variant="compact" />}
            {article.difficulty && <DifficultyBadge level={article.difficulty} size="sm" />}
          </div>

          {tags.length > 0 && (
            <ul className="flex items-center gap-2 mt-3 flex-wrap list-none p-0 m-0">
              {tags.map((tag) => (
                <li
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs text-stone-600 dark:text-stone-400"
                >
                  <Tag size={10} aria-hidden="true" />
                  {tag.trim()}
                </li>
              ))}
            </ul>
          )}
        </div>

        <ChevronRight
          size={20}
          className="text-stone-400 dark:text-stone-500 group-hover:text-[var(--c-solid)] mt-1 shrink-0"
          aria-hidden="true"
        />
      </div>
    </Link>
  )
}
