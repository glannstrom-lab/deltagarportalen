export function LineChart() {
  // Simplified SVG line chart
  const points = [20, 45, 35, 55, 40, 60, 50, 70, 55, 75]
  const width = 300
  const height = 100
  const padding = 10
  
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min
  
  const linePoints = points.map((p, i) => {
    const x = padding + (i / (points.length - 1)) * (width - padding * 2)
    const y = height - padding - ((p - min) / range) * (height - padding * 2)
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="card">
      <h3 className="font-semibold text-slate-800 mb-4">Aktivitet över tid</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <polyline
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={linePoints}
        />
        {points.map((p, i) => {
          const x = padding + (i / (points.length - 1)) * (width - padding * 2)
          const y = height - padding - ((p - min) / range) * (height - padding * 2)
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill={i % 2 === 0 ? '#f97316' : '#6366f1'}
            />
          )
        })}
      </svg>
    </div>
  )
}
