/**
 * Cover Letter Applications Tab
 * Kanban-vy för att spåra ansökningar
 */

import { useState } from 'react'
import { 
  Send, 
  Eye, 
  Users, 
  CheckCircle2, 
  XCircle,
  Clock,
  Plus,
  MoreHorizontal,
  Calendar,
  Building2,
  FileText,
  Bell,
  Filter,
  Search
} from '@/components/ui/icons'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'

type ApplicationStatus = 'saved' | 'sent' | 'viewed' | 'interview' | 'response'

interface Application {
  id: string
  company: string
  jobTitle: string
  status: ApplicationStatus
  appliedDate: string
  lastUpdated: string
  notes?: string
  reminderDate?: string
  hasNotification?: boolean
}

const columns: { id: ApplicationStatus | 'saved'; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'saved', label: 'Sparade', icon: Clock, color: 'bg-slate-100 text-slate-600' },
  { id: 'sent', label: 'Skickade', icon: Send, color: 'bg-blue-100 text-blue-600' },
  { id: 'viewed', label: 'Granskas', icon: Eye, color: 'bg-amber-100 text-amber-600' },
  { id: 'interview', label: 'Intervju', icon: Users, color: 'bg-purple-100 text-purple-600' },
  { id: 'response', label: 'Svar', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-600' },
]

// Mock data
const mockApplications: Application[] = [
  {
    id: '1',
    company: 'Acme AB',
    jobTitle: 'Projektledare',
    status: 'interview',
    appliedDate: '2026-03-08',
    lastUpdated: '2026-03-10',
    notes: 'Intervju bokad till den 15/3',
    hasNotification: true,
  },
  {
    id: '2',
    company: 'TechCorp',
    jobTitle: 'Frontend-utvecklare',
    status: 'sent',
    appliedDate: '2026-03-10',
    lastUpdated: '2026-03-10',
    reminderDate: '2026-03-17',
  },
  {
    id: '3',
    company: 'Stadskommunen',
    jobTitle: 'Handläggare',
    status: 'saved',
    appliedDate: '',
    lastUpdated: '2026-03-09',
  },
  {
    id: '4',
    company: 'Innovation Labs',
    jobTitle: 'UX-designer',
    status: 'viewed',
    appliedDate: '2026-03-05',
    lastUpdated: '2026-03-08',
  },
  {
    id: '5',
    company: 'DataSystems',
    jobTitle: 'Systemadministratör',
    status: 'response',
    appliedDate: '2026-02-28',
    lastUpdated: '2026-03-07',
    notes: 'Fick nej men uppmuntrande feedback',
  },
]

