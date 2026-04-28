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
} from '@/components/ui/icons'
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
      <div className="flex items-center justify-center h-64 bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--c-solid)] dark:border-[var(--c-solid)]/60"></div>
      </div>
    )
  }

  // Handle invalid ID (e.g., literal ":id" in URL)
  if (!id || id === ':id' || !id.match(/^[a-z0-9-]+$/)) {
    return (
      <div className="text-center py-12 bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-950 rounded-xl">
        <p className="text-gray-800 dark:text-gray-100 mb-2">{t('article.invalidLink')}</p>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
          {!id || id === ':id'
            ? t('article.idMissingOrInvalid')
            : t('article.invalidIdFormat', { id })
          }
        </p>
        <Link to="/knowledge-base" className="text-[var(--c-text)] dark:text-[var(--c-text)] hover:text-[var(--c-text)] dark:hover:text-[var(--c-text)] hover:underline mt-2 inline-block">
          {t('article.backToKnowledgeBase')}
        </Link>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="text-center py-12 bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-950 rounded-xl">
        <p className="text-gray-800 dark:text-gray-100">{t('article.notFound')}</p>
        <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 mb-4">
          ID: {id}
        </p>
        <Link to="/knowledge-base" className="text-[var(--c-text)] dark:text-[var(--c-text)] hover:text-[var(--c-text)] dark:hover:text-[var(--c-text)] hover:underline mt-2 inline-block">
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
        className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-[var(--c-text)] dark:hover:text-[var(--c-text)] mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        {t('article.backToKnowledgeBase')}
      </button>

      {/* Article header */}
      <article className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-6 mb-8">
        {/* Category & Meta */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-block px-3 py-1 bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-text)] text-sm font-medium rounded-full">
            {article.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          {article.title}
        </h1>

        {/* Author & Date */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300 mb-6">
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
          <div className="p-4 bg-gradient-to-r from-[var(--c-bg)] to-cyan-50 dark:from-[var(--c-bg)]/30 dark:to-cyan-900/20 rounded-lg mb-6 border border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50">
            <p className="text-gray-700 dark:text-gray-200 font-medium italic">
              {article.summary}
            </p>
          </div>
        )}

        {/* Action bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-t border-b border-stone-100 dark:border-stone-700 mb-6">
          <div className="flex items-center gap-2">
            {/* Text to speech */}
            <TextToSpeech text={article.content} />
          </div>

          <div className="flex items-center gap-2">
            {/* Font size */}
            <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-700 rounded-lg p-1">
              <button
                onClick={() => changeFontSize('normal')}
                className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
                  fontSize === 'normal' ? 'bg-white dark:bg-stone-600 text-gray-800 dark:text-gray-100 shadow-sm' : 'text-gray-600 dark:text-gray-300'
                }`}
                title={t('article.fontSizeNormal')}
              >
                A
              </button>
              <button
                onClick={() => changeFontSize('large')}
                className={`px-2 py-1 rounded text-base font-medium transition-colors ${
                  fontSize === 'large' ? 'bg-white dark:bg-stone-600 text-gray-800 dark:text-gray-100 shadow-sm' : 'text-gray-600 dark:text-gray-300'
                }`}
                title={t('article.fontSizeLarge')}
              >
                A
              </button>
              <button
                onClick={() => changeFontSize('xlarge')}
                className={`px-2 py-1 rounded text-lg font-medium transition-colors ${
                  fontSize === 'xlarge' ? 'bg-white dark:bg-stone-600 text-gray-800 dark:text-gray-100 shadow-sm' : 'text-gray-600 dark:text-gray-300'
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
                  ? 'bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-text)]'
                  : 'bg-stone-100 dark:bg-stone-700 text-gray-600 dark:text-gray-300 hover:bg-stone-200 dark:hover:bg-stone-600'
              }`}
              title={isBookmarked ? t('article.removeBookmark') : t('article.saveBookmark')}
            >
              <Bookmark size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>

            {/* Share */}
            <button
              onClick={shareArticle}
              className="p-2 bg-stone-100 dark:bg-stone-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors relative"
              title={t('article.shareArticle')}
            >
              <Share2 size={20} />
              {showCopied && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {t('article.copied')}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Article content */}
        <div className={`prose prose-slate dark:prose-invert max-w-none ${getFontSizeClass()}`}>
          {contentParagraphs.map((paragraph: string, index: number) => {
            // Check if it's a heading (starts with ##)
            if (paragraph.startsWith('## ')) {
              return (
                <h2
                  key={index}
                  className={`text-xl font-bold text-gray-800 dark:text-gray-100 mt-8 mb-4 ${
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
                  className={`text-lg font-semibold text-gray-800 dark:text-gray-100 mt-6 mb-3 ${
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
                    <li key={i} className="text-gray-700 dark:text-gray-200">
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
                  className="border-l-4 border-[var(--c-solid)] dark:border-[var(--c-solid)]/60 pl-4 italic text-gray-600 dark:text-gray-300 my-6"
                >
                  {paragraph.replace('> ', '')}
                </blockquote>
              )
            }
            // Regular paragraph
            return (
              <p key={index} className="mb-4 text-gray-700 dark:text-gray-200">
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
          <div className="mt-8 p-4 bg-stone-50 dark:bg-stone-900/50 rounded-xl border border-stone-100 dark:border-stone-700">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
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
                      ? 'bg-[var(--c-solid)] dark:bg-[var(--c-solid)]/80 text-white hover:bg-[var(--c-text)] dark:hover:bg-[var(--c-solid)]'
                      : 'bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-gray-700 dark:text-gray-200 hover:bg-stone-50 dark:hover:bg-stone-600'
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
          <footer className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-700">
            <div className="flex items-center gap-2 flex-wrap">
              <Tag size={16} className="text-gray-600 dark:text-gray-400" />
              {(Array.isArray(article.tags) ? article.tags : article.tags.split(',')).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-stone-100 dark:bg-stone-700 text-gray-600 dark:text-gray-300 text-sm rounded"
                >
                  {typeof tag === 'string' ? tag.trim() : tag}
                </span>
              ))}
            </div>
          </footer>
        )}

        {/* Meta info */}
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
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
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Dumbbell className="text-[var(--c-text)] dark:text-[var(--c-text)]" size={24} />
            {t('article.relatedExercises')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedExercises.map((exercise) => {
              const Icon = exercise.icon
              return (
                <Link
                  key={exercise.id}
                  to={`/exercises`}
                  className="group block bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-4 hover:shadow-md transition-all border-l-4 border-l-[var(--c-solid)] dark:border-l-[var(--c-solid)]"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-[var(--c-text)] dark:text-[var(--c-text)]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100 group-hover:text-[var(--c-text)] dark:group-hover:text-[var(--c-text)] transition-colors mb-1">
                        {exercise.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                        {exercise.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <span className="px-2 py-0.5 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-text)] rounded-full">
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
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t('article.relatedArticles')}</h2>
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
      <section className="bg-gradient-to-br from-[var(--c-bg)] to-cyan-50 dark:from-[var(--c-bg)]/30 dark:to-cyan-900/20 border border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-[var(--c-solid)] to-[var(--c-solid)] dark:from-[var(--c-solid)] dark:to-[var(--c-text)] rounded-xl flex items-center justify-center flex-shrink-0">
            <Lightbulb size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">{t('article.needMoreHelp')}</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
              {t('article.helpDescription')}
            </p>
            <Link
              to="/diary"
              className="inline-flex items-center gap-2 text-[var(--c-text)] dark:text-[var(--c-text)] hover:text-[var(--c-text)] dark:hover:text-[var(--c-text)] font-medium hover:underline"
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
