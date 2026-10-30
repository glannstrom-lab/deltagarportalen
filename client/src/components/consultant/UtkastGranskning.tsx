/**
 * UtkastGranskning — AIX13. Visar vad `granskaUtkast` flaggat, mening för mening,
 * under ett AI-utkast. Räknas om vid varje ändring av texten, så att en rättad
 * mening släcks direkt.
 *
 * Texten säger med flit att kontrollen är mot underlaget, inte mot sanningen
 * (KONTROLLTEXT) — "inga avvikelser" får aldrig läsas som "godkänt".
 *
 * Konsulentvyn översätts inte (DESIGN.md §2).
 */
import { useMemo } from 'react'
import { AlertTriangle, Check } from '@/components/ui/icons'
import { granskaUtkast, KONTROLLTEXT, type ProblemTyp } from './utkastGranskare'

const TYP_ETIKETT: Record<ProblemTyp, string> = {
  datum: 'Datum',
  tal: 'Tal',
  varderingsord: 'Värderande ord',
  halsoord: 'Hälsoord',
}

interface Props {
  utkast: string
  /** All text AI:n fick bygga på. null = okänt (t.ex. ett återställt utkast utan sparat underlag). */
  underlag: string | null
}

export function UtkastGranskning({ utkast, underlag }: Props) {
  const granskning = useMemo(() => (underlag === null ? null : granskaUtkast(utkast, underlag)), [utkast, underlag])

  if (!granskning) {
    return (
      <p className="text-xs text-stone-600 dark:text-stone-300" data-testid="utkast-granskning">
        Utkastet har inte granskats mot underlaget — underlaget finns inte kvar för ett återställt utkast. Skapa ett nytt utkast om du vill ha kontrollen.
      </p>
    )
  }

  const flaggade = granskning.meningar.filter((m) => m.problem.length > 0)

  return (
    <div className="space-y-2" data-testid="utkast-granskning">
      <p role="status" className="flex items-center gap-2 text-sm font-medium text-stone-800 dark:text-stone-100">
        {granskning.ren ? (
          <>
            <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            Inga avvikelser mot underlaget hittades.
          </>
        ) : (
          <>
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            {flaggade.length === 1 ? '1 mening att kontrollera' : `${flaggade.length} meningar att kontrollera`}
          </>
        )}
      </p>

      {flaggade.length > 0 && (
        <ul className="m-0 p-0 list-none space-y-2">
          {flaggade.map((m, i) => (
            <li key={`${i}-${m.text}`} className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm">
              <p className="m-0 text-stone-900 dark:text-stone-100">{m.text}</p>
              <ul className="m-0 mt-1 p-0 list-none text-xs text-amber-800 dark:text-amber-200">
                {m.problem.map((p, j) => (
                  <li key={j}>
                    <strong>{TYP_ETIKETT[p.typ]}:</strong> &quot;{p.text}&quot; — {p.forklaring}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <p className="m-0 text-xs text-stone-600 dark:text-stone-300">{KONTROLLTEXT}</p>
    </div>
  )
}