export function CoverLetterApplications() {
  const [applications, setApplications] = useState<Application[]>(mockApplications)
  const [draggedApp, setDraggedApp] = useState<Application | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const handleDragStart = (app: Application) => {
    setDraggedApp(app)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, status: ApplicationStatus | 'saved') => {
    e.preventDefault()
    if (draggedApp && status !== 'saved') {
      setApplications(apps => 
        apps.map(app => 
          app.id === draggedApp.id 
            ? { ...app, status, lastUpdated: new Date().toISOString().split('T')[0] }
            : app
        )
      )
      setDraggedApp(null)
    }
  }

  const filteredApplications = applications.filter(app =>
    app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getApplicationsByStatus = (status: ApplicationStatus | 'saved') => {
    return filteredApplications.filter(app => app.status === status)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })
  }

  const getDaysSince = (dateString: string) => {
    if (!dateString) return 0
    const date = new Date(dateString)
    const now = new Date()
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  }

  if (applications.length === 0) {
    return (
      <EmptyState
        icon={Send}
        title="Dina ansökningar visas här"
        description="När du skickar ett personligt brev till en arbetsgivare sparas det här – så har du koll på vilka jobb du sökt och när."
        action={{
          label: 'Börja skriva ett brev',
          onClick: () => window.location.href = '/cover-letter',
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Header med sök och filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:justify-between sm:items-center">
        <div className="flex gap-2 flex-1 w-full sm:max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
            <input
              type="text"
              placeholder="Sök..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-base sm:text-sm"
            />
          </div>
          <Button
            variant="outline"
            className={cn('gap-2 shrink-0', showFilters && 'bg-slate-100')}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            <span className="hidden sm:inline">Filter</span>
          </Button>
        </div>
        <Button className="gap-2 w-full sm:w-auto justify-center">
          <Plus size={18} />
          <span className="sm:hidden">Ny ansökan</span>
          <span className="hidden sm:inline">Registrera ansökan</span>
        </Button>
      </div>

      {/* Mobile: Vertikala kolumner / Desktop: Horisontell Kanban */}
      {/* Mobile view - collapsed columns */}
      <div className="sm:hidden space-y-4">
        {columns.map((column) => {
          const columnApps = getApplicationsByStatus(column.id)
          const Icon = column.icon

          return (
            <div key={column.id} className="bg-slate-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', column.color)}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">{column.label}</h3>
                  </div>
                </div>
                <span className="text-xs bg-white px-2 py-1 rounded-full text-slate-600">{columnApps.length}</span>
              </div>

              {columnApps.length > 0 ? (
                <div className="space-y-2">
                  {columnApps.map((app) => (
                    <ApplicationCard
                      key={app.id}
                      application={app}
                      onDragStart={() => {}}
                      formatDate={formatDate}
                      getDaysSince={getDaysSince}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-600 text-center py-4">Inga ansökningar</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Desktop view - Kanban board */}
      <div className="hidden sm:flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnApps = getApplicationsByStatus(column.id)
          const Icon = column.icon

          return (
            <div
              key={column.id}
              className="flex-shrink-0 w-64 lg:w-72"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Kolumn header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', column.color)}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">{column.label}</h3>
                    <span className="text-xs text-slate-700">{columnApps.length} st</span>
                  </div>
                </div>
              </div>

              {/* Kolumn innehåll */}
              <div className="space-y-3 min-h-[200px]">
                {columnApps.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    application={app}
                    onDragStart={() => handleDragStart(app)}
                    formatDate={formatDate}
                    getDaysSince={getDaysSince}
                  />
                ))}

                {columnApps.length === 0 && (
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
                    <p className="text-sm text-slate-600">Dra ansökningar hit</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Påminnelser-sektion */}
      {applications.some(app => app.reminderDate && new Date(app.reminderDate) <= new Date()) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-800">Påminnelser</h4>
              <p className="text-sm text-amber-700 mt-1">
                Du har ansökningar som väntar på uppföljning. Det är bra att höra av sig 
                om du inte fått svar inom en vecka.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Kort för varje ansökan
function ApplicationCard({
  application,
  onDragStart,
  formatDate,
  getDaysSince,
}: {
  application: Application
  onDragStart: () => void
  formatDate: (date: string) => string
  getDaysSince: (date: string) => number
}) {
  const daysSince = application.appliedDate ? getDaysSince(application.appliedDate) : 0
  const needsFollowUp = daysSince >= 7 && application.status === 'sent'

  return (
    <Card
      draggable
      onDragStart={onDragStart}
      className={cn(
        'p-4 cursor-move hover: transition-all group',
        needsFollowUp && 'border-amber-300 bg-amber-50/50'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-800 truncate">
            {application.jobTitle}
          </h4>
          <div className="flex items-center gap-1.5 text-sm text-slate-700 mt-0.5">
            <Building2 size={14} />
            <span className="truncate">{application.company}</span>
          </div>
        </div>
        <button className="p-1 hover:bg-slate-100 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal size={16} className="text-slate-600" />
        </button>
      </div>

      {/* Notiser och påminnelser */}
      {(application.hasNotification || needsFollowUp) && (
        <div className="flex items-center gap-2 mt-3">
          {application.hasNotification && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
              <Bell size={10} />
              Nytt
            </span>
          )}
          {needsFollowUp && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
              <Clock size={10} />
              Följ upp
            </span>
          )}
        </div>
      )}

      {/* Datum och info */}
      <div className="flex items-center gap-3 mt-3 text-xs text-slate-600">
        {application.appliedDate && (
          <span className="flex items-center gap-1">
            <Send size={12} />
            {formatDate(application.appliedDate)}
          </span>
        )}
        {!application.appliedDate && (
          <span className="flex items-center gap-1">
            <Clock size={12} />
            Sparad
          </span>
        )}
        {application.notes && (
          <span className="flex items-center gap-1">
            <FileText size={12} />
            Anteckning
          </span>
        )}
      </div>

      {/* Notis-text */}
      {application.notes && (
        <p className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded line-clamp-2">
          {application.notes}
        </p>
      )}

      {/* Drag-hint */}
      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs text-slate-600 flex items-center gap-1">
          Dra till annan kolumn för att ändra status
        </span>
      </div>
    </Card>
  )
}
