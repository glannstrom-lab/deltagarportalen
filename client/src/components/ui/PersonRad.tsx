/**
 * PersonRad — en rad per människa (omtaget "Kvarter", 2026-10-11).
 *
 * Förslagets princip "Personen är enheten": tre saker om Jonas blir EN rad om
 * Jonas, med det mest brådskande först och "+2" efter. Ord före siffror —
 * `lage` är en mening ("Var inte på gruppträffen i fredags"), inte ett tal.
 * Inga kort i kort: raden är platt, med en linje under. Lägg flera rader i
 * en <ul> (raden är ett <li> som standard).
 *
 *   <ul>
 *     <PersonRad
 *       namn="Leila Haddad"
 *       lage="Ogiltig frånvaro i fredags"
 *       detalj="Saknar en rad om vad som hände"
 *       status="ogiltig"
 *       handling={{ etikett: 'Skriv raden', onClick: skriv }}
 *     />
 *   </ul>
 *
 * Profilbild: bara deltagarens egen (`bildUrl`), annars initialer — aldrig
 * en genererad bild.
 */
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import { StatusChip } from './StatusChip'
import { KVARTER_FOKUS, initialerAv, type Status } from './kvarterStatus'

export interface PersonRadHandling {
  etikett: string
  onClick: () => void
  /** Sekundär (ramad) som standard; tertiär (text) för "Öppna". */
  variant?: 'secondary' | 'tertiary'
}

export interface PersonRadProps {
  namn: string
  /** "Läget" som en mening. */
  lage: string
  /** Mindre text under läget, t.ex. "Plan 10 h/vecka" eller vad som saknas. */
  detalj?: string
  status?: Status
  /** Egen text i statuschippet. Utelämnad → statusens ord. */
  statusText?: string
  /** Antal ytterligare saker om personen ("+2 till"). */
  fler?: number
  /** Deltagarens EGEN profilbild. Annars initialer. */
  bildUrl?: string | null
  initialer?: string
  /** Gör namnet till en knapp som öppnar personen. */
  onOppna?: () => void
  /** Radens enda handling. */
  handling?: PersonRadHandling
  /** Plats mellan läget och handlingen, t.ex. en Veckoremsa. */
  mitten?: ReactNode
  som?: 'li' | 'div'
  className?: string
}

export function PersonRad({
  namn,
  lage,
  detalj,
  status,
  statusText,
  fler,
  bildUrl,
  initialer,
  onOppna,
  handling,
  mitten,
  som = 'li',
  className,
}: PersonRadProps) {
  const { t } = useTranslation()
  const Element = som
  return (
    <Element
      className={cn(
        'grid grid-cols-[auto_minmax(0,1fr)] sm:grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-2',
        'px-4 sm:px-[18px] py-3.5 border-b border-[var(--j-linje)] last:border-b-0',
        'text-[var(--j-blak)]',
        className,
      )}
    >
      {bildUrl ? (
        <img src={bildUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-none" />
      ) : (
        <span
          aria-hidden="true"
          className="w-10 h-10 rounded-full flex-none grid place-items-center text-[0.8125rem] font-bold bg-[var(--j-gran-mjuk)] text-[var(--j-gran-text)]"
        >
          {initialer ?? initialerAv(namn)}
        </span>
      )}

      <div className="grid gap-0.5 min-w-0">
        {onOppna ? (
          <button
            type="button"
            onClick={onOppna}
            className={cn(
              'justify-self-start text-left text-base leading-6 font-semibold text-[var(--j-blak)]',
              'underline-offset-2 hover:underline rounded-[var(--j-r-s)] min-h-[44px] sm:min-h-0',
              KVARTER_FOKUS,
            )}
          >
            {namn}
          </button>
        ) : (
          <span className="text-base leading-6 font-semibold">{namn}</span>
        )}
        <span className="text-[0.9375rem] leading-[1.4] text-[var(--j-blak-2)]">
          {lage}
          {fler && fler > 0 ? (
            <span className="text-[var(--j-blak-3)]">
              {' · '}
              {t('kvarter.fler', '+{{count}} till', { count: fler })}
            </span>
          ) : null}
        </span>
        {detalj ? <span className="text-[0.8125rem] leading-5 text-[var(--j-blak-3)]">{detalj}</span> : null}
        {status ? (
          <span className="mt-1">
            <StatusChip status={status}>{statusText}</StatusChip>
          </span>
        ) : null}
      </div>

      {mitten || handling ? (
        <div className="col-span-2 sm:col-span-1 flex flex-wrap items-center gap-3 sm:justify-end">
          {mitten}
          {handling ? (
            <Button
              ton="kvarter"
              size="sm"
              variant={handling.variant ?? 'secondary'}
              onClick={handling.onClick}
              aria-label={`${handling.etikett}: ${namn}`}
            >
              {handling.etikett}
            </Button>
          ) : null}
        </div>
      ) : null}
    </Element>
  )
}

export default PersonRad
