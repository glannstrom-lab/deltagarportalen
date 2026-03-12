/**
 * Getting Started Checklist Component
 * Shows progress for new users and guides them through first steps
 * Förbättrad med:
 * - Mikrobelöningar och firande
 * - Kontextuell hjälp och "Varför"-beskrivningar
 * - Kollapsade klara steg
 * - Mindre skuldbeläggande design
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
  X,
  User,
  Compass,
  HelpCircle
} from 'lucide-react'

interface ChecklistItem {
  id: string
  label: string
  description: string
  whyItHelps: string
  icon: typeof Target
  path: string
  checkComplete: () => boolean
}

// Förbättrade checklist-items med "Varför det hjälper dig"
const checklistItems: ChecklistItem[] = [
  {
    id: 'onboarding',
    label: 'Välj din väg',
    description: 'Berätta vad du vill fokusera på först – vi anpassar efter dig',
    whyItHelps: 'Att välja fokus hjälper oss visa dig rätt innehåll i rätt ordning',
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
    label: 'Berätta om dig själv',
    description: 'Fyll i dina kontaktuppgifter så arbetsgivare kan nå dig',
    whyItHelps: 'Ett komplett CV ökar dina chanser att bli kallad till intervju med 40%',
    icon: User,
    path: '/profile',
    checkComplete: () => {
      // Check if user has filled in basic profile info
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
    label: 'Upptäck dina styrkor',
    description: 'Gör vår intresseguide och se vilka yrken som passar dig',
    whyItHelps: 'Att förstå dina intressen hjälper dig hitta ett jobb där du trivs',
    icon: Sparkles,
    path: '/interest-guide',
    checkComplete: () => {
      const interest = localStorage.getItem('interest-result')
      return !!interest
    },
  },
  {
    id: 'cv',
    label: 'Bygg ditt CV',
    description: 'Skapa ett CV som visar vem du är och vad du kan',
    whyItHelps: 'Ett välskrivet CV är din biljett till intervjuer',
    icon: FileText,
    path: '/cv',
    checkComplete: () => {
      const cv = localStorage.getItem('cv-data')
      if (!cv) return false
      try {
        const parsed = JSON.parse(cv)
        // Consider complete if at least personal info + one section exists
        return parsed.firstName && (parsed.workExperience?.length > 0 || parsed.skills?.length > 0)
      } catch {
        return false
      }
    },
  },
  {
    id: 'job',
    label: 'Hitta ditt första jobb',
    description: 'Spara ett jobb som verkar intressant – du behöver inte söka än!',
    whyItHelps: 'Att spara jobb hjälper dig bygga en lista över möjligheter',
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
    label: 'Börja din dagbok',
    description: 'Reflektera över din resa – det är viktigt att fira framstegen',
    whyItHelps: 'Att reflektera hjälper dig se hur långt du kommit och vad som fungerar',
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
  const [showCompleted, setShowCompleted] = useState(false)
  const [recentlyCompleted, setRecentlyCompleted] = useState<string | null>(null)

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

  // Check for newly completed items to show celebration
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

  const handleDismiss = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setIsDismissed(true)
    localStorage.setItem('getting-started-dismissed', 'true')
  }

  // Check if previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('getting-started-dismissed')
    if (dismissed === 'true') {
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
  
  // Separera klara och icke-klara steg
  const incompleteItems = checklistItems.filter(item => !completedItems.has(item.id))
  const completedItemsList = checklistItems.filter(item => completedItems.has(item.id))
  
  // Hitta nästa steg att fokusera på
  const nextItem = incompleteItems[0]

  if (isComplete) {
    return (
      <div className={cn(
        'bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl shadow-sm border border-emerald-200 p-6 animate-in fade-in slide-in-from-bottom-4',
        className
      )}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center animate-bounce">
            <Trophy className="w-7 h-7 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-emerald-800 text-lg">Du är igång! 🎉</h3>
            <p className="text-emerald-700">
              Du har lagt en stark grund för din jobbsökarresa. 
              Kom ihåg: varje steg räknas, oavsett hur litet det känns.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
            aria-label="Stäng meddelande"
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
        className="w-full p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-100 text-left hover:from-indigo-100 hover:to-purple-100 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-indigo-500" aria-hidden="true" />
              <h3 className="font-bold text-slate-800 text-lg">Kom igång</h3>
              <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                {completedItems.size}/{checklistItems.length}
              </span>
            </div>
            <p className="text-sm text-slate-600">
              {expanded 
                ? 'Följ dessa steg för att komma igång med din jobbsökarresa. Ta den tid du behöver!'
                : `${completedItems.size} av ${checklistItems.length} steg klara - klicka för att visa`
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Dölj checklistan (visas igen om inte allt är klart)"
            >
              <X className="w-4 h-4" />
            </button>
            <ChevronDown 
              className={cn(
                'w-5 h-5 text-slate-400 transition-transform duration-200',
                expanded && 'rotate-180'
              )} 
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Progress Bar - Always visible */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500 font-medium">Din framsteg</span>
            <span className="text-indigo-600 font-semibold">{Math.round(progress)}%</span>
          </div>
          <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      </button>

      {/* Collapsible Content */}
      {expanded && (
        <>
          {/* Nästa steg - Huvudfokus */}
          {nextItem && (
            <div className="px-4 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-semibold text-slate-700">Nästa steg:</span>
              </div>
              <button
                onClick={() => handleItemClick(nextItem)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-300 transition-all text-left group animate-in fade-in"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <nextItem.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 text-base">{nextItem.label}</div>
                  <div className="text-sm text-slate-600 mt-0.5">{nextItem.description}</div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-indigo-600">
                    <HelpCircle className="w-3 h-3" />
                    <span>{nextItem.whyItHelps}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-indigo-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          )}

          {/* Övriga ej klara steg */}
          {incompleteItems.length > 1 && (
            <div className="px-4 pt-3">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                Kommande steg
              </p>
              <div className="space-y-2">
                {incompleteItems.slice(1).map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50 transition-all text-left group opacity-75 hover:opacity-100"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-700 text-sm">{item.label}</div>
                        <div className="text-xs text-slate-500 truncate">{item.description}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Klara steg - Kollapsad sektion */}
          {completedItemsList.length > 0 && (
            <div className="px-4 py-3">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                <Check className="w-4 h-4 text-emerald-500" />
                <span>{completedItemsList.length} steg klara</span>
                <ChevronDown 
                  className={cn(
                    'w-4 h-4 transition-transform',
                    showCompleted && 'rotate-180'
                  )} 
                />
              </button>
              
              {showCompleted && (
                <div className="mt-3 space-y-2 animate-in fade-in">
                  {completedItemsList.map((item) => {
                    const Icon = item.icon
                    const isRecent = recentlyCompleted === item.id
                    
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl border-2 bg-emerald-50/50 border-emerald-100',
                          isRecent && 'ring-2 ring-emerald-400 animate-pulse'
                        )}
                      >
                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                          <Check className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-emerald-800 text-sm">{item.label}</div>
                          {isRecent && (
                            <div className="text-xs text-emerald-600 mt-0.5 animate-in fade-in">
                              ✨ Bra jobbat! Ett steg närmare målet
                            </div>
                          )}
                        </div>
                        {isRecent && (
                          <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Nyss klar!
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Footer med uppmuntran */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
            <p className="text-sm text-slate-500 text-center">
              💡 <span className="font-medium">Tips:</span> Det är okej att hoppa över steg eller göra dem i en annan ordning. 
              Gör det som känns rätt för dig.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

export default GettingStartedChecklist
