/**
 * Beginner Learning Path
 * Step-by-step guide for new job seekers
 */

import { useState } from 'react'
import { ChevronRight, CheckCircle2, Circle, Lock, Unlock, Trophy, ArrowRight } from '@/components/ui/icons'
import { Card, Button, Progress } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Step {
  id: string
  title: string
  description: string
  duration: string
  type: 'article' | 'video' | 'exercise' | 'action'
  isLocked?: boolean
  isCompleted?: boolean
}

const beginnerSteps: Step[] = [
  {
    id: 'step-1',
    title: 'Välkommen till jobbsökning',
    description: 'Förstå grunderna och sätt realistiska förväntningar',
    duration: '5 min',
    type: 'article',
    isCompleted: false,
  },
  {
    id: 'step-2',
    title: 'Identifiera dina styrkor',
    description: 'Gör en enkel styrkeinventering',
    duration: '10 min',
    type: 'exercise',
    isLocked: true,
  },
  {
    id: 'step-3',
    title: 'Skriv ditt första CV',
    description: 'Steg-för-steg guide till ett grundläggande CV',
    duration: '20 min',
    type: 'article',
    isLocked: true,
  },
  {
    id: 'step-4',
    title: 'Övning: Fyll i CV-mallen',
    description: 'Praktisk övning med vår mall',
    duration: '30 min',
    type: 'exercise',
    isLocked: true,
  },
  {
    id: 'step-5',
    title: 'Personligt brev – grunderna',
    description: 'Lär dig strukturen och skriv ett öppningsstycke',
    duration: '15 min',
    type: 'article',
    isLocked: true,
  },
  {
    id: 'step-6',
    title: 'Hitta lediga jobb',
    description: 'Var och hur du söker efter relevanta tjänster',
    duration: '10 min',
    type: 'article',
    isLocked: true,
  },
  {
    id: 'step-7',
    title: 'Gör din första ansökan',
    description: 'Skicka in en ansökan med hjälp av vår guide',
    duration: '45 min',
    type: 'action',
    isLocked: true,
  },
  {
    id: 'step-8',
    title: 'Förbered dig för intervju',
    description: 'Vanliga frågor och hur du svarar på dem',
    duration: '20 min',
    type: 'article',
    isLocked: true,
  },
]

export function BeginnerPath() {
  const [steps, setSteps] = useState<Step[]>(beginnerSteps)
  const [currentStep, setCurrentStep] = useState(0)
  
  const completedCount = steps.filter(s => s.isCompleted).length
  const progress = (completedCount / steps.length) * 100
  
  const handleStepClick = (index: number) => {
    if (steps[index].isLocked) return
    setCurrentStep(index)
  }
  
  const handleComplete = (index: number) => {
    const newSteps = [...steps]
    newSteps[index].isCompleted = true
    
    // Unlock next step
    if (index < newSteps.length - 1) {
      newSteps[index + 1].isLocked = false
    }
    
    setSteps(newSteps)
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Trophy className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">
              Jobbsökare – Nybörjare
            </h2>
            <p className="text-slate-600 mt-1">
              En strukturerad väg från ingenting till din första ansökan. 
              Ta det i din egen takt – det är okej att pausa!
            </p>
            
            {/* Progress */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-600">Din progress</span>
                <span className="font-medium text-emerald-600">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-slate-500 mt-2">
                {completedCount} av {steps.length} steg avklarade
              </p>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isCurrent = currentStep === index
          const isClickable = !step.isLocked
          
          return (
            <Card
              key={step.id}
              className={cn(
                "transition-all",
                step.isLocked && "opacity-60",
                isClickable && "hover:shadow-md cursor-pointer",
                isCurrent && "ring-2 ring-emerald-200"
              )}
              onClick={() => handleStepClick(index)}
            >
              <div className="flex items-start gap-4">
                {/* Status icon */}
                <div className="shrink-0">
                  {step.isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : step.isLocked ? (
                    <Lock className="w-6 h-6 text-slate-400" />
                  ) : (
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium",
                      isCurrent
                        ? "border-emerald-500 text-emerald-600 bg-emerald-50"
                        : "border-slate-300 text-slate-500"
                    )}>
                      {index + 1}
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className={cn(
                        "font-semibold",
                        step.isCompleted && "text-slate-500 line-through"
                      )}>
                        {step.title}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {step.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                        <span className="capitalize px-2 py-0.5 bg-slate-100 rounded">
                          {step.type === 'article' && '📖 Artikel'}
                          {step.type === 'video' && '🎥 Video'}
                          {step.type === 'exercise' && '✏️ Övning'}
                          {step.type === 'action' && '🚀 Handling'}
                        </span>
                        <span>{step.duration}</span>
                      </div>
                    </div>
                    
                    {/* Action button */}
                    {!step.isLocked && !step.isCompleted && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleComplete(index)
                        }}
                      >
                        Markera klar
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Arrow */}
                {!step.isLocked && (
                  <ChevronRight className={cn(
                    "w-5 h-5 shrink-0",
                    isCurrent ? "text-emerald-500" : "text-slate-300"
                  )} />
                )}
              </div>
            </Card>
          )
        })}
      </div>
      
      {/* Completion message */}
      {completedCount === steps.length && (
        <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-100 text-center py-8">
          <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900">Grattis! 🎉</h3>
          <p className="text-slate-600 mt-2 max-w-md mx-auto">
            Du har gått igenom hela nybörjarvänden! Du är nu redo att söka jobb på egen hand.
            Kom ihåg att vi finns här om du behöver stöd.
          </p>
          <Button className="mt-4">
            Utforska fler lärandevägar
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Card>
      )}
    </div>
  )
}
