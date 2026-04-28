/**
 * JourneyMap - Visual representation of the journey phases
 */

import { useState } from 'react'
import {
  User, FileText, Search, TrendingUp, Settings, Trophy,
  Check, Lock, ChevronRight
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import type { JourneyPhase, PhaseProgress } from '@/types/journey.types'

interface JourneyMapProps {
  phases: JourneyPhase[]
  currentPhaseId: number
  phaseProgress: Record<number, PhaseProgress>
  onPhaseClick: (phase: JourneyPhase) => void
}

const phaseIcons: Record<string, typeof User> = {
  foundation: User,
  preparation: FileText,
  'active-search': Search,
  development: TrendingUp,
  optimization: Settings,
  mastery: Trophy
}

export function JourneyMap({ phases, currentPhaseId, phaseProgress, onPhaseClick }: JourneyMapProps) {
  const [hoveredPhase, setHoveredPhase] = useState<number | null>(null)

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-stone-900 mb-6">Din Jobbresa</h3>

      {/* Desktop: Horizontal Path */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Connection Line */}
          <div className="absolute top-8 left-8 right-8 h-1 bg-stone-200 rounded-full" />
          <div
            className="absolute top-8 left-8 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{
              width: `${((currentPhaseId - 1) / (phases.length - 1)) * 100}%`,
              maxWidth: 'calc(100% - 4rem)'
            }}
          />

          {/* Phase Nodes */}
          <div className="relative flex justify-between">
            {phases.map((phase) => {
              const Icon = phaseIcons[phase.key] || User
              const progress = phaseProgress[phase.id]
              const isCompleted = progress?.isCompleted
              const isCurrent = phase.id === currentPhaseId
              const isLocked = phase.id > currentPhaseId + 1

              return (
                <div
                  key={phase.id}
                  className="flex flex-col items-center"
                  onMouseEnter={() => setHoveredPhase(phase.id)}
                  onMouseLeave={() => setHoveredPhase(null)}
                >
                  <button
                    onClick={() => !isLocked && onPhaseClick(phase)}
                    disabled={isLocked}
                    className={`
                      relative w-16 h-16 rounded-full flex items-center justify-center
                      transition-all duration-300 transform
                      ${isCompleted
                        ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-200'
                        : isCurrent
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200 scale-110'
                          : isLocked
                            ? 'bg-stone-100 text-stone-600 cursor-not-allowed'
                            : 'bg-white border-2 border-stone-200 text-stone-600 hover:border-indigo-300 hover:shadow-md'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-7 h-7" />
                    ) : isLocked ? (
                      <Lock className="w-6 h-6" />
                    ) : (
                      <Icon className="w-7 h-7" />
                    )}

                    {/* Progress Ring */}
                    {!isCompleted && !isLocked && progress && progress.progress > 0 && (
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="30"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeDasharray={`${progress.progress * 1.88} 188`}
                          className="text-indigo-400 opacity-50"
                        />
                      </svg>
                    )}
                  </button>

                  {/* Phase Label */}
                  <div className="mt-3 text-center">
                    <div className={`text-sm font-medium ${isCurrent ? 'text-indigo-600' : 'text-stone-700'}`}>
                      {phase.name}
                    </div>
                    {progress && (
                      <div className="text-xs text-stone-700">
                        {progress.milestonesCompleted}/{progress.totalMilestones}
                      </div>
                    )}
                  </div>

                  {/* Hover Tooltip */}
                  {hoveredPhase === phase.id && !isLocked && (
                    <div className="absolute top-20 mt-8 bg-stone-900 text-white text-xs rounded-lg px-3 py-2 max-w-[200px] z-10 shadow-xl">
                      <div className="font-medium mb-1">{phase.name}</div>
                      <div className="text-stone-300">{phase.description}</div>
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-stone-900" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mobile: Vertical List */}
      <div className="md:hidden space-y-3">
        {phases.map((phase) => {
          const Icon = phaseIcons[phase.key] || User
          const progress = phaseProgress[phase.id]
          const isCompleted = progress?.isCompleted
          const isCurrent = phase.id === currentPhaseId
          const isLocked = phase.id > currentPhaseId + 1

          return (
            <button
              key={phase.id}
              onClick={() => !isLocked && onPhaseClick(phase)}
              disabled={isLocked}
              className={`
                w-full flex items-center gap-4 p-4 rounded-xl transition-all
                ${isCompleted
                  ? 'bg-emerald-50 border-2 border-emerald-200'
                  : isCurrent
                    ? 'bg-indigo-50 border-2 border-indigo-300'
                    : isLocked
                      ? 'bg-stone-50 opacity-60'
                      : 'bg-white border-2 border-stone-100 hover:border-indigo-200'
                }
              `}
            >
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center
                ${isCompleted
                  ? 'bg-emerald-500 text-white'
                  : isCurrent
                    ? 'bg-indigo-500 text-white'
                    : 'bg-stone-100 text-stone-700'
                }
              `}>
                {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
              </div>

              <div className="flex-1 text-left">
                <div className="font-medium text-stone-900">{phase.name}</div>
                <div className="text-sm text-stone-700">{phase.description}</div>
                {progress && (
                  <div className="mt-2 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                )}
              </div>

              {!isLocked && <ChevronRight className="w-5 h-5 text-stone-600" />}
              {isLocked && <Lock className="w-5 h-5 text-stone-300" />}
            </button>
          )
        })}
      </div>
    </Card>
  )
}

export default JourneyMap
