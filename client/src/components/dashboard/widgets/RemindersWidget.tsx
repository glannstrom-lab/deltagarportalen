/**
 * RemindersWidget - Påminnelser om påbörjade uppgifter, streak-hot, mm
 * "Don't let users forget what they started"
 */
import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, 
  Clock, 
  Flame, 
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  X,
  Play,
  RotateCcw,
  Calendar,
  TrendingUp
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { DashboardWidget } from '../DashboardWidget'
import { useDashboardData } from '@/hooks/useDashboardData'
import { cn } from '@/lib/utils'
import { differenceInDays, parseISO, format } from 'date-fns'
import { sv } from 'date-fns/locale'

interface Reminder {
  id: string
  type: 'in-progress' | 'streak-risk' | 'milestone' | 'follow-up'
  priority: 'high' | 'medium' | 'low'
  title: string
  message: string
  action: string
  link: string
  dueDate?: string
  progress?: number
  icon: React.ReactNode
  color: string
}

export function RemindersWidget({ 
  size = 'medium',
  loading 
}: { 
  size?: 'small' | 'medium' | 'large'
  loading?: boolean 
}) {
  const { data } = useDashboardData()
  const [dismissed, setDismissed] = useState<string[]>([])

  const reminders = useMemo<Reminder[]>(() => {
    if (!data) return []
    
    const list: Reminder[] = []
    
    // 1. Pågående uppgifter
    if (data.cv?.hasCV && data.cv.progress > 0 && data.cv.progress < 100) {
      const lastEdited = data.cv.lastEdited 
        ? differenceInDays(new Date(), parseISO(data.cv.lastEdited))
        : 0
      
      list.push({
        id: 'cv-in-progress',
        type: 'in-progress',
        priority: lastEdited > 2 ? 'high' : 'medium',
        title: 'CV påbörjat',
        message: lastEdited > 2 
          ? `Du började ditt CV för ${lastEdited} dagar sedan. En liten stund till så är du klar!`
          : `Du har kommit ${data.cv.progress}% igång. Fortsätt så!`,
        action: 'Fortsätt bygga',
        link: '/cv',
        progress: data.cv.progress,
        icon: <RotateCcw size={20} />,
        color: 'violet',
      })
    }

    // 2. Streak-risk
    const lastLogin = localStorage.getItem('lastLoginDate')
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    
    if (lastLogin === yesterday && data.activity?.streakDays && data.activity.streakDays > 0) {
      list.push({
        id: 'streak-risk',
        type: 'streak-risk',
        priority: 'high',
        title: `🔥 ${data.activity.streakDays} dagar i rad!`,
        message: 'Logga in idag för att behålla din streak. Du kan göra något litet!',
        action: 'Rädda streaken',
        link: '/dashboard',
        icon: <Flame size={20} />,
        color: 'orange',
      })
    }

    // 3. Milstolpar nära
    if (data.cv?.progress === 90) {
      list.push({
        id: 'milestone-cv',
        type: 'milestone',
        priority: 'medium',
        title: '🎯 Så nära!',
        message: 'Bara 10% kvar på ditt CV. Du kan klara det idag!',
        action: 'Kör sista biten',
        link: '/cv',
        progress: 90,
        icon: <TrendingUp size={20} />,
        color: 'emerald',
      })
    }

    // 4. Följ upp ansökningar
    if (data.applications?.total > 0) {
      // Mock: om det gått en vecka sedan ansökan
      list.push({
        id: 'follow-up',
        type: 'follow-up',
        priority: 'low',
        title: 'Följ upp ansökan',
        message: 'Det har gått en vecka sedan du skickade en ansökan. Dags att följa upp?',
        action: 'Se ansökningar',
        link: '/job-tracker',
        icon: <Calendar size={20} />,
        color: 'blue',
      })
    }

    // 5. Intresseguide påbörjad men ej klar
    if (data.interest?.answeredQuestions && data.interest.answeredQuestions > 0 
        && !data.interest.hasResult) {
      const remaining = data.interest.totalQuestions - data.interest.answeredQuestions
      list.push({
        id: 'interest-incomplete',
        type: 'in-progress',
        priority: 'medium',
        title: 'Intresseguide påbörjad',
        message: `Du har svarat på ${data.interest.answeredQuestions} frågor. Bara ${remaining} kvar!`,
        action: 'Fortsätt testet',
        link: '/interest-guide',
        progress: (data.interest.answeredQuestions / data.interest.totalQuestions) * 100,
        icon: <Play size={20} />,
        color: 'teal',
      })
    }

    // Sortera efter prioritet
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return list
      .filter(r => !dismissed.includes(r.id))
      .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
  }, [data, dismissed])

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDismissed(prev => [...prev, id])
  }

  // Small variant
  if (size === 'small') {
    const highPriority = reminders.filter(r => r.priority === 'high')
    
    return (
      <DashboardWidget
        title="Påminnelser"
        icon={<Bell size={14} />}
        to="#"
        color="amber"
        size="small"
      >
        <div className="flex items-center gap-2">
          {highPriority.length > 0 ? (
            <>
              <AlertTriangle size={14} className="text-amber-500" />
              <span className="text-sm font-medium text-amber-700">
                {highPriority.length} viktig
              </span>
            </>
          ) : reminders.length > 0 ? (
            <>
              <Bell size={14} className="text-slate-400" />
              <span className="text-sm text-slate-600">
                {reminders.length} påminnelser
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span className="text-sm text-slate-500">Allt klart!</span>
            </>
          )}
        </div>
      </DashboardWidget>
    )
  }

  // Medium/Large variant
  return (
    <DashboardWidget
      title="Påminnelser"
      icon={<Bell size={22} />}
      to="#"
      color="amber"
      size={size}
    >
      <div className="space-y-3">
        {reminders.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={24} className="text-emerald-600" />
            </div>
            <p className="text-slate-600 font-medium">Allt är uppdaterat!</p>
            <p className="text-sm text-slate-400 mt-1">
              Du har inga påminnelser just nu
            </p>
          </div>
        ) : (
          <>
            {reminders.slice(0, size === 'large' ? 5 : 3).map((reminder, index) => (
              <motion.div
                key={reminder.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={reminder.link}
                  className={cn(
                    "block p-3 rounded-xl border transition-all group relative",
                    reminder.priority === 'high' 
                      ? 'bg-amber-50 border-amber-200 hover:bg-amber-100'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  )}
                >
                  {/* Dismiss button */}
                  <button
                    onClick={(e) => handleDismiss(e, reminder.id)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full hover:bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} className="text-slate-400" />
                  </button>

                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                      reminder.priority === 'high' ? 'bg-amber-100 text-amber-600' : 'bg-white text-slate-500'
                    )}>
                      {reminder.icon}
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-semibold text-slate-800">
                          {reminder.title}
                        </h4>
                        {reminder.priority === 'high' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-800 font-medium">
                            Viktig
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mb-2">
                        {reminder.message}
                      </p>
                      
                      {/* Progress bar if applicable */}
                      {reminder.progress !== undefined && (
                        <div className="mb-3">
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${reminder.progress}%` }}
                              transition={{ duration: 0.5 }}
                              className={cn(
                                "h-full rounded-full",
                                reminder.priority === 'high' ? 'bg-amber-500' : 'bg-violet-500'
                              )}
                            />
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {reminder.progress}% klart
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm font-medium text-violet-600">
                        <span>{reminder.action}</span>
                        <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}

            {reminders.length > (size === 'large' ? 5 : 3) && (
              <p className="text-center text-sm text-slate-400 pt-2">
                +{reminders.length - (size === 'large' ? 5 : 3)} till påminnelser
              </p>
            )}
          </>
        )}
      </div>
    </DashboardWidget>
  )
}

export default RemindersWidget
