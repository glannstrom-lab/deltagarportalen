/**
 * NextStepWidget - Dashboard widget för nästa steg
 * 
 * Visar kontextuella rekommendationer baserat på användarens progress
 */

import { useState, useEffect } from 'react'
import { 
  ArrowRight, Sparkles, Loader2, RefreshCw,
  FileText, Search, Send, TrendingUp, User
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { nextStepApi, type NextStep, type UserProgress } from '@/services/workflowApi'

interface NextStepWidgetProps {
  className?: string
}

export function NextStepWidget({ className }: NextStepWidgetProps) {
  const [nextStep, setNextStep] = useState<NextStep | null>(null)
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNextStep = async () => {
    setLoading(true)
    setError(null)
    try {
      const [step, userProgress] = await Promise.all([
        nextStepApi.getNextStep(),
        nextStepApi.getUserProgress()
      ])
      setNextStep(step)
      setProgress(userProgress)
    } catch (err) {
      setError('Kunde inte hämta nästa steg')
      console.error('Fel vid hämtning av nästa steg:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNextStep()
  }, [])

  if (loading) {
    return (
      <div className={cn(
        "bg-white rounded-2xl shadow-sm border border-slate-200 p-6",
        className
      )}>
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-violet-500" />
        </div>
      </div>
    )
  }

  if (error || !nextStep) {
    return (
      <div className={cn(
        "bg-white rounded-2xl shadow-sm border border-slate-200 p-6",
        className
      )}>
        <div className="text-center py-6">
          <p className="text-slate-500">{error || 'Inget steg tillgängligt'}</p>
          <button
            onClick={fetchNextStep}
            className="mt-3 flex items-center gap-2 mx-auto text-violet-600 hover:text-violet-700"
          >
            <RefreshCw size={16} />
            Försök igen
          </button>
        </div>
      </div>
    )
  }

  const getIcon = () => {
    switch (nextStep.type) {
      case 'CREATE_CV':
        return <FileText size={24} className="text-violet-600" />
      case 'SEARCH_JOBS':
        return <Search size={24} className="text-blue-600" />
      case 'CREATE_APPLICATION':
        return <Send size={24} className="text-teal-600" />
      case 'CONTINUE_SEARCH':
        return <TrendingUp size={24} className="text-green-600" />
      case 'COMPLETE_PROFILE':
        return <Sparkles size={24} className="text-amber-600" />
      default:
        return <ArrowRight size={24} className="text-violet-600" />
    }
  }

  const getBackgroundColor = () => {
    switch (nextStep.type) {
      case 'CREATE_CV':
        return 'from-violet-500 to-purple-600'
      case 'SEARCH_JOBS':
        return 'from-blue-500 to-cyan-600'
      case 'CREATE_APPLICATION':
        return 'from-teal-500 to-emerald-600'
      case 'CONTINUE_SEARCH':
        return 'from-green-500 to-emerald-600'
      case 'COMPLETE_PROFILE':
        return 'from-amber-500 to-orange-600'
      default:
        return 'from-violet-500 to-purple-600'
    }
  }

  return (
    <div className={cn(
      "bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden",
      className
    )}>
      {/* Header med gradient */}
      <div className={cn(
        "bg-gradient-to-r px-6 py-4 text-white",
        getBackgroundColor()
      )}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            {getIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-lg">
              {nextStep.message}
            </h3>
            {nextStep.submessage && (
              <p className="text-white/80 text-sm">
                {nextStep.submessage}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Primary Action */}
        <Link
          to={nextStep.action.link}
          className={cn(
            "flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-medium transition-all",
            "bg-slate-900 text-white hover:bg-slate-800"
          )}
        >
          {nextStep.action.label}
          <ArrowRight size={18} />
        </Link>

        {/* Secondary Action */}
        {nextStep.secondaryAction && (
          <Link
            to={nextStep.secondaryAction.link}
            className="flex items-center justify-center gap-2 w-full mt-3 py-2.5 px-4 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {nextStep.secondaryAction.label}
          </Link>
        )}

        {/* Stats summary (if applicable) */}
        {progress && progress.applicationsCount > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {progress.applicationsCount}
                </p>
                <p className="text-xs text-slate-500">Ansökningar</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {progress.savedJobsCount}
                </p>
                <p className="text-xs text-slate-500">Sparade jobb</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {progress.coverLettersCount}
                </p>
                <p className="text-xs text-slate-500">Personliga brev</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick actions row */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="text-sm text-slate-500">Eller:</span>
          <div className="flex items-center gap-1">
            <QuickLink to="/dashboard/cv" icon={<FileText size={14} />}>
              CV
            </QuickLink>
            <QuickLink to="/dashboard/job-search" icon={<Search size={14} />}>
              Sök
            </QuickLink>
            <QuickLink to="/dashboard/job-tracker" icon={<TrendingUp size={14} />}>
              Tracker
            </QuickLink>
          </div>
        </div>
      </div>
    </div>
  )
}

// Quick Link Component
function QuickLink({ 
  to, 
  icon, 
  children 
}: { 
  to: string
  icon: React.ReactNode
  children: React.ReactNode 
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1 px-2.5 py-1 text-sm text-slate-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
    >
      {icon}
      {children}
    </Link>
  )
}
