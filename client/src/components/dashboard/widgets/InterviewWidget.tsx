import { memo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MessageSquare, Mic, ChevronRight, Trophy, Star, Play, TrendingUp } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface InterviewWidgetProps {
  completedSessions?: number
  averageScore?: number
  lastPractice?: string | null
  totalQuestions?: number
  size?: 'mini' | 'medium' | 'large'
}

export const InterviewWidget = memo(function InterviewWidget({
  completedSessions = 0,
  averageScore = 0,
  lastPractice = null,
  totalQuestions = 50,
  size = 'medium'
}: InterviewWidgetProps) {
  const { t } = useTranslation()
  const hasStarted = completedSessions > 0

  // MINI
  if (size === 'mini') {
    return (
      <Link
        to="/interview-simulator"
        className="group flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all duration-200"
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
          <MessageSquare size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t('interviewWidget.interview')}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {hasStarted ? t('interviewWidget.sessionsCount', { count: completedSessions }) : t('interviewWidget.practiceNow')}
          </p>
        </div>
        {averageScore > 0 && (
          <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 rounded text-xs font-medium">
            {averageScore}%
          </span>
        )}
      </Link>
    )
  }

  // MEDIUM
  if (size === 'medium') {
    return (
      <Link
        to="/interview-simulator"
        className="group block bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{t('interviewWidget.interviewTraining')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {hasStarted ? t('interviewWidget.completedCount', { count: completedSessions }) : t('interviewWidget.aiSimulator')}
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
        </div>

        <div className="flex items-center gap-3">
          {hasStarted ? (
            <>
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{averageScore}%</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">{t('interviewWidget.averageScore')}</span>
            </>
          ) : (
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Mic size={16} />
              <span className="text-sm">{t('interviewWidget.startTraining')}</span>
            </div>
          )}
        </div>
      </Link>
    )
  }

  // LARGE
  return (
    <Link
      to="/interview-simulator"
      className="group block bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <MessageSquare size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('interviewWidget.interviewTraining')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {hasStarted ? t('interviewWidget.practicesCompleted', { count: completedSessions }) : t('interviewWidget.practiceQuestions')}
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 mt-1 transition-colors" />
      </div>

      {/* Info card */}
      {hasStarted ? (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 mb-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
            <Trophy size={24} className="text-indigo-500 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">{t('interviewWidget.greatJob')}</p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400">{t('interviewWidget.averageScoreLabel', { score: averageScore })}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 mb-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
            <Mic size={24} className="text-indigo-500 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">{t('interviewWidget.startPracticing')}</p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400">{t('interviewWidget.aiDrivenSimulator')}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-indigo-500 dark:text-indigo-400" />
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{completedSessions}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('interviewWidget.exercises')}</p>
        </div>
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Star size={16} className="text-purple-500 dark:text-purple-400 fill-current" />
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{averageScore || '-'}%</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('interviewWidget.averageScore')}</p>
        </div>
      </div>

      {/* Action */}
      <div className="flex gap-2">
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-medium group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/60 transition-colors">
          <Play size={12} />
          {hasStarted ? t('interviewWidget.continueTraining') : t('interviewWidget.startTraining')}
        </span>
      </div>
    </Link>
  )
})

export default InterviewWidget
