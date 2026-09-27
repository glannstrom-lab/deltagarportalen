/**
 * SkrivFel — det gemensamma mönstret för en skrivning som misslyckades (RD26,
 * rollspelet 2026-09-27).
 *
 * Anna skrev till sin konsulent, tryckte Skicka, och fältet tömdes. Meddelandet
 * kom aldrig fram (RLS svarade 403) och ingenting sa det. Samma sak i profilen:
 * "Spara ändringar" gav 500 och ingen felrad. För den som redan är orolig är
 * ett tyst fel värre än ett synligt — hon tror att det är skickat.
 *
 * Tre regler, i den här ordningen:
 *   1. Säg att det inte gick, i en mening, utan skuld och utan felkod.
 *   2. Säg att texten är kvar — och se till att den ÄR det (anroparens ansvar:
 *      töm aldrig fältet förrän skrivningen lyckats).
 *   3. Erbjud "Försök igen" som gör exakt samma sak en gång till.
 *
 * `role="alert"` så att skärmläsaren läser upp felet när det dyker upp.
 * Ton: lugn vän (DESIGN.md §2). Texterna finns i sv, en och sv-latt.
 */

import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './Button'
import { cn } from '@/lib/utils'

export type SkrivFelSort = 'skicka' | 'spara'

interface Props {
  /** 'skicka' för meddelanden och anmälningar, 'spara' för formulär. */
  sort?: SkrivFelSort
  /** Gör om samma skrivning. Utelämnad = ingen knapp (t.ex. när formuläret självt har en). */
  onForsokIgen?: () => void
  /** Sant medan det nya försöket pågår. */
  forsoker?: boolean
  /** En extra rad, t.ex. en annan väg till konsulenten. */
  extra?: ReactNode
  /** Egen huvudmening när sammanhanget kräver det (t.ex. saknat samtycke). */
  meddelande?: ReactNode
  className?: string
}

export function SkrivFel({ sort = 'skicka', onForsokIgen, forsoker = false, extra, meddelande, className }: Props) {
  const { t } = useTranslation()
  const text =
    meddelande ??
    (sort === 'spara'
      ? t('skrivfel.spara', 'Det gick inte att spara. Det du skrev är kvar.')
      : t('skrivfel.skicka', 'Det gick inte att skicka. Din text är kvar.'))

  return (
    <div
      role="alert"
      className={cn(
        'rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800',
        'dark:border-red-800 dark:bg-red-900/20 dark:text-red-200',
        className,
      )}
    >
      <p>{text}</p>
      {extra && <p className="mt-1">{extra}</p>}
      {onForsokIgen && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 min-h-11"
          onClick={onForsokIgen}
          disabled={forsoker}
        >
          {forsoker ? t('skrivfel.forsoker', 'Försöker igen …') : t('skrivfel.forsokIgen', 'Försök igen')}
        </Button>
      )}
    </div>
  )
}
