import { useState, useEffect, useCallback, useId, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { X, MapPin, Video, Phone, Link2 } from '@/components/ui/icons'
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
  isSaving?: boolean
}

const eventTypeConfigs = [
  { value: 'interview', labelKey: 'calendar.eventTypes.interview', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  { value: 'meeting', labelKey: 'calendar.eventTypes.meeting', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' },
  { value: 'deadline', labelKey: 'calendar.eventTypes.deadline', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  { value: 'reminder', labelKey: 'calendar.eventTypes.reminder', color: 'bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-300' },
  { value: 'task', labelKey: 'calendar.eventTypes.task', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
  { value: 'followup', labelKey: 'calendar.eventTypes.followup', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'preparation', labelKey: 'calendar.eventTypes.preparation', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
]

export function EventModal({ event, isOpen, onClose, onSave, onDelete, linkedJobTitle, isSaving = false }: EventModalProps) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({})
  const [activeTab, setActiveTab] = useState<'details' | 'tasks' | 'prep' | 'travel'>('details')
  const [validationError, setValidationError] = useState<string | null>(null)
  const titleId = useId()

  const eventTypes = useMemo(() => eventTypeConfigs.map(type => ({
    ...type,
    label: t(type.labelKey)
  })), [t])

  // Close modal with Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  useEffect(() => {
    setValidationError(null)
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
        endTime: '10:00',
        tasks: [],
      })
    }
  }, [event])

  if (!isOpen) return null

  const handleSave = () => {
    setValidationError(null)

    if (!formData.title || !formData.date || !formData.time) return

    // Validate end time is after start time
    if (formData.endTime && formData.time && formData.endTime <= formData.time) {
      setValidationError(t('calendar.errors.endTimeBeforeStart'))
      return
    }

    onSave({
      ...event,
      ...formData,
      id: event?.id || `event-${Date.now()}`,
      createdAt: event?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as CalendarEvent)
  }

  const tabs = [
    { id: 'details', label: t('calendar.modal.tabs.details') },
    { id: 'tasks', label: t('calendar.modal.tabs.tasks'), count: formData.tasks?.length },
    ...(formData.type === 'interview' ? [
      { id: 'prep', label: t('calendar.modal.tabs.preparation') },
    ] : []),
    ...(formData.location ? [
      { id: 'travel', label: t('calendar.modal.tabs.travel') },
    ] : []),
  ]

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-stone-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-stone-200 dark:border-stone-700/50">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-700/50">
          <h2 id={titleId} className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            {event ? t('calendar.modal.editEvent') : t('calendar.modal.newEvent')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
            aria-label={t('common.close')}
          >
            <X size={20} className="text-stone-700 dark:text-stone-300" aria-hidden="true" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-200 dark:border-stone-700/50 bg-stone-50 dark:bg-stone-800/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                  : 'border-transparent text-stone-700 dark:text-stone-300 hover:text-stone-700 dark:hover:text-stone-200'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400 rounded-full text-xs">
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
                <label className="text-sm font-medium text-stone-700 dark:text-stone-300">{t('calendar.modal.title')}</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t('calendar.modal.titlePlaceholder')}
                  className="mt-1 w-full px-3 py-2 border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Type */}
              <div>
                <label className="text-sm font-medium text-stone-700 dark:text-stone-300">{t('calendar.modal.type')}</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {eventTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setFormData({ ...formData, type: type.value as any })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.type === type.value
                          ? type.color
                          : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-600'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-stone-700 dark:text-stone-300">{t('calendar.modal.date')}</label>
                  <input
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => {
                      setValidationError(null)
                      setFormData({ ...formData, date: e.target.value })
                    }}
                    className="mt-1 w-full px-3 py-2 border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-stone-700 dark:text-stone-300">{t('calendar.modal.startTime')}</label>
                  <input
                    type="time"
                    value={formData.time || ''}
                    onChange={(e) => {
                      setValidationError(null)
                      setFormData({ ...formData, time: e.target.value })
                    }}
                    className="mt-1 w-full px-3 py-2 border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-stone-700 dark:text-stone-300">{t('calendar.modal.endTime')}</label>
                  <input
                    type="time"
                    value={formData.endTime || ''}
                    onChange={(e) => {
                      setValidationError(null)
                      setFormData({ ...formData, endTime: e.target.value })
                    }}
                    className={`mt-1 w-full px-3 py-2 border bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      validationError ? 'border-red-500 dark:border-red-500' : 'border-stone-200 dark:border-stone-700'
                    }`}
                    aria-invalid={validationError ? 'true' : 'false'}
                    aria-describedby={validationError ? 'time-error' : undefined}
                  />
                </div>
              </div>

              {/* Validation error */}
              {validationError && (
                <div id="time-error" role="alert" className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {validationError}
                </div>
              )}

              {/* Location */}
              <div>
                <label className="text-sm font-medium text-stone-700 dark:text-stone-300 flex items-center gap-1">
                  <MapPin size={14} />
                  {t('calendar.modal.locationOptional')}
                </label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder={t('calendar.modal.locationPlaceholder')}
                  className="mt-1 w-full px-3 py-2 border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                  <span className="text-sm text-stone-700 dark:text-stone-300 flex items-center gap-1">
                    <Video size={14} /> {t('calendar.videoCall')}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPhone || false}
                    onChange={(e) => setFormData({ ...formData, isPhone: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm text-stone-700 dark:text-stone-300 flex items-center gap-1">
                    <Phone size={14} /> {t('calendar.phone')}
                  </span>
                </label>
              </div>

              {/* With */}
              <div>
                <label className="text-sm font-medium text-stone-700 dark:text-stone-300">{t('calendar.modal.withOptional')}</label>
                <input
                  type="text"
                  value={formData.with || ''}
                  onChange={(e) => setFormData({ ...formData, with: e.target.value })}
                  placeholder={t('calendar.modal.withPlaceholder')}
                  className="mt-1 w-full px-3 py-2 border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-stone-700 dark:text-stone-300">{t('calendar.modal.description')}</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('calendar.modal.descriptionPlaceholder')}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              {/* Linked job */}
              {linkedJobTitle && (
                <div className="p-3 bg-teal-50 dark:bg-teal-900/30 rounded-lg border border-teal-100 dark:border-teal-800">
                  <p className="text-sm text-teal-700 dark:text-teal-300 flex items-center gap-2">
                    <Link2 size={14} />
                    {t('calendar.modal.linkedTo')}: <strong>{linkedJobTitle}</strong>
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
        <div className="flex items-center justify-between p-4 border-t border-stone-200 dark:border-stone-700/50 bg-stone-50 dark:bg-stone-800/50">
          {event ? (
            <button
              onClick={() => onDelete(event.id)}
              disabled={isSaving}
              className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.delete')}
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={isSaving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !formData.title || !formData.date || !formData.time}>
              {event ? t('common.saveChanges') : t('calendar.modal.createEvent')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
