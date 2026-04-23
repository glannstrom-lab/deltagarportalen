/**
 * RIASEC Radar Chart Component for Dashboard
 * Displays user's interest profile as a radar/spider chart
 * Updated with ARIA attributes for accessibility
 */

import type { RiasecScores } from '@/hooks/useInterestProfile'

interface DashboardRiasecChartProps {
  scores: RiasecScores
  size?: number
}

// Swedish names for RIASEC types
const RIASEC_NAMES: Record<keyof RiasecScores, string> = {
  realistic: 'Praktisk',
  investigative: 'Undersökande',
  artistic: 'Konstnärlig',
  social: 'Social',
  enterprising: 'Företagsam',
  conventional: 'Konventionell'
}

export function DashboardRiasecChart({ scores, size = 200 }: DashboardRiasecChartProps) {
  const center = size / 2
  const radius = (size / 2) - 30
  const keys: (keyof RiasecScores)[] = ['realistic', 'investigative', 'artistic', 'social', 'enterprising', 'conventional']
  const shortKeys = ['R', 'I', 'A', 'S', 'E', 'C']

  // Find max score to normalize
  const maxScore = Math.max(...keys.map(k => scores[k]), 1)

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2
    const r = (value / maxScore) * radius
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    }
  }

  const polygonPoints = keys.map((key, i) => {
    const point = getPoint(i, scores[key])
    return `${point.x},${point.y}`
  }).join(' ')

  const levelCircles = [0.25, 0.5, 0.75, 1].map((level, i) => (
    <circle
      key={i}
      cx={center}
      cy={center}
      r={level * radius}
      fill="none"
      className="stroke-stone-200 dark:stroke-stone-700"
      strokeWidth="1"
      strokeDasharray="3 3"
    />
  ))

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
        className="stroke-stone-200 dark:stroke-stone-700"
        strokeWidth="1"
      />
    )
  })

  const colors: Record<keyof RiasecScores, string> = {
    realistic: '#f59e0b',
    investigative: '#3b82f6',
    artistic: '#8b5cf6',
    social: '#10b981',
    enterprising: '#ef4444',
    conventional: '#6366f1'
  }

  const labels = keys.map((key, i) => {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
    const labelRadius = radius + 18
    const x = center + labelRadius * Math.cos(angle)
    const y = center + labelRadius * Math.sin(angle)

    return (
      <g key={key}>
        <circle
          cx={x}
          cy={y}
          r="12"
          fill={colors[key]}
        />
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-white text-[10px] font-bold"
        >
          {shortKeys[i]}
        </text>
      </g>
    )
  })

  // Find top 3 scores for aria-label description
  const sortedScores = keys
    .map(k => ({ key: k, score: scores[k] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  const ariaLabel = `Intresseprofil: Dina topp 3 områden är ${sortedScores
    .map((s, i) => `${i + 1}. ${RIASEC_NAMES[s.key]} (${Math.round((s.score / maxScore) * 100)}%)`)
    .join(', ')}`

  return (
    <figure role="img" aria-label={ariaLabel}>
      {/* Visual chart - hidden from screen readers */}
      <svg width={size} height={size} className="mx-auto" aria-hidden="true">
        <defs>
          <linearGradient id="riasecGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        {levelCircles}
        {axes}
        <polygon
          points={polygonPoints}
          fill="url(#riasecGrad)"
          stroke="#14b8a6"
          strokeWidth="2"
        />
        {keys.map((key, i) => {
          const point = getPoint(i, scores[key])
          return (
            <circle
              key={key}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="white"
              stroke={colors[key]}
              strokeWidth="2"
            />
          )
        })}
        {labels}
      </svg>

      {/* Accessible fallback table - visually hidden but available to screen readers */}
      <table className="sr-only">
        <caption>RIASEC intressepoäng</caption>
        <thead>
          <tr>
            <th scope="col">Intresseområde</th>
            <th scope="col">Poäng</th>
          </tr>
        </thead>
        <tbody>
          {keys.map(key => (
            <tr key={key}>
              <td>{RIASEC_NAMES[key]}</td>
              <td>{Math.round((scores[key] / maxScore) * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

export default DashboardRiasecChart
