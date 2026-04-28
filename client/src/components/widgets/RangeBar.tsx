// Reusable horizontal range bar with median marker for SalaryWidget (and future widgets)
// Marker dot uses --c-solid (domain accent) per UI-SPEC Color contract

interface RangeBarProps {
  low: number
  median: number
  high: number
  /** Suffix appended after formatted numbers, e.g. " kr" */
  unit?: string
  /** Custom format function (defaults to Swedish locale number) */
  format?: (n: number) => string
}

export function RangeBar({ low, median, high, unit = '', format }: RangeBarProps) {
  const fmt = format ?? ((n: number) => n.toLocaleString('sv-SE'))
  const range = high - low || 1
  const markerPct = ((median - low) / range) * 100

  return (
    <div className="w-full">
      <div
        className="relative w-full h-2 bg-[var(--c-bg)] rounded-full"
        role="img"
        aria-label={`Lönespann: ${fmt(low)}${unit} till ${fmt(high)}${unit}, median ${fmt(median)}${unit}`}
      >
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[var(--c-solid)] border-2 border-white shadow-sm"
          style={{ left: `calc(${markerPct}% - 6px)` }}
          aria-hidden="true"
        />
      </div>
      <div className="flex justify-between mt-1 text-[12px] text-[var(--stone-700)]">
        <span>{fmt(low)}{unit}</span>
        <span className="font-bold text-[var(--c-text)]">{fmt(median)}{unit}</span>
        <span>{fmt(high)}{unit}</span>
      </div>
    </div>
  )
}
