/**
 * Quick Win Button Component
 * "Gör något litet"-knappen som föreslår snabba uppgifter anpassade efter energinivå
 * Förbättrad med:
 * - Mer motiverande texter
 * - Tydligare förklaringar av varför uppgiften hjälper
 * - Tidsuppskattning
 * - Inte nu-knapp för att snooza
 */

import { useState, useMemo, useCallback } from 'react'
import { 
  Zap, 
  ChevronRight, 
  Clock, 
  Check, 
  X,
  Sparkles,
  Info,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEnergyAdaptedContent } from './EnergyLevelSelector'
import type { EnergyLevel } from '@/stores/settingsStore'

interface QuickWinButtonProps {
  variant?: 'floating' | 'card' | 'inline'
  className?: string
}

interface QuickTask {
  label: string
  description: string
  duration: string
  action: string
  whyHelpful: string
}

interface TaskHistory {
  [taskId: string]: {
    completedAt: string
    completedCount: number
  }
}

// Sparad historik i localStorage
function getTaskHistory(): TaskHistory {
  try {
    const stored = localStorage.getItem('quick-win-history')
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function saveTaskHistory(history: TaskHistory): void {
  localStorage.setItem('quick-win-history', JSON.stringify(history))
}

export function QuickWinButton({ variant = 'floating', className }: QuickWinButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())
  const [snoozedTasks, setSnoozedTasks] = useState<Set<string>>(new Set())
  const [showWhy, setShowWhy] = useState<string | null>(null)
  const { energyLevel, getQuickTasks, getEncouragingMessage, getEnergyColor } = useEnergyAdaptedContent()

  const tasks = getQuickTasks()
  const energyColor = getEnergyColor()

  // Prioritera uppgifter baserat på historik
  const prioritizedTasks = useMemo(() => {
    const history = getTaskHistory()
    return [...tasks].sort((a, b) => {
      const aCompleted = history[a.label]?.completedCount || 0
      const bCompleted = history[b.label]?.completedCount || 0
      // Föreslå uppgifter som gjorts färre gånger först
      return aCompleted - bCompleted
    })
  }, [tasks])

  // Filtrera bort snoozade uppgifter
  const availableTasks = useMemo(() => {
    return prioritizedTasks.filter(task => !snoozedTasks.has(task.label))
  }, [prioritizedTasks, snoozedTasks])

  const handleComplete = useCallback((task: QuickTask) => {
    setCompletedTasks(prev => new Set([...prev, task.label]))
    
    // Spara i historik
    const history = getTaskHistory()
    history[task.label] = {
      completedAt: new Date().toISOString(),
      completedCount: (history[task.label]?.completedCount || 0) + 1
    }
    saveTaskHistory(history)

    // Navigera till action efter en kort delay
    setTimeout(() => {
      window.location.href = task.action
    }, 800)
  }, [])

  const handleSnooze = useCallback((task: QuickTask) => {
    setSnoozedTasks(prev => new Set([...prev, task.label]))
    setIsOpen(false)
    
    // Återställ snooze efter 1 dag
    setTimeout(() => {
      setSnoozedTasks(prev => {
        const next = new Set(prev)
        next.delete(task.label)
        return next
      })
    }, 24 * 60 * 60 * 1000)
  }, [])

  const handleDismiss = useCallback(() => {
    setIsOpen(false)
    setShowWhy(null)
  }, [])

  // Färgklasser baserat på energinivå
  const colorClasses = {
    sky: {
      bg: 'bg-sky-500',
      hover: 'hover:bg-sky-600',
      light: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-200',
      ring: 'focus:ring-sky-500'
    },
    amber: {
      bg: 'bg-amber-500',
      hover: 'hover:bg-amber-600',
      light: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      ring: 'focus:ring-amber-500'
    },
    rose: {
      bg: 'bg-rose-500',
      hover: 'hover:bg-rose-600',
      light: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      ring: 'focus:ring-rose-500'
    }
  }[energyColor]

  if (variant === 'inline') {
    return (
      <div className={cn('space-y-2', className)}>
        {availableTasks.slice(0, 3).map((task) => (
          <button
            key={task.label}
            onClick={() => handleComplete(task)}
            disabled={completedTasks.has(task.label)}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left',
              completedTasks.has(task.label)
                ? 'bg-emerald-50 border-emerald-200'
                : `bg-white ${colorClasses.border} hover:${colorClasses.light}`
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
              completedTasks.has(task.label) ? 'bg-emerald-500' : colorClasses.bg
            )}>
              {completedTasks.has(task.label) ? (
                <Check className="w-5 h-5 text-white" />
              ) : (
                <Zap className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className={cn(
                'font-medium text-sm',
                completedTasks.has(task.label) ? 'text-emerald-800 line-through' : 'text-slate-800'
              )}>
                {task.label}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                {task.duration}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        ))}
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className={cn('bg-white rounded-2xl shadow-sm border border-slate-200 p-5', className)}>
        <div className="flex items-center gap-3 mb-4">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colorClasses.bg)}>
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Gör något litet</h3>
            <p className="text-sm text-slate-500">Anpassat efter din energi idag</p>
          </div>
        </div>

        <div className="space-y-3">
          {availableTasks.slice(0, 2).map((task) => (
            <div
              key={task.label}
              className={cn(
                'p-4 rounded-xl border-2 transition-all',
                colorClasses.light,
                colorClasses.border
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5', colorClasses.bg)}>
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('font-medium text-sm', colorClasses.text)}>{task.label}</p>
                  <p className="text-xs text-slate-600 mt-1">{task.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {task.duration}
                    </span>
                    <button
                      onClick={() => setShowWhy(showWhy === task.label ? null : task.label)}
                      className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
                    >
                      <Info className="w-3 h-3" />
                      Varför?
                    </button>
                  </div>
                  {showWhy === task.label && (
                    <p className="mt-2 text-xs text-slate-500 bg-white/70 p-2 rounded-lg animate-in fade-in">
                      {task.whyHelpful}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleComplete(task)}
                  className={cn(
                    'flex-1 py-2 px-4 rounded-lg text-white text-sm font-medium transition-colors',
                    colorClasses.bg,
                    colorClasses.hover
                  )}
                >
                  Gör nu
                </button>
                <button
                  onClick={() => handleSnooze(task)}
                  className="py-2 px-4 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
                >
                  Inte nu
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className={cn('mt-4 p-3 rounded-lg text-sm', colorClasses.light, colorClasses.text)}>
          {getEncouragingMessage()}
        </div>
      </div>
    )
  }

  // Floating variant (default)
  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-full shadow-lg text-white font-medium transition-all hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
          colorClasses.bg,
          colorClasses.hover,
          colorClasses.ring,
          className
        )}
        aria-label="Visa snabba uppgifter"
      >
        <Zap className="w-5 h-5" />
        <span>Gör något litet</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleDismiss}
          role="dialog"
          aria-modal="true"
          aria-label="Snabba uppgifter"
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className={cn('p-6 text-white', colorClasses.bg)}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Gör något litet</h2>
                    <p className="text-white/80 text-sm">
                      Anpassat efter din energi idag
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Stäng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="mt-4 text-white/90 text-sm">
                {getEncouragingMessage()}
              </p>
            </div>

            {/* Task List */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 px-2">
                Föreslagna uppgifter
              </p>
              
              <div className="space-y-2">
                {availableTasks.map((task, index) => (
                  <div
                    key={task.label}
                    className={cn(
                      'group p-4 rounded-xl border-2 transition-all',
                      completedTasks.has(task.label)
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-sm'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors',
                        completedTasks.has(task.label)
                          ? 'bg-emerald-500'
                          : `bg-slate-100 group-hover:${colorClasses.bg}`
                      )}>
                        {completedTasks.has(task.label) ? (
                          <Check className="w-5 h-5 text-white" />
                        ) : (
                          <span className={cn(
                            'text-sm font-bold',
                            completedTasks.has(task.label) ? 'text-white' : 'text-slate-500 group-hover:text-white'
                          )}>
                            {index + 1}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className={cn(
                          'font-semibold',
                          completedTasks.has(task.label) ? 'text-emerald-800 line-through' : 'text-slate-800'
                        )}>
                          {task.label}
                        </h3>
                        <p className="text-sm text-slate-500 mt-0.5">{task.description}</p>
                        
                        <div className="flex items-center gap-3 mt-2">
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            {task.duration}
                          </span>
                          <button
                            onClick={() => setShowWhy(showWhy === task.label ? null : task.label)}
                            className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600"
                          >
                            <Info className="w-3 h-3" />
                            Varför hjälper detta?
                          </button>
                        </div>
                        
                        {showWhy === task.label && (
                          <div className="mt-3 p-3 bg-indigo-50 rounded-lg text-sm text-slate-600 animate-in fade-in">
                            <div className="flex items-start gap-2">
                              <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                              {task.whyHelpful}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {!completedTasks.has(task.label) && (
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleComplete(task)}
                          className={cn(
                            'flex-1 py-2.5 px-4 rounded-lg text-white text-sm font-medium transition-colors',
                            colorClasses.bg,
                            colorClasses.hover
                          )}
                        >
                          Jag gör detta!
                        </button>
                        <button
                          onClick={() => handleSnooze(task)}
                          className="py-2.5 px-4 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 flex items-center gap-1.5"
                        >
                          <Calendar className="w-4 h-4" />
                          Inte nu
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {availableTasks.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 font-medium">Du har snoozat alla uppgifter</p>
                  <p className="text-sm text-slate-500 mt-1">
                    De visas igen imorgon, eller så kan du ändra din energinivå
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <p className="text-xs text-slate-500 text-center">
                💡 Dessa förslag är baserade på din valda energinivå. 
                Du kan ändra den i inställningarna.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default QuickWinButton
