/**
 * QuickWinButton - "Gör något litet"-knapp
 * Föreslår 5-minuters uppgifter baserat på användarens state
 */
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  X, 
  CheckCircle2, 
  Heart, 
  FileText, 
  Briefcase, 
  BookOpen,
  Dumbbell,
  Target,
  ChevronRight,
  RotateCcw
} from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useEnergyStore, type EnergyLevel } from '@/stores/energyStoreWithSync'
import { useDashboardData, type UseDashboardDataReturn } from '@/hooks/useDashboardData'
import { Link } from 'react-router-dom'

interface QuickWin {
  id: string
  title: string
  description: string
  timeEstimate: string
  energyLevel: EnergyLevel
  icon: React.ReactNode
  link: string
  color: string
  condition?: (data: NonNullable<UseDashboardDataReturn['data']>) => boolean
}

export function QuickWinButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [completedId, setCompletedId] = useState<string | null>(null)
  const { level: energyLevel } = useEnergyStore()
  const { data } = useDashboardData()

  const quickWins: QuickWin[] = [
    {
      id: 'log-mood',
      title: 'Logga ditt humör',
      description: 'Hur mår du just nu? Tar bara 30 sekunder.',
      timeEstimate: '30 sek',
      energyLevel: 'low',
      icon: <Heart size={18} />,
      link: '/wellness',
      color: 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200',
      condition: (d) => !d?.wellness?.moodToday
    },
    {
      id: 'save-job',
      title: 'Spara ett jobb',
      description: 'Hitta ett jobb som verkar intressant och spara det.',
      timeEstimate: '2 min',
      energyLevel: 'low',
      icon: <Briefcase size={18} />,
      link: '/job-search',
      color: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'
    },
    {
      id: 'read-article',
      title: 'Läs en artikel',
      description: 'Lär dig något nytt om jobbsökande.',
      timeEstimate: '5 min',
      energyLevel: 'low',
      icon: <BookOpen size={18} />,
      link: '/knowledge-base',
      color: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200'
    },
    {
      id: 'update-cv-field',
      title: 'Fyll i ett CV-fält',
      description: 'Välj ett avsnitt i ditt CV och fyll i det.',
      timeEstimate: '5 min',
      energyLevel: 'medium',
      icon: <FileText size={18} />,
      link: '/cv',
      color: 'bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-200',
      condition: (d) => d?.cv?.progress < 100
    },
    {
      id: 'do-exercise',
      title: 'Gör en övning',
      description: 'Förbered dig inför en intervju med en övning.',
      timeEstimate: '10 min',
      energyLevel: 'medium',
      icon: <Dumbbell size={18} />,
      link: '/exercises',
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200'
    },
    {
      id: 'complete-quest',
      title: 'Avsluta en quest',
      description: 'Kolla dina dagliga quests och avsluta en.',
      timeEstimate: '5 min',
      energyLevel: 'medium',
      icon: <Target size={18} />,
      link: '/quests',
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200'
    }
  ]

  // Filtrera baserat på energinivå och condition
  const filteredWins = quickWins.filter(win => {
    // Låg energi: visa bara low-energy uppgifter
    if (energyLevel === 'low' && win.energyLevel !== 'low') return false
    // Medium: visa low och medium
    if (energyLevel === 'medium' && win.energyLevel === 'high') return false
    // High: visa allt
    
    // Kolla condition om det finns
    if (win.condition && data) {
      return win.condition(data)
    }
    return true
  })

  // Ta första 4
  const displayedWins = filteredWins.slice(0, 4)

  const handleComplete = (id: string) => {
    setCompletedId(id)
    setTimeout(() => {
      setCompletedId(null)
      setIsOpen(false)
    }, 1500)
  }

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg",
          "bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-medium",
          "hover:shadow-xl hover:shadow-violet-500/25 transition-shadow"
        )}
      >
        <Sparkles size={18} />
        <span>Gör något litet</span>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">Gör något litet</h3>
                      <p className="text-sm text-slate-500">
                        5-minuters uppgifter för att komma igång
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
                  >
                    <X size={18} className="text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {displayedWins.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 size={32} className="text-emerald-600" />
                    </div>
                    <h4 className="font-semibold text-slate-800 mb-2">Bra jobbat!</h4>
                    <p className="text-slate-500 text-sm">
                      Du har inga små uppgifter just nu. Ta en välförtjänt paus!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayedWins.map((win, index) => (
                      <motion.div
                        key={win.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        {completedId === win.id ? (
                          <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200"
                          >
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                              <CheckCircle2 size={20} className="text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-medium text-emerald-800">Klart!</p>
                              <p className="text-sm text-emerald-600">
                                Bra jobbat med att ta ett steg framåt!
                              </p>
                            </div>
                          </motion.div>
                        ) : (
                          <Link
                            to={win.link}
                            onClick={() => handleComplete(win.id)}
                            className={cn(
                              "flex items-center gap-3 p-4 rounded-xl border transition-all group",
                              win.color
                            )}
                          >
                            <div className="w-10 h-10 rounded-lg bg-white/70 flex items-center justify-center">
                              {win.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{win.title}</h4>
                                <span className="text-xs opacity-70 px-2 py-0.5 rounded-full bg-white/50">
                                  {win.timeEstimate}
                                </span>
                              </div>
                              <p className="text-sm opacity-80 truncate">
                                {win.description}
                              </p>
                            </div>
                            <ChevronRight size={18} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Kanske senare
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Simplified inline version for sidebar/header
export function QuickWinBadge() {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
          "bg-gradient-to-r from-violet-100 to-indigo-100 text-violet-700",
          "border border-violet-200 hover:shadow-sm transition-all"
        )}
      >
        <Sparkles size={12} />
        <span>Snabbwin</span>
      </button>
      
      {/* Reuse modal from main component */}
      {/* This would be extracted to a shared modal component in production */}
    </>
  )
}
