/**
 * ApplicationsPipeline Component
 * Kanban-style view for managing job applications through stages
 *
 * 2026-08-19: komponenten hade tre lägen i verkligheten (laddar / fel / klart)
 * men ritade bara två — och den grindade dessutom både kanbanen och
 * tomtillståndet på den SEPARATA statistikfrågan. Följden: ett hämtningsfel
 * och ett svar som inte hunnit in såg båda ut som "Du har inte börjat söka
 * jobb än", för en person som kunde ha tjugo ansökningar. Nu avgörs tomheten
 * av `applications` — den fråga vars `isLoading`/`error` komponenten faktiskt
 * känner — och felet får ett eget läge med "Försök igen".
 *
 * Siffrorna i verktygsraden räknas numera på samma icke-arkiverade mängd som
 * kanbanen (`applicationsByStatus`) i stället för på `stats`, som räknar med
 * arkiverade rader. Någon med fem intervjuer kunde annars se "0 intervjuer".
 */

import { useState, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  Filter, ChevronDown, AlertCircle, Archive, CheckCircle,
  Sparkles, Bookmark, Send, Eye, Phone, Users, FileCheck, Trophy, Search
} from '@/components/ui/icons'
import { Button, Card, EmptyState, ErrorState } from '@/components/ui'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem
} from '@/components/ui/DropdownMenu'
import { showToast } from '@/components/Toast'
import { cn } from '@/lib/utils'
import { ApplicationCard } from './ApplicationCard'
import { useApplications } from '@/hooks/useApplications'
import {
  APPLICATION_STATUS_CONFIG,
  PIPELINE_COLUMNS,
  getStatusLabel,
  type Application,
  type ApplicationStatus
} from '@/types/application.types'

