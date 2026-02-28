import { Link } from 'react-router-dom'
import { 
  FileText, 
  Send, 
  Mail, 
  Plus, 
  Briefcase, 
  Compass,
  TrendingUp
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cvApi, coverLetterApi } from '@/services/api'
import { activityApi } from '@/services/api'

interface BottomBarStats {
  cvScore: number
  applications: number
  coverLetters: number
  hasCV: boolean
  hasInterestResult: boolean
}

export function BottomBar() {
  const [stats, setStats] = useState<BottomBarStats>({
    cvScore: 0,
    applications: 0,
    coverLetters: 0,
    hasCV: false,
    hasInterestResult: false
  })
  const [showQuickActions, setShowQuickActions] = useState(false)

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Hämta CV-poäng
        const ats = await cvApi.getATSAnalysis()
        const cv = await cvApi.getCV()
        const hasCvData = cv ? (!!cv.summary || !!(cv.work_experience && cv.work_experience.length)) : false
        
        // Hämta ansökningsantal
        const applicationCount = await activityApi.getCount('application_sent')
        
        // Hämta antal brev
        const letters = await coverLetterApi.getAll()
        
        setStats({
          cvScore: ats?.score || 0,
          applications: applicationCount,
          coverLetters: letters.length,
          hasCV: hasCvData,
          hasInterestResult: false // Sätts senare om det behövs
        })
      } catch (err) {
        console.error('Fel vid laddning av stats:', err)
      }
    }
    
    loadStats()
  }, [])

  // Färg baserat på CV-score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-accent-green'
    if (score >= 50) return 'text-accent-orange'
    return 'text-slate-500'
  }

  // Snabbåtgärder
  const quickActions = [
    {
      label: 'Nytt CV',
      path: '/cv',
      icon: FileText,
      color: 'bg-accent-orange',
      description: 'Skapa eller redigera'
    },
    {
      label: 'Intresseguide',
      path: '/interest-guide',
      icon: Compass,
      color: 'bg-primary',
      description: 'Hitta din väg'
    },
    {
      label: 'Sök jobb',
      path: '/job-search',
      icon: Briefcase,
      color: 'bg-accent-blue',
      description: 'Hitta lediga jobb'
    },
    {
      label: 'Nytt brev',
      path: '/cover-letter',
      icon: Mail,
      color: 'bg-accent-green',
      description: 'Skapa ansökan'
    }
  ]

  return (
    <>
      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 z-40 lg:left-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Stats - vänster sida */}
          <div className="flex items-center gap-1 sm:gap-6">
            {/* CV-poäng */}
            <Link 
              to="/cv" 
              className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                <TrendingUp size={16} className="text-violet-600" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs text-slate-500">CV-poäng</p>
                <p className={`font-semibold ${getScoreColor(stats.cvScore)}`}>
                  {stats.cvScore}/100
                </p>
              </div>
              <span className="sm:hidden font-semibold text-sm text-violet-600">
                {stats.cvScore}
              </span>
            </Link>

            {/* Ansökningar */}
            <Link 
              to="/job-tracker" 
              className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Send size={16} className="text-orange-600" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs text-slate-500">Ansökningar</p>
                <p className="font-semibold text-slate-700">{stats.applications}</p>
              </div>
              <span className="sm:hidden font-semibold text-sm text-orange-600">
                {stats.applications}
              </span>
            </Link>

            {/* Sparade brev */}
            <Link 
              to="/cover-letter" 
              className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Mail size={16} className="text-blue-600" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs text-slate-500">Sparade brev</p>
                <p className="font-semibold text-slate-700">{stats.coverLetters}</p>
              </div>
              <span className="sm:hidden font-semibold text-sm text-blue-600">
                {stats.coverLetters}
              </span>
            </Link>
          </div>

          {/* Snabbåtgärder - höger sida */}
          <div className="relative">
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
            >
              <Plus size={18} />
              <span className="hidden sm:inline text-sm font-medium">Nytt</span>
            </button>

            {/* Dropdown för snabbåtgärder */}
            {showQuickActions && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowQuickActions(false)}
                />
                <div className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50">
                  {quickActions.map((action) => (
                    <Link
                      key={action.path}
                      to={action.path}
                      onClick={() => setShowQuickActions(false)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div className={`w-10 h-10 ${action.color} rounded-xl flex items-center justify-center text-white`}>
                        <action.icon size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{action.label}</p>
                        <p className="text-xs text-slate-500">{action.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Padding för att innehåll inte ska hamna bakom bottom bar */}
      <div className="h-16" />
    </>
  )
}
