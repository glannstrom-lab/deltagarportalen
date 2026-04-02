/**
 * SuccessMoments - Konfetti, toast-notiser och belöningsanimationer
 * Förstärker positivt beteende med glädje! 🎉
 */
import { useState, useCallback, createContext, useContext, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle2, 
  Trophy, 
  Star, 
  Sparkles,
  Flame,
  X
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'

// Konfetti-komponent
interface ConfettiPiece {
  id: number
  x: number
  color: string
  rotation: number
  scale: number
}

export function Confetti({ 
  isActive, 
  onComplete 
}: { 
  isActive: boolean
  onComplete?: () => void 
}) {
  const colors = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444']
  
  const pieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
    scale: 0.5 + Math.random() * 0.5
  }))

  return (
    <AnimatePresence>
      {isActive && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {pieces.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{ 
                y: -20, 
                x: `${piece.x}vw`,
                opacity: 1,
                rotate: 0,
                scale: piece.scale
              }}
              animate={{ 
                y: '110vh',
                rotate: piece.rotation,
                x: `${piece.x + (Math.random() - 0.5) * 20}vw`
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 2 + Math.random() * 2,
                ease: 'easeOut',
                delay: Math.random() * 0.5
              }}
              onAnimationComplete={piece.id === 0 ? onComplete : undefined}
              className="absolute w-3 h-3 rounded-sm"
              style={{ 
                backgroundColor: piece.color,
                left: 0
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}

// Toast-typer
export type ToastType = 'success' | 'achievement' | 'streak' | 'milestone'

interface Toast {
  id: string
  type: ToastType
  title: string
  message: string
  icon?: ReactNode
}

interface ToastOptions {
  duration?: number
  type?: ToastType
}

// Toast Context
interface ToastContextType {
  showToast: (title: string, message: string, options?: ToastOptions) => void
  showConfetti: () => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useSuccess() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useSuccess must be used within SuccessProvider')
  }
  return context
}

// Success Provider
export function SuccessProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [showConfettiState, setShowConfettiState] = useState(false)

  const showToast = useCallback((
    title: string, 
    message: string, 
    options: ToastOptions = {}
  ) => {
    const { duration = 5000, type = 'success' } = options
    const id = Math.random().toString(36).substring(7)
    
    const toast: Toast = {
      id,
      type,
      title,
      message
    }

    setToasts(prev => [...prev, toast])

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const showConfetti = useCallback(() => {
    setShowConfettiState(true)
    setTimeout(() => {
      setShowConfettiState(false)
    }, 3000)
  }, [])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'achievement':
        return 'bg-gradient-to-r from-amber-100 to-yellow-100 border-amber-300 text-amber-900'
      case 'streak':
        return 'bg-gradient-to-r from-orange-100 to-red-100 border-orange-300 text-orange-900'
      case 'milestone':
        return 'bg-gradient-to-r from-violet-100 to-purple-100 border-violet-300 text-violet-900'
      default:
        return 'bg-gradient-to-r from-emerald-100 to-teal-100 border-emerald-300 text-emerald-900'
    }
  }

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'achievement':
        return <Trophy className="w-5 h-5 text-amber-600" />
      case 'streak':
        return <Flame className="w-5 h-5 text-orange-600" />
      case 'milestone':
        return <Star className="w-5 h-5 text-violet-600" />
      default:
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />
    }
  }

  return (
    <ToastContext.Provider value={{ showToast, showConfetti }}>
      {children}
      
      {/* Confetti */}
      <Confetti 
        isActive={showConfettiState} 
        onComplete={() => setShowConfettiState(false)}
      />
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              className={cn(
                "pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg min-w-[300px] max-w-[400px]",
                getToastStyles(toast.type)
              )}
            >
              <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center flex-shrink-0">
                {getToastIcon(toast.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm">{toast.title}</h4>
                <p className="text-sm opacity-80">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="w-6 h-6 rounded-full hover:bg-black/10 flex items-center justify-center transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

// Predefined success messages
export const SuccessMessages = {
  cv: {
    created: { title: 'CV skapat! 🎉', message: 'Bra start på din jobbsökarresa!', type: 'success' as ToastType },
    updated: { title: 'CV uppdaterat!', message: 'Dina ändringar har sparats.', type: 'success' as ToastType },
    completed: { title: 'CV klart! 🌟', message: 'Du är redo att söka jobb!', type: 'milestone' as ToastType },
    sectionAdded: (section: string) => ({ 
      title: `${section} tillagd!`, 
      message: 'Ditt CV blir bättre för varje steg!',
      type: 'success' as ToastType 
    })
  },
  job: {
    saved: { title: 'Jobb sparat! 💼', message: 'Ett steg närmare drömjobbet!', type: 'success' as ToastType },
    applied: { title: 'Ansökan skickad! 📤', message: 'Bra jobbat - du är grym!', type: 'achievement' as ToastType }
  },
  wellness: {
    moodLogged: { title: 'Mående loggat! 💚', message: 'Bra att du tar hand om dig själv.', type: 'success' as ToastType },
    streak: (days: number) => ({ 
      title: `${days} dagar i rad! 🔥`, 
      message: 'Imponerande streak - fortsätt så!',
      type: 'streak' as ToastType 
    })
  },
  quest: {
    completed: { title: 'Quest avklarat! ⚡', message: 'Ett steg närmare dina mål!', type: 'success' as ToastType },
    allCompleted: { title: 'Alla quests klara! 🏆', message: 'Vilken dag! Du är fantastisk!', type: 'achievement' as ToastType }
  },
  login: {
    welcome: (name: string) => ({ 
      title: `Välkommen tillbaka${name ? ', ' + name : ''}! 👋`, 
      message: 'Kul att se dig igen!',
      type: 'success' as ToastType 
    }),
    streak: (days: number) => ({ 
      title: `${days} dagar i rad! 🔥`, 
      message: 'Du bygger en fantastisk vana!',
      type: 'streak' as ToastType 
    })
  }
}

// Celebration overlay for major achievements
export function CelebrationOverlay({ 
  isOpen, 
  onClose, 
  title, 
  message,
  emoji = '🎉'
}: { 
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  emoji?: string
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
          <Confetti isActive={isOpen} />
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center mx-auto mb-6"
            >
              <span className="text-5xl">{emoji}</span>
            </motion.div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
            <p className="text-slate-600 mb-6">{message}</p>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-semibold hover:shadow-lg transition-shadow"
            >
              Fortsätt! 🚀
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Streak fire animation
export function StreakFlame({ days }: { days: number }) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 text-sm font-medium"
    >
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [-5, 5, -5]
        }}
        transition={{ 
          duration: 0.5,
          repeat: Infinity,
          repeatType: 'reverse'
        }}
      >
        <Flame size={16} className="text-orange-500" />
      </motion.div>
      <span>{days}</span>
    </motion.div>
  )
}
