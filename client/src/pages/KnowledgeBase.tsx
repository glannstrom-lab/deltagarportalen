/**
 * Knowledge Base — landningsvy med sökning och kategorigrid.
 *
 * Designval (2026-05-15): inga flikar. Sök är primär navigation, kategorikort
 * sekundär. URL:en styr vilken vy som visas:
 *   /knowledge-base                  → landning
 *   /knowledge-base?category=<key>   → filtrerad lista (TopicsTab)
 *   /knowledge-base?q=<query>        → sökresultat (TopicsTab)
 *
 * ## Vad som rättades 2026-08-22
 *
 * - **Fem hubbpasteller samtidigt.** `DOMAIN_BG` gav de tretton
 *   kategorikorten emerald, orange, pink, sky och violet efter vilken hubb
 *   kategorin råkade mappas till — en upplysning läsaren inte kan använda,
 *   eftersom kunskapsbanken ligger i Resurser oavsett. DESIGN.md §4 tillåter
 *   ett undantag (Översikt), och det här är inte det. Variationen bärs nu av
 *   ikonen, som §4 föreskriver.
 * - **43 hårdkodade svenska strängar**, inklusive alla tretton kategorinamn
 *   och beskrivningar. En engelsk användare bytte språk och fick tre saker
 *   översatta: skenans rubrik, underrubriken och sökfältets `aria-label`.
 * - **Sökrutan var handbyggd** — egen ram, egen skugga, egen fokusmarkering,
 *   ingen etikett, ingen felhantering. Tryckte man Sök med tomt fält hände
 *   ingenting alls, utan besked. `Input` tio rader bort i TopicsTab gör allt
 *   detta redan.
 * - **Inget felläge.** Hooken hade två lägen, laddar och klart, för att
 *   `contentApi` svalde varje fel och returnerade 141 inbyggda artiklar.
 *   Nycklarna `couldNotLoad` och `tryAgain` fanns i språkfilerna sedan länge
 *   — tillståndet de skrevs för fanns inte.
 * - "Populära ämnen" var fem handskrivna strängar presenterade som en
 *   mätning. Ingenting loggar sökningar. "CV-skrivning" gav 1 träff av de 17
 *   artiklar som handlar om CV.
 */

import { useMemo, Suspense, lazy } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, LoadingState, EmptyState, Input, Button } from '@/components/ui'
import { useArticles } from '@/hooks/knowledge-base/useArticles'
import { PageLayout } from '@/components/layout/index'
import { BookOpen, Search, ArrowRight, Bot, AlertCircle } from '@/components/ui/icons'
import { useFocusMode } from '@/components/FocusModeProvider'
import { FocusKnowledgeBaseWizard } from '@/components/focus/pages/FocusKnowledgeBaseWizard'
import { RadgivarTips } from '@/components/radgivare/RadgivarPanel'
import { FokusVaxel } from '@/components/focus/shell/FokusVaxel'
import { ARTIKELKATEGORIER, kategoriNamn, kategoriBeskrivning } from '@/data/artikelkategorier'

const TopicsTab = lazy(() => import('@/components/knowledge-base/tabs/TopicsTab'))

/**
 * Genvägar till vanliga frågor.
 *
 * Rubriken sa tidigare "Populära ämnen", vilket är ett påstående om vad andra
 * användare gör. Ingenting mäter det. Termerna är dessutom bytta mot ord som
 * faktiskt fångar sitt ämne: "CV-skrivning" fanns bara i en av sjutton
 * CV-artiklar, medan "CV" fångar alla.
 */
const GENVAGAR = ['CV', 'personligt brev', 'avslag', 'lön', 'intervju']

function TabLoader({ message }: { message?: string }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center rounded-xl">
      <LoadingState title={message || 'Laddar…'} />
    </div>
  )
}

export default function KnowledgeBase() {
  const { t } = useTranslation()
  const { leaveWizard } = useFocusMode()

  return (
    <FokusVaxel
      title={t('knowledgeBase.title', 'Kunskapsbank')}
      icon={BookOpen}
      domain="info"
      guide={<FocusKnowledgeBaseWizard onExit={leaveWizard} />}
    >
      <KnowledgeBaseInner />
    </FokusVaxel>
  )
}

