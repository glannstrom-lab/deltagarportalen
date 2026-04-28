/**
 * MobileEnergySelector - Kompakt energiväljare för mobil
 * Tar mindre plats men fungerar lika bra
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BatteryLow, 
  BatteryMedium, 
  BatteryFull, 
  X,
  ChevronRight,
  Sparkles
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { useEnergyStore, type EnergyLevel, getEnergyDescription } from '@/stores/energyStoreWithSync'

interface MobileEnergySelectorProps {
  isOpen: boolean
  onClose: () => void
}

interface EnergyOption {
  level: EnergyLevel
  label: string
  emoji: string
  description: string
  icon: React.ReactNode
  color: string
  bgColor: string
  features: string[]
}

export function MobileEnergySelector({ isOpen, onClose }: MobileEnergySelectorProps) {
  const [selectedLevel, setSelectedLevel] = useState<EnergyLevel | null>(null)
  const [step, setStep] = useState<'select' | 'confirm'>('select')
  const { setLevel, incrementStreak } = useEnergyStore()

  const energyOptions: EnergyOption[] = [
    {
      level: 'low',
      label: 'Låg energi',
      emoji: '😌',
      description: 'Jag tar det lugnt idag',
      icon: <BatteryLow size={20} />,
      color: 'text-rose-700',
      bgColor: 'bg-rose-100',
      features: ['3 widgets', 'Enkla uppgifter', 'Mycket stöd'],
    },
    {
      level: 'medium',
      label: 'Medium energi',
      emoji: '😐',
      description: 'Jag kan göra några saker',
      icon: <BatteryMedium size={20} />,
      color: 'text-amber-700',
      bgColor: 'bg-amber-100',
      features: ['6 widgets', 'Standardvy', 'Balanserat'],
    },
    {
      level: 'high',
      label: 'Hög energi',
      emoji: '😊',
      description: 'Jag är redo att ta i!',
      icon: <BatteryFull size={20} />,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-100',
      features: ['Alla widgets', 'Full funktionalitet', 'Alla funktioner'],
    },
  ]

  const handleSelect = (level: EnergyLevel) => {
    setSelectedLevel(level)
    setStep('confirm')
  }

  const handleConfirm = () => {
    if (!selectedLevel) return
    setLevel(selectedLevel)
    incrementStreak()
    onClose()
  }

  const handleBack = () => {
    setStep('select')
    setSelectedLevel(null)
  }

  const selectedOption = energyOptions.find(o => o.level === selectedLevel)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl overflow-hidden"
          >
            {/* Drag handle */}
            <div className="w-full flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-stone-300" />
            </div>

            {step === 'select' ? (
              <>
                {/* Header */}
                <div className="px-5 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-bold text-stone-800">
                      Hur är din energi?
                    </h2>
                    <button
                      onClick={onClose}
                      className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center"
                    >
                      <X size={16} className="text-stone-700" />
                    </button>
                  </div>
                  <p className="text-sm text-stone-700">
                    Vi anpassar din översikt
                  </p>
                </div>

                {/* Options */}
                <div className="px-5 pb-6 space-y-3">
                  {energyOptions.map((option) => (
                    <motion.button
                      key={option.level}
                      onClick={() => handleSelect(option.level)}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "w-full p-4 rounded-2xl border-2 transition-all text-left",
                        "active:scale-[0.98]"
                      )}
                      style={{
                        backgroundColor: option.level === 'low' ? '#fff1f2' : 
                                        option.level === 'medium' ? '#fffbeb' : '#ecfdf5',
                        borderColor: option.level === 'low' ? '#fecdd3' : 
                                    option.level === 'medium' ? '#fde68a' : '#a7f3d0',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{option.emoji}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={cn("font-semibold", option.color)}>
                              {option.label}
                            </span>
                          </div>
                          <p className="text-sm text-stone-600">
                            {option.description}
                          </p>
                        </div>
                        <ChevronRight size={20} className="text-stone-600" />
                      </div>
                      
                      {/* Features */}
                      <div className="flex gap-2 mt-3">
                        {option.features.map((feature, i) => (
                          <span 
                            key={i}
                            className="text-xs px-2 py-1 rounded-full bg-white/60 text-stone-600"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </>
            ) : selectedOption && (
              <>
                {/* Confirm step */}
                <div className="px-5 pb-6">
                  <button
                    onClick={handleBack}
                    className="text-sm text-stone-700 mb-4 flex items-center gap-1"
                  >
                    ← Tillbaka
                  </button>

                  <div className="text-center mb-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        "w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center",
                        selectedOption.bgColor
                      )}
                    >
                      <span className="text-4xl">{selectedOption.emoji}</span>
                    </motion.div>
                    <h3 className="text-xl font-bold text-stone-800 mb-1">
                      {selectedOption.label}
                    </h3>
                    <p className="text-stone-700">
                      {getEnergyDescription(selectedOption.level)}
                    </p>
                  </div>

                  {/* Features list */}
                  <div className="bg-stone-50 rounded-xl p-4 mb-6">
                    <p className="text-sm font-medium text-stone-700 mb-3">Din vy inkluderar:</p>
                    <ul className="space-y-2">
                      {selectedOption.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-stone-600">
                          <Sparkles size={14} className="text-[var(--c-solid)]" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={handleConfirm}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--c-solid)] to-sky-600 text-white font-semibold active:scale-[0.98] transition-transform"
                  >
                    Bekräfta
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Kompakt inline variant för header
export function MobileEnergyBadge() {
  const { level, setLevel } = useEnergyStore()
  const [showSelector, setShowSelector] = useState(false)

  const config = {
    low: { emoji: '😌', color: 'bg-rose-100 text-rose-700' },
    medium: { emoji: '😐', color: 'bg-amber-100 text-amber-700' },
    high: { emoji: '😊', color: 'bg-emerald-100 text-emerald-700' },
  }

  return (
    <>
      <button
        onClick={() => setShowSelector(true)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all",
          config[level].color
        )}
      >
        <span>{config[level].emoji}</span>
        <span className="capitalize hidden sm:inline">
          {level === 'medium' ? 'Medel' : level}
        </span>
      </button>

      <MobileEnergySelector 
        isOpen={showSelector} 
        onClose={() => setShowSelector(false)} 
      />
    </>
  )
}

export default MobileEnergySelector
