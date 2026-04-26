/**
 * RIASEC Radar Chart - Clean minimal design
 * Single accent color (brand teal), simple labels
 */

import type { RiasecScores } from '@/hooks/useInterestProfile'

interface DashboardRiasecChartProps {
  scores: RiasecScores
  size?: number
}

const RIASEC_LABELS = ['R', 'I', 'A', 'S', 'E', 'C']
const RIASEC_NAMES: Record<keyof RiasecScores, string> = {
  realistic: 'Praktisk',
  investigative: 'Undersökande',
  artistic: 'Konstnärlig',
  social: 'Social',
  enterprising: 'Företagsam',
  conventional: 'Konventionell'
}

export function DashboardRiasecChart({ scores, size = 180 }: DashboardRiasecChartProps) {
  const center = size / 2
  const radius = (size / 2) - 25
  const keys: (keyof RiasecScores)[] = ['realistic', 'investigative', 'artistic', 'social', 'enterprising', 'conventional']

  const maxScore = Math.max(...keys.map(k => scores[k]), 1)

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2
    const r = (value / maxScore) * radius
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    }
  }

  const getLabelPoint = (index: number) => {
    const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2
    const labelRadius = radius + 18
    return {
      x: center + labelRadius * Math.cos(angle),
      y: center + labelRadius * Math.sin(angle),
    }
  }

  const polygonPoints = keys.map((key, i) => {
    const point = getPoint(i, scores[key])
    return `${point.x},${point.y}`
  }).join(' ')

  // Aria label
  const sortedScores = keys
    .map(k => ({ key: k, score: scores[k] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  const ariaLabel = `Intresseprofil: ${sortedScores
    .map((s, i) => `${i + 1}. ${RIASEC_NAMES[s.key]} ${Math.round((s.score / maxScore) * 100)}%`)
    .join(', ')}`

  return (
    <figure role="img" aria-label={ariaLabel}>
      <svg width={size} height={size} className="mx-auto" aria-hidden="true">
        {/* Background circles */}
        {[0.33, 0.66, 1].map((level, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={level * radius}
            fill="none"
            className="stroke-stone-200 dark:stroke-stone-700"
            strokeWidth="1"
          />
        ))}

        {/* Axis lines */}
        {keys.map((_, i) => {
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
        })}

        {/* Data polygon - single brand color */}
        <polygon
          points={polygonPoints}
          fill="#0F6E56"
          fillOpacity="0.2"
          stroke="#0F6E56"
          strokeWidth="2"
        />

        {/* Data points */}
        {keys.map((key, i) => {
          const point = getPoint(i, scores[key])
          return (
            <circle
              key={key}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="white"
              stroke="#0F6E56"
              strokeWidth="2"
            />
          )
        })}

        {/* Labels */}
        {keys.map((_, i) => {
          const point = getLabelPoint(i)
          return (
            <text
              key={i}
              x={point.x}
              y={point.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-stone-500 dark:fill-stone-400 text-xs font-medium"
            >
              {RIASEC_LABELS[i]}
            </text>
          )
        })}
      </svg>

      {/* Screen reader table */}
      <table className="sr-only">
        <caption>RIASEC intressepoäng</caption>
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
