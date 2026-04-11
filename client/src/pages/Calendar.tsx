import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Loader2, CalendarDays } from '@/components/ui/icons'
import { PageLayout } from '@/components/layout/index'
import { HelpButton } from '@/components/HelpButton'
import { helpContent } from '@/data/helpContent'
import { CalendarHeader } from '@/components/calendar/CalendarHeader'
import { WeekView } from '@/components/calendar/WeekView'
import { DayView } from '@/components/calendar/DayView'
import { EventModal } from '@/components/calendar/EventModal'
import { calendarApi } from '@/services/cloudStorage'
import type { CalendarEvent, CalendarView } from '@/services/calendarData'
import { eventTypeConfig } from '@/services/calendarData'

export default function Calendar() {
  const { t, i18n } = useTranslation()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>('month')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load events from cloud
  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    setLoading(true)
    try {
      const eventsData = await calendarApi.getEvents()
      setEvents(eventsData as unknown as CalendarEvent[])
    } catch (error) {
      console.error('Error loading calendar events:', error)
    } finally {
      setLoading(false)
    }
  }

  const navigate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date())
    } else {
      const newDate = new Date(currentDate)
      if (view === 'month') {
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
      } else if (view === 'week') {
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
      } else if (view === 'day') {
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
      }
      setCurrentDate(newDate)
    }
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const handleDateClick = (date: Date) => {
    setCurrentDate(date)
    setView('day')
  }

  const handleSaveEvent = async (event: CalendarEvent) => {
    try {
      // Transform to API format
      const apiEvent = {
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
        end_time: event.endTime,
        type: event.type,
        location: event.location,
        is_video: event.isVideo,
        is_phone: event.isPhone,
        description: event.description,
        with_person: event.with,
        job_id: event.jobId,
        job_application_id: event.jobApplicationId,
        tasks: event.tasks,
        travel: event.travel,
        interview_prep: event.interviewPrep,
        is_recurring: event.isRecurring,
        recurring_config: event.recurringConfig,
        parent_event_id: event.parentEventId,
        reminders: event.reminders,
        shared_with: event.sharedWith,
        is_shared: event.isShared
      }

      if (selectedEvent) {
        // Update existing event
        const success = await calendarApi.updateEvent(event.id, apiEvent)
        if (success) {
          setEvents(events.map(e => e.id === event.id ? event : e))
        }
      } else {
        // Create new event
        const created = await calendarApi.createEvent(apiEvent)
        if (created) {
          const newEvent = { ...event, id: created.id || event.id }
          setEvents([...events, newEvent])
        }
      }

      setSelectedEvent(null)
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error saving event:', error)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const success = await calendarApi.deleteEvent(eventId)
      if (success) {
        setEvents(events.filter(e => e.id !== eventId))
      }
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  const handleCreateEvent = () => {
    setSelectedEvent(null)
    setIsModalOpen(true)
  }

  // Month view render
  const renderMonthView = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1

    const days = [
      t('calendar.days.mon'),
      t('calendar.days.tue'),
      t('calendar.days.wed'),
      t('calendar.days.thu'),
      t('calendar.days.fri'),
      t('calendar.days.sat'),
      t('calendar.days.sun')
    ]

    const getEventsForDate = (dateStr: string) => {
      return events.filter(event => event.date === dateStr)
    }

    return (
      <div className="bg-white dark:bg-stone-800 rounded-2xl border border-teal-100 dark:border-stone-700 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="grid grid-cols-7 border-b border-teal-100 dark:border-stone-700 bg-gradient-to-r from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700">
          {days.map((day) => (
            <div key={day} className="py-3 text-center text-sm font-medium text-white">
              {day}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7">
          {Array.from({ length: startingDay }).map((_, index) => (
            <div key={`empty-${index}`} className="h-28 border-b border-r border-stone-100 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900/30" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dayEvents = getEventsForDate(dateStr)
            const isToday = new Date().toISOString().split('T')[0] === dateStr

            return (
              <button
                key={day}
                onClick={() => handleDateClick(new Date(dateStr))}
                className="h-28 border-b border-r border-stone-100 dark:border-stone-700 p-2 text-left transition-colors relative overflow-hidden hover:bg-teal-50 dark:hover:bg-stone-700/50"
              >
                <span className={`
                  inline-flex items-center justify-center w-7 h-7 text-sm rounded-full
                  ${isToday ? 'bg-teal-600 dark:bg-teal-500 text-white font-semibold' : 'text-stone-700 dark:text-stone-200'}
                `}>
                  {day}
                </span>
                {dayEvents.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 3).map((event) => {
                      const config = eventTypeConfig[event.type]
                      return (
                        <div
                          key={event.id}
                          className={`text-xs px-1.5 py-0.5 rounded truncate ${config.bgColor} ${config.color}`}
                        >
                          {event.time} {event.title}
                        </div>
                      )
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-stone-500 dark:text-stone-400 px-1.5">
                        {t('calendar.moreEvents', { count: dayEvents.length - 3 })}
                      </div>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Agenda view
  const renderAgendaView = () => {
    const sortedEvents = [...events].sort((a, b) =>
      a.date.localeCompare(b.date) || a.time.localeCompare(b.time)
    )

    return (
      <div className="bg-white dark:bg-stone-800 rounded-2xl border border-teal-100 dark:border-stone-700 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-teal-100 dark:border-stone-700 bg-gradient-to-r from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700">
          <h3 className="font-semibold text-white">{t('calendar.upcomingEvents')}</h3>
        </div>
        <div className="divide-y divide-stone-100 dark:divide-stone-700">
          {sortedEvents.map((event) => {
            const config = eventTypeConfig[event.type]
            const date = new Date(event.date)
            const isPast = date < new Date() && date.toDateString() !== new Date().toDateString()

            return (
              <button
                key={event.id}
                onClick={() => handleEventClick(event)}
                className={`w-full p-4 text-left hover:bg-teal-50 dark:hover:bg-stone-700/50 transition-colors flex items-start gap-4 ${
                  isPast ? 'opacity-50' : ''
                }`}
              >
                <div className={`p-2 rounded-lg ${config.bgColor}`}>
                  <CalendarDays className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-stone-800 dark:text-stone-100">{event.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-sm text-stone-600 dark:text-stone-300 mt-1">
                    {date.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {' · '}
                    {event.time}
                  </p>
                  {event.location && (
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 truncate">{event.location}</p>
                  )}
                </div>
              </button>
            )
          })}
          {sortedEvents.length === 0 && (
            <div className="p-8 text-center">
              <CalendarDays className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
              <p className="text-stone-500 dark:text-stone-400">
                {t('calendar.noEventsPlanned')}
              </p>
              <button
                onClick={handleCreateEvent}
                className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
              >
                {t('calendar.newEvent')}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <PageLayout
        title={t('calendar.title')}
        showTabs={false}
        actions={
          <button
            onClick={handleCreateEvent}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('calendar.newEvent')}</span>
          </button>
        }
      >
        <div className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-teal-600 dark:text-teal-400 animate-spin" />
              <span className="ml-3 text-stone-600 dark:text-stone-300">{t('common.loading')}</span>
            </div>
          )}

          {!loading && (
            <>
              <CalendarHeader
                currentDate={currentDate}
                view={view}
                onViewChange={setView}
                onNavigate={navigate}
              />

              {view === 'month' && renderMonthView()}
              {view === 'week' && (
                <WeekView
                  currentDate={currentDate}
                  events={events}
                  onEventClick={handleEventClick}
                  onDateClick={handleDateClick}
                />
              )}
              {view === 'day' && (
                <DayView
                  date={currentDate}
                  events={events}
                  onEventClick={handleEventClick}
                />
              )}
              {view === 'agenda' && renderAgendaView()}
            </>
          )}
        </div>

        <HelpButton content={helpContent.calendar} />
      </PageLayout>

      {/* Event Modal - outside PageLayout for proper z-index */}
      <EventModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedEvent(null)
        }}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />
    </>
  )
}
