/**
 * JourneyProgress - Hero section showing user's overall journey progress
 */

import { Trophy, Flame, TrendingUp, Star } from 'lucide-react'
import { Card } from '@/components/ui'
import type { UserJourneyProgress, JourneyPhase } from '@/types/journey.types'

interface JourneyProgressProps {
  progress: UserJourneyProgress
  currentPhase: JourneyPhase
}

export function JourneyProgress({ progress, currentPhase }: JourneyProgressProps) {
  const levelProgress = progress.nextLevelXP > 0
    ? Math.round((progress.totalXP / progress.nextLevelXP) * 100)
    : 100

  return (
    <Card className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white border-0">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        {/* Avatar and Level */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <Trophy className="w-10 h-10 text-yellow-300" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
              Nivå {progress.level}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold">{progress.levelTitle}</h2>
            <p className="text-white/80 text-sm">
              Fas {progress.currentPhase}: {currentPhase.name}
            </p>
          </div>
        </div>

        {/* XP Progress */}
        <div className="flex-1">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-white/80">
              {progress.totalXP} / {progress.nextLevelXP} XP
            </span>
            <span className="font-medium">
              {levelProgress}% till nästa nivå
            </span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, levelProgress)}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 md:gap-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-300" />
            </div>
            <div>
              <div className="text-xl font-bold">{progress.currentStreak}</div>
              <div className="text-xs text-white/70">dagars streak</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <div className="text-xl font-bold">{progress.phasesCompleted}</div>
              <div className="text-xs text-white/70">faser klara</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="text-xl font-bold">{progress.milestonesCompleted.length}</div>
              <div className="text-xs text-white/70">milstolpar</div>
            </div>
          </div>
        </div>
      </div>

      {/* Coaching Message */}
      <div className="mt-6 pt-4 border-t border-white/20">
        <p className="text-white/90 text-sm italic">
          "{currentPhase.coachingMessage}"
        </p>
      </div>
    </Card>
  )
}

export default JourneyProgress
