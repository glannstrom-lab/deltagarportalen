/**
 * Sidans nyckeltal — lodrätt i skenan på desktop, som en rad på mobil.
 *
 * Bakgrund (2026-08-17): när hjälten togs bort renderade PageLayout först
 * `stats` bara inuti skenan, som är `hidden lg:block`. Följden var att
 * nyckeltalen OCH knappen försvann helt på telefon — PageHero hade visat dem
 * på alla bredder. En sida svarade med att bygga en egen `lg:hidden`-kopia av
 * samma siffror, vilket är rätt instinkt men fel ställe: nästa sida hade fått
 * göra om det.
 *
 * Två saker den här komponenten gör som de två kopiorna inte gjorde:
 *
 *   - `to` respekteras. `PageStat` har haft fältet hela tiden, men skenan
 *     ignorerade det, så "12 sparade jobb" gick inte att trycka på trots att
 *     den pekade på /job-search.
 *   - `icon` respekteras, av samma skäl.
 *
 * Ett nyckeltal utan underlag ska visas som `—` av sidan som äger datat, inte
 * som en nolla här (regel B31). Komponenten renderar det den får.
 *
 * Rättat 2026-08-18: markeringen var `<dl><a><dt>…<dd></a></dl>`. HTML tillåter
 * bara `<dt>`, `<dd>`, `<div>`, `<script>` och `<template>` direkt i en `<dl>` —
 * ett `<a>` däremellan bryter kopplingen term/värde, och axe flaggar det som
 * `definition-list` + `dlitem` (allvarlig) på var och en av de sidor som skickar
 * `stats`. Nu är det en lista i stället, och varje länk får ett komplett
 * tillgängligt namn ("Sparade jobb: 12") så ordningen inte beror på var värdet
 * råkar hamna visuellt.
 */

import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { PageStat } from './PageTabs'

interface Props {
  stats: PageStat[]
  /** 'rail' = lodrät lista i skenan. 'rad' = vågrät, för mobil. */
  layout: 'rail' | 'rad'
}

export default function SidRailStats({ stats, layout }: Props) {
  if (stats.length === 0) return null
  const rail = layout === 'rail'

  return (
    <ul
      className={cn(
        'm-0 list-none p-0',
        rail ? 'space-y-0.5 px-1' : 'flex flex-wrap gap-x-1 gap-y-1'
      )}
    >
      {stats.map((st) => {
        const Ikon = st.icon
        const innehall = (
          <>
            {Ikon && (
              <Ikon className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 shrink-0" />
            )}
            <span className="text-[11px] text-stone-500 dark:text-stone-400 min-w-0 truncate">
              {st.label}
            </span>
            <span
              className={cn(
                'text-[13px] font-semibold tabular-nums text-stone-900 dark:text-stone-100',
                rail && 'ml-auto'
              )}
            >
              {st.value}
            </span>
          </>
        )

        const klass = cn(
          'flex items-center gap-1.5 rounded-md px-2 py-1',
          st.to &&
            'hover:bg-stone-100 dark:hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]'
        )

        return (
          <li key={st.label} className="m-0">
            {st.to ? (
              <Link
                to={st.to}
                aria-label={`${st.label}: ${st.value}`}
                className={cn(klass, 'no-underline')}
              >
                {innehall}
              </Link>
            ) : (
              <div className={klass}>{innehall}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
