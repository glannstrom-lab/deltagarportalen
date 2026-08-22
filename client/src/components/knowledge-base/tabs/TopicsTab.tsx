/**
 * Kunskapsbankens filtrerade vy — kategoribläddring och sökresultat.
 *
 * Renderas av `pages/KnowledgeBase.tsx` när URL:en har `?category=` eller
 * `?q=`. Namnet "Tab" är historiskt: sidan har inga flikar sedan 2026-05-15,
 * och de fem syskonfilerna i den här mappen raderades 2026-08-22 (ingen av
 * dem monterades någonsin).
 *
 * ## Vad som rättades 2026-08-22
 *
 * - **Ingen `dark:` någonstans.** Filterpanelen var ett vitt kort på svart
 *   sida (rotorsak: `cardVariants.elevated` saknade `dark:`), rubrikerna
 *   mätte 1,15:1 och "Visa fler" var `bg-white` hårdkodat. 80 axe-noder.
 * - **Rubriken sa "Sökresultat" även när man bläddrade en kategori**, och
 *   kategorinamnet visades bara om kategorin råkade ha en illustration —
 *   `job-search`, den största med 27 artiklar, saknades i den kartan.
 * - **Sökningen läste inte artiklarnas text.** Klientfiltret matchar titel,
 *   sammanfattning och taggar; "Personligt brev" gav 4 träffar i UI mot 19 i
 *   innehållet. Nu kompletteras det med en serversökning som läser `content`.
 * - **Diakriter.** `lon` gav noll träffar där `lön` gav fjorton.
 * - **Filtren skrevs aldrig tillbaka till URL:en**, så bakåtknappen och en
 *   delad länk pekade fel så fort man ändrade något i panelen.
 * - `useMemo` användes för att köra `setVisibleCount` — en sidoeffekt i en
 *   funktion React inte lovar att köra.
 * - Tomtillståndet var ett handbyggt kort i stället för `<EmptySearch>`.
 */

import { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Grid, List, SlidersHorizontal, Search, ChevronDown } from '@/components/ui/icons'
import EnhancedArticleCard from '../EnhancedArticleCard'
import { Card, Input } from '@/components/ui'
import { EmptyState } from '@/components/ui/EmptyState'
import { MotionList } from '@/components/ui/MotionList'
import { contentArticleApi } from '@/services/contentApi'
import { kategoriNamn, harKategori } from '@/data/artikelkategorier'
import type { Article } from '@/types/knowledge'

/** Dekorativa ämnesbilder. Bannern ritas även utan bild — den ska inte vara
 *  villkorad av att en dekoration råkar finnas (se `job-search`, som saknades
 *  och därför lämnade portalens största kategori utan rubrik). */
const CATEGORY_ILLUSTRATIONS: Record<string, string> = {
  'getting-started': '/illustrations/spot-start.webp',
  'self-awareness': '/illustrations/spot-sjalvkannedom.webp',
  interview: '/illustrations/spot-intervju.webp',
  networking: '/illustrations/spot-natverk.webp',
  'digital-presence': '/illustrations/spot-digital.webp',
  'employment-law': '/illustrations/spot-ratt.webp',
  'career-development': '/illustrations/spot-karriarutveckling.webp',
  wellness: '/illustrations/spot-halsa.webp',
  accessibility: '/illustrations/spot-tillganglighet.webp',
  'job-market': '/illustrations/spot-arbetsmarknad.webp',
  tools: '/illustrations/spot-verktyg.webp',
  'easy-swedish': '/illustrations/spot-lattsvenska.webp',
}

interface TopicsTabProps {
  articles: Article[]
}

const VISIBLE_BATCH = 12

/** Viker bort diakriter så `lon` hittar `lön`. NFD delar upp `ö` i `o` + ¨,
 *  och kombinationstecknen (U+0300–U+036F) plockas bort. */
