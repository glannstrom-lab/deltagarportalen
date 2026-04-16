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
  // NEW ORDER: Quick wins first (Interest + Job = 7 min), then deeper engagement (CV + Cover Letter)
  const items: ChecklistItem[] = [
    {
      id: 'interest-guide',
      title: 'Upptäck dina intressen',
      description: 'Ta reda på vilka yrken som passar dig bäst',
      icon: <Compass size={20} />,
      link: '/interest-guide',
      estimatedTime: '5 min',
      isCompleted: data?.interest?.hasResult ?? false,
      isLocked: false, // Always available - quick win!
      order: 1
    },
    {
      id: 'save-job',
      title: 'Spara ditt första jobb',
      description: 'Hitta och spara ett jobb som verkar intressant',
      icon: <Briefcase size={20} />,
      link: '/job-search',
      estimatedTime: '2 min',
      isCompleted: (data?.jobs?.savedCount ?? 0) > 0,
      isLocked: false, // Always available - quick win!
      order: 2
    },
    {
      id: 'create-cv',
      title: 'Skapa ditt CV',
      description: 'Bygg ett professionellt CV för dina ansökningar',
      icon: <FileText size={20} />,
      link: '/cv',
      estimatedTime: '15 min',
      isCompleted: data?.cv?.hasCV ?? false,
      isLocked: false, // Always available, but comes after quick wins
      order: 3
    },
    {
      id: 'create-cover-letter',
      title: 'Skapa ett personligt brev',
      description: 'Skriv ett brev som kompletterar ditt CV',
      icon: <Mail size={20} />,
      link: '/cover-letter',
      estimatedTime: '10 min',
      isCompleted: (data?.coverLetters?.count ?? 0) > 0,
      isLocked: !data?.cv?.hasCV, // Requires CV - uses CV data for personalization
      order: 4
    }
  ]

  const completedCount = items.filter(item => item.isCompleted).length
  const progress = (completedCount / items.length) * 100
  const allCompleted = completedCount === items.length

  // Quick start milestone: Interest Guide + Save Job completed (first 2 items)
  const quickStartItems = items.filter(item => item.id === 'interest-guide' || item.id === 'save-job')
  const quickStartComplete = quickStartItems.every(item => item.isCompleted)
  const [showQuickStartCelebration, setShowQuickStartCelebration] = useState(false)
  const [quickStartDismissed, setQuickStartDismissed] = useState(false)

  // Show quick start celebration when first 2 items complete
  useEffect(() => {
    if (quickStartComplete && !quickStartDismissed && completedCount < items.length) {
      setShowQuickStartCelebration(true)
    }
  }, [quickStartComplete, quickStartDismissed, completedCount, items.length])

  // Show celebration when all completed
  useEffect(() => {
    if (allCompleted && !showCelebration) {
      setShowCelebration(true)
      setShowQuickStartCelebration(false) // Hide quick start if all done
    }
  }, [allCompleted])

  // Compact version for sidebar or small spaces
  if (compact) {
    return (
      <div className="bg-gradient-to-br from-teal-50 to-sky-50 dark:from-teal-900/30 dark:to-sky-900/30 rounded-xl border border-teal-100 dark:border-teal-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-teal-600 dark:text-teal-400" />
            <span className="font-semibold text-slate-800 dark:text-stone-100">Kom igång</span>
          </div>
          <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">
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
                item.isLocked ? 'text-slate-600 dark:text-stone-500 cursor-not-allowed' : 'text-slate-700 dark:text-stone-300 hover:text-teal-600 dark:hover:text-teal-400'
              )}
            >
              {item.isCompleted ? (
                <CheckCircle2 size={16} className="text-emerald-500 dark:text-emerald-400" />
              ) : item.isLocked ? (
                <Lock size={16} className="text-slate-300 dark:text-stone-600" />
              ) : (
                <Circle size={16} className="text-teal-400 dark:text-teal-500" />
              )}
              <span className={item.isCompleted ? 'line-through opacity-50' : ''}>
                {item.title}
              </span>
            </Link>
          ))}
          {items.length > 2 && (
            <button
              onClick={handleReopen}
              className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium"
            >
              Se alla {items.length} steg →
            </button>
          )}
        </div>
      </div>
    )
  }

  // Quick Start celebration (after Interest Guide + Save Job = 7 min)
  if (showQuickStartCelebration && !allCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-sky-50 to-teal-50 dark:from-sky-900/30 dark:to-teal-900/30 rounded-2xl border border-sky-200 dark:border-sky-800 p-6 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-400 to-teal-500 flex items-center justify-center mx-auto mb-4"
        >
          <Sparkles size={32} className="text-white" />
        </motion.div>
        <h3 className="text-lg font-bold text-sky-800 dark:text-sky-300 mb-2">
          Snabbstart klar! 🚀
        </h3>
        <p className="text-sky-700 dark:text-sky-400 mb-4 text-sm">
          Du vet nu vilka yrken som passar dig och har sparat ditt första jobb.
          Fortsätt med CV:t för att kunna söka!
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowQuickStartCelebration(false)
              setQuickStartDismissed(true)
            }}
            className="border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/30"
          >
            Visa fler steg
          </Button>
          <Link to="/cv">
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
              Skapa CV nu
            </Button>
          </Link>
        </div>
      </motion.div>
    )
  }

  // Full celebration state (all items complete)
  if (showCelebration) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-4"
        >
          <Trophy size={40} className="text-white" />
        </motion.div>
        <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mb-2">
          Grattis! 🎉
        </h3>
        <p className="text-emerald-700 dark:text-emerald-400 mb-4">
          Du har klarat alla steg! Du är nu redo att söka jobb på riktigt.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
          >
            Stäng
          </Button>
          <Link to="/job-search">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              Sök jobb nu
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
      className="bg-white dark:bg-stone-900 rounded-2xl border border-slate-200 dark:border-stone-700 shadow-sm overflow-hidden"
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
                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 opacity-60">
                  <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-stone-700 flex items-center justify-center">
                    <Lock size={20} className="text-slate-600 dark:text-stone-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-700 dark:text-stone-300">{item.title}</h3>
                      <span className="text-xs bg-slate-200 dark:bg-stone-700 text-slate-700 dark:text-stone-400 px-2 py-0.5 rounded-full">
                        Låst
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-stone-400">
                      Avsluta föregående steg först
                    </p>
                  </div>
                </div>
              ) : item.isCompleted ? (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                    <CheckCircle2 size={24} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 line-through">
                      {item.title}
                    </h3>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      {item.description}
                    </p>
                  </div>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-100 dark:bg-emerald-900/50 px-2 py-1 rounded-full">
                    Klart!
                  </span>
                </div>
              ) : (
                <Link
                  to={item.link}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-stone-800 border-2 border-slate-200 dark:border-stone-700 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-100 to-sky-100 dark:from-teal-900/50 dark:to-sky-900/50 flex items-center justify-center text-teal-600 dark:text-teal-400 group-hover:from-teal-200 group-hover:to-sky-200 dark:group-hover:from-teal-900/70 dark:group-hover:to-sky-900/70 transition-colors">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-slate-800 dark:text-stone-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                        {item.title}
                      </h3>
                      <span className="text-xs text-slate-600 dark:text-stone-400">
                        ~{item.estimatedTime}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-stone-300">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-slate-300 dark:text-stone-600 group-hover:text-teal-500 dark:group-hover:text-teal-400 transition-colors" />
                </Link>
              )}
            </motion.div>
          ))}
        </div>

        {/* Footer tip */}
        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/30 rounded-xl border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {completedCount < 2 ? (
              <>
                <strong>Tips:</strong> De första två stegen tar bara ~7 minuter!
                Börja där för att snabbt se vilka jobb som passar dig.
              </>
            ) : (
              <>
                <strong>Tips:</strong> Du kan pausa och fortsätta senare.
                Dina ändringar sparas automatiskt.
              </>
            )}
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
        "bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-400 hover:bg-teal-200 dark:hover:bg-teal-900/70 transition-colors"
      )}
    >
      <Trophy size={16} />
      Visa checklista
    </button>
  )
}
