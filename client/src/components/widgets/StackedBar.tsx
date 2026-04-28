// Reusable horizontal stacked bar for ApplicationsWidget (and future widgets)
// De-emphasized segments (closed/rejected) use reduced opacity per anti-shaming rule (UI-SPEC)

export interface StackedBarSegment {
  /** Visible Swedish label */
  label: string
  /** Count for this segment */
  count: number
  /** CSS color (use CSS variable strings or hex) */
  color: string
  /** When true, segment is rendered with reduced visual weight (used for closed/rejected) */
  deEmphasized?: boolean
}

interface StackedBarProps {
  segments: StackedBarSegment[]
  /** Total height of the bar in pixels */
  height?: number
  /** When true, renders compact legend below */
  showLegend?: boolean
}

export function StackedBar({ segments, height = 8, showLegend = true }: StackedBarProps) {
  const total = segments.reduce((s, x) => s + x.count, 0) || 1

  return (
    <div className="w-full">
      <div
        className="flex w-full overflow-hidden rounded-full bg-[var(--stone-150)]"
        style={{ height }}
        role="img"
        aria-label={segments.map(s => `${s.label}: ${s.count}`).join(', ')}
      >
        {segments.map(s => {
          const pct = (s.count / total) * 100
          if (pct === 0) return null
          return (
            <div
              key={s.label}
              style={{
                width: `${pct}%`,
                background: s.color,
                opacity: s.deEmphasized ? 0.6 : 1,
              }}
            />
          )
        })}
      </div>
      {showLegend && (
        <ul className="list-none p-0 mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {segments.map(s => (
            <li
              key={s.label}
              className="flex items-center gap-1 text-[12px] text-[var(--stone-700)]"
            >
              <span
                aria-hidden="true"
                className="inline-block w-2 h-2 rounded-sm"
                style={{ background: s.color, opacity: s.deEmphasized ? 0.6 : 1 }}
              />
              <span>{s.count} {s.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
