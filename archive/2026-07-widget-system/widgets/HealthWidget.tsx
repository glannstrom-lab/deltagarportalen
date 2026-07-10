import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { Sparkline } from './Sparkline'
import { useWidgetSize } from '@/hooks/useWidgetSize'
import { useMinVardagSummary } from './MinVardagDataContext'
import { streakDays } from '@/utils/streakDays'
import type { WidgetProps } from './types'

/**
 * HealthWidget — Min Vardag hub (Hälsa).
 *
 * Empathy contract (locked from RESEARCH.md / CONTEXT.md):
 *   - Empty state copy uses "Om du vill" framing — never pressuring.
 *   - Filled state primary KPI is a streak label or last-log-date — NEVER the
 *     raw mood number (1-5). The mood values appear ONLY as the Sparkline
 *     decorative data viz.
 *
 * streakDays helper imported from @/utils/streakDays (single source of truth —
 * Plan 05 HealthSummaryWidget imports from the same path).
 *
 * Deep-link route: /wellness (the wellness HealthTab is where mood is logged).
 */
export default function HealthWidget({
  id,
  size,
  allowedSizes,
  onSizeChange,
  editMode,
  onHide,
}: WidgetProps) {
  const { compact, minimal } = useWidgetSize(size)
  const summary = useMinVardagSummary()
  const recentMoodLogs = summary?.recentMoodLogs ?? []
  const isEmpty = recentMoodLogs.length === 0

  if (isEmpty) {
    return (
      <Widget
        id={id}
        size={size}
        allowedSizes={allowedSizes}
        onSizeChange={onSizeChange}
        editMode={editMode}
        onHide={onHide}
      >
        <Widget.Header icon={Heart} title="Hälsa" />
        <Widget.Body>
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-1">
              Hur mår du idag?
            </p>
            <p className="text-[12px] text-[var(--stone-700)] m-0">
              Om du vill — logga ditt mående med ett klick
            </p>
          </div>
        </Widget.Body>
        {(size === 'M' || size === 'L') && (
          <Widget.Footer>
            <Link
              to="/wellness"
              className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
            >
              Logga idag
            </Link>
          </Widget.Footer>
        )}
      </Widget>
    )
  }

  const streak = streakDays(recentMoodLogs)
  // Sparkline expects chronological (ascending). Loader returns newest-first; reverse.
  const sparklineValues = recentMoodLogs
    .slice()
    .reverse()
    .map(l => l.mood_level)
  const latestDate = recentMoodLogs[0].log_date
  // Primary label: streak (qualitative) — NEVER the mood_level number itself.
  const primaryLabel =
    streak >= 2
      ? `${streak} dagar i rad`
      : `Senast: ${new Date(latestDate).toLocaleDateString('sv-SE')}`

  return (
    <Widget
      id={id}
      size={size}
      allowedSizes={allowedSizes}
      onSizeChange={onSizeChange}
      editMode={editMode}
      onHide={onHide}
    >
      <Widget.Header icon={Heart} title="Hälsa" />
      <Widget.Body>
        <div className="flex-1 flex flex-col justify-center">
          {/* Qualitative label (streak / last-date) — never the mood number */}
          <p className="text-[22px] font-bold text-[var(--stone-900)] leading-tight m-0 mb-1">
            {primaryLabel}
          </p>
          {!compact && (
            <p className="text-[12px] text-[var(--stone-700)] m-0">
              {recentMoodLogs.length} {recentMoodLogs.length === 1 ? 'loggning' : 'loggningar'} senaste 7 dagar
            </p>
          )}
          {!minimal && sparklineValues.length >= 2 && (
            <div className="mt-2">
              <Sparkline values={sparklineValues} width={140} height={28} />
            </div>
          )}
        </div>
      </Widget.Body>
      {(size === 'M' || size === 'L') && (
        <Widget.Footer>
          <Link
            to="/wellness"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            Logga idag
          </Link>
        </Widget.Footer>
      )}
    </Widget>
  )
}
