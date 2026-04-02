/**
 * AI Assistant - Personlig jobbassistent
 * Analyserar beteende, ger prediktioner och personliga insikter
 */
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  Brain, 
  TrendingUp, 
  Target, 
  Clock,
  Calendar,
  AlertTriangle,
  Lightbulb,
  ChevronRight,
  X,
  MessageCircle,
  Zap,
  BarChart3,
  Heart
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useAuthStore } from '@/stores/authStore'

// ML-analys resultat
interface BehaviorAnalysis {
  mostActiveDay: string
  mostActiveHour: number
  optimalEnergyLevel: 'low' | 'medium' | 'high'
  completionRate: number
  streakRisk: boolean
  trendDirection: 'up' | 'down' | 'stable'
  predictedInterviewChance: number
  daysToInterview: number | null
  recommendedActions: RecommendedAction[]
  insights: string[]
}

interface RecommendedAction {
  id: string
  action: string
  reason: string
  expectedImpact: string
  priority: 'high' | 'medium' | 'low'
  timeEstimate: string
}

// Mock ML-analys - i produktion skulle detta komma från backend
interface UserData {
  cv?: { progress?: number };
  applications?: { total?: number };
  wellness?: { streakDays?: number };
}

interface Activity {
  created_at: string;
  type: string;
}

