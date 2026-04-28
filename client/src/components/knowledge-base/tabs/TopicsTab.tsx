/**
 * Topics Tab - Browse all articles by category
 * Simplified version without energy filter and zen mode
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, Grid, List, SlidersHorizontal, Search } from '@/components/ui/icons'
import EnhancedArticleCard from '../EnhancedArticleCard'
import { Card, Input } from '@/components/ui'
import { articleCategories } from '@/services/articleData'
import type { Article } from '@/types/knowledge'

// Create a map from category ID to Swedish name
const categoryNameMap: Record<string, string> = {}
articleCategories.forEach(cat => {
  categoryNameMap[cat.id] = cat.name
  cat.subcategories?.forEach(sub => {
    categoryNameMap[sub.id] = sub.name
  })
})

interface TopicsTabProps {
  articles: Article[]
}

export default function TopicsTab({ articles }: TopicsTabProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Get unique categories from articles
  const categories = useMemo(() => {
    const cats = new Set<string>()
    articles.forEach(article => {
      if (article.category) {
        cats.add(article.category)
      }
    })
    return Array.from(cats).sort()
  }, [articles])

  // Filter articles
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      // Search filter
      if (searchQuery) {
        const search = searchQuery.toLowerCase()
        const matchesSearch =
          article.title.toLowerCase().includes(search) ||
          article.summary.toLowerCase().includes(search) ||
          (article.tags && (Array.isArray(article.tags)
            ? article.tags.some(t => t.toLowerCase().includes(search))
            : article.tags.toLowerCase().includes(search)))
        if (!matchesSearch) return false
      }

      // Category filter
      if (selectedCategory && article.category !== selectedCategory) {
        return false
      }

      return true
    })
  }, [articles, searchQuery, selectedCategory])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar filters */}
      <div className="lg:col-span-1 space-y-4">
        <Card variant="elevated" className="sticky top-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-stone-800 flex items-center gap-2">
              <SlidersHorizontal size={18} />
              {t('knowledgeBase.topics.filter')}
            </h3>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600" />
              <Input
                type="text"
                placeholder={t('knowledgeBase.topics.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category filter */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-stone-700">
              {t('knowledgeBase.topics.categories')}
            </h4>
            <button
              onClick={() => setSelectedCategory('')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                !selectedCategory
                  ? 'bg-[var(--c-accent)]/40 text-[var(--c-text)] font-medium'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {t('knowledgeBase.topics.allCategories')} ({articles.length})
            </button>
            {categories.map((category) => {
              const count = articles.filter(a => a.category === category).length
              const displayName = categoryNameMap[category] || category
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === category
                      ? 'bg-[var(--c-accent)]/40 text-[var(--c-text)] font-medium'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {displayName} ({count})
                </button>
              )
            })}
          </div>

          {/* Clear filters */}
          {(searchQuery || selectedCategory) && (
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('')
              }}
              className="w-full mt-4 text-sm text-[var(--c-text)] hover:underline"
            >
              {t('knowledgeBase.topics.clearFilters')}
            </button>
          )}
        </Card>
      </div>

      {/* Articles grid/list */}
      <div className="lg:col-span-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">
              {searchQuery || selectedCategory
                ? t('knowledgeBase.topics.searchResults')
                : t('knowledgeBase.topics.allArticles')}
            </h2>
            <p className="text-sm text-stone-700">
              {filteredArticles.length} {t('knowledgeBase.topics.articles')}
            </p>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-2 bg-stone-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-stone-700'}`}
              aria-label={t('knowledgeBase.topics.gridView')}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-stone-700'}`}
              aria-label={t('knowledgeBase.topics.listView')}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Articles */}
        {filteredArticles.length === 0 ? (
          <Card className="text-center py-12">
            <BookOpen className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-700">{t('knowledgeBase.topics.noMatches')}</p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('')
              }}
              className="text-[var(--c-text)] hover:underline mt-2"
            >
              {t('knowledgeBase.topics.clearFilters')}
            </button>
          </Card>
        ) : viewMode === 'grid' ? (
          // Grid view
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredArticles.map((article) => (
              <EnhancedArticleCard
                key={article.id}
                article={article}
              />
            ))}
          </div>
        ) : (
          // List view
          <div className="space-y-3">
            {filteredArticles.map((article) => (
              <EnhancedArticleCard
                key={article.id}
                article={article}
                variant="compact"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
