/**
 * Stigen — steg och avsnitt i skenan som en väg, inte som en lista.
 * (Spår N2, 2026-09-10, beslut Mikael)
 *
 * Före: varje rad i sidoskenan hade en 6 px prick framför sig, likadan för
 * alla, och ingenting band ihop dem. Sex steg i CV-byggaren såg ut som sex
 * punkter i en punktlista fast de är en ordning man går igenom.
 *
 * Efter: en tunn linje i hubbens ljusa ton löper genom prickarna. Tre lägen:
 *
 *   klar   fylld prick i hubbfärg
 *   aktiv  ring i hubbfärg med en glöd av hubbens pastell
 *   kvar   tom ring
 *
 * Färgerna kommer ur `--c-*` som `data-domain` sätter — ingen hårdkodad
 * hub-token (`lint:design`). Samma metafor som världskartan i
 * `docs/BILDPROMPTER-SIDOR.md` (ark 1): portalen är en väg med stationer.
 *
 * Prickens kolumn är 12 px bred och radens vänsterpadding 12 px, så linjen
 * (`left-[17px]`, 2 px) går exakt genom prickarnas mitt. Ändrar du paddingen
 * (i `stigKlasser.ts`) måste linjen flyttas — det är därför båda talen står
 * i de två filerna bredvid varandra och inte i anroparna.
 *
 * Radens klasser bor i `stigKlasser.ts`: en funktion som exporteras ur en
 * komponentfil fäller `react-refresh/only-export-components`.
 */

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type StigLage = 'klar' | 'aktiv' | 'kvar'

/** Listan med linjen. Barnen är `<li>` vars länk/knapp använder `stigRadKlasser`. */
export function StigLista({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ul
      className={cn(
        'relative m-0 p-0 list-none space-y-0.5',
        "before:content-[''] before:absolute before:left-[17px] before:top-3 before:bottom-3 before:w-0.5 before:rounded-full before:bg-[var(--c-accent)] dark:before:bg-[var(--c-accent)]",
        className
      )}
    >
      {children}
    </ul>
  )
}

/** Pricken. Alltid `aria-hidden` — läget bärs av `aria-current` på raden. */
export function StigPrick({ lage }: { lage: StigLage }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative z-[1] w-3 h-3 rounded-full shrink-0 border-2 box-border',
        lage === 'klar' && 'bg-[var(--c-solid)] border-[var(--c-solid)]',
        lage === 'aktiv' && 'bg-white dark:bg-stone-900 border-[var(--c-solid)] ring-[3px] ring-[var(--c-bg)]',
        lage === 'kvar' && 'bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-600'
      )}
    />
  )
}

/** Gruppetikett i skenan — gemener, inte monospace-versaler. */
export function SkenEtikett({ text }: { text: string }) {
  return (
    <p className="m-0 mb-1.5 px-3 text-[12px] font-semibold text-stone-500 dark:text-stone-400">
      {text}
    </p>
  )
}