function analyzeBehavior(userData: UserData | undefined, activities: Activity[]): BehaviorAnalysis {
  // Simulerad analys baserat på data
  const now = new Date()
  const hour = now.getHours()
  
  // Beräkna trend
  const recentActivities = activities.filter((a) => {
    const activityDate = new Date(a.created_at)
    const daysDiff = (now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24)
    return daysDiff <= 14
  })

  const olderActivities = activities.filter((a) => {
    const activityDate = new Date(a.created_at)
    const daysDiff = (now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24)
    return daysDiff > 14 && daysDiff <= 28
  })
  
  const trendDirection = recentActivities.length > olderActivities.length * 1.2 
    ? 'up' 
    : recentActivities.length < olderActivities.length * 0.8 
      ? 'down' 
      : 'stable'
  
  // Beräkna intervjuchans (mock-algoritm)
  const cvScore = userData?.cv?.progress || 0
  const applicationsCount = userData?.applications?.total || 0
  const wellnessScore = userData?.wellness?.streakDays || 0
  
  const interviewChance = Math.min(95, Math.round(
    (cvScore * 0.4) + 
    (Math.min(applicationsCount * 5, 30)) + 
    (wellnessScore * 2)
  ))
  
  // Förutsäg dagar till intervju
  const daysToInterview = applicationsCount > 0 && interviewChance > 50 
    ? Math.round(14 - (interviewChance / 100) * 10) 
    : null

  return {
    mostActiveDay: 'Tisdag',
    mostActiveHour: 10,
    optimalEnergyLevel: 'medium',
    completionRate: Math.round((userData?.cv?.progress || 0) / 100 * 100),
    streakRisk: wellnessScore > 0 && wellnessScore < 3,
    trendDirection,
    predictedInterviewChance: interviewChance,
    daysToInterview,
    recommendedActions: [
      {
        id: '1',
        action: 'Sök 2 jobb idag',
        reason: `Din chans till intervju är ${interviewChance}% - varje ansökan ökar oddsen!`,
        expectedImpact: '+5% chans till intervju',
        priority: 'high',
        timeEstimate: '20 min'
      },
      {
        id: '2',
        action: 'Logga ditt humör',
        reason: 'Du är mest aktiv på tisdagar 10-11. Perfekt tid för reflektion!',
        expectedImpact: 'Bättre självkännedom',
        priority: 'medium',
        timeEstimate: '1 min'
      },
      {
        id: '3',
        action: 'Uppdatera CV-mallen',
        reason: 'ATS-analysen visar att din mall kan förbättras',
        expectedImpact: '+10% ATS-score',
        priority: 'medium',
        timeEstimate: '10 min'
      }
    ],
    insights: [
      `Du är ${trendDirection === 'up' ? '40% mer' : trendDirection === 'down' ? '20% mindre' : 'lika'} aktiv än förra månaden`,
      'Dina ansökningar på tisdagar får 3x fler svar',
      'När du loggar välmående ökar din aktivitet med 25%',
      applicationsCount > 5 
        ? `Baserat på din takt: Intervju inom ${daysToInterview || 14} dagar (konfidens: ${interviewChance}%)`
        : 'Öka takten: Användare som söker 5+ jobb har 78% chans till intervju inom 30 dagar'
    ]
  }
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'actions'>('overview')
  const { data } = useDashboardData()
  const { user } = useAuthStore()
  
  // Simulerad aktivitetsdata - i produktion från API
  const mockActivities = useMemo(() => [
    { created_at: new Date(Date.now() - 86400000).toISOString(), type: 'login' },
    { created_at: new Date(Date.now() - 172800000).toISOString(), type: 'cv_update' },
    { created_at: new Date(Date.now() - 259200000).toISOString(), type: 'job_search' },
  ], [])
  
  const analysis = useMemo(() => 
    analyzeBehavior(data, mockActivities),
    [data, mockActivities]
  )

  // Hälsning baserat på tid
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'God morgon'
    if (hour < 17) return 'God eftermiddag'
    return 'God kväll'
  }

  return (
    <>
      {/* Floating AI Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "fixed bottom-24 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg",
          "bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium",
          "hover:shadow-xl transition-shadow"
        )}
      >
        <Brain size={20} />
        <span className="hidden sm:inline">Din AI-assistent</span>
      </motion.button>

      {/* AI Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Brain size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">
                        {getGreeting()}, {user?.firstName || 'där'}!
                      </h2>
                      <p className="text-white/90 text-sm">
                        Jag har analyserat din aktivitet
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                  {(['overview', 'insights', 'actions'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                        activeTab === tab
                          ? 'bg-white text-violet-600'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      )}
                    >
                      {tab === 'overview' && 'Översikt'}
                      {tab === 'insights' && 'Insikter'}
                      {tab === 'actions' && 'Rekommendationer'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {activeTab === 'overview' && (
                  <OverviewTab analysis={analysis} />
                )}
                {activeTab === 'insights' && (
                  <InsightsTab analysis={analysis} />
                )}
                {activeTab === 'actions' && (
                  <ActionsTab analysis={analysis} onClose={() => setIsOpen(false)} />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function OverviewTab({ analysis }: { analysis: BehaviorAnalysis }) {
  return (
    <div className="space-y-6">
      {/* Prediction Card */}
      <div className="p-5 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl border border-violet-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <Target size={20} className="text-violet-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Din prognos</h3>
            <p className="text-sm text-slate-500">Baserat på din aktivitet</p>
          </div>
        </div>
        
        <div className="flex items-end gap-2 mb-2">
          <span className="text-4xl font-bold text-violet-600">
            {analysis.predictedInterviewChance}%
          </span>
          <span className="text-slate-600 mb-1">chans till intervju</span>
        </div>
        
        {analysis.daysToInterview && (
          <p className="text-sm text-slate-600">
            Baserat på din takt: <span className="font-semibold">Intervju inom {analysis.daysToInterview} dagar</span>
          </p>
        )}
        
        <div className="mt-4 h-2 bg-violet-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${analysis.predictedInterviewChance}%` }}
            transition={{ duration: 1 }}
            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
          />
        </div>
      </div>

      {/* Pattern Cards */}
      <div className="grid grid-cols-2 gap-4">
        <PatternCard
          icon={<Clock size={18} />}
          label="Bästa tiden"
          value={`${analysis.mostActiveDay} ${analysis.mostActiveHour}:00`}
          subtext="Du är mest produktiv då"
        />
        <PatternCard
          icon={<Heart size={18} />}
          label="Optimal energi"
          value={analysis.optimalEnergyLevel === 'medium' ? 'Medel' : analysis.optimalEnergyLevel}
          subtext="För bästa resultat"
        />
        <PatternCard
          icon={<TrendingUp size={18} />}
          label="Trend"
          value={analysis.trendDirection === 'up' ? '↗️ Uppåt' : analysis.trendDirection === 'down' ? '↘️ Neråt' : '→ Stabil'}
          subtext="Senaste 14 dagarna"
        />
        <PatternCard
          icon={<BarChart3 size={18} />}
          label="Completion rate"
          value={`${analysis.completionRate}%`}
          subtext="Av påbörjade uppgifter"
        />
      </div>

      {/* Streak Warning */}
      {analysis.streakRisk && (
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-800">Streak-risk upptäckt!</h4>
            <p className="text-sm text-amber-700">
              Din streak håller på att brytas. Logga in idag för att behålla den!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function InsightsTab({ analysis }: { analysis: BehaviorAnalysis }) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-slate-800 flex items-center gap-2">
        <Lightbulb size={18} className="text-amber-500" />
        AI-genererade insikter
      </h3>
      
      {analysis.insights.map((insight, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
            <Zap size={16} className="text-violet-500" />
          </div>
          <p className="text-slate-700">{insight}</p>
        </motion.div>
      ))}
    </div>
  )
}

function ActionsTab({ analysis, onClose }: { analysis: BehaviorAnalysis; onClose: () => void }) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-slate-800 flex items-center gap-2">
        <Target size={18} className="text-violet-500" />
        Rekommenderade åtgärder
      </h3>
      
      {analysis.recommendedActions.map((action, index) => (
        <motion.div
          key={action.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={cn(
            "p-4 rounded-xl border transition-all",
            action.priority === 'high' 
              ? 'bg-violet-50 border-violet-200' 
              : 'bg-slate-50 border-slate-200'
          )}
        >
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              action.priority === 'high' ? 'bg-violet-100' : 'bg-white'
            )}>
              <Sparkles size={18} className="text-violet-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-slate-800">{action.action}</h4>
              <p className="text-sm text-slate-600 mt-1">{action.reason}</p>
              <div className="flex items-center gap-4 mt-3">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock size={12} />
                  {action.timeEstimate}
                </span>
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <TrendingUp size={12} />
                  {action.expectedImpact}
                </span>
              </div>
            </div>
            <ChevronRight size={20} className="text-slate-300" />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function PatternCard({ icon, label, value, subtext }: { 
  icon: React.ReactNode
  label: string
  value: string
  subtext: string
}) {
  return (
    <div className="p-4 bg-slate-50 rounded-xl">
      <div className="flex items-center gap-2 text-slate-400 mb-2">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="font-semibold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500">{subtext}</p>
    </div>
  )
}

export default AIAssistant
