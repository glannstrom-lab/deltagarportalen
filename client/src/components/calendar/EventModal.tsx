import { useState, useEffect } from 'react'
import { X, MapPin, Video, Phone, Link2 } from 'lucide-react'
import type { CalendarEvent } from '@/services/calendarData'
import { TaskManager } from './TaskManager'
import { InterviewPrepPanel } from './InterviewPrep'
import { TravelPlanner } from './TravelPlanner'
import { Button } from '@/components/ui/Button'

interface EventModalProps {
  event: CalendarEvent | null
  isOpen: boolean
  onClose: () => void
  onSave: (event: CalendarEvent) => void
  onDelete: (eventId: string) => void
  linkedJobTitle?: string
}

const eventTypes = [
  { value: 'interview', label: 'Intervju', color: 'bg-amber-100 text-amber-700' },
  { value: 'meeting', label: 'Möte', color: 'bg-blue-100 text-blue-700' },
  { value: 'deadline', label: 'Deadline', color: 'bg-red-100 text-red-700' },
  { value: 'reminder', label: 'Påminnelse', color: 'bg-slate-100 text-slate-700' },
  { value: 'task', label: 'Uppgift', color: 'bg-purple-100 text-purple-700' },
  { value: 'followup', label: 'Uppföljning', color: 'bg-green-100 text-green-700' },
  { value: 'preparation', label: 'Förberedelse', color: 'bg-teal-100 text-teal-700' },
]

export function EventModal({ event, isOpen, onClose, onSave, onDelete, linkedJobTitle }: EventModalProps) {
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({})
  const [activeTab, setActiveTab] = useState<'details' | 'tasks' | 'prep' | 'travel'>('details')

  useEffect(() => {
    if (event) {
      setFormData({ ...event })
      // Sätt aktiv tab baserat på event-typ
      if (event.type === 'interview') {
        setActiveTab('prep')
      } else {
        setActiveTab('details')
      }
    } else {
      setFormData({
        type: 'meeting',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        tasks: [],
      })
    }
  }, [event])

  if (!isOpen) return null

  const handleSave = () => {
    if (!formData.title || !formData.date || !formData.time) return
    
    onSave({
      ...event,
      ...formData,
      id: event?.id || `event-${Date.now()}`,
      createdAt: event?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as CalendarEvent)
    onClose()
  }

  const tabs = [
    { id: 'details', label: 'Detaljer' },
    { id: 'tasks', label: 'Uppgifter', count: formData.tasks?.length },
    ...(formData.type === 'interview' ? [
      { id: 'prep', label: 'Förberedelse' },
    ] : []),
    ...(formData.location ? [
      { id: 'travel', label: 'Resa' },
    ] : []),
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            {event ? 'Redigera händelse' : 'Ny händelse'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'details' && (
            <>
              {/* Title */}
              <div>
                <label className="text-sm font-medium text-slate-700">Titel</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="T.ex. Jobbintervju på Spotify"
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Type */}
              <div>
                <label className="text-sm font-medium text-slate-700">Typ</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {eventTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setFormData({ ...formData, type: type.value as any })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.type === type.value
                          ? type.color
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Datum</label>
                  <input
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Tid</label>
                  <input
                    type="time"
                    value={formData.time || ''}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <MapPin size={14} />
                  Plats (valfritt)
                </label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Adress eller plats"
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Meeting type */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isVideo || false}
                    onChange={(e) => setFormData({ ...formData, isVideo: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm text-slate-700 flex items-center gap-1">
                    <Video size={14} /> Videosamtal
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPhone || false}
                    onChange={(e) => setFormData({ ...formData, isPhone: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm text-slate-700 flex items-center gap-1">
                    <Phone size={14} /> Telefon
                  </span>
                </label>
              </div>

              {/* With */}
              <div>
                <label className="text-sm font-medium text-slate-700">Med (valfritt)</label>
                <input
                  type="text"
                  value={formData.with || ''}
                  onChange={(e) => setFormData({ ...formData, with: e.target.value })}
                  placeholder="T.ex. Anna Svensson, rekryterare"
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-slate-700">Beskrivning</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Anteckningar om händelsen..."
                  rows={3}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              {/* Linked job */}
              {linkedJobTitle && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-700 flex items-center gap-2">
                    <Link2 size={14} />
                    Länkat till: <strong>{linkedJobTitle}</strong>
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === 'tasks' && (
            <TaskManager
              eventId={event?.id || 'new'}
              tasks={formData.tasks || []}
              onTasksChange={(tasks) => setFormData({ ...formData, tasks })}
            />
          )}

          {activeTab === 'prep' && formData.type === 'interview' && (
            <InterviewPrepPanel
              event={formData as CalendarEvent}
              prep={formData.interviewPrep}
              onPrepChange={(prep) => setFormData({ ...formData, interviewPrep: prep })}
            />
          )}

          {activeTab === 'travel' && (
            <TravelPlanner
              travel={formData.travel}
              onTravelChange={(travel) => setFormData({ ...formData, travel })}
              eventTime={formData.time || '09:00'}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200">
          {event ? (
            <button
              onClick={() => {
                onDelete(event.id)
                onClose()
              }}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Ta bort
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Avbryt
            </Button>
            <Button onClick={handleSave}>
              {event ? 'Spara ändringar' : 'Skapa händelse'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
