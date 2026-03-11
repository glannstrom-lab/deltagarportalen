/**
 * Getting Started Checklist Component
 * Shows progress for new users and guides them through first steps
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useSettingsStore } from '@/stores/settingsStore'
import {
  Check,
  Circle,
  Sparkles,
  Target,
  FileText,
  Briefcase,
  BookHeart,
  ChevronRight,
  ChevronDown,
  Trophy,
  X
} from 'lucide-react'

interface ChecklistItem {
  id: string
  label: string
  description: string
  icon: typeof Target
  path: string
  checkComplete: () => boolean
}

const checklistItems: ChecklistItem[] = [
  {
    id: 'onboarding',
    label: 'Välj din väg',
    description: 'Välj vad du vill fokusera på först',
    icon: Target,
    path: '/dashboard',
    checkComplete: () => {
      const settings = localStorage.getItem('deltagarportal-settings')
      if (!settings) return false
      try {
        const parsed = JSON.parse(settings)
        return parsed.state?.hasCompletedOnboarding === true
      } catch {
        return false
      }
    },
  },
  {
    id: 'profile',
    label: 'Komplett profil',
    description: 'Fyll i dina grunduppgifter',
    icon: FileText,
    path: '/profile',
    checkComplete: () => {
      // Check if user has filled in basic profile info
      // This would typically check against actual user data
      return false
    },
  },
  {
    id: 'interest',
    label: 'Gör intresseguiden',
    description: 'Upptäck vad som passar dig',
    icon: Sparkles,
    path: '/dashboard/interest-guide',
    checkComplete: () => {
      // Check if interest guide is completed
      return false
    },
  },
  {
    id: 'cv',
    label: 'Skapa ditt CV',
    description: 'Bygg ett CV som sticker ut',
    icon: FileText,
    path: '/dashboard/cv',
    checkComplete: () => {
      // Check if CV has content
      return false
    },
  },
  {
    id: 'job',
    label: 'Spara första jobbet',
    description: 'Hitta och spara ett jobb du gillar',
    icon: Briefcase,
    path: '/dashboard/job-search',
    checkComplete: () => {
      // Check if any jobs are saved
      return false
    },
  },
  {
    id: 'diary',
    label: 'Skriv i dagboken',
    description: 'Reflektera över din resa',
    icon: BookHeart,
    path: '/dashboard/diary',
    checkComplete: () => {
      // Check if diary has entries
      return false
    },
  },
]

interface GettingStartedChecklistProps {
  className?: string
  expanded?: boolean
  onToggle?: () => void
}

export function GettingStartedChecklist({ className, expanded = true, onToggle }: GettingStartedChecklistProps) {
  const navigate = useNavigate()
  const { hasCompletedOnboarding } = useSettingsStore()
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set())
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Check which items are completed
    const completed = new Set<string>()
    checklistItems.forEach(item => {
      if (item.checkComplete()) {
        completed.add(item.id)
      }
    })
    
    // Mark onboarding as complete if store says so
    if (hasCompletedOnboarding) {
      completed.add('onboarding')
    }
    
    setCompletedItems(completed)
  }, [hasCompletedOnboarding])

  const handleItemClick = (item: ChecklistItem) => {
    navigate(item.path)
  }

  const handleDismiss = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setIsDismissed(true)
    // Save dismissal to localStorage
    localStorage.setItem('getting-started-dismissed', 'true')
  }

  // Check if previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('getting-started-dismissed')
    if (dismissed === 'true') {
      // Only show if not all items are completed
      const allCompleted = checklistItems.every(item => {
        if (item.id === 'onboarding') return hasCompletedOnboarding
        return item.checkComplete()
      })
      if (!allCompleted) {
        setIsDismissed(false)
      } else {
        setIsDismissed(true)
      }
    }
  }, [hasCompletedOnboarding])

  if (isDismissed) return null

  const progress = (completedItems.size / checklistItems.length) * 100
  const isComplete = completedItems.size === checklistItems.length

  if (isComplete) {
    return (
      <div className={cn('bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-sm border border-green-200 p-6', className)}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
            <Trophy className="w-7 h-7 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-green-800 text-lg">Grattis! 🎉</h3>
            <p className="text-green-700">
              Du har kommit igång med alla grundsteg. Du är redo att söka jobb!
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden', className)}>
      {/* Collapsible Header */}
      <button 
        onClick={onToggle}
        className="w-full p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-100 text-left hover:from-indigo-100 hover:to-purple-100 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-slate-800">Kom igång</h3>
              <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                {completedItems.size}/{checklistItems.length}
              </span>
            </div>
            <p className="text-sm text-slate-600">
              {expanded 
                ? 'Följ dessa steg för att komma igång med din jobbsökarresa'
                : `${completedItems.size} av ${checklistItems.length} steg klara - klicka för att visa`
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Dölj checklistan"
            >
              <X className="w-4 h-4" />
            </button>
            <ChevronDown 
              className={cn(
                'w-5 h-5 text-slate-400 transition-transform duration-200',
                expanded && 'rotate-180'
              )} 
            />
          </div>
        </div>

        {/* Progress Bar - Always visible */}
        <div className="mt-4">
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </button>

      {/* Collapsible Content */}
      {expanded && (<>

      {/* Checklist Items */}
      <div className="p-4 space-y-2">
        {checklistItems.map((item, index) => {
          const Icon = item.icon
          const isCompleted = completedItems.has(item.id)
          const isPreviousCompleted = index === 0 || completedItems.has(checklistItems[index - 1].id)

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              disabled={!isPreviousCompleted && !isCompleted}
              className={cn(
                'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left',
                isCompleted
                  ? 'bg-green-50 border-green-200 opacity-70'
                  : isPreviousCompleted
                    ? 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                    : 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed'
              )}
            >
              {/* Status Icon */}
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isPreviousCompleted
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-slate-200 text-slate-400'
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className={cn(
                  'font-medium',
                  isCompleted ? 'text-green-800 line-through' : 'text-slate-800'
                )}>
                  {item.label}
                </div>
                <div className="text-sm text-slate-500">{item.description}</div>
              </div>

              {/* Arrow */}
              {!isCompleted && isPreviousCompleted && (
                <ChevronRight className="w-5 h-5 text-slate-300" />
              )}

              {/* Step Number */}
              {isCompleted && (
                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                  Klar!
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-500">
          Du kan alltid hitta denna lista igen under "Hjälp" i menyn
        </p>
      </div>
      </>)}
    </div>
  )
}

export default GettingStartedChecklist
