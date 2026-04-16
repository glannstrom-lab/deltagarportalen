/**
 * ApplicationsTab - Kanban view for job applications
 * Shows jobs with status: APPLIED, INTERVIEW, OFFER, REJECTED
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Send, Calendar, CheckCircle, XCircle, MoreVertical,
  MessageSquare, Clock, ExternalLink, ChevronDown, Briefcase,
  TrendingUp, AlertCircle, Trash2, Edit2
} from '@/components/ui/icons'
import { Link } from 'react-router-dom'
import { useSavedJobs, type SavedJob } from '@/hooks/useSavedJobs'
import { cn } from '@/lib/utils'
import { Card, Button } from '@/components/ui'

interface StatusColumn {
  status: 'applied' | 'interview' | 'offer' | 'rejected'
  title: string
  color: string
  bgColor: string
  icon: React.ElementType
}

const COLUMNS: StatusColumn[] = [
  { status: 'applied', title: 'Ansökt', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200', icon: Send },
  { status: 'interview', title: 'Intervju', color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200', icon: Calendar },
  { status: 'offer', title: 'Erbjudande', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200', icon: CheckCircle },
  { status: 'rejected', title: 'Avslag', color: 'text-slate-700', bgColor: 'bg-slate-50 border-slate-200', icon: XCircle }
]

function ApplicationCard({
  job,
  onStatusChange,
  onDelete
}: {
  job: SavedJob
  onStatusChange: (jobId: string, status: SavedJob['status']) => void
  onDelete: (jobId: string) => void
}) {
  const [showMenu, setShowMenu] = useState(false)
  const [showNotes, setShowNotes] = useState(false)

  const jobData = job.jobData
  const hasNotes = job.notes && job.notes.trim().length > 0

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-slate-200 dark:border-stone-700 p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 dark:text-stone-100 text-sm line-clamp-2">
            {jobData?.headline || 'Okänd tjänst'}
          </h4>
          <p className="text-xs text-slate-700 dark:text-stone-300 mt-0.5 flex items-center gap-1">
            <Briefcase className="w-3 h-3" />
            {jobData?.employer?.name || 'Okänt företag'}
          </p>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-slate-600 dark:text-stone-400" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-8 z-20 bg-white dark:bg-stone-900 rounded-lg shadow-lg border border-slate-200 dark:border-stone-700 py-1 min-w-[160px]">
                <div className="px-2 py-1 text-xs font-medium text-slate-600 dark:text-stone-400 uppercase">Ändra status</div>
                {COLUMNS.map(col => (
                  <button
                    key={col.status}
                    onClick={() => {
                      onStatusChange(job.id, col.status)
                      setShowMenu(false)
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-stone-800",
                      job.status === col.status && "bg-slate-50 dark:bg-stone-800 font-medium"
                    )}
                  >
                    <col.icon className={cn("w-4 h-4", col.color)} />
                    {col.title}
                  </button>
                ))}
                <div className="border-t border-slate-100 dark:border-stone-700 my-1" />
                <button
                  onClick={() => {
                    onDelete(job.id)
                    setShowMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                  Ta bort
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Location */}
      {jobData?.workplace_address?.municipality && (
        <p className="text-xs text-slate-600 dark:text-stone-400 mb-3">
          📍 {jobData.workplace_address.municipality}
        </p>
      )}

      {/* Notes */}
      {hasNotes && (
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="w-full text-left mb-2"
        >
          <div className={cn(
            "flex items-start gap-2 p-2 rounded-lg bg-slate-50 dark:bg-stone-800 text-xs",
            showNotes ? "" : "line-clamp-2"
          )}>
            <MessageSquare className="w-3 h-3 text-slate-600 dark:text-stone-400 flex-shrink-0 mt-0.5" />
            <span className="text-slate-600 dark:text-stone-400">{job.notes}</span>
          </div>
        </button>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-stone-400 pt-2 border-t border-slate-100 dark:border-stone-700">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(job.savedAt).toLocaleDateString('sv-SE')}
        </span>

        {jobData?.webpage_url && (
          <a
            href={jobData.webpage_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
          >
            <ExternalLink className="w-3 h-3" />
            Visa
          </a>
        )}
      </div>
    </div>
  )
}

function StatsHeader({ jobs }: { jobs: SavedJob[] }) {
  const stats = useMemo(() => ({
    total: jobs.length,
    applied: jobs.filter(j => j.status === 'applied').length,
    interview: jobs.filter(j => j.status === 'interview').length,
    offer: jobs.filter(j => j.status === 'offer').length,
    rejected: jobs.filter(j => j.status === 'rejected').length
  }), [jobs])

  const responseRate = stats.total > 0
    ? Math.round(((stats.interview + stats.offer) / stats.total) * 100)
    : 0

  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-6">
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-slate-200 dark:border-stone-700 p-2 sm:p-4 text-center">
        <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-stone-100">{stats.total}</div>
        <div className="text-[10px] sm:text-xs text-slate-700 dark:text-stone-300">Totalt</div>
      </div>
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-2 sm:p-4 text-center">
        <div className="text-lg sm:text-2xl font-bold text-blue-600">{stats.applied}</div>
        <div className="text-[10px] sm:text-xs text-blue-600">Ansökt</div>
      </div>
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-2 sm:p-4 text-center">
        <div className="text-lg sm:text-2xl font-bold text-amber-600">{stats.interview}</div>
        <div className="text-[10px] sm:text-xs text-amber-600">Intervju</div>
      </div>
      <div className="bg-green-50 rounded-xl border border-green-200 p-2 sm:p-4 text-center hidden sm:block">
        <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.offer}</div>
        <div className="text-[10px] sm:text-xs text-green-600">Erbjudande</div>
      </div>
      <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-2 sm:p-4 text-center hidden sm:block">
        <div className="text-lg sm:text-2xl font-bold text-indigo-600">{responseRate}%</div>
        <div className="text-[10px] sm:text-xs text-indigo-600 flex items-center justify-center gap-1">
          <TrendingUp className="w-3 h-3" />
          Svar
        </div>
      </div>
    </div>
  )
}

