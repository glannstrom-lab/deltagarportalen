import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { articleApi } from '../services/supabaseApi'
import { logger } from '../lib/logger'
import {
  ReadingProgress,
  ArticleChecklist,
  TextToSpeech,
  ReadingTime,
  DifficultyBadge,
  EnhancedArticleCard,
  ArticleContent,
} from '../components/knowledge-base'
import {
  ArrowLeft,
  Calendar,
  Tag,
  User,
  Share2,
  Bookmark,
  Lightbulb,
  Dumbbell,
  ArrowRight,
} from '@/components/ui/icons'
import { contentArticleApi, contentExerciseApi } from '../services/contentApi'
import type { Exercise } from '../data/exercises'
import { articleBookmarksApi } from '../services/cloudStorage'
import { useAchievementTracker } from '../hooks/useAchievementTracker'
import type { EnhancedArticle } from '@/data/artikelkategorier'
import { kategoriNamn } from '@/data/artikelkategorier'
import { textUrMarkdown } from '../components/knowledge-base/articleMarkdown'
import { BookOpen } from '@/components/ui/icons'
import { useFocusMode } from '@/components/FocusModeProvider'
import { FokusVaxel } from '@/components/focus/shell/FokusVaxel'

export default function Article() {
  const { t } = useTranslation()
  const { leaveWizard } = useFocusMode()

  return (
    <FokusVaxel
      title={t('article.title', 'Artikel')}
      icon={BookOpen}
      domain="info"
      guide={<ArticleFocusReader onExit={leaveWizard} />}
    >
      <ArticleInner />
    </FokusVaxel>
  )
}

function ArticleFocusReader({ onExit }: { onExit: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="max-w-lg mx-auto text-center space-y-6 pt-8">
      <div className="w-16 h-16 rounded-full bg-[var(--c-accent)]/40 flex items-center justify-center mx-auto">
        <BookOpen className="w-8 h-8 text-[var(--c-solid)]" />
      </div>
      <p className="text-stone-600 dark:text-stone-300">
        {t(
          'focus.article.intro',
          'I fokusläge läser vi artikeln i lugn takt. Öppna artikeln i normalläge för att läsa den med full layout.'
        )}
      </p>
      <button
        onClick={onExit}
        className="w-full py-4 rounded-xl bg-[var(--c-solid)] text-white font-semibold text-lg"
      >
        {t('focus.article.openNormal', 'Läs i normalläge')}
      </button>
    </div>
  )
}

