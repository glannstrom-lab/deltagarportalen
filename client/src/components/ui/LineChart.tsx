interface LineChartProps {
  data: number[];
  label?: string;
}

export function LineChart({ data, label = "Aktivitet över tid" }: LineChartProps) {
  const width = 300
  const height = 100
  const padding = 10

  // Visa vänligt meddelande om ingen data finns
  if (!data || data.length === 0) {
    return (
      <div className="card">
        <h3 className="font-semibold text-slate-800 mb-4">{label}</h3>
        <div className="flex items-center justify-center h-32 bg-slate-50 rounded-lg border border-dashed border-slate-300">
          <div className="text-center">
            <svg 
              className="mx-auto h-8 w-8 text-slate-400 mb-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
              />
            </svg>
            <p className="text-sm text-slate-500">Ingen data än</p>
            <p className="text-xs text-slate-400 mt-1">Data visas när tillräckligt med information finns</p>
          </div>
        </div>
      </div>
    )
  }

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1 // Förhindra division med noll

  const linePoints = data.map((p, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2)
    const y = height - padding - ((p - min) / range) * (height - padding * 2)
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="card">
      <h3 className="font-semibold text-slate-800 mb-4">{label}</h3>
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
        {data.map((p, i) => {
          const x = padding + (i / (data.length - 1)) * (width - padding * 2)
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
