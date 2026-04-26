/**
 * ApplicationsTimeline Component
 * Shows history of all application activities
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Clock, Send, Phone, Users, Trophy, XCircle, CheckCircle,
  MessageSquare, Bell, User, FileText, Archive, Sparkles, Eye
} from '@/components/ui/icons'
import { Card } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useApplications } from '@/hooks/useApplications'
import { applicationHistoryApi } from '@/services/applicationsApi'
import { useQuery } from '@tanstack/react-query'
import {
  APPLICATION_STATUS_CONFIG,
  getStatusLabel,
  type ApplicationHistoryEntry,
  type HistoryEventType
} from '@/types/application.types'

const EVENT_CONFIG: Record<HistoryEventType, {
  icon: React.ElementType
  color: string
  bgColor: string
  label: string
}> = {
  created: { icon: Sparkles, color: 'text-brand-900', bgColor: 'bg-brand-100', label: 'Skapad' },
  status_change: { icon: Send, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Status ändrad' },
  note_added: { icon: MessageSquare, color: 'text-brand-900', bgColor: 'bg-brand-100', label: 'Anteckning tillagd' },
  note_updated: { icon: MessageSquare, color: 'text-brand-900', bgColor: 'bg-brand-100', label: 'Anteckning uppdaterad' },
  document_attached: { icon: FileText, color: 'text-sky-600', bgColor: 'bg-sky-100', label: 'Dokument bifogat' },
  reminder_set: { icon: Bell, color: 'text-amber-600', bgColor: 'bg-amber-100', label: 'Påminnelse satt' },
  reminder_completed: { icon: CheckCircle, color: 'text-brand-900', bgColor: 'bg-brand-100', label: 'Påminnelse klar' },
  contact_added: { icon: User, color: 'text-cyan-600', bgColor: 'bg-cyan-100', label: 'Kontakt tillagd' },
  contact_updated: { icon: User, color: 'text-cyan-600', bgColor: 'bg-cyan-100', label: 'Kontakt uppdaterad' },
  interview_scheduled: { icon: Users, color: 'text-brand-900', bgColor: 'bg-brand-100', label: 'Intervju bokad' },
  offer_received: { icon: Trophy, color: 'text-amber-600', bgColor: 'bg-amber-100', label: 'Erbjudande mottaget' },
  archived: { icon: Archive, color: 'text-slate-600', bgColor: 'bg-slate-100', label: 'Arkiverad' }
}

function TimelineEntry({ entry, applicationName }: { entry: ApplicationHistoryEntry; applicationName?: string }) {
  const config = EVENT_CONFIG[entry.eventType]
  const Icon = config.icon

  const formatStatusChange = () => {
    if (entry.eventType !== 'status_change') return null
    const oldLabel = entry.oldValue ? getStatusLabel(entry.oldValue.toLowerCase() as any) : null
    const newLabel = entry.newValue ? getStatusLabel(entry.newValue.toLowerCase() as any) : null
    return (
      <span>
        {oldLabel && <span className="text-slate-700">{oldLabel}</span>}
        {oldLabel && newLabel && <span className="text-slate-600"> → </span>}
        {newLabel && <span className="font-medium">{newLabel}</span>}
      </span>
    )
  }

  return (
    <div className="flex gap-3 group">
      {/* Timeline line and dot */}
      <div className="flex flex-col items-center">
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", config.bgColor)}>
          <Icon className={cn("w-4 h-4", config.color)} />
        </div>
        <div className="w-0.5 flex-1 bg-slate-200 group-last:hidden" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-center justify-between">
          <p className="font-medium text-slate-900 text-sm">
            {config.label}
          </p>
          <span className="text-xs text-slate-600">
            {new Date(entry.createdAt).toLocaleDateString('sv-SE', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>

        {applicationName && (
          <p className="text-xs text-slate-700 mt-0.5">{applicationName}</p>
        )}

        {entry.eventType === 'status_change' && (
          <p className="text-sm text-slate-600 mt-1">{formatStatusChange()}</p>
        )}

        {entry.note && (
          <p className="text-sm text-slate-600 mt-1 italic">"{entry.note}"</p>
        )}
      </div>
    </div>
  )
}

export function ApplicationsTimeline() {
  const { t } = useTranslation()
  const { applications } = useApplications()

  const { data: recentHistory = [], isLoading } = useQuery({
    queryKey: ['application-history-recent'],
    queryFn: () => applicationHistoryApi.getRecent(50),
    staleTime: 60 * 1000
  })

  // Group history by date
  const groupedHistory = useMemo(() => {
    const groups: Record<string, ApplicationHistoryEntry[]> = {}

    recentHistory.forEach(entry => {
      const date = new Date(entry.createdAt).toLocaleDateString('sv-SE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      if (!groups[date]) groups[date] = []
      groups[date].push(entry)
    })

    return groups
  }, [recentHistory])

  // Get application name by ID
  const getApplicationName = (appId: string) => {
    const app = applications.find(a => a.id === appId)
    if (!app) return undefined
    return app.jobTitle || (app.jobData as any)?.headline || 'Okänd tjänst'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Object.keys(groupedHistory).length === 0 ? (
        <Card className="p-8 text-center">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-700 mb-2">Ingen aktivitet än</h3>
          <p className="text-slate-700">
            Din aktivitetshistorik visas här när du börjar spåra ansökningar.
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedHistory).map(([date, entries]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-slate-700 mb-4 capitalize">{date}</h3>
              <Card className="p-4">
                {entries.map((entry) => (
                  <TimelineEntry
                    key={entry.id}
                    entry={entry}
                    applicationName={getApplicationName(entry.applicationId)}
                  />
                ))}
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ApplicationsTimeline
