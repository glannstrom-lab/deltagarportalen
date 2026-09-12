/**
 * Tre lägen — laddar / fel / klart (CLAUDE.md: "laddning är inte tomhet").
 * Varje flik i företagsvyn går genom de här två så ett fel aldrig ser ut som
 * en tom lista, och en laddning aldrig påstår något om företaget.
 */

import { AlertCircle } from '@/components/ui/icons'
import { LoadingState } from '@/components/ui/LoadingState'
import { Button } from '@/components/ui/Button'
import { foretagFelText } from '@/services/foretagApi'

export function Laddar({ text = 'Hämtar…' }: { text?: string }) {
  return <LoadingState message={text} />
}

interface FelRutaProps {
  fel: unknown
  /** Vad som inte gick att hämta, i bestämd form: "platserna", "förslagen". */
  vad: string
  onForsokIgen?: () => void
}

export function FelRuta({ fel, vad, onForsokIgen }: FelRutaProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100"
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="flex-1 space-y-2">
        <p className="font-medium">Vi kunde inte hämta {vad} just nu.</p>
        <p className="text-sm">{foretagFelText(fel)}</p>
        {onForsokIgen && (
          <Button variant="outline" size="sm" onClick={onForsokIgen}>
            Försök igen
          </Button>
        )}
      </div>
    </div>
  )
}

/** Fel från en mutation — inline under formuläret, aldrig ett tyst "sparat". */
export function FelText({ fel }: { fel: unknown }) {
  if (!fel) return null
  return (
    <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
      {foretagFelText(fel)}
    </p>
  )
}
