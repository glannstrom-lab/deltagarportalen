/* eslint-disable react-refresh/only-export-components -- legitim samexistens av komponent + konstant/helper-export */
/**
 * Delad statuskonfiguration för Spontanansökan.
 * En källa för ikoner, färger och i18n-nycklar — används av CompanyCard,
 * MyCompaniesTab (filter/CSV), StatsTab och batchåtgärder.
 *
 * FÄRGREGELN (DESIGN.md §4): sidan är hubben "Söka jobb" (activity/persika).
 * Statusar som inte bär semantik ligger därför på hubbfärgen eller på neutral
 * stone — variationen kommer från intensitet och ikon, inte från främmande
 * hubbars pasteller. Semantisk färg behålls bara där den betyder något:
 * emerald = positivt svar, röd = avslag. Amber är enligt §4 en tillåten
 * statusfärg för "väntar / behöver uppmärksamhet".
 *
 * KONTRASTEN ÄR MÄTT, inte gissad (WCAG 2.1 AA, 4,5:1 för text under 18 px).
 * Uppmätt mot kortbakgrunden — vit i ljust läge, stone-800 (#292524) i mörkt.
 * Ljust / mörkt läge:
 *   saved              9,43 / 11,13
 *   to_contact         5,58 / 11,73
 *   contacted          4,89 /  8,67
 *   waiting            6,84 / 10,25
 *   response_positive  7,29 / 10,27
 *   response_negative  7,60 /  9,37
 *   no_response        7,00 / 10,41
 *   archived           8,19 / 10,18
 * Före den här rättningen saknade 7 av 8 statusar `dark:`-textfärg helt:
 * saved/archived låg på 1,99:1, response_positive 2,50:1, response_negative
 * 2,89:1 och no_response 3,83:1 i mörkt läge. `saved` är defaultstatus och
 * temat defaultar till `system`, så en deltagare med mörkt OS fick det utan
 * att ha valt något.
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
    color: 'text-stone-700 dark:text-stone-100',
    bgColor: 'bg-stone-100 dark:bg-stone-700/60',
  },
  to_contact: {
    labelKey: 'spontaneous.status.to_contact',
    icon: Send,
    color: 'text-[var(--c-text)] dark:text-[var(--c-text)]',
    bgColor: 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/60',
  },
  contacted: {
    labelKey: 'spontaneous.status.contacted',
    icon: Send,
    color: 'text-[var(--c-text)] dark:text-[var(--c-text)]',
    bgColor: 'bg-[var(--c-accent)]/70 dark:bg-[var(--c-accent)]/50',
  },
  waiting: {
    labelKey: 'spontaneous.status.waiting',
    icon: Clock,
    color: 'text-amber-800 dark:text-amber-200',
    bgColor: 'bg-amber-50 dark:bg-amber-900/40',
  },
  response_positive: {
    labelKey: 'spontaneous.status.response_positive',
    icon: CheckCircle,
    color: 'text-emerald-800 dark:text-emerald-200',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/40',
  },
  response_negative: {
    labelKey: 'spontaneous.status.response_negative',
    icon: XCircle,
    color: 'text-red-800 dark:text-red-200',
    bgColor: 'bg-red-50 dark:bg-red-900/40',
  },
  no_response: {
    labelKey: 'spontaneous.status.no_response',
    icon: AlertCircle,
    // Neutral, inte orange: "inget svar" är varken ett larm eller något
    // deltagaren gjort fel. Prestationsfärgning hör inte hemma här.
    color: 'text-stone-600 dark:text-stone-200',
    bgColor: 'bg-stone-100 dark:bg-stone-700/40',
  },
  archived: {
    labelKey: 'spontaneous.status.archived',
    icon: Archive,
    color: 'text-stone-700 dark:text-stone-300',
    bgColor: 'bg-stone-200 dark:bg-stone-800',
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
