/**
 * ApplicationsPipeline Component
 * Kanban-style view for managing job applications through stages
 */

import { useState, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus, Filter, ChevronDown, AlertCircle, Archive, CheckCircle,
  Sparkles, Bookmark, Send, Eye, Phone, Users, FileCheck, Trophy, Search
} from '@/components/ui/icons'
import { Button, Card, EmptyState } from '@/components/ui'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem
} from '@/components/ui/DropdownMenu'
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
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={id}
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
          <Icon className={cn("w-4 h-4", config.color)} />
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
          <div className="flex flex-col items-center justify-center py-8 text-stone-600 pointer-events-none">
            <Icon className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs text-center">{t('applications.pipeline.emptyColumn', 'Inga ansökningar')}</p>
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
  const {
    applicationsByStatus,
    archivedApplications,
    staleApplications,
    stats,
    isLoading,
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

  const handleStatusChange = async (id: string, newStatus: ApplicationStatus) => {
    try {
      await updateStatus(id, newStatus)
    } catch (error) {
      console.error('Failed to update status:', error)
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
    } catch (error) {
      console.error('Failed to archive:', error)
    }
  }

  const handleUnarchive = async (id: string) => {
    try {
      await unarchiveApplication(id)
    } catch (error) {
      console.error('Failed to unarchive:', error)
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
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" role="status" aria-label="Laddar" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-[var(--c-accent)]/40 text-[var(--c-text)] rounded-full text-sm font-medium">
            {t('applications.pipeline.active', { count: stats.active })}
          </span>
          <span className="text-sm text-stone-700 hidden sm:inline">
            {t('applications.pipeline.summary', { applied: stats.applied, interviews: stats.interview })}
          </span>
        </div>

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
                aria-haspopup="menu"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm",
                  priorityFilter
                    ? "border-[var(--c-accent)] bg-[var(--c-bg)] text-[var(--c-text)]"
                    : "border-stone-200 hover:bg-stone-50 text-stone-600"
                )}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {priorityFilter
                    ? t(`applications.pipeline.priority${priorityFilter.charAt(0).toUpperCase()}${priorityFilter.slice(1)}`)
                    : t('applications.pipeline.filter', 'Filter')}
                </span>
                <ChevronDown className="w-4 h-4" />
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

          {/* Mobil-CTA — på desktop finns "Ny ansökan" redan i sidans header.
              På mobil är den header-knappen dold (sm:flex) så vi behöver en
              kompakt knapp här. */}
          <Button onClick={onAddApplication} className="sm:hidden" aria-label={t('applications.addApplication', 'Ny ansökan')}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stale applications warning */}
      {staleApplications.length > 0 && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">
                {t('applications.stale.title', { count: staleApplications.length })}
              </p>
              <p className="text-sm text-amber-700 mt-1">
                {t('applications.stale.description', 'Dessa har inte uppdaterats på 7+ dagar. Överväg att följa upp eller uppdatera status.')}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {staleApplications.slice(0, 3).map(app => (
                  <button
                    key={app.id}
                    onClick={() => onViewApplication?.(app)}
                    className="px-2 py-1 bg-white rounded-lg text-xs font-medium text-amber-800 border border-amber-200 hover:bg-amber-100"
                  >
                    {app.companyName
                      || (app.jobData as { employer?: { name?: string } } | undefined)?.employer?.name
                      || t('applications.common.unknownCompany', 'Okänt företag')}
                  </button>
                ))}
                {staleApplications.length > 3 && (
                  <span className="px-2 py-1 text-xs text-amber-600">
                    {t('applications.stale.more', { count: staleApplications.length - 3 })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Nollresultat vid aktiv sökning/filter — istället för åtta tomma kolumner */}
      {stats.total > 0 && hasActiveFilter && visibleCount === 0 && (
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
          Visas bara när användaren har minst en ansökan — när total är 0
          visas bara empty-state-Card nedan (inte två tomtillstånd). */}
      {stats.total > 0 && !(hasActiveFilter && visibleCount === 0) && (
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

      {/* Empty state */}
      {stats.total === 0 && (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-[var(--c-accent)]/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bookmark className="w-8 h-8 text-[var(--c-text)]" />
          </div>
          <h3 className="text-xl font-semibold text-stone-700 mb-2">
            {t('applications.empty.title', 'Du har inte börjat söka jobb än')}
          </h3>
          <p className="text-stone-700 mb-6 max-w-md mx-auto">
            {t('applications.empty.description', 'Spara jobb från jobbsökningen så hamnar de här — eller lägg till en ansökan manuellt om du redan sökt något.')}
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={onAddApplication}>
              <Plus className="w-4 h-4 mr-1" />
              {t('applications.empty.addCta', 'Lägg till ansökan')}
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/job-search'}>
              {t('applications.empty.searchCta', 'Sök jobb')}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

export default ApplicationsPipeline
