/**
 * ApplicationsPipeline Component
 * Kanban-style view for managing job applications through stages
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus, Filter, ChevronDown, AlertCircle,
  Sparkles, Bookmark, Send, Eye, Phone, Users, FileCheck, Trophy
} from '@/components/ui/icons'
import { Button, Card } from '@/components/ui'
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

interface ApplicationsPipelineProps {
  onAddApplication?: () => void
  onViewApplication?: (application: Application) => void
  onEditApplication?: (application: Application) => void
}

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
  onDelete
}: {
  status: ApplicationStatus
  applications: Application[]
  onStatusChange: (id: string, status: ApplicationStatus) => void
  onViewApplication?: (app: Application) => void
  onEditApplication?: (app: Application) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
}) {
  const config = APPLICATION_STATUS_CONFIG[status]
  const Icon = STATUS_ICONS[status]

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
    <div className="flex-shrink-0 w-64 sm:w-72 flex flex-col">
      {/* Column header */}
      <div className={cn(
        "flex items-center justify-between p-3 rounded-t-xl border-t-4",
        config.borderColor,
        "bg-white border border-b-0 border-stone-200"
      )}>
        <div className="flex items-center gap-2">
          <Icon className={cn("w-4 h-4", config.color)} />
          <h3 className="font-semibold text-stone-900 text-sm">
            {getStatusLabel(status)}
          </h3>
          <span className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium",
            config.bgColor, config.color
          )}>
            {applications.length}
          </span>
        </div>
      </div>

      {/* Column content */}
      <div className="flex-1 bg-stone-50 border border-t-0 border-stone-200 rounded-b-xl p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto">
        {sortedApps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-stone-600">
            <Icon className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs text-center">Inga ansökningar</p>
          </div>
        ) : (
          sortedApps.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              variant="compact"
              onStatusChange={onStatusChange}
              onViewDetails={onViewApplication}
              onEdit={onEditApplication}
              onArchive={onArchive}
              onDelete={onDelete}
            />
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
  const { t } = useTranslation()
  const {
    applicationsByStatus,
    staleApplications,
    stats,
    isLoading,
    updateStatus,
    archiveApplication,
    deleteApplication
  } = useApplications()

  const [showFilters, setShowFilters] = useState(false)
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null)

  // Filter applications by priority if set
  const filteredByStatus = useMemo(() => {
    if (!priorityFilter) return applicationsByStatus

    const filtered: typeof applicationsByStatus = {
      interested: [],
      saved: [],
      applied: [],
      screening: [],
      phone: [],
      interview: [],
      assessment: [],
      offer: [],
      accepted: [],
      rejected: [],
      withdrawn: []
    }

    Object.entries(applicationsByStatus).forEach(([status, apps]) => {
      filtered[status as ApplicationStatus] = apps.filter(a => a.priority === priorityFilter)
    })

    return filtered
  }, [applicationsByStatus, priorityFilter])

  const handleStatusChange = async (id: string, newStatus: ApplicationStatus) => {
    try {
      await updateStatus(id, newStatus)
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleArchive = async (id: string) => {
    try {
      await archiveApplication(id)
    } catch (error) {
      console.error('Failed to archive:', error)
    }
  }

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-[var(--c-accent)]/40 text-[var(--c-text)] rounded-full text-sm font-medium">
            {stats.active} aktiva
          </span>
          <span className="text-sm text-stone-700 hidden sm:inline">
            {stats.applied} ansökta • {stats.interview} intervjuer
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Priority filter */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm",
                priorityFilter
                  ? "border-[var(--c-accent)] bg-[var(--c-bg)] text-[var(--c-text)]"
                  : "border-stone-200 hover:bg-stone-50 text-stone-600"
              )}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">
                {priorityFilter ? `${priorityFilter === 'high' ? 'Hög' : priorityFilter === 'low' ? 'Låg' : 'Medium'} prioritet` : 'Filter'}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showFilters && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowFilters(false)} />
                <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border border-stone-200 py-1 z-20 min-w-[150px]">
                  <button
                    onClick={() => { setPriorityFilter(null); setShowFilters(false) }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm hover:bg-stone-50",
                      !priorityFilter && "text-[var(--c-text)] bg-[var(--c-bg)]"
                    )}
                  >
                    Alla prioriteter
                  </button>
                  <button
                    onClick={() => { setPriorityFilter('high'); setShowFilters(false) }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm hover:bg-stone-50",
                      priorityFilter === 'high' && "text-[var(--c-text)] bg-[var(--c-bg)]"
                    )}
                  >
                    Hög prioritet
                  </button>
                  <button
                    onClick={() => { setPriorityFilter('medium'); setShowFilters(false) }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm hover:bg-stone-50",
                      priorityFilter === 'medium' && "text-[var(--c-text)] bg-[var(--c-bg)]"
                    )}
                  >
                    Medium prioritet
                  </button>
                  <button
                    onClick={() => { setPriorityFilter('low'); setShowFilters(false) }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm hover:bg-stone-50",
                      priorityFilter === 'low' && "text-[var(--c-text)] bg-[var(--c-bg)]"
                    )}
                  >
                    Låg prioritet
                  </button>
                </div>
              </>
            )}
          </div>

          <Button onClick={onAddApplication} className="sm:hidden">
            <Plus className="w-4 h-4" />
          </Button>
          <Button onClick={onAddApplication} className="hidden sm:flex">
            <Plus className="w-4 h-4 mr-1" />
            Ny ansökan
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
                {staleApplications.length} ansökning{staleApplications.length > 1 ? 'ar' : ''} behöver uppföljning
              </p>
              <p className="text-sm text-amber-700 mt-1">
                Dessa har inte uppdaterats på 7+ dagar. Överväg att följa upp eller uppdatera status.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {staleApplications.slice(0, 3).map(app => (
                  <button
                    key={app.id}
                    onClick={() => onViewApplication?.(app)}
                    className="px-2 py-1 bg-white rounded-lg text-xs font-medium text-amber-800 border border-amber-200 hover:bg-amber-100"
                  >
                    {app.companyName || (app.jobData as any)?.employer?.name}
                  </button>
                ))}
                {staleApplications.length > 3 && (
                  <span className="px-2 py-1 text-xs text-amber-600">
                    +{staleApplications.length - 3} till
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Pipeline columns */}
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
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
          />
        ))}
      </div>

      {/* Empty state */}
      {stats.total === 0 && (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-[var(--c-accent)]/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bookmark className="w-8 h-8 text-[var(--c-text)]" />
          </div>
          <h3 className="text-xl font-semibold text-stone-700 mb-2">
            Inga ansökningar än
          </h3>
          <p className="text-stone-700 mb-6 max-w-md mx-auto">
            Börja spåra dina jobbansökningar genom att spara jobb från jobbsökningen
            eller lägg till en ansökan manuellt.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={onAddApplication}>
              <Plus className="w-4 h-4 mr-1" />
              Lägg till ansökan
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/job-search'}>
              Sök jobb
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

export default ApplicationsPipeline
