/**
 * Fördefinierade taggar för konsulentens deltagare.
 * Delas av BulkActionsDialog (sätta taggar) och ParticipantsTab (visa taggar).
 * Lagras som text[] på consultant_participants (per konsulent-deltagar-relation).
 */

export const AVAILABLE_TAGS = [
  { id: 'followup', label: 'Behöver uppföljning', color: 'amber' },
  { id: 'priority', label: 'Prioriterad', color: 'rose' },
  { id: 'ready', label: 'Redo för jobb', color: 'emerald' },
  { id: 'interview', label: 'Intervjuträning', color: 'teal' },
  { id: 'cv', label: 'CV-förbättring', color: 'blue' },
  { id: 'motivation', label: 'Motivationsstöd', color: 'orange' },
] as const

export const TAG_COLOR_CLASSES: Record<string, string> = {
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 ring-amber-500',
  rose: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 ring-rose-500',
  emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 ring-emerald-500',
  teal: 'bg-[var(--c-accent)]/40 text-[var(--c-text)] dark:bg-[var(--c-bg)]/40 dark:text-[var(--c-accent)] ring-[var(--c-solid)]',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 ring-blue-500',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 ring-orange-500',
}

export function getTag(id: string) {
  return AVAILABLE_TAGS.find(t => t.id === id)
}

export function getTagLabel(id: string): string {
  return getTag(id)?.label ?? id
}

export function getTagColorClasses(id: string): string {
  return TAG_COLOR_CLASSES[getTag(id)?.color ?? ''] ?? 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
}
