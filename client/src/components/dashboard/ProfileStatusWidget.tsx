/**
 * ProfileStatusWidget - Shows profile completion and key status indicators
 * For use on Dashboard and other pages needing profile context
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  User, Target, Zap, FileText, ChevronRight,
  CheckCircle, AlertCircle, Clock, Briefcase
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { userApi, type ProfilePreferences } from '@/services/supabaseApi'
import { useAuthStore } from '@/stores/authStore'

interface StatusItem {
  label: string
  value: string
  status: 'good' | 'warning' | 'missing'
  icon: React.ReactNode
}

export function ProfileStatusWidget() {
  const { profile } = useAuthStore()
  const [prefs, setPrefs] = useState<ProfilePreferences | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      const data = await userApi.getPreferences()
      setPrefs(data)
    } catch (err) {
      console.error('Error loading preferences:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-slate-200 dark:border-stone-700 p-4 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-stone-700 rounded w-1/3 mb-3" />
        <div className="space-y-2">
          <div className="h-8 bg-slate-100 dark:bg-stone-800 rounded" />
          <div className="h-8 bg-slate-100 dark:bg-stone-800 rounded" />
        </div>
      </div>
    )
  }

  // Build status items
  const statusItems: StatusItem[] = []

  // CV Status
  const cvStatus = prefs?.consultant_data?.cvStatus
  statusItems.push({
    label: 'CV',
    value: cvStatus === 'complete' ? 'Komplett' : cvStatus === 'needs_update' ? 'Uppdatera' : 'Saknas',
    status: cvStatus === 'complete' ? 'good' : cvStatus === 'needs_update' ? 'warning' : 'missing',
    icon: <FileText className="w-4 h-4" />
  })

  // Energy level
  const hours = prefs?.therapist_data?.energyLevel?.sustainableHoursPerDay
  if (hours) {
    statusItems.push({
      label: 'Ork',
      value: `${hours}h/dag`,
      status: hours >= 6 ? 'good' : hours >= 4 ? 'warning' : 'missing',
      icon: <Zap className="w-4 h-4" />
    })
  }

  // Goals
  const shortTermGoal = prefs?.support_goals?.shortTerm?.goal
  const shortTermProgress = prefs?.support_goals?.shortTerm?.progress || 0
  if (shortTermGoal) {
    statusItems.push({
      label: 'Korttidsmål',
      value: `${shortTermProgress}%`,
      status: shortTermProgress >= 75 ? 'good' : shortTermProgress >= 25 ? 'warning' : 'missing',
      icon: <Target className="w-4 h-4" />
    })
  }

  // Activity level
  const apps = prefs?.consultant_data?.activityLevel?.applicationsSent || 0
  const interviews = prefs?.consultant_data?.activityLevel?.interviews || 0
  statusItems.push({
    label: 'Aktivitet',
    value: `${apps} ans, ${interviews} int`,
    status: apps > 5 ? 'good' : apps > 0 ? 'warning' : 'missing',
    icon: <Briefcase className="w-4 h-4" />
  })

  // Next steps count
  const nextSteps = prefs?.consultant_data?.nextSteps || []
  const pendingSteps = nextSteps.filter(s => !s.completed).length
  if (nextSteps.length > 0) {
    statusItems.push({
      label: 'Att göra',
      value: `${pendingSteps} kvar`,
      status: pendingSteps === 0 ? 'good' : pendingSteps <= 2 ? 'warning' : 'missing',
      icon: <Clock className="w-4 h-4" />
    })
  }

  const getStatusColor = (status: StatusItem['status']) => {
    switch (status) {
      case 'good': return 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
      case 'warning': return 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
      case 'missing': return 'bg-slate-100 dark:bg-stone-800 text-slate-500 dark:text-stone-400 border-slate-200 dark:border-stone-700'
    }
  }

  const getStatusIcon = (status: StatusItem['status']) => {
    switch (status) {
      case 'good': return <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
      case 'warning': return <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
      case 'missing': return <AlertCircle className="w-3 h-3 text-slate-400 dark:text-stone-500" />
    }
  }

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-slate-200 dark:border-stone-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-teal-50 to-sky-50 dark:from-teal-900/30 dark:to-sky-900/30 border-b border-slate-200 dark:border-stone-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/50 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-stone-100 text-sm">
                {profile?.first_name ? `${profile.first_name}s profil` : 'Din profil'}
              </h3>
            </div>
          </div>
          <Link
            to="/profile"
            className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 font-medium flex items-center gap-0.5"
          >
            Visa <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Status Grid */}
      <div className="p-3">
        <div className="flex flex-wrap gap-2">
          {statusItems.map((item, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs',
                getStatusColor(item.status)
              )}
            >
              {item.icon}
              <span className="font-medium">{item.label}:</span>
              <span>{item.value}</span>
              {getStatusIcon(item.status)}
            </div>
          ))}
        </div>

        {/* Quick actions */}
        {(prefs?.consultant_data?.nextSteps?.length || 0) > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-stone-700">
            <p className="text-xs font-medium text-slate-500 dark:text-stone-400 mb-2">Nästa steg</p>
            <div className="space-y-1">
              {(prefs?.consultant_data?.nextSteps || [])
                .filter(s => !s.completed)
                .slice(0, 2)
                .map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-stone-400">
                    <div className="w-1.5 h-1.5 bg-teal-500 dark:bg-teal-400 rounded-full" />
                    <span className="truncate">{step.activity}</span>
                    <span className="text-slate-400 dark:text-stone-500 ml-auto">{step.date}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Compact version for sidebars or smaller spaces
 */
export function ProfileStatusCompact() {
  const [prefs, setPrefs] = useState<ProfilePreferences | null>(null)

  useEffect(() => {
    userApi.getPreferences().then(setPrefs).catch(console.error)
  }, [])

  const cvStatus = prefs?.consultant_data?.cvStatus
  const hours = prefs?.therapist_data?.energyLevel?.sustainableHoursPerDay
  const shortTermProgress = prefs?.support_goals?.shortTerm?.progress || 0

  return (
    <Link
      to="/profile"
      className="flex items-center gap-3 p-3 bg-white dark:bg-stone-900 rounded-lg border border-slate-200 dark:border-stone-700 hover:border-teal-300 dark:hover:border-teal-700 transition-colors"
    >
      <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-sky-600 rounded-xl flex items-center justify-center">
        <User className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-stone-100">Min profil</p>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-stone-400">
          {cvStatus && (
            <span className={cn(
              'px-1.5 py-0.5 rounded',
              cvStatus === 'complete' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400' :
              cvStatus === 'needs_update' ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400' :
              'bg-slate-100 dark:bg-stone-800 text-slate-600 dark:text-stone-400'
            )}>
              CV: {cvStatus === 'complete' ? 'OK' : cvStatus === 'needs_update' ? '!' : '?'}
            </span>
          )}
          {hours && <span>{hours}h/dag</span>}
          {shortTermProgress > 0 && <span>Mål: {shortTermProgress}%</span>}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-400 dark:text-stone-500" />
    </Link>
  )
}
