/**
 * JourneyAchievements - Display badges and achievements
 */

import { useState } from 'react'
import {
  Trophy, Lock, Star, Award, Crown, Zap,
  LogIn, UserCheck, FileText, FileCheck, Send, Inbox, Briefcase,
  BookOpen, GraduationCap, Edit3, Flame, Compass, Linkedin
} from '@/components/ui/icons'
import { Card } from '@/components/ui'
import type { Achievement } from '@/services/journeyService'

interface JourneyAchievementsProps {
  achievements: Achievement[]
  compact?: boolean
}

const iconMap: Record<string, typeof Trophy> = {
  'log-in': LogIn,
  'user-check': UserCheck,
  'file-text': FileText,
  'file-check': FileCheck,
  'send': Send,
  'inbox': Inbox,
  'briefcase': Briefcase,
  'book-open': BookOpen,
  'graduation-cap': GraduationCap,
  'edit-3': Edit3,
  'flame': Flame,
  'award': Award,
  'compass': Compass,
  'linkedin': Linkedin,
  'crown': Crown,
  'trophy': Trophy
}

const rarityColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  common: {
    bg: 'bg-stone-100',
    border: 'border-stone-200',
    text: 'text-stone-600',
    glow: ''
  },
  uncommon: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-600',
    glow: ''
  },
  rare: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-600',
    glow: 'shadow-blue-200'
  },
  epic: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-600',
    glow: 'shadow-purple-200'
  },
  legendary: {
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
    border: 'border-amber-300',
    text: 'text-amber-600',
    glow: 'shadow-amber-200 shadow-lg'
  }
}

const rarityLabels: Record<string, string> = {
  common: 'Vanlig',
  uncommon: 'Ovanlig',
  rare: 'Sällsynt',
  epic: 'Episk',
  legendary: 'Legendarisk'
}

export function JourneyAchievements({ achievements, compact = false }: JourneyAchievementsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)

  const unlockedCount = achievements.filter(a => a.is_unlocked).length
  const totalCount = achievements.length

  // Group by category
  const categories = Array.from(new Set(achievements.map(a => a.category)))
  const filteredAchievements = selectedCategory
    ? achievements.filter(a => a.category === selectedCategory)
    : achievements

  // Sort: unlocked first, then by sort_order
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    if (a.is_unlocked !== b.is_unlocked) return a.is_unlocked ? -1 : 1
    return (a.sort_order || 0) - (b.sort_order || 0)
  })

  if (compact) {
    // Compact view: just show unlocked badges
    const unlockedAchievements = achievements.filter(a => a.is_unlocked).slice(0, 5)

    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-stone-900">Badges</span>
          </div>
          <span className="text-xs text-stone-700">{unlockedCount}/{totalCount}</span>
        </div>

        <div className="flex gap-2 flex-wrap">
          {unlockedAchievements.map(achievement => {
            const Icon = iconMap[achievement.icon] || Trophy
            const colors = rarityColors[achievement.rarity] || rarityColors.common

            return (
              <div
                key={achievement.id}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${colors.bg} ${colors.border} border-2 ${colors.glow}
                `}
                title={achievement.name}
              >
                <Icon className={`w-5 h-5 ${colors.text}`} />
              </div>
            )
          })}

          {unlockedAchievements.length === 0 && (
            <p className="text-xs text-stone-600">Inga badges ännu</p>
          )}
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-stone-900">Achievements</h3>
            <p className="text-sm text-stone-700">
              {unlockedCount} av {totalCount} upplåsta
            </p>
          </div>
        </div>

        {/* Progress ring */}
        <div className="relative w-16 h-16">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="6"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="6"
              strokeDasharray={`${(unlockedCount / totalCount) * 176} 176`}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-stone-900">
              {Math.round((unlockedCount / totalCount) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`
            px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap
            ${!selectedCategory
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }
          `}
        >
          Alla
        </button>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap capitalize
              ${selectedCategory === category
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }
            `}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Achievements grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {sortedAchievements.map(achievement => {
          const Icon = iconMap[achievement.icon] || Trophy
          const colors = rarityColors[achievement.rarity] || rarityColors.common
          const isUnlocked = achievement.is_unlocked

          return (
            <button
              key={achievement.id}
              onClick={() => setSelectedAchievement(achievement)}
              className={`
                relative p-3 rounded-xl border-2 transition-all flex flex-col items-center
                ${isUnlocked
                  ? `${colors.bg} ${colors.border} ${colors.glow} hover:scale-105`
                  : 'bg-stone-50 border-stone-100 opacity-50'
                }
              `}
            >
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center mb-2
                ${isUnlocked ? colors.bg : 'bg-stone-100'}
              `}>
                {isUnlocked ? (
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                ) : (
                  <Lock className="w-5 h-5 text-stone-600" />
                )}
              </div>
              <span className={`text-xs font-medium text-center line-clamp-2 ${
                isUnlocked ? 'text-stone-700' : 'text-stone-600'
              }`}>
                {achievement.name}
              </span>

              {/* Rarity indicator */}
              {isUnlocked && achievement.rarity !== 'common' && (
                <div className="absolute -top-1 -right-1">
                  <Star className={`w-4 h-4 ${colors.text}`} fill="currentColor" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Achievement detail modal */}
      {selectedAchievement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedAchievement(null)}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            {/* Header with gradient based on rarity */}
            <div className={`
              p-6 text-center
              ${selectedAchievement.rarity === 'legendary'
                ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                : selectedAchievement.rarity === 'epic'
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                  : selectedAchievement.rarity === 'rare'
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                    : selectedAchievement.rarity === 'uncommon'
                      ? 'bg-gradient-to-br from-emerald-500 to-[var(--c-solid)]'
                      : 'bg-gradient-to-br from-stone-500 to-stone-600'
              }
            `}>
              <div className={`
                w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center
                ${selectedAchievement.is_unlocked ? 'bg-white/20' : 'bg-white/10'}
              `}>
                {(() => {
                  const Icon = iconMap[selectedAchievement.icon] || Trophy
                  return selectedAchievement.is_unlocked
                    ? <Icon className="w-10 h-10 text-white" />
                    : <Lock className="w-8 h-8 text-white/60" />
                })()}
              </div>

              <h3 className="text-xl font-bold text-white mb-1">
                {selectedAchievement.name}
              </h3>
              <span className="text-sm text-white/80">
                {rarityLabels[selectedAchievement.rarity]}
              </span>
            </div>

            <div className="p-6">
              <p className="text-stone-600 text-center mb-4">
                {selectedAchievement.description}
              </p>

              <div className="flex items-center justify-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-stone-700">
                  +{selectedAchievement.xp_reward} XP
                </span>
              </div>

              {selectedAchievement.is_unlocked && selectedAchievement.unlocked_at && (
                <p className="text-center text-xs text-stone-600 mt-4">
                  Upplåst {new Date(selectedAchievement.unlocked_at).toLocaleDateString('sv-SE')}
                </p>
              )}

              <button
                onClick={() => setSelectedAchievement(null)}
                className="w-full mt-6 py-2 px-4 bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-700 font-medium transition-colors"
              >
                Stäng
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

export default JourneyAchievements
