/**
 * AI Assistant - Personlig jobbassistent
 * Analyserar beteende, ger prediktioner och personliga insikter
 */
import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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

function analyzeBehavior(userData: UserData | undefined, activities: Activity[], t: (key: string, options?: Record<string, unknown>) => string): BehaviorAnalysis {
  // Simulated analysis based on data
  const now = new Date()
  const hour = now.getHours()

  // Calculate trend
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

  // Calculate interview chance (mock algorithm)
  const cvScore = userData?.cv?.progress || 0
  const applicationsCount = userData?.applications?.total || 0
  const wellnessScore = userData?.wellness?.streakDays || 0

  const interviewChance = Math.min(95, Math.round(
    (cvScore * 0.4) +
    (Math.min(applicationsCount * 5, 30)) +
    (wellnessScore * 2)
  ))

  // Predict days to interview
  const daysToInterview = applicationsCount > 0 && interviewChance > 50
    ? Math.round(14 - (interviewChance / 100) * 10)
    : null

  return {
    mostActiveDay: t('ai.assistant.days.tuesday'),
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
        action: t('ai.assistant.actions.searchJobs'),
        reason: t('ai.assistant.actions.searchJobsReason', { chance: interviewChance }),
        expectedImpact: t('ai.assistant.actions.searchJobsImpact'),
        priority: 'high',
        timeEstimate: '20 min'
      },
      {
        id: '2',
        action: t('ai.assistant.actions.logMood'),
        reason: t('ai.assistant.actions.logMoodReason'),
        expectedImpact: t('ai.assistant.actions.logMoodImpact'),
        priority: 'medium',
        timeEstimate: '1 min'
      },
      {
        id: '3',
        action: t('ai.assistant.actions.updateCV'),
        reason: t('ai.assistant.actions.updateCVReason'),
        expectedImpact: t('ai.assistant.actions.updateCVImpact'),
        priority: 'medium',
        timeEstimate: '10 min'
      }
    ],
    insights: [
      t('ai.assistant.insights.activityTrend', {
        trend: trendDirection === 'up' ? t('ai.assistant.insights.moreActive') : trendDirection === 'down' ? t('ai.assistant.insights.lessActive') : t('ai.assistant.insights.equalActive')
      }),
      t('ai.assistant.insights.tuesdayApplications'),
      t('ai.assistant.insights.wellnessBoost'),
      applicationsCount > 5
        ? t('ai.assistant.insights.interviewPrediction', { days: daysToInterview || 14, confidence: interviewChance })
        : t('ai.assistant.insights.increaseRate')
    ]
  }
}

