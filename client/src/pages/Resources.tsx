/**
 * Dina sparade resurser — allt användaren själv har sparat i portalen.
 *
 * Fyra flikar via `?tab=`: allt, dokument (CV-versioner, brev, intresseguide),
 * jobb och bokmärkta artiklar.
 *
 * ## Genomgången 2026-08-22 — vad som var fel och varför det står så här nu
 *
 * **Ett tal per sak.** Fliken "Jobb" räknade hela ansökningspipelinen medan
 * listan under visade bara det som fortfarande var sparat: 26 mot 23 i prod,
 * tio pixlar från varandra i samma skena. Fliken "Dokument" räknade N
 * CV-versioner som 1 och ignorerade intresseguiden — 4 i skenan mot 7 kort på
 * skärmen. Varje tal på den här sidan härleds nu ur exakt den mängd som
 * renderas; går de isär är det en bugg, inte ett medvetet undantag.
 *
 * **Ett fel i en hämtning tömmer inte sidan.** `loadData` körde sex anrop i ett
 * `Promise.all` med ett gemensamt `catch` som bara loggade. Föll ett av dem
 * mötte en användare med tolv sparade saker texten "Inga sparade resurser
 * ännu". Nu är det `allSettled`: det som gick fram visas, och det som föll
 * namnges i en ruta ovanför. Tomtillståndet får bara visas när vi vet att det
 * ÄR tomt.
 *
 * **Statusarna kommer ur `APPLICATION_STATUS_CONFIG`**, inte ur en egen
 * literal. Den lokala listan hade fem av elva statusar och saknade
 * `INTERESTED` — den enda utöver `SAVED` som sidan faktiskt renderar. Tre
 * rader i prod fick därför en tom bricka med `undefined undefined` i
 * klassattributet.
 *
 * **Exporten ligger i `services/`.** Sidan bar 224 rader egen PDF- och
 * Word-generering som var föregångare till de delade tjänsterna: brevet fick
 * dagens datum i stället för sitt eget, tappade AI-märkningen och saknade
 * avsändare, och CV:t exporterades som en linjär textström medan `/cv` gav
 * sidobarslayouten. Samma användare fick två olika dokument beroende på vilken
 * knapp hen tryckte.
 *
 * **Tokenfällan:** `--c-accent` är MÖRK i mörkt läge (#2A4F70) medan
 * `--c-text` vänder med temat (#1F5985 ljust → #B5D8F0 mörkt). `--c-text`
 * ensam räcker alltså i båda lägena — 7,43:1 mot vitt och 10,15:1 mot
 * stone-800 — medan `dark:text-[var(--c-accent)]` ger 1,77:1. Accenten
 * duger som dekorativ sektionskant, inte som text och inte som kant runt
 * en knapp.
 *
 * **Borttaget, inte flyttat:** vylägesväxeln (`viewMode` lästes bara av
 * knapparnas egen färg) och hela `uploadedFiles` (som sin egen kodkommentar
 * konstaterade aldrig var byggd, men vars nyckeltal ändå visade ett hårt "0").
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  BookOpen,
  FileText,
  Heart,
  Bookmark,
  ChevronRight,
  Trash2,
  ExternalLink,
  Loader2,
  Sparkles,
  Building2,
  MapPin,
  Clock,
  Eye,
  X,
  FileDown,
  Edit2,
  Plus,
  Search,
  Award,
  AlertTriangle,
  Briefcase as BriefcaseIcon,
  Briefcase,
  FileText as DocumentText,
  GraduationCap,
  Wrench,
  Languages,
  Mail,
  Phone,
  MapPinned,
} from '@/components/ui/icons'
import { articleBookmarksApi } from '@/services/cloudStorage'
import { savedJobsApi } from '@/services/jobsApi'
import { cvApi } from '@/services/cvApi'
import { coverLetterApi } from '@/services/coverLetterApi'
import { interestApi } from '@/services/interestApi'
import { PageLayout } from '@/components/layout/index'
import type { PageStat } from '@/components/layout/PageTabs'
import { PDFExportButton } from '@/components/pdf/PDFExportButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { showToast } from '@/components/Toast'
import { useFocusMode } from '@/components/FocusModeProvider'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { FocusResourcesWizard } from '@/components/focus/pages/FocusResourcesWizard'
import { RadgivarTips } from '@/components/radgivare/RadgivarPanel'
import { FokusVaxel } from '@/components/focus/shell/FokusVaxel'
import { useProfileStore } from '@/stores/profileStore'
import { APPLICATION_STATUS_CONFIG } from '@/types/application.types'
import { STATUS_IKONER, statusnyckel, arSparat } from '@/data/ansokningsstatus'
import { kategoriNamn } from '@/data/artikelkategorier'
import { generateCVWord } from '@/services/cvWordExport'
import { generateCoverLetterPDF, downloadPDF } from '@/services/pdfExportService'
import { generateCoverLetterWord } from '@/services/coverLetterWordExport'

// ============================================================================
// Typer
// ============================================================================

/**
 * `status` är en fri sträng, inte en femvärdesunion.
 *
 * Den gamla typen påstod `'SAVED' | 'APPLIED' | 'INTERVIEW' | 'REJECTED' |
 * 'ACCEPTED'`, medan prods check constraint tillåter elva värden. Följden var
 * en cast (`job.status as string`) för att över huvud taget kunna jämföra med
 * `'INTERESTED'` — typen ljög, och den tomma statusbrickan var följdverkan.
 * `statusnyckel()` är den enda vägen från databasvärdet till en känd status.
 */
interface SavedJob {
  id: string
  job_id: string
  job_data: {
    headline?: string
    employer?: { name?: string }
    workplace_address?: { municipality?: string }
    description?: { text?: string }
    webpage_url?: string
  }
  status: string
  created_at: string
}

interface BookmarkedArticle {
  id: string
  title: string
  /** Kategorinyckel ur `articles.category_key` — översätts med `kategoriNamn`. */
  category: string
  readingTime?: number
  summary?: string
}

