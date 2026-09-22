/**
 * KpiCard — den enda KPI-kort-komponenten i portalen.
 *
 * KONTRAKT (DESIGN.md §4 + §6):
 *   - En sida = en hub-färg. KpiCard accepterar INGEN `color`-prop.
 *     Färgen ärvs från sammanhanget (data-domain på parent → --c-* tokens).
 *   - Variation mellan KPI-kort på samma sida kommer från IKON och TEXT,
 *     aldrig från olika hubars pasteller. Samma vy med 4 olika KPI-färger
 *     är "färg-confetti" och förbjudet.
 *
 * VARIANTER:
 *   - default — vitt kort, liten ikon-tile i --c-bg, ikon i --c-text
 *   - tinted  — hela kortet i --c-bg, hub-accent border
 *
 * BAKÅTKOMPABILITET:
 *   `color`-prop är deprecated och ignoreras. Befintliga anrop fortsätter
 *   fungera men kortet använder hub-färgen från context istället.
 */

import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ChevronRight } from '@/components/ui/icons'

interface KpiCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  subtext?: string
  /**
   * @deprecated Ignoreras sedan 2026-05-10 (DESIGN.md §4).
   * Färg ärvs från data-domain på parent-element via --c-* tokens.
   */
  color?: string
  /**
   * Visuell variant.
   * - 'default' (default): vitt kort med liten ikon-tile i hub-färg
   * - 'tinted': hela kortet i hub-pastell (--c-bg med --c-accent-border)
   */
  variant?: 'default' | 'tinted'
  to?: string
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  subtext,
  variant = 'default',
  to,
}: KpiCardProps) {
  const displayValue = typeof value === 'number' ? Math.max(0, value) : value

  const isTinted = variant === 'tinted'

  const content = (
    <div className={cn(
      'rounded-xl p-4 transition-colors',
      isTinted
        ? 'bg-[var(--c-bg)] border border-[var(--c-accent)]'
        : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700',
      to && (isTinted
        ? 'hover:bg-[var(--c-accent)]/40 cursor-pointer group'
        : 'hover:border-stone-300 dark:hover:border-stone-600 cursor-pointer group'
      )
    )}>
      <div className="flex items-start justify-between">
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          isTinted
            ? 'bg-white/60 dark:bg-stone-900/40'
            : 'bg-[var(--c-bg)] dark:bg-stone-800'
        )}>
          <Icon
            className={cn(
              'w-5 h-5',
              isTinted
                ? 'text-[var(--c-text)]'
                : 'text-[var(--c-text)] dark:text-stone-400'
            )}
            aria-hidden="true"
          />
        </div>

        {to && (
          <ChevronRight className={cn(
            'w-4 h-4 transition-colors',
            isTinted
              ? 'text-[var(--c-accent)] group-hover:text-[var(--c-text)]'
              : 'text-stone-300 dark:text-stone-600 group-hover:text-stone-400 dark:group-hover:text-stone-500'
          )} />
        )}
      </div>

      <div className="mt-3">
        <p className={cn(
          'text-2xl font-bold',
          isTinted ? 'text-[var(--c-text)]' : 'text-stone-800 dark:text-stone-100'
        )}>
          {displayValue}
        </p>
        <p className={cn(
          'text-sm mt-0.5',
          isTinted ? 'text-[var(--c-text)]/80' : 'text-stone-500 dark:text-stone-400'
        )}>
          {label}
        </p>
        {subtext && (
          <p className={cn(
            'text-xs mt-1',
            isTinted ? 'text-[var(--c-text)]/70' : 'text-stone-400 dark:text-stone-500'
          )}>
            {subtext}
          </p>
        )}
      </div>
    </div>
  )

  if (to) {
    return (
      <Link
        to={to}
        aria-label={`${label}: ${displayValue}${subtext ? `, ${subtext}` : ''}`}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)] focus-visible:ring-offset-2 rounded-xl block"
      >
        {content}
      </Link>
    )
  }

  return content
}

export default KpiCard