function KnowledgeBaseInner() {
  const { t } = useTranslation()
  const [sokParametrar] = useSearchParams()
  const categoryFilter = sokParametrar.get('category')
  const queryFilter = sokParametrar.get('q')

  const { data: articles, isLoading, isError, refetch } = useArticles()

  const sidtitel = t('knowledgeBase.title', 'Kunskapsbank')

  if (isLoading) {
    return (
      <PageLayout title={sidtitel} domain="info">
        <TabLoader message={t('knowledgeBase.loadingContent', 'Laddar…')} />
      </PageLayout>
    )
  }

  // Tredje läget. Fram till 2026-08-22 fanns bara laddar och klart, eftersom
  // servicen bytte varje fel mot 141 inbyggda artiklar.
  if (isError) {
    return (
      <PageLayout title={sidtitel} domain="info">
        <EmptyState
          icon={AlertCircle}
          title={t('knowledgeBase.couldNotLoad', 'Vi kunde inte hämta artiklarna')}
          description={t(
            'knowledgeBase.couldNotLoadDescription',
            'Det är inte din uppkoppling det är fel på med säkerhet — men försök gärna igen om en stund.'
          )}
          action={{ label: t('knowledgeBase.tryAgain', 'Försök igen'), onClick: () => refetch(), variant: 'outline' }}
        />
      </PageLayout>
    )
  }

  if (categoryFilter || queryFilter) {
    return (
      <PageLayout
        title={sidtitel}
        subtitle={
          categoryFilter
            ? kategoriNamn(t, categoryFilter)
            : t('knowledgeBase.searchResultsSubtitle', 'Sökresultat')
        }
        domain="info"
        actions={
          <Link
            to="/knowledge-base"
            className="inline-flex items-center gap-1 text-[13px] text-[var(--c-text)] hover:underline"
          >
            ← {t('knowledgeBase.allTopics', 'Alla ämnen')}
          </Link>
        }
      >
        <Suspense fallback={<TabLoader />}>
          <TopicsTab articles={articles ?? []} />
        </Suspense>
      </PageLayout>
    )
  }

  // Rubriken bor i skenan som på portalens övriga sidor. Fram till 2026-08-18
  // skickade landningen `title=""` för att slippa dubbel rubrik — följden var
  // att kunskapsbanken blev enda sidan utan skena.
  return (
    <PageLayout
      title={sidtitel}
      subtitle={t('knowledgeBase.subtitle', 'Artiklar och guider för jobbsökare')}
      domain="info"
    >
      <KnowledgeBaseLanding articles={articles ?? []} />
    </PageLayout>
  )
}

interface LandingProps {
  articles: { id: string; category?: string; title: string; readingTime?: number }[]
}

