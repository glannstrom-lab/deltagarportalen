import { useState, useEffect, useCallback, useMemo } from 'react'
import { Battery, BatteryLow, BatteryMedium, BatteryFull, Zap, Eye, EyeOff, Info } from 'lucide-react'

export type EnergyLevel = 1 | 2 | 3 | 4 | 5
export type EnergyClassification = 'low' | 'medium' | 'high' | 'blocked'

/** 🟢🟡🔴⚫ Energy classification for tasks */
export const ENERGY_LABELS: Record<EnergyClassification, { 
  emoji: string 
  label: string 
  description: string 
  color: string
  bgColor: string
}> = {
  low: {
    emoji: '🟢',
    label: 'Låg energi',
    description: 'Kan göras på dåliga dagar - läs resultat, spara CV',
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200'
  },
  medium: {
    emoji: '🟡',
    label: 'Medium energi',
    description: 'Kräver lite energi - svara på enkät, enklare formulär',
    color: 'text-amber-500',
    bgColor: 'bg-amber-50 border-amber-200'
  },
  high: {
    emoji: '🔴',
    label: 'Hög energi',
    description: 'Kräver full kapacitet - skriva CV från scratch, långa formulär',
    color: 'text-rose-500',
    bgColor: 'bg-rose-50 border-rose-200'
  },
  blocked: {
    emoji: '⚫',
    label: 'Spärrad',
    description: 'För svårt - komplexa val, tidsbegränsningar',
    color: 'text-slate-500',
    bgColor: 'bg-slate-100 border-slate-200'
  }
}

/** Task with energy classification */
export interface TaskWithEnergy {
  id: string
  title: string
  duration: number // minutes
  energy: EnergyClassification
  [key: string]: unknown
}

/** Energy filter settings */
interface EnergyFilterSettings {
  showHighEnergy: boolean
  maxHighEnergyPercent: number
  minLowEnergyPercent: number
}

interface EnergyFilterProps {
  onEnergySelect: (level: EnergyLevel) => void
  selectedLevel: EnergyLevel | null
  showAdvancedOptions?: boolean
}

const energyOptions = [
  {
    level: 1 as EnergyLevel,
    emoji: '😴',
    label: 'Väldigt låg',
    description: 'Jag har knappt någon energi idag',
    icon: <BatteryLow className="w-5 h-5" />,
    color: 'bg-rose-50 border-rose-200 text-rose-700',
    hoverColor: 'hover:bg-rose-100 hover:border-rose-300',
    duration: '1-5 min',
    classification: ['low'] as EnergyClassification[]
  },
  {
    level: 2 as EnergyLevel,
    emoji: '😌',
    label: 'Låg',
    description: 'Jag kan göra lite, men behöver ta det lugnt',
    icon: <Battery className="w-5 h-5" />,
    color: 'bg-orange-50 border-orange-200 text-orange-700',
    hoverColor: 'hover:bg-orange-100 hover:border-orange-300',
    duration: '5-10 min',
    classification: ['low', 'medium'] as EnergyClassification[]
  },
  {
    level: 3 as EnergyLevel,
    emoji: '😐',
    label: 'Medel',
    description: 'Jag har normal energi idag',
    icon: <BatteryMedium className="w-5 h-5" />,
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    hoverColor: 'hover:bg-amber-100 hover:border-amber-300',
    duration: '10-20 min',
    classification: ['low', 'medium'] as EnergyClassification[]
  },
  {
    level: 4 as EnergyLevel,
    emoji: '🙂',
    label: 'God',
    description: 'Jag känner mig stark och redo',
    icon: <BatteryFull className="w-5 h-5" />,
    color: 'bg-teal-50 border-teal-200 text-teal-700',
    hoverColor: 'hover:bg-teal-100 hover:border-teal-300',
    duration: '20-40 min',
    classification: ['low', 'medium', 'high'] as EnergyClassification[]
  },
  {
    level: 5 as EnergyLevel,
    emoji: '💪',
    label: 'Hög',
    description: 'Jag är full av energi och motivation!',
    icon: <Zap className="w-5 h-5" />,
    color: 'bg-green-50 border-green-200 text-green-700',
    hoverColor: 'hover:bg-green-100 hover:border-green-300',
    duration: '40+ min',
    classification: ['low', 'medium', 'high'] as EnergyClassification[]
  }
]

