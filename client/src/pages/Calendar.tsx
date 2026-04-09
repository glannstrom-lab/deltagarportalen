import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Loader2 } from '@/components/ui/icons'
import { PageLayout } from '@/components/layout/index'
import { HelpButton } from '@/components/HelpButton'
import { helpContent } from '@/data/helpContent'
import { CalendarHeader } from '@/components/calendar/CalendarHeader'
import { WeekView } from '@/components/calendar/WeekView'
import { DayView } from '@/components/calendar/DayView'
import { EventModal } from '@/components/calendar/EventModal'
import { CalendarStats } from '@/components/calendar/CalendarStats'
import { MoodTracker } from '@/components/calendar/MoodTracker'
import { calendarApi } from '@/services/cloudStorage'
import type {
  CalendarEvent,
  CalendarView,
  CalendarGoal,
  MoodEntry
} from '@/services/calendarData'
import { eventTypeConfig } from '@/services/calendarData'

export default function Calendar() {
  const { t, i18n } = useTranslation()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>('month')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [goals, setGoals] = useState<CalendarGoal[]>([])
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([])
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load data from cloud
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [eventsData, goalsData, moodData] = await Promise.all([
        calendarApi.getEvents(),
        calendarApi.getGoals(),
        calendarApi.getMoodEntries()
      ])

      // API already transforms to camelCase format
      setEvents(eventsData as unknown as CalendarEvent[])
      setGoals(goalsData as unknown as CalendarGoal[])
      setMoodEntries(moodData as unknown as MoodEntry[])
    } catch (error) {
      console.error('Error loading calendar data:', error)
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

  const handleAddMood = async (entry: MoodEntry) => {
    try {
      // Transform to API format
      const apiEntry = {
        date: entry.date,
        level: entry.level,
        note: entry.note,
        energy_level: entry.energyLevel,
        stress_level: entry.stressLevel
      }

      const saved = await calendarApi.saveMoodEntry(apiEntry)
      if (saved) {
        // Ta bort befintlig entry för samma dag om den finns
        const filtered = moodEntries.filter(e => e.date !== entry.date)
        setMoodEntries([...filtered, entry])
      }
    } catch (error) {
      console.error('Error saving mood entry:', error)
    }
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
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-7 border-b border-slate-200">
          {days.map((day) => (
            <div key={day} className="py-2 text-center text-sm font-medium text-slate-700">
              {day}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7">
          {Array.from({ length: startingDay }).map((_, index) => (
            <div key={`empty-${index}`} className="h-28 border-b border-r border-slate-100 bg-slate-50/50" />
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
                className="h-28 border-b border-r border-slate-100 p-2 text-left transition-colors relative overflow-hidden hover:bg-slate-50"
              >
                <span className={`
                  inline-flex items-center justify-center w-7 h-7 text-sm rounded-full
                  ${isToday ? 'bg-teal-600 text-white' : 'text-slate-700'}
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
                      <div className="text-xs text-slate-700 px-1.5">
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
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">{t('calendar.upcomingEvents')}</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {sortedEvents.map((event) => {
            const config = eventTypeConfig[event.type]
            const date = new Date(event.date)
            const isPast = date < new Date() && date.toDateString() !== new Date().toDateString()
            
            return (
              <button
                key={event.id}
                onClick={() => handleEventClick(event)}
                className={`w-full p-4 text-left hover:bg-slate-50 transition-colors flex items-start gap-4 ${
                  isPast ? 'opacity-50' : ''
                }`}
              >
                <div className={`p-2 rounded-lg ${config.bgColor}`}>
                  <div className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-slate-900">{event.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mt-1">
                    {date.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {' · '}
                    {event.time}
                  </p>
                  {event.location && (
                    <p className="text-sm text-slate-600 mt-1">{event.location}</p>
                  )}
                </div>
              </button>
            )
          })}
          {sortedEvents.length === 0 && (
            <div className="p-8 text-center text-slate-600">
              {t('calendar.noEventsPlanned')}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <PageLayout
      title={t('calendar.title')}
      description={t('calendar.description')}
      showTabs={false}
    >
    <div className="space-y-6">
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          <span className="ml-3 text-slate-600">{t('common.loading')}</span>
        </div>
      )}

      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onViewChange={setView}
        onNavigate={navigate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main calendar area */}
        <div className="lg:col-span-2 space-y-4">
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
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Add event button */}
          <button
            onClick={() => {
              setSelectedEvent(null)
              setIsModalOpen(true)
            }}
            className="w-full py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            {t('calendar.newEvent')}
          </button>

          {/* Mood Tracker */}
          <MoodTracker
            entries={moodEntries}
            onAddEntry={handleAddMood}
          />

          {/* Stats */}
          <CalendarStats
            events={events}
            goals={goals}
            moodEntries={moodEntries}
          />
        </div>
      </div>

      {/* Event Modal */}
      <EventModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />
    </div>
      <HelpButton content={helpContent.calendar} />
    </PageLayout>
  )
}
