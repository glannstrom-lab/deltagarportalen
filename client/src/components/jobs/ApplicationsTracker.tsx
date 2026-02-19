import { useState } from 'react'
import { Briefcase, CheckCircle, Clock, XCircle, Send, Star, ChevronDown, MessageSquare, Trash2 } from 'lucide-react'
import type { JobApplication, Job } from '@/services/mockApi'

interface ApplicationsTrackerProps {
  applications: (JobApplication & { job?: Job })[]
  onUpdateStatus: (appId: string, status: JobApplication['status']) => void
  onDelete: (appId: string) => void
  onAddNote: (appId: string, note: string) => void
}

const statusConfig = {
  saved: { label: 'Sparad', icon: Star, color: 'text-yellow-600 bg-yellow-50' },
  applied: { label: 'Ansökt', icon: Send, color: 'text-blue-600 bg-blue-50' },
  interview: { label: 'Intervju', icon: MessageSquare, color: 'text-purple-600 bg-purple-50' },
  offer: { label: 'Erbjudande', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  rejected: { label: 'Avslag', icon: XCircle, color: 'text-red-600 bg-red-50' },
  withdrawn: { label: 'Återtagen', icon: Clock, color: 'text-slate-600 bg-slate-50' },
}

const statusOrder: JobApplication['status'][] = ['saved', 'applied', 'interview', 'offer', 'rejected', 'withdrawn']

export function ApplicationsTracker({ applications, onUpdateStatus, onDelete, onAddNote }: ApplicationsTrackerProps) {
  const [expandedApp, setExpandedApp] = useState<string | null>(null)
  const [noteInput, setNoteInput] = useState('')

  const groupedApps = statusOrder.reduce((acc, status) => {
    acc[status] = applications.filter(app => app.status === status)
    return acc
  }, {} as Record<JobApplication['status'], typeof applications>)

  const totalCount = applications.length
  const appliedCount = applications.filter(a => ['applied', 'interview', 'offer'].includes(a.status)).length
  const responseCount = applications.filter(a => ['interview', 'offer', 'rejected'].includes(a.status)).length

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-slate-800">Mina ansökningar</h3>
          <p className="text-sm text-slate-500">
            {totalCount} sparade • {appliedCount} ansökta • {responseCount} svar
          </p>
        </div>
        
        {/* Stats */}
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <div className="font-bold text-2xl text-[#4f46e5]">
              {Math.round((responseCount / Math.max(appliedCount, 1)) * 100)}%
            </div>
            <div className="text-slate-500">svarsfrekvens</div>
          </div>
        </div>
      </div>

      {/* Applications by status */}
      <div className="space-y-4">
        {statusOrder.map((status) => {
          const apps = groupedApps[status]
          if (apps.length === 0) return null

          const config = statusConfig[status]
          const Icon = config.icon

          return (
            <div key={status}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${config.color}`}>
                  <Icon size={14} />
                </div>
                <span className="font-medium text-slate-700">{config.label}</span>
                <span className="text-sm text-slate-400">({apps.length})</span>
              </div>

              <div className="space-y-2 pl-8">
                {apps.map((app) => (
                  <div
                    key={app.id}
                    className="bg-slate-50 rounded-xl p-3 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-800">{app.job?.title}</p>
                        <p className="text-sm text-slate-500">{app.job?.company}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {app.appliedDate && (
                          <span className="text-xs text-slate-400">
                            Ansökte {new Date(app.appliedDate).toLocaleDateString('sv-SE')}
                          </span>
                        )}
                        <ChevronDown
                          size={16}
                          className={`text-slate-400 transition-transform ${
                            expandedApp === app.id ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Expanded details */}
                    {expandedApp === app.id && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        {/* Status change */}
                        <div className="mb-3">
                          <p className="text-xs text-slate-500 mb-2">Ändra status:</p>
                          <div className="flex flex-wrap gap-2">
                            {statusOrder.map((s) => {
                              const sConfig = statusConfig[s]
                              const SIcon = sConfig.icon
                              return (
                                <button
                                  key={s}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onUpdateStatus(app.id, s)
                                  }}
                                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
                                    app.status === s
                                      ? sConfig.color
                                      : 'bg-white text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  <SIcon size={12} />
                                  {sConfig.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Notes */}
                        <div className="mb-3">
                          <p className="text-xs text-slate-500 mb-1">Anteckningar:</p>
                          {app.notes ? (
                            <p className="text-sm text-slate-600 bg-white p-2 rounded-lg">{app.notes}</p>
                          ) : (
                            <p className="text-sm text-slate-400 italic">Inga anteckningar</p>
                          )}
                          <div className="flex gap-2 mt-2">
                            <input
                              type="text"
                              placeholder="Lägg till anteckning..."
                              value={noteInput}
                              onChange={(e) => setNoteInput(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 text-sm px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (noteInput.trim()) {
                                  onAddNote(app.id, noteInput.trim())
                                  setNoteInput('')
                                }
                              }}
                              className="px-3 py-1.5 bg-[#4f46e5] text-white text-sm rounded-lg hover:bg-[#4338ca]"
                            >
                              Spara
                            </button>
                          </div>
                        </div>

                        {/* Delete */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('Är du säker på att du vill ta bort denna ansökan?')) {
                              onDelete(app.id)
                            }
                          }}
                          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={12} />
                          Ta bort
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {applications.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <Briefcase size={48} className="mx-auto mb-2 opacity-50" />
            <p>Inga sparade jobb ännu</p>
            <p className="text-sm">Börja söka och spara jobb du är intresserad av!</p>
          </div>
        )}
      </div>
    </div>
  )
}
