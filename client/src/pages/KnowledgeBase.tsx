import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { articleApi } from '../services/api'
import { Search, BookOpen, Tag, ChevronRight } from 'lucide-react'

interface Article {
  id: string
  title: string
  summary: string
  category: string
  tags: string
  createdAt: string
}

interface Category {
  name: string
  count: number
}

export default function KnowledgeBase() {
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [loading, setLoading] = useState(true)

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

  const handleSearch = async () => {
    try {
      const data = await articleApi.getAll({
        search: searchQuery,
        category: selectedCategory,
      })
      setArticles(data)
    } catch (error) {
      console.error('Fel vid sökning:', error)
    }
  }

  const filteredArticles = articles

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Kunskapsbank</h1>
        <p className="text-slate-600 mt-2">
          Artiklar och guider om arbetsmarknaden, hälsa och välmående.
        </p>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="input pl-10"
              placeholder="Sök artiklar..."
            />
          </div>
          <button onClick={handleSearch} className="btn btn-primary">
            Sök
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="font-semibold text-slate-800 mb-4">Kategorier</h3>
            
            <div className="space-y-2">
              <button
                onClick={() => {
                  setSelectedCategory('')
                  handleSearch()
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedCategory === '' ? 'bg-teal-50 text-teal-700' : 'hover:bg-slate-50'
                }`}
              >
                Alla kategorier
              </button>
              
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => {
                    setSelectedCategory(category.name)
                    handleSearch()
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex justify-between items-center ${
                    selectedCategory === category.name
                      ? 'bg-teal-50 text-teal-700'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <span>{category.name}</span>
                  <span className="text-sm text-slate-400">{category.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Articles Grid */}
        <div className="lg:col-span-3">
          {filteredArticles.length === 0 ? (
            <div className="card text-center py-12">
              <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">Inga artiklar hittades</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredArticles.map((article) => (
                <Link
                  key={article.id}
                  to={`/knowledge-base/${article.id}`}
                  className="card hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span className="inline-block px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full mb-2">
                        {article.category}
                      </span>
                      
                      <h3 className="font-semibold text-slate-800 group-hover:text-teal-700 transition-colors">
                        {article.title}
                      </h3>
                      
                      {article.summary && (
                        <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                          {article.summary}
                        </p>
                      )}
                      
                      {article.tags && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {article.tags.split(',').slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 text-xs text-slate-500"
                            >
                              <Tag size={12} />
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-teal-500" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
