import { useEffect, useState } from 'react'
import { Calendar, CheckCircle2, Clock, FileText, Briefcase, TrendingUp, Award } from 'lucide-react'

interface WeeklyStats {
  logins: number
  timeSpent: number // minutes
  cvProgress: number
  applications: number
  articlesRead: number
  stepsCompleted: number
}

interface WeeklySummaryProps {
  stats: WeeklyStats
  isVisible: boolean
  onClose: () => void
}

export function WeeklySummary({ stats, isVisible, onClose }: WeeklySummaryProps) {
  const [, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  if (!isVisible) return null

  const getMotivationMessage = () => {
    const totalScore = stats.applications * 10 + stats.stepsCompleted * 5 + stats.articlesRead * 3
    
    if (totalScore === 0) {
      return 'Det är okej att ta det lugnt ibland. Nästa vecka kan bli din vecka! 🌱'
    } else if (totalScore < 20) {
      return 'Bra jobbat! Du har tagit steg framåt denna vecka. 💪'
    } else if (totalScore < 50) {
      return 'Fantastisk insats! Du är på god väg mot ditt mål. ⭐'
    } else {
      return 'Wow! Du har verkligen satsat denna vecka. Du ska vara stolt! 🎉'
    }
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const statItems = [
    {
      icon: <Clock className="w-5 h-5 text-blue-500" />,
      label: 'Aktiv i portalen',
      value: formatTime(stats.timeSpent),
      color: 'bg-blue-50 text-blue-700'
    },
    {
      icon: <FileText className="w-5 h-5 text-teal-500" />,
      label: 'CV framsteg',
      value: `${stats.cvProgress}%`,
      color: 'bg-teal-50 text-teal-700'
    },
    {
      icon: <Briefcase className="w-5 h-5 text-amber-500" />,
      label: 'Ansökningar',
      value: stats.applications.toString(),
      color: 'bg-amber-50 text-amber-700'
    },
    {
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      label: 'Steg avklarade',
      value: stats.stepsCompleted.toString(),
      color: 'bg-green-50 text-green-700'
    }
  ]

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="weekly-summary-title"
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white p-6 rounded-t-3xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">Veckosammanfattning</span>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors"
              aria-label="Stäng"
            >
              ✕
            </button>
          </div>
          
          <h2 
            id="weekly-summary-title"
            className="text-2xl font-bold mb-2"
          >
            Din vecka i siffror
          </h2>
          <p className="text-teal-100 text-sm">
            {new Date().toLocaleDateString('sv-SE', { month: 'long', day: 'numeric' })} - idag
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {statItems.map((item, index) => (
              <div 
                key={item.label}
                className={`p-4 rounded-xl ${item.color} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-2 mb-1">
                  {item.icon}
                  <span className="text-xs font-medium opacity-75">{item.label}</span>
                </div>
                <div className="text-2xl font-bold">{item.value}</div>
              </div>
            ))}
          </div>

          {/* Achievement Badge */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900">Veckans prestation</h3>
                <p className="text-sm text-amber-800">
                  {getMotivationMessage()}
                </p>
              </div>
            </div>
          </div>

          {/* Comparison */}
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl mb-6">
            <TrendingUp className="w-5 h-5 text-teal-500 flex-shrink-0" />
            <p className="text-sm text-slate-600">
              Du har varit aktiv <strong>{stats.logins} dagar</strong> denna vecka. 
              {stats.logins >= 3 
                ? ' Fantastisk kontinuitet!' 
                : ' Varje dag räknas - bra jobbat!'}
            </p>
          </div>

          {/* Next Week Goals */}
          <div className="border-t border-slate-100 pt-4">
            <h3 className="font-medium text-slate-800 mb-3">Inför nästa vecka</h3>
            <ul className="space-y-2">
              {stats.cvProgress < 100 && (
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
                  Färdigställ ditt CV
                </li>
              )}
              {stats.applications === 0 && (
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
                  Skicka din första ansökan
                </li>
              )}
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
                Fortsätt ta små steg varje dag
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            Fortsätt mot nya mål! 🚀
          </button>
        </div>
      </div>
    </div>
  )
}
