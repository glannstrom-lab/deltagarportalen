/**
 * Veckoremsa — måndag till fredag med status per dag (omtaget "Kvarter", 2026-10-11).
 *
 * Två storlekar:
 *   kompakt — fem 20 px-rutor i deltagarlistan ("Veckan"-kolumnen)
 *   stor    — dagnamn, datum och statusord, för deltagarens Min vecka
 *
 * Varje dag har en skärmläsartext: "Måndag 6 oktober: Närvarande. Språkcafé".
 * Rutorna är aldrig bara färg — ikonen och (i stor) ordet bär statusen, och
 * en dag utan pass står som "Inget pass", inte som en tom färgruta.
 *
 * Datumen tolkas som LOKALA kalenderdagar (YYYY-MM-DD). `new Date('2026-10-06')`
 * är midnatt UTC och blir fel dygn i Sverige — se lärdomen "Idag i UTC".
 */
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { datumSprak } from '@/lib/datumsprak'
import { KvarterIkon } from './icons/kvarter/KvarterIkon'
import { STATUS_IKON, STATUS_NYCKEL, STATUS_ORD_SV, statusFarg, type Status } from './kvarterStatus'

export interface VeckoremsaDag {
  /** Lokal kalenderdag, YYYY-MM-DD. */
  datum: string
  /** null = inget pass den dagen. */
  status: Status | null
  /** Kort tillägg för skärmläsare och stor storlek, t.ex. "Språkcafé". */
  detalj?: string
}

export interface VeckoremsaProps {
  dagar: VeckoremsaDag[]
  /** Namn på listan för skärmläsare, t.ex. "Leilas vecka". */
  rubrik: string
  storlek?: 'kompakt' | 'stor'
  /** Dagens datum (YYYY-MM-DD) — markeras med aria-current="date". */
  idag?: string
  className?: string
}

function lokalDag(datum: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datum)
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

export function Veckoremsa({ dagar, rubrik, storlek = 'kompakt', idag, className }: VeckoremsaProps) {
  const { t, i18n } = useTranslation()
  const tagg = datumSprak(i18n.language)
  const ingetPass = t('kvarter.ingetPass', 'Inget pass')

  return (
    <ul
      aria-label={rubrik}
      className={cn(
        storlek === 'kompakt' ? 'flex gap-[5px]' : 'grid grid-cols-5 gap-1.5',
        'list-none m-0 p-0',
        className,
      )}
    >
      {dagar.map((dag) => {
        const d = lokalDag(dag.datum)
        const lang = d ? d.toLocaleDateString(tagg, { weekday: 'long', day: 'numeric', month: 'long' }) : dag.datum
        const kort = d ? d.toLocaleDateString(tagg, { weekday: 'short' }).replace('.', '') : ''
        const ord = dag.status ? t(STATUS_NYCKEL[dag.status], STATUS_ORD_SV[dag.status]) : ingetPass
        const lasText = `${lang.charAt(0).toUpperCase()}${lang.slice(1)}: ${ord}${dag.detalj ? `. ${dag.detalj}` : ''}`
        const farg = dag.status ? statusFarg(dag.status) : null
        const arIdag = idag === dag.datum

        if (storlek === 'kompakt') {
          return (
            <li
              key={dag.datum}
              aria-current={arIdag ? 'date' : undefined}
              data-status={dag.status ?? 'ingen'}
              className={cn(
                'w-5 h-5 rounded-md grid place-items-center border',
                farg ? 'border-transparent' : 'border-dashed border-[var(--j-linje-2)]',
                arIdag && 'outline outline-2 outline-offset-1 outline-[var(--j-gran)]',
              )}
              style={farg ? { backgroundColor: farg.bg, color: farg.text } : undefined}
            >
              {dag.status ? <KvarterIkon namn={STATUS_IKON[dag.status]} size={12} strokeWidth={2} /> : null}
              <span className="sr-only">{lasText}</span>
            </li>
          )
        }

        return (
          <li
            key={dag.datum}
            aria-current={arIdag ? 'date' : undefined}
            data-status={dag.status ?? 'ingen'}
            className={cn(
              'grid justify-items-center gap-1 rounded-[var(--j-r-s)] px-1 py-2 text-center',
              farg ? '' : 'border border-dashed border-[var(--j-linje-2)] text-[var(--j-blak-3)]',
              arIdag && 'outline outline-2 outline-offset-1 outline-[var(--j-gran)]',
            )}
            style={farg ? { backgroundColor: farg.bg, color: farg.text } : undefined}
          >
            <span aria-hidden="true" className="text-[0.8125rem] font-semibold capitalize">
              {kort}
            </span>
            <span aria-hidden="true" className="font-rubrik text-lg font-bold leading-none">
              {d ? d.getDate() : ''}
            </span>
            {dag.status ? (
              <KvarterIkon namn={STATUS_IKON[dag.status]} size={18} ton={dag.status} />
            ) : (
              <span aria-hidden="true" className="h-[18px]" />
            )}
            <span aria-hidden="true" className="text-[0.8125rem] leading-4 font-semibold">
              {ord}
            </span>
            <span className="sr-only">{lasText}</span>
          </li>
        )
      })}
    </ul>
  )
}

export default Veckoremsa