// Storage keys
const STORAGE_KEY_LAST_ENERGY = 'lastEnergyLevel'
const STORAGE_KEY_ENERGY_DATE = 'energyLevelDate'
const STORAGE_KEY_SHOW_HIGH_ENERGY = 'showHighEnergyTasks'

export function EnergyFilter({ 
  onEnergySelect, 
  selectedLevel, 
  showAdvancedOptions = true 
}: EnergyFilterProps) {
  const [showInfo, setShowInfo] = useState(true)
  const [showHighEnergy, setShowHighEnergy] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SHOW_HIGH_ENERGY)
    return saved ? saved === 'true' : false
  })

  // Check if energy was already selected today
  useEffect(() => {
    const savedDate = localStorage.getItem(STORAGE_KEY_ENERGY_DATE)
    const today = new Date().toISOString().split('T')[0]
    
    if (savedDate === today && !selectedLevel) {
      // Already selected today, restore the value
      const savedLevel = localStorage.getItem(STORAGE_KEY_LAST_ENERGY)
      if (savedLevel) {
        onEnergySelect(parseInt(savedLevel, 10) as EnergyLevel)
      }
    }
  }, [onEnergySelect, selectedLevel])

  // Save energy selection with date
  useEffect(() => {
    if (selectedLevel) {
      localStorage.setItem(STORAGE_KEY_LAST_ENERGY, selectedLevel.toString())
      localStorage.setItem(STORAGE_KEY_ENERGY_DATE, new Date().toISOString().split('T')[0])
    }
  }, [selectedLevel])

  // Persist showHighEnergy setting
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SHOW_HIGH_ENERGY, showHighEnergy.toString())
  }, [showHighEnergy])

  const handleEnergySelect = useCallback((level: EnergyLevel) => {
    onEnergySelect(level)
    setShowInfo(false)
  }, [onEnergySelect])

  const selectedOption = useMemo(() => 
    energyOptions.find(o => o.level === selectedLevel),
    [selectedLevel]
  )

  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Hur är din energi idag?
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Vi anpassar uppgifterna efter hur du mår
          </p>
        </div>
      </div>

      {showInfo && !selectedLevel && (
        <div className="mb-4 p-3 bg-teal-50 border border-teal-100 rounded-lg text-sm text-teal-800">
          💡 <strong>Tips:</strong> Det är okej att ha låg energi. 
          Portalen visar endast uppgifter som matchar din dagsform.
        </div>
      )}

      <div className="grid grid-cols-1 gap-2">
        {energyOptions.map((option) => (
          <button
            key={option.level}
            onClick={() => handleEnergySelect(option.level)}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
              selectedLevel === option.level
                ? `${option.color} ring-2 ring-offset-2 ring-teal-500`
                : `bg-white border-slate-200 ${option.hoverColor}`
            }`}
            aria-pressed={selectedLevel === option.level}
            aria-label={`Energ-nivå: ${option.label} - ${option.description}`}
          >
            <div className="text-2xl">{option.emoji}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${
                  selectedLevel === option.level ? 'text-current' : 'text-slate-800'
                }`}>
                  {option.label}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedLevel === option.level 
                    ? 'bg-white/50' 
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {option.duration}
                </span>
              </div>
              <p className={`text-sm mt-0.5 ${
                selectedLevel === option.level ? 'opacity-90' : 'text-slate-500'
              }`}>
                {option.description}
              </p>
            </div>
            <div className={`${
              selectedLevel === option.level ? 'opacity-100' : 'opacity-30'
            }`}>
              {option.icon}
            </div>
          </button>
        ))}
      </div>

      {selectedLevel && showAdvancedOptions && (
        <div className="mt-4 space-y-3">
          {/* Energy classification info */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                Energimarkering
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedOption?.classification.map((cls) => (
                <span 
                  key={cls}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs ${ENERGY_LABELS[cls].bgColor}`}
                >
                  <span>{ENERGY_LABELS[cls].emoji}</span>
                  <span className={ENERGY_LABELS[cls].color}>{ENERGY_LABELS[cls].label}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Show high energy toggle for low energy levels */}
          {selectedLevel <= 3 && (
            <button
              onClick={() => setShowHighEnergy(!showHighEnergy)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                showHighEnergy 
                  ? 'bg-rose-50 border-rose-200 text-rose-700' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                {showHighEnergy ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span className="text-sm">
                  {showHighEnergy ? 'Visar svårare uppgifter' : 'Döljer svårare uppgifter'}
                </span>
              </div>
              <span className="text-xs opacity-75">🔴 {showHighEnergy ? 'På' : 'Av'}</span>
            </button>
          )}
        </div>
      )}

      {selectedLevel && (
        <div className="mt-4 p-4 bg-teal-50 rounded-xl text-center animate-in fade-in duration-300">
          <p className="text-sm text-teal-800">
            <strong>Bra!</strong> Vi visar uppgifter som tar{' '}
            <span className="font-semibold">
              {selectedOption?.duration}
            </span>
          </p>
          <button
            onClick={() => {
              setShowInfo(true)
              // Keep the selected level but show info again
            }}
            className="mt-2 text-xs text-teal-600 hover:text-teal-700 underline"
          >
            Visa tips igen
          </button>
        </div>
      )}
    </div>
  )
}

/** Energy classification badge component */
export function EnergyBadge({ classification, showLabel = false, size = 'sm' }: {
  classification: EnergyClassification
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const config = ENERGY_LABELS[classification]
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-sm px-2 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2'
  }

  return (
    <span 
      className={`inline-flex items-center rounded-md font-medium ${config.bgColor} ${sizeClasses[size]}`}
      title={config.description}
    >
      <span className={size === 'lg' ? 'text-lg' : size === 'md' ? 'text-base' : 'text-sm'}>
        {config.emoji}
      </span>
      {showLabel && <span className={config.color}>{config.label}</span>}
    </span>
  )
}

/** Hook for energy-based filtering */
export function useEnergyFilter(settings: Partial<EnergyFilterSettings> = {}) {
  const {
    maxHighEnergyPercent = 20,
    minLowEnergyPercent = 50
  } = settings

  /**
   * Classify a task based on its properties
   */
  const classifyTask = useCallback((
    duration: number,
    complexity: 'simple' | 'moderate' | 'complex' | 'very_complex',
    requiresWriting = false,
    timeSensitive = false
  ): EnergyClassification => {
    // Blocked: complex + time sensitive, or very complex
    if (complexity === 'very_complex' || (complexity === 'complex' && timeSensitive)) {
      return 'blocked'
    }
    
    // High: long duration or complex writing tasks
    if (duration > 20 || (requiresWriting && complexity === 'complex')) {
      return 'high'
    }
    
    // Medium: moderate complexity or medium duration
    if (duration > 10 || complexity === 'moderate') {
      return 'medium'
    }
    
    // Low: short and simple
    return 'low'
  }, [])

  /**
   * Filter tasks based on energy level and classification
   */
  const filterTasksByEnergy = useCallback(<T extends TaskWithEnergy>(
    tasks: T[],
    energyLevel: EnergyLevel,
    options: { showHighEnergy?: boolean; includeBlocked?: boolean } = {}
  ): T[] => {
    const { showHighEnergy = false, includeBlocked = false } = options

    // Get allowed classifications for this energy level
    const allowedClassifications = energyOptions.find(o => o.level === energyLevel)?.classification || ['low']

    // Filter out blocked unless explicitly included
    let filtered = includeBlocked ? tasks : tasks.filter(t => t.energy !== 'blocked')

    // Apply energy level filtering
    filtered = filtered.filter(task => {
      // Always show low energy tasks
      if (task.energy === 'low') return true

      // Medium tasks shown for energy level 2+
      if (task.energy === 'medium') {
        return allowedClassifications.includes('medium')
      }

      // High tasks only shown if allowed and user wants to see them
      if (task.energy === 'high') {
        return allowedClassifications.includes('high') && showHighEnergy
      }

      return false
    })

    // Apply percentage constraints
    const total = filtered.length
    if (total === 0) return filtered

    const highCount = filtered.filter(t => t.energy === 'high').length
    const lowCount = filtered.filter(t => t.energy === 'low').length

    // If too many high energy tasks, limit them
    if (highCount / total > maxHighEnergyPercent / 100) {
      const maxHigh = Math.floor(total * maxHighEnergyPercent / 100)
      const highTasks = filtered.filter(t => t.energy === 'high').slice(0, maxHigh)
      const otherTasks = filtered.filter(t => t.energy !== 'high')
      filtered = [...otherTasks, ...highTasks]
    }

    // If too few low energy tasks at low energy levels, try to add more
    if (energyLevel <= 2 && lowCount / total < minLowEnergyPercent / 100) {
      // This is a warning - we should have more low energy tasks available
      console.warn(`Only ${Math.round(lowCount / total * 100)}% low energy tasks available, minimum is ${minLowEnergyPercent}%`)
    }

    return filtered
  }, [maxHighEnergyPercent, minLowEnergyPercent])

  /**
   * Get recommended task count based on energy level
   */
  const getRecommendedTaskCount = useCallback((energyLevel: EnergyLevel): number => {
    switch (energyLevel) {
      case 1: return 1
      case 2: return 2
      case 3: return 3
      case 4: return 5
      case 5: return 7
      default: return 3
    }
  }, [])

  /**
   * Get energy classification for common task types
   */
  const getTaskClassification = useCallback((taskType: string): EnergyClassification => {
    const classifications: Record<string, EnergyClassification> = {
      // Low energy tasks
      'view_results': 'low',
      'save_cv': 'low',
      'read_article': 'low',
      'watch_video': 'low',
      'view_dashboard': 'low',
      'check_progress': 'low',
      
      // Medium energy tasks
      'answer_survey': 'medium',
      'simple_form': 'medium',
      'update_profile': 'medium',
      'short_quiz': 'medium',
      'select_interests': 'medium',
      
      // High energy tasks
      'write_cv': 'high',
      'long_form': 'high',
      'complex_application': 'high',
      'interview_prep': 'high',
      'skill_assessment': 'high',
      
      // Blocked tasks
      'complex_decision': 'blocked',
      'timed_test': 'blocked',
      'multiple_choice_complex': 'blocked'
    }

    return classifications[taskType] || 'medium'
  }, [])

  /**
   * Check if energy selection is from today
   */
  const isEnergySelectedToday = useCallback((): boolean => {
    const savedDate = localStorage.getItem(STORAGE_KEY_ENERGY_DATE)
    const today = new Date().toISOString().split('T')[0]
    return savedDate === today
  }, [])

  /**
   * Get saved energy level from today
   */
  const getSavedEnergyLevel = useCallback((): EnergyLevel | null => {
    const savedDate = localStorage.getItem(STORAGE_KEY_ENERGY_DATE)
    const today = new Date().toISOString().split('T')[0]
    
    if (savedDate !== today) return null
    
    const savedLevel = localStorage.getItem(STORAGE_KEY_LAST_ENERGY)
    return savedLevel ? parseInt(savedLevel, 10) as EnergyLevel : null
  }, [])

  return {
    classifyTask,
    filterTasksByEnergy,
    getRecommendedTaskCount,
    getTaskClassification,
    isEnergySelectedToday,
    getSavedEnergyLevel,
    ENERGY_LABELS
  }
}

/** Hook for daily energy persistence */
export function useDailyEnergy() {
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel | null>(null)
  const [hasSelectedToday, setHasSelectedToday] = useState(false)

  useEffect(() => {
    const savedDate = localStorage.getItem(STORAGE_KEY_ENERGY_DATE)
    const today = new Date().toISOString().split('T')[0]
    
    if (savedDate === today) {
      const savedLevel = localStorage.getItem(STORAGE_KEY_LAST_ENERGY)
      if (savedLevel) {
        setEnergyLevel(parseInt(savedLevel, 10) as EnergyLevel)
        setHasSelectedToday(true)
      }
    }
  }, [])

  const saveEnergyLevel = useCallback((level: EnergyLevel) => {
    localStorage.setItem(STORAGE_KEY_LAST_ENERGY, level.toString())
    localStorage.setItem(STORAGE_KEY_ENERGY_DATE, new Date().toISOString().split('T')[0])
    setEnergyLevel(level)
    setHasSelectedToday(true)
  }, [])

  const clearEnergyLevel = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_LAST_ENERGY)
    localStorage.removeItem(STORAGE_KEY_ENERGY_DATE)
    setEnergyLevel(null)
    setHasSelectedToday(false)
  }, [])

  return {
    energyLevel,
    hasSelectedToday,
    saveEnergyLevel,
    clearEnergyLevel
  }
}
