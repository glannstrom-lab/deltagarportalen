import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { articleApi, exerciseApi } from '../services/api'
import { logger } from '../lib/logger'
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
  Dumbbell,
} from 'lucide-react'
import { contentArticleApi, contentExerciseApi } from '../services/contentApi'
import type { Exercise } from '../data/exercises'
import { articleBookmarksApi } from '../services/cloudStorage'
import { useAchievementTracker } from '../hooks/useAchievementTracker'
import type { EnhancedArticle } from '../services/articleData'

export default function Article() {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState<EnhancedArticle | null>(null)
  const [loading, setLoading] = useState(true)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showCopied, setShowCopied] = useState(false)
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal')
  const [relatedArticles, setRelatedArticles] = useState<any[]>([])
  const [relatedExercises, setRelatedExercises] = useState<Exercise[]>([])
  const { trackArticleRead, trackArticleSaved } = useAchievementTracker()
  const hasTrackedRead = useRef(false)

  useEffect(() => {
    logger.debug('Article - ID from params:', { id })
    logger.debug('Article - Current URL:', { url: window.location.href })
    if (id) {
      loadArticle()
      checkBookmark()
      // Load saved font size preference (UI-preference, kan vara kvar i localStorage)
      const savedFontSize = localStorage.getItem('article-font-size') as 'normal' | 'large' | 'xlarge'
      if (savedFontSize) setFontSize(savedFontSize)
    }
  }, [id])

  const loadArticle = async () => {
    try {
      const data = await articleApi.getById(id!)
      setArticle(data)

      // Track article read (only once per article view)
      if (!hasTrackedRead.current && data?.title) {
        hasTrackedRead.current = true
        trackArticleRead(data.title)
      }

      // Load related articles
      if (data?.relatedArticles && data.relatedArticles.length > 0) {
        const allArticles = await contentArticleApi.getAll()
        const related = allArticles
          .filter(a => data.relatedArticles.includes(a.id) && a.id !== id)
          .slice(0, 3)
        setRelatedArticles(related)
      }

      // Load related exercises
      if (data?.relatedExercises && data.relatedExercises.length > 0) {
        const allExercises = await contentExerciseApi.getAll()
        const related = allExercises.filter(e => data.relatedExercises.includes(e.id))
        setRelatedExercises(related)
      }
    } catch (error) {
      console.error('Error loading article:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkBookmark = async () => {
    try {
      const isSaved = await articleBookmarksApi.isBookmarked(id!)
      setIsBookmarked(isSaved)
    } catch (error) {
      console.error('Error checking bookmark:', error)
      // Fallback to localStorage if cloud fails
      const bookmarks = JSON.parse(localStorage.getItem('article-bookmarks') || '[]')
      setIsBookmarked(bookmarks.includes(id))
    }
  }

  const toggleBookmark = async () => {
    try {
      if (isBookmarked) {
        await articleBookmarksApi.remove(id!)
      } else {
        await articleBookmarksApi.add(id!)
        // Track article saved achievement
        trackArticleSaved(article?.title)
      }
      setIsBookmarked(!isBookmarked)
    } catch (error) {
      console.error('Error toggling bookmark:', error)
      // Fallback to localStorage
      const bookmarks = JSON.parse(localStorage.getItem('article-bookmarks') || '[]')
      let newBookmarks
      if (bookmarks.includes(id)) {
        newBookmarks = bookmarks.filter((b: string) => b !== id)
      } else {
        newBookmarks = [...bookmarks, id]
        // Track article saved achievement (fallback)
        trackArticleSaved(article?.title)
      }
      localStorage.setItem('article-bookmarks', JSON.stringify(newBookmarks))
      setIsBookmarked(!isBookmarked)
    }
  }

  const shareArticle = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    } catch (err) {
      console.error('Could not copy:', err)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700"></div>
      </div>
    )
  }

  // Handle invalid ID (e.g., literal ":id" in URL)
  if (!id || id === ':id' || !id.match(/^[a-z0-9-]+$/)) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-2">{t('article.invalidLink')}</p>
        <p className="text-slate-400 text-sm mb-4">
          {!id || id === ':id'
            ? t('article.idMissingOrInvalid')
            : t('article.invalidIdFormat', { id })
          }
        </p>
        <Link to="/knowledge-base" className="text-teal-600 hover:underline mt-2 inline-block">
          {t('article.backToKnowledgeBase')}
        </Link>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">{t('article.notFound')}</p>
        <p className="text-slate-400 text-sm mt-1 mb-4">
          ID: {id}
        </p>
        <Link to="/knowledge-base" className="text-teal-600 hover:underline mt-2 inline-block">
          {t('article.backToKnowledgeBase')}
        </Link>
      </div>
    )
  }

  // Parse content for display
  const contentParagraphs = article.content.split('\n\n').filter((p: string) => p.trim())

  // Get checklist items
  const checklistItems = (article.checklist || []) as Array<{ id: string; text: string }>

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
        {t('article.backToKnowledgeBase')}
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
            {new Date(article.createdAt).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'sv-SE')}
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
                title={t('article.fontSizeNormal')}
              >
                A
              </button>
              <button
                onClick={() => changeFontSize('large')}
                className={`px-2 py-1 rounded text-base font-medium transition-colors ${
                  fontSize === 'large' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                }`}
                title={t('article.fontSizeLarge')}
              >
                A
              </button>
              <button
                onClick={() => changeFontSize('xlarge')}
                className={`px-2 py-1 rounded text-lg font-medium transition-colors ${
                  fontSize === 'xlarge' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                }`}
                title={t('article.fontSizeXLarge')}
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
              title={isBookmarked ? t('article.removeBookmark') : t('article.saveBookmark')}
            >
              <Bookmark size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>

            {/* Share */}
            <button
              onClick={shareArticle}
              className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors relative"
              title={t('article.shareArticle')}
            >
              <Share2 size={20} />
              {showCopied && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {t('article.copied')}
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
              {t('article.nextSteps')}
            </h4>
            <div className="flex flex-wrap gap-3">
              {actions.map((action, index: number) => (
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
              {(Array.isArray(article.tags) ? article.tags : article.tags.split(',')).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-slate-100 text-slate-600 text-sm rounded"
                >
                  {typeof tag === 'string' ? tag.trim() : tag}
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
              {t('article.userRating', { rating: article.helpfulnessRating })}
            </span>
          )}
          {article.bookmarkCount !== undefined && article.bookmarkCount > 0 && (
            <span className="flex items-center gap-1">
              <Bookmark size={14} />
              {t('article.savedCount', { count: article.bookmarkCount })}
            </span>
          )}
          {article.difficulty && (
            <DifficultyBadge level={article.difficulty} size="sm" />
          )}
        </div>
      </article>

      {/* Related exercises */}
      {relatedExercises.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Dumbbell className="text-indigo-600" size={24} />
            {t('article.relatedExercises')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedExercises.map((exercise) => {
              const Icon = exercise.icon
              return (
                <Link
                  key={exercise.id}
                  to={`/exercises`}
                  className="group block card hover:shadow-md transition-all border-l-4 border-l-indigo-500"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors mb-1">
                        {exercise.title}
                      </h3>
                      <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                        {exercise.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">
                          {exercise.category}
                        </span>
                        <span>•</span>
                        <span>{exercise.duration}</span>
                        <span>•</span>
                        <span>{exercise.difficulty}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4">{t('article.relatedArticles')}</h2>
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
            <h3 className="font-semibold text-slate-800 mb-1">{t('article.needMoreHelp')}</h3>
            <p className="text-slate-600 text-sm mb-3">
              {t('article.helpDescription')}
            </p>
            <Link
              to="/diary"
              className="inline-flex items-center gap-2 text-teal-700 font-medium hover:underline"
            >
              {t('article.bookMeeting')}
              <ExternalLink size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
