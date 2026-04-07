/**
 * ApplicationCard Component
 * Displays a single job application in the pipeline/list
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Building2, MapPin, ExternalLink, MoreVertical,
  Clock, Calendar, AlertCircle, ChevronRight,
  Trash2, Archive, Edit2, Bell, User, FileText
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  APPLICATION_STATUS_CONFIG,
  getStatusLabel,
  getNextStatuses,
  type Application,
  type ApplicationStatus
} from '@/types/application.types'

interface ApplicationCardProps {
  application: Application
  variant?: 'compact' | 'default' | 'expanded'
  onStatusChange?: (id: string, status: ApplicationStatus) => void
  onEdit?: (application: Application) => void
  onArchive?: (id: string) => void
  onDelete?: (id: string) => void
  onViewDetails?: (application: Application) => void
  isDragging?: boolean
  showActions?: boolean
}

export function ApplicationCard({
  application,
  variant = 'default',
  onStatusChange,
  onEdit,
  onArchive,
  onDelete,
  onViewDetails,
  isDragging = false,
  showActions = true
}: ApplicationCardProps) {
  const { t, i18n } = useTranslation()
  const [showMenu, setShowMenu] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  const statusConfig = APPLICATION_STATUS_CONFIG[application.status]
  const companyName = application.companyName || (application.jobData as any)?.employer?.name || 'Okänt företag'
  const jobTitle = application.jobTitle || (application.jobData as any)?.headline || 'Okänd tjänst'
  const location = application.location || (application.jobData as any)?.workplace_address?.municipality

  // Calculate days since last update
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(application.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  )
  const isStale = daysSinceUpdate >= 7 && !['accepted', 'rejected', 'withdrawn'].includes(application.status)

  const priorityColors = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-slate-100 text-slate-600 border-slate-200'
  }

  const handleStatusChange = (newStatus: ApplicationStatus) => {
    onStatusChange?.(application.id, newStatus)
    setShowStatusMenu(false)
  }

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          "bg-white rounded-lg border p-3 cursor-pointer hover:shadow-md transition-all",
          isDragging && "shadow-lg ring-2 ring-violet-400 rotate-2",
          isStale && "border-amber-300"
        )}
        onClick={() => onViewDetails?.(application)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-slate-900 text-sm line-clamp-1">{jobTitle}</h4>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Building2 className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{companyName}</span>
            </p>
          </div>
          {application.priority === 'high' && (
            <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-slate-400">
            {daysSinceUpdate === 0 ? 'Idag' : `${daysSinceUpdate}d sedan`}
          </span>
          {isStale && (
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          )}
        </div>
      </div>
    )
  }

  return (
    <Card
      className={cn(
        "p-4 hover:shadow-md transition-all cursor-pointer group",
        isDragging && "shadow-lg ring-2 ring-violet-400",
        isStale && "border-amber-200 bg-amber-50/30"
      )}
      onClick={() => onViewDetails?.(application)}
    >
      <div className="flex items-start gap-3">
        {/* Company icon/logo placeholder */}
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
          statusConfig.bgColor
        )}>
          <Building2 className={cn("w-5 h-5", statusConfig.color)} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-900 line-clamp-1">{jobTitle}</h3>
              <p className="text-sm text-slate-600">{companyName}</p>
            </div>

            {showActions && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Quick status change */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowStatusMenu(!showStatusMenu)
                    }}
                    className={cn(
                      "px-2 py-1 rounded text-xs font-medium border transition-colors",
                      statusConfig.bgColor, statusConfig.color, statusConfig.borderColor,
                      "hover:opacity-80"
                    )}
                  >
                    {getStatusLabel(application.status)}
                    <ChevronRight className="w-3 h-3 ml-1 inline" />
                  </button>

                  {showStatusMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowStatusMenu(false)
                        }}
                      />
                      <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 min-w-[140px]">
                        {getNextStatuses(application.status).map((status) => {
                          const config = APPLICATION_STATUS_CONFIG[status]
                          return (
                            <button
                              key={status}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStatusChange(status)
                              }}
                              className={cn(
                                "w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 flex items-center gap-2",
                                config.color
                              )}
                            >
                              <span className={cn("w-2 h-2 rounded-full", config.bgColor)} />
                              {getStatusLabel(status)}
                            </button>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* More actions menu */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(!showMenu)
                    }}
                    className="p-1.5 hover:bg-slate-100 rounded"
                  >
                    <MoreVertical className="w-4 h-4 text-slate-400" />
                  </button>

                  {showMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowMenu(false)
                        }}
                      />
                      <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 min-w-[150px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onEdit?.(application)
                            setShowMenu(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          Redigera
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onArchive?.(application.id)
                            setShowMenu(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Archive className="w-4 h-4" />
                          Arkivera
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('Ta bort denna ansökan?')) {
                              onDelete?.(application.id)
                            }
                            setShowMenu(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Ta bort
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500">
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {daysSinceUpdate === 0 ? 'Uppdaterad idag' : `${daysSinceUpdate} dagar sedan`}
            </span>
            {application.applicationDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Ansökt {new Date(application.applicationDate).toLocaleDateString('sv-SE')}
              </span>
            )}
          </div>

          {/* Tags/badges */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {/* Priority */}
            {application.priority !== 'medium' && (
              <span className={cn(
                "px-2 py-0.5 rounded text-xs font-medium border",
                priorityColors[application.priority]
              )}>
                {application.priority === 'high' ? 'Hög prioritet' : 'Låg prioritet'}
              </span>
            )}

            {/* Stale warning */}
            {isStale && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Behöver uppföljning
              </span>
            )}

            {/* Has CV */}
            {application.cvVersionId && (
              <span className="px-2 py-0.5 rounded text-xs bg-violet-100 text-violet-700 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                CV
              </span>
            )}

            {/* Has cover letter */}
            {application.coverLetterId && (
              <span className="px-2 py-0.5 rounded text-xs bg-teal-100 text-teal-700 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Brev
              </span>
            )}
          </div>

          {/* Notes preview */}
          {application.notes && variant === 'expanded' && (
            <p className="text-sm text-slate-500 mt-2 line-clamp-2 italic">
              "{application.notes}"
            </p>
          )}
        </div>
      </div>

      {/* Footer with link */}
      {application.jobUrl && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
          <a
            href={application.jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <ExternalLink className="w-3 h-3" />
            Visa annons
          </a>
        </div>
      )}
    </Card>
  )
}

export default ApplicationCard
