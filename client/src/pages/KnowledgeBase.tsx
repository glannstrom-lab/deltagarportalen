/**
 * Knowledge Base — landing-vy med sökning och kategori-grid.
 *
 * Designval (2026-05-15): inga flikar. Sök är primary nav. Kategori-kort är
 * andra nav. URL-state styr om vi visar landing eller filtrerad vy:
 *   /knowledge-base                  → landing
 *   /knowledge-base?category=<key>   → filtrerad lista (TopicsTab)
 *   /knowledge-base?q=<query>        → sökresultat (TopicsTab)
 */

import { useState, useMemo, Suspense, lazy } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, LoadingState } from '@/components/ui'
import { useArticles } from '@/hooks/knowledge-base/useArticles'
import { useAuthStore } from '@/stores/authStore'
import { PageLayout } from '@/components/layout/index'
import {
  BookOpen,
  Search,
  ArrowRight,
  Bot,
  Rocket,
  UserCircle,
  Target,
  Network,
  Monitor,
  Scale,
  TrendingUp,
  Heart,
  Accessibility,
  Briefcase,
  Wrench,
  Languages,
} from '@/components/ui/icons'
import { useFocusMode } from '@/components/FocusModeProvider'
import { PageFocusShell } from '@/components/focus/shell/PageFocusShell'
import { FocusKnowledgeBaseWizard } from '@/components/focus/pages/FocusKnowledgeBaseWizard'

const TopicsTab = lazy(() => import('@/components/knowledge-base/tabs/TopicsTab'))

type CategoryDomain = 'action' | 'activity' | 'coaching' | 'info' | 'wellbeing'

interface CategoryDef {
  id: string
  name: string
  description: string
  icon: typeof Rocket
  domain: CategoryDomain
}

/**
 * 13 huvudkategorier i kunskapsbasen, med Lucide-ikon och hub-domain
 * (driver pastellfärg på ikon-tilen). Antalet artiklar räknas runtime.
 */
const CATEGORIES: CategoryDef[] = [
  { id: 'getting-started', name: 'Komma igång', description: 'Orientering i portalen och första stegen i din jobbsökning.', icon: Rocket, domain: 'action' },
  { id: 'self-awareness', name: 'Självkännedom', description: 'Förstå dina styrkor, intressen och personlighet för att hitta rätt yrke.', icon: UserCircle, domain: 'coaching' },
  { id: 'job-search', name: 'Jobbsökning', description: 'Strategier och tekniker för att hitta och söka jobb effektivt.', icon: Search, domain: 'activity' },
  { id: 'interview', name: 'Intervju och anställning', description: 'Förberedelser, intervjuteknik och anställningsprocessen.', icon: Target, domain: 'activity' },
  { id: 'networking', name: 'Nätverkande', description: 'Bygg och underhåll ett professionellt nätverk som öppnar dörrar.', icon: Network, domain: 'coaching' },
  { id: 'digital-presence', name: 'Digital närvaro', description: 'Optimera din online-profil och synlighet för rekryterare.', icon: Monitor, domain: 'info' },
  { id: 'employment-law', name: 'Arbetsrätt och anställning', description: 'Dina rättigheter, skyldigheter och vad du behöver veta om anställning.', icon: Scale, domain: 'info' },
  { id: 'career-development', name: 'Karriärutveckling', description: 'Planera och utveckla din karriär på lång sikt.', icon: TrendingUp, domain: 'coaching' },
  { id: 'wellness', name: 'Välmående och motivation', description: 'Stöd för mental hälsa och motivation i jobbsökningen.', icon: Heart, domain: 'wellbeing' },
  { id: 'accessibility', name: 'Tillgänglighet och stöd', description: 'Rättigheter, stöd och anpassningar.', icon: Accessibility, domain: 'info' },
  { id: 'job-market', name: 'Arbetsmarknaden', description: 'Information om arbetsmarknaden och olika branscher.', icon: Briefcase, domain: 'activity' },
  { id: 'tools', name: 'Praktiska verktyg', description: 'Checklistor, mallar och praktiska guider.', icon: Wrench, domain: 'info' },
  { id: 'easy-swedish', name: 'Lätt svenska', description: 'Artiklar skrivna på enkel och lättförståelig svenska.', icon: Languages, domain: 'info' },
]

const POPULAR_QUERIES = ['CV-skrivning', 'Personligt brev', 'Hantera avslag', 'Löneförhandling', 'Intervjufrågor']

const DOMAIN_BG: Record<CategoryDomain, string> = {
  action: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  activity: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  coaching: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  info: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  wellbeing: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
}

function TabLoader({ message }: { message?: string }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center rounded-xl">
      <LoadingState title={message || 'Laddar...'} />
    </div>
  )
}

export default function KnowledgeBase() {
  const { t } = useTranslation()
  const { isFocusMode, toggleFocusMode } = useFocusMode()

  if (isFocusMode) {
    return (
      <PageFocusShell
        title={t('knowledgeBase.title', 'Kunskapsbank')}
        icon={BookOpen}
        domain="info"
      >
        <FocusKnowledgeBaseWizard onExit={toggleFocusMode} />
      </PageFocusShell>
    )
  }

  return <KnowledgeBaseInner />
}

function KnowledgeBaseInner() {
  const { t } = useTranslation()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const categoryFilter = params.get('category')
  const queryFilter = params.get('q')

  const { data: articles, isLoading } = useArticles()

  if (isLoading) {
    return (
      <PageLayout title={t('knowledgeBase.title', 'Kunskapsbank')} domain="info" className="max-w-5xl mx-auto">
        <TabLoader message={t('knowledgeBase.loadingContent', 'Laddar...')} />
      </PageLayout>
    )
  }

  // Filtrerad vy om URL har category eller q — återanvänd TopicsTab
  if (categoryFilter || queryFilter) {
    return (
      <PageLayout title={t('knowledgeBase.title', 'Kunskapsbank')} domain="info" className="max-w-7xl mx-auto">
        <Suspense fallback={<TabLoader />}>
          <TopicsTab articles={articles || []} />
        </Suspense>
      </PageLayout>
    )
  }

  // Ingen title — landing-vyn har egen H1 i hero
  return (
    <PageLayout title="" domain="info" className="max-w-5xl mx-auto">
      <KnowledgeBaseLanding articles={articles || []} />
    </PageLayout>
  )
}

interface LandingProps {
  articles: { id: string; category?: string; title: string; readingTime?: number }[]
}

function KnowledgeBaseLanding({ articles }: LandingProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState('')
  const { profile } = useAuthStore()

  // Räkna artiklar per huvud-kategori (matchar både category och subcategory)
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
    const q = searchValue.trim()
    if (q) navigate(`/knowledge-base?q=${encodeURIComponent(q)}`)
  }

  const firstName = profile?.first_name

  return (
    <div className="space-y-12">
      {/* HERO */}
      <section>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-50 mb-2 tracking-tight">
          {firstName ? `Hej ${firstName}` : 'Kunskapsbank'}
        </h1>
        <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 mb-7 max-w-2xl">
          Hitta artiklar, guider och svar på vanliga frågor om jobbsökning. Allt som finns i portalen, sökbart.
        </p>

        <form onSubmit={handleSearch} className="flex items-center gap-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl pl-4 pr-2 py-2 shadow-sm focus-within:border-[var(--c-solid)] focus-within:shadow-md transition-all">
          <Search className="text-stone-400 dark:text-stone-500 flex-shrink-0" size={20} aria-hidden="true" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={totalArticles > 0
              ? `Sök bland ${totalArticles} artiklar — t.ex. "personligt brev", "avslag", "lön"…`
              : `Sök artiklar — t.ex. "personligt brev", "avslag", "lön"…`}
            className="flex-1 bg-transparent border-0 outline-none py-2.5 text-base text-gray-800 dark:text-gray-100 placeholder:text-stone-400 dark:placeholder:text-stone-500"
            aria-label={t('knowledgeBase.searchAria', 'Sök i kunskapsbanken')}
          />
          <button
            type="submit"
            className="bg-[var(--c-solid)] hover:bg-[var(--c-text)] text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
          >
            Sök
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-x-1 gap-y-2 text-sm">
          <span className="text-gray-500 dark:text-gray-400 mr-2">Populära ämnen:</span>
          {POPULAR_QUERIES.map((q) => (
            <Link
              key={q}
              to={`/knowledge-base?q=${encodeURIComponent(q)}`}
              className="text-[var(--c-solid)] dark:text-[var(--c-solid)]/80 hover:underline font-medium px-2 py-1"
            >
              {q}
            </Link>
          ))}
        </div>
      </section>

      {/* KATEGORI-GRID */}
      <section>
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
            Bläddra efter ämne
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            {CATEGORIES.length} kategorier
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const count = counts[cat.id] || 0
            return (
              <Link
                key={cat.id}
                to={`/knowledge-base?category=${cat.id}`}
                className="group block bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-stone-300 dark:hover:border-stone-600"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3.5 ${DOMAIN_BG[cat.domain]}`}>
                  <Icon size={22} aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-1 group-hover:text-[var(--c-solid)] transition-colors">
                  {cat.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 leading-snug">
                  {cat.description}
                </p>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {count === 0 ? 'Inga artiklar än' : `${count} artiklar`}
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* CTA: AI-team */}
      <section>
        <Card className="bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50 p-6 md:p-7">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 dark:text-gray-50 mb-1 flex items-center gap-2">
                <Bot size={20} className="text-[var(--c-solid)]" aria-hidden="true" />
                Hittar du inte svar?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                AI-teamet kan svara på frågor som inte täcks i artiklarna. Fem agenter med olika inriktning.
              </p>
            </div>
            <Link
              to="/ai-team"
              className="inline-flex items-center gap-2 bg-[var(--c-solid)] hover:bg-[var(--c-text)] text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap"
            >
              Öppna AI-teamet
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </Card>
      </section>
    </div>
  )
}
