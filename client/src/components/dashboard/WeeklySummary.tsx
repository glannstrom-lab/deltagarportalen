/**
 * WeeklySummary - Veckosammanfattning för användaren
 * Visar framsteg och motiverar fortsatt användning
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Calendar,
  Target,
  ChevronDown,
  ChevronUp,
  Award,
  Zap,
  Briefcase,
  FileText,
  Heart
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { useDashboardData } from '@/hooks/useDashboardData'

interface WeeklyStats {
  cvProgress: number
  cvProgressChange: number
  jobsSaved: number
  applicationsSent: number
  wellnessDays: number
  questsCompleted: number
  totalTimeSpent: number // in minutes
}

interface WeeklySummaryProps {
  className?: string
}

export function WeeklySummary({ className }: WeeklySummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { data, loading } = useDashboardData()

  // Mock weekly stats - in production, fetch from API
  const stats: WeeklyStats = {
    cvProgress: data?.cv?.progress ?? 0,
    cvProgressChange: 15, // Mock: +15% this week
    jobsSaved: data?.jobs?.savedCount ?? 0,
    applicationsSent: data?.applications?.total ?? 0,
    wellnessDays: 3, // Mock
    questsCompleted: 12, // Mock
    totalTimeSpent: 145 // Mock: 2h 25min
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins} min`
    if (mins === 0) return `${hours} h`
    return `${hours} h ${mins} min`
  }

  const summaryItems = [
    {
      icon: <FileText size={18} />,
      label: 'CV-progress',
      value: `${stats.cvProgress}%`,
      change: stats.cvProgressChange > 0 ? `+${stats.cvProgressChange}%` : null,
      changeType: 'positive' as const,
      color: 'text-violet-600 bg-violet-100'
    },
    {
      icon: <Briefcase size={18} />,
      label: 'Jobb sparade',
      value: stats.jobsSaved,
      change: null,
      changeType: 'neutral' as const,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      icon: <Target size={18} />,
      label: 'Ansökningar',
      value: stats.applicationsSent,
      change: null,
      changeType: 'neutral' as const,
      color: 'text-amber-600 bg-amber-100'
    },
    {
      icon: <Heart size={18} />,
      label: 'Välmåendedagar',
      value: `${stats.wellnessDays}/7`,
      change: null,
      changeType: 'neutral' as const,
      color: 'text-rose-600 bg-rose-100'
    },
    {
      icon: <Zap size={18} />,
      label: 'Quests klara',
      value: stats.questsCompleted,
      change: null,
      changeType: 'neutral' as const,
      color: 'text-yellow-600 bg-yellow-100'
    }
  ]

  // Get motivational message based on stats
  const getMotivationalMessage = () => {
    if (stats.cvProgress === 0) {
      return {
        title: 'Kom igång denna veckan!',
        message: 'Börja med att skapa ditt CV - det är första steget mot nya möjligheter!'
      }
    }
    if (stats.cvProgress >= 100 && stats.applicationsSent > 0) {
      return {
        title: 'Du är på gång! 🌟',
        message: 'Fantastiskt jobbat! Du har ett komplett CV och har skickat ansökningar. Fortsätt så!'
      }
    }
    if (stats.cvProgress >= 100) {
      return {
        title: 'CV:t är klart! 🎉',
        message: 'Bra jobbat! Nu är det dags att börja söka jobb. Du kan det här!'
      }
    }
    if (stats.cvProgressChange > 10) {
      return {
        title: 'Vilken vecka! 🚀',
        message: `Du har ökat ditt CV med ${stats.cvProgressChange}% denna veckan. Imponerande!`
      }
    }
    if (stats.wellnessDays >= 5) {
      return {
        title: 'Du tar hand om dig! 💚',
        message: `${stats.wellnessDays} dagar med välmående denna veckan. Så viktigt!`
      }
    }
    return {
      title: 'Bra fortsättning!',
      message: 'Varje litet steg räknas. Du är på rätt väg!'
    }
  }

  const motivation = getMotivationalMessage()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-100/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
            <Calendar size={20} className="text-indigo-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-800">Din vecka</h3>
            <p className="text-xs text-slate-700">
              {formatTime(stats.totalTimeSpent)} aktiv tid
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-700">
            {isExpanded ? 'Dölj' : 'Visa'}
          </span>
          {isExpanded ? (
            <ChevronUp size={18} className="text-slate-600" />
          ) : (
            <ChevronDown size={18} className="text-slate-600" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-slate-200"
        >
          {/* Motivational Message */}
          <div className="p-4 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                <Award size={16} className="text-violet-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 text-sm">{motivation.title}</h4>
                <p className="text-sm text-slate-600 mt-0.5">{motivation.message}</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="p-4 grid grid-cols-2 gap-3">
            {summaryItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200"
              >
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", item.color)}>
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800">{item.value}</span>
                    {item.change && (
                      <span className="text-xs text-emerald-600 font-medium flex items-center">
                        <TrendingUp size={10} className="mr-0.5" />
                        {item.change}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-700">{item.label}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Week Goals */}
          <div className="px-4 pb-4">
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Veckans mål</span>
                <span className="text-xs text-slate-700">2 av 3 klara</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '66%' }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                />
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <TrendingUp size={12} className="text-emerald-600" />
                  </div>
                  <span className="text-slate-600 line-through">Logga mående 3 dagar</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <TrendingUp size={12} className="text-emerald-600" />
                  </div>
                  <span className="text-slate-600 line-through">Fyll i CV till 80%</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                  </div>
                  <span className="text-slate-700">Spara 3 jobb</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

// Compact inline version
export function WeeklySummaryBadge() {
  const { data } = useDashboardData()
  
  // Mock: calculate weekly progress
  const weeklyProgress = 66
  
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-100 to-indigo-100 text-violet-700 text-xs font-medium">
      <TrendingUp size={14} />
      <span>Veckan: {weeklyProgress}%</span>
    </div>
  )
}
