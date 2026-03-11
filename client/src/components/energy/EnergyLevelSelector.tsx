/**
 * Energy Level Selector Component
 * Allows users to set their energy level and adapts the UI accordingly
 */

import { useSettingsStore, type EnergyLevel } from '@/stores/settingsStore'
import { BatteryLow, BatteryMedium, BatteryFull, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface EnergyLevelSelectorProps {
  onSelect?: (level: EnergyLevel) => void
  showDescription?: boolean
  className?: string
}

interface EnergyOption {
  level: EnergyLevel
  label: string
  description: string
  icon: LucideIcon
}

const energyOptions: EnergyOption[] = [
  {
    level: 'low',
    label: 'Låg energi',
    description: 'Jag tar det lugnt idag - visa mig bara enkla uppgifter',
    icon: BatteryLow,
  },
  {
    level: 'medium',
    label: 'Medium energi',
    description: 'Vanlig dag - jag klarar av det mesta',
    icon: BatteryMedium,
  },
  {
    level: 'high',
    label: 'Hög energi',
    description: 'Jag är på topp - visa mig allt!',
    icon: BatteryFull,
  },
]

export function EnergyLevelSelector({ 
  onSelect, 
  showDescription = true,
  className 
}: EnergyLevelSelectorProps) {
  const { energyLevel, setEnergyLevel } = useSettingsStore()

  const handleSelect = (level: EnergyLevel) => {
    setEnergyLevel(level)
    onSelect?.(level)
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-indigo-500" />
        <h3 className="font-semibold text-slate-800">Hur är din energi idag?</h3>
      </div>
      
      <div className="grid gap-3">
        {energyOptions.map((option) => {
          const Icon = option.icon
          const isSelected = energyLevel === option.level
          
          return (
            <button
              key={option.level}
              onClick={() => handleSelect(option.level)}
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left',
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 shadow-md'
                  : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50'
              )}
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                  isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'
                )}
              >
                <Icon className="w-6 h-6" />
              </div>
              
              <div className="flex-1">
                <div className="font-medium text-slate-800">{option.label}</div>
                {showDescription && (
                  <div className="text-sm text-slate-500 mt-0.5">{option.description}</div>
                )}
              </div>
              
              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Hook to get energy-appropriate content
 */
export function useEnergyAdaptedContent() {
  const { energyLevel } = useSettingsStore()

  const getVisibleWidgets = (allWidgets: string[]): string[] => {
    switch (energyLevel) {
      case 'low':
        // Show only 2-3 essential widgets
        return allWidgets.slice(0, 3)
      case 'medium':
        // Show 5-6 widgets
        return allWidgets.slice(0, 6)
      case 'high':
        // Show all widgets
        return allWidgets
      default:
        return allWidgets
    }
  }

  const getQuickTasks = (): { label: string; duration: string; action: string }[] => {
    switch (energyLevel) {
      case 'low':
        return [
          { label: 'Skriv en positiv sak om dig själv', duration: '2 min', action: '/dashboard/diary' },
          { label: 'Markera dagens humör', duration: '1 min', action: '/dashboard/diary' },
          { label: 'Ta en titt på ett sparat jobb', duration: '3 min', action: '/dashboard/job-search' },
          { label: 'Läs en inspirerande artikel', duration: '5 min', action: '/dashboard/knowledge-base' },
        ]
      case 'medium':
        return [
          { label: 'Uppdatera din profil', duration: '10 min', action: '/dashboard/cv' },
          { label: 'Gör 3 intresseguide-frågor', duration: '5 min', action: '/dashboard/interest-guide' },
          { label: 'Sök efter nya jobb', duration: '10 min', action: '/dashboard/job-search' },
          { label: 'Skriv i dagboken', duration: '5 min', action: '/dashboard/diary' },
        ]
      case 'high':
        return [
          { label: 'Skapa eller uppdatera ditt CV', duration: '30 min', action: '/dashboard/cv' },
          { label: 'Gör hela intresseguiden', duration: '15 min', action: '/dashboard/interest-guide' },
          { label: 'Skriv ett personligt brev', duration: '20 min', action: '/dashboard/cover-letter' },
          { label: 'Sök och spara 5 jobb', duration: '15 min', action: '/dashboard/job-search' },
        ]
    }
  }

  const getEncouragingMessage = (): string => {
    switch (energyLevel) {
      case 'low':
        return 'Det är okej att ta det lugnt. Varje litet steg räknas! 💙'
      case 'medium':
        return 'Bra jobbat! Du är på god väg framåt! 💪'
      case 'high':
        return 'Wow, vilken energi! Passa på att göra det där du tänkt på! 🚀'
    }
  }

  return {
    energyLevel,
    getVisibleWidgets,
    getQuickTasks,
    getEncouragingMessage,
    isLowEnergy: energyLevel === 'low',
    isMediumEnergy: energyLevel === 'medium',
    isHighEnergy: energyLevel === 'high',
  }
}

export default EnergyLevelSelector
