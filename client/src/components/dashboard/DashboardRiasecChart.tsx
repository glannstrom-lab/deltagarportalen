/**
 * RIASEC Radar Chart Component for Dashboard
 * Modern design with animated polygon, gradient fills, and interactive labels
 * Features: Smooth animations, hover effects, accessible fallback table
 */

import { useState } from 'react'
import type { RiasecScores } from '@/hooks/useInterestProfile'
import { cn } from '@/lib/utils'

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

const RIASEC_COLORS: Record<keyof RiasecScores, { main: string; light: string; gradient: string }> = {
  realistic: { main: '#f59e0b', light: '#fef3c7', gradient: 'from-amber-500 to-orange-500' },
  investigative: { main: '#3b82f6', light: '#dbeafe', gradient: 'from-blue-500 to-indigo-500' },
  artistic: { main: '#8b5cf6', light: '#ede9fe', gradient: 'from-violet-500 to-purple-500' },
  social: { main: '#10b981', light: '#d1fae5', gradient: 'from-emerald-500 to-[var(--c-solid)]' },
  enterprising: { main: '#ef4444', light: '#fee2e2', gradient: 'from-red-500 to-rose-500' },
  conventional: { main: '#6366f1', light: '#e0e7ff', gradient: 'from-indigo-500 to-blue-500' }
}

export function DashboardRiasecChart({ scores, size = 220 }: DashboardRiasecChartProps) {
  const [hoveredType, setHoveredType] = useState<keyof RiasecScores | null>(null)
  const center = size / 2
  const radius = (size / 2) - 35
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

  const getLabelPoint = (index: number) => {
    const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2
    const labelRadius = radius + 22
    return {
      x: center + labelRadius * Math.cos(angle),
      y: center + labelRadius * Math.sin(angle),
    }
  }

  const polygonPoints = keys.map((key, i) => {
    const point = getPoint(i, scores[key])
    return `${point.x},${point.y}`
  }).join(' ')

  // Find top 3 scores for aria-label description
  const sortedScores = keys
    .map(k => ({ key: k, score: scores[k] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  const ariaLabel = `Intresseprofil: Dina topp 3 områden är ${sortedScores
    .map((s, i) => `${i + 1}. ${RIASEC_NAMES[s.key]} (${Math.round((s.score / maxScore) * 100)}%)`)
    .join(', ')}`

  return (
    <figure role="img" aria-label={ariaLabel} className="relative">
      {/* Visual chart - hidden from screen readers */}
      <svg width={size} height={size} className="mx-auto" aria-hidden="true">
        <defs>
          {/* Main gradient fill */}
          <linearGradient id="riasecGradFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.35" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Drop shadow for labels */}
          <filter id="labelShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.15"/>
          </filter>
        </defs>

        {/* Background circles (levels) */}
        {[0.25, 0.5, 0.75, 1].map((level, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={level * radius}
            fill="none"
            className="stroke-stone-200 dark:stroke-stone-700"
            strokeWidth="1"
            strokeDasharray={i < 3 ? "4 4" : "0"}
            opacity={0.6 + i * 0.1}
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
              opacity="0.5"
            />
          )
        })}

        {/* Main polygon with animation */}
        <polygon
          points={polygonPoints}
          fill="url(#riasecGradFill)"
          stroke="url(#riasecGradFill)"
          strokeWidth="2"
          className="transition-all duration-500"
          filter="url(#glow)"
          style={{
            transformOrigin: `${center}px ${center}px`,
          }}
        />

        {/* Polygon stroke with gradient */}
        <polygon
          points={polygonPoints}
          fill="none"
          className="stroke-[var(--c-solid)] dark:stroke-[var(--c-solid)]"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {keys.map((key, i) => {
          const point = getPoint(i, scores[key])
          const isHovered = hoveredType === key
          return (
            <g key={key}>
              {/* Outer ring on hover */}
              <circle
                cx={point.x}
                cy={point.y}
                r={isHovered ? 10 : 6}
                fill={RIASEC_COLORS[key].light}
                className="transition-all duration-200"
                opacity={isHovered ? 1 : 0}
              />
              {/* Main point */}
              <circle
                cx={point.x}
                cy={point.y}
                r={isHovered ? 6 : 5}
                fill="white"
                stroke={RIASEC_COLORS[key].main}
                strokeWidth="2.5"
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredType(key)}
                onMouseLeave={() => setHoveredType(null)}
              />
            </g>
          )
        })}

        {/* Labels */}
        {keys.map((key, i) => {
          const point = getLabelPoint(i)
          const isHovered = hoveredType === key
          const isTop = sortedScores.some((s, idx) => s.key === key && idx < 3)

          return (
            <g
              key={key}
              className="cursor-pointer transition-transform duration-200"
              style={{
                transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                transformOrigin: `${point.x}px ${point.y}px`
              }}
              onMouseEnter={() => setHoveredType(key)}
              onMouseLeave={() => setHoveredType(null)}
              filter="url(#labelShadow)"
            >
              {/* Label background circle */}
              <circle
                cx={point.x}
                cy={point.y}
                r="15"
                fill={RIASEC_COLORS[key].main}
                className={cn(
                  'transition-all duration-200',
                  isHovered && 'filter brightness-110'
                )}
              />
              {/* Label text */}
              <text
                x={point.x}
                y={point.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-white text-[11px] font-bold select-none"
              >
                {shortKeys[i]}
              </text>
              {/* Top indicator */}
              {isTop && (
                <circle
                  cx={point.x + 10}
                  cy={point.y - 10}
                  r="4"
                  fill="#fbbf24"
                  stroke="white"
                  strokeWidth="1.5"
                />
              )}
            </g>
          )
        })}

        {/* Hover tooltip */}
        {hoveredType && (
          <g className="pointer-events-none animate-fade-in">
            <rect
              x={center - 55}
              y={center - 20}
              width="110"
              height="40"
              rx="8"
              fill="white"
              className="dark:fill-stone-800"
              filter="url(#labelShadow)"
            />
            <text
              x={center}
              y={center - 5}
              textAnchor="middle"
              className="fill-stone-700 dark:fill-stone-200 text-xs font-medium"
            >
              {RIASEC_NAMES[hoveredType]}
            </text>
            <text
              x={center}
              y={center + 12}
              textAnchor="middle"
              className="fill-[var(--c-solid)] dark:fill-[var(--c-solid)] text-sm font-bold"
            >
              {Math.round((scores[hoveredType] / maxScore) * 100)}%
            </text>
          </g>
        )}
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
