/**
 * Quick Win Button Component
 * "Gör något litet" - Suggests small 5-minute tasks based on energy level
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEnergyAdaptedContent } from './EnergyLevelSelector'
import { Zap, ChevronRight, Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickWinButtonProps {
  variant?: 'floating' | 'inline' | 'card'
  className?: string
}

export function QuickWinButton({ variant = 'floating', className }: QuickWinButtonProps) {
  const navigate = useNavigate()
  const { getQuickTasks, isLowEnergy } = useEnergyAdaptedContent()
  const [isOpen, setIsOpen] = useState(false)
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())

  const tasks = getQuickTasks()

  const handleTaskClick = (action: string, label: string) => {
    // Mark as completed
    setCompletedTasks(prev => new Set(prev).add(label))
    
    // Navigate after a short delay
    setTimeout(() => {
      navigate(action)
      setIsOpen(false)
    }, 300)
  }

  if (variant === 'floating') {
    return (
      <>
        {/* Floating Action Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300',
            isLowEnergy 
              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600'
              : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600',
            isOpen && 'rotate-45 scale-110',
            className
          )}
          title="Gör något litet"
        >
          <Zap className="w-6 h-6 text-white" />
        </button>

        {/* Task Menu */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu */}
            <div className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-fade-in-up">
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-semibold text-slate-800">Gör något litet</h3>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {isLowEnergy 
                    ? 'Små steg leder också framåt. Välj något som känns hanterbart!'
                    : 'Här är några snabba uppgifter som ger dig framsteg!'
                  }
                </p>
              </div>
              
              <div className="p-2 max-h-80 overflow-y-auto">
                {tasks.map((task, index) => {
                  const isCompleted = completedTasks.has(task.label)
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleTaskClick(task.action, task.label)}
                      disabled={isCompleted}
                      className={cn(
                        'w-full p-3 rounded-xl text-left transition-all duration-200 flex items-center gap-3',
                        isCompleted
                          ? 'bg-green-50 text-green-700'
                          : 'hover:bg-slate-50'
                      )}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : 'bg-indigo-100 text-indigo-600'
                        )}
                      >
                        {isCompleted ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <span className="text-xs font-bold">{index + 1}</span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className={cn(
                          'font-medium text-sm',
                          isCompleted ? 'line-through' : 'text-slate-700'
                        )}>
                          {task.label}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {task.duration}
                        </div>
                      </div>
                      
                      {!isCompleted && (
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </>
    )
  }

  if (variant === 'card') {
    return (
      <div className={cn('bg-white rounded-2xl shadow-sm border border-slate-200 p-6', className)}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-slate-800">Gör något litet</h3>
        </div>
        
        <p className="text-sm text-slate-500 mb-4">
          {isLowEnergy 
            ? 'Små steg leder också framåt. Välj något som känns hanterbart!'
            : 'Här är några snabba uppgifter som ger dig framsteg!'
          }
        </p>
        
        <div className="space-y-2">
          {tasks.slice(0, 3).map((task, index) => {
            const isCompleted = completedTasks.has(task.label)
            
            return (
              <button
                key={index}
                onClick={() => handleTaskClick(task.action, task.label)}
                disabled={isCompleted}
                className={cn(
                  'w-full p-3 rounded-xl text-left transition-all duration-200 flex items-center gap-3 border',
                  isCompleted
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-slate-50 border-slate-100 hover:border-indigo-200 hover:bg-indigo-50'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-indigo-100 text-indigo-600'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    'font-medium text-sm',
                    isCompleted ? 'line-through' : 'text-slate-700'
                  )}>
                    {task.label}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {task.duration}
                  </div>
                </div>
                
                {!isCompleted && (
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Inline variant
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-indigo-500" />
        <h3 className="font-semibold text-slate-800">Gör något litet</h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {tasks.slice(0, 3).map((task, index) => (
          <button
            key={index}
            onClick={() => handleTaskClick(task.action, task.label)}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Zap className="w-3 h-3" />
            {task.label}
            <span className="text-indigo-400">·</span>
            <span className="text-indigo-400 text-xs">{task.duration}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default QuickWinButton
