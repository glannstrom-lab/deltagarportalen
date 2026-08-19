/**
 * ApplicationCard Component
 * Displays a single job application in the pipeline/list
 *
 * 2026-08-19 (WCAG 2.1.1, nivå A): kortet var en `div`/`Card` med `onClick`
 * — inte fokuserbart, inte åtkomligt med tangentbord, och osynligt för
 * skärmläsare som något klickbart. Nu är det ett riktigt knappobjekt
 * (`role="button"` + `tabIndex` + Enter/Space).
 *
 * Samtidigt: compact-varianten returnerade FÖRE `showActions`, så de fyra
 * hanterare pipelinen skickade in (statusbyte, redigera, arkivera, ta bort)
 * var döda props på varje kort i kanbanen. Åtgärderna delas nu av båda
 * varianterna — och statusmenyn ("Flytta till …") är det tangentbords- och
 * touchvänliga alternativet till drag & drop, som varken fungerar med
 * tangentbord eller på pekskärm.
 */

import { useTranslation } from 'react-i18next'
import type { KeyboardEvent } from 'react'
import {
  Building2, MapPin, ExternalLink, MoreVertical,
  Clock, Calendar, AlertCircle, ChevronRight,
  Trash2, Archive, Edit2, FileText
} from '@/components/ui/icons'
import { Card, useConfirmDialog } from '@/components/ui'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem
} from '@/components/ui/DropdownMenu'
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
  const { t } = useTranslation()
  const { confirm } = useConfirmDialog()

  const statusConfig = APPLICATION_STATUS_CONFIG[application.status]
  const jobData = application.jobData as { employer?: { name?: string }; headline?: string; workplace_address?: { municipality?: string } } | undefined
  const companyName = application.companyName || jobData?.employer?.name || t('applications.common.unknownCompany', 'Okänt företag')
  const jobTitle = application.jobTitle || jobData?.headline || t('applications.common.unknownTitle', 'Okänd tjänst')
  const location = application.location || jobData?.workplace_address?.municipality

  // Calculate days since last update
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(application.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  )
  const isStale = daysSinceUpdate >= 7 && !['accepted', 'rejected', 'withdrawn'].includes(application.status)

  const priorityColors = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-stone-100 text-stone-600 border-stone-200'
  }

  const handleDelete = async () => {
    const ok = await confirm({
      title: t('applications.common.delete', 'Ta bort'),
      message: t('applications.card.deleteConfirm', 'Ta bort denna ansökan?'),
      confirmText: t('applications.common.delete', 'Ta bort'),
      cancelText: t('applications.common.cancel', 'Avbryt'),
      variant: 'danger',
    })
    if (ok) onDelete?.(application.id)
  }

  // ── Kortet som interaktivt element (WCAG 2.1.1) ───────────────────────
  const kanOppnas = Boolean(onViewDetails)
  const oppnaKort = () => onViewDetails?.(application)

  const interaktivaProps = kanOppnas
    ? {
        role: 'button' as const,
        tabIndex: 0,
        'aria-label': t('applications.card.openAria', 'Öppna ansökan: {{title}} hos {{company}}', {
          title: jobTitle,
          company: companyName
        }),
        onClick: oppnaKort,
        onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            oppnaKort()
          }
        }
      }
    : {}

  const fokusRing = kanOppnas
    ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)] focus-visible:ring-offset-2'
    : ''

  // ── Åtgärderna: statusmeny + fler åtgärder ────────────────────────────
  // Delas av båda varianterna. Statusmenyn är det enda sättet att flytta en
  // ansökan mellan steg som fungerar med tangentbord och på touch — drag &
  // drop (HTML5) gör varken det ena eller det andra.
  const harAtgarder = showActions && Boolean(onStatusChange || onEdit || onArchive || onDelete)
  const kompakt = variant === 'compact'

  const atgarder = harAtgarder ? (
    /* Synlig på touch (ingen hover) och vid tangentbordsfokus; hover-gated
       endast på desktop i default-varianten. stopPropagation hindrar kortets
       onClick/onKeyDown från att också utlösas. */
    <div
      className={cn(
        'flex items-center gap-1',
        !kompakt && 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity'
      )}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {onStatusChange && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-haspopup="menu"
              aria-label={t('applications.card.moveToAria', 'Flytta {{title}} till ett annat steg', { title: jobTitle })}
              className={cn(
                'px-2 py-1 rounded text-xs font-medium border transition-colors',
                statusConfig.bgColor, statusConfig.color, statusConfig.borderColor,
                'hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]'
              )}
            >
              {kompakt
                ? t('applications.card.move', 'Flytta')
                : t(`applications.status.${application.status}`, getStatusLabel(application.status))}
              <ChevronRight className="w-3 h-3 ml-1 inline" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[160px]">
            <p className="px-3 py-1.5 text-xs text-stone-600">
              {t('applications.card.moveToHeading', 'Flytta till')}
            </p>
            {getNextStatuses(application.status).map((status) => {
              const config = APPLICATION_STATUS_CONFIG[status]
              return (
                <DropdownMenuItem
                  key={status}
                  onClick={() => onStatusChange(application.id, status)}
                  className={config.color}
                >
                  <span className={cn('w-2 h-2 rounded-full', config.bgColor)} aria-hidden="true" />
                  {t(`applications.status.${status}`, getStatusLabel(status))}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {(onEdit || onArchive || onDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={t('applications.card.moreActionsFor', 'Fler åtgärder för {{title}}', { title: jobTitle })}
              aria-haspopup="menu"
              className="p-1.5 hover:bg-stone-100 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]"
            >
              <MoreVertical className="w-4 h-4 text-stone-600" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[150px]">
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(application)}>
                <Edit2 className="w-4 h-4" aria-hidden="true" />
                {t('applications.common.edit', 'Redigera')}
              </DropdownMenuItem>
            )}
            {onArchive && (
              <DropdownMenuItem onClick={() => onArchive(application.id)}>
                <Archive className="w-4 h-4" aria-hidden="true" />
                {t('applications.common.archive', 'Arkivera')}
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem onClick={handleDelete} className="text-red-600 hover:bg-red-50">
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                {t('applications.common.delete', 'Ta bort')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  ) : null

  if (kompakt) {
    return (
      <div
        className={cn(
          'bg-white rounded-lg border p-3 hover:shadow-md transition-all',
          fokusRing,
          isDragging && 'shadow-lg ring-2 ring-[var(--c-solid)] rotate-2',
          isStale && 'border-amber-300'
        )}
        {...interaktivaProps}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-stone-900 text-sm line-clamp-1">{jobTitle}</h4>
            <p className="text-xs text-stone-700 flex items-center gap-1 mt-0.5">
              <Building2 className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{companyName}</span>
            </p>
          </div>
          {application.priority === 'high' && (
            <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" aria-hidden="true" />
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-2">
          <span className="text-xs text-stone-600">
            {daysSinceUpdate === 0
              ? t('applications.common.today', 'Idag')
              : t('applications.card.daysShort', { count: daysSinceUpdate })}
          </span>
          <div className="flex items-center gap-1">
            {isStale && (
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
            )}
            {atgarder}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card
      className={cn(
        'p-4 hover:shadow-md transition-all group',
        fokusRing,
        isDragging && 'shadow-lg ring-2 ring-[var(--c-solid)]',
        isStale && 'border-amber-200 bg-amber-50/30'
      )}
      {...interaktivaProps}
    >
      <div className="flex items-start gap-3">
        {/* Company icon/logo placeholder */}
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
          statusConfig.bgColor
        )}>
          <Building2 className={cn("w-5 h-5", statusConfig.color)} aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-stone-900 line-clamp-1">{jobTitle}</h3>
              <p className="text-sm text-stone-600">{companyName}</p>
            </div>

            {atgarder}
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-stone-700">
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" aria-hidden="true" />
                {location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {daysSinceUpdate === 0
                ? t('applications.card.updatedToday', 'Uppdaterad idag')
                : t('applications.common.daysAgo', { count: daysSinceUpdate })}
            </span>
            {application.applicationDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" aria-hidden="true" />
                {t('applications.card.appliedOn', { date: new Date(application.applicationDate).toLocaleDateString('sv-SE') })}
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
                {application.priority === 'high'
                  ? t('applications.pipeline.priorityHigh', 'Hög prioritet')
                  : t('applications.pipeline.priorityLow', 'Låg prioritet')}
              </span>
            )}

            {/* Stale warning */}
            {isStale && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" aria-hidden="true" />
                {t('applications.card.needsFollowUp', 'Behöver uppföljning')}
              </span>
            )}

            {/* Has CV */}
            {application.cvVersionId && (
              <span className="px-2 py-0.5 rounded text-xs bg-[var(--c-accent)]/40 text-[var(--c-text)] flex items-center gap-1">
                <FileText className="w-3 h-3" aria-hidden="true" />
                {t('applications.card.cv', 'CV')}
              </span>
            )}

            {/* Has cover letter */}
            {application.coverLetterId && (
              <span className="px-2 py-0.5 rounded text-xs bg-[var(--c-accent)]/40 text-[var(--c-text)] flex items-center gap-1">
                <FileText className="w-3 h-3" aria-hidden="true" />
                {t('applications.card.letter', 'Brev')}
              </span>
            )}
          </div>

          {/* Notes preview */}
          {application.notes && variant === 'expanded' && (
            <p className="text-sm text-stone-700 mt-2 line-clamp-2 italic">
              "{application.notes}"
            </p>
          )}
        </div>
      </div>

      {/* Footer with link */}
      {application.jobUrl && (
        <div className="mt-3 pt-3 border-t border-stone-100 flex justify-end">
          <a
            href={application.jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium"
          >
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
            {t('applications.card.viewAd', 'Visa annons')}
          </a>
        </div>
      )}
    </Card>
  )
}

export default ApplicationCard
