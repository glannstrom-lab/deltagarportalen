interface SparklineProps {
  /** Array of numeric values, e.g. [60, 64, 70, 68, 75, 80, 82, 84] */
  values: number[]
  width?: number
  height?: number
  /** Show a dot at the last point */
  showEndpoint?: boolean
}

export function Sparkline({ values, width = 120, height = 32, showEndpoint = true }: SparklineProps) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const stepX = width / (values.length - 1)

  const points = values
    .map((v, i) => `${i * stepX},${height - ((v - min) / range) * height}`)
    .join(' ')

  const lastX = (values.length - 1) * stepX
  const lastY = height - ((values[values.length - 1] - min) / range) * height

  return (
    <svg
      width={width}
      height={height}
      role="img"
      aria-label={`Trend: ${values[0]} till ${values[values.length - 1]}`}
      className="overflow-visible"
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--c-solid)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showEndpoint && (
        <circle cx={lastX} cy={lastY} r={3} fill="var(--c-solid)" />
      )}
    </svg>
  )
}
