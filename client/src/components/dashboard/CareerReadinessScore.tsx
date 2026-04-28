/**
 * Career Readiness Score Component
 * Displays a unified career readiness score based on all progress data
 */

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Target, ChevronRight, FileText, Compass, BookOpen,
  Briefcase, MessageSquare, Heart, TrendingUp, Sparkles
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useUnifiedProgress, type ProgressSection, type Recommendation } from '@/hooks/useUnifiedProgress'

// ============================================
// ICON MAPPING
// ============================================

const iconMap: Record<string, React.ElementType> = {
  FileText,
  Compass,
  BookOpen,
  Briefcase,
  MessageSquare,
  Heart,
}

// ============================================
// SUB-COMPONENTS
// ============================================

function ScoreRing({ score, size = 'lg' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { container: 'w-16 h-16', stroke: 4, text: 'text-lg' },
    md: { container: 'w-24 h-24', stroke: 6, text: 'text-2xl' },
    lg: { container: 'w-32 h-32', stroke: 8, text: 'text-3xl' },
  }

  const { container, stroke, text } = sizes[size]
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const getColor = (s: number) => {
    if (s >= 80) return 'text-emerald-500'
    if (s >= 60) return 'text-blue-500'
    if (s >= 30) return 'text-amber-500'
    return 'text-stone-600'
  }

  return (
    <div className={cn('relative', container)}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          className="text-stone-200"
        />
        {/* Progress circle */}
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          className={getColor(score)}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn('font-bold', text, getColor(score))}>{score}%</span>
      </div>
    </div>
  )
}

function SectionProgressBar({ section }: { section: ProgressSection }) {
  const Icon = iconMap[section.icon] || Target

  const colorClasses: Record<string, string> = {
    violet: 'bg-[var(--c-solid)]',
    indigo: 'bg-sky-500',
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    rose: 'bg-rose-500',
    teal: 'bg-[var(--c-solid)]',
    sky: 'bg-sky-500',
  }

  const bgColor = colorClasses[section.color] || 'bg-stone-500'

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn('w-4 h-4', `text-${section.color}-600`)} />
          <span className="text-sm font-medium text-stone-700">{section.nameSv}</span>
        </div>
        <span className="text-sm text-stone-700">{section.percentage}%</span>
      </div>
      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', bgColor)}
          initial={{ width: 0 }}
          animate={{ width: `${section.percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const priorityColors = {
    high: 'border-l-rose-500 bg-rose-50',
    medium: 'border-l-amber-500 bg-amber-50',
    low: 'border-l-blue-500 bg-blue-50',
  }

  return (
    <Link
      to={recommendation.link}
      className={cn(
        'block p-3 rounded-lg border-l-4 transition-all hover:shadow-sm',
        priorityColors[recommendation.priority]
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-medium text-stone-800 text-sm">{recommendation.title}</h4>
          <p className="text-xs text-stone-600 mt-0.5">{recommendation.description}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-stone-600 flex-shrink-0 mt-0.5" />
      </div>
    </Link>
  )
}

// ============================================
// MAIN COMPONENTS
// ============================================

interface CareerReadinessScoreProps {
  variant?: 'full' | 'compact' | 'minimal'
  showRecommendations?: boolean
  className?: string
}

export function CareerReadinessScore({
  variant = 'full',
  showRecommendations = true,
  className,
}: CareerReadinessScoreProps) {
  const { progress, isLoading } = useUnifiedProgress()

  if (isLoading || !progress) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <div className="flex items-center gap-4 p-6">
          <div className="w-24 h-24 rounded-full bg-stone-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-stone-200 rounded w-1/3" />
            <div className="h-3 bg-stone-200 rounded w-1/2" />
          </div>
        </div>
      </Card>
    )
  }

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <ScoreRing score={progress.careerReadinessScore} size="sm" />
        <div>
          <p className="text-sm font-medium text-stone-700">Karriärberedskap</p>
          <p className="text-xs text-stone-700">{progress.careerReadinessLabel}</p>
        </div>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <Card className={cn('p-4', className)}>
        <div className="flex items-center gap-4">
          <ScoreRing score={progress.careerReadinessScore} size="md" />
          <div className="flex-1">
            <h3 className="font-semibold text-stone-800">Karriärberedskap</h3>
            <p className="text-sm text-stone-600">{progress.careerReadinessLabel}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-stone-700">
              <span>{progress.completedMilestones}/{progress.totalMilestones} områden klara</span>
            </div>
          </div>
          <Link to="/journey">
            <Button variant="outline" size="sm">
              Se detaljer
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  // Full variant
  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-start gap-6 mb-6">
        <ScoreRing score={progress.careerReadinessScore} size="lg" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-5 h-5 text-[var(--c-text)]" />
            <h2 className="text-xl font-bold text-stone-900">Karriärberedskap</h2>
          </div>
          <p className="text-stone-600 mb-3">{progress.careerReadinessLabel}</p>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-stone-600">
                {progress.completedMilestones} av {progress.totalMilestones} områden
              </span>
            </div>
            {progress.hasRiasecProfile && progress.dominantTypes.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-[var(--c-solid)]" />
                <span className="text-stone-600">
                  {progress.dominantTypes[0].nameSv}
                </span>
              </div>
            )}
            {progress.moodStreak > 0 && (
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-stone-600">
                  {progress.moodStreak} dagars streak
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section breakdown */}
      <div className="space-y-3 mb-6">
        <h3 className="text-sm font-semibold text-stone-700">Områden</h3>
        {progress.sections.map(section => (
          <SectionProgressBar key={section.id} section={section} />
        ))}
      </div>

      {/* Recommendations */}
      {showRecommendations && progress.recommendations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-stone-700 mb-3">Rekommenderade nästa steg</h3>
          <div className="space-y-2">
            {progress.recommendations.slice(0, 3).map(rec => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

// ============================================
// WIDGET VERSION FOR DASHBOARD
// ============================================

export function CareerReadinessWidget() {
  const { progress, isLoading } = useUnifiedProgress()

  if (isLoading || !progress) {
    return (
      <Card className="animate-pulse p-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-stone-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-stone-200 rounded w-2/3" />
            <div className="h-3 bg-stone-200 rounded w-1/2" />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Link to="/journey" className="block">
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
          <ScoreRing score={progress.careerReadinessScore} size="sm" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-stone-800 truncate">Karriärberedskap</h3>
            <p className="text-sm text-stone-700">{progress.careerReadinessLabel}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-stone-600" />
        </div>

        {/* Top recommendation */}
        {progress.recommendations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-stone-100">
            <p className="text-xs text-stone-700 mb-1">Nästa steg:</p>
            <p className="text-sm font-medium text-stone-700">
              {progress.recommendations[0].title}
            </p>
          </div>
        )}
      </Card>
    </Link>
  )
}

export default CareerReadinessScore