interface CoverLetter {
  id: string
  title: string
  company?: string
  job_title?: string
  content: string
  created_at: string
  ai_generated: boolean
}

interface CVVersion {
  id: string
  name: string
  created_at: string
  data: CVData
}

interface CVData {
  firstName?: string
  lastName?: string
  title?: string
  email?: string
  phone?: string
  location?: string
  summary?: string
  workExperience?: Array<{
    title: string
    company: string
    description?: string
    startDate?: string
    endDate?: string
    current?: boolean
  }>
  education?: Array<{
    degree: string
    school: string
    startDate?: string
    endDate?: string
  }>
  skills?: Array<{ id: string; name: string; level?: number; category?: string }> | string[]
  languages?: Array<{
    language: string
    level: string
  }>
  template?: string
  colorScheme?: string
  font?: string
  profileImage?: string | null
}

interface InterestResult {
  completed_at: string
  recommended_jobs?: string[]
}

// ============================================================================
// Kort
// ============================================================================

/**
 * Kompakt dokumentkort. Rubriken är `<h3>` — sektionerna runt om är `<h2>`,
 * så korten är barn till sin sektion och inte syskon till den.
 */
function DocumentCard({
  title,
  subtitle,
  type,
  date,
  actions,
  icon: Icon,
}: {
  title: string
  subtitle?: string
  type: string
  date: string
  actions: React.ReactNode
  icon: React.ComponentType<{ size?: number; className?: string }>
}) {
  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden hover:shadow-md transition-all group">
      <div className="p-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--c-solid)] rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-[var(--c-on-solid)]" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-stone-800 dark:text-stone-100 truncate text-sm">{title}</h3>
            {subtitle && <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{subtitle}</p>}
            <div className="flex items-center gap-2 mt-1">
              {/* dark:bg-stone-800 (inte -700): #a8a29e på stone-700 mätte
                  4,07:1, alltså under AA. På stone-800 blir det 6,0:1. */}
              <span className="text-xs px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded">{type}</span>
              <span className="text-xs text-stone-500 dark:text-stone-400">{date}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="px-3 py-2 bg-stone-50 dark:bg-stone-900/50 border-t border-stone-100 dark:border-stone-700 flex items-center gap-2">
        {actions}
      </div>
    </div>
  )
}

