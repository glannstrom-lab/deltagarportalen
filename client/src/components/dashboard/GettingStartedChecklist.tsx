/**
 * GettingStartedChecklist - Onboarding-checklista för nya användare
 * Ger en tydlig väg till "first 5 minutes win"
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle2, 
  Circle, 
  Lock,
  FileText, 
  Compass, 
  Briefcase,
  Mail,
  Sparkles,
  ChevronRight,
  Trophy,
  X
} from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { useDashboardDataQuery } from '@/hooks/useDashboardData'
import { userPreferencesApi } from '@/services/cloudStorage'

interface ChecklistItem {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  link: string
  estimatedTime: string
  isCompleted: boolean
  isLocked: boolean
  order: number
}

interface GettingStartedChecklistProps {
  onClose?: () => void
  compact?: boolean
}

export function GettingStartedChecklist({ onClose, compact = false }: GettingStartedChecklistProps) {
  const { data, isLoading } = useDashboardDataQuery()
  const [showCelebration, setShowCelebration] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Check if user has dismissed the checklist (from cloud)
  useEffect(() => {
    const checkDismissed = async () => {
      const isDismissed = await userPreferencesApi.isChecklistDismissed()
      if (isDismissed) {
        setDismissed(true)
      }
    }
    checkDismissed()
  }, [])

  const handleDismiss = async () => {
    await userPreferencesApi.setChecklistDismissed(true)
    setDismissed(true)
    onClose?.()
  }

  const handleReopen = async () => {
    await userPreferencesApi.setChecklistDismissed(false)
    setDismissed(false)
  }

  // Define checklist items based on user progress
  const items: ChecklistItem[] = [
    {
      id: 'create-cv',
      title: 'Skapa ditt CV',
      description: 'Börja bygga din profil med grundinformation',
      icon: <FileText size={20} />,
      link: '/cv',
      estimatedTime: '15 min',
      isCompleted: data?.cv?.hasCV ?? false,
      isLocked: false,
      order: 1
    },
    {
      id: 'interest-guide',
      title: 'Gör intresseguiden',
      description: 'Hitta yrken som matchar dina intressen',
      icon: <Compass size={20} />,
      link: '/interest-guide',
      estimatedTime: '5 min',
      isCompleted: data?.interest?.hasResult ?? false,
      isLocked: !data?.cv?.hasCV,
      order: 2
    },
    {
      id: 'save-job',
      title: 'Spara ditt första jobb',
      description: 'Hitta och spara ett jobb som verkar intressant',
      icon: <Briefcase size={20} />,
      link: '/job-search',
      estimatedTime: '2 min',
      isCompleted: (data?.jobs?.savedCount ?? 0) > 0,
      isLocked: !data?.cv?.hasCV,
      order: 3
    },
    {
      id: 'create-cover-letter',
      title: 'Skapa ett personligt brev',
      description: 'Skriv ett brev för dina framtida ansökningar',
      icon: <Mail size={20} />,
      link: '/cover-letter',
      estimatedTime: '10 min',
      isCompleted: (data?.coverLetters?.count ?? 0) > 0,
      isLocked: !data?.cv?.hasCV,
      order: 4
    }
  ]

  const completedCount = items.filter(item => item.isCompleted).length
  const progress = (completedCount / items.length) * 100
  const allCompleted = completedCount === items.length

  // Show celebration when all completed
  useEffect(() => {
    if (allCompleted && !showCelebration) {
      setShowCelebration(true)
    }
  }, [allCompleted])

  // Compact version for sidebar or small spaces
  if (compact) {
    return (
      <div className="bg-gradient-to-br from-teal-50 to-sky-50 rounded-xl border border-teal-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-teal-600" />
            <span className="font-semibold text-slate-800">Kom igång</span>
          </div>
          <span className="text-xs text-teal-600 font-medium">
            {completedCount}/{items.length}
          </span>
        </div>
        <Progress value={progress} className="h-2 mb-3" />
        <div className="space-y-2">
          {items.slice(0, 2).map(item => (
            <Link
              key={item.id}
              to={item.isLocked ? '#' : item.link}
              className={cn(
                "flex items-center gap-2 text-sm",
                item.isLocked ? 'text-slate-600 cursor-not-allowed' : 'text-slate-700 hover:text-teal-600'
              )}
            >
              {item.isCompleted ? (
                <CheckCircle2 size={16} className="text-emerald-500" />
              ) : item.isLocked ? (
                <Lock size={16} className="text-slate-300" />
              ) : (
                <Circle size={16} className="text-teal-400" />
              )}
              <span className={item.isCompleted ? 'line-through opacity-50' : ''}>
                {item.title}
              </span>
            </Link>
          ))}
          {items.length > 2 && (
            <button 
              onClick={handleReopen}
              className="text-xs text-teal-600 hover:text-teal-700 font-medium"
            >
              Se alla {items.length} steg →
            </button>
          )}
        </div>
      </div>
    )
  }

  // Celebration state
  if (showCelebration) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-4"
        >
          <Trophy size={40} className="text-white" />
        </motion.div>
        <h3 className="text-xl font-bold text-emerald-800 mb-2">
          Grattis! 🎉
        </h3>
        <p className="text-emerald-700 mb-4">
          Du har klarat alla steg i Getting Started! Du är nu redo att söka jobb.
        </p>
        <div className="flex gap-3 justify-center">
          <Button 
            variant="outline" 
            onClick={handleDismiss}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            Stäng
          </Button>
          <Link to="/job-search">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              Hitta jobb nu
            </Button>
          </Link>
        </div>
      </motion.div>
    )
  }

  // Main checklist view
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-sky-500 p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Välkommen! 👋</h2>
              <p className="text-white/90 text-sm">
                Följ dessa steg för att komma igång
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={handleDismiss}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              aria-label="Stäng välkomstguiden"
            >
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Din progress</span>
            <span className="font-semibold">{completedCount} av {items.length} klara</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-full bg-white rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Checklist Items */}
      <div className="p-6">
        <div className="space-y-4">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {item.isLocked ? (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 opacity-60">
                  <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center">
                    <Lock size={20} className="text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-700">{item.title}</h3>
                      <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                        Låst
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      Avsluta föregående steg först
                    </p>
                  </div>
                </div>
              ) : item.isCompleted ? (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 size={24} className="text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-emerald-800 line-through">
                      {item.title}
                    </h3>
                    <p className="text-sm text-emerald-600">
                      {item.description}
                    </p>
                  </div>
                  <span className="text-xs text-emerald-600 font-medium bg-emerald-100 px-2 py-1 rounded-full">
                    Klart!
                  </span>
                </div>
              ) : (
                <Link
                  to={item.link}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white border-2 border-slate-200 hover:border-teal-300 hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-100 to-sky-100 flex items-center justify-center text-teal-600 group-hover:from-teal-200 group-hover:to-sky-200 transition-colors">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-slate-800 group-hover:text-teal-700 transition-colors">
                        {item.title}
                      </h3>
                      <span className="text-xs text-slate-600">
                        ~{item.estimatedTime}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-teal-500 transition-colors" />
                </Link>
              )}
            </motion.div>
          ))}
        </div>

        {/* Footer tip */}
        <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-sm text-amber-800">
            <strong>Tips:</strong> Du kan alltid pausa och fortsätta senare. 
            Dina ändringar sparas automatiskt.
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// Button to reopen checklist if dismissed
export function ReopenChecklistButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
        "bg-teal-100 text-teal-700 hover:bg-teal-200 transition-colors"
      )}
    >
      <Trophy size={16} />
      Visa checklista
    </button>
  )
}