function ArticleInner() {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState<EnhancedArticle | null>(null)
  const [loading, setLoading] = useState(true)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [kopieringsLage, setKopieringsLage] = useState<'vilande' | 'klar' | 'fel'>('vilande')
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal')
  const [relatedArticles, setRelatedArticles] = useState<EnhancedArticle[]>([])
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

      // Relaterade artiklar hämtas på slug. Tidigare hämtades HELA korpusen
      // (`getAll()` — 325 kB gzip, dessutom utanför React Query och alltså
      // okachad) bara för att slå upp tre stycken. 152 av 163 artiklar har
      // relaterade, så det skedde nästan varje gång någon öppnade en artikel.
      if (data?.relatedArticles?.length) {
        const related = await contentArticleApi.getBySlugs(
          data.relatedArticles.filter((slug) => slug !== id)
        )
        setRelatedArticles(related.slice(0, 3))
      }

      // Load related exercises
      const ovningsSlugs = data?.relatedExercises ?? []
      if (ovningsSlugs.length > 0) {
        const allExercises = await contentExerciseApi.getAll()
        setRelatedExercises(allExercises.filter((e) => ovningsSlugs.includes(e.id)))
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
      // Reservnyckeln MÅSTE vara densamma som articleBookmarksApi använder.
      // Den hette `article-bookmarks` här och `article_bookmarks` där, så ett
      // bokmärke som räddades undan ett molnfel hittades aldrig igen.
      const bookmarks = JSON.parse(localStorage.getItem('article_bookmarks') || '[]')
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
      // Fallback to localStorage — samma nyckel som articleBookmarksApi.
      const bookmarks = JSON.parse(localStorage.getItem('article_bookmarks') || '[]')
      let newBookmarks
      if (bookmarks.includes(id)) {
        newBookmarks = bookmarks.filter((b: string) => b !== id)
      } else {
        newBookmarks = [...bookmarks, id]
        // Track article saved achievement (fallback)
        trackArticleSaved(article?.title)
      }
      localStorage.setItem('article_bookmarks', JSON.stringify(newBookmarks))
      setIsBookmarked(!isBookmarked)
    }
  }

  /**
   * Kopierar den PUBLIKA adressen, inte hash-URL:en.
   *
   * `window.location.href` är `…/#/knowledge-base/article/<slug>` — den
   * variant Google inte ser och som kräver att mottagaren laddar hela SPA:n.
   * Samma artikel finns prerenderad på `/guider/<slug>/` med canonical.
   */
  const shareArticle = async () => {
    const publikUrl = `${window.location.origin}/guider/${article?.id ?? ''}/`
    try {
      await navigator.clipboard.writeText(publikUrl)
      setKopieringsLage('klar')
      setTimeout(() => setKopieringsLage('vilande'), 2500)
    } catch (err) {
      // Urklipp kan nekas (osäker kontext, äldre webbläsare). Tidigare
      // loggades felet till konsolen och knappen såg bara trasig ut.
      logger.warn('Kunde inte kopiera artikellänken', { err })
      setKopieringsLage('fel')
      setTimeout(() => setKopieringsLage('vilande'), 4000)
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
      <div className="flex items-center justify-center h-64 bg-stone-50 dark:bg-stone-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--c-solid)] dark:border-[var(--c-solid)]/60"></div>
      </div>
    )
  }

  // Handle invalid ID (e.g., literal ":id" in URL)
  if (!id || id === ':id' || !id.match(/^[a-z0-9-]+$/)) {
    return (
      <div className="text-center py-12 bg-stone-50 dark:bg-stone-900 rounded-xl">
        <p className="text-stone-900 dark:text-stone-100 mb-2">{t('article.invalidLink')}</p>
        <p className="text-stone-600 dark:text-stone-300 text-sm mb-4">
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
      <div className="text-center py-12 bg-stone-50 dark:bg-stone-900 rounded-xl">
        <p className="text-stone-900 dark:text-stone-100">{t('article.notFound')}</p>
        <p className="text-stone-600 dark:text-stone-300 text-sm mt-1 mb-4">
          ID: {id}
        </p>
        <Link to="/knowledge-base" className="text-[var(--c-text)] dark:text-[var(--c-text)] hover:text-[var(--c-text)] dark:hover:text-[var(--c-text)] hover:underline mt-2 inline-block">
          {t('article.backToKnowledgeBase')}
        </Link>
      </div>
    )
  }

  // Get checklist items
  const checklistItems = (article.checklist || []) as Array<{ id: string; text: string }>

  // Get actions
  const actions = article.actions || []

  return (
    /*
      `data-domain` MÅSTE sitta här.
      `PageLayout` är enda stället i portalen som sätter attributet, och den
      här sidan använder ingen. Följden fram till 2026-08-22: `--c-*` föll
      tillbaka på `:root`, alltså Översiktens MINT — läsprogressbaren,
      sammanfattningsrutan, checklistan och "Nästa steg"-knappen renderades
      gröna mitt i en sky-blå kunskapsbank. Uppmätt `rgb(26,119,87)`.

      Läsbredden är ett medvetet undantag från §3:s "inga `max-w-*` på en
      enskild sida": det här är en läsvy, inte en verktygsyta, och radlängden
      är en läsbarhetsfråga för målgruppen. `prose` kapar dessutom texten vid
      65 tecken — `max-w-none` tog tidigare bort just den kapningen och gav
      ~106 tecken per rad.
    */
    <div data-domain="info" className="max-w-3xl mx-auto">
      {/* Reading progress */}
      <ReadingProgress articleId={article.id} />

      {/* Back button */}
      <button
        onClick={() => navigate('/knowledge-base')}
        className="flex items-center gap-2 text-stone-600 dark:text-stone-300 hover:text-[var(--c-text)] dark:hover:text-[var(--c-text)] mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        {t('article.backToKnowledgeBase')}
      </button>

      {/* Article header */}
      <article className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-6 mb-8">
        {/* Category & Meta */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {/* Renderade tidigare `article.category` rått — alltså `job-search`
              i en badge ovanför rubriken, medan kortet man klickade på sa
              "Jobbsökning". Tre namn på samma kategori i samma flöde. */}
          <span className="inline-block px-3 py-1 bg-[var(--c-bg)] text-[var(--c-text)] border border-[var(--c-accent)] text-sm font-medium rounded-full">
            {kategoriNamn(t, article.category)}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-stone-900 dark:text-stone-100 mb-6">
          {article.title}
        </h1>

        {/*
          Bylinen läses ur databasen igen — men databasen är städad.

          Fältet bar till 2026-08-22 **37 olika namn**, varav 36 var påhittade
          personer: fem artiklar om ersättningsnivåer signerade "Katarina Holm,
          Handläggare Arbetsförmedlingen", fem om depression och avslag av
          "Anna Lindberg, Psykolog". Ingen av dem fanns. Migrationen
          `20260822_artikelforfattare.sql` satte samtliga 163 artiklar till en
          verklig, ansvarig person (beslut Mikael) — ett namn läsaren kan
          kontrollera och vända sig till.

          Att läsa fältet i stället för att hårdkoda ett namn är avsiktligt:
          en framtida artikel av någon annan ska kunna krediteras rätt utan
          kodändring. `Jobin` står kvar som reserv när fältet är tomt.

          Datumet visar `updatedAt`, inte `createdAt`. `created_at` är
          insert-tidpunkten från två seed-körningar — 133 artiklar bär samma
          sekund — och renderades tidigare bredvid en kalenderikon, alltså
          som publiceringsdatum.
        */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-stone-600 dark:text-stone-300 mb-6">
          <span className="flex items-center gap-1.5">
            <User size={16} aria-hidden="true" />
            {article.author || t('article.publisher', 'Jobin')}
            {article.author && article.authorTitle && `, ${article.authorTitle}`}
          </span>
          {article.updatedAt && (
            <span className="flex items-center gap-1.5">
              <Calendar size={16} aria-hidden="true" />
              {t('article.updatedOn', {
                date: new Date(article.updatedAt).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'sv-SE'),
                defaultValue: 'Uppdaterad {{date}}',
              })}
            </span>
          )}
          {article.readingTime && <ReadingTime minutes={article.readingTime} variant="compact" />}
        </div>

        {/* Summary */}
        {article.summary && (
          <div className="p-4 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 rounded-lg mb-6 border border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50">
            <p className="text-stone-700 dark:text-stone-200 font-medium italic">
              {article.summary}
            </p>
          </div>
        )}

        {/* Action bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-t border-b border-stone-100 dark:border-stone-700 mb-6">
          <div className="flex items-center gap-2">
            {/* Text to speech */}
            {/* Ren text. Tidigare skickades rå markdown, så uppläsningen
                läste tabellpipes, asterisker och hela URL:er — till just den
                användare som valt att lyssna för att hon inte orkar läsa. */}
            <TextToSpeech text={textUrMarkdown(article.content)} />
          </div>

          <div className="flex items-center gap-2">
            {/* Textstorlek.
                De tre knapparna innehöll bara bokstaven "A". `title` sattes,
                men innehållet vinner i namnberäkningen — en skärmläsare läste
                tre likadana knappar "A", och inget markerade vilken som var
                vald. */}
            <div
              role="group"
              aria-label={t('article.fontSizeGroup', 'Textstorlek')}
              className="flex items-center gap-1 bg-stone-100 dark:bg-stone-700 rounded-lg p-1"
            >
              {([
                { id: 'normal' as const, klass: 'text-sm', etikett: t('article.fontSizeNormal') },
                { id: 'large' as const, klass: 'text-base', etikett: t('article.fontSizeLarge') },
                { id: 'xlarge' as const, klass: 'text-lg', etikett: t('article.fontSizeXLarge') },
              ]).map((val) => (
                <button
                  key={val.id}
                  onClick={() => changeFontSize(val.id)}
                  aria-pressed={fontSize === val.id}
                  aria-label={val.etikett}
                  className={`px-2 py-1 min-w-[36px] rounded font-medium transition-colors ${val.klass} ${
                    fontSize === val.id
                      ? 'bg-white dark:bg-stone-600 text-stone-900 dark:text-stone-100 shadow-sm'
                      : 'text-stone-600 dark:text-stone-300'
                  }`}
                >
                  <span aria-hidden="true">A</span>
                </button>
              ))}
            </div>

            {/* Bookmark */}
            <button
              onClick={toggleBookmark}
              aria-pressed={isBookmarked}
              className={`p-2 rounded-lg transition-colors ${
                isBookmarked
                  ? 'bg-[var(--c-bg)] text-[var(--c-text)] border border-[var(--c-accent)]'
                  : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600'
              }`}
              aria-label={isBookmarked ? t('article.removeBookmark') : t('article.saveBookmark')}
            >
              <Bookmark size={20} fill={isBookmarked ? 'currentColor' : 'none'} aria-hidden="true" />
            </button>

            {/* Share */}
            <button
              onClick={shareArticle}
              className="p-2 bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
              aria-label={t('article.shareArticle')}
            >
              <Share2 size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Kopieringsbeskedet är en liveregion — bubblan ovanför knappen
            annonserades inte, och ett nekat urklipp sa ingenting alls. */}
        <p role="status" aria-live="polite" className="-mt-4 mb-4 text-sm min-h-[1.25rem] text-stone-700 dark:text-stone-300">
          {kopieringsLage === 'klar' && t('article.copied')}
          {kopieringsLage === 'fel' && t('article.copyFailed', 'Kunde inte kopiera länken — markera adressfältet och kopiera därifrån.')}
        </p>

        {/* Artikelns innehåll — markdown renderas som React-element */}
        <ArticleContent
          content={article.content}
          fontSize={fontSize}
          className={`prose prose-stone dark:prose-invert ${getFontSizeClass()}`}
        />

        {/* Checklist */}
        {checklistItems.length > 0 && (
          <ArticleChecklist articleId={article.id} items={checklistItems} />
        )}

        {/* Actions */}
        {actions.length > 0 && (
          <div className="mt-8 p-4 bg-stone-50 dark:bg-stone-900/50 rounded-xl border border-stone-100 dark:border-stone-700">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-3 flex items-center gap-2">
              <Lightbulb size={18} className="text-[var(--c-solid)]" aria-hidden="true" />
              {t('article.nextSteps')}
            </h3>
            <div className="flex flex-wrap gap-3">
              {actions.map((action, index: number) => (
                <Link
                  key={index}
                  to={action.href}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    action.type === 'primary'
                      ? 'bg-[var(--c-solid)] dark:bg-[var(--c-solid)]/80 text-white hover:bg-[var(--c-text)] dark:hover:bg-[var(--c-solid)]'
                      : 'bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-600'
                  }`}
                >
                  {action.label}
                  {/* Bar tidigare `ExternalLink`, men målen är interna rutter.
                      Ikonen lovade en ny flik som aldrig öppnades. */}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {article.tags && (
          <footer className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-700">
            <div className="flex items-center gap-2 flex-wrap">
              <Tag size={16} className="text-stone-600 dark:text-stone-400" />
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 text-sm rounded"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          </footer>
        )}

        {/*
          Här renderades tidigare "★ N/5 användarbetyg" och "N har sparat".
          Ingen kod i portalen — varken klient, edge-funktion eller
          `client/api` — skriver till `helpfulness_rating` eller
          `bookmark_count`, och båda är noll för samtliga 163 artiklar i prod.
          Ett fält som bara kan bli sant genom manuell inmatning i databasen är
          en fälla: social bevisning ingen mätt. Bygg betygsfunktionen först,
          rendera sedan.
        */}
        {article.difficulty && (
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
            <DifficultyBadge level={article.difficulty} size="sm" />
          </div>
        )}
      </article>

      {/* Related exercises */}
      {relatedExercises.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
            <Dumbbell className="text-[var(--c-text)] dark:text-[var(--c-text)]" size={24} />
            {t('article.relatedExercises')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedExercises.map((exercise) => {
              const Icon = exercise.icon
              return (
                <Link
                  key={exercise.id}
                  to={`/exercises?id=${exercise.id}`}
                  className="group block bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-4 hover:shadow-md transition-all border-l-4 border-l-[var(--c-solid)] dark:border-l-[var(--c-solid)]"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-[var(--c-text)] dark:text-[var(--c-text)]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-stone-900 dark:text-stone-100 group-hover:text-[var(--c-text)] dark:group-hover:text-[var(--c-text)] transition-colors mb-1">
                        {exercise.title}
                      </h3>
                      <p className="text-sm text-stone-600 dark:text-stone-300 line-clamp-2 mb-2">
                        {exercise.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
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
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-4">{t('article.relatedArticles')}</h2>
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
      <section className="bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-[var(--c-solid)] rounded-xl flex items-center justify-center flex-shrink-0">
            <Lightbulb size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">{t('article.needMoreHelp')}</h3>
            <p className="text-stone-600 dark:text-stone-300 text-sm mb-3">
              {t('article.helpDescription')}
            </p>
            {/* Länkade till /diary med texten "Boka ett möte". Dagboken
                bokar inga möten; konsulentvyn är där kontakten finns. */}
            <Link
              to="/my-consultant"
              className="inline-flex items-center gap-2 text-[var(--c-text)] font-medium hover:underline"
            >
              {t('article.contactConsultant', 'Till din konsulent')}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
