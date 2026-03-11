import { useState, useEffect, useMemo } from 'react'
import { articleApi } from '../services/api'
import { 
  EnhancedArticleCard, 
  CategoryFilter,
} from '../components/knowledge-base'
import { 
  BookOpen, 
  Sparkles, 
  Bookmark,
  Lightbulb,
  Target,
  Search,
} from 'lucide-react'
import { PageLayout } from '@/components/layout/index'
import { 
  Card,
  StatCard,
  LoadingState,
  EmptySearch,
  InfoCard,
  Button
} from '@/components/ui'
import { cn } from '@/lib/utils'

interface Article {
  id: string
  title: string
  summary: string
  category: string
  subcategory?: string
  tags?: string | string[]
  createdAt: string
  readingTime?: number
  difficulty?: 'easy' | 'medium' | 'detailed'
  helpfulnessRating?: number
  bookmarkCount?: number
  author?: string
}

export default function KnowledgeBase() {
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSubcategory, setSelectedSubcategory] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [articlesData, categoriesData] = await Promise.all([
        articleApi.getAll(),
        articleApi.getCategories(),
      ])
      setArticles(articlesData)
      setCategories(categoriesData)
    } catch (error) {
      console.error('Fel vid laddning:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
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

      if (selectedCategory && article.category !== selectedCategory) {
        return false
      }

      if (selectedSubcategory && article.subcategory !== selectedSubcategory) {
        return false
      }

      return true
    })
  }, [articles, searchQuery, selectedCategory, selectedSubcategory])

  const featuredArticles = useMemo(() => {
    return [...articles]
      .filter(a => a.helpfulnessRating && a.helpfulnessRating >= 4.8)
      .slice(0, 2)
  }, [articles])

  const recommendedArticles = useMemo(() => {
    return articles.filter(a => 
      a.category === 'getting-started' || 
      (Array.isArray(a.tags) 
        ? a.tags.includes('för-nybörjare') 
        : a.tags?.includes('för-nybörjare'))
    ).slice(0, 3)
  }, [articles])

  const getArticlesInProgress = () => {
    const inProgress: string[] = []
    articles.forEach(article => {
      const progress = localStorage.getItem(`article-progress-${article.id}`)
      if (progress && parseInt(progress) > 0 && parseInt(progress) < 100) {
        inProgress.push(article.id)
      }
    })
    return articles.filter(a => inProgress.includes(a.id))
  }

  const articlesInProgress = getArticlesInProgress()

  const handleCategoryChange = (category: string, subcategory: string) => {
    setSelectedCategory(category)
    setSelectedSubcategory(subcategory)
  }

  if (loading) {
    return (
      <PageLayout title="Kunskapsbank" showTabs={false}>
        <LoadingState title="Laddar artiklar..." fullHeight />
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="Kunskapsbank"
      description="Artiklar, guider och verktyg för din jobbsökarresa. Oavsett om du är nybörjare eller erfaren hittar du något som hjälper dig framåt."
      showTabs={false}
      className="max-w-7xl mx-auto"
    >
      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          value={articles.length}
          label="Artiklar"
          icon={<BookOpen className="w-5 h-5" />}
          color="indigo"
        />
        <StatCard
          value={categories.length}
          label="Kategorier"
          icon={<Target className="w-5 h-5" />}
          color="blue"
        />
        <InfoCard 
          variant="info"
          icon={<Lightbulb className="w-5 h-5" />}
          title="Tips"
        >
          Använd filter för att hitta rätt innehåll
        </InfoCard>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card variant="elevated" className="sticky top-4">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-600" />
              Filter & Sök
            </h3>
            <CategoryFilter
              selectedCategory={selectedCategory}
              selectedSubcategory={selectedSubcategory}
              onCategoryChange={handleCategoryChange}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </Card>
        </div>

        {/* Articles area */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Featured articles */}
          {!searchQuery && !selectedCategory && featuredArticles.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Sparkles size={20} className="text-amber-500" />
                Mest uppskattade artiklar
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {featuredArticles.map((article) => (
                  <EnhancedArticleCard 
                    key={article.id} 
                    article={article} 
                    variant="featured"
                  />
                ))}
              </div>
            </section>
          )}

          {/* Continue reading */}
          {!searchQuery && !selectedCategory && articlesInProgress.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Bookmark size={20} className="text-indigo-600" />
                Fortsätt läsa
              </h2>
              <Card variant="flat" className="bg-amber-50/50 border-amber-100">
                <div className="space-y-2">
                  {articlesInProgress.map((article) => (
                    <EnhancedArticleCard 
                      key={article.id} 
                      article={article} 
                      variant="compact"
                    />
                  ))}
                </div>
              </Card>
            </section>
          )}

          {/* Recommended for new users */}
          {!searchQuery && !selectedCategory && recommendedArticles.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Target size={20} className="text-blue-600" />
                Komma igång
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendedArticles.map((article) => (
                  <EnhancedArticleCard 
                    key={article.id} 
                    article={article} 
                  />
                ))}
              </div>
            </section>
          )}

          {/* All/Filtered articles */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">
                {searchQuery || selectedCategory ? 'Sökresultat' : 'Alla artiklar'}
              </h2>
              <span className="text-sm text-slate-500">
                {filteredArticles.length} artiklar
              </span>
            </div>

            {filteredArticles.length === 0 ? (
              <Card className="text-center py-12">
                <EmptySearch
                  query={searchQuery}
                  onClear={() => {
                    setSearchQuery('')
                    setSelectedCategory('')
                    setSelectedSubcategory('')
                  }}
                />
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredArticles.map((article) => (
                  <EnhancedArticleCard 
                    key={article.id} 
                    article={article}
                  />
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </PageLayout>
  )
}
