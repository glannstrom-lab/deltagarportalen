/**
 * AlertsTab - Manage job search alerts
 * Save search criteria to get notified about new jobs
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bell, Plus, Search, Trash2, ToggleLeft, ToggleRight,
  MapPin, Briefcase, Clock, ExternalLink, AlertCircle,
  CheckCircle, RefreshCw, X
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useJobAlerts } from '@/hooks/useJobAlerts'
import { cn } from '@/lib/utils'
import { Card, Button } from '@/components/ui'

// Region mapping for display
const REGION_NAMES: Record<string, string> = {
  'SE110': 'Stockholms län',
  'SE232': 'Västra Götalands län',
  'SE224': 'Skåne län',
  'SE121': 'Uppsala län',
  'SE123': 'Östergötlands län'
}

interface CreateAlertModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (alert: {
    name: string
    query?: string
    municipality?: string
    region?: string
    employment_type?: string
    remote?: boolean
  }) => void
}

function CreateAlertModal({ isOpen, onClose, onCreate }: CreateAlertModalProps) {
  const [name, setName] = useState('')
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('')
  const [remote, setRemote] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      await onCreate({
        name: name.trim(),
        query: query.trim() || undefined,
        region: region || undefined,
        remote
      })
      // Reset form
      setName('')
      setQuery('')
      setRegion('')
      setRemote(false)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Bell className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Skapa bevakning</h2>
            <p className="text-sm text-slate-500">Få notiser om nya jobb</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Namn på bevakningen *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="t.ex. Utvecklare i Stockholm"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Sökord
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="t.ex. React, projektledare, ekonom"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Region
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Hela Sverige</option>
              <option value="SE110">Stockholms län</option>
              <option value="SE232">Västra Götalands län</option>
              <option value="SE224">Skåne län</option>
              <option value="SE121">Uppsala län</option>
              <option value="SE123">Östergötlands län</option>
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={remote}
              onChange={(e) => setRemote(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-700">Endast distansjobb</span>
          </label>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Avbryt
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!name.trim() || isSubmitting}
            >
              {isSubmitting ? 'Skapar...' : 'Skapa bevakning'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface JobAlert {
  id: string
  name: string
  query?: string
  region?: string
  remote?: boolean
  is_active: boolean
  new_jobs_count: number
  last_checked_at?: string
}

function AlertCard({
  alert,
  onToggle,
  onDelete,
  onRunSearch
}: {
  alert: JobAlert
  onToggle: (id: string, isActive: boolean) => void
  onDelete: (id: string) => void
  onRunSearch: (alert: JobAlert) => void
}) {
  const [isChecking, setIsChecking] = useState(false)

  const handleRunSearch = async () => {
    setIsChecking(true)
    try {
      await onRunSearch(alert)
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className={cn(
      "bg-white rounded-xl border p-5 transition-all",
      alert.is_active ? "border-slate-200 shadow-sm" : "border-slate-100 opacity-60"
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900">{alert.name}</h3>
            {alert.new_jobs_count > 0 && alert.is_active && (
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                {alert.new_jobs_count} nya
              </span>
            )}
          </div>

          {/* Criteria */}
          <div className="flex flex-wrap gap-2 mt-2">
            {alert.query && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg">
                <Search className="w-3 h-3" />
                {alert.query}
              </span>
            )}
            {alert.region && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg">
                <MapPin className="w-3 h-3" />
                {REGION_NAMES[alert.region] || alert.region}
              </span>
            )}
            {alert.remote && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-lg">
                🏠 Distans
              </span>
            )}
          </div>

          {/* Last checked */}
          {alert.last_checked_at && (
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Senast kollad: {new Date(alert.last_checked_at).toLocaleDateString('sv-SE')}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggle(alert.id, !alert.is_active)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title={alert.is_active ? 'Pausa bevakning' : 'Aktivera bevakning'}
          >
            {alert.is_active ? (
              <ToggleRight className="w-6 h-6 text-green-600" />
            ) : (
              <ToggleLeft className="w-6 h-6 text-slate-400" />
            )}
          </button>

          <button
            onClick={() => {
              if (confirm('Är du säker på att du vill ta bort denna bevakning?')) {
                onDelete(alert.id)
              }
            }}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-600"
            title="Ta bort"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search button */}
      <button
        onClick={handleRunSearch}
        disabled={isChecking}
        className={cn(
          "w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors",
          alert.is_active
            ? "bg-indigo-600 text-white hover:bg-indigo-700"
            : "bg-slate-100 text-slate-400 cursor-not-allowed"
        )}
      >
        {isChecking ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Söker...
          </>
        ) : (
          <>
            <Search className="w-4 h-4" />
            Sök nu
          </>
        )}
      </button>
    </div>
  )
}

export function AlertsTab() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { alerts, isLoading, createAlert, deleteAlert, toggleAlert, runAlertSearch, checkForNewJobs } = useJobAlerts()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleCreateAlert = async (alertData: {
    name: string
    query?: string
    municipality?: string
    region?: string
    employment_type?: string
    remote?: boolean
  }) => {
    await createAlert(alertData)
  }

  const handleRunSearch = async (alert: JobAlert) => {
    // Check for new jobs first
    await checkForNewJobs(alert)
    // Then navigate to search with alert criteria
    const params = new URLSearchParams()
    if (alert.query) params.set('q', alert.query)
    if (alert.region) params.set('region', alert.region)
    navigate(`/job-search?${params.toString()}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Dina bevakningar</h2>
          <p className="text-sm text-slate-500">
            {alerts.length === 0
              ? 'Skapa bevakningar för att få notiser om nya jobb'
              : `${alerts.filter(a => a.is_active).length} aktiva av ${alerts.length} bevakningar`}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Ny bevakning
        </Button>
      </div>

      {/* Alerts list */}
      {alerts.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">
            Inga bevakningar
          </h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            Skapa en bevakning för att få notifieringar när nya jobb som matchar dina kriterier publiceras.
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Skapa din första bevakning
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {alerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onToggle={toggleAlert}
              onDelete={deleteAlert}
              onRunSearch={handleRunSearch}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateAlertModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateAlert}
      />
    </div>
  )
}

export default AlertsTab
