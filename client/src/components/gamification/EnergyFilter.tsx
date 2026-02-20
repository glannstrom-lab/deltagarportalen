import { useState, useEffect } from 'react'
import { Battery, BatteryLow, BatteryMedium, BatteryFull, Zap } from 'lucide-react'

export type EnergyLevel = 1 | 2 | 3 | 4 | 5

interface EnergyFilterProps {
  onEnergySelect: (level: EnergyLevel) => void
  selectedLevel: EnergyLevel | null
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
    duration: '1-5 min'
  },
  {
    level: 2 as EnergyLevel,
    emoji: '😌',
    label: 'Låg',
    description: 'Jag kan göra lite, men behöver ta det lugnt',
    icon: <Battery className="w-5 h-5" />,
    color: 'bg-orange-50 border-orange-200 text-orange-700',
    hoverColor: 'hover:bg-orange-100 hover:border-orange-300',
    duration: '5-10 min'
  },
  {
    level: 3 as EnergyLevel,
    emoji: '😐',
    label: 'Medel',
    description: 'Jag har normal energi idag',
    icon: <BatteryMedium className="w-5 h-5" />,
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    hoverColor: 'hover:bg-amber-100 hover:border-amber-300',
    duration: '10-20 min'
  },
  {
    level: 4 as EnergyLevel,
    emoji: '🙂',
    label: 'God',
    description: 'Jag känner mig stark och redo',
    icon: <BatteryFull className="w-5 h-5" />,
    color: 'bg-teal-50 border-teal-200 text-teal-700',
    hoverColor: 'hover:bg-teal-100 hover:border-teal-300',
    duration: '20-40 min'
  },
  {
    level: 5 as EnergyLevel,
    emoji: '💪',
    label: 'Hög',
    description: 'Jag är full av energi och motivation!',
    icon: <Zap className="w-5 h-5" />,
    color: 'bg-green-50 border-green-200 text-green-700',
    hoverColor: 'hover:bg-green-100 hover:border-green-300',
    duration: '40+ min'
  }
]

export function EnergyFilter({ onEnergySelect, selectedLevel }: EnergyFilterProps) {
  const [showInfo] = useState(true)

  useEffect(() => {
    // Spara senaste energinivån för framtida besök
    if (selectedLevel) {
      localStorage.setItem('lastEnergyLevel', selectedLevel.toString())
    }
  }, [selectedLevel])

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
            onClick={() => onEnergySelect(option.level)}
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

      {selectedLevel && (
        <div className="mt-4 p-4 bg-teal-50 rounded-xl text-center animate-in fade-in duration-300">
          <p className="text-sm text-teal-800">
            <strong>Bra!</strong> Vi visar uppgifter som tar{' '}
            <span className="font-semibold">
              {energyOptions.find(o => o.level === selectedLevel)?.duration}
            </span>
          </p>
          <button
            onClick={() => onEnergySelect(selectedLevel)}
            className="mt-2 text-xs text-teal-600 hover:text-teal-700 underline"
          >
            Ändra energinivå
          </button>
        </div>
      )}
    </div>
  )
}

// Hook för att filtrera uppgifter baserat på energinivå
export function useEnergyFilter() {
  const filterTasksByEnergy = <T extends { duration: number; energy: 'low' | 'medium' | 'high' }>(
    tasks: T[],
    energyLevel: EnergyLevel
  ): T[] => {
    if (energyLevel <= 2) {
      // Låg energi - visa endast snabba uppgifter (max 5 min)
      return tasks.filter(t => t.duration <= 5 && t.energy === 'low')
    } else if (energyLevel <= 3) {
      // Medel energi - visa uppgifter upp till 15 min
      return tasks.filter(t => t.duration <= 15 && (t.energy === 'low' || t.energy === 'medium'))
    } else {
      // Hög energi - visa alla uppgifter
      return tasks
    }
  }

  const getRecommendedTaskCount = (energyLevel: EnergyLevel): number => {
    switch (energyLevel) {
      case 1: return 1
      case 2: return 2
      case 3: return 3
      case 4: return 5
      case 5: return 7
      default: return 3
    }
  }

  return { filterTasksByEnergy, getRecommendedTaskCount }
}
