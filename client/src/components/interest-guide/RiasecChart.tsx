import { riasecColors, riasecNames, type RiasecScores } from '@/services/interestGuideData'

interface RiasecChartProps {
  scores: RiasecScores
  size?: number
}

export function RiasecChart({ scores, size = 280 }: RiasecChartProps) {
  const center = size / 2
  const radius = (size / 2) - 40
  const keys: (keyof RiasecScores)[] = ['R', 'I', 'A', 'S', 'E', 'C']
  
  // Beräkna punkter för polygonen
  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2
    const r = (value / 5) * radius
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    }
  }

  // Skapa polygon-path
  const polygonPoints = keys.map((key, i) => {
    const point = getPoint(i, scores[key])
    return `${point.x},${point.y}`
  }).join(' ')

  // Skapa nivåcirklar
  const levelCircles = [1, 2, 3, 4, 5].map(level => {
    const r = (level / 5) * radius
    return (
      <circle
        key={level}
        cx={center}
        cy={center}
        r={r}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
    )
  })

  // Skapa axlar
  const axes = keys.map((_, i) => {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
    const endX = center + radius * Math.cos(angle)
    const endY = center + radius * Math.sin(angle)
    return (
      <line
        key={i}
        x1={center}
        y1={center}
        x2={endX}
        y2={endY}
        stroke="#e5e7eb"
        strokeWidth="1"
      />
    )
  })

  // Skapa labels
  const labels = keys.map((key, i) => {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
    const labelRadius = radius + 25
    const x = center + labelRadius * Math.cos(angle)
    const y = center + labelRadius * Math.sin(angle)
    const colors = riasecColors[key]
    
    return (
      <g key={key}>
        <circle
          cx={x}
          cy={y}
          r="18"
          className={`fill-${colors.bg.replace('bg-', '')}`}
          fill="currentColor"
        />
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-white text-sm font-bold"
        >
          {key}
        </text>
        <text
          x={x}
          y={y + 32}
          textAnchor="middle"
          className="fill-gray-600 text-xs"
        >
          {riasecNames[key]}
        </text>
      </g>
    )
  })

  // Gradient för polygonen
  const gradientId = `riasecGradient-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="relative">
      <svg width={size} height={size} className="mx-auto">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        
        {/* Bakgrundscirklar */}
        {levelCircles}
        
        {/* Axlar */}
        {axes}
        
        {/* Fylld polygon */}
        <polygon
          points={polygonPoints}
          fill={`url(#${gradientId})`}
          stroke="#6366f1"
          strokeWidth="2"
        />
        
        {/* Punkter */}
        {keys.map((key, i) => {
          const point = getPoint(i, scores[key])
          return (
            <circle
              key={key}
              cx={point.x}
              cy={point.y}
              r="6"
              className="fill-white"
              stroke="#6366f1"
              strokeWidth="2"
            />
          )
        })}
        
        {/* Labels */}
        {labels}
      </svg>
      
      {/* RIASEC-kod display */}
      <div className="flex justify-center gap-2 mt-4">
        {keys
          .sort((a, b) => scores[b] - scores[a])
          .slice(0, 3)
          .map((key) => (
            <div
              key={key}
              className={`w-10 h-10 rounded-lg bg-gradient-to-br ${riasecColors[key].gradient} flex items-center justify-center text-white font-bold shadow-md`}
            >
              {key}
            </div>
          ))}
      </div>
      <p className="text-center text-sm text-gray-500 mt-2">
        Din Holland-kod (topp 3)
      </p>
    </div>
  )
}
