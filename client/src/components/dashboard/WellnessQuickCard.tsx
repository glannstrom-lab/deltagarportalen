/**
 * Wellness Quick Card Component for Dashboard
 * Quick mood selection with emoji buttons and streak indication
 * Features: One-tap mood logging, celebration animations, streak tracking
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Heart, Flame, ChevronRight, Sparkles } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface WellnessQuickCardProps {
  moodToday?: number | string | null
  streakDays?: number
  onMoodSelect?: (mood: number) => void
}

const MOOD_OPTIONS = [
  { value: 1, emoji: '😢', label: 'Dåligt', color: 'from-rose-400 to-rose-500' },
  { value: 2, emoji: '😕', label: 'Lite nere', color: 'from-orange-400 to-orange-500' },
  { value: 3, emoji: '😐', label: 'Okej', color: 'from-amber-400 to-yellow-500' },
  { value: 4, emoji: '🙂', label: 'Bra', color: 'from-emerald-400 to-brand-700' },
  { value: 5, emoji: '😊', label: 'Fantastiskt', color: 'from-brand-400 to-cyan-500' },
]

function getMoodFromValue(mood: number | string): typeof MOOD_OPTIONS[0] | undefined {
  const moodMap: Record<string, number> = {
    'terrible': 1,
    'bad': 2,
    'okay': 3,
    'good': 4,
    'great': 5,
  }
  const value = typeof mood === 'string' ? moodMap[mood] || parseInt(mood) : mood
  return MOOD_OPTIONS.find(m => m.value === value)
}

export function WellnessQuickCard({
  moodToday,
  streakDays = 0,
  onMoodSelect
}: WellnessQuickCardProps) {
  const { t } = useTranslation()
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  const currentMood = moodToday ? getMoodFromValue(moodToday) : null
  const hasLoggedToday = !!currentMood

  const handleMoodClick = (mood: number) => {
    setSelectedMood(mood)
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 600)
    onMoodSelect?.(mood)
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-rose-200/60 dark:border-rose-800/40 bg-gradient-to-br from-rose-50 via-pink-50/50 to-white dark:from-rose-900/20 dark:via-pink-900/10 dark:to-stone-900/50  transition-shadow duration-300 hover:">
      {/* Header */}
      <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center  dark:/30">
              <Heart className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-rose-800 dark:text-rose-200">
                {t('dashboard.sidebar.wellness.title', 'Välmående')}
              </h3>
              <p className="text-xs text-rose-600/70 dark:text-rose-400/70">
                {hasLoggedToday ? 'Loggat idag' : 'Hur mår du idag?'}
              </p>
            </div>
          </div>

          {/* Streak badge */}
          {streakDays > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-full">
              <Flame className="w-4 h-4 text-amber-500" aria-hidden="true" />
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                {streakDays}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mood selector or current mood display */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5">
        {hasLoggedToday && currentMood ? (
          // Already logged - show current mood
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/60 dark:bg-stone-800/40 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{currentMood.emoji}</span>
              <div>
                <p className="text-sm font-medium text-stone-700 dark:text-stone-200">
                  {currentMood.label}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Ditt humör idag
                </p>
              </div>
            </div>
            <Link
              to="/wellness"
              className="flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 rounded"
            >
              Historik <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          // Not logged - show mood selector
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              {MOOD_OPTIONS.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => handleMoodClick(mood.value)}
                  className={cn(
                    'relative flex-1 aspect-square rounded-xl flex items-center justify-center transition-all duration-200',
                    'hover:scale-110 active:scale-95',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2',
                    selectedMood === mood.value
                      ? `bg-gradient-to-br ${mood.color}`
                      : 'bg-white/60 dark:bg-stone-800/40 hover:bg-white dark:hover:bg-stone-800/60'
                  )}
                  aria-label={mood.label}
                >
                  <span className={cn(
                    'text-xl sm:text-2xl transition-transform duration-200',
                    selectedMood === mood.value && 'scale-110'
                  )}>
                    {mood.emoji}
                  </span>
                  {selectedMood === mood.value && isAnimating && (
                    <Sparkles
                      className="absolute -top-1 -right-1 w-4 h-4 text-amber-400 animate-confetti"
                      aria-hidden="true"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Quick link to full wellness page */}
            <Link
              to="/wellness"
              className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20"
            >
              Mer detaljerad loggning <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Decorative background element */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br from-rose-200/30 to-pink-200/30 dark:from-rose-800/10 dark:to-pink-800/10 rounded-full blur-2xl pointer-events-none" />
    </div>
  )
}

export default WellnessQuickCard
