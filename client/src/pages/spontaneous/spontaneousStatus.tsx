/* eslint-disable react-refresh/only-export-components -- legitim samexistens av komponent + konstant/helper-export */
/**
 * Delad statuskonfiguration för Spontanansökan.
 * En källa för ikoner, färger och i18n-nycklar — används av CompanyCard,
 * MyCompaniesTab (filter/CSV), StatsTab och batchåtgärder.
 */
import { useTranslation } from 'react-i18next'
import {
  Building2,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Archive,
} from 'lucide-react'
import type { SpontaneousStatus } from '@/services/supabaseApi'

export const SPONTANEOUS_STATUSES: SpontaneousStatus[] = [
  'saved',
  'to_contact',
  'contacted',
  'waiting',
  'response_positive',
  'response_negative',
  'no_response',
  'archived',
]

export const statusConfig: Record<SpontaneousStatus, {
  labelKey: string
  icon: typeof Building2
  color: string
  bgColor: string
}> = {
  saved: {
    labelKey: 'spontaneous.status.saved',
    icon: Building2,
    color: 'text-stone-600',
    bgColor: 'bg-stone-100 dark:bg-stone-800',
  },
  to_contact: {
    labelKey: 'spontaneous.status.to_contact',
    icon: Send,
    color: 'text-[var(--c-text)]',
    bgColor: 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40',
  },
  contacted: {
    labelKey: 'spontaneous.status.contacted',
    icon: Send,
    color: 'text-stone-700 dark:text-stone-300',
    bgColor: 'bg-stone-100 dark:bg-stone-700/50',
  },
  waiting: {
    labelKey: 'spontaneous.status.waiting',
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  response_positive: {
    labelKey: 'spontaneous.status.response_positive',
    icon: CheckCircle,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
  },
  response_negative: {
    labelKey: 'spontaneous.status.response_negative',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  no_response: {
    labelKey: 'spontaneous.status.no_response',
    icon: AlertCircle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  archived: {
    labelKey: 'spontaneous.status.archived',
    icon: Archive,
    color: 'text-stone-600',
    bgColor: 'bg-stone-100 dark:bg-stone-800',
  },
}

export function StatusBadge({ status }: { status: SpontaneousStatus }) {
  const { t } = useTranslation()
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      {t(config.labelKey)}
    </span>
  )
}