export function AIAssistant() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'actions'>('overview')
  const { data } = useDashboardData()
  const { user } = useAuthStore()

  // Simulated activity data - in production from API
  const mockActivities = useMemo(() => [
    { created_at: new Date(Date.now() - 86400000).toISOString(), type: 'login' },
    { created_at: new Date(Date.now() - 172800000).toISOString(), type: 'cv_update' },
    { created_at: new Date(Date.now() - 259200000).toISOString(), type: 'job_search' },
  ], [])

  const analysis = useMemo(() =>
    analyzeBehavior(data, mockActivities, t),
    [data, mockActivities, t]
  )

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t('ai.assistant.greeting.morning')
    if (hour < 17) return t('ai.assistant.greeting.afternoon')
    return t('ai.assistant.greeting.evening')
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
          "bg-gradient-to-r from-[var(--c-solid)] to-sky-500 text-white font-medium",
          "hover:shadow-xl transition-shadow"
        )}
      >
        <Brain size={20} />
        <span className="hidden sm:inline">{t('ai.assistant.title')}</span>
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
              className="bg-white dark:bg-stone-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[var(--c-solid)] to-sky-500 p-6 text-white">
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
                        {t('ai.assistant.analyzedActivity')}
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
                          ? 'bg-white text-[var(--c-text)]'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      )}
                    >
                      {tab === 'overview' && t('ai.assistant.tabs.overview')}
                      {tab === 'insights' && t('ai.assistant.tabs.insights')}
                      {tab === 'actions' && t('ai.assistant.tabs.recommendations')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {activeTab === 'overview' && (
                  <OverviewTab analysis={analysis} t={t} />
                )}
                {activeTab === 'insights' && (
                  <InsightsTab analysis={analysis} t={t} />
                )}
                {activeTab === 'actions' && (
                  <ActionsTab analysis={analysis} onClose={() => setIsOpen(false)} t={t} />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function OverviewTab({ analysis, t }: { analysis: BehaviorAnalysis; t: (key: string, options?: Record<string, unknown>) => string }) {
  return (
    <div className="space-y-6">
      {/* Prediction Card */}
      <div className="p-5 bg-gradient-to-br from-[var(--c-bg)] to-sky-50 dark:from-[var(--c-bg)]/40 dark:to-sky-900/30 rounded-2xl border border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/50 flex items-center justify-center">
            <Target size={20} className="text-[var(--c-text)] dark:text-[var(--c-text)]" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-800 dark:text-stone-100">{t('ai.assistant.overview.yourForecast')}</h3>
            <p className="text-sm text-stone-700 dark:text-stone-300">{t('ai.assistant.overview.basedOnActivity')}</p>
          </div>
        </div>

        <div className="flex items-end gap-2 mb-2">
          <span className="text-4xl font-bold text-[var(--c-text)] dark:text-[var(--c-text)]">
            {analysis.predictedInterviewChance}%
          </span>
          <span className="text-stone-600 dark:text-stone-400 mb-1">{t('ai.assistant.overview.interviewChance')}</span>
        </div>

        {analysis.daysToInterview && (
          <p className="text-sm text-stone-600 dark:text-stone-400">
            {t('ai.assistant.overview.basedOnPace')}: <span className="font-semibold">{t('ai.assistant.overview.interviewWithin', { days: analysis.daysToInterview })}</span>
          </p>
        )}
        
        <div className="mt-4 h-2 bg-[var(--c-accent)]/60 dark:bg-[var(--c-solid)] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${analysis.predictedInterviewChance}%` }}
            transition={{ duration: 1 }}
            className="h-full bg-gradient-to-r from-[var(--c-solid)] to-sky-500 rounded-full"
          />
        </div>
      </div>

      {/* Pattern Cards */}
      <div className="grid grid-cols-2 gap-4">
        <PatternCard
          icon={<Clock size={18} />}
          label={t('ai.assistant.patterns.bestTime')}
          value={`${analysis.mostActiveDay} ${analysis.mostActiveHour}:00`}
          subtext={t('ai.assistant.patterns.mostProductive')}
        />
        <PatternCard
          icon={<Heart size={18} />}
          label={t('ai.assistant.patterns.optimalEnergy')}
          value={analysis.optimalEnergyLevel === 'medium' ? t('ai.assistant.patterns.medium') : analysis.optimalEnergyLevel}
          subtext={t('ai.assistant.patterns.forBestResults')}
        />
        <PatternCard
          icon={<TrendingUp size={18} />}
          label={t('ai.assistant.patterns.trend')}
          value={analysis.trendDirection === 'up' ? t('ai.assistant.patterns.trendUp') : analysis.trendDirection === 'down' ? t('ai.assistant.patterns.trendDown') : t('ai.assistant.patterns.trendStable')}
          subtext={t('ai.assistant.patterns.last14Days')}
        />
        <PatternCard
          icon={<BarChart3 size={18} />}
          label={t('ai.assistant.patterns.completionRate')}
          value={`${analysis.completionRate}%`}
          subtext={t('ai.assistant.patterns.ofStartedTasks')}
        />
      </div>

      {/* Streak Warning */}
      {analysis.streakRisk && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/30 rounded-xl border border-amber-200 dark:border-amber-800 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-800 dark:text-amber-200">{t('ai.assistant.streakRisk.title')}</h4>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              {t('ai.assistant.streakRisk.message')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function InsightsTab({ analysis, t }: { analysis: BehaviorAnalysis; t: (key: string) => string }) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-stone-800 dark:text-stone-100 flex items-center gap-2">
        <Lightbulb size={18} className="text-amber-500" />
        {t('ai.assistant.insightsTab.title')}
      </h3>

      {analysis.insights.map((insight, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-4 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700 flex items-start gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-white dark:bg-stone-700 flex items-center justify-center flex-shrink-0">
            <Zap size={16} className="text-[var(--c-solid)]" />
          </div>
          <p className="text-stone-700 dark:text-stone-300">{insight}</p>
        </motion.div>
      ))}
    </div>
  )
}

function ActionsTab({ analysis, onClose, t }: { analysis: BehaviorAnalysis; onClose: () => void; t: (key: string) => string }) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-stone-800 dark:text-stone-100 flex items-center gap-2">
        <Target size={18} className="text-[var(--c-solid)]" />
        {t('ai.assistant.actionsTab.title')}
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
              ? 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50'
              : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700'
          )}
        >
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              action.priority === 'high' ? 'bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/50' : 'bg-white dark:bg-stone-700'
            )}>
              <Sparkles size={18} className="text-[var(--c-text)] dark:text-[var(--c-text)]" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-stone-800 dark:text-stone-100">{action.action}</h4>
              <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">{action.reason}</p>
              <div className="flex items-center gap-4 mt-3">
                <span className="text-xs text-stone-700 dark:text-stone-300 flex items-center gap-1">
                  <Clock size={12} />
                  {action.timeEstimate}
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <TrendingUp size={12} />
                  {action.expectedImpact}
                </span>
              </div>
            </div>
            <ChevronRight size={20} className="text-stone-300 dark:text-stone-600" />
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
    <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-xl">
      <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400 mb-2">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="font-semibold text-stone-800 dark:text-stone-100">{value}</p>
      <p className="text-xs text-stone-700 dark:text-stone-300">{subtext}</p>
    </div>
  )
}

export default AIAssistant