function vikOm(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export default function TopicsTab({ articles }: TopicsTabProps) {
  const { t } = useTranslation()
  const [sokParametrar, setSokParametrar] = useSearchParams()

  const searchQuery = sokParametrar.get('q') ?? ''
  const selectedCategory = sokParametrar.get('category') ?? ''

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [visibleCount, setVisibleCount] = useState(VISIBLE_BATCH)
  const [filterOppet, setFilterOppet] = useState(false)
  const rubrikRef = useRef<HTMLHeadingElement>(null)

  /** URL:en äger filtret. Panelen skriver hit, och bakåtknappen fungerar. */
  function sattFilter(nasta: { q?: string; category?: string }) {
    const params = new URLSearchParams(sokParametrar)
    for (const [nyckel, varde] of Object.entries(nasta)) {
      if (varde) params.set(nyckel, varde)
      else params.delete(nyckel)
    }
    setSokParametrar(params, { replace: true })
  }

  // Sidan börjar om på tolv när filtret ändras. Låg tidigare i en `useMemo`.
  useEffect(() => {
    setVisibleCount(VISIBLE_BATCH)
  }, [searchQuery, selectedCategory])

  // Flytta fokus till resultatrubriken när filtret ändras — men inte vid
  // första renderingen. Efter en sökning hamnade fokus på `<body>`, så
  // tangentbordsanvändaren fick tabba genom hela toppnaven igen. Rubriken
  // scrollas samtidigt in, vilket löser att kategorivyn öppnades mitt på
  // sidan när man klickat på ett kort längst ned i griden.
  const forstaRenderingen = useRef(true)
  useEffect(() => {
    if (forstaRenderingen.current) {
      forstaRenderingen.current = false
      return
    }
    rubrikRef.current?.focus({ preventScroll: true })
    rubrikRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [searchQuery, selectedCategory])

  /**
   * Serversökning som läser artiklarnas TEXT. Klientlistan har ingen
   * brödtext (den hämtas inte — se LISTKOLUMNER i contentApi), så den här
   * frågan returnerar bara slugs som vi sedan skär ur listan vi redan har.
   */
  const { data: innehallsTraffar } = useQuery({
    queryKey: ['article-content-search', searchQuery],
    queryFn: () => contentArticleApi.searchSlugs(searchQuery),
    enabled: searchQuery.trim().length >= 2,
    staleTime: 5 * 60 * 1000,
  })

  const kategorier = useMemo(() => {
    const set = new Set<string>()
    articles.forEach((a) => a.category && set.add(a.category))
    return Array.from(set).sort((a, b) => kategoriNamn(t, a).localeCompare(kategoriNamn(t, b), 'sv'))
  }, [articles, t])

  const filteredArticles = useMemo(() => {
    const fraga = vikOm(searchQuery.trim())
    const iInnehallet = new Set(innehallsTraffar ?? [])

    return articles.filter((article) => {
      if (fraga) {
        const traff =
          vikOm(article.title).includes(fraga) ||
          vikOm(article.summary ?? '').includes(fraga) ||
          (article.tags ?? []).some((tagg) => vikOm(tagg).includes(fraga)) ||
          iInnehallet.has(article.id)
        if (!traff) return false
      }
      if (selectedCategory && article.category !== selectedCategory) return false
      return true
    })
  }, [articles, searchQuery, selectedCategory, innehallsTraffar])

  const visibleArticles = filteredArticles.slice(0, visibleCount)
  const hasMore = filteredArticles.length > visibleCount
  const harFilter = !!searchQuery || !!selectedCategory

  const rubrik = selectedCategory
    ? kategoriNamn(t, selectedCategory)
    : searchQuery
      ? t('knowledgeBase.topics.resultsFor', { query: searchQuery, defaultValue: 'Träffar på "{{query}}"' })
      : t('knowledgeBase.topics.allArticles')

  const antalText = t('knowledgeBase.topics.articlesCount', {
    count: filteredArticles.length,
    defaultValue: '{{count}} artiklar',
  })

  const illustration = selectedCategory ? CATEGORY_ILLUSTRATIONS[selectedCategory] : undefined

  const kategoriKnapp = (id: string, etikett: string, antal: number, aktiv: boolean) => (
    <button
      key={id || 'alla'}
      onClick={() => sattFilter({ category: id })}
      aria-current={aktiv ? 'true' : undefined}
      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
        aktiv
          ? 'bg-[var(--c-bg)] text-[var(--c-text)] font-medium border border-[var(--c-accent)]'
          : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
      }`}
    >
      {etikett} ({antal})
    </button>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Filter.
          På mobil föll panelen överst med sina tretton kategoriknappar, så
          den som just klickat på en kategori mötte hela filterlistan igen
          innan första artikeln. Här är den hopfälld under lg. */}
      <div className="lg:col-span-1">
        <Card variant="elevated" className="lg:sticky lg:top-4">
          <button
            type="button"
            onClick={() => setFilterOppet((v) => !v)}
            aria-expanded={filterOppet}
            aria-controls="kb-filter"
            className="lg:hidden w-full flex items-center justify-between gap-2 font-semibold text-stone-800 dark:text-stone-100"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal size={18} aria-hidden="true" />
              {t('knowledgeBase.topics.filter')}
            </span>
            <ChevronDown
              size={18}
              aria-hidden="true"
              className={`transition-transform ${filterOppet ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Rubriknivå h4: panelen ligger FÖRE resultatets h2 i DOM:en, och
              h1 → h3 var ett hopp. */}
          <h4 className="hidden lg:flex items-center gap-2 mb-4 font-semibold text-stone-800 dark:text-stone-100">
            <SlidersHorizontal size={18} aria-hidden="true" />
            {t('knowledgeBase.topics.filter')}
          </h4>

          <div id="kb-filter" className={`${filterOppet ? 'block' : 'hidden'} lg:block mt-4 lg:mt-0`}>
            <div className="mb-4">
              <Input
                type="search"
                label={t('knowledgeBase.topics.searchLabel', 'Sök bland artiklarna')}
                placeholder={t('knowledgeBase.topics.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => sattFilter({ q: e.target.value })}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            <div className="space-y-2">
              <h5 className="text-sm font-medium text-stone-700 dark:text-stone-300">
                {t('knowledgeBase.topics.categories')}
              </h5>
              {kategoriKnapp('', t('knowledgeBase.topics.allCategories'), articles.length, !selectedCategory)}
              {kategorier.map((kategori) =>
                kategoriKnapp(
                  kategori,
                  kategoriNamn(t, kategori),
                  articles.filter((a) => a.category === kategori).length,
                  selectedCategory === kategori
                )
              )}
            </div>

            {harFilter && (
              <button
                onClick={() => sattFilter({ q: '', category: '' })}
                className="w-full mt-4 py-2 text-sm text-[var(--c-text)] hover:underline"
              >
                {t('knowledgeBase.topics.clearFilters')}
              </button>
            )}
          </div>
        </Card>
      </div>

      {/* Resultat */}
      <div className="lg:col-span-3">
        {/* Ämnesbanner. Ritas för varje känd kategori — bilden är dekor. */}
        {selectedCategory && harKategori(selectedCategory) && (
          <div className="flex items-center gap-4 mb-5 p-4 rounded-xl bg-[var(--c-bg)] border border-[var(--c-accent)]/50">
            {illustration && (
              <img src={illustration} alt="" aria-hidden="true" className="w-16 h-16 flex-shrink-0 select-none" />
            )}
            <p className="text-sm text-[var(--c-text)] m-0">
              {t('knowledgeBase.topics.browsingCategory', {
                category: kategoriNamn(t, selectedCategory),
                defaultValue: 'Du bläddrar i {{category}}.',
              })}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h2
              ref={rubrikRef}
              tabIndex={-1}
              className="text-lg font-semibold text-stone-900 dark:text-stone-100 focus:outline-none"
            >
              {rubrik}
            </h2>
            {/* Liveregionen ligger permanent i DOM:en — en region som monteras
                tillsammans med sin text annonseras normalt inte. */}
            <p role="status" aria-live="polite" className="text-sm text-stone-700 dark:text-stone-300">
              {antalText}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-700 rounded-lg p-1 flex-shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              aria-pressed={viewMode === 'grid'}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-stone-800 shadow-sm' : 'text-stone-700 dark:text-stone-300'}`}
              aria-label={t('knowledgeBase.topics.gridView')}
            >
              <Grid className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white dark:bg-stone-800 shadow-sm' : 'text-stone-700 dark:text-stone-300'}`}
              aria-label={t('knowledgeBase.topics.listView')}
            >
              <List className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {filteredArticles.length === 0 ? (
          /* `EmptySearch` hårdkodar rubriken "Inga resultat för …", vilket
             läses fel när tomheten kommer av ett kategorifilter utan sökord. */
          <EmptyState
            illustration="resurser"
            title={t('knowledgeBase.topics.emptyTitle', 'Vi hittade ingen artikel som matchar')}
            description={t('knowledgeBase.topics.emptyDescription', 'Prova ett kortare sökord, eller bläddra bland ämnena i listan.')}
            action={{
              label: t('knowledgeBase.topics.clearFilters'),
              onClick: () => sattFilter({ q: '', category: '' }),
              variant: 'outline',
            }}
          />
        ) : viewMode === 'grid' ? (
          <MotionList className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0 m-0">
            {visibleArticles.map((article) => (
              <EnhancedArticleCard key={article.id} article={article} />
            ))}
          </MotionList>
        ) : (
          <div className="space-y-3">
            {visibleArticles.map((article) => (
              <EnhancedArticleCard key={article.id} article={article} variant="compact" />
            ))}
          </div>
        )}

        {hasMore && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setVisibleCount((c) => c + VISIBLE_BATCH)}
              className="px-5 py-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-[var(--c-text)] font-medium hover:bg-[var(--c-bg)] hover:border-[var(--c-accent)] transition-colors"
            >
              {t('knowledgeBase.topics.showMore', 'Visa fler')}{' '}
              <span className="text-stone-600 dark:text-stone-400 font-normal">
                ({t('knowledgeBase.topics.remainingCount', {
                  count: filteredArticles.length - visibleCount,
                  defaultValue: '{{count}} kvar',
                })})
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
