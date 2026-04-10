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
      <div className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
        <div className="space-y-2">
          <div className="h-8 bg-slate-100 rounded" />
          <div className="h-8 bg-slate-100 rounded" />
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
      case 'good': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'warning': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'missing': return 'bg-slate-100 text-slate-500 border-slate-200'
    }
  }

  const getStatusIcon = (status: StatusItem['status']) => {
    switch (status) {
      case 'good': return <CheckCircle className="w-3 h-3 text-emerald-600" />
      case 'warning': return <AlertCircle className="w-3 h-3 text-amber-600" />
      case 'missing': return <AlertCircle className="w-3 h-3 text-slate-400" />
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">
                {profile?.first_name ? `${profile.first_name}s profil` : 'Din profil'}
              </h3>
            </div>
          </div>
          <Link
            to="/profile"
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-0.5"
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
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-2">Nästa steg</p>
            <div className="space-y-1">
              {(prefs?.consultant_data?.nextSteps || [])
                .filter(s => !s.completed)
                .slice(0, 2)
                .map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    <span className="truncate">{step.activity}</span>
                    <span className="text-slate-400 ml-auto">{step.date}</span>
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
      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors"
    >
      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
        <User className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800">Min profil</p>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {cvStatus && (
            <span className={cn(
              'px-1.5 py-0.5 rounded',
              cvStatus === 'complete' ? 'bg-emerald-100 text-emerald-700' :
              cvStatus === 'needs_update' ? 'bg-amber-100 text-amber-700' :
              'bg-slate-100 text-slate-600'
            )}>
              CV: {cvStatus === 'complete' ? 'OK' : cvStatus === 'needs_update' ? '!' : '?'}
            </span>
          )}
          {hours && <span>{hours}h/dag</span>}
          {shortTermProgress > 0 && <span>Mål: {shortTermProgress}%</span>}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-400" />
    </Link>
  )
}
