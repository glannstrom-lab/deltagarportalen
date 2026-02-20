import { useState, useEffect, useMemo } from 'react'
import { articleApi } from '../services/api'
import { 
  EnhancedArticleCard, 
  CategoryFilter,
} from '../components/knowledge-base'
import { 
  BookOpen, 
  Sparkles, 
  Zap, 
  Bookmark,
  Lightbulb,
  Target,
} from 'lucide-react'


interface Article {
  id: string
  title: string
  summary: string
  category: string
  subcategory?: string
  tags?: string
  createdAt: string
  readingTime?: number
  difficulty?: 'easy' | 'medium' | 'detailed'
  energyLevel?: 'low' | 'medium' | 'high'
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
  const [energyFilter, setEnergyFilter] = useState('')

  // Load articles
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

  // Filter articles
  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      // Search filter
      if (searchQuery) {
        const search = searchQuery.toLowerCase()
        const matchesSearch = 
          article.title.toLowerCase().includes(search) ||
          article.summary.toLowerCase().includes(search) ||
          (article.tags && article.tags.toLowerCase().includes(search))
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
      if (energyFilter && article.energyLevel !== energyFilter) {
        return false
      }

      return true
    })
  }, [articles, searchQuery, selectedCategory, selectedSubcategory, energyFilter])

  // Get featured articles (highest rated)
  const featuredArticles = useMemo(() => {
    return [...articles]
      .filter(a => a.helpfulnessRating && a.helpfulnessRating >= 4.8)
      .slice(0, 2)
  }, [articles])

  // Get recommended for new users
  const recommendedArticles = useMemo(() => {
    return articles.filter(a => 
      a.category === 'getting-started' || 
      a.tags?.includes('för-nybörjare')
    ).slice(0, 3)
  }, [articles])

  // Get low energy articles
  const lowEnergyArticles = useMemo(() => {
    return articles.filter(a => a.energyLevel === 'low').slice(0, 3)
  }, [articles])

  // Get articles in progress
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <BookOpen className="text-teal-600" size={32} />
          Kunskapsbank
        </h1>
        <p className="text-slate-600 mt-2 max-w-2xl">
          Artiklar, guider och verktyg för din jobbsökarresa. 
          Oavsett om du är nybörjare eller erfaren hittar du något som hjälper dig framåt.
        </p>
      </div>

      {/* Quick stats / Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
            <BookOpen size={20} className="text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{articles.length}</p>
            <p className="text-sm text-slate-600">Artiklar</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Target size={20} className="text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{categories.length}</p>
            <p className="text-sm text-slate-600">Kategorier</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <Lightbulb size={20} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">Tips</p>
            <p className="text-sm text-slate-600">Använd filter för att hitta rätt innehåll för din energinivå</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card sticky top-4">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-teal-600" />
              Filter & Sök
            </h3>
            <CategoryFilter
              selectedCategory={selectedCategory}
              selectedSubcategory={selectedSubcategory}
              onCategoryChange={handleCategoryChange}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              energyFilter={energyFilter}
              onEnergyFilterChange={setEnergyFilter}
            />
          </div>
        </div>

        {/* Articles area */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Featured articles (only on initial view) */}
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
                <Bookmark size={20} className="text-teal-600" />
                Fortsätt läsa
              </h2>
              <div className="bg-amber-50 rounded-xl p-4">
                <div className="space-y-2">
                  {articlesInProgress.map((article) => (
                    <EnhancedArticleCard 
                      key={article.id} 
                      article={article} 
                      variant="compact"
                    />
                  ))}
                </div>
              </div>
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

          {/* Low energy articles */}
          {!searchQuery && !selectedCategory && lowEnergyArticles.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Zap size={20} className="text-green-600" />
                Lätt att ta till sig
                <span className="text-sm font-normal text-slate-500 ml-2">
                  (När energin är låg)
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {lowEnergyArticles.map((article) => (
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
              <div className="card text-center py-12">
                <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-600 font-medium">Inga artiklar hittades</p>
                <p className="text-slate-500 text-sm mt-1">
                  Prova att ändra dina filter eller sökord
                </p>
              </div>
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
    </div>
  )
}
