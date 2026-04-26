/**
 * Recommendations Panel
 * Displays AI-powered personalized recommendations based on user activity
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles, ChevronRight, Loader2, RefreshCw,
  FileText, Mail, Search, Users, Target, TrendingUp,
  Compass, Linkedin, Calendar, Clock
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { recommendationService, type Recommendation } from '@/services/recommendationService'
import { cn } from '@/lib/utils'

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  FileText,
  Mail,
  Search,
  Users,
  Target,
  TrendingUp,
  Compass,
  Linkedin,
  Calendar
}

interface RecommendationsPanelProps {
  maxRecommendations?: number
  showTitle?: boolean
  compact?: boolean
}

export function RecommendationsPanel({
  maxRecommendations = 3,
  showTitle = true,
  compact = false
}: RecommendationsPanelProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadRecommendations()
  }, [maxRecommendations])

  const loadRecommendations = async () => {
    setIsLoading(true)
    try {
      const recs = await recommendationService.getTopRecommendations(maxRecommendations)
      setRecommendations(recs)
    } catch (error) {
      console.error('Failed to load recommendations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshRecommendations = async () => {
    setIsRefreshing(true)
    try {
      const recs = await recommendationService.getTopRecommendations(maxRecommendations)
      setRecommendations(recs)
    } catch (error) {
      console.error('Failed to refresh recommendations:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const getPriorityColor = (priority: Recommendation['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 dark:border-l-red-400'
      case 'medium':
        return 'border-l-amber-500 dark:border-l-amber-400'
      case 'low':
        return 'border-l-teal-500 dark:border-l-teal-400'
    }
  }

  const getPriorityBadge = (priority: Recommendation['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      case 'medium':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
      case 'low':
        return 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
    }
  }

  const getPriorityLabel = (priority: Recommendation['priority']) => {
    switch (priority) {
      case 'high':
        return 'Hög'
      case 'medium':
        return 'Medel'
      case 'low':
        return 'Låg'
    }
  }

  if (isLoading) {
    return (
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
          <Loader2 className="w-6 h-6 animate-spin text-teal-600 mr-2" aria-hidden="true" />
          <span className="text-gray-600 dark:text-gray-400">Analyserar din aktivitet...</span>
        </div>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card className="p-6 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 border-teal-200 dark:border-teal-800">
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          </div>
          <h3 className="font-semibold text-teal-900 dark:text-teal-100 mb-1">Fantastiskt jobbat!</h3>
          <p className="text-sm text-teal-700 dark:text-teal-300">
            Du har slutfört alla rekommenderade uppgifter. Fortsätt det goda arbetet!
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 overflow-hidden"
      role="region"
      aria-label="Personliga rekommendationer"
    >
      {showTitle && (
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-b border-violet-100 dark:border-violet-800/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="font-semibold text-violet-900 dark:text-violet-100">Rekommenderat för dig</h2>
              <p className="text-xs text-violet-600 dark:text-violet-400">Baserat på din aktivitet</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshRecommendations}
            disabled={isRefreshing}
            className="text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/40"
            aria-label="Uppdatera rekommendationer"
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
          </Button>
        </div>
      )}

      <div className={cn('divide-y divide-stone-100 dark:divide-stone-700', compact && 'text-sm')}>
        {recommendations.map((rec) => {
          const Icon = iconMap[rec.icon] || Target

          return (
            <Link
              key={rec.id}
              to={rec.actionPath}
              className={cn(
                'block px-4 py-4 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors border-l-4',
                getPriorityColor(rec.priority)
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  rec.priority === 'high'
                    ? 'bg-red-100 dark:bg-red-900/30'
                    : rec.priority === 'medium'
                    ? 'bg-amber-100 dark:bg-amber-900/30'
                    : 'bg-teal-100 dark:bg-teal-900/30'
                )}>
                  <Icon className={cn(
                    'w-5 h-5',
                    rec.priority === 'high'
                      ? 'text-red-600 dark:text-red-400'
                      : rec.priority === 'medium'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-teal-600 dark:text-teal-400'
                  )} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {rec.title}
                    </h3>
                    <span className={cn(
                      'px-1.5 py-0.5 text-xs font-medium rounded',
                      getPriorityBadge(rec.priority)
                    )}>
                      {getPriorityLabel(rec.priority)}
                    </span>
                  </div>

                  {!compact && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {rec.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {rec.reason}
                    </span>
                    {rec.estimatedTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {rec.estimatedTime}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-medium text-teal-600 dark:text-teal-400 hidden sm:inline">
                    {rec.action}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {recommendations.length >= maxRecommendations && (
        <div className="px-4 py-3 bg-stone-50 dark:bg-stone-900/50 border-t border-stone-100 dark:border-stone-700">
          <Link
            to="/recommendations"
            className="text-sm text-teal-600 dark:text-teal-400 hover:underline flex items-center justify-center gap-1"
          >
            Visa alla rekommendationer
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </Card>
  )
}

export default RecommendationsPanel