export function ApplicationsTab() {
  const { t } = useTranslation()
  const { savedJobs, updateJobStatus, removeJob, isLoaded } = useSavedJobs()

  // Filter to only show applications (not saved)
  const applications = useMemo(() =>
    savedJobs.filter(j => j.status !== 'saved'),
    [savedJobs]
  )

  const handleStatusChange = async (jobId: string, newStatus: SavedJob['status']) => {
    await updateJobStatus(jobId, newStatus)
  }

  const handleDelete = async (jobId: string) => {
    if (confirm('Är du säker på att du vill ta bort denna ansökan?')) {
      await removeJob(jobId)
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (applications.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="w-16 h-16 bg-slate-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Send className="w-8 h-8 text-slate-600 dark:text-stone-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-700 dark:text-stone-300 mb-2">
          Inga ansökningar än
        </h3>
        <p className="text-slate-700 dark:text-stone-300 mb-6 max-w-md mx-auto">
          När du sparar ett jobb och ändrar status till "Ansökt" kommer det visas här.
          Spåra dina ansökningar och håll koll på din jobbsökning.
        </p>
        <Link to="/job-search">
          <Button>
            <Briefcase className="w-4 h-4 mr-2" />
            Sök jobb
          </Button>
        </Link>
      </Card>
    )
  }

  return (
    <div>
      {/* Stats */}
      <StatsHeader jobs={applications} />

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map(column => {
          const columnJobs = applications.filter(j => j.status === column.status)

          return (
            <div key={column.status} className={cn("rounded-2xl border p-4", column.bgColor)}>
              {/* Column Header */}
              <div className="flex items-center gap-2 mb-4">
                <column.icon className={cn("w-5 h-5", column.color)} />
                <h3 className={cn("font-semibold", column.color)}>{column.title}</h3>
                <span className={cn(
                  "ml-auto px-2 py-0.5 rounded-full text-xs font-medium",
                  column.color,
                  column.status === 'applied' && 'bg-blue-100',
                  column.status === 'interview' && 'bg-amber-100',
                  column.status === 'offer' && 'bg-green-100',
                  column.status === 'rejected' && 'bg-slate-200'
                )}>
                  {columnJobs.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-3">
                {columnJobs.length === 0 ? (
                  <div className="text-center py-8 text-sm text-slate-600 dark:text-stone-400">
                    Inga jobb här
                  </div>
                ) : (
                  columnJobs.map(job => (
                    <ApplicationCard
                      key={job.id}
                      job={job}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ApplicationsTab
