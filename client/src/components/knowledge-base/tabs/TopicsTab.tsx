/**
 * Topics Tab - Browse all articles by category
 * Enhanced with energy filter and zen mode
 */

import { useState, useMemo } from 'react'
import { BookOpen, Grid, List, SlidersHorizontal } from '@/components/ui/icons'
import EnhancedArticleCard from '../EnhancedArticleCard'
import CategoryFilter from '../CategoryFilter'
import { EnergyFilter } from '../EnergyFilter'
import { ZenModeToggle, ZenArticleCard } from '../ZenModeToggle'
import { Card } from '@/components/ui'
import type { Article } from '@/types/knowledge'

interface Category {
  id: string
  name: string
  slug?: string
  subcategories?: Array<{
    id: string
    name: string
    slug?: string
  }>
}

interface TopicsTabProps {
  articles: Article[]
  categories: Category[]
  energyLevel: 'low' | 'medium' | 'high'
  onEnergyLevelChange: (level: 'low' | 'medium' | 'high') => void
}

export default function TopicsTab({ articles, categories, energyLevel, onEnergyLevelChange }: TopicsTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSubcategory, setSelectedSubcategory] = useState('')
  const [energyFilter, setEnergyFilter] = useState<'low' | 'medium' | 'high' | null>(null)
  const [isZenMode, setIsZenMode] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Calculate article counts by energy level
  const articleCounts = useMemo(() => ({
    low: articles.filter(a => a.readingTime && a.readingTime <= 5).length,
    medium: articles.filter(a => a.readingTime && a.readingTime > 5 && a.readingTime <= 15).length,
    high: articles.filter(a => a.readingTime && a.readingTime > 15).length,
  }), [articles])
  
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
      
      // Subcategory filter
      if (selectedSubcategory && article.subcategory !== selectedSubcategory) {
        return false
      }
      
      // Energy filter
      if (energyFilter) {
        if (energyFilter === 'low' && article.readingTime && article.readingTime > 5) return false
        if (energyFilter === 'medium' && article.readingTime && (article.readingTime <= 5 || article.readingTime > 15)) return false
        if (energyFilter === 'high' && article.readingTime && article.readingTime <= 15) return false
      }
      
      return true
    })
  }, [articles, searchQuery, selectedCategory, selectedSubcategory, energyFilter])
  
  const handleCategoryChange = (category: string, subcategory: string) => {
    setSelectedCategory(category)
    setSelectedSubcategory(subcategory)
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar filters */}
      <div className="lg:col-span-1 space-y-4">
        <Card variant="elevated" className="sticky top-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <SlidersHorizontal size={18} />
              Filter
            </h3>
            <ZenModeToggle isZenMode={isZenMode} onToggle={setIsZenMode} />
          </div>
          
          {/* Energy filter */}
          <div className="mb-6">
            <EnergyFilter
              selectedLevel={energyFilter}
              onChange={setEnergyFilter}
              articleCount={articleCounts}
            />
          </div>
          
          {/* Category filter */}
          <CategoryFilter
            selectedCategory={selectedCategory}
            selectedSubcategory={selectedSubcategory}
            onCategoryChange={handleCategoryChange}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </Card>
      </div>
      
      {/* Articles grid/list */}
      <div className="lg:col-span-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {searchQuery || selectedCategory ? 'Sökresultat' : 'Alla artiklar'}
            </h2>
            <p className="text-sm text-slate-500">
              {filteredArticles.length} artiklar
              {energyFilter && ` • ${energyFilter === 'low' ? 'Låg energi' : energyFilter === 'medium' ? 'Medel energi' : 'Hög energi'}`}
            </p>
          </div>
          
          {/* View mode toggle */}
          {!isZenMode && (
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-slate-500'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-slate-500'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        
        {/* Articles */}
        {filteredArticles.length === 0 ? (
          <Card className="text-center py-12">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Inga artiklar matchar dina filter</p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('')
                setSelectedSubcategory('')
                setEnergyFilter(null)
              }}
              className="text-teal-600 hover:underline mt-2"
            >
              Rensa alla filter
            </button>
          </Card>
        ) : isZenMode ? (
          // Zen mode - simplified list
          <div className="space-y-4">
            {filteredArticles.map((article) => (
              <ZenArticleCard
                key={article.id}
                article={{
                  id: article.id,
                  title: article.title,
                  summary: article.summary,
                  readingTime: article.readingTime,
                }}
              />
            ))}
          </div>
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
