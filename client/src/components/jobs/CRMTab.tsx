/**
 * CRM Tab - Application tracking and follow-ups
 */
import { useState, useEffect, useMemo } from 'react'
import {
  ClipboardList, Plus, Clock, CheckCircle, XCircle, Calendar,
  MessageSquare, Building2, ExternalLink, ChevronRight, Bell,
  MoreVertical, Trash2, Edit2, Mail
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Application {
  id: string
  company: string
  position: string
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'withdrawn'
  appliedDate: string
  lastUpdate: string
  nextFollowUp?: string
  notes: string
  contactName?: string
  contactEmail?: string
  url?: string
}

const STATUS_CONFIG = {
  applied: { label: 'Skickad', color: 'slate', icon: Clock },
  screening: { label: 'Under granskning', color: 'blue', icon: ClipboardList },
  interview: { label: 'Intervju', color: 'teal', icon: MessageSquare },
  offer: { label: 'Erbjudande', color: 'emerald', icon: CheckCircle },
  rejected: { label: 'Avslag', color: 'rose', icon: XCircle },
  withdrawn: { label: 'Dragen', color: 'slate', icon: XCircle },
}

const FOLLOW_UP_DAYS = 7

export function CRMTab() {
  const [applications, setApplications] = useState<Application[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    url: '',
    notes: '',
    contactName: '',
    contactEmail: '',
  })

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('job-applications-crm')
    if (saved) {
      setApplications(JSON.parse(saved))
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('job-applications-crm', JSON.stringify(applications))
  }, [applications])

  // Applications needing follow-up
  const needsFollowUp = useMemo(() => {
    const now = new Date()
    return applications.filter(app => {
      if (['rejected', 'withdrawn', 'offer'].includes(app.status)) return false
      const lastUpdate = new Date(app.lastUpdate)
      const daysSince = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))
      return daysSince >= FOLLOW_UP_DAYS
    })
  }, [applications])

  const resetForm = () => {
    setFormData({ company: '', position: '', url: '', notes: '', contactName: '', contactEmail: '' })
    setIsAdding(false)
    setEditingId(null)
  }

  const handleSubmit = () => {
    if (!formData.company.trim() || !formData.position.trim()) return

    const now = new Date().toISOString().split('T')[0]

    if (editingId) {
      setApplications(prev => prev.map(app => {
        if (app.id === editingId) {
          return {
            ...app,
            ...formData,
            lastUpdate: now,
          }
        }
        return app
      }))
    } else {
      const newApp: Application = {
        id: Date.now().toString(),
        company: formData.company,
        position: formData.position,
        status: 'applied',
        appliedDate: now,
        lastUpdate: now,
        notes: formData.notes,
        contactName: formData.contactName || undefined,
        contactEmail: formData.contactEmail || undefined,
        url: formData.url || undefined,
      }
      setApplications(prev => [newApp, ...prev])
    }

    resetForm()
  }

  const updateStatus = (id: string, status: Application['status']) => {
    setApplications(prev => prev.map(app => {
      if (app.id === id) {
        return {
          ...app,
          status,
          lastUpdate: new Date().toISOString().split('T')[0],
        }
      }
      return app
    }))
  }

  const deleteApplication = (id: string) => {
    if (confirm('Ta bort denna ansökan?')) {
      setApplications(prev => prev.filter(app => app.id !== id))
    }
  }

  const startEdit = (app: Application) => {
    setFormData({
      company: app.company,
      position: app.position,
      url: app.url || '',
      notes: app.notes,
      contactName: app.contactName || '',
      contactEmail: app.contactEmail || '',
    })
    setEditingId(app.id)
    setIsAdding(true)
  }

  // Stats
  const stats = {
    total: applications.length,
    active: applications.filter(a => !['rejected', 'withdrawn'].includes(a.status)).length,
    interviews: applications.filter(a => a.status === 'interview').length,
    offers: applications.filter(a => a.status === 'offer').length,
  }

  const filteredApplications = filter
    ? applications.filter(a => a.status === filter)
    : applications

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-teal-50 to-sky-50 border-teal-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center shrink-0">
            <ClipboardList className="w-6 h-6 text-teal-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">Ansöknings-CRM</h2>
            <p className="text-slate-600 mt-1">
              Håll koll på alla dina jobbansökningar, status och uppföljningar.
            </p>
          </div>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Ny ansökan
            </Button>
          )}
        </div>
      </Card>

      {/* Follow-up alert */}
      {needsFollowUp.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">Dags att följa upp!</p>
              <p className="text-sm text-amber-700 mt-1">
                {needsFollowUp.length} ansökning(ar) har inte uppdaterats på {FOLLOW_UP_DAYS}+ dagar.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {needsFollowUp.slice(0, 3).map(app => (
                  <span key={app.id} className="px-2 py-1 bg-white rounded-full text-xs font-medium text-amber-800 border border-amber-200">
                    {app.company}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Stats */}
      {applications.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <Card className="text-center py-3">
            <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
            <p className="text-xs text-slate-700">Totalt</p>
          </Card>
          <Card className="text-center py-3">
            <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
            <p className="text-xs text-slate-700">Aktiva</p>
          </Card>
          <Card className="text-center py-3">
            <div className="text-2xl font-bold text-teal-600">{stats.interviews}</div>
            <p className="text-xs text-slate-700">Intervjuer</p>
          </Card>
          <Card className="text-center py-3">
            <div className="text-2xl font-bold text-emerald-600">{stats.offers}</div>
            <p className="text-xs text-slate-700">Erbjudanden</p>
          </Card>
        </div>
      )}

      {/* Add/Edit form */}
      {isAdding && (
        <Card className="border-teal-200">
          <h3 className="font-semibold text-slate-900 mb-4">
            {editingId ? 'Redigera ansökan' : 'Ny jobbansökan'}
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Företag *</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="T.ex. Spotify"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Position *</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="T.ex. Frontend Developer"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Länk till annons</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kontaktperson</label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="Rekryterarens namn"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-post</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="recruiter@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Anteckningar</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 min-h-[80px]"
                placeholder="Eventuella anteckningar..."
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={!formData.company.trim() || !formData.position.trim()}>
                {editingId ? 'Uppdatera' : 'Lägg till'}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Avbryt
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Filter */}
      {applications.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter(null)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
              !filter ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            Alla
          </button>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                filter === key ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {config.label}
            </button>
          ))}
        </div>
      )}

      {/* Applications list */}
      {filteredApplications.length > 0 ? (
        <div className="space-y-3">
          {filteredApplications.map((app) => {
            const status = STATUS_CONFIG[app.status]
            const StatusIcon = status.icon
            const daysSinceUpdate = Math.floor(
              (new Date().getTime() - new Date(app.lastUpdate).getTime()) / (1000 * 60 * 60 * 24)
            )

            return (
              <Card key={app.id} className="group hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    status.color === 'slate' && "bg-slate-100 text-slate-600",
                    status.color === 'blue' && "bg-blue-100 text-blue-600",
                    status.color === 'teal' && "bg-teal-100 text-teal-600",
                    status.color === 'emerald' && "bg-emerald-100 text-emerald-600",
                    status.color === 'rose' && "bg-rose-100 text-rose-600"
                  )}>
                    <StatusIcon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-slate-900">{app.position}</h4>
                        <p className="text-sm text-slate-700 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {app.company}
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(app)}
                          className="p-1.5 hover:bg-slate-100 rounded"
                        >
                          <Edit2 className="w-4 h-4 text-slate-600" />
                        </button>
                        <button
                          onClick={() => deleteApplication(app.id)}
                          className="p-1.5 hover:bg-rose-100 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-rose-400" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Ansökt: {app.appliedDate}
                      </span>
                      <span className={cn(
                        "flex items-center gap-1",
                        daysSinceUpdate >= FOLLOW_UP_DAYS && "text-amber-600"
                      )}>
                        <Clock className="w-3 h-3" />
                        Uppdaterad: {daysSinceUpdate} dagar sedan
                      </span>
                      {app.url && (
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Annons
                        </a>
                      )}
                    </div>

                    {app.notes && (
                      <p className="text-sm text-slate-700 mt-2 line-clamp-1">{app.notes}</p>
                    )}

                    {/* Status buttons */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <button
                          key={key}
                          onClick={() => updateStatus(app.id, key as Application['status'])}
                          className={cn(
                            "px-2 py-1 rounded text-xs font-medium transition-all",
                            app.status === key
                              ? "bg-teal-600 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          )}
                        >
                          {config.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : !isAdding && (
        <Card className="text-center py-12">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-700 mb-2">Inga ansökningar än</h3>
          <p className="text-sm text-slate-700 mb-4">
            Börja spåra dina jobbansökningar för att hålla koll på status och uppföljningar.
          </p>
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Lägg till första ansökan
          </Button>
        </Card>
      )}
    </div>
  )
}

export default CRMTab
