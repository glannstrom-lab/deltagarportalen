/**
 * JourneyNextSteps - Shows personalized next actions
 */

import { useNavigate } from 'react-router-dom'
import {
  ChevronRight, Sparkles, Zap, Clock,
  FileText, Search, BookOpen, Send, Bookmark, Award
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import type { NextStep } from '@/types/journey.types'

interface JourneyNextStepsProps {
  steps: NextStep[]
  energyLevel?: 'low' | 'medium' | 'high'
}

const iconMap: Record<string, typeof FileText> = {
  'file-text': FileText,
  'file-plus': FileText,
  'search': Search,
  'book-open': BookOpen,
  'send': Send,
  'bookmark': Bookmark,
  'award': Award,
  'sparkles': Sparkles,
  'percent': Zap,
  'compass': Sparkles,
  'user-plus': Sparkles
}

export function JourneyNextSteps({ steps, energyLevel = 'medium' }: JourneyNextStepsProps) {
  const navigate = useNavigate()

  const energyLabels = {
    low: 'Ta det lugnt',
    medium: 'Steg för steg',
    high: 'Full fart framåt'
  }

  if (steps.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Award className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Fantastiskt jobbat!
          </h3>
          <p className="text-slate-600">
            Du har klarat alla aktuella steg. Fortsätt utforska portalen!
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Nästa steg</h3>
        <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          {energyLabels[energyLevel]}
        </span>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = iconMap[step.milestone.icon] || Sparkles
          const isReady = step.progress >= 80

          return (
            <div
              key={step.milestone.id}
              className={`
                relative p-4 rounded-xl border-2 transition-all
                ${index === 0
                  ? 'border-indigo-200 bg-indigo-50/50'
                  : 'border-slate-100 bg-white hover:border-slate-200'
                }
              `}
            >
              {/* Priority Badge */}
              {index === 0 && (
                <div className="absolute -top-2 -right-2 bg-indigo-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                  Rekommenderat
                </div>
              )}

              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                  ${index === 0
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'bg-slate-100 text-slate-600'
                  }
                `}>
                  <Icon className="w-6 h-6" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-slate-900">
                      {step.milestone.name}
                    </h4>
                    <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                      +{step.milestone.xpReward} XP
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 mb-3">
                    {step.milestone.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isReady ? 'bg-emerald-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${step.progress}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      {step.progress}%
                    </span>
                  </div>

                  {/* Ready Message */}
                  {isReady && (
                    <div className="flex items-center gap-1 mt-2 text-sm text-emerald-600">
                      <Zap className="w-4 h-4" />
                      <span>Du är nästan där!</span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                {step.milestone.link && (
                  <Button
                    variant={index === 0 ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => navigate(step.milestone.link!)}
                    className="flex-shrink-0"
                  >
                    {step.milestone.linkLabel || 'Börja'}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Encouraging Footer */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Clock className="w-4 h-4" />
          <span>Varje steg tar dig närmare målet. Du klarar detta!</span>
        </div>
      </div>
    </Card>
  )
}

export default JourneyNextSteps
