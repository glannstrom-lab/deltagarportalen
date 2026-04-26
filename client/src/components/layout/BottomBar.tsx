import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
import { useState, useEffect, useMemo } from 'react'
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
  const { t } = useTranslation()
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
  const nextSteps = useMemo((): NextStep[] => {
    const path = location.pathname

    // Dashboard / Översikt
    if (path === '/') {
      const steps: NextStep[] = []
      if (!stats.hasCV) {
        steps.push({
          label: t('layout.bottomBar.steps.createCV'),
          path: '/cv',
          icon: FileText,
          description: t('layout.bottomBar.steps.createCVDesc'),
          priority: 'high'
        })
      }
      if (stats.cvScore < 70) {
        steps.push({
          label: t('layout.bottomBar.steps.improveCVScore'),
          path: '/cv',
          icon: Sparkles,
          description: t('layout.bottomBar.steps.improveCVScoreDesc', { score: stats.cvScore }),
          priority: 'high'
        })
      }
      steps.push({
        label: t('layout.bottomBar.steps.exploreInterest'),
        path: '/interest-guide',
        icon: Compass,
        description: t('layout.bottomBar.steps.exploreInterestDesc'),
        priority: 'medium'
      })
      steps.push({
        label: t('layout.bottomBar.steps.searchJobs'),
        path: '/job-search',
        icon: Briefcase,
        description: t('layout.bottomBar.steps.searchJobsDesc'),
        priority: 'medium'
      })
      return steps
    }

    // CV-sidan
    if (path.includes('cv')) {
      return [
        {
          label: t('layout.bottomBar.steps.generateCoverLetter'),
          path: '/cover-letter',
          icon: Mail,
          description: t('layout.bottomBar.steps.generateCoverLetterDesc'),
          priority: 'high'
        },
        {
          label: t('layout.bottomBar.steps.optimizeLinkedIn'),
          path: '/linkedin-optimizer',
          icon: ExternalLink,
          description: t('layout.bottomBar.steps.optimizeLinkedInDesc'),
          priority: 'medium'
        },
        {
          label: t('layout.bottomBar.steps.saveAsPDF'),
          path: '#',
          icon: FileText,
          description: t('layout.bottomBar.steps.saveAsPDFDesc'),
          priority: 'low'
        }
      ]
    }

    // Jobbsökning
    if (path.includes('job-search')) {
      return [
        {
          label: t('layout.bottomBar.steps.savedJobs'),
          path: '/job-search',
          icon: Briefcase,
          description: t('layout.bottomBar.steps.savedJobsDesc'),
          priority: 'high'
        },
        {
          label: t('layout.bottomBar.steps.writeApplication'),
          path: '/cover-letter',
          icon: Mail,
          description: t('layout.bottomBar.steps.writeApplicationDesc'),
          priority: 'high'
        },
        {
          label: t('layout.bottomBar.steps.prepareInterview'),
          path: '/interview-simulator',
          icon: MessageSquare,
          description: t('layout.bottomBar.steps.prepareInterviewDesc'),
          priority: 'medium'
        }
      ]
    }

    // Kunskapsbank
    if (path.includes('knowledge')) {
      return [
        {
          label: t('layout.bottomBar.steps.interestGuide'),
          path: '/interest-guide',
          icon: Compass,
          description: t('layout.bottomBar.steps.interestGuideDesc'),
          priority: 'high'
        },
        {
          label: t('layout.bottomBar.steps.careerPlanning'),
          path: '/career-plan',
          icon: Target,
          description: t('layout.bottomBar.steps.careerPlanningDesc'),
          priority: 'medium'
        },
        {
          label: t('layout.bottomBar.steps.cvBuilder'),
          path: '/cv',
          icon: FileText,
          description: t('layout.bottomBar.steps.cvBuilderDesc'),
          priority: 'medium'
        }
      ]
    }

    // Intresseguiden
    if (path.includes('interest-guide')) {
      return [
        {
          label: t('layout.bottomBar.steps.searchInterestJobs'),
          path: '/job-search',
          icon: Briefcase,
          description: t('layout.bottomBar.steps.searchInterestJobsDesc'),
          priority: 'high'
        },
        {
          label: t('layout.bottomBar.steps.readRelatedArticles'),
          path: '/knowledge-base',
          icon: BookOpen,
          description: t('layout.bottomBar.steps.readRelatedArticlesDesc'),
          priority: 'medium'
        },
        {
          label: t('layout.bottomBar.steps.createCVForArea'),
          path: '/cv',
          icon: FileText,
          description: t('layout.bottomBar.steps.createCVForAreaDesc'),
          priority: 'medium'
        }
      ]
    }

    // Ansökningsbevakning
    if (path.includes('job-tracker')) {
      return [
        {
          label: t('layout.bottomBar.steps.sendMoreApplications'),
          path: '/job-search',
          icon: Send,
          description: t('layout.bottomBar.steps.sendMoreApplicationsDesc'),
          priority: 'high'
        },
        {
          label: t('layout.bottomBar.steps.prepareInterview'),
          path: '/interview-simulator',
          icon: MessageSquare,
          description: t('layout.bottomBar.steps.practiceForCall'),
          priority: 'medium'
        },
        {
          label: t('layout.bottomBar.steps.viewStatistics'),
          path: '/career',
          icon: TrendingUp,
          description: t('layout.bottomBar.steps.yourProgress'),
          priority: 'low'
        }
      ]
    }

    // Personligt brev
    if (path.includes('cover-letter')) {
      return [
        {
          label: t('layout.bottomBar.steps.searchJobsToApply'),
          path: '/job-search',
          icon: Briefcase,
          description: t('layout.bottomBar.steps.findNextJob'),
          priority: 'high'
        },
        {
          label: t('layout.bottomBar.steps.prepareInterview'),
          path: '/interview-simulator',
          icon: MessageSquare,
          description: t('layout.bottomBar.steps.readyForInterview'),
          priority: 'medium'
        },
        {
          label: t('layout.bottomBar.steps.updateCV'),
          path: '/cv',
          icon: FileText,
          description: t('layout.bottomBar.steps.matchLetter'),
          priority: 'medium'
        }
      ]
    }

    // Intervjuträning
    if (path.includes('interview')) {
      return [
        {
          label: t('layout.bottomBar.steps.searchMoreJobs'),
          path: '/job-search',
          icon: Briefcase,
          description: t('layout.bottomBar.steps.moreInterviews'),
          priority: 'high'
        },
        {
          label: t('layout.bottomBar.steps.practiceCV'),
          path: '/cv',
          icon: FileText,
          description: t('layout.bottomBar.steps.prepareAnswers'),
          priority: 'medium'
        },
        {
          label: t('layout.bottomBar.steps.readKnowledgeTips'),
          path: '/knowledge-base',
          icon: BookOpen,
          description: t('layout.bottomBar.steps.moreHelp'),
          priority: 'low'
        }
      ]
    }

    // Dagbok / Mående
    if (path.includes('diary') || path.includes('wellness')) {
      return [
        {
          label: t('layout.bottomBar.steps.takeBreak'),
          path: '/exercises',
          icon: Sparkles,
          description: t('layout.bottomBar.steps.wellnessExercises'),
          priority: 'high'
        },
        {
          label: t('layout.bottomBar.steps.jobSearchTips'),
          path: '/knowledge-base',
          icon: Lightbulb,
          description: t('layout.bottomBar.steps.getInspiration'),
          priority: 'medium'
        },
        {
          label: t('layout.bottomBar.steps.continueCV'),
          path: '/cv',
          icon: FileText,
          description: t('layout.bottomBar.steps.smallSteps'),
          priority: 'low'
        }
      ]
    }

    // Profil
    if (path.includes('profile')) {
      return [
        {
          label: t('layout.bottomBar.steps.updateCV'),
          path: '/cv',
          icon: FileText,
          description: t('layout.bottomBar.steps.keepUpdated'),
          priority: 'high'
        },
        {
          label: t('layout.bottomBar.steps.viewYourStats'),
          path: '/career',
          icon: TrendingUp,
          description: t('layout.bottomBar.steps.yourProgress'),
          priority: 'medium'
        },
        {
          label: t('layout.bottomBar.steps.settings'),
          path: '/settings',
          icon: CheckCircle2,
          description: t('layout.bottomBar.steps.customizePortal'),
          priority: 'low'
        }
      ]
    }

    // Default fallback
    return [
      {
        label: t('layout.bottomBar.steps.backToOverview'),
        path: '/',
        icon: ArrowRight,
        description: t('layout.bottomBar.steps.yourDashboard'),
        priority: 'high'
      },
      {
        label: t('layout.bottomBar.steps.searchJobs'),
        path: '/job-search',
        icon: Briefcase,
        description: t('layout.bottomBar.steps.findJobs'),
        priority: 'medium'
      }
    ]
  }, [location.pathname, stats.hasCV, stats.cvScore, t])
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
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-stone-900 border-t border-slate-200/80 dark:border-stone-700 px-4 py-2 z-30 shadow-lg shadow-slate-200/50 dark:shadow-stone-900/50">
        <div className="max-w-7xl mx-auto">
          
          {/* Övre rad - Stats & Primary Action */}
          <div className="flex items-center justify-between gap-4">
            
            {/* Vänster - Dagens framsteg */}
            <div className="flex items-center gap-4">
              {/* CV-poäng */}
              <Link
                to="/cv"
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-stone-800 transition-colors group"
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", getScoreBg(stats.cvScore))}>
                  <TrendingUp size={18} className={getScoreColor(stats.cvScore)} />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs text-slate-700 dark:text-stone-400">{t('layout.bottomBar.cvScore')}</p>
                  <p className={cn("font-semibold text-sm", getScoreColor(stats.cvScore))}>
                    {stats.cvScore}/100
                  </p>
                </div>
              </Link>

              {/* Ansökningar */}
              <Link
                to="/job-search"
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-stone-800 transition-colors"
              >
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Send size={18} className="text-orange-600" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs text-slate-700 dark:text-stone-400">{t('layout.bottomBar.applications')}</p>
                  <p className="font-semibold text-sm text-slate-700 dark:text-stone-300">{stats.applications}</p>
                </div>
              </Link>

              {/* Dagliga uppgifter */}
              <div className="hidden md:flex items-center gap-2 px-3 py-2">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 size={18} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-700 dark:text-stone-400">{t('layout.bottomBar.dailyGoals')}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-100 dark:bg-stone-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full transition-all"
                        style={{ width: `${taskProgress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-600 dark:text-stone-400">
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
                    ? "bg-slate-100 dark:bg-stone-700 text-slate-700 dark:text-stone-200"
                    : "bg-slate-50 dark:bg-stone-800 text-slate-600 dark:text-stone-400 hover:bg-slate-100 dark:hover:bg-stone-700"
                )}
              >
                <span className="hidden sm:inline text-sm font-medium">{t('layout.bottomBar.nextSteps')}</span>
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
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-stone-700">
              <p className="text-xs font-medium text-slate-700 dark:text-stone-400 uppercase tracking-wider mb-2">
                {t('layout.bottomBar.suggestionsToProgress')}
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
                        ? "bg-teal-50 dark:bg-teal-900/40 border-teal-100 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60"
                        : "bg-white dark:bg-stone-800 border-slate-200 dark:border-stone-700 text-slate-700 dark:text-stone-300 hover:bg-slate-50 dark:hover:bg-stone-700"
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
