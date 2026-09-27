/**
 * BradskandeIdag — överst i Min dag: ogiltig frånvaro senaste 7 dagarna och
 * deltagare över möteskadensens gräns (RR3/RK7, rollspelet 2026-09-27).
 * Reglerna bor i oversiktRegler.ts. Konsulentvyn översätts inte (DESIGN.md §2).
 *
 * Tre lägen, aldrig ett tyst "inget": listan, en rad om att underlaget inte
 * kunde hämtas, eller ingenting alls när inget brådskar.
 */

import { Link } from 'react-router-dom'
import { AlertTriangle, ChevronRight } from '@/components/ui/icons'
import type { Bradskande } from './oversiktRegler'

interface Props {
  punkter: readonly Bradskande[]
  /** Underlaget (möten eller pass) kunde inte hämtas. */
  fel: boolean
  namnFor: (participantId: string) => string
}

export function BradskandeIdag({ punkter, fel, namnFor }: Props) {
  if (fel) {
    return (
      <p role="alert" className="mb-4 text-sm text-red-700 dark:text-red-300">
        Möten och frånvaro kunde inte hämtas — det som brådskar visas inte just nu. Ladda om sidan för att försöka igen.
      </p>
    )
  }
  if (punkter.length === 0) return null
  return (
    <section aria-labelledby="bradskande-rubrik" className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" aria-hidden="true" />
        <h4 id="bradskande-rubrik" className="text-sm font-semibold text-stone-700 dark:text-stone-300">
          Brådskande
        </h4>
        <span className="text-xs text-stone-500 dark:text-stone-400">({punkter.length})</span>
      </div>
      <ul className="space-y-2">
        {punkter.map((p) => (
          <li key={`${p.participantId}-${p.typ}`}>
            <Link
              to={`/consultant/participants/${p.participantId}`}
              className="flex items-center justify-between gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 hover:underline"
            >
              <span className="min-w-0">
                <span className="block font-medium text-sm text-stone-900 dark:text-stone-100 truncate">{namnFor(p.participantId)}</span>
                <span className="block text-xs text-stone-600 dark:text-stone-300">{p.text}</span>
              </span>
              <ChevronRight className="w-4 h-4 text-stone-400 flex-shrink-0" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
