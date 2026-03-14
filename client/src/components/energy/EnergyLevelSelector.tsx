/**
 * EnergyLevelSelector - Låter användaren välja sin energinivå
 * Visas vid inloggning och kan visas igen via header
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  type EnergyLevel, 
  getEnergyDescription, 
  getEnergyEmoji,
  useEnergyStore 
} from '@/stores/energyStore'
import { Button } from '@/components/ui/Button'
import { Sparkles, Battery, BatteryLow, BatteryMedium, BatteryFull } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EnergyLevelSelectorProps {
  onComplete?: () => void
  showLater?: boolean
  className?: string
}

interface EnergyOption {
  level: EnergyLevel
  label: string
  emoji: string
  description: string
  icon: React.ReactNode
  color: string
}

const energyOptions: EnergyOption[] = [
  {
    level: 'low',
    label: 'Låg energi',
    emoji: '😌',
    description: 'Jag har lite ork idag, jag tar det lugnt',
    icon: <BatteryLow size={24} />,
    color: 'bg-rose-100 border-rose-300 text-rose-700 hover:bg-rose-200'
  },
  {
    level: 'medium',
    label: 'Medium energi',
    emoji: '😐',
    description: 'Jag mår okej, kan göra några saker',
    icon: <BatteryMedium size={24} />,
    color: 'bg-amber-100 border-amber-300 text-amber-700 hover:bg-amber-200'
  },
  {
    level: 'high',
    label: 'Hög energi',
    emoji: '😊',
    description: 'Jag är redo att ta i!',
    icon: <BatteryFull size={24} />,
    color: 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200'
  }
]

export function EnergyLevelSelector({ 
  onComplete, 
  showLater = true,
  className 
}: EnergyLevelSelectorProps) {
  const [selectedLevel, setSelectedLevel] = useState<EnergyLevel | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const { setLevel, incrementStreak } = useEnergyStore()

  const handleSelect = (level: EnergyLevel) => {
    setSelectedLevel(level)
  }

  const handleConfirm = () => {
    if (!selectedLevel) return
    
    setLevel(selectedLevel)
    incrementStreak()
    setIsCompleted(true)
    
    setTimeout(() => {
      onComplete?.()
    }, 1000)
  }

  const handleSkip = () => {
    // Sätt medium som default om användaren skippar
    setLevel('medium')
    incrementStreak()
    onComplete?.()
  }

  if (isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-4"
        >
          <Sparkles className="w-10 h-10 text-white" />
        </motion.div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">
          Tack! {getEnergyEmoji(selectedLevel!)}
        </h3>
        <p className="text-slate-600">
          {getEnergyDescription(selectedLevel!)}
        </p>
      </motion.div>
    )
  }

  return (
    <div className={cn("p-6", className)}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Hur är din energi idag?
        </h2>
        <p className="text-slate-500">
          Vi anpassar din översikt efter hur du mår
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {energyOptions.map((option) => (
          <motion.button
            key={option.level}
            onClick={() => handleSelect(option.level)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4",
              selectedLevel === option.level
                ? option.color + ' border-current ring-2 ring-offset-2 ring-current'
                : 'bg-white border-slate-200 hover:border-slate-300'
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
              selectedLevel === option.level ? 'bg-white/50' : 'bg-slate-100'
            )}>
              {option.emoji}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-semibold",
                  selectedLevel === option.level ? '' : 'text-slate-700'
                )}>
                  {option.label}
                </span>
                {selectedLevel === option.level && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-xs bg-white/70 px-2 py-0.5 rounded-full"
                  >
                    Vald
                  </motion.span>
                )}
              </div>
              <p className={cn(
                "text-sm",
                selectedLevel === option.level ? '' : 'text-slate-500'
              )}>
                {option.description}
              </p>
            </div>
            <div className={cn(
              "transition-colors",
              selectedLevel === option.level ? '' : 'text-slate-400'
            )}>
              {option.icon}
            </div>
          </motion.button>
        ))}
      </div>

      <div className="flex gap-3">
        {showLater && (
          <Button
            variant="outline"
            onClick={handleSkip}
            className="flex-1"
          >
            Hoppa över
          </Button>
        )}
        <Button
          onClick={handleConfirm}
          disabled={!selectedLevel}
          className={cn(
            "flex-1 transition-all",
            selectedLevel 
              ? 'bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700' 
              : ''
          )}
        >
          Fortsätt
        </Button>
      </div>

      <p className="text-center text-xs text-slate-400 mt-4">
        Du kan alltid ändra detta senare i inställningarna
      </p>
    </div>
  )
}

// Kompakt version för header/dropdown
export function EnergyLevelBadge({ 
  onClick 
}: { 
  onClick?: () => void 
}) {
  const { level, lastUpdated } = useEnergyStore()
  
  const colors = {
    low: 'bg-rose-100 text-rose-700 border-rose-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    high: 'bg-emerald-100 text-emerald-700 border-emerald-200'
  }
  
  const icons = {
    low: <BatteryLow size={14} />,
    medium: <BatteryMedium size={14} />,
    high: <BatteryFull size={14} />
  }
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all hover:shadow-sm",
        colors[level]
      )}
      title="Klicka för att ändra energinivå"
    >
      {icons[level]}
      <span className="capitalize">{level === 'medium' ? 'Medel' : level}</span>
    </button>
  )
}

// Modal wrapper
export function EnergyLevelModal({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean
  onClose: () => void 
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            <EnergyLevelSelector onComplete={onClose} showLater={false} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
