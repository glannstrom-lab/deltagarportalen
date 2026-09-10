/**
 * Klasser för en rad i stigen (länk eller knapp). Se Stig.tsx för linjen och
 * prickarna; vänsterpaddingen här (px-3 = 12 px) är det linjen är räknad på.
 * Aktiv rad står på hubbens pastell med text i hubbens textfärg.
 */
import { cn } from '@/lib/utils'

export function stigRadKlasser(aktiv: boolean): string {
  return cn(
    'w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left text-[13.5px]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]',
    aktiv
      ? 'bg-[var(--c-bg)] font-semibold text-[var(--c-text)] dark:text-[var(--c-solid)]'
      : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60'
  )
}
