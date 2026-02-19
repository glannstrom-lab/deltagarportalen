import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { articleApi } from '../services/api'
import { ArrowLeft, Calendar, Tag } from 'lucide-react'

export default function Article() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadArticle()
    }
  }, [id])

  const loadArticle = async () => {
    try {
      const data = await articleApi.getById(id!)
      setArticle(data)
    } catch (error) {
      console.error('Fel vid laddning:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700"></div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Artikeln hittades inte</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/knowledge-base')}
        className="flex items-center gap-2 text-slate-600 hover:text-teal-700 mb-6"
      >
        <ArrowLeft size={20} />
        Tillbaka till kunskapsbanken
      </button>

      <article className="card">
        <header className="mb-6">
          <span className="inline-block px-3 py-1 bg-teal-100 text-teal-700 text-sm rounded-full mb-4">
            {article.category}
          </span>
          
          <h1 className="text-3xl font-bold text-slate-800 mb-4">{article.title}</h1>
          
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar size={16} />
              {new Date(article.createdAt).toLocaleDateString('sv-SE')}
            </span>
          </div>
        </header>

        {article.summary && (
          <div className="p-4 bg-slate-50 rounded-lg mb-6">
            <p className="text-slate-700 italic">{article.summary}</p>
          </div>
        )}

        <div className="prose prose-slate max-w-none">
          {article.content.split('\n').map((paragraph: string, index: number) => (
            <p key={index} className="mb-4 text-slate-700 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        {article.tags && (
          <footer className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-slate-400" />
              <div className="flex flex-wrap gap-2">
                {article.tags.split(',').map((tag: string) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-slate-100 text-slate-600 text-sm rounded"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          </footer>
        )}
      </article>
    </div>
  )
}
