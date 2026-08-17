/**
 * Sidoskenan — sidans flikar och rubrik, till vänster i stället för i en hjälte.
 * (Steg 5 i designomläggningen, 2026-08-17, beslut Mikael)
 *
 * Före: `PageHero` la en hjälte överst på 37 sidor — rubrik, beskrivning,
 * flikrad, ibland nyckeltal. Uppmätt på CV-sidan tog den ~180 px innan en
 * enda rad innehåll syntes, ovanpå navigationens 82 px.
 *
 * Efter: flikarna flyttar in i en smal skena till vänster, samma plats där
 * CV-byggarens innehållsöversikt redan bor. Två vinster:
 *   - Höjden försvinner. Innehållet börjar direkt.
 *   - Flikarna blir en lodrät lista i stället för en vågrät rad, vilket
 *     rymmer längre etiketter utan att klippas eller scrolla i sidled.
 *
 * Rubriken följer med in i skenan. Den försvinner alltså inte — men den tar
 * inte längre en egen våning.
 *
 * **På mobil finns ingen skena.** Där renderas flikarna som en scrollande rad
 * ovanför innehållet, vilket är vad de var förut. Mobilanvändaren möter alltså
 * ingen förändring alls.
 */

import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { Tab } from './PageTabs'
import { arAktivFlik } from './flikMatchning'

interface SidRailProps {
  title?: string
  description?: string
  tabs?: Tab[]
  /** Renderas under flikarna — t.ex. CV-byggarens sektionsöversikt. */
  children?: React.ReactNode
}

export default function SidRail({ title, description, tabs, children }: SidRailProps) {
  const location = useLocation()
  const [sok] = useSearchParams()
  const harFlikar = !!tabs && tabs.length > 1

  if (!title && !harFlikar && !children) return null

  // Sticky utan offset: navigationen är redan sticky ovanför, och en
  // top-offset här sköt ner skenan ~85 px så att den inte längre stod i linje
  // med innehållet den hör till.
  return (
    <div className="lg:sticky lg:top-0">
      {title && (
        <div className="mb-3">
          <h1 className="text-[17px] font-semibold tracking-tight text-stone-900 dark:text-stone-100 m-0">
            {title}
          </h1>
          {description && (
            <p className="mt-0.5 text-[12px] leading-snug text-stone-500 dark:text-stone-400 m-0">
              {description}
            </p>
          )}
        </div>
      )}

      {harFlikar && (
        <nav aria-label={title ? `${title} — avsnitt` : 'Avsnitt'}>
          <ul className="m-0 p-0 list-none space-y-0.5">
            {tabs!.map((tab) => {
              const aktiv = arAktivFlik(tab, location.pathname, sok)
              return (
                <li key={tab.id}>
                  <Link
                    to={tab.path}
                    aria-current={aktiv ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]',
                      aktiv
                        ? 'bg-white dark:bg-stone-800 font-semibold text-stone-900 dark:text-stone-100 shadow-sm'
                        : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60'
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'w-1.5 h-1.5 rounded-full shrink-0',
                        aktiv ? 'bg-[var(--c-solid)]' : 'bg-stone-300 dark:bg-stone-600'
                      )}
                    />
                    <span className="min-w-0 truncate">{tab.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      )}

      {children && <div className={cn(harFlikar && 'mt-4')}>{children}</div>}
    </div>
  )
}

/** Flikarna som vågrät rad. Mobil, där ingen skena får plats. */
export function FlikRad({ tabs }: { tabs?: Tab[] }) {
  const location = useLocation()
  const [sok] = useSearchParams()
  if (!tabs || tabs.length < 2) return null

  return (
    <nav aria-label="Avsnitt" className="lg:hidden -mx-4 px-4 mb-4 overflow-x-auto">
      <ul className="m-0 p-0 list-none flex gap-1 w-max">
        {tabs.map((tab) => {
          const aktiv = arAktivFlik(tab, location.pathname, sok)
          return (
            <li key={tab.id}>
              <Link
                to={tab.path}
                aria-current={aktiv ? 'page' : undefined}
                className={cn(
                  'block px-3 py-2 rounded-lg text-[13px] whitespace-nowrap',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]',
                  aktiv
                    ? 'bg-white dark:bg-stone-800 font-semibold text-stone-900 dark:text-stone-100 shadow-sm'
                    : 'text-stone-600 dark:text-stone-300'
                )}
              >
                {tab.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
