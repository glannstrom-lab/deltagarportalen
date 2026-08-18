/**
 * SourceToggle - Flikknapp för att växla matchningskälla (CV/Intresse/Karriär).
 * Utbruten ur components/jobs/MatchesTab.tsx (2026-07-03).
 */

import { cn } from '@/lib/utils'
import type { MatchSource } from '@/services/jobMatching'

export function SourceToggle({
  source,
  label,
  icon: Icon,
  active,
  available,
  count,
  missingLabel,
  onToggle
}: {
  source: MatchSource
  label: string
  icon: React.ElementType
  active: boolean
  available: boolean
  count: number
  missingLabel: string
  onToggle: () => void
}) {
  const colors = {
    cv: 'bg-[var(--c-accent)]/40 text-[var(--c-text)] border-[var(--c-accent)]',
    // Amber var en varningsfärg på en persikasida (DESIGN.md §4). Alla tre
    // källorna bär samma hubbton; ikonen skiljer dem åt, precis som på korten.
    interest: 'bg-[var(--c-accent)]/40 text-[var(--c-text)] border-[var(--c-accent)]',
    career: 'bg-[var(--c-accent)]/40 text-[var(--c-text)] border-[var(--c-accent)]'
  }

  return (
    <button
      onClick={onToggle}
      disabled={!available}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all",
        active && available ? colors[source] : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300",
        !available && "opacity-50 cursor-not-allowed",
        available && !active && "hover:border-stone-300 dark:hover:border-stone-600"
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="font-medium text-sm">{label}</span>
      {available && count > 0 && (
        <span className={cn(
          "text-xs px-2 py-0.5 rounded-full",
          /* `bg-white/50` var ljust även i mörkt läge — brickans siffra mättes
             till 2,16:1. En neutral intensitetsskillnad i stället för en egen
             färg: texten ärver knappens färg, som redan är mätt. */
          active ? "bg-black/5 dark:bg-white/10" : "bg-stone-100 dark:bg-stone-800"
        )}>
          {count}
        </span>
      )}
      {!available && (
        <span className="text-xs bg-stone-200 dark:bg-stone-700 px-2 py-0.5 rounded-full ml-1">
          {missingLabel}
        </span>
      )}
    </button>
  )
}
