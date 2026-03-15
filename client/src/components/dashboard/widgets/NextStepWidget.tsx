/**
 * NextStepWidget - Visar det mest relevanta nästa steget för användaren
 * Dynamiskt baserat på användarens progress
 */
import { motion } from 'framer-motion'
import { 
  ArrowRight, 
  FileText, 
  Compass, 
  Briefcase,
  Mail,
  Target,
  Clock,
  Zap
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useEnergyStore, type EnergyLevel } from '@/stores/energyStore'
import { DashboardWidget } from '../DashboardWidget'
import { cn } from '@/lib/utils'

interface NextStep {
  id: string
  title: string
  description: string
  action: string
  link: string
  icon: React.ReactNode
  timeEstimate: string
  energyLevel: EnergyLevel
  priority: number
  color: string
  gradient: string
}

export function NextStepWidget() {
  const { data, loading } = useDashboardData()
  const { level: userEnergy } = useEnergyStore()

  if (loading || !data) {
    return (
      <DashboardWidget
        title="Nästa steg"
        icon={<Target size={22} />}
        to="#"
        color="indigo"
      >
        <div className="h-24 bg-slate-100 rounded-lg animate-pulse" />
      </DashboardWidget>
    )
  }

  // Define all possible next steps
  const allSteps: NextStep[] = [
    {
      id: 'start-cv',
      title: 'Skapa ditt CV',
      description: 'Börja med grundinformation för att komma igång',
      action: 'Starta nu',
      link: '/cv',
      icon: <FileText size={24} />,
      timeEstimate: '15 min',
      energyLevel: 'medium',
      priority: 100,
      color: 'text-violet-700',
      gradient: 'from-violet-500 to-purple-600'
    },
    {
      id: 'complete-cv',
      title: 'Färdigställ ditt CV',
      description: `Du har ${data.cv.progress}% klart. Lägg till mer information för att nå 100%`,
      action: 'Fortsätt bygga',
      link: '/cv',
      icon: <FileText size={24} />,
      timeEstimate: '10 min',
      energyLevel: 'medium',
      priority: 90,
      color: 'text-violet-700',
      gradient: 'from-violet-500 to-purple-600'
    },
    {
      id: 'interest-guide',
      title: 'Gör intresseguiden',
      description: 'Upptäck vilka yrken som passar dina intressen',
      action: 'Starta guiden',
      link: '/interest-guide',
      icon: <Compass size={24} />,
      timeEstimate: '5 min',
      energyLevel: 'low',
      priority: 80,
      color: 'text-teal-700',
      gradient: 'from-teal-500 to-emerald-600'
    },
    {
      id: 'save-job',
      title: 'Spara ett jobb',
      description: 'Hitta och spara ditt första jobb att söka',
      action: 'Hitta jobb',
      link: '/job-search',
      icon: <Briefcase size={24} />,
      timeEstimate: '2 min',
      energyLevel: 'low',
      priority: 70,
      color: 'text-blue-700',
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'create-cover-letter',
      title: 'Skapa personligt brev',
      description: 'Skriv ett brev som kompletterar ditt CV',
      action: 'Skriv brev',
      link: '/cover-letter',
      icon: <Mail size={24} />,
      timeEstimate: '10 min',
      energyLevel: 'medium',
      priority: 60,
      color: 'text-rose-700',
      gradient: 'from-rose-500 to-pink-600'
    },
    {
      id: 'apply-job',
      title: 'Skicka en ansökan',
      description: `Du har ${data.jobs?.savedCount ?? 0} sparade jobb. Sök ett nu!`,
      action: 'Ansök nu',
      link: '/job-search',
      icon: <Target size={24} />,
      timeEstimate: '20 min',
      energyLevel: 'high',
      priority: 50,
      color: 'text-amber-700',
      gradient: 'from-amber-500 to-orange-600'
    },
    {
      id: 'daily-quest',
      title: 'Avsluta en daglig quest',
      description: 'Gör dagens uppgifter för att bygga din streak',
      action: 'Se quests',
      link: '/quests',
      icon: <Zap size={24} />,
      timeEstimate: '5 min',
      energyLevel: 'low',
      priority: 40,
      color: 'text-yellow-700',
      gradient: 'from-yellow-500 to-amber-600'
    }
  ]

  // Filter steps based on conditions
  const availableSteps = allSteps.filter(step => {
    switch (step.id) {
      case 'start-cv':
        return !data.cv.hasCV
      case 'complete-cv':
        return data.cv.hasCV && data.cv.progress < 100
      case 'interest-guide':
        return data.cv.hasCV && !data.interest.hasResult
      case 'save-job':
        return data.cv.hasCV && data.interest.hasResult && data.jobs.savedCount === 0
      case 'create-cover-letter':
        return data.cv.hasCV && data.cv.progress >= 50 && data.coverLetters.count === 0
      case 'apply-job':
        return data.jobs.savedCount > 0 && data.applications.total === 0
      case 'daily-quest':
        return true // Always show as fallback
      default:
        return true
    }
  })

  // Filter by energy level
  const energyCompatibleSteps = availableSteps.filter(step => {
    if (userEnergy === 'low') return step.energyLevel === 'low'
    if (userEnergy === 'medium') return step.energyLevel !== 'high'
    return true
  })

  // Get highest priority step
  const nextStep = energyCompatibleSteps.length > 0 
    ? energyCompatibleSteps.reduce((a, b) => a.priority > b.priority ? a : b)
    : allSteps[allSteps.length - 1] // Fallback to daily quest

  const getEnergyEmoji = (level: EnergyLevel) => {
    switch (level) {
      case 'low': return '😌'
      case 'medium': return '😐'
      case 'high': return '😊'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Link to={nextStep.link} className="block group">
        <div className={cn(
          "relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 transition-all",
          "hover:shadow-lg hover:shadow-violet-500/20 hover:-translate-y-0.5",
          nextStep.gradient
        )}>
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium">
                <Target size={12} />
                Rekommenderat nästa steg
              </span>
              <span className="text-white/80 text-sm flex items-center gap-1">
                {getEnergyEmoji(nextStep.energyLevel)}
                <span className="capitalize">{nextStep.energyLevel}</span> energi
              </span>
            </div>

            {/* Content */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                {nextStep.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-white mb-1">
                  {nextStep.title}
                </h3>
                <p className="text-white/90 text-sm mb-3">
                  {nextStep.description}
                </p>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-xs text-white/80">
                    <Clock size={12} />
                    {nextStep.timeEstimate}
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-violet-700 text-sm font-semibold group-hover:bg-white/90 transition-colors">
                    {nextStep.action}
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// Small variant for compact spaces
export function NextStepWidgetCompact() {
  const { data } = useDashboardData()
  const { level: userEnergy } = useEnergyStore()

  if (!data) return null

  // Simplified logic for compact version
  let title: string
  let link: string
  let color: string

  if (!data.cv.hasCV) {
    title = 'Skapa CV'
    link = '/cv'
    color = 'bg-violet-100 text-violet-700'
  } else if (!data.interest.hasResult) {
    title = 'Intresseguide'
    link = '/interest-guide'
    color = 'bg-teal-100 text-teal-700'
  } else if (data.jobs.savedCount === 0) {
    title = 'Spara ett jobb'
    link = '/job-search'
    color = 'bg-blue-100 text-blue-700'
  } else {
    title = 'Sök jobb'
    link = '/job-search'
    color = 'bg-amber-100 text-amber-700'
  }

  return (
    <Link
      to={link}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:shadow-sm",
        color
      )}
    >
      <Target size={16} />
      <span>Nästa: {title}</span>
      <ArrowRight size={14} className="ml-auto" />
    </Link>
  )
}
