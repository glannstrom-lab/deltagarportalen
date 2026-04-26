/**
 * KPI Card Component for Dashboard
 * Modern glassmorphism design with animations and visual hierarchy
 * Features: Gradient backgrounds, hover effects, sparkline mockups, count-up animations
 */

import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from '@/components/ui/icons'

interface KpiCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  subtext?: string
  color?: 'teal' | 'sky' | 'amber' | 'emerald' | 'rose' | 'violet'
  to?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  size?: 'default' | 'large'
}

const colorConfig = {
  teal: {
    gradient: 'from-teal-500 via-teal-500 to-emerald-500',
    darkGradient: 'dark:from-teal-600 dark:via-teal-600 dark:to-emerald-600',
    glow: 'hover:shadow-glow-teal',
    ring: 'ring-teal-400/30',
    icon: 'bg-white/25',
    sparkline: '#5eead4',
  },
  sky: {
    gradient: 'from-sky-500 via-sky-500 to-blue-500',
    darkGradient: 'dark:from-sky-600 dark:via-sky-600 dark:to-blue-600',
    glow: 'hover:shadow-glow-sky',
    ring: 'ring-sky-400/30',
    icon: 'bg-white/25',
    sparkline: '#7dd3fc',
  },
  amber: {
    gradient: 'from-amber-500 via-orange-500 to-orange-500',
    darkGradient: 'dark:from-amber-600 dark:via-orange-600 dark:to-orange-600',
    glow: 'hover:shadow-glow-amber',
    ring: 'ring-amber-400/30',
    icon: 'bg-white/25',
    sparkline: '#fcd34d',
  },
  emerald: {
    gradient: 'from-emerald-500 via-emerald-500 to-green-500',
    darkGradient: 'dark:from-emerald-600 dark:via-emerald-600 dark:to-green-600',
    glow: 'hover:shadow-glow-teal',
    ring: 'ring-emerald-400/30',
    icon: 'bg-white/25',
    sparkline: '#6ee7b7',
  },
  rose: {
    gradient: 'from-rose-500 via-pink-500 to-pink-500',
    darkGradient: 'dark:from-rose-600 dark:via-pink-600 dark:to-pink-600',
    glow: 'hover:shadow-lg',
    ring: 'ring-rose-400/30',
    icon: 'bg-white/25',
    sparkline: '#fda4af',
  },
  violet: {
    gradient: 'from-violet-500 via-purple-500 to-purple-500',
    darkGradient: 'dark:from-violet-600 dark:via-purple-600 dark:to-purple-600',
    glow: 'hover:shadow-lg',
    ring: 'ring-violet-400/30',
    icon: 'bg-white/25',
    sparkline: '#c4b5fd',
  },
}

// Mini sparkline SVG for visual interest
function MiniSparkline({ color }: { color: string }) {
  return (
    <svg
      className="absolute bottom-0 left-0 right-0 h-12 opacity-20"
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
    >
      <path
        d="M0,25 Q10,20 20,22 T40,18 T60,20 T80,15 T100,10"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M0,25 Q10,20 20,22 T40,18 T60,20 T80,15 T100,10 L100,30 L0,30 Z"
        fill={color}
        fillOpacity="0.3"
      />
    </svg>
  )
}

function TrendIndicator({ trend, value }: { trend: 'up' | 'down' | 'neutral'; value?: string }) {
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  return (
    <div className={cn(
      'flex items-center gap-0.5 text-[10px] sm:text-xs font-medium px-1.5 py-0.5 rounded-full',
      trend === 'up' && 'bg-emerald-400/20 text-emerald-100',
      trend === 'down' && 'bg-rose-400/20 text-rose-100',
      trend === 'neutral' && 'bg-white/20 text-white/80'
    )}>
      <Icon className="w-3 h-3" />
      {value && <span>{value}</span>}
    </div>
  )
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  subtext,
  color = 'teal',
  to,
  trend,
  trendValue,
  size = 'default'
}: KpiCardProps) {
  // Ensure value is non-negative for display
  const displayValue = typeof value === 'number' ? Math.max(0, value) : value
  const config = colorConfig[color]

  const content = (
    <div className={cn(
      'relative overflow-hidden rounded-2xl text-white transition-all duration-300',
      'bg-gradient-to-br shadow-bento',
      config.gradient,
      config.darkGradient,
      to && [
        'cursor-pointer',
        'hover:scale-[1.02] hover:shadow-bento-hover',
        'active:scale-[0.98]',
        'focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-teal-600',
        config.glow,
      ],
      size === 'large' ? 'p-4 sm:p-5 md:p-6' : 'p-3 sm:p-4'
    )}>
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5" />

      {/* Inner glow effect */}
      <div className="absolute inset-0 shadow-inner-glow rounded-2xl" />

      {/* Sparkline background */}
      <MiniSparkline color={config.sparkline} />

      {/* Content */}
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={cn(
            'text-white/80 font-medium mb-0.5 truncate',
            size === 'large' ? 'text-xs sm:text-sm' : 'text-[10px] sm:text-xs'
          )}>
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <p className={cn(
              'font-bold animate-fade-in',
              size === 'large' ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-xl sm:text-2xl'
            )}>
              {displayValue}
            </p>
            {trend && <TrendIndicator trend={trend} value={trendValue} />}
          </div>
          {subtext && (
            <p className={cn(
              'text-white/70 mt-0.5 truncate',
              size === 'large' ? 'text-xs sm:text-sm' : 'text-[10px] sm:text-xs'
            )}>
              {subtext}
            </p>
          )}
        </div>

        {/* Icon container with glassmorphism */}
        <div className={cn(
          'rounded-xl flex items-center justify-center shrink-0 backdrop-blur-sm transition-transform duration-300',
          config.icon,
          size === 'large' ? 'w-12 h-12 sm:w-14 sm:h-14' : 'w-9 h-9 sm:w-11 sm:h-11',
          to && 'group-hover:scale-110 group-hover:rotate-3'
        )}>
          <Icon className={cn(
            'text-white',
            size === 'large' ? 'w-6 h-6 sm:w-7 sm:h-7' : 'w-4 h-4 sm:w-5 sm:h-5'
          )} aria-hidden="true" />
        </div>
      </div>
    </div>
  )

  if (to) {
    return (
      <Link
        to={to}
        aria-label={`${label}: ${displayValue}${subtext ? `, ${subtext}` : ''}`}
        className="focus:outline-none block group"
      >
        {content}
      </Link>
    )
  }

  return content
}

export default KpiCard
