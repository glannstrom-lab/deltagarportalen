/**
 * Getting Started Checklist Component
 * Progressive disclosure: shows only next 2-3 steps at a time
 * Features:
 * - Clear "Steg X av Y" progress
 * - Time estimates for each step
 * - Snooze/minimize functionality
 * - Celebration animations
 * - Mobile-friendly touch targets (44px min)
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useSettingsStore } from '@/stores/settingsStore'
import {
  Check,
  Sparkles,
  Target,
  FileText,
  Briefcase,
  BookHeart,
  ChevronRight,
  ChevronDown,
  Trophy,
  X,
  User,
  Compass,
  Clock,
  Pause,
  Play
} from '@/components/ui/icons'

interface ChecklistItem {
  id: string
  label: string
  description: string
  estimatedMinutes: number
  icon: typeof Target
  path: string
  checkComplete: () => boolean
}

// Checklist items with time estimates
const checklistItems: ChecklistItem[] = [
  {
    id: 'onboarding',
    label: 'Välj ditt fokus',
    description: 'Berätta vad du vill prioritera så anpassar vi upplevelsen',
    estimatedMinutes: 2,
    icon: Compass,
    path: '/',
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
    label: 'Fyll i din profil',
    description: 'Lägg till dina kontaktuppgifter',
    estimatedMinutes: 3,
    icon: User,
    path: '/profile',
    checkComplete: () => {
      const profile = localStorage.getItem('profile-data')
      if (!profile) return false
      try {
        const parsed = JSON.parse(profile)
        return parsed.firstName && parsed.email
      } catch {
        return false
      }
    },
  },
  {
    id: 'interest',
    label: 'Gör intresseguiden',
    description: 'Upptäck vilka yrken som passar dig',
    estimatedMinutes: 10,
    icon: Sparkles,
    path: '/interest-guide',
    checkComplete: () => {
      const interest = localStorage.getItem('interest-result')
      return !!interest
    },
  },
  {
    id: 'cv',
    label: 'Skapa ditt CV',
    description: 'Bygg ett professionellt CV',
    estimatedMinutes: 15,
    icon: FileText,
    path: '/cv',
    checkComplete: () => {
      const cv = localStorage.getItem('cv-data')
      if (!cv) return false
      try {
        const parsed = JSON.parse(cv)
        return parsed.firstName && (parsed.workExperience?.length > 0 || parsed.skills?.length > 0)
      } catch {
        return false
      }
    },
  },
  {
    id: 'job',
    label: 'Spara ett jobb',
    description: 'Hitta ett intressant jobb att spara',
    estimatedMinutes: 5,
    icon: Briefcase,
    path: '/job-search',
    checkComplete: () => {
      const savedJobs = localStorage.getItem('saved-jobs')
      if (!savedJobs) return false
      try {
        const parsed = JSON.parse(savedJobs)
        return Array.isArray(parsed) && parsed.length > 0
      } catch {
        return false
      }
    },
  },
  {
    id: 'diary',
    label: 'Skriv i dagboken',
    description: 'Reflektera över din jobbresa',
    estimatedMinutes: 5,
    icon: BookHeart,
    path: '/diary',
    checkComplete: () => {
      const diary = localStorage.getItem('diary-entries')
      if (!diary) return false
      try {
        const parsed = JSON.parse(diary)
        return Array.isArray(parsed) && parsed.length > 0
      } catch {
        return false
      }
    },
  },
]

// How many steps to show at once (progressive disclosure)
const STEPS_TO_SHOW = 3

interface GettingStartedChecklistProps {
  className?: string
  expanded?: boolean
  onToggle?: () => void
}

export function GettingStartedChecklist({ className, expanded = true, onToggle }: GettingStartedChecklistProps) {
  const navigate = useNavigate()
  const { hasCompletedOnboarding } = useSettingsStore()
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set())
  const [isSnoozed, setIsSnoozed] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [recentlyCompleted, setRecentlyCompleted] = useState<string | null>(null)

  // Check completed items
  useEffect(() => {
    const completed = new Set<string>()
    checklistItems.forEach(item => {
      if (item.checkComplete()) {
        completed.add(item.id)
      }
    })
    if (hasCompletedOnboarding) {
      completed.add('onboarding')
    }
    setCompletedItems(completed)
  }, [hasCompletedOnboarding])

  // Check snooze/dismiss state
  useEffect(() => {
    const snoozedUntil = localStorage.getItem('checklist-snoozed-until')
    if (snoozedUntil) {
      const snoozeTime = parseInt(snoozedUntil, 10)
      if (Date.now() < snoozeTime) {
        setIsSnoozed(true)
      } else {
        localStorage.removeItem('checklist-snoozed-until')
      }
    }

    const dismissed = localStorage.getItem('getting-started-dismissed')
    if (dismissed === 'true') {
      const allCompleted = checklistItems.every(item => {
        if (item.id === 'onboarding') return hasCompletedOnboarding
        return item.checkComplete()
      })
      setIsDismissed(allCompleted)
    }
  }, [hasCompletedOnboarding])

  // Detect newly completed items
  useEffect(() => {
    const checkForNewCompletions = () => {
      const newlyCompleted = checklistItems.find(item => {
        const isNowComplete = item.checkComplete()
        const wasComplete = completedItems.has(item.id)
        return isNowComplete && !wasComplete
      })

      if (newlyCompleted) {
        setRecentlyCompleted(newlyCompleted.id)
        setTimeout(() => setRecentlyCompleted(null), 3000)
      }
    }

    checkForNewCompletions()
  }, [completedItems])

  const handleItemClick = (item: ChecklistItem) => {
    navigate(item.path)
  }

  const handleSnooze = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Snooze for 24 hours
    const snoozeUntil = Date.now() + 24 * 60 * 60 * 1000
    localStorage.setItem('checklist-snoozed-until', snoozeUntil.toString())
    setIsSnoozed(true)
  }

  const handleUnsnooze = () => {
    localStorage.removeItem('checklist-snoozed-until')
    setIsSnoozed(false)
  }

  const handleDismiss = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setIsDismissed(true)
    localStorage.setItem('getting-started-dismissed', 'true')
  }

  if (isDismissed) return null

  const completedCount = completedItems.size
  const totalCount = checklistItems.length
  const progress = (completedCount / totalCount) * 100
  const isAllComplete = completedCount === totalCount

  // Get incomplete items for progressive disclosure
  const incompleteItems = checklistItems.filter(item => !completedItems.has(item.id))
  const visibleSteps = incompleteItems.slice(0, STEPS_TO_SHOW)
  const hiddenStepsCount = Math.max(0, incompleteItems.length - STEPS_TO_SHOW)

  // Calculate time remaining
  const totalMinutesRemaining = incompleteItems.reduce((sum, item) => sum + item.estimatedMinutes, 0)

  // All complete celebration
  if (isAllComplete) {
    return (
      <div className={cn(
        'bg-gradient-to-r from-emerald-50 via-[var(--c-bg)] to-cyan-50 rounded-2xl shadow-sm border border-emerald-200 p-6 animate-in fade-in slide-in-from-bottom-4',
        className
      )}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center animate-bounce">
            <Trophy className="w-7 h-7 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-emerald-800 text-lg">Alla steg klara! 🎉</h3>
            <p className="text-emerald-700 text-sm">
              Du har slutfört alla kom-igång-steg. Fortsätt utforska appen!
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-2 min-w-[44px] min-h-[44px] text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
            aria-label="Stäng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  // Snoozed state - compact
  if (isSnoozed) {
    return (
      <div className={cn('bg-stone-50 rounded-xl border border-stone-200 p-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Pause className="w-5 h-5 text-stone-600" />
            <div>
              <p className="text-sm font-medium text-stone-700">Kom igång pausad</p>
              <p className="text-xs text-stone-700">Klicka för att fortsätta</p>
            </div>
          </div>
          <button
            onClick={handleUnsnooze}
            className="flex items-center gap-2 px-3 py-2 min-h-[44px] text-sm font-medium text-[var(--c-text)] hover:bg-[var(--c-bg)] rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" />
            Fortsätt
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden', className)}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-5 bg-gradient-to-r from-[var(--c-bg)] to-sky-50 border-b border-stone-100 text-left hover:from-[var(--c-accent)]/40 hover:to-sky-100 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--c-solid)] min-h-[44px]"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-[var(--c-accent)]/40 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[var(--c-text)]" />
              </div>
              <div>
                <h3 className="font-bold text-stone-800">Steg {completedCount + 1} av {totalCount}</h3>
                <p className="text-xs text-stone-700">
                  ~{totalMinutesRemaining} min kvar
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--c-solid)] to-sky-500 transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleSnooze}
              className="p-2 min-w-[44px] min-h-[44px] text-stone-600 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
              title="Pausa i 24 timmar"
            >
              <Pause className="w-4 h-4" />
            </button>
            <ChevronDown
              className={cn(
                'w-5 h-5 text-stone-600 transition-transform',
                expanded && 'rotate-180'
              )}
            />
          </div>
        </div>
      </button>

      {/* Content - Progressive Steps */}
      {expanded && (
        <div className="p-4 space-y-3">
          {visibleSteps.map((item, index) => {
            const Icon = item.icon
            const isNext = index === 0
            const isRecent = recentlyCompleted === item.id

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left group min-h-[44px]',
                  isNext
                    ? 'border-[var(--c-accent)]/60 bg-[var(--c-bg)] hover:bg-[var(--c-accent)]/40 hover:border-[var(--c-accent)]'
                    : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50',
                  isRecent && 'ring-2 ring-emerald-400 animate-pulse'
                )}
              >
                <div className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110',
                  isNext ? 'bg-[var(--c-solid)] text-white' : 'bg-stone-100 text-stone-700 group-hover:bg-stone-200'
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'font-semibold',
                      isNext ? 'text-stone-800' : 'text-stone-700'
                    )}>
                      {item.label}
                    </span>
                    {isNext && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-[var(--c-solid)] text-white rounded-full">
                        NÄSTA
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-stone-700 mt-0.5">{item.description}</p>
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-stone-600">
                    <Clock className="w-3 h-3" />
                    <span>~{item.estimatedMinutes} min</span>
                  </div>
                </div>
                <ChevronRight className={cn(
                  'w-5 h-5 transition-all',
                  isNext ? 'text-[var(--c-solid)] group-hover:text-[var(--c-text)]' : 'text-stone-300 group-hover:text-stone-600',
                  'group-hover:translate-x-0.5'
                )} />
              </button>
            )
          })}

          {/* Hidden steps indicator */}
          {hiddenStepsCount > 0 && (
            <p className="text-center text-sm text-stone-600 py-2">
              +{hiddenStepsCount} fler steg kommer att visas
            </p>
          )}

          {/* Completed steps summary */}
          {completedCount > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
              <Check className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-emerald-600 font-medium">
                {completedCount} {completedCount === 1 ? 'steg' : 'steg'} klart
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default GettingStartedChecklist