/** Sektionsrubrik — alltid `<h2>`, med valfri länk till fördjupningen. */
function Sektionsrubrik({
  ikon: Ikon,
  children,
  lank,
}: {
  ikon: React.ComponentType<{ size?: number; className?: string }>
  children: React.ReactNode
  lank?: { till: string; text: string; ikon?: React.ComponentType<{ size?: number }> }
}) {
  const LankIkon = lank?.ikon ?? ChevronRight
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-100 flex items-center gap-2">
        <Ikon className="text-[var(--c-text)]" size={18} aria-hidden="true" />
        {children}
      </h2>
      {lank && (
        <Link
          to={lank.till}
          className="text-xs text-[var(--c-text)] hover:underline font-medium flex items-center gap-1"
        >
          {lank.text}
          <LankIkon size={14} aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}

// ============================================================================
// Datahämtning
// ============================================================================

/** De sex källorna sidan läser. Namnen används i felrutan. */
const KALLOR = ['jobb', 'bokmarken', 'brev', 'cv', 'versioner', 'intresseguide'] as const
type Kalla = (typeof KALLOR)[number]

// ============================================================================
// Sidan
// ============================================================================

function ResourcesInner() {
  const { t, i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'all'
  const { confirm } = useConfirmDialog()
  const profile = useProfileStore((s) => s.profile)
  const loadProfile = useProfileStore((s) => s.loadProfile)

  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [bookmarkedArticles, setBookmarkedArticles] = useState<BookmarkedArticle[]>([])
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([])
  const [cvData, setCvData] = useState<CVData | null>(null)
  const [cvVersions, setCvVersions] = useState<CVVersion[]>([])
  const [interestResult, setInterestResult] = useState<InterestResult | null>(null)
  const [loading, setLoading] = useState(true)
  /** Källor vars hämtning föll. Tom lista = allt kom fram. */
  const [trasigaKallor, setTrasigaKallor] = useState<Kalla[]>([])
  const [previewModal, setPreviewModal] = useState<{ type: string; data: CVData | CoverLetter | SavedJob } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  /** Text som läses upp efter en åtgärd (radering, sökning, filbygge). */
  const [besked, setBesked] = useState('')
  /** Id på det dokument som just nu byggs, så knappen kan visa det. */
  const [bygger, setBygger] = useState<string | null>(null)

  const modalRubrikId = 'resources-forhandsgranskning-rubrik'
  const modalRef = useFocusTrap<HTMLDivElement>(!!previewModal, {
    onEscape: () => setPreviewModal(null),
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    const utfall = await Promise.allSettled([
      savedJobsApi.getAll(),
      articleBookmarksApi.getBookmarks(),
      coverLetterApi.getAll(),
      cvApi.getCV(),
      cvApi.getVersions(),
      interestApi.getResult(),
    ])

    // Varje källa hanteras för sig. Det som kom fram visas; det som föll
    // namnges. Ett gemensamt catch gjorde tidigare en trasig hämtning
    // omöjlig att skilja från ett tomt konto.
    const trasiga: Kalla[] = []
    utfall.forEach((res, i) => {
      if (res.status === 'rejected') {
        trasiga.push(KALLOR[i])
        console.error(`[resources] kunde inte hämta ${KALLOR[i]}:`, res.reason)
      }
    })

    const varde = <T,>(i: number, reserv: T): T =>
      utfall[i].status === 'fulfilled' ? ((utfall[i] as PromiseFulfilledResult<T>).value ?? reserv) : reserv

    setSavedJobs(varde<SavedJob[]>(0, []) as unknown as SavedJob[])
    setBookmarkedArticles(varde<BookmarkedArticle[]>(1, []))
    setCoverLetters(varde<CoverLetter[]>(2, []))
    setCvData(varde<CVData | null>(3, null))
    setCvVersions(varde<CVVersion[]>(4, []))
    setInterestResult(varde<InterestResult | null>(5, null))
    setTrasigaKallor(trasiga)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const hasCV = !!cvData

  /**
   * B32 (2026-08-12) — samma sanning som H4 (MyConsultant.tsx).
   *
   * `savedJobsApi.getAll()` läser hela `saved_jobs`, som bär HELA
   * ansökningspipelinen. Det som ärligt kan kallas *sparat* är delmängden som
   * inte gått vidare än sparad/intresserad. Skillnaden mot 2026-08-12: nu
   * används den mängden ÖVERALLT på sidan — även i fliken och i `totalItems`.
   * Undantaget "fliken säger ju bara Jobb" höll inte i praktiken, eftersom
   * fliken och nyckeltalet "Sparade jobb" står synliga samtidigt i samma skena
   * och visade olika tal för samma sak.
   */
  const stillSavedJobs = useMemo(
    () => savedJobs.filter((job) => arSparat(job.status)),
    [savedJobs]
  )

  const filteredJobs = useMemo(() => {
    if (!searchQuery) return stillSavedJobs
    const q = searchQuery.toLowerCase()
    return stillSavedJobs.filter(
      (job) =>
        job.job_data?.headline?.toLowerCase().includes(q) ||
        job.job_data?.employer?.name?.toLowerCase().includes(q)
    )
  }, [stillSavedJobs, searchQuery])

  /**
   * Antalet dokument = antalet dokumentkort som faktiskt renderas.
   *
   * Gamla formeln (`coverLetters.length + (hasCV ? 1 : 0)`) räknade N sparade
   * versioner som ett enda dokument och hoppade över intresseguideresultatet.
   * En prod-användare med 3 versioner, 3 brev och ett testresultat fick siffran
   * 4 bredvid sju kort.
   */
  const antalDokument =
    (cvVersions.length || (hasCV ? 1 : 0)) + coverLetters.length + (interestResult ? 1 : 0)

  const totalItems = stillSavedJobs.length + bookmarkedArticles.length + antalDokument

  const tabs = [
    { id: 'all', label: t('resources.tabs.all'), count: totalItems },
    { id: 'documents', label: t('resources.tabs.documents'), count: antalDokument },
    { id: 'jobs', label: t('resources.tabs.jobs'), count: stillSavedJobs.length },
    { id: 'articles', label: t('resources.tabs.articles'), count: bookmarkedArticles.length },
  ]

  const resourceStats: PageStat[] = [
    { label: t('resources.stats.savedJobs'), value: stillSavedJobs.length, icon: BriefcaseIcon, to: '/job-search' },
    { label: t('resources.stats.documents'), value: antalDokument, icon: DocumentText },
    { label: t('resources.stats.bookmarks'), value: bookmarkedArticles.length, icon: BookOpen, to: '/knowledge-base' },
  ]

  const resourceActions = (
    <Link
      to="/cv"
      className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--c-solid)] hover:brightness-110 text-[var(--c-on-solid)] rounded-lg text-[13px] font-medium transition-colors"
    >
      <Plus size={16} aria-hidden="true" />
      {t('resources.createDocument')}
    </Link>
  )

  // --------------------------------------------------------------------------
  // Åtgärder
  // --------------------------------------------------------------------------

  const handleDeleteJob = async (job: SavedJob) => {
    const titel = job.job_data?.headline || t('resources.jobAd')
    const ok = await confirm({
      title: t('resources.confirmDeleteJobTitle'),
      message: t('resources.confirmDeleteJobBody', { titel }),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      variant: 'danger',
    })
    if (!ok) return
    try {
      await savedJobsApi.delete(job.job_id)
      setSavedJobs((prev) => prev.filter((j) => j.job_id !== job.job_id))
      setBesked(t('resources.jobDeleted', { titel }))
    } catch (err) {
      console.error('[resources] kunde inte ta bort jobbet:', err)
      showToast.error(t('resources.deleteFailed'))
    }
  }

  const handleRemoveBookmark = async (article: BookmarkedArticle) => {
    const ok = await confirm({
      title: t('resources.confirmRemoveBookmarkTitle'),
      message: t('resources.confirmRemoveBookmarkBody', { titel: article.title }),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      variant: 'danger',
    })
    if (!ok) return
    try {
      // `remove`, inte `removeBookmark`. Den senare finns inte i
      // `articleBookmarksApi` och kastade TypeError vid varje klick — knappen
      // gjorde bokstavligen ingenting, utan felmeddelande, eftersom
      // hanteraren var `async` och rejektionen aldrig fångades.
      await articleBookmarksApi.remove(article.id)
      setBookmarkedArticles((prev) => prev.filter((a) => a.id !== article.id))
      setBesked(t('resources.bookmarkRemoved', { titel: article.title }))
    } catch (err) {
      console.error('[resources] kunde inte ta bort bokmärket:', err)
      showToast.error(t('resources.deleteFailed'))
    }
  }

  /** Profilen behövs som avsändare i brevet. Saknas den utelämnas raderna. */
  const hamtaAvsandare = async () => {
    if (profile) return profile
    await loadProfile()
    return useProfileStore.getState().profile
  }

  const handleDownloadLetter = async (letter: CoverLetter, format: 'pdf' | 'word') => {
    setBygger(`${letter.id}-${format}`)
    setBesked(t('resources.buildingFile'))
    try {
      const avsandare = await hamtaAvsandare()
      const gemensamt = {
        content: letter.content,
        company: letter.company,
        jobTitle: letter.job_title,
        // Brevets eget datum, inte dagens. Kortet i gränssnittet visar
        // `created_at`; filen visade `new Date()`, så samma brev bar två datum.
        createdAt: letter.created_at,
        firstName: avsandare?.first_name,
        lastName: avsandare?.last_name,
        email: avsandare?.email,
        phone: avsandare?.phone,
        location: avsandare?.location,
      }

      if (format === 'word') {
        await generateCoverLetterWord({
          ...gemensamt,
          title: letter.title,
          aiGenerated: letter.ai_generated,
        })
      } else {
        const blob = await generateCoverLetterPDF(gemensamt)
        const rent = (letter.company || letter.title || 'ansokan')
          .replace(/[^a-zA-Z0-9åäöÅÄÖ_-]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '')
        downloadPDF(blob, `Personligt-brev-${rent || 'ansokan'}.pdf`)
      }
      setBesked(t('resources.fileReady'))
    } catch (err) {
      console.error('[resources] kunde inte skapa filen:', err)
      showToast.error(t('resources.exportFailed'))
      setBesked('')
    } finally {
      setBygger(null)
    }
  }

  const handleDownloadCVWord = async (cv: CVData, id: string) => {
    setBygger(`${id}-word`)
    setBesked(t('resources.buildingFile'))
    try {
      await generateCVWord(cv)
      setBesked(t('resources.fileReady'))
    } catch (err) {
      console.error('[resources] kunde inte skapa Word-filen:', err)
      showToast.error(t('resources.exportFailed'))
      setBesked('')
    } finally {
      setBygger(null)
    }
  }

  // Sökningen annonseras, men inte vid varje tangenttryck.
  const sokTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!searchQuery) return
    if (sokTimer.current) clearTimeout(sokTimer.current)
    sokTimer.current = setTimeout(() => {
      setBesked(
        t('resources.searchResult', {
          antal: filteredJobs.length,
          av: stillSavedJobs.length,
        })
      )
    }, 600)
    return () => {
      if (sokTimer.current) clearTimeout(sokTimer.current)
    }
  }, [searchQuery, filteredJobs.length, stillSavedJobs.length, t])

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  if (loading) {
    return (
      <PageLayout
        title={t('resources.title')}
        description={t('resources.description')}
        showTabs={false}
        domain="info"
        className="sidbredd"
      >
        <div className="flex items-center justify-center py-20" role="status" aria-live="polite" aria-busy="true">
          <Loader2 className="animate-spin text-[var(--c-solid)]" size={48} aria-hidden="true" />
          <span className="sr-only">{t('common.loading')}</span>
        </div>
      </PageLayout>
    )
  }

  const visarJobb = activeTab === 'all' || activeTab === 'jobs'
  const visarDokument = activeTab === 'all' || activeTab === 'documents'
  const visarArtiklar = activeTab === 'all' || activeTab === 'articles'

  /** Renderar den aktiva fliken någonting alls? */
  const flikHarInnehall =
    (visarDokument && antalDokument > 0) ||
    (visarJobb && stillSavedJobs.length > 0) ||
    (visarArtiklar && bookmarkedArticles.length > 0)

  const statusBricka = (rattStatus: string) => {
    const nyckel = statusnyckel(rattStatus)
    if (!nyckel) {
      // Okänt värde ur databasen. Visa att det är okänt — aldrig en tom
      // bricka, och aldrig gissningen "Sparad".
      return {
        etikett: t('resources.status.unknown'),
        bg: 'bg-stone-100 dark:bg-stone-800',
        farg: 'text-stone-700 dark:text-stone-300',
        Ikon: Bookmark,
      }
    }
    const cfg = APPLICATION_STATUS_CONFIG[nyckel]
    return {
      etikett: t(`applications.status.${nyckel}`, cfg.label),
      bg: cfg.bgColor,
      farg: cfg.color,
      Ikon: STATUS_IKONER[nyckel],
    }
  }

  return (
    <PageLayout
      title={t('resources.title')}
      description={t('resources.description')}
      showTabs={false}
      domain="info"
      className="sidbredd"
      actions={resourceActions}
      stats={resourceStats}
      sidoflikar={{
        poster: tabs.map((tab) => ({
          id: tab.id,
          etikett: tab.count > 0 ? `${tab.label} (${tab.count})` : tab.label,
        })),
        aktiv: activeTab,
        vidVal: (id) => setSearchParams({ tab: id }),
      }}
    >
      {/* Åtgärdsbesked. Ligger först i flödet så uppläsningen kommer före
          innehållet, och är tom tills något faktiskt hänt. */}
      <div role="status" aria-live="polite" className="sr-only">
        {besked}
      </div>

      {/* Vad som INTE gick att hämta. Ett fel får aldrig se ut som tomhet. */}
      {trasigaKallor.length > 0 && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4"
        >
          <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-300 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-medium text-amber-900 dark:text-amber-100">
              {t('resources.loadErrorTitle')}
            </p>
            <p className="text-amber-800 dark:text-amber-200 mt-0.5">
              {t('resources.loadErrorBody', {
                kallor: trasigaKallor.map((k) => t(`resources.sources.${k}`)).join(', '),
              })}
            </p>
            <button
              onClick={loadData}
              className="mt-2 text-sm font-medium text-amber-900 dark:text-amber-100 underline hover:no-underline"
            >
              {t('common.tryAgain')}
            </button>
          </div>
        </div>
      )}

      {/* Sökfältet filtrerar bara jobb, så det renderas bara där jobb visas.
          Etiketten sa tidigare "Sök bland dina resurser" och stod kvar på
          fliken Dokument, där den inte gjorde någonting alls. */}
      {visarJobb && stillSavedJobs.length > 0 && (
        <div className="mb-4 flex items-center justify-end">
          <div className="relative">
            <label htmlFor="resources-search" className="sr-only">
              {t('resources.searchLabel')}
            </label>
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500 dark:text-stone-400"
              size={16}
              aria-hidden="true"
            />
            <input
              id="resources-search"
              type="search"
              placeholder={t('resources.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              // border-stone-400/-500: -200/-600 gav 1,26:1 respektive 1,35:1
              // mot fyllningen, alltså ett osynligt formulärfält.
              className="pl-8 pr-3 py-1.5 text-sm border border-stone-400 dark:border-stone-500 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 rounded-lg focus:ring-2 focus:ring-[var(--c-solid)] focus:border-transparent outline-none w-full md:w-56"
            />
          </div>
        </div>
      )}

      <RadgivarTips pathname="/resources" index={0} />

      <div className="space-y-6">
        {/* ---------------------------------------------------------------- */}
        {/* Sparade CV-versioner                                             */}
        {/* ---------------------------------------------------------------- */}
        {visarDokument && cvVersions.length > 0 && (
          <section className="bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 rounded-2xl p-5 border border-[var(--c-accent)] dark:border-stone-600 dark:border-[var(--c-accent)]/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--c-solid)] rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[var(--c-on-solid)]" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-800 dark:text-stone-100">
                    {t('resources.savedCVs')}
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {t('resources.versionCount', { count: cvVersions.length })}
                  </p>
                </div>
              </div>
              <Link
                to="/cv"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--c-solid)] text-[var(--c-on-solid)] rounded-lg font-medium hover:brightness-110 transition-colors shadow-sm"
              >
                <Plus size={16} aria-hidden="true" />
                {t('resources.newVersion')}
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cvVersions.map((version) => {
                const versionData = version.data || {}
                return (
                  <div
                    key={version.id}
                    className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden hover:shadow-lg transition-all"
                  >
                    <div className="p-4 border-b border-stone-100 dark:border-stone-700">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-stone-800 dark:text-stone-100 truncate">{version.name}</h3>
                          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                            {new Date(version.created_at).toLocaleDateString(
                              i18n.language === 'en' ? 'en-US' : 'sv-SE',
                              { year: 'numeric', month: 'short', day: 'numeric' }
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => setPreviewModal({ type: 'cv', data: versionData as CVData })}
                          className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-[var(--c-text)] hover:bg-[var(--c-bg)] dark:hover:bg-stone-700 rounded-lg transition-colors"
                          aria-label={t('resources.previewNamed', { titel: version.name })}
                        >
                          <Eye size={16} aria-hidden="true" />
                        </button>
                      </div>
                      {(versionData.firstName || versionData.title) && (
                        <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-700">
                          {versionData.firstName && (
                            <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
                              {versionData.firstName} {versionData.lastName}
                            </p>
                          )}
                          {versionData.title && (
                            <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{versionData.title}</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-stone-50/50 dark:bg-stone-900/50 flex items-center gap-2">
                      {/* Etiketterna fanns redan i språkfilerna men användes
                          inte — tre ikoner med ett tal bredvid sa inte vad
                          talen räknade. */}
                      <ul className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400 flex-1 list-none">
                        <li className="flex items-center gap-1">
                          <Briefcase size={12} aria-hidden="true" />
                          <span>
                            {versionData.workExperience?.length ?? 0}{' '}
                            <span className="sr-only">{t('resources.experiences')}</span>
                          </span>
                        </li>
                        <li className="flex items-center gap-1">
                          <GraduationCap size={12} aria-hidden="true" />
                          <span>
                            {versionData.education?.length ?? 0}{' '}
                            <span className="sr-only">{t('resources.educations')}</span>
                          </span>
                        </li>
                        <li className="flex items-center gap-1">
                          <Award size={12} aria-hidden="true" />
                          <span>
                            {Array.isArray(versionData.skills) ? versionData.skills.length : 0}{' '}
                            <span className="sr-only">{t('resources.skills')}</span>
                          </span>
                        </li>
                      </ul>
                      <div className="flex items-center gap-1">
                        {/* versionId: utan den hämtar servern `cvs`-raden och
                            levererar dagens CV under versionens filnamn. */}
                        <PDFExportButton
                          type="cv"
                          data={versionData}
                          versionId={version.id}
                          label="PDF"
                          filename={`CV_${versionData.firstName || ''}_${versionData.lastName || ''}.pdf`}
                          variant="ghost"
                          size="sm"
                          showPreview={false}
                        />
                        <button
                          onClick={() => handleDownloadCVWord(versionData as CVData, version.id)}
                          disabled={bygger === `${version.id}-word`}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--c-text)] hover:bg-[var(--c-bg)] dark:hover:bg-stone-700 rounded font-medium transition-colors disabled:opacity-60"
                          aria-label={t('resources.downloadWordNamed', { titel: version.name })}
                        >
                          {bygger === `${version.id}-word` ? (
                            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                          ) : (
                            <FileDown size={14} aria-hidden="true" />
                          )}
                          Word
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Nuvarande CV (bara när inga versioner finns)                     */}
        {/* ---------------------------------------------------------------- */}
        {visarDokument && hasCV && cvData && cvVersions.length === 0 && (
          <section className="bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 rounded-2xl p-5 border border-[var(--c-accent)] dark:border-stone-600 dark:border-[var(--c-accent)]/50">
            <h2 className="sr-only">{t('resources.myCV')}</h2>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[var(--c-solid)] rounded-xl flex items-center justify-center">
                  <FileText className="w-7 h-7 text-[var(--c-on-solid)]" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100">
                    {[cvData.firstName, cvData.lastName].filter(Boolean).join(' ') || t('resources.myCV')}
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400">{cvData.title || t('resources.myCV')}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 flex items-center gap-1">
                    <Sparkles size={12} aria-hidden="true" />
                    {t('resources.saveVersionHint')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  to="/cv"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm bg-white dark:bg-stone-800 text-[var(--c-text)] rounded-lg font-medium hover:bg-[var(--c-bg)] dark:hover:bg-stone-700 border border-[var(--c-accent)] dark:border-stone-600 transition-colors shadow-sm"
                >
                  <Edit2 className="w-4 h-4" aria-hidden="true" />
                  {t('resources.edit')}
                </Link>
                <PDFExportButton
                  type="cv"
                  data={cvData}
                  filename={`CV_${cvData.firstName || ''}_${cvData.lastName || ''}.pdf`}
                  variant="primary"
                  size="sm"
                  showPreview={false}
                />
                <button
                  onClick={() => handleDownloadCVWord(cvData, 'aktuellt')}
                  disabled={bygger === 'aktuellt-word'}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 rounded-lg font-medium hover:bg-stone-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-600 transition-colors shadow-sm disabled:opacity-60"
                >
                  {bygger === 'aktuellt-word' ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <FileDown className="w-4 h-4" aria-hidden="true" />
                  )}
                  {t('resources.downloadWord')}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Intresseguidens resultat                                         */}
        {/* ---------------------------------------------------------------- */}
        {visarDokument && interestResult && (
          <section className="bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 rounded-xl border border-[var(--c-accent)] dark:border-stone-600 dark:border-[var(--c-accent)]/50 p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--c-solid)] rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-[var(--c-on-solid)]" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-semibold text-stone-800 dark:text-stone-100">{t('resources.interestGuide')}</h2>
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    {t('resources.completed')}{' '}
                    {new Date(interestResult.completed_at).toLocaleDateString(
                      i18n.language === 'en' ? 'en-US' : 'sv-SE'
                    )}
                    {interestResult.recommended_jobs && (
                      <span>
                        {' '}
                        • {interestResult.recommended_jobs.length} {t('resources.jobSuggestions')}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/interest-guide"
                  className="px-3 py-1.5 text-sm bg-white dark:bg-stone-800 text-[var(--c-text)] rounded-lg font-medium hover:bg-[var(--c-bg)] dark:hover:bg-stone-700 border border-[var(--c-accent)] dark:border-stone-600 transition-colors"
                >
                  {t('resources.seeResults')}
                </Link>
                <Link
                  to="/career"
                  className="px-3 py-1.5 text-sm bg-[var(--c-solid)] text-[var(--c-on-solid)] rounded-lg font-medium hover:brightness-110 transition-colors"
                >
                  {t('resources.exploreJobs')}
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Personliga brev                                                  */}
        {/* ---------------------------------------------------------------- */}
        {visarDokument && coverLetters.length > 0 && (
          <section>
            <Sektionsrubrik
              ikon={FileText}
              lank={{ till: '/cover-letter', text: t('resources.createNew'), ikon: Plus }}
            >
              {t('resources.coverLetters')} ({coverLetters.length})
            </Sektionsrubrik>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {coverLetters.map((letter) => (
                <DocumentCard
                  key={letter.id}
                  title={letter.title}
                  subtitle={
                    letter.company
                      ? `${letter.company}${letter.job_title ? ` • ${letter.job_title}` : ''}`
                      : undefined
                  }
                  type={letter.ai_generated ? t('resources.aiGenerated') : t('resources.manual')}
                  date={new Date(letter.created_at).toLocaleDateString(
                    i18n.language === 'en' ? 'en-US' : 'sv-SE'
                  )}
                  icon={FileText}
                  actions={
                    <>
                      <button
                        onClick={() => setPreviewModal({ type: 'letter', data: letter })}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-stone-600 dark:text-stone-300 hover:text-[var(--c-text)] hover:bg-[var(--c-bg)] dark:hover:bg-stone-700 rounded transition-colors"
                      >
                        <Eye size={14} aria-hidden="true" />
                        {t('resources.read')}
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDownloadLetter(letter, 'pdf')}
                          disabled={bygger === `${letter.id}-pdf`}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-[var(--c-solid)] text-[var(--c-on-solid)] rounded hover:brightness-110 transition-colors disabled:opacity-60"
                          aria-label={t('resources.downloadPdfNamed', { titel: letter.title })}
                        >
                          {bygger === `${letter.id}-pdf` ? (
                            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                          ) : (
                            <FileDown size={14} aria-hidden="true" />
                          )}
                          PDF
                        </button>
                        <button
                          onClick={() => handleDownloadLetter(letter, 'word')}
                          disabled={bygger === `${letter.id}-word`}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-white dark:bg-stone-800 text-[var(--c-text)] border border-[var(--c-accent)] dark:border-stone-600 rounded hover:bg-[var(--c-bg)] dark:hover:bg-stone-700 transition-colors disabled:opacity-60"
                          aria-label={t('resources.downloadWordNamed', { titel: letter.title })}
                        >
                          {bygger === `${letter.id}-word` ? (
                            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                          ) : (
                            <FileDown size={14} aria-hidden="true" />
                          )}
                          Word
                        </button>
                      </div>
                    </>
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Sparade jobb                                                     */}
        {/* ---------------------------------------------------------------- */}
        {visarJobb && stillSavedJobs.length > 0 && (
          <section>
            <Sektionsrubrik
              ikon={BriefcaseIcon}
              lank={{ till: '/applications', text: t('resources.jobTracker') }}
            >
              {t('resources.savedJobs')} ({filteredJobs.length})
            </Sektionsrubrik>

            {filteredJobs.length === 0 ? (
              <EmptyState
                icon={Search}
                title={t('resources.noSearchHitsTitle')}
                description={t('resources.noSearchHitsBody', { sokord: searchQuery })}
                action={{ label: t('resources.clearSearch'), onClick: () => setSearchQuery('') }}
                compact
              />
            ) : (
              <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 divide-y divide-stone-100 dark:divide-stone-700">
                {filteredJobs.slice(0, activeTab === 'all' ? 5 : undefined).map((job) => {
                  const { etikett, bg, farg, Ikon } = statusBricka(job.status)
                  const titel = job.job_data?.headline || t('resources.jobAd')
                  return (
                    <div key={job.id} className="p-3 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Ikon className={`w-4 h-4 ${farg}`} aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-medium text-stone-800 dark:text-stone-100 text-sm truncate">{titel}</h3>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${bg} ${farg}`}>
                              {etikett}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                            {job.job_data?.employer?.name && (
                              <span className="flex items-center gap-1 truncate">
                                <Building2 size={12} aria-hidden="true" />
                                {job.job_data.employer.name}
                              </span>
                            )}
                            {job.job_data?.workplace_address?.municipality && (
                              <span className="flex items-center gap-1">
                                <MapPin size={12} aria-hidden="true" />
                                {job.job_data.workplace_address.municipality}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => setPreviewModal({ type: 'job', data: job })}
                            className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-[var(--c-text)] hover:bg-[var(--c-bg)] dark:hover:bg-stone-700 rounded transition-colors"
                            aria-label={t('resources.viewDetailsNamed', { titel })}
                          >
                            <Eye size={16} aria-hidden="true" />
                          </button>
                          {job.job_data?.webpage_url && (
                            <a
                              href={job.job_data.webpage_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-[var(--c-text)] hover:bg-[var(--c-bg)] dark:hover:bg-stone-700 rounded transition-colors"
                              aria-label={t('resources.openAdNamed', { titel })}
                            >
                              <ExternalLink size={16} aria-hidden="true" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteJob(job)}
                            className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                            aria-label={t('resources.deleteJobNamed', { titel })}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {activeTab === 'all' && filteredJobs.length > 5 && (
              <button
                onClick={() => setSearchParams({ tab: 'jobs' })}
                className="w-full mt-2 py-2 text-sm text-[var(--c-text)] hover:bg-[var(--c-bg)] dark:hover:bg-stone-800 rounded-lg transition-colors"
              >
                {t('resources.showAllJobs', { antal: filteredJobs.length })}
              </button>
            )}
          </section>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Bokmärkta artiklar                                               */}
        {/* ---------------------------------------------------------------- */}
        {visarArtiklar && bookmarkedArticles.length > 0 && (
          <section>
            <Sektionsrubrik ikon={BookOpen} lank={{ till: '/knowledge-base', text: t('resources.explore') }}>
              {t('resources.bookmarkedArticles')} ({bookmarkedArticles.length})
            </Sektionsrubrik>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {bookmarkedArticles.map((article) => (
                // Kortet är en <div>, inte en <Link>: HTML:s innehållsmodell
                // tillåter inte en <button> inuti en <a>, och sopkorgen låg
                // förut just där. I länkläge kunde skärmläsare hoppa över den.
                <div
                  key={article.id}
                  className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-3 hover:shadow-md transition-all group flex items-center gap-3"
                >
                  <div className="w-9 h-9 bg-[var(--c-solid)] rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-[var(--c-on-solid)]" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-stone-800 dark:text-stone-100 text-sm truncate">
                      <Link
                        to={`/knowledge-base/article/${article.id}`}
                        className="hover:text-[var(--c-text)] transition-colors after:absolute"
                      >
                        {article.title}
                      </Link>
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {/* kategoriNamn, inte den råa nyckeln. 111 av 163
                          artiklar visade tidigare en engelsk slug som etikett. */}
                      <span className="px-1.5 py-0.5 bg-[var(--c-bg)] dark:bg-stone-700 text-[var(--c-text)] text-xs rounded">
                        {kategoriNamn(t, article.category)}
                      </span>
                      {article.readingTime && (
                        <span className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
                          <Clock size={10} aria-hidden="true" />
                          {article.readingTime} {t('resources.minReading')}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveBookmark(article)}
                    className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors flex-shrink-0"
                    aria-label={t('resources.removeBookmarkNamed', { titel: article.title })}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Tomtillstånd — per flik, inte bara för hela sidan                */}
        {/* ---------------------------------------------------------------- */}
        {!flikHarInnehall && (
          <EmptyState
            illustration="resurser"
            title={
              activeTab === 'documents'
                ? t('resources.emptyDocumentsTitle')
                : activeTab === 'jobs'
                  ? t('resources.emptyJobsTitle')
                  : activeTab === 'articles'
                    ? t('resources.emptyArticlesTitle')
                    : t('resources.noResourcesTitle')
            }
            description={
              activeTab === 'documents'
                ? t('resources.emptyDocumentsBody')
                : activeTab === 'jobs'
                  ? t('resources.emptyJobsBody')
                  : activeTab === 'articles'
                    ? t('resources.emptyArticlesBody')
                    : t('resources.noResourcesDesc')
            }
            action={
              activeTab === 'jobs'
                ? { label: t('resources.searchJobs'), onClick: () => window.location.assign('#/job-search') }
                : activeTab === 'articles'
                  ? { label: t('resources.explore'), onClick: () => window.location.assign('#/knowledge-base') }
                  : { label: t('resources.createCV'), onClick: () => window.location.assign('#/cv') }
            }
          />
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Förhandsgranskning                                                 */}
      {/* ------------------------------------------------------------------ */}
      {previewModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewModal(null)}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalRubrikId}
            className="bg-white dark:bg-stone-900 rounded-xl max-w-3xl w-full max-h-[85vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-700 p-3 flex items-center justify-between z-10">
              <h2 id={modalRubrikId} className="font-semibold text-stone-800 dark:text-stone-100">
                {previewModal.type === 'cv' && `${t('resources.preview')} — CV`}
                {previewModal.type === 'letter' && (previewModal.data as CoverLetter).title}
                {previewModal.type === 'job' && (previewModal.data as SavedJob).job_data?.headline}
              </h2>
              <button
                onClick={() => setPreviewModal(null)}
                className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                aria-label={t('common.close')}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="p-4">
              {previewModal.type === 'cv' &&
                (() => {
                  const cv = previewModal.data as CVData
                  return (
                    <div className="space-y-5">
                      <div className="border-b border-stone-100 dark:border-stone-700 pb-4">
                        <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100">
                          {cv.firstName} {cv.lastName}
                        </h3>
                        {cv.title && <p className="text-stone-600 dark:text-stone-400">{cv.title}</p>}
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-stone-600 dark:text-stone-400">
                          {cv.email && (
                            <span className="flex items-center gap-1">
                              <Mail size={14} aria-hidden="true" />
                              {cv.email}
                            </span>
                          )}
                          {cv.phone && (
                            <span className="flex items-center gap-1">
                              <Phone size={14} aria-hidden="true" />
                              {cv.phone}
                            </span>
                          )}
                          {cv.location && (
                            <span className="flex items-center gap-1">
                              <MapPinned size={14} aria-hidden="true" />
                              {cv.location}
                            </span>
                          )}
                        </div>
                      </div>

                      {cv.summary && (
                        <div>
                          <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1">
                            {t('resources.summary')}
                          </h4>
                          <p className="text-sm text-stone-600 dark:text-stone-400">{cv.summary}</p>
                        </div>
                      )}

                      {cv.workExperience && cv.workExperience.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2 flex items-center gap-2">
                            <Briefcase size={16} className="text-[var(--c-text)]" aria-hidden="true" />
                            {t('resources.workExperience')}
                          </h4>
                          <div className="space-y-3">
                            {cv.workExperience.map((job, i) => (
                              <div key={i} className="pl-4 border-l-2 border-[var(--c-accent)]">
                                <p className="font-medium text-stone-800 dark:text-stone-100">{job.title}</p>
                                <p className="text-sm text-stone-600 dark:text-stone-400">{job.company}</p>
                                <p className="text-xs text-stone-500 dark:text-stone-400">
                                  {job.startDate} – {job.current ? t('resources.current') : job.endDate}
                                </p>
                                {job.description && (
                                  <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">{job.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {cv.education && cv.education.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2 flex items-center gap-2">
                            <GraduationCap size={16} className="text-[var(--c-text)]" aria-hidden="true" />
                            {t('resources.education')}
                          </h4>
                          <div className="space-y-2">
                            {cv.education.map((edu, i) => (
                              <div key={i} className="pl-4 border-l-2 border-[var(--c-accent)]">
                                <p className="font-medium text-stone-800 dark:text-stone-100">{edu.degree}</p>
                                <p className="text-sm text-stone-600 dark:text-stone-400">{edu.school}</p>
                                <p className="text-xs text-stone-500 dark:text-stone-400">
                                  {edu.startDate} – {edu.endDate}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {cv.skills && cv.skills.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2 flex items-center gap-2">
                            <Wrench size={16} className="text-[var(--c-text)]" aria-hidden="true" />
                            {t('resources.skills')}
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {cv.skills.map((skill, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs rounded"
                              >
                                {typeof skill === 'string' ? skill : (skill as { name: string }).name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {cv.languages && cv.languages.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2 flex items-center gap-2">
                            <Languages size={16} className="text-[var(--c-text)]" aria-hidden="true" />
                            {t('resources.languages')}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {cv.languages.map((lang, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-[var(--c-bg)] dark:bg-stone-800 text-[var(--c-text)] text-xs rounded"
                              >
                                {lang.language} ({lang.level})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-4 border-t border-stone-100 dark:border-stone-700 flex gap-2">
                        <PDFExportButton
                          type="cv"
                          data={cv}
                          filename={`CV_${cv.firstName || ''}_${cv.lastName || ''}.pdf`}
                          variant="primary"
                          size="sm"
                          showPreview={false}
                        />
                        <button
                          onClick={() => handleDownloadCVWord(cv, 'forhandsgranskning')}
                          disabled={bygger === 'forhandsgranskning-word'}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white dark:bg-stone-800 text-[var(--c-text)] border border-[var(--c-accent)] dark:border-stone-600 rounded-lg font-medium hover:bg-[var(--c-bg)] dark:hover:bg-stone-700 transition-colors disabled:opacity-60"
                        >
                          {bygger === 'forhandsgranskning-word' ? (
                            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                          ) : (
                            <FileDown size={14} aria-hidden="true" />
                          )}
                          {t('resources.downloadWord')}
                        </button>
                      </div>
                    </div>
                  )
                })()}

              {previewModal.type === 'letter' && (
                <div>
                  <p className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">
                    {(previewModal.data as CoverLetter).content}
                  </p>
                  <div className="pt-3 mt-4 border-t border-stone-100 dark:border-stone-700 flex gap-2">
                    <button
                      onClick={() => handleDownloadLetter(previewModal.data as CoverLetter, 'pdf')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--c-solid)] text-[var(--c-on-solid)] rounded-lg font-medium hover:brightness-110 transition-colors"
                    >
                      <FileDown size={14} aria-hidden="true" />
                      {t('resources.downloadPDF')}
                    </button>
                    <button
                      onClick={() => handleDownloadLetter(previewModal.data as CoverLetter, 'word')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white dark:bg-stone-800 text-[var(--c-text)] border border-[var(--c-accent)] dark:border-stone-600 rounded-lg font-medium hover:bg-[var(--c-bg)] dark:hover:bg-stone-700 transition-colors"
                    >
                      <FileDown size={14} aria-hidden="true" />
                      {t('resources.downloadWord')}
                    </button>
                  </div>
                </div>
              )}

              {previewModal.type === 'job' && (
                <div className="space-y-3">
                  <p className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">
                    {(previewModal.data as SavedJob).job_data?.description?.text}
                  </p>
                  {(previewModal.data as SavedJob).job_data?.webpage_url && (
                    <a
                      href={(previewModal.data as SavedJob).job_data!.webpage_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--c-solid)] text-[var(--c-on-solid)] rounded-lg font-medium hover:brightness-110 transition-colors"
                    >
                      <ExternalLink size={14} aria-hidden="true" />
                      {t('resources.openAd')}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}

export default function Resources() {
  const { t } = useTranslation()
  const { leaveWizard } = useFocusMode()

  return (
    <FokusVaxel
      title={t('resources.title')}
      icon={Bookmark}
      domain="info"
      guide={<FocusResourcesWizard onExit={leaveWizard} />}
    >
      <ResourcesInner />
    </FokusVaxel>
  )
}
