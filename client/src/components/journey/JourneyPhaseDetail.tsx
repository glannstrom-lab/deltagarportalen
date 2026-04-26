/**
 * JourneyPhaseDetail - Modal showing phase details and milestones
 */

import { useNavigate } from 'react-router-dom'
import {
  X, Check, Lock, ChevronRight, Sparkles,
  User, FileText, Search, TrendingUp, Settings, Trophy
} from '@/components/ui/icons'
import { Button } from '@/components/ui'
import type { JourneyPhase, PhaseProgress } from '@/types/journey.types'

interface JourneyPhaseDetailProps {
  phase: JourneyPhase
  progress: PhaseProgress
  completedMilestones: string[]
  onClose: () => void
}

const phaseIcons: Record<string, typeof User> = {
  foundation: User,
  preparation: FileText,
  'active-search': Search,
  development: TrendingUp,
  optimization: Settings,
  mastery: Trophy
}

export function JourneyPhaseDetail({
  phase,
  progress,
  completedMilestones,
  onClose
}: JourneyPhaseDetailProps) {
  const navigate = useNavigate()
  const Icon = phaseIcons[phase.key] || Sparkles

  const handleMilestoneClick = (link: string) => {
    onClose()
    navigate(link)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
              <Icon className="w-8 h-8" />
            </div>
            <div>
              <div className="text-sm text-white/80 mb-1">Fas {phase.id}</div>
              <h2 className="text-2xl font-bold">{phase.name}</h2>
              <p className="text-white/80 text-sm mt-1">{phase.description}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-white/80">Framsteg</span>
              <span className="font-medium">
                {progress.milestonesCompleted}/{progress.totalMilestones} milstolpar
              </span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Milestones List */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          <h3 className="text-sm font-medium text-slate-700 uppercase tracking-wide mb-4">
            Milstolpar i denna fas
          </h3>

          <div className="space-y-3">
            {phase.milestones.map((milestone, index) => {
              const isCompleted = completedMilestones.includes(milestone.id) ||
                completedMilestones.includes(milestone.key)

              return (
                <div
                  key={milestone.id}
                  className={`
                    p-4 rounded-xl border-2 transition-all
                    ${isCompleted
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-white border-slate-100 hover:border-indigo-200'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Status Icon */}
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                      ${isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-600'
                      }
                    `}>
                      {isCompleted ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-medium ${isCompleted ? 'text-emerald-800' : 'text-slate-900'}`}>
                          {milestone.name}
                        </h4>
                        <span className={`
                          text-xs px-2 py-0.5 rounded-full
                          ${isCompleted
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-indigo-100 text-indigo-700'
                          }
                        `}>
                          +{milestone.xpReward} XP
                        </span>
                      </div>
                      <p className={`text-sm ${isCompleted ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {milestone.description}
                      </p>
                    </div>

                    {/* Action */}
                    {!isCompleted && milestone.link && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleMilestoneClick(milestone.link!)}
                        className="flex-shrink-0"
                      >
                        Gör
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}

                    {isCompleted && (
                      <span className="text-sm text-emerald-600 flex-shrink-0">
                        Klart!
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50">
          <p className="text-sm text-slate-600 italic text-center">
            "{phase.coachingMessage}"
          </p>
        </div>
      </div>
    </div>
  )
}

export default JourneyPhaseDetail
