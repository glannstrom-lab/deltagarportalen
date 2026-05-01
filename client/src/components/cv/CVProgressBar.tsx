/**
 * CV Progress Bar Component
 * Shows completion progress and score
 */

import { Check, Circle } from '@/components/ui/icons'
import { useCVScore, getScoreColor, getScoreBgColor, getOverallTips } from '@/hooks/useCVScore'
import type { CVData } from '@/services/supabaseApi'

interface CVProgressBarProps {
  data: CVData
  currentStep: number
  onStepClick: (step: number) => void
}

const STEPS = [
  { id: 1, name: 'Grundinfo', key: 'basic' },
  { id: 2, name: 'Profil', key: 'summary' },
  { id: 3, name: 'Erfarenhet', key: 'experience' },
  { id: 4, name: 'Kompetenser', key: 'skills' },
  { id: 5, name: 'Design', key: 'design' },
]

export function CVProgressBar({ data, currentStep, onStepClick }: CVProgressBarProps) {
  const { percentage, sections, total } = useCVScore(data)
  const tips = getOverallTips(percentage)
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-4 mb-6">
      {/* Main progress */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-stone-700">
              Ditt CV är {percentage}% klart
            </span>
            <span className={`text-sm font-bold ${getScoreColor(percentage)}`}>
              {total}/100
            </span>
          </div>
          <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${getScoreBgColor(percentage)}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Tips */}
      <p className="text-sm text-stone-700 mb-4">
        💡 {tips}
      </p>
      
      {/* Step indicators */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
        {STEPS.map((step, index) => {
          const isCompleted = getStepCompletion(step.key, data)
          const isCurrent = currentStep === step.id
          
          return (
            <button
              key={step.id}
              onClick={() => onStepClick(step.id)}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-all
                ${isCurrent
                  ? 'bg-[var(--c-accent)]/40 text-[var(--c-text)] font-medium'
                  : isCompleted
                    ? 'bg-green-50 text-green-700'
                    : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
                }
              `}
            >
              {isCompleted ? (
                <Check className="w-4 h-4" />
              ) : (
                <Circle className={`w-4 h-4 ${isCurrent ? 'fill-[var(--c-accent)]' : ''}`} />
              )}
              <span className="text-sm hidden sm:inline">{step.name}</span>
              <span className="text-sm sm:hidden">{index + 1}</span>
            </button>
          )
        })}
      </div>
      
      {/* Section breakdown */}
      <div className="mt-4 pt-4 border-t border-stone-100">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {sections.map((section) => (
            <div 
              key={section.name}
              className={`p-2 rounded-lg text-center ${
                section.score === section.max 
                  ? 'bg-green-50 text-green-700' 
                  : section.score > 0 
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-stone-50 text-stone-700'
              }`}
            >
              <div className="text-xs font-medium">{section.name}</div>
              <div className="text-lg font-bold">
                {section.score}/{section.max}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function getStepCompletion(stepKey: string, data: CVData): boolean {
  switch (stepKey) {
    case 'basic':
      return !!(data.firstName || data.first_name) && 
             !!(data.lastName || data.last_name) && 
             !!data.email
    case 'summary':
      return (data.summary?.length || 0) > 50
    case 'experience':
      return (data.work_experience?.length || data.workExperience?.length || 0) > 0
    case 'skills':
      return (data.skills?.length || 0) >= 3
    case 'design':
      return !!data.template && !!data.colorScheme
    default:
      return false
  }
}
