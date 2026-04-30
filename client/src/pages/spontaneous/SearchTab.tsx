/**
 * Search Tab - Look up companies by organization number or AI search
 */
import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
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
import { searchCompaniesWithAI, type AICompanyResult } from '@/services/aiCompanySearchApi'
import { CompanyAnalysisPanel } from '@/components/ai'
import { showToast } from '@/components/Toast'

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
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
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
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        <AlertTriangle className="w-3 h-3" />
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
  const [searchMode, setSearchMode] = useState<SearchMode>('ai')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<BolagsverketCompany | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [documents, setDocuments] = useState<BolagsverketDocument[]>([])
  const [isLoadingDocs, setIsLoadingDocs] = useState(false)
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null)

  // AI Search state
  const [aiResults, setAiResults] = useState<AICompanyResult[]>([])
  const [aiSearchStats, setAiSearchStats] = useState<{ total: number; verified: number } | null>(null)
  const [savingCompanyId, setSavingCompanyId] = useState<string | null>(null)
  const [selectedForSave, setSelectedForSave] = useState<Set<string>>(new Set())
  const [expandedAnalysis, setExpandedAnalysis] = useState<string | null>(null)

  const { lookupCompany, addCompany, isCompanySaved } = useSpontaneousCompanies()

  // Load documents when search result changes
  useEffect(() => {
    if (searchResult?.orgNumber) {
      loadDocuments(searchResult.orgNumber)
    } else {
      setDocuments([])
    }
  }, [searchResult?.orgNumber])

  const loadDocuments = async (orgNumber: string) => {
    setIsLoadingDocs(true)
    try {
      const docs = await getCompanyDocuments(orgNumber)
      setDocuments(docs)
    } catch (err) {
      console.error('Error loading documents:', err)
      // Don't show error - documents are optional
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

  // AI Search handler
  const handleAISearch = async () => {
    const query = searchQuery.trim()

    if (query.length < 3) {
      setSearchError(t('spontaneous.aiSearch.minChars'))
      return
    }

    setIsSearching(true)
    setSearchError(null)
    setAiResults([])
    setAiSearchStats(null)
    setSearchResult(null)
    setSelectedForSave(new Set())

    try {
      const result = await searchCompaniesWithAI(query, 10)
      setAiResults(result.companies)
      setAiSearchStats({ total: result.totalFound, verified: result.verified })

      if (result.companies.length === 0) {
        setSearchError(t('spontaneous.aiSearch.noResults'))
      }
    } catch (err) {
      console.error('AI Search error:', err)
      setSearchError(err instanceof Error ? err.message : t('spontaneous.aiSearch.failed'))
    } finally {
      setIsSearching(false)
    }
  }

  // Save AI result company
  const handleSaveAICompany = async (company: AICompanyResult) => {
    if (!company.orgNumber) {
      showToast.error(t('spontaneous.cannotSaveWithoutOrgNumber'))
      return
    }

    const companyKey = company.orgNumber
    setSavingCompanyId(companyKey)

    try {
      await addCompany(company.orgNumber)
    } finally {
      setSavingCompanyId(null)
    }
  }

  // Save all selected companies
  const handleSaveSelected = async () => {
    const toSave = aiResults.filter(c => c.orgNumber && selectedForSave.has(c.orgNumber) && !isCompanySaved(c.orgNumber))

    if (toSave.length === 0) {
      showToast.warning(t('spontaneous.noNewCompaniesToSave'))
      return
    }

    setIsSearching(true)
    let saved = 0

    for (const company of toSave) {
      try {
        await addCompany(company.orgNumber!)
        saved++
      } catch (err) {
        console.error('Error saving company:', err)
      }
    }

    setSelectedForSave(new Set())
    setIsSearching(false)
    showToast.success(t('spontaneous.companiesSaved', { count: saved }))
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
    // Clear previous results
    setAiResults([])
    setAiSearchStats(null)
    setSearchResult(null)

    if (searchMode === 'ai') {
      await handleAISearch()
      return
    }

    // Org number search
    const query = searchQuery.trim()

    if (!query) {
      setSearchError(t('spontaneous.search.enterOrgNumber'))
      return
    }

    if (!isValidOrgNumber(query)) {
      setSearchError(t('spontaneous.search.invalidFormat'))
      return
    }

    setIsSearching(true)
    setSearchError(null)

    try {
      const result = await lookupCompany(query)

      if (result) {
        setSearchResult(result)
      } else {
        setSearchError(t('spontaneous.search.notFound'))
      }
    } catch (err) {
      console.error('Search error:', err)
      setSearchError(t('spontaneous.search.error'))
    } finally {
      setIsSearching(false)
    }
  }

  const handleSave = async () => {
    if (!searchResult) return

    setIsSaving(true)
    try {
      await addCompany(searchResult.orgNumber)
      // Clear search after saving
      setSearchResult(null)
      setSearchQuery('')
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
    <div className="space-y-6">
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
            onClick={() => setSearchMode('ai')}
            className={`flex items-center gap-2 ${searchMode === 'ai' ? 'bg-[var(--c-solid)] hover:bg-[var(--c-solid)] dark:bg-[var(--c-solid)] dark:hover:bg-[var(--c-solid)]' : 'border-stone-200 dark:border-stone-700'}`}
          >
            <Sparkles className="w-4 h-4" />
            {t('spontaneous.search.aiSearch')}
          </Button>
          <Button
            variant={searchMode === 'orgnr' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSearchMode('orgnr')}
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

        <div className="flex gap-3">
          <div className="flex-1 relative">
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 bg-white dark:bg-stone-700 border-stone-200 dark:border-stone-600 text-stone-900 dark:text-stone-100"
              disabled={isSearching}
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="min-w-[100px] bg-[var(--c-solid)] hover:bg-[var(--c-solid)] dark:bg-[var(--c-solid)] dark:hover:bg-[var(--c-solid)]"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : searchMode === 'ai' ? (
              <>
                <Sparkles className="w-4 h-4 mr-1" />
                {t('common.search')}
              </>
            ) : (
              t('common.search')
            )}
          </Button>
        </div>

        {searchError && (
          <p className="mt-3 text-sm text-red-500">{searchError}</p>
        )}
      </Card>

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

                {!isLoadingDocs && documents.length === 0 && (
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2 text-stone-800 dark:text-stone-100">
                <Sparkles className="w-5 h-5 text-[var(--c-solid)] dark:text-[var(--c-solid)]" />
                {t('spontaneous.searchResults')}
              </h3>
              {aiSearchStats && (
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  {t('spontaneous.aiSearch.resultsFound', { total: aiSearchStats.total, verified: aiSearchStats.verified })}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllVerified}
                disabled={aiResults.filter(c => c.verified && c.orgNumber && !isCompanySaved(c.orgNumber)).length === 0}
                className="border-stone-200 dark:border-stone-700"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                {t('spontaneous.selectAllVerified')}
              </Button>
              {selectedForSave.size > 0 && (
                <Button
                  size="sm"
                  onClick={handleSaveSelected}
                  disabled={isSearching}
                  className="bg-[var(--c-solid)] hover:bg-[var(--c-solid)] dark:bg-[var(--c-solid)] dark:hover:bg-[var(--c-solid)]"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {t('spontaneous.saveSelected', { count: selectedForSave.size })}
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {aiResults.map((company, index) => {
              const isSaved = company.orgNumber ? isCompanySaved(company.orgNumber) : false
              const isSelected = company.orgNumber ? selectedForSave.has(company.orgNumber) : false
              const isSaving = savingCompanyId === company.orgNumber

              return (
                <div
                  key={company.orgNumber || `company-${index}`}
                  className={`p-4 rounded-lg border transition-colors ${
                    isSelected
                      ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/20'
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
                          className="w-4 h-4 text-primary-500 rounded border-stone-300 focus:ring-primary-500"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-4 h-4 text-[var(--c-solid)] dark:text-[var(--c-solid)] flex-shrink-0" />
                        <h4 className="font-semibold truncate text-stone-800 dark:text-stone-100">{company.name}</h4>

                        {/* Verification badge */}
                        {company.verified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            {t('spontaneous.verified')}
                          </span>
                        ) : company.orgNumber ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            <AlertTriangle className="w-3 h-3" />
                            {t('spontaneous.notVerified')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                            {t('spontaneous.missingOrgNumber')}
                          </span>
                        )}

                        {isSaved && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--c-bg)] text-[var(--c-text)] dark:bg-[var(--c-bg)]/40 dark:text-[var(--c-text)]">
                            <CheckCircle2 className="w-3 h-3" />
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
                            <MapPin className="w-3.5 h-3.5" />
                            {company.verifiedData?.address?.city || company.city}
                          </span>
                        )}
                        {company.industry && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5" />
                            {company.industry}
                          </span>
                        )}
                      </div>

                      {company.description && (
                        <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 line-clamp-2">
                          {company.description}
                        </p>
                      )}

                      {company.verifiedData && (
                        <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">
                          {company.verifiedData.legalForm}
                          {company.verifiedData.address?.street && ` - ${company.verifiedData.address.street}`}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2">
                      {/* Analyze button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedAnalysis(expandedAnalysis === company.orgNumber ? null : (company.orgNumber || `idx-${index}`))}
                        className="text-[var(--c-text)] dark:text-[var(--c-solid)] border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50 hover:bg-[var(--c-bg)] dark:hover:bg-[var(--c-bg)]/30"
                      >
                        <Sparkles className="w-4 h-4" />
                      </Button>

                      {/* Save button */}
                      {company.orgNumber && !isSaved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSaveAICompany(company)}
                          disabled={isSaving}
                          className="border-stone-200 dark:border-stone-700"
                        >
                          {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Company Analysis Panel - Expandable */}
                  {expandedAnalysis === (company.orgNumber || `idx-${index}`) && (
                    <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700">
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
