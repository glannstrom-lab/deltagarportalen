/**
 * StatusChip — färg + ikon + ord, aldrig bara färg (omtaget "Kvarter", 2026-10-11).
 *
 *   <StatusChip status="ogiltig" />                 → "Ogiltig frånvaro"
 *   <StatusChip status="vantar">Väntar på kvittens</StatusChip>
 *
 * Utan barn står statusens eget ord. Ett tomt barn ("" eller bara blanksteg)
 * räknas som inget barn — chippet kan aldrig bli en färgklick utan text.
 */
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { KvarterIkon } from './icons/kvarter/KvarterIkon'
import { STATUS_IKON, STATUS_NYCKEL, STATUS_ORD_SV, statusFarg, type Status } from './kvarterStatus'

export interface StatusChipProps {
  status: Status
  /** Egen text. Utelämnad eller tom → statusens ord. */
  children?: ReactNode
  className?: string
}

function arTom(barn: ReactNode): boolean {
  if (barn === null || barn === undefined || barn === false) return true
  if (typeof barn === 'string') return barn.trim() === ''
  return false
}

export function StatusChip({ status, children, className }: StatusChipProps) {
  const { t } = useTranslation()
  const farg = statusFarg(status)
  const ord = t(STATUS_NYCKEL[status], STATUS_ORD_SV[status])
  return (
    <span
      data-status={status}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full py-[3px] pl-2 pr-2.5',
        'text-[0.8125rem] leading-5 font-semibold whitespace-nowrap',
        className,
      )}
      style={{ backgroundColor: farg.bg, color: farg.text }}
    >
      <KvarterIkon namn={STATUS_IKON[status]} size={15} ton={status} />
      <span>{arTom(children) ? ord : children}</span>
    </span>
  )
}

export default StatusChip
