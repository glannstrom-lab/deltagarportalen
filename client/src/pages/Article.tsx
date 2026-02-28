import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { articleApi } from '../services/api'
import { 
  ReadingProgress, 
  ArticleChecklist,
  TextToSpeech,
  ReadingTime,
  DifficultyBadge,
  EnhancedArticleCard,
} from '../components/knowledge-base'
import { 
  ArrowLeft, 
  Calendar, 
  Tag, 
  User, 
  Share2,
  Bookmark,
  ExternalLink,
  Lightbulb,
} from 'lucide-react'
import { getRelatedArticles } from '../services/articleData'

export default function Article() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showCopied, setShowCopied] = useState(false)
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal')

  useEffect(() => {
    if (id) {
      loadArticle()
      checkBookmark()
      // Load saved font size preference
      const savedFontSize = localStorage.getItem('article-font-size') as 'normal' | 'large' | 'xlarge'
      if (savedFontSize) setFontSize(savedFontSize)
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

  const checkBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem('article-bookmarks') || '[]')
    setIsBookmarked(bookmarks.includes(id))
  }

  const toggleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem('article-bookmarks') || '[]')
    let newBookmarks
    if (bookmarks.includes(id)) {
      newBookmarks = bookmarks.filter((b: string) => b !== id)
    } else {
      newBookmarks = [...bookmarks, id]
    }
    localStorage.setItem('article-bookmarks', JSON.stringify(newBookmarks))
    setIsBookmarked(!isBookmarked)
  }

  const shareArticle = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    } catch (err) {
      console.error('Kunde inte kopiera:', err)
    }
  }

  const changeFontSize = (size: 'normal' | 'large' | 'xlarge') => {
    setFontSize(size)
    localStorage.setItem('article-font-size', size)
  }

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'large': return 'text-lg leading-relaxed'
      case 'xlarge': return 'text-xl leading-loose'
      default: return 'text-base leading-relaxed'
    }
  }

  // Get related articles
  const relatedArticles = article?.relatedArticles 
    ? getRelatedArticles(article.relatedArticles).filter(a => a.id !== id).slice(0, 3)
    : []

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
        <Link to="/knowledge-base" className="text-teal-600 hover:underline mt-2 inline-block">
          Tillbaka till kunskapsbanken
        </Link>
      </div>
    )
  }

  // Parse content for display
  const contentParagraphs = article.content.split('\n\n').filter((p: string) => p.trim())

  // Get checklist items
  const checklistItems = article.checklist || []

  // Get actions
  const actions = article.actions || []

  return (
    <div className="max-w-4xl mx-auto">
      {/* Reading progress */}
      <ReadingProgress articleId={article.id} />

      {/* Back button */}
      <button
        onClick={() => navigate('/knowledge-base')}
        className="flex items-center gap-2 text-slate-600 hover:text-teal-700 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        Tillbaka till kunskapsbanken
      </button>

      {/* Article header */}
      <article className="card mb-8">
        {/* Category & Meta */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-block px-3 py-1 bg-teal-100 text-teal-700 text-sm font-medium rounded-full">
            {article.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
          {article.title}
        </h1>

        {/* Author & Date */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-6">
          {article.author && (
            <span className="flex items-center gap-1.5">
              <User size={16} />
              {article.author}
              {article.authorTitle && `, ${article.authorTitle}`}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar size={16} />
            {new Date(article.createdAt).toLocaleDateString('sv-SE')}
          </span>
          {article.readingTime && (
            <ReadingTime minutes={article.readingTime} variant="compact" />
          )}
        </div>

        {/* Summary */}
        {article.summary && (
          <div className="p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg mb-6">
            <p className="text-slate-700 font-medium italic">
              {article.summary}
            </p>
          </div>
        )}

        {/* Action bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-t border-b border-slate-100 mb-6">
          <div className="flex items-center gap-2">
            {/* Text to speech */}
            <TextToSpeech text={article.content} />
          </div>

          <div className="flex items-center gap-2">
            {/* Font size */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => changeFontSize('normal')}
                className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
                  fontSize === 'normal' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                }`}
                title="Normal textstorlek"
              >
                A
              </button>
              <button
                onClick={() => changeFontSize('large')}
                className={`px-2 py-1 rounded text-base font-medium transition-colors ${
                  fontSize === 'large' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                }`}
                title="Stor textstorlek"
              >
                A
              </button>
              <button
                onClick={() => changeFontSize('xlarge')}
                className={`px-2 py-1 rounded text-lg font-medium transition-colors ${
                  fontSize === 'xlarge' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                }`}
                title="Extra stor textstorlek"
              >
                A
              </button>
            </div>

            {/* Bookmark */}
            <button
              onClick={toggleBookmark}
              className={`p-2 rounded-lg transition-colors ${
                isBookmarked 
                  ? 'bg-teal-100 text-teal-700' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title={isBookmarked ? 'Ta bort bokmärke' : 'Spara bokmärke'}
            >
              <Bookmark size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>

            {/* Share */}
            <button
              onClick={shareArticle}
              className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors relative"
              title="Dela artikel"
            >
              <Share2 size={20} />
              {showCopied && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  Kopierad!
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Article content */}
        <div className={`prose prose-slate max-w-none ${getFontSizeClass()}`}>
          {contentParagraphs.map((paragraph: string, index: number) => {
            // Check if it's a heading (starts with ##)
            if (paragraph.startsWith('## ')) {
              return (
                <h2 
                  key={index} 
                  className={`text-xl font-bold text-slate-800 mt-8 mb-4 ${
                    fontSize === 'large' ? 'text-2xl' : fontSize === 'xlarge' ? 'text-3xl' : ''
                  }`}
                >
                  {paragraph.replace('## ', '')}
                </h2>
              )
            }
            // Check if it's a subheading (starts with ###)
            if (paragraph.startsWith('### ')) {
              return (
                <h3 
                  key={index} 
                  className={`text-lg font-semibold text-slate-800 mt-6 mb-3 ${
                    fontSize === 'large' ? 'text-xl' : fontSize === 'xlarge' ? 'text-2xl' : ''
                  }`}
                >
                  {paragraph.replace('### ', '')}
                </h3>
              )
            }
            // Check if it's a list
            if (paragraph.includes('\n- ') || paragraph.startsWith('- ')) {
              const items = paragraph.split('\n').filter((line: string) => line.trim().startsWith('-'))
              return (
                <ul key={index} className="list-disc pl-6 space-y-2 my-4">
                  {items.map((item: string, i: number) => (
                    <li key={i} className="text-slate-700">
                      {item.replace('- ', '').replace('- [ ] ', '').replace('- [x] ', '')}
                    </li>
                  ))}
                </ul>
              )
            }
            // Check if it's a blockquote
            if (paragraph.startsWith('> ')) {
              return (
                <blockquote 
                  key={index} 
                  className="border-l-4 border-teal-500 pl-4 italic text-slate-600 my-6"
                >
                  {paragraph.replace('> ', '')}
                </blockquote>
              )
            }
            // Regular paragraph
            return (
              <p key={index} className="mb-4 text-slate-700">
                {paragraph}
              </p>
            )
          })}
        </div>

        {/* Checklist */}
        {checklistItems.length > 0 && (
          <ArticleChecklist articleId={article.id} items={checklistItems} />
        )}

        {/* Actions */}
        {actions.length > 0 && (
          <div className="mt-8 p-4 bg-slate-50 rounded-xl">
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Lightbulb size={18} className="text-amber-500" />
              Nästa steg
            </h4>
            <div className="flex flex-wrap gap-3">
              {actions.map((action: any, index: number) => (
                <Link
                  key={index}
                  to={action.href}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    action.type === 'primary'
                      ? 'bg-teal-600 text-white hover:bg-teal-700'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {action.label}
                  <ExternalLink size={16} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {article.tags && (
          <footer className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-2 flex-wrap">
              <Tag size={16} className="text-slate-400" />
              {article.tags.split(',').map((tag: string) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-slate-100 text-slate-600 text-sm rounded"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          </footer>
        )}

        {/* Meta info */}
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-500">
          {article.helpfulnessRating && (
            <span className="flex items-center gap-1">
              <span className="text-amber-500">★</span>
              {article.helpfulnessRating}/5 användarbetyg
            </span>
          )}
          {article.bookmarkCount !== undefined && article.bookmarkCount > 0 && (
            <span className="flex items-center gap-1">
              <Bookmark size={14} />
              {article.bookmarkCount} har sparat
            </span>
          )}
          {article.difficulty && (
            <DifficultyBadge level={article.difficulty} size="sm" />
          )}
        </div>
      </article>

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Relaterade artiklar</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedArticles.map((relatedArticle) => (
              <EnhancedArticleCard 
                key={relatedArticle.id} 
                article={relatedArticle}
              />
            ))}
          </div>
        </section>
      )}

      {/* Help section */}
      <section className="card bg-gradient-to-br from-teal-50 to-blue-50 border-teal-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Lightbulb size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 mb-1">Behöver du mer hjälp?</h3>
            <p className="text-slate-600 text-sm mb-3">
              Om du har frågor eller behöver stöd, tveka inte att kontakta din arbetskonsulent.
              Vi finns här för dig!
            </p>
            <Link 
              to="/diary"
              className="inline-flex items-center gap-2 text-teal-700 font-medium hover:underline"
            >
              Boka ett möte
              <ExternalLink size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
