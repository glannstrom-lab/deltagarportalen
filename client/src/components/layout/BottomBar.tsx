import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  FileText, 
  Send, 
  Mail, 
  Plus, 
  Briefcase, 
  Compass,
  TrendingUp,
  ArrowRight,
  Target,
  Sparkles,
  BookOpen,
  Calendar,
  CheckCircle2,
  MessageSquare,
  Lightbulb,
  ChevronRight,
  ExternalLink
} from '@/components/ui/icons'
import { useState, useEffect } from 'react'
import { cvApi, coverLetterApi } from '@/services/api'
import { activityApi } from '@/services/api'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import CrisisSupport from '@/components/CrisisSupport'

interface BottomBarStats {
  cvScore: number
  applications: number
  coverLetters: number
  hasCV: boolean
  hasInterestResult: boolean
  dailyTasksCompleted: number
  dailyTasksTotal: number
}

interface NextStep {
  label: string
  path: string
  icon: React.ElementType
  description: string
  priority: 'high' | 'medium' | 'low'
}

export function BottomBar() {
  const [stats, setStats] = useState<BottomBarStats>({
    cvScore: 0,
    applications: 0,
    coverLetters: 0,
    hasCV: false,
    hasInterestResult: false,
    dailyTasksCompleted: 0,
    dailyTasksTotal: 3
  })
  const [showNextSteps, setShowNextSteps] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    loadStats()
  }, [location.pathname])

  const loadStats = async () => {
    try {
      const ats = await cvApi.getATSAnalysis()
      const cv = await cvApi.getCV()
      const hasCvData = cv ? (!!cv.summary || !!(cv.work_experience && cv.work_experience.length)) : false
      const applicationCount = await activityApi.getCount('application_sent')
      const letters = await coverLetterApi.getAll()
      
      // Hämta dagliga uppgifter
      const { data: tasks } = await supabase
        .from('daily_tasks')
        .select('completed')
        .eq('due_date', new Date().toISOString().split('T')[0])
      
      const completed = tasks?.filter(t => t.completed).length || 0
      
      setStats({
        cvScore: ats?.score || 0,
        applications: applicationCount,
        coverLetters: letters.length,
        hasCV: hasCvData,
        hasInterestResult: false,
        dailyTasksCompleted: completed,
        dailyTasksTotal: Math.max(3, tasks?.length || 3)
      })
    } catch (err) {
      console.error('Fel vid laddning av stats:', err)
    }
  }

  // Hämta kontextuella nästa steg baserat på nuvarande sida
  const getContextualNextSteps = (): NextStep[] => {
    const path = location.pathname
    
    // Dashboard / Översikt
    if (path === '/') {
      const steps: NextStep[] = []
      if (!stats.hasCV) {
        steps.push({
          label: 'Skapa ditt CV',
          path: '/cv',
          icon: FileText,
          description: 'Kom igång med ditt CV',
          priority: 'high'
        })
      }
      if (stats.cvScore < 70) {
        steps.push({
          label: 'Förbättra CV-poäng',
          path: '/cv',
          icon: Sparkles,
          description: `Du har ${stats.cvScore}/100 - höj det!`,
          priority: 'high'
        })
      }
      steps.push({
        label: 'Utforska intresseguide',
        path: '/interest-guide',
        icon: Compass,
        description: 'Hitta din riktning',
        priority: 'medium'
      })
      steps.push({
        label: 'Sök lediga jobb',
        path: '/job-search',
        icon: Briefcase,
        description: 'Se vad som finns',
        priority: 'medium'
      })
      return steps
    }
    
    // CV-sidan
    if (path.includes('cv')) {
      return [
        {
          label: 'Generera personligt brev',
          path: '/cover-letter',
          icon: Mail,
          description: 'Matcha ditt CV',
          priority: 'high'
        },
        {
          label: 'Optimera LinkedIn',
          path: '/linkedin-optimizer',
          icon: ExternalLink,
          description: 'Synas för rekryterare',
          priority: 'medium'
        },
        {
          label: 'Spara som PDF',
          path: '#',
          icon: FileText,
          description: 'Ladda ner CV:t',
          priority: 'low'
        }
      ]
    }
    
    // Jobbsökning
    if (path.includes('job-search')) {
      return [
        {
          label: 'Sparade jobb',
          path: '/job-search',
          icon: Briefcase,
          description: 'Se dina sparade',
          priority: 'high'
        },
        {
          label: 'Skriv ansökan',
          path: '/cover-letter',
          icon: Mail,
          description: 'Börja ansöka',
          priority: 'high'
        },
        {
          label: 'Förbered intervju',
          path: '/interview-simulator',
          icon: MessageSquare,
          description: 'Öva inför intervjun',
          priority: 'medium'
        }
      ]
    }
    
    // Kunskapsbank
    if (path.includes('knowledge')) {
      return [
        {
          label: 'Intresseguiden',
          path: '/interest-guide',
          icon: Compass,
          description: 'Hitta din väg',
          priority: 'high'
        },
        {
          label: 'Karriärplanering',
          path: '/career-plan',
          icon: Target,
          description: 'Planera din framtid',
          priority: 'medium'
        },
        {
          label: 'CV-byggare',
          path: '/cv',
          icon: FileText,
          description: 'Bygg ditt CV',
          priority: 'medium'
        }
      ]
    }
    
    // Intresseguiden
    if (path.includes('interest-guide')) {
      return [
        {
          label: 'Sök jobb inom intresse',
          path: '/job-search',
          icon: Briefcase,
          description: 'Hitta matchande jobb',
          priority: 'high'
        },
        {
          label: 'Läs relaterade artiklar',
          path: '/knowledge-base',
          icon: BookOpen,
          description: 'Fördjupa dig',
          priority: 'medium'
        },
        {
          label: 'Skapa CV för området',
          path: '/cv',
          icon: FileText,
          description: 'Anpassa ditt CV',
          priority: 'medium'
        }
      ]
    }
    
    // Ansökningsbevakning
    if (path.includes('job-tracker')) {
      return [
        {
          label: 'Skicka fler ansökningar',
          path: '/job-search',
          icon: Send,
          description: 'Öka dina chanser',
          priority: 'high'
        },
        {
          label: 'Förbered intervju',
          path: '/interview-simulator',
          icon: MessageSquare,
          description: 'Öva inför samtal',
          priority: 'medium'
        },
        {
          label: 'Se statistik',
          path: '/career',
          icon: TrendingUp,
          description: 'Din utveckling',
          priority: 'low'
        }
      ]
    }
    
    // Personligt brev
    if (path.includes('cover-letter')) {
      return [
        {
          label: 'Sök jobb att ansöka till',
          path: '/job-search',
          icon: Briefcase,
          description: 'Hitta nästa jobb',
          priority: 'high'
        },
        {
          label: 'Förbered intervju',
          path: '/interview-simulator',
          icon: MessageSquare,
          description: 'Redo för intervjun?',
          priority: 'medium'
        },
        {
          label: 'Uppdatera CV',
          path: '/cv',
          icon: FileText,
          description: 'Matcha brevet',
          priority: 'medium'
        }
      ]
    }
    
    // Intervjuträning
    if (path.includes('interview')) {
      return [
        {
          label: 'Sök fler jobb',
          path: '/job-search',
          icon: Briefcase,
          description: 'Fler intervjuer',
          priority: 'high'
        },
        {
          label: 'Öva på CV-frågor',
          path: '/cv',
          icon: FileText,
          description: 'Förbered svar',
          priority: 'medium'
        },
        {
          label: 'Läs tips i kunskapsbanken',
          path: '/knowledge-base',
          icon: BookOpen,
          description: 'Mer hjälp',
          priority: 'low'
        }
      ]
    }
    
    // Dagbok / Mående
    if (path.includes('diary') || path.includes('wellness')) {
      return [
        {
          label: 'Ta en paus',
          path: '/exercises',
          icon: Sparkles,
          description: 'Välmåendeövningar',
          priority: 'high'
        },
        {
          label: 'Jobbsökningstips',
          path: '/knowledge-base',
          icon: Lightbulb,
          description: 'Få inspiration',
          priority: 'medium'
        },
        {
          label: 'Fortsätt med CV',
          path: '/cv',
          icon: FileText,
          description: 'Små steg framåt',
          priority: 'low'
        }
      ]
    }
    
    // Profil
    if (path.includes('profile')) {
      return [
        {
          label: 'Uppdatera CV',
          path: '/cv',
          icon: FileText,
          description: 'Håll det aktuellt',
          priority: 'high'
        },
        {
          label: 'Se din statistik',
          path: '/career',
          icon: TrendingUp,
          description: 'Din utveckling',
          priority: 'medium'
        },
        {
          label: 'Inställningar',
          path: '/settings',
          icon: CheckCircle2,
          description: 'Anpassa portalen',
          priority: 'low'
        }
      ]
    }
    
    // Default fallback
    return [
      {
        label: 'Tillbaka till översikt',
        path: '/',
        icon: ArrowRight,
        description: 'Din dashboard',
        priority: 'high'
      },
      {
        label: 'Sök jobb',
        path: '/job-search',
        icon: Briefcase,
        description: 'Hitta lediga jobb',
        priority: 'medium'
      }
    ]
  }

  const nextSteps = getContextualNextSteps()
  const primaryAction = nextSteps[0]
  const secondaryActions = nextSteps.slice(1, 4)

  // Färg baserat på CV-score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 50) return 'text-yellow-500'
    return 'text-slate-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 50) return 'bg-yellow-100'
    return 'bg-slate-100'
  }

  // Dagliga uppgifter progress
  const taskProgress = (stats.dailyTasksCompleted / stats.dailyTasksTotal) * 100

  return (
    <>
      {/* Smart Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/80 px-4 py-2 z-30 shadow-lg shadow-slate-200/50">
        <div className="max-w-7xl mx-auto">
          
          {/* Övre rad - Stats & Primary Action */}
          <div className="flex items-center justify-between gap-4">
            
            {/* Vänster - Dagens framsteg */}
            <div className="flex items-center gap-4">
              {/* CV-poäng */}
              <Link 
                to="/cv" 
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", getScoreBg(stats.cvScore))}>
                  <TrendingUp size={18} className={getScoreColor(stats.cvScore)} />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs text-slate-700">CV-poäng</p>
                  <p className={cn("font-semibold text-sm", getScoreColor(stats.cvScore))}>
                    {stats.cvScore}/100
                  </p>
                </div>
              </Link>

              {/* Ansökningar */}
              <Link 
                to="/job-search" 
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Send size={18} className="text-orange-600" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs text-slate-700">Ansökningar</p>
                  <p className="font-semibold text-sm text-slate-700">{stats.applications}</p>
                </div>
              </Link>

              {/* Dagliga uppgifter */}
              <div className="hidden md:flex items-center gap-2 px-3 py-2">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 size={18} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-700">Dagens mål</p>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-teal-500 rounded-full transition-all"
                        style={{ width: `${taskProgress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-600">
                      {stats.dailyTasksCompleted}/{stats.dailyTasksTotal}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mitten - Crisis Support (desktop) */}
            <div className="hidden lg:flex items-center">
              <CrisisSupport variant="inline" />
            </div>

            {/* Höger - Kontextuell Primary Action */}
            <div className="flex items-center gap-3">
              {/* Nästa steg dropdown trigger */}
              <button
                onClick={() => setShowNextSteps(!showNextSteps)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all",
                  showNextSteps 
                    ? "bg-slate-100 text-slate-700" 
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                )}
              >
                <span className="hidden sm:inline text-sm font-medium">Nästa steg</span>
                <ChevronRight 
                  size={18} 
                  className={cn("transition-transform", showNextSteps && "rotate-90")} 
                />
              </button>

              {/* Primary Action Button */}
              {primaryAction && (
                <Link
                  to={primaryAction.path}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium transition-all hover:shadow-lg hover:shadow-teal-500/25",
                    primaryAction.priority === 'high'
                      ? "bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-400 hover:to-sky-400"
                      : "bg-slate-700 hover:bg-slate-600"
                  )}
                >
                  <primaryAction.icon size={18} />
                  <span className="hidden sm:inline text-sm">{primaryAction.label}</span>
                </Link>
              )}
            </div>
          </div>

          {/* Expanderad sektion - Nästa steg */}
          {showNextSteps && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-700 uppercase tracking-wider mb-2">
                Förslag för att komma vidare
              </p>
              <div className="flex flex-wrap gap-2">
                {secondaryActions.map((step, index) => (
                  <Link
                    key={index}
                    to={step.path}
                    onClick={() => setShowNextSteps(false)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all hover:shadow-sm",
                      step.priority === 'high'
                        ? "bg-teal-50 border-teal-100 text-teal-700 hover:bg-teal-100"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <step.icon size={16} />
                    <span className="text-sm font-medium">{step.label}</span>
                    <span className="hidden md:inline text-xs opacity-70">• {step.description}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Padding för att innehåll inte ska hamna bakom bottom bar */}
      <div className="h-28" />
    </>
  )
}
