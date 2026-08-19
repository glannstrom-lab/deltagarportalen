/**
 * Search Tab - Look up companies by organization number or AI search
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Search,
  Building2,
  MapPin,
  Briefcase,
  Calendar,
  Plus,
  ExternalLink,
  Loader2,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Hash,
  CheckCheck,
  Save,
  MessageSquare,
  X,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button, IconButton } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AIBadge, AIGeneratedWatermark } from '@/components/ai/AIBadge'
import { useSpontaneousCompanies } from '@/hooks/useSpontaneousCompanies'
import {
  formatOrgNumber,
  isValidOrgNumber,
  getSniDescription,
  getCompanyDocuments,
  downloadDocument,
  type BolagsverketCompany,
  type BolagsverketDocument,
} from '@/services/bolagsverketApi'
import { searchCompaniesWithAI, AiFöretagsfel, type AICompanyResult } from '@/services/aiCompanySearchApi'
import { CompanyAnalysisPanel } from '@/components/ai'
import { showToast } from '@/components/Toast'
import {
  loadSpontaneousFocusDraft,
  clearSpontaneousFocusDraft,
  type SpontaneousFocusDraft,
} from '@/lib/spontaneousFocusDraft'

// Company status badge based on raw data from Bolagsverket
function CompanyStatusBadge({ rawData }: { rawData: Record<string, unknown> }) {
  const { t } = useTranslation()
  // Check for various status indicators
  const verksamOrg = rawData.verksamOrganisation as Record<string, unknown> | undefined
  const avregOrg = rawData.avregistreradOrganisation as Record<string, unknown> | undefined
  const avregOrsak = rawData.avregistreringsorsak as Record<string, unknown> | undefined
  const pagaende = rawData.pagaendeAvvecklingsEllerOmstruktureringsforfarande as Record<string, unknown> | undefined
  const pagaendeLista = pagaende?.pagaendeAvvecklingsEllerOmstruktureringsforfarandeLista as Array<Record<string, unknown>> | undefined
  const reklamsparr = rawData.reklamsparr as Record<string, unknown> | undefined

  // Check if company is deregistered
  if (avregOrg?.avregistreringsdatum) {
    const orsak = avregOrsak?.klartext as string || t('spontaneous.companyStatus.deregistered')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-800 dark:bg-red-900/40 dark:text-red-200">
        <XCircle className="w-3 h-3" />
        {orsak}
      </span>
    )
  }

  // Check for ongoing liquidation/bankruptcy
  if (pagaendeLista && pagaendeLista.length > 0) {
    const process = pagaendeLista[0]
    const processType = process.klartext as string || process.kod as string || t('spontaneous.companyStatus.ongoingProcess')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
        <AlertTriangle className="w-3 h-3" aria-hidden="true" />
        {processType}
      </span>
    )
  }

  // Check if company is active
  if (verksamOrg?.kod === 'JA') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--c-bg)] text-[var(--c-text)] dark:bg-[var(--c-bg)]/40 dark:text-[var(--c-text)]">
        <CheckCircle2 className="w-3 h-3" />
        {t('spontaneous.companyStatus.active')}
      </span>
    )
  }

  // No marketing block indicator (good for spontaneous applications)
  if (reklamsparr?.kod === 'NEJ') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--c-bg)] text-[var(--c-text)] dark:bg-[var(--c-bg)]/40 dark:text-[var(--c-text)]">
        {t('spontaneous.companyStatus.openForContact')}
      </span>
    )
  }

  return null
}

type SearchMode = 'orgnr' | 'ai'

export default function SearchTab() {
  const { t } = useTranslation()
  // Utkast från fokuslägets wizard — förifyller sökningen och följer med som anteckning
  const [focusDraft, setFocusDraft] = useState<SpontaneousFocusDraft | null>(() => loadSpontaneousFocusDraft())
  const [searchMode, setSearchMode] = useState<SearchMode>('ai')
  const [searchQuery, setSearchQuery] = useState(() => focusDraft?.company || focusDraft?.industry || '')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<BolagsverketCompany | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  // `true` när felet är att personen SJÄLV stängt av AI-behandling. Då är
  // "försök igen om en stund" ett råd som aldrig kan funka — vägen framåt är
  // Inställningar, eller org.nr-sökningen som inte rör AI alls.
  const [aiAvstangd, setAiAvstangd] = useState(false)
  // Skiljer "sökningen gav inget" från "sökningen gick inte att genomföra".
  // Ett tekniskt fel får inte renderas som ett påstående om världen.
  const [searchNotice, setSearchNotice] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [documents, setDocuments] = useState<BolagsverketDocument[]>([])
  const [isLoadingDocs, setIsLoadingDocs] = useState(false)
  // true = vi kunde INTE hämta, vilket inte är detsamma som att företaget
  // saknar årsredovisningar. Håll den fri från `t` — loadDocuments anropas ur
  // en effekt, och en reaktiv referens där tvingar in funktionen i deps-listan.
  const [docsFailed, setDocsFailed] = useState(false)
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null)

  // AI Search state
  const [searchCity, setSearchCity] = useState('')
  const [aiResults, setAiResults] = useState<AICompanyResult[]>([])
  const [aiSearchStats, setAiSearchStats] = useState<{ total: number; verified: number } | null>(null)
  const [lastRequestedCount, setLastRequestedCount] = useState(10)
  const [savingCompanyId, setSavingCompanyId] = useState<string | null>(null)
  const [isSavingSelected, setIsSavingSelected] = useState(false)
  const [selectedForSave, setSelectedForSave] = useState<Set<string>>(new Set())
  const [expandedAnalysis, setExpandedAnalysis] = useState<string | null>(null)
  // Org.nummer deltagaren fyllt i själv för träffar där AI-svaret utelämnade
  // det. Nyckel = träffens resultatnyckel (se `resultKey` i listan nedan).
  const [manualOrgNumbers, setManualOrgNumbers] = useState<Record<string, string>>({})
  // Skärmläsarannonsering av sökflödet (WCAG 4.1.3). Samma mönster som
  // MyCompaniesTab:301 — utan det här är hela sökningen stum: varken fel,
  // "hittade inget" eller "10 träffar" når en skärmläsare.
  const [announcement, setAnnouncement] = useState('')

  const { lookupCompany, addCompany, isCompanySaved } = useSpontaneousCompanies()

  const draftNotes = focusDraft?.message.trim() || undefined

  const dismissFocusDraft = () => {
    clearSpontaneousFocusDraft()
    setFocusDraft(null)
  }

  // Rensa utkastet när det använts och bekräfta för användaren
  const consumeFocusDraft = () => {
    clearSpontaneousFocusDraft()
    setFocusDraft(null)
    showToast.success(t('spontaneous.focusDraft.savedAsNote'))
  }

  // Load documents when search result changes
  useEffect(() => {
    if (searchResult?.orgNumber) {
      loadDocuments(searchResult.orgNumber)
    } else {
      setDocuments([])
    }
  }, [searchResult?.orgNumber])

  // getCompanyDocuments kastar vid 401/429/500/nätverksavbrott och returnerar []
  // bara vid 404 (= företaget har inga dokument). Att svälja felet gjorde att
  // varje avbrott renderades som "Inga årsredovisningar tillgängliga" — ett
  // påstående om företaget i stället för om vår uppkoppling.
  const loadDocuments = async (orgNumber: string) => {
    setIsLoadingDocs(true)
    setDocsFailed(false)
    try {
      const docs = await getCompanyDocuments(orgNumber)
      setDocuments(docs)
    } catch (err) {
      console.error('Error loading documents:', err)
      setDocuments([])
      setDocsFailed(true)
    } finally {
      setIsLoadingDocs(false)
    }
  }

  const handleDownloadDocument = async (doc: BolagsverketDocument) => {
    setDownloadingDocId(doc.id)
    try {
      const blob = await downloadDocument(doc.id)
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `arsredovisning_${doc.periodEnd}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      showToast.success(t('spontaneous.annualReportDownloaded'))
    } catch (err) {
      console.error('Error downloading document:', err)
      showToast.error(t('spontaneous.downloadError'))
    } finally {
      setDownloadingDocId(null)
    }
  }

  // Översätter edge-funktionens felkod till något en människa kan agera på.
  //
  // Koderna kommer från `supabase/functions/_shared/aiGate.ts` och bärs hit av
  // `AiFöretagsfel`. Poängen är att skilja tre saker som förut såg likadana ut:
  //   • personens eget val (AI avstängt) — ingen "försök igen" hjälper
  //   • en kvot (dygnstak / rate limit) — vänta, och vi säger ungefär hur länge
  //   • vårt fel (503/502/500) — det är inte hens problem, och det går att ta om
  const beskrivSokfel = (err: unknown): { meddelande: string; avstangd: boolean } => {
    if (err instanceof AiFöretagsfel) {
      switch (err.kod) {
        case 'AI_DISABLED':
        case 'AI_CONSENT_REQUIRED':
          return {
            avstangd: true,
            meddelande: t(
              'spontaneous.aiSearch.errors.aiOff',
              'Du har stängt av AI-behandling av dina uppgifter, så AI-sökningen kan inte köras. Du kan slå på den i Inställningar — eller söka på organisationsnummer, som fungerar helt utan AI.'
            ),
          }
        case 'AI_CHECK_FAILED':
        case 'AI_USAGE_CHECK_FAILED':
          return {
            avstangd: false,
            meddelande: t(
              'spontaneous.aiSearch.errors.checkFailed',
              'Vi kunde inte läsa dina AI-inställningar just nu, och skickade därför ingenting vidare. Det är vårt fel — prova gärna igen om en stund.'
            ),
          }
        case 'AI_DAILY_LIMIT':
          return {
            avstangd: false,
            meddelande: t(
              'spontaneous.aiSearch.errors.dailyLimit',
              'Du har använt dagens AI-sökningar. De börjar om i morgon — till dess går det bra att söka på organisationsnummer.'
            ),
          }
        case 'RATE_LIMITED': {
          const minuter = err.retryAfter ? Math.max(1, Math.ceil(err.retryAfter / 60)) : null
          return {
            avstangd: false,
            meddelande: minuter
              ? t('spontaneous.aiSearch.errors.rateLimitedMinutes', {
                  count: minuter,
                  defaultValue: 'Det har blivit många sökningar på kort tid. Prova igen om ungefär {{count}} minut.',
                })
              : t(
                  'spontaneous.aiSearch.errors.rateLimited',
                  'Det har blivit många sökningar på kort tid. Prova igen om en liten stund.'
                ),
          }
        }
        case 'UNAUTHORIZED':
          return {
            avstangd: false,
            meddelande: t(
              'spontaneous.aiSearch.errors.unauthorized',
              'Din inloggning verkar ha gått ut. Logga in igen så fortsätter vi där du var.'
            ),
          }
        case 'INVALID_INPUT':
          return {
            avstangd: false,
            meddelande: t(
              'spontaneous.aiSearch.errors.invalidInput',
              'Söktexten gick inte att använda. Prova att skriva om den — till exempel "bagerier i Malmö".'
            ),
          }
        case 'AI_UPSTREAM_ERROR':
        case 'AI_PARSE_ERROR':
          return {
            avstangd: false,
            meddelande: t(
              'spontaneous.aiSearch.errors.upstream',
              'AI-tjänsten svarade inte som den skulle. Det är vårt fel, inte din sökning — prova igen om en stund.'
            ),
          }
        case 'SERVER_MISCONFIGURED':
        case 'INTERNAL_ERROR':
          return {
            avstangd: false,
            meddelande: t(
              'spontaneous.aiSearch.errors.internal',
              'Något gick fel hos oss. Din sökning är oskyldig — prova igen om en stund.'
            ),
          }
      }
      return { avstangd: false, meddelande: err.message || t('spontaneous.aiSearch.failed') }
    }

    return {
      avstangd: false,
      meddelande: err instanceof Error ? err.message : t('spontaneous.aiSearch.failed'),
    }
  }

  // AI Search handler
  //
  // `keepResults` används av "Visa fler": tidigare nollades aiResults FÖRE
  // omsökningen, så ett 429 eller 502 raderade de tio träffar deltagaren redan
  // hade. Nu byts listan först när ett nytt svar är inne.
  const handleAISearch = async (maxResults = 10, options?: { keepResults?: boolean }) => {
    const keepResults = options?.keepResults === true
    const query = searchQuery.trim()

    if (query.length < 3) {
      setSearchError(t('spontaneous.aiSearch.minChars'))
      setAnnouncement(t('spontaneous.aiSearch.minChars'))
      return
    }

    // Ortfältet vävs in i frisökningen
    const city = searchCity.trim()
    const composedQuery = city ? `${query} i ${city}` : query

    setIsSearching(true)
    setSearchError(null)
    setAiAvstangd(false)
    setSearchNotice(null)
    if (!keepResults) {
      setAiResults([])
      setAiSearchStats(null)
      setSearchResult(null)
      setSelectedForSave(new Set())
    }
    setAnnouncement(t('spontaneous.search.searching', 'Söker …'))

    try {
      const result = await searchCompaniesWithAI(composedQuery, maxResults)
      setAiResults(result.companies)
      setAiSearchStats({ total: result.totalFound, verified: result.verified })
      setLastRequestedCount(maxResults)

      if (result.companies.length === 0) {
        // Edge-funktionen returnerar en tom lista både när sökningen genuint
        // inte gav något OCH när svaret inte gick att tolka — den skickar inget
        // som skiljer fallen åt. Då får texten inte påstå att företagen saknas.
        const notice = t(
          'spontaneous.aiSearch.nothingToShow',
          'Vi fick inget att visa den här gången. Prova gärna en annan sökterm — eller sök igen om en stund.'
        )
        setSearchNotice(notice)
        setAnnouncement(notice)
      } else {
        setAnnouncement(t('spontaneous.resultsAnnouncement', { count: result.companies.length }))
      }
    } catch (err) {
      console.error('AI Search error:', err)
      // Träffarna deltagaren redan har står kvar — ett misslyckat försök till
      // fler får inte kosta det som redan fungerade.
      const { meddelande, avstangd } = beskrivSokfel(err)
      setSearchError(meddelande)
      setAiAvstangd(avstangd)
      setAnnouncement(meddelande)
    } finally {
      setIsSearching(false)
    }
  }

  // Save AI result company
  //
  // `orgNumberOverride` är org.numret deltagaren själv fyllt i för en träff där
  // AI-svaret utelämnade det. Sparvägen är densamma: addCompany slår upp numret
  // mot Bolagsverket, så ingenting kan hamna i listan utan att finnas i
  // registret. Att spara ett företag helt utan org.nr går inte, och ska inte gå.
  const handleSaveAICompany = async (
    company: AICompanyResult,
    resultKey: string,
    orgNumberOverride?: string
  ) => {
    const orgNumber = (orgNumberOverride ?? company.orgNumber ?? '').trim()

    if (!orgNumber) {
      showToast.error(t('spontaneous.cannotSaveWithoutOrgNumber'))
      return
    }

    if (!isValidOrgNumber(orgNumber)) {
      showToast.error(t('spontaneous.search.invalidFormat'))
      return
    }

    setSavingCompanyId(resultKey)

    try {
      const saved = await addCompany(orgNumber, draftNotes ? { notes: draftNotes } : undefined)
      if (saved) {
        if (draftNotes) consumeFocusDraft()
        setManualOrgNumbers(prev => {
          const next = { ...prev }
          delete next[resultKey]
          return next
        })
      }
    } finally {
      setSavingCompanyId(null)
    }
  }

  // Byte av sökläge ska inte lämna kvar träffar från det andra läget
  const changeSearchMode = (mode: SearchMode) => {
    if (mode === searchMode) return
    setSearchMode(mode)
    setAiResults([])
    setAiSearchStats(null)
    setSearchResult(null)
    setSelectedForSave(new Set())
    setExpandedAnalysis(null)
    setManualOrgNumbers({})
    setSearchError(null)
    setAiAvstangd(false)
    setSearchNotice(null)
    setDocsFailed(false)
  }

  // Save all selected companies
  //
  // Två fel rättade här:
  // 1) `addCompany` kastar aldrig — den returnerar `null` vid fel. Med
  //    Promise.allSettled blev alltså varje utfall `fulfilled`, och toasten
  //    "0 företag sparade" visades som GRÖN framgång bredvid N röda felrutor.
  //    Nu räknas faktiska sparningar och texten säger vad som hände.
  // 2) Upp till 25 samtidiga Bolagsverket-slag (addCompany slår upp varje
  //    org.nr) mot ett tak på 30 per 15 minuter. Nu körs de i följd med en
  //    liten paus, och vi slutar när registret uppenbart inte svarar i stället
  //    för att bränna hela kvoten och spamma deltagaren med felrutor.
  const handleSaveSelected = async () => {
    const toSave = aiResults.filter(c => c.orgNumber && selectedForSave.has(c.orgNumber) && !isCompanySaved(c.orgNumber))

    if (toSave.length === 0) {
      showToast.warning(t('spontaneous.noNewCompaniesToSave'))
      return
    }

    setIsSavingSelected(true)

    let saved = 0
    let failed = 0
    let consecutiveFailures = 0
    let stoppedEarly = false

    for (let i = 0; i < toSave.length; i++) {
      const company = toSave[i]
      const result = await addCompany(company.orgNumber!, draftNotes ? { notes: draftNotes } : undefined)

      if (result) {
        saved++
        consecutiveFailures = 0
      } else {
        failed++
        consecutiveFailures++
      }

      // Tre nej i rad = registret svarar inte. Fortsätter vi bara vi äter
      // kvoten och deltagaren får en felruta per företag.
      if (consecutiveFailures >= 3 && i < toSave.length - 1) {
        stoppedEarly = true
        failed = toSave.length - saved
        break
      }

      if (i < toSave.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 250))
      }
    }

    setSelectedForSave(new Set())
    setIsSavingSelected(false)

    if (saved > 0 && failed === 0) {
      showToast.success(t('spontaneous.companiesSaved', { count: saved }))
    } else if (saved > 0) {
      showToast.warning(
        t('spontaneous.companiesSaved', { count: saved }),
        stoppedEarly
          ? t('spontaneous.saveBatch.stoppedEarly', { count: failed, defaultValue: 'Vi stannade efter att registret slutat svara. {{count}} företag är inte sparade — prova dem igen om en stund.' })
          : t('spontaneous.saveBatch.someFailed', { count: failed, defaultValue: '{{count}} företag gick inte att spara. Prova dem igen om en stund.' })
      )
    } else {
      showToast.error(
        t('spontaneous.saveBatch.noneSaved', 'Inget företag kunde sparas'),
        t('spontaneous.saveBatch.noneSavedHelp', 'Företagsregistret svarade inte. Ingenting har lagts till i din lista — prova igen om en stund.')
      )
    }

    if (saved > 0 && draftNotes) consumeFocusDraft()
  }

  // Toggle selection
  const toggleSelection = (orgNumber: string) => {
    const newSet = new Set(selectedForSave)
    if (newSet.has(orgNumber)) {
      newSet.delete(orgNumber)
    } else {
      newSet.add(orgNumber)
    }
    setSelectedForSave(newSet)
  }

  // Select all verified
  const selectAllVerified = () => {
    const verified = aiResults.filter(c => c.verified && c.orgNumber && !isCompanySaved(c.orgNumber))
    setSelectedForSave(new Set(verified.map(c => c.orgNumber!)))
  }

  const handleSearch = async () => {
    if (searchMode === 'ai') {
      // handleAISearch rensar själv, efter sin egen validering
      await handleAISearch()
      return
    }

    // Org number search
    const query = searchQuery.trim()

    // Valideringen körs INNAN något rensas. Tidigare nollades listan högst upp,
    // så ett feltryckt org.nr raderade träffarna deltagaren redan hade.
    if (!query) {
      setSearchError(t('spontaneous.search.enterOrgNumber'))
      setAnnouncement(t('spontaneous.search.enterOrgNumber'))
      return
    }

    if (!isValidOrgNumber(query)) {
      setSearchError(t('spontaneous.search.invalidFormat'))
      setAnnouncement(t('spontaneous.search.invalidFormat'))
      return
    }

    setAiResults([])
    setAiSearchStats(null)
    setSearchResult(null)
    setIsSearching(true)
    setSearchError(null)
    setAiAvstangd(false)
    setSearchNotice(null)
    setAnnouncement(t('spontaneous.search.searching', 'Söker …'))

    try {
      const result = await lookupCompany(query)

      if (result) {
        setSearchResult(result)
        setAnnouncement(t('spontaneous.search.foundAnnouncement', { name: result.name, defaultValue: '{{name}} hittades.' }))
      } else {
        setSearchError(t('spontaneous.search.notFound'))
        setAnnouncement(t('spontaneous.search.notFound'))
      }
    } catch (err) {
      console.error('Search error:', err)
      setSearchError(t('spontaneous.search.error'))
      setAnnouncement(t('spontaneous.search.error'))
    } finally {
      setIsSearching(false)
    }
  }

  const handleSave = async () => {
    if (!searchResult) return

    setIsSaving(true)
    try {
      const saved = await addCompany(searchResult.orgNumber, draftNotes ? { notes: draftNotes } : undefined)
      // Rensa BARA när sparningen lyckades. Tidigare försvann träffen även när
      // den inte gick att spara, så deltagaren fick söka upp företaget på nytt.
      if (saved) {
        if (draftNotes) consumeFocusDraft()
        setSearchResult(null)
        setSearchQuery('')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const alreadySaved = searchResult ? isCompanySaved(searchResult.orgNumber) : false

  return (
    // Extra luft i botten på mobil: bottennavet och den flytande
    // "Mina samlingar"-knappen ligger ovanpå sidan och täckte annars sista
    // kortets kryssruta och knappar. FAB:en är en global komponent — det här
    // löser överlappet mot innehållet, inte FAB:ens egen träffyta.
    <div className="space-y-6 pb-28 lg:pb-6">
      {/* Search Section */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-stone-800 dark:text-stone-100">
          <Search className="w-5 h-5 text-[var(--c-solid)] dark:text-[var(--c-solid)]" />
          {t('spontaneous.search.title')}
        </h2>

        {/* Search Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={searchMode === 'ai' ? 'default' : 'outline'}
            size="sm"
            onClick={() => changeSearchMode('ai')}
            aria-pressed={searchMode === 'ai'}
            className={`flex items-center gap-2 ${searchMode === 'ai' ? 'bg-[var(--c-solid)] hover:bg-[var(--c-solid)] dark:bg-[var(--c-solid)] dark:hover:bg-[var(--c-solid)]' : 'border-stone-200 dark:border-stone-700'}`}
          >
            <Sparkles className="w-4 h-4" />
            {t('spontaneous.search.aiSearch')}
          </Button>
          <Button
            variant={searchMode === 'orgnr' ? 'default' : 'outline'}
            size="sm"
            onClick={() => changeSearchMode('orgnr')}
            aria-pressed={searchMode === 'orgnr'}
            className={`flex items-center gap-2 ${searchMode === 'orgnr' ? 'bg-[var(--c-solid)] hover:bg-[var(--c-solid)] dark:bg-[var(--c-solid)] dark:hover:bg-[var(--c-solid)]' : 'border-stone-200 dark:border-stone-700'}`}
          >
            <Hash className="w-4 h-4" />
            {t('spontaneous.search.orgNumber')}
          </Button>
        </div>

        <p className="text-stone-600 dark:text-stone-400 mb-4">
          {searchMode === 'ai' ? (
            <>{t('spontaneous.search.aiDescription')}</>
          ) : (
            <>
              {t('spontaneous.search.orgNumberDescription')}{' '}
              <a
                href="https://allabolag.se"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--c-solid)] dark:text-[var(--c-solid)] hover:underline inline-flex items-center gap-1"
              >
                allabolag.se
                <ExternalLink className="w-3 h-3" />
              </a>
            </>
          )}
        </p>

        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            {searchMode === 'ai' ? (
              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--c-solid)] dark:text-[var(--c-solid)]" />
            ) : (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-600 dark:text-stone-400" />
            )}
            <Input
              type="text"
              placeholder={searchMode === 'ai'
                ? t('spontaneous.search.aiPlaceholder')
                : t('spontaneous.search.placeholder')
              }
              aria-label={searchMode === 'ai'
                ? t('spontaneous.search.aiSearchLabel')
                : t('spontaneous.search.orgSearchLabel')
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 bg-white dark:bg-stone-700 border-stone-200 dark:border-stone-600 text-stone-900 dark:text-stone-100"
              disabled={isSearching}
            />
          </div>
          {searchMode === 'ai' && (
            <div className="w-40 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600 dark:text-stone-400" aria-hidden="true" />
              <Input
                type="text"
                placeholder={t('spontaneous.cityPlaceholder')}
                aria-label={t('spontaneous.citySearchLabel')}
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9 bg-white dark:bg-stone-700 border-stone-200 dark:border-stone-600 text-stone-900 dark:text-stone-100"
                disabled={isSearching}
              />
            </div>
          )}
          {/* Knappen behåller sin text under laddning — tidigare byttes hela
              innehållet mot en snurra, och då hade knappen inget tillgängligt
              namn alls medan sökningen pågick (WCAG 4.1.2). */}
          <Button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            aria-busy={isSearching}
            className="min-w-[100px] bg-[var(--c-solid)] hover:bg-[var(--c-solid)] dark:bg-[var(--c-solid)] dark:hover:bg-[var(--c-solid)]"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" aria-hidden="true" />
                {t('spontaneous.search.searching', 'Söker …')}
              </>
            ) : searchMode === 'ai' ? (
              <>
                <Sparkles className="w-4 h-4 mr-1" aria-hidden="true" />
                {t('common.search')}
              </>
            ) : (
              t('common.search')
            )}
          </Button>
        </div>

        {/* Sökningen tar ofta 10 sekunder eller mer. Utan det här hörde en
            skärmläsaranvändare ingenting — varken att något pågick, att det
            gick fel, eller hur många träffar som kom in. */}
        <span className="sr-only" role="status" aria-live="polite">
          {announcement}
        </span>

        {searchError && (
          <div className="mt-3" role="alert">
            <p className={`text-sm flex items-start gap-2 ${aiAvstangd ? 'text-stone-700 dark:text-stone-300' : 'text-red-700 dark:text-red-300'}`}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>{searchError}</span>
            </p>

            {/* Personen har själv stängt av AI-behandling. Då är det inte ett
                fel att försöka igen med, utan ett val — så vi visar vägen till
                brytaren och den sökväg som fungerar utan AI. */}
            {aiAvstangd && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  to="/profile?tab=installningar"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[var(--c-solid)] text-white"
                >
                  {t('spontaneous.aiSearch.openSettings', 'Öppna Inställningar')}
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => changeSearchMode('orgnr')}
                  className="border-stone-200 dark:border-stone-700"
                >
                  <Hash className="w-4 h-4 mr-1" aria-hidden="true" />
                  {t('spontaneous.aiSearch.useOrgNumberInstead', 'Sök på organisationsnummer i stället')}
                </Button>
              </div>
            )}
          </div>
        )}

        {searchNotice && !searchError && (
          <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">{searchNotice}</p>
        )}
      </Card>

      {/* Utkast från fokusläget */}
      {focusDraft && (
        <Card className="p-4 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border-[var(--c-accent)] dark:border-[var(--c-accent)]/50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <MessageSquare className="w-5 h-5 text-[var(--c-solid)] mt-0.5 flex-shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <h3 className="font-medium text-stone-800 dark:text-stone-100">
                  {t('spontaneous.focusDraft.title')}
                </h3>
                {(focusDraft.company || focusDraft.industry) && (
                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    {[focusDraft.company, focusDraft.industry].filter(Boolean).join(' · ')}
                  </p>
                )}
                {focusDraft.message && (
                  <p className="text-sm text-stone-700 dark:text-stone-300 mt-2 whitespace-pre-wrap">
                    {focusDraft.message}
                  </p>
                )}
                <p className="text-xs text-stone-500 dark:text-stone-500 mt-2">
                  {t('spontaneous.focusDraft.description')}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissFocusDraft}
              aria-label={t('spontaneous.focusDraft.dismiss')}
              className="h-8 w-8 p-0 flex-shrink-0"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </Card>
      )}

      {/* Search Result */}
      {searchResult && (
        <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-[var(--c-solid)] dark:text-[var(--c-solid)]" />
                <h3 className="text-xl font-semibold text-stone-800 dark:text-stone-100">{searchResult.name}</h3>
                {/* Company Status Indicator */}
                {searchResult._raw && (
                  <CompanyStatusBadge rawData={searchResult._raw} />
                )}
              </div>

              <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
                Org.nr: {formatOrgNumber(searchResult.orgNumber)}
                {searchResult.legalForm && ` - ${searchResult.legalForm}`}
              </p>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Address */}
                {searchResult.address && (searchResult.address.street || searchResult.address.city) && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-stone-600 dark:text-stone-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{t('spontaneous.company.address')}</p>
                      <p className="text-sm text-stone-600 dark:text-stone-400">
                        {searchResult.address.street && <span>{searchResult.address.street}<br /></span>}
                        {searchResult.address.postalCode} {searchResult.address.city}
                      </p>
                    </div>
                  </div>
                )}

                {/* Industry */}
                {searchResult.sniCodes && searchResult.sniCodes.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Briefcase className="w-4 h-4 text-stone-600 dark:text-stone-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{t('spontaneous.company.industry')}</p>
                      <p className="text-sm text-stone-600 dark:text-stone-400">
                        {searchResult.sniCodes.slice(0, 3).map(sni => (
                          <span key={sni.code} className="block">
                            <span className="text-xs text-stone-500 dark:text-stone-500">{sni.code}</span>{' '}
                            {sni.description || getSniDescription(sni.code)}
                          </span>
                        ))}
                        {searchResult.sniCodes.length > 3 && (
                          <span className="text-xs text-stone-500 dark:text-stone-500">
                            +{searchResult.sniCodes.length - 3} {t('common.more').toLowerCase()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Registration Date */}
                {searchResult.registrationDate && (
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-stone-600 dark:text-stone-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{t('spontaneous.company.registered')}</p>
                      <p className="text-sm text-stone-600 dark:text-stone-400">
                        {new Date(searchResult.registrationDate).toLocaleDateString('sv-SE')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Business Description */}
              {searchResult.businessDescription && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-stone-800 dark:text-stone-200 mb-1">{t('spontaneous.company.business')}</p>
                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    {searchResult.businessDescription}
                  </p>
                </div>
              )}

              {/* Annual Reports Section */}
              <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-700">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-[var(--c-solid)] dark:text-[var(--c-solid)]" />
                  <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{t('spontaneous.annualReports')}</p>
                  {isLoadingDocs && <Loader2 className="w-4 h-4 animate-spin text-stone-600 dark:text-stone-400" />}
                </div>

                {!isLoadingDocs && docsFailed && (
                  <div className="text-sm text-stone-600 dark:text-stone-400">
                    <p className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-700 dark:text-amber-300" aria-hidden="true" />
                      <span>{t(
                        'spontaneous.annualReportsUnavailable',
                        'Vi kunde inte hämta årsredovisningarna just nu. Det säger inget om företaget — försök igen om en stund.'
                      )}</span>
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => searchResult?.orgNumber && loadDocuments(searchResult.orgNumber)}
                      className="mt-2 border-stone-200 dark:border-stone-700"
                    >
                      {t('common.retry')}
                    </Button>
                  </div>
                )}

                {!isLoadingDocs && !docsFailed && documents.length === 0 && (
                  <p className="text-sm text-stone-600 dark:text-stone-400">{t('spontaneous.noAnnualReports')}</p>
                )}

                {documents.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {documents.slice(0, 5).map((doc) => (
                      <Button
                        key={doc.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadDocument(doc)}
                        disabled={downloadingDocId === doc.id}
                        className="text-xs border-stone-200 dark:border-stone-700"
                      >
                        {downloadingDocId === doc.id ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : (
                          <Download className="w-3 h-3 mr-1" />
                        )}
                        {doc.periodEnd}
                      </Button>
                    ))}
                    {documents.length > 5 && (
                      <span className="text-xs text-stone-600 dark:text-stone-400 self-center">
                        +{documents.length - 5} {t('common.more').toLowerCase()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleSave}
                disabled={isSaving || alreadySaved}
                variant={alreadySaved ? 'outline' : 'default'}
                className={alreadySaved ? 'border-stone-200 dark:border-stone-700' : 'bg-[var(--c-solid)] hover:bg-[var(--c-solid)] dark:bg-[var(--c-solid)] dark:hover:bg-[var(--c-solid)]'}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {alreadySaved ? t('spontaneous.company.alreadySaved') : t('spontaneous.company.save')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* AI Search Results */}
      {aiResults.length > 0 && (
        <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-stone-800 dark:text-stone-100">
                <Sparkles className="w-5 h-5 text-[var(--c-solid)] dark:text-[var(--c-solid)]" aria-hidden="true" />
                {t('spontaneous.searchResults')}
              </h3>
              {aiSearchStats && (
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  {t('spontaneous.aiSearch.resultsFound', { total: aiSearchStats.total, verified: aiSearchStats.verified })}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllVerified}
                disabled={aiResults.filter(c => c.verified && c.orgNumber && !isCompanySaved(c.orgNumber)).length === 0}
                className="border-stone-200 dark:border-stone-700"
              >
                <CheckCheck className="w-4 h-4 mr-1" aria-hidden="true" />
                {t('spontaneous.selectAllVerified')}
              </Button>
              {selectedForSave.size > 0 && (
                <Button
                  size="sm"
                  onClick={handleSaveSelected}
                  disabled={isSavingSelected}
                  aria-busy={isSavingSelected}
                  className="bg-[var(--c-solid)] hover:bg-[var(--c-solid)] dark:bg-[var(--c-solid)] dark:hover:bg-[var(--c-solid)]"
                >
                  {isSavingSelected ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" aria-hidden="true" />
                  ) : (
                    <Save className="w-4 h-4 mr-1" aria-hidden="true" />
                  )}
                  {t('spontaneous.saveSelected', { count: selectedForSave.size })}
                </Button>
              )}
            </div>
          </div>

          {/* Vad brickan "Finns i registret" faktiskt tacker. Den stod tidigare
              rakt bredvid beskrivning och bransch, som ar oberord AI-text och
              aldrig kontrolleras mot nagonting. */}
          <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
            {t(
              'spontaneous.verificationScope',
              'Namn, organisationsnummer, bolagsform och adress är hämtade från Bolagsverket. Beskrivning och bransch kommer från AI-sökningen och är inte kontrollerade — läs dem som ett tips, inte som fakta.'
            )}
          </p>

          <div className="space-y-3">
            {aiResults.map((company, index) => {
              // EN nyckel for raden. Tidigare jamfordes analysknappen mot
              // company.orgNumber och panelen mot (orgNumber || idx-N), sa
              // knappen kunde aldrig stanga panelen for en traff utan org.nr.
              const resultKey = company.orgNumber || `idx-${index}`
              const isSaved = company.orgNumber ? isCompanySaved(company.orgNumber) : false
              const isSelected = company.orgNumber ? selectedForSave.has(company.orgNumber) : false
              const isSavingRow = savingCompanyId === resultKey
              const manualOrgNumber = manualOrgNumbers[resultKey] ?? ''
              const isAnalysisOpen = expandedAnalysis === resultKey

              return (
                <div
                  key={resultKey}
                  className={`p-4 rounded-lg border transition-colors ${
                    isSelected
                      ? 'border-[var(--c-accent)] bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40'
                      : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Selection checkbox */}
                    {company.orgNumber && !isSaved && (
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelection(company.orgNumber!)}
                          aria-label={t('spontaneous.selectCompany', { name: company.name })}
                          className="w-4 h-4 rounded border-stone-300 accent-[var(--c-solid)] focus:ring-[var(--c-solid)]"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Namnet far hela raden och plaketterna radbryts under.
                          Med `truncate` + brickor pa samma rad blev "DevCore AB"
                          renderat som "D..." pa mobil. */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                        <span className="flex items-center gap-2 min-w-0">
                          <Building2 className="w-4 h-4 text-[var(--c-solid)] dark:text-[var(--c-solid)] flex-shrink-0" aria-hidden="true" />
                          <h4 className="font-semibold text-stone-800 dark:text-stone-100 break-words">{company.name}</h4>
                        </span>

                        {/* Verification badge */}
                        {company.verified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                            <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                            {t('spontaneous.verifiedInRegistry', 'Finns i registret')}
                          </span>
                        ) : company.orgNumber ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                            <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                            {t('spontaneous.notConfirmed', 'Inte bekräftad')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600 dark:bg-stone-700/50 dark:text-stone-300">
                            {t('spontaneous.missingOrgNumber')}
                          </span>
                        )}

                        {isSaved && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--c-bg)] text-[var(--c-text)] dark:bg-[var(--c-bg)]/60 dark:text-[var(--c-text)]">
                            <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                            {t('spontaneous.status.saved')}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-600 dark:text-stone-400">
                        {company.orgNumber && (
                          <span>Org.nr: {formatOrgNumber(company.orgNumber)}</span>
                        )}
                        {(company.verifiedData?.address?.city || company.city) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                            {company.verifiedData?.address?.city || company.city}
                          </span>
                        )}
                        {company.industry && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5" aria-hidden="true" />
                            {company.industry}
                            <AIBadge label={t('spontaneous.aiIndustryLabel', 'Bransch föreslagen av AI')} />
                          </span>
                        )}
                      </div>

                      {company.description && (
                        <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 line-clamp-2">
                          <AIBadge
                            label={t('spontaneous.aiDescriptionLabel', 'Beskrivning genererad av AI')}
                            className="mr-1.5 align-middle"
                          />
                          {company.description}
                        </p>
                      )}

                      {company.verifiedData && (
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                          {company.verifiedData.legalForm}
                          {company.verifiedData.address?.street && ` - ${company.verifiedData.address.street}`}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {/* Analysknappen hade bara <Sparkles/> — skarmlasaren sa
                          "knapp". IconButton kraver `label`, sa namnet kan inte
                          falla bort igen. */}
                      <IconButton
                        icon={<Sparkles className="w-4 h-4" aria-hidden="true" />}
                        label={
                          isAnalysisOpen
                            ? t('spontaneous.hideAnalysis', { name: company.name, defaultValue: 'Dölj analysen av {{name}}' })
                            : t('spontaneous.analyzeCompany', { name: company.name, defaultValue: 'Analysera {{name}}' })
                        }
                        size="sm"
                        onClick={() => setExpandedAnalysis(isAnalysisOpen ? null : resultKey)}
                        aria-expanded={isAnalysisOpen}
                        aria-controls={`analys-${index}`}
                        className="text-[var(--c-text)] dark:text-[var(--c-solid)] border border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50 bg-transparent hover:bg-[var(--c-bg)] dark:hover:bg-[var(--c-bg)]/30"
                      />

                      {/* Save button */}
                      {company.orgNumber && !isSaved && (
                        <IconButton
                          icon={<Plus className="w-4 h-4" aria-hidden="true" />}
                          label={t('spontaneous.saveCompanyLabel', { name: company.name, defaultValue: 'Spara {{name}} i din lista' })}
                          size="sm"
                          onClick={() => handleSaveAICompany(company, resultKey)}
                          isLoading={isSavingRow}
                        />
                      )}
                    </div>
                  </div>

                  {/* Traff utan org.nummer: AI-svaret utelamnade det, men
                      foretaget finns oftast. Deltagaren kan fylla i numret
                      sjalv — sparvagen ar densamma och gar alltid via
                      Bolagsverket. Utan det har var traffen helt oanvandbar. */}
                  {!company.orgNumber && (
                    <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-700">
                      <label
                        htmlFor={`manuellt-orgnr-${index}`}
                        className="block text-sm text-stone-600 dark:text-stone-400 mb-2"
                      >
                        {t(
                          'spontaneous.manualOrgNumber.label',
                          'Sökningen fick inget organisationsnummer för det här företaget. Fyll i det så kontrollerar vi mot Bolagsverket och sparar.'
                        )}
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          id={`manuellt-orgnr-${index}`}
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          value={manualOrgNumber}
                          onChange={(e) => setManualOrgNumbers(prev => ({ ...prev, [resultKey]: e.target.value }))}
                          placeholder={t('spontaneous.search.placeholder')}
                          className="w-44 text-sm px-2 py-1.5 rounded-md border bg-white dark:bg-stone-700 border-stone-200 dark:border-stone-600 text-stone-900 dark:text-stone-100"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveAICompany(company, resultKey, manualOrgNumber)}
                          disabled={isSavingRow || !isValidOrgNumber(manualOrgNumber)}
                          aria-busy={isSavingRow}
                          className="bg-[var(--c-solid)] hover:bg-[var(--c-solid)] dark:bg-[var(--c-solid)] dark:hover:bg-[var(--c-solid)]"
                        >
                          {isSavingRow ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" aria-hidden="true" />
                          ) : (
                            <Plus className="w-4 h-4 mr-1" aria-hidden="true" />
                          )}
                          {t('spontaneous.company.save')}
                        </Button>
                        <a
                          href={`https://www.allabolag.se/what/${encodeURIComponent(company.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[var(--c-text)] dark:text-[var(--c-solid)] hover:underline inline-flex items-center gap-1"
                        >
                          {t('spontaneous.manualOrgNumber.lookup', 'Slå upp numret på allabolag.se')}
                          <ExternalLink className="w-3 h-3" aria-hidden="true" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Company Analysis Panel - Expandable */}
                  {isAnalysisOpen && (
                    <div id={`analys-${index}`} className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700">
                      <CompanyAnalysisPanel
                        companyName={company.name}
                        orgNumber={company.orgNumber || undefined}
                        industry={company.industry || undefined}
                        onClose={() => setExpandedAnalysis(null)}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Visa fler — sok om med storre resultatmangd.
              `keepResults` gor att ett 429 eller 502 inte raderar de traffar
              deltagaren redan har. */}
          {lastRequestedCount < 25 && aiResults.length >= lastRequestedCount && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => handleAISearch(25, { keepResults: true })}
                disabled={isSearching}
                aria-busy={isSearching}
                className="border-stone-200 dark:border-stone-700"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
                )}
                {t('spontaneous.showMore')}
              </Button>
            </div>
          )}

          {/* AI Act art. 50.2 — listan ar AI-genererad och ska markas som sadan */}
          <AIGeneratedWatermark contentType={t('spontaneous.aiWatermarkType', 'företagsförslag')} />
        </Card>
      )}

      {/* Tips Section */}
      <Card className="p-6 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border-[var(--c-accent)] dark:border-[var(--c-accent)]/50">
        <h3 className="font-medium mb-2 text-stone-800 dark:text-stone-100">{t('spontaneous.tips.title')}</h3>
        <ul className="text-sm text-stone-600 dark:text-stone-400 space-y-1.5">
          {searchMode === 'ai' ? (
            <>
              <li>{t('spontaneous.tips.aiTip1')}</li>
              <li>{t('spontaneous.tips.aiTip2')}</li>
              <li>{t('spontaneous.tips.aiTip3')}</li>
              <li>{t('spontaneous.tips.aiTip4')}</li>
            </>
          ) : (
            <>
              <li>{t('spontaneous.tips.orgTip1')} <a href="https://allabolag.se" target="_blank" rel="noopener noreferrer" className="text-[var(--c-solid)] dark:text-[var(--c-solid)] hover:underline">allabolag.se</a></li>
              <li>{t('spontaneous.tips.tip2')}</li>
              <li>{t('spontaneous.tips.tip3')}</li>
              <li>{t('spontaneous.tips.tip4')}</li>
            </>
          )}
        </ul>
      </Card>
    </div>
  )
}