function CollapsibleSection({
  id,
  title,
  count,
  icon: Icon,
  children
}: {
  id: string
  title: string
  count: number
  icon: React.ElementType
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-stone-200 rounded-xl bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        /* aria-controls får bara peka på ett id som finns i DOM:en — panelen
           renderas inte när sektionen är hopfälld. */
        aria-controls={open ? id : undefined}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-stone-50 rounded-xl transition-colors"
      >
        <span className="flex items-center gap-2 font-medium text-stone-800 text-sm">
          <Icon className="w-4 h-4 text-stone-500" aria-hidden="true" />
          {title}
          <span className="px-2 py-0.5 rounded-full text-xs bg-stone-100 text-stone-600">{count}</span>
        </span>
        <ChevronDown className={cn('w-4 h-4 text-stone-500 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>
      {open && <div id={id} className="p-3 pt-0">{children}</div>}
    </div>
  )
}

interface ApplicationsPipelineProps {
  onAddApplication?: () => void
  onViewApplication?: (application: Application) => void
  onEditApplication?: (application: Application) => void
}

// MIME-typ för drag-and-drop av ansökningskort (dataTransfer lowercasar typer)
const DND_TYPE = 'application/x-jobin-application-id'

// Icon mapping for status
const STATUS_ICONS: Record<ApplicationStatus, React.ElementType> = {
  interested: Sparkles,
  saved: Bookmark,
  applied: Send,
  screening: Eye,
  phone: Phone,
  interview: Users,
  assessment: FileCheck,
  offer: Trophy,
  accepted: Sparkles,
  rejected: AlertCircle,
  withdrawn: AlertCircle
}

function PipelineColumn({
  status,
  applications,
  onStatusChange,
  onViewApplication,
  onEditApplication,
  onArchive,
  onDelete,
  draggingId,
  onDragStateChange,
  onDropApplication
}: {
  status: ApplicationStatus
  applications: Application[]
  onStatusChange: (id: string, status: ApplicationStatus) => void
  onViewApplication?: (app: Application) => void
  onEditApplication?: (app: Application) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  draggingId: string | null
  onDragStateChange: (id: string | null) => void
  onDropApplication: (id: string, status: ApplicationStatus) => void
}) {
  const { t } = useTranslation()
  const config = APPLICATION_STATUS_CONFIG[status]
  const Icon = STATUS_ICONS[status]

  const [isDropTarget, setIsDropTarget] = useState(false)
  // dragenter/dragleave bubblar från barnelement — räknare krävs för att
  // veta när pekaren faktiskt lämnat kolumnen.
  const dragDepth = useRef(0)

  // Sort by priority (high first), then by updated date
  const sortedApps = useMemo(() => {
    return [...applications].sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }, [applications])

  return (
    <div className="min-w-0 flex flex-col">
      {/* Column header */}
      <div className={cn(
        "flex items-center justify-between p-3 rounded-t-xl border-t-4",
        config.borderColor,
        "bg-white border border-b-0 border-stone-200"
      )}>
        <div className="flex items-center gap-2">
          <Icon className={cn("w-4 h-4", config.color)} aria-hidden="true" />
          <h3 className="font-semibold text-stone-900 text-sm">
            {t(`applications.status.${status}`, getStatusLabel(status))}
          </h3>
          <span className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium",
            config.bgColor, config.color
          )}>
            {applications.length}
          </span>
        </div>
      </div>

      {/* Column content — även drop-zon för drag-and-drop */}
      <div
        data-status={status}
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes(DND_TYPE)) return
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
        }}
        onDragEnter={(e) => {
          if (!e.dataTransfer.types.includes(DND_TYPE)) return
          dragDepth.current++
          setIsDropTarget(true)
        }}
        onDragLeave={() => {
          dragDepth.current = Math.max(0, dragDepth.current - 1)
          if (dragDepth.current === 0) setIsDropTarget(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          dragDepth.current = 0
          setIsDropTarget(false)
          const id = e.dataTransfer.getData(DND_TYPE)
          if (id) onDropApplication(id, status)
        }}
        className={cn(
          "flex-1 bg-stone-50 border border-t-0 border-stone-200 rounded-b-xl p-2 space-y-2 min-h-[200px] max-h-[420px] overflow-y-auto transition-colors",
          isDropTarget && "bg-[var(--c-bg)] ring-2 ring-inset ring-[var(--c-solid)]"
        )}
      >
        {sortedApps.length === 0 ? (
          /* Åtta kolumner som alla säger "Inga ansökningar" är brus — antalet
             står redan i kolumnrubriken. Här räcker en lugn yta, med text
             bara när något faktiskt dras. */
          <div
            className={cn(
              'flex items-center justify-center h-full min-h-[120px] px-2 text-center rounded-lg border border-dashed text-xs pointer-events-none transition-colors',
              isDropTarget
                ? 'border-[var(--c-solid)] text-[var(--c-text)]'
                : 'border-stone-200 text-stone-600'
            )}
          >
            {draggingId ? t('applications.pipeline.dropHere', 'Släpp här') : null}
          </div>
        ) : (
          sortedApps.map((app) => (
            <div
              key={app.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(DND_TYPE, app.id)
                e.dataTransfer.effectAllowed = 'move'
                // Skjut upp state-ändringen en tick — en synkron re-render
                // under dragstart kan avbryta draget i Chromium.
                setTimeout(() => onDragStateChange(app.id), 0)
              }}
              onDragEnd={() => onDragStateChange(null)}
              className="cursor-grab active:cursor-grabbing"
            >
              <ApplicationCard
                application={app}
                variant="compact"
                isDragging={draggingId === app.id}
                onStatusChange={onStatusChange}
                onViewDetails={onViewApplication}
                onEdit={onEditApplication}
                onArchive={onArchive}
                onDelete={onDelete}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export function ApplicationsPipeline({
  onAddApplication,
  onViewApplication,
  onEditApplication
}: ApplicationsPipelineProps) {
  const { t, i18n } = useTranslation()
  // UX15: HashRouter — window.location.href hade laddat om appen mot en
  // bas-path som inte finns och lämnat URL:en trasig resten av sessionen.
  const navigate = useNavigate()
  const {
    applications,
    applicationsByStatus,
    archivedApplications,
    staleApplications,
    isLoading,
    error,
    refetch,
    updateStatus,
    archiveApplication,
    unarchiveApplication,
    deleteApplication
  } = useApplications()

  const [priorityFilter, setPriorityFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [draggingId, setDraggingId] = useState<string | null>(null)

  // Filter applications by priority and search query
  const filteredByStatus = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!priorityFilter && !q) return applicationsByStatus

    const matches = (a: Application) => {
      if (priorityFilter && a.priority !== priorityFilter) return false
      if (!q) return true
      const jobData = a.jobData as { employer?: { name?: string }; headline?: string } | undefined
      const haystack = [
        a.jobTitle, a.companyName, a.location,
        jobData?.headline, jobData?.employer?.name
      ].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(q)
    }

    const filtered = {} as typeof applicationsByStatus
    Object.entries(applicationsByStatus).forEach(([status, apps]) => {
      filtered[status as ApplicationStatus] = apps.filter(matches)
    })
    return filtered
  }, [applicationsByStatus, priorityFilter, searchQuery])

  const hasActiveFilter = Boolean(priorityFilter || searchQuery.trim())
  const visibleCount = useMemo(
    () => PIPELINE_COLUMNS.reduce((sum, s) => sum + filteredByStatus[s].length, 0),
    [filteredByStatus]
  )

  // Siffrorna i verktygsraden — samma icke-arkiverade mängd som kanbanen.
  // `stats` (den separata frågan) räknar in arkiverade rader och kan dessutom
  // vara "vet inte än"; ingen av delarna hör hemma i en siffra vi visar.
  const antalAktiva = useMemo(
    () => PIPELINE_COLUMNS.reduce((sum, s) => sum + applicationsByStatus[s].length, 0),
    [applicationsByStatus]
  )
  const antalAnsokta = applicationsByStatus.applied.length
  const antalIntervjuer = applicationsByStatus.interview.length

  // En nyckel kan bara böjas efter EN `count` — den gamla `summary` bar två
  // tal i samma sträng och kunde därför aldrig få pluralformer ("1 ansökta").
  // Den är borttagen; här används de två böjda familjerna, var och en anropad
  // med `count`. Nollor skrivs inte ut alls: "0 intervjuer" är ett
  // prestationspåstående utan innehåll (DESIGN.md §2).
  const summeringsdelar = [
    antalAnsokta > 0 ? t('applications.pipeline.summaryApplied', { count: antalAnsokta }) : null,
    antalIntervjuer > 0 ? t('applications.pipeline.summaryInterviews', { count: antalIntervjuer }) : null,
  ].filter(Boolean) as string[]

  const handleStatusChange = async (id: string, newStatus: ApplicationStatus) => {
    try {
      await updateStatus(id, newStatus)
    } catch (err) {
      // Ingen optimistisk uppdatering sker i useApplications (mutationen
      // invaliderar först vid onSuccess), så det finns ingenting att rulla
      // tillbaka — kortet står kvar i sitt gamla steg. Det som saknades var
      // beskedet: ett misslyckat drag såg ut som ett drag som inte tog.
      console.error('Failed to update status:', err)
      showToast.error(
        t('applications.pipeline.moveFailedTitle', 'Ansökan flyttades inte'),
        t('applications.pipeline.moveFailedBody', 'Vi kunde inte spara det nya steget. Kortet ligger kvar där det var — prova gärna igen om en stund.')
      )
    }
  }

  const handleDropApplication = (id: string, newStatus: ApplicationStatus) => {
    setDraggingId(null)
    // Släpp i samma kolumn = ingen ändring
    if (applicationsByStatus[newStatus].some(app => app.id === id)) return
    void handleStatusChange(id, newStatus)
  }

  const handleArchive = async (id: string) => {
    try {
      await archiveApplication(id)
    } catch (err) {
      console.error('Failed to archive:', err)
      showToast.error(
        t('applications.pipeline.archiveFailedTitle', 'Ansökan arkiverades inte'),
        t('applications.pipeline.archiveFailedBody', 'Den ligger kvar bland dina ansökningar. Prova gärna igen om en stund.')
      )
    }
  }

  const handleUnarchive = async (id: string) => {
    try {
      await unarchiveApplication(id)
    } catch (err) {
      console.error('Failed to unarchive:', err)
      showToast.error(
        t('applications.pipeline.restoreFailedTitle', 'Ansökan kunde inte tas tillbaka'),
        t('applications.pipeline.restoreFailedBody', 'Den ligger kvar i arkivet. Prova gärna igen om en stund.')
      )
    }
  }

  // Avslutade (terminala, ej arkiverade) — visas i egen sektion under pipelinen
  const completedApplications = useMemo(() => {
    return [
      ...applicationsByStatus.accepted,
      ...applicationsByStatus.rejected,
      ...applicationsByStatus.withdrawn,
    ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [applicationsByStatus])

  const handleDelete = async (id: string) => {
    try {
      await deleteApplication(id)
    } catch (err) {
      console.error('Failed to delete:', err)
      showToast.error(
        t('applications.pipeline.deleteFailedTitle', 'Ansökan togs inte bort'),
        t('applications.pipeline.deleteFailedBody', 'Den finns kvar. Prova gärna igen om en stund.')
      )
    }
  }

  // ── Tre uttryckliga lägen: laddar / fel / klart ───────────────────────
  // `isLoading === false` räcker inte som "klart" — härled ur isLoading || !data.
  const laddar = isLoading || (!error && !applications)

  if (laddar) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--c-solid)]" role="status" aria-label={t('common.loadingStatus', 'Laddar')} />
      </div>
    )
  }

  if (error) {
    return (
      <ErrorState
        title={t('applications.pipeline.errorTitle', 'Vi kunde inte hämta dina ansökningar')}
        message={t('applications.pipeline.errorMessage', 'Det är inte dina uppgifter det är fel på — förbindelsen svarade inte. Prova igen.')}
        onRetry={() => { void refetch() }}
      />
    )
  }

  // Tomheten avgörs av den fråga vi känner tillståndet för — inte av den
  // separata statistikfrågan.
  const harAnsokningar = applications.length > 0

  return (
    <div className="space-y-4">
      {/* Toolbar — bara när det finns något att räkna, filtrera och söka i.
          Fyra nollor ovanför ett tomtillstånd säger ingenting sant om någon
          som ännu inte börjat. */}
      {harAnsokningar && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 bg-[var(--c-accent)]/40 text-[var(--c-text)] rounded-full text-sm font-medium">
              {t('applications.pipeline.active', { count: antalAktiva })}
            </span>
            {summeringsdelar.length > 0 && (
              <span className="text-sm text-stone-700 hidden sm:inline">
                {summeringsdelar.join(' • ')}
              </span>
            )}
          </div>

          {/* Skärmläsarannonsering av sök-/filterresultat (F4, 2026-07-10) */}
          <span className="sr-only" role="status" aria-live="polite">
            {hasActiveFilter
              ? t('applications.pipeline.resultsAnnouncement', { count: visibleCount })
              : ''}
          </span>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('applications.pipeline.searchPlaceholder', 'Sök företag eller tjänst')}
                aria-label={t('applications.pipeline.searchPlaceholder', 'Sök företag eller tjänst')}
                className="w-40 sm:w-56 pl-9 pr-3 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]"
              />
            </div>

            {/* Priority filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-haspopup="menu"
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm",
                    priorityFilter
                      ? "border-[var(--c-accent)] bg-[var(--c-bg)] text-[var(--c-text)]"
                      : "border-stone-200 hover:bg-stone-50 text-stone-600"
                  )}
                >
                  <Filter className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">
                    {priorityFilter
                      ? t(`applications.pipeline.priority${priorityFilter.charAt(0).toUpperCase()}${priorityFilter.slice(1)}`)
                      : t('applications.pipeline.filter', 'Filter')}
                  </span>
                  <ChevronDown className="w-4 h-4" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[150px]">
                {([
                  { value: null, labelKey: 'applications.pipeline.allPriorities', fallback: 'Alla prioriteter' },
                  { value: 'high', labelKey: 'applications.pipeline.priorityHigh', fallback: 'Hög prioritet' },
                  { value: 'medium', labelKey: 'applications.pipeline.priorityMedium', fallback: 'Medium prioritet' },
                  { value: 'low', labelKey: 'applications.pipeline.priorityLow', fallback: 'Låg prioritet' },
                ] as const).map(opt => (
                  <DropdownMenuItem
                    key={opt.labelKey}
                    onClick={() => setPriorityFilter(opt.value)}
                    className={priorityFilter === opt.value ? 'text-[var(--c-text)] bg-[var(--c-bg)]' : undefined}
                  >
                    {t(opt.labelKey, opt.fallback)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Ingen egen mobil-CTA här längre. Knappen fanns för att sidans
                `actions` ("Ny ansökan") var `hidden sm:flex` — det togs bort
                2026-08-19, så headerknappen syns nu på alla bredder. Två
                identiska knappar bredvid varandra på mobil är värre än ingen. */}
          </div>
        </div>
      )}

      {/* Stale applications warning */}
      {staleApplications.length > 0 && (
        <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-200">
                {t('applications.stale.title', { count: staleApplications.length })}
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                {t('applications.stale.description', 'Dessa har inte uppdaterats på 7+ dagar. Överväg att följa upp eller uppdatera status.')}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {staleApplications.slice(0, 3).map(app => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => onViewApplication?.(app)}
                    className="px-2 py-1 bg-white dark:bg-stone-800 rounded-lg text-xs font-medium text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                  >
                    {app.companyName
                      || (app.jobData as { employer?: { name?: string } } | undefined)?.employer?.name
                      || t('applications.common.unknownCompany', 'Okänt företag')}
                  </button>
                ))}
                {staleApplications.length > 3 && (
                  <span className="px-2 py-1 text-xs text-amber-600 dark:text-amber-400">
                    {t('applications.stale.more', { count: staleApplications.length - 3 })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Nollresultat vid aktiv sökning/filter — istället för åtta tomma kolumner */}
      {harAnsokningar && hasActiveFilter && visibleCount === 0 && (
        <EmptyState
          icon={Search}
          title={t('applications.pipeline.noResultsTitle', 'Inga ansökningar matchar din sökning')}
          description={t('applications.pipeline.noResultsDescription', 'Prova andra sökord eller rensa filtren.')}
          action={{
            label: t('applications.pipeline.clearFilters', 'Rensa filter'),
            onClick: () => { setSearchQuery(''); setPriorityFilter(null) },
            variant: 'secondary',
          }}
        />
      )}

      {/* Pipeline — kanban på ≥sm, grupperad lista på mobil (8 kolumner
          horisontell scroll är för tungt på små skärmar).
          Kanbanen radbryts som grid med max 4 kolumner per rad så alla
          kolumner får plats på skärmen utan horisontell scroll.
          Visas bara när användaren har minst en ansökan — annars visas bara
          tomtillståndet nedan (inte två tomtillstånd ovanpå varandra). */}
      {harAnsokningar && !(hasActiveFilter && visibleCount === 0) && (
        <>
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
            {PIPELINE_COLUMNS.map((status) => (
              <PipelineColumn
                key={status}
                status={status}
                applications={filteredByStatus[status]}
                onStatusChange={handleStatusChange}
                onViewApplication={onViewApplication}
                onEditApplication={onEditApplication}
                onArchive={handleArchive}
                onDelete={handleDelete}
                draggingId={draggingId}
                onDragStateChange={setDraggingId}
                onDropApplication={handleDropApplication}
              />
            ))}
          </div>

          <div className="sm:hidden space-y-5">
            {PIPELINE_COLUMNS.filter(status => filteredByStatus[status].length > 0).map((status) => {
              const config = APPLICATION_STATUS_CONFIG[status]
              const Icon = STATUS_ICONS[status]
              return (
                <section key={status} aria-label={t(`applications.status.${status}`, getStatusLabel(status))}>
                  <h3 className="flex items-center gap-2 mb-2 font-semibold text-stone-900 text-sm">
                    <Icon className={cn('w-4 h-4', config.color)} aria-hidden="true" />
                    {t(`applications.status.${status}`, getStatusLabel(status))}
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', config.bgColor, config.color)}>
                      {filteredByStatus[status].length}
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {filteredByStatus[status].map(app => (
                      <ApplicationCard
                        key={app.id}
                        application={app}
                        variant="compact"
                        onStatusChange={handleStatusChange}
                        onViewDetails={onViewApplication}
                        onEdit={onEditApplication}
                        onArchive={handleArchive}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        </>
      )}

      {/* Avslutade ansökningar (accepterad/avslag/återkallad) */}
      {completedApplications.length > 0 && (
        <CollapsibleSection
          id="completed-applications"
          title={t('applications.pipeline.completedSection', 'Avslutade')}
          count={completedApplications.length}
          icon={CheckCircle}
        >
          <div className="grid gap-3 md:grid-cols-2">
            {completedApplications.map(app => (
              <ApplicationCard
                key={app.id}
                application={app}
                onStatusChange={handleStatusChange}
                onViewDetails={onViewApplication}
                onEdit={onEditApplication}
                onArchive={handleArchive}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Arkiverade ansökningar med möjlighet att återställa */}
      {archivedApplications.length > 0 && (
        <CollapsibleSection
          id="archived-applications"
          title={t('applications.pipeline.archiveSection', 'Arkiv')}
          count={archivedApplications.length}
          icon={Archive}
        >
          <div className="space-y-2">
            {archivedApplications.map(app => {
              const jobData = app.jobData as { employer?: { name?: string }; headline?: string } | undefined
              const title = app.jobTitle || jobData?.headline || t('applications.common.unknownTitle', 'Okänd tjänst')
              const company = app.companyName || jobData?.employer?.name || t('applications.common.unknownCompany', 'Okänt företag')
              return (
                <div key={app.id} className="flex items-center justify-between gap-3 p-3 bg-stone-50 rounded-lg">
                  <button
                    type="button"
                    onClick={() => onViewApplication?.(app)}
                    className="min-w-0 text-left flex-1 hover:underline"
                  >
                    <p className="text-sm font-medium text-stone-800 truncate">{title}</p>
                    <p className="text-xs text-stone-600 truncate">
                      {company}
                      {app.archivedAt && ` • ${t('applications.pipeline.archivedOn', { date: new Date(app.archivedAt).toLocaleDateString(i18n.language) })}`}
                    </p>
                  </button>
                  <Button variant="outline" size="sm" onClick={() => handleUnarchive(app.id)}>
                    {t('applications.pipeline.restore', 'Återställ')}
                  </Button>
                </div>
              )
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* Tomtillstånd — går genom <EmptyState> (DESIGN.md §7) med EN tydlig
          CTA. Den andra vägen in ligger kvar som underordnad text-knapp för
          den som redan sökt något på egen hand; på mobil är den dessutom enda
          vägen att lägga till en ansökan när verktygsraden inte visas. */}
      {!harAnsokningar && (
        <EmptyState
          illustration="jobb"
          title={t('applications.empty.title', 'Du har inte börjat söka jobb än')}
          description={t('applications.empty.description', 'Spara jobb från jobbsökningen så hamnar de här — eller lägg till en ansökan manuellt om du redan sökt något.')}
          action={{
            label: t('applications.empty.searchCta', 'Sök jobb'),
            onClick: () => navigate('/job-search'),
          }}
          secondaryAction={{
            label: t('applications.empty.addCta', 'Lägg till ansökan'),
            onClick: () => onAddApplication?.(),
          }}
        />
      )}
    </div>
  )
}

export default ApplicationsPipeline
