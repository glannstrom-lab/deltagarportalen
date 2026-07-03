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
    interest: 'bg-amber-100 text-amber-700 border-amber-300',
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
          active ? "bg-white/50" : "bg-stone-100"
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
