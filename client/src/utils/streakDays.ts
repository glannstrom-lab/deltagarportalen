/**
 * Count consecutive days ending at the most-recent log.
 * Pure function — no Date side effects beyond input.
 *
 * Single source of truth for streak counting. Imported by:
 *   - client/src/components/widgets/HealthWidget.tsx (Phase 5 / Plan 04, Min Vardag)
 *   - client/src/components/widgets/HealthSummaryWidget.tsx (Phase 5 / Plan 05, Översikt)
 *
 * Behaviour:
 *   - Empty / nullish input → 0
 *   - Single entry → 1
 *   - Counts down from the most-recent log_date; first gap breaks the streak.
 *
 * The function does NOT compare to "today" — it counts streaks anchored at the
 * latest log. If the latest log is several days old, the streak is still
 * counted (e.g. 3 consecutive days last week → 3). Empathy contract: we count
 * what the user did, never punish them for what they haven't done.
 */
export function streakDays(logs: Array<{ log_date: string }> | null | undefined): number {
  if (!logs || logs.length === 0) return 0
  // Sort descending by date (most recent first) — defensive even if caller already sorted
  const sorted = [...logs].sort((a, b) => b.log_date.localeCompare(a.log_date))
  let streak = 0
  const cursor = new Date(sorted[0].log_date)
  for (const log of sorted) {
    const expected = cursor.toISOString().slice(0, 10)
    const actual = new Date(log.log_date).toISOString().slice(0, 10)
    if (expected !== actual) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