function KnowledgeBaseLanding({ articles }: LandingProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const a of articles) {
      if (a.category) map[a.category] = (map[a.category] || 0) + 1
    }
    return map
  }, [articles])

  const totalArticles = articles.length

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget as HTMLFormElement)
    const q = String(data.get('kb-sok') ?? '').trim()
    if (q) navigate(`/knowledge-base?q=${encodeURIComponent(q)}`)
  }

  return (
    <div className="space-y-8">
      {/* Sökrutan är sidans arbete och står därför först. */}
      <section>
        {/* Etikett och hjälptext ligger UTANFÖR flexraden. Låg de i `Input`
            växte fältets omslutning nedåt, och `items-end` sköt då ner
            Sök-knappen 32 px under fältet. */}
        <form onSubmit={handleSearch} role="search">
          <label htmlFor="kb-sok" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
            {t('knowledgeBase.searchLabel', 'Vad letar du efter?')}
          </label>
          <div className="flex items-stretch gap-2">
            <div className="flex-1 min-w-0">
              <Input
                id="kb-sok"
                type="search"
                name="kb-sok"
                aria-describedby="kb-sok-hjalp"
                placeholder={t('knowledgeBase.searchPlaceholderShort', 'Sök i kunskapsbanken')}
                leftIcon={<Search className="w-5 h-5" />}
                touchOptimized
              />
            </div>
            <Button type="submit" className="flex-shrink-0">
              {t('knowledgeBase.searchButton', 'Sök')}
            </Button>
          </div>
          {totalArticles > 0 && (
            <p id="kb-sok-hjalp" className="mt-1.5 text-sm text-stone-700 dark:text-stone-300">
              {t('knowledgeBase.searchHint', {
                count: totalArticles,
                defaultValue: 'Söker i {{count}} artiklar — prova "personligt brev", "avslag" eller "lön".',
              })}
            </p>
          )}
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-stone-600 dark:text-stone-400 mr-1">
            {t('knowledgeBase.shortcutsLabel', 'Prova något av det här:')}
          </span>
          {GENVAGAR.map((q) => (
            <Link
              key={q}
              to={`/knowledge-base?q=${encodeURIComponent(q)}`}
              className="inline-flex items-center min-h-[44px] px-3 rounded-full border border-[var(--c-accent)] bg-[var(--c-bg)] text-[var(--c-text)] font-medium hover:bg-[var(--c-accent)]/50 transition-colors"
            >
              {q}
            </Link>
          ))}
        </div>
      </section>

      <RadgivarTips pathname="/knowledge-base" index={0} />

      {/* KATEGORIGRID */}
      <section>
        <h2 className="text-xl md:text-2xl font-bold text-stone-900 dark:text-stone-50 tracking-tight mb-6">
          {t('knowledgeBase.browseHeading', 'Vad vill du läsa om?')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ARTIKELKATEGORIER.map((cat) => {
            const Icon = cat.ikon
            const count = counts[cat.id] || 0
            const namn = kategoriNamn(t, cat.id)
            const antalText = t('knowledgeBase.categoryCount', {
              count,
              defaultValue: '{{count}} artiklar',
            })
            return (
              <Link
                key={cat.id}
                to={`/knowledge-base?category=${cat.id}`}
                // Utan avgränsare läste skärmläsaren "…effektivt.27 artiklar".
                aria-label={`${namn} — ${count > 0 ? antalText : t('knowledgeBase.categoryEmpty', 'fylls på')}`}
                className="group block bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--c-accent)]"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3.5 bg-[var(--c-bg)] text-[var(--c-text)] border border-[var(--c-accent)]/50">
                  <Icon size={22} aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-stone-900 dark:text-stone-50 mb-1 group-hover:text-[var(--c-text)] transition-colors">
                  {namn}
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-300 mb-3 leading-snug">
                  {kategoriBeskrivning(t, cat.id)}
                </p>
                <div className="text-xs font-medium text-stone-600 dark:text-stone-400">
                  {count > 0 ? antalText : t('knowledgeBase.categoryEmpty', 'Fylls på')}
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* CTA: AI-team */}
      <section>
        <Card className="bg-[var(--c-bg)] border-[var(--c-accent)]/50 p-6 md:p-7">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <div className="flex-1">
              <h2 className="font-bold text-stone-900 dark:text-stone-50 mb-1 flex items-center gap-2">
                <Bot size={20} className="text-[var(--c-solid)]" aria-hidden="true" />
                {t('knowledgeBase.aiTeamHeading', 'Hittar du inte svar?')}
              </h2>
              <p className="text-sm text-stone-700 dark:text-stone-300">
                {t(
                  'knowledgeBase.aiTeamBody',
                  'AI-teamet kan svara på frågor som inte täcks i artiklarna. Fem inriktningar av samma AI.'
                )}
              </p>
            </div>
            <Link
              to="/ai-team"
              className="inline-flex items-center justify-center gap-2 bg-[var(--c-solid)] hover:bg-[var(--c-text)] text-white font-semibold text-sm px-5 py-3 rounded-lg transition-colors whitespace-nowrap"
            >
              {t('knowledgeBase.aiTeamCta', 'Öppna AI-teamet')}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </Card>
      </section>
    </div>
  )
}
