import { useState } from 'react'
import { Plus } from 'lucide-react'
import { CalendarHeader } from '@/components/calendar/CalendarHeader'
import { WeekView } from '@/components/calendar/WeekView'
import { DayView } from '@/components/calendar/DayView'
import { EventModal } from '@/components/calendar/EventModal'
import { CalendarStats } from '@/components/calendar/CalendarStats'
import { MoodTracker } from '@/components/calendar/MoodTracker'
import type { 
  CalendarEvent, 
  CalendarView, 
  CalendarGoal, 
  MoodEntry
} from '@/services/calendarData'
import { eventTypeConfig } from '@/services/calendarData'

// Mock data - i verkligheten skulle detta komma från API/localStorage
const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Jobbintervju - Tech Solutions',
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // om 2 dagar
    time: '10:00',
    endTime: '11:00',
    type: 'interview',
    location: 'Stockholm, Kungsgatan 12',
    with: 'Anna Svensson, CTO',
    description: 'Andra intervjun med tekniska frågor',
    tasks: [
      { id: 't1', eventId: '1', title: 'Uppdatera CV', status: 'done', order: 0 },
      { id: 't2', eventId: '1', title: 'Förbereda tekniska frågor', status: 'in_progress', order: 1 },
      { id: 't3', eventId: '1', title: 'Kolla upp företaget', status: 'todo', order: 2 },
    ],
    interviewPrep: {
      commonQuestions: ['Berätta om dig själv', 'Varför vill du jobba här?'],
      dressCode: 'Smart casual',
    },
    travel: {
      destination: 'Kungsgatan 12, Stockholm',
      duration: 45,
      transportMode: 'public',
      cost: 78,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Möte med arbetskonsulent',
    date: new Date().toISOString().split('T')[0], // idag
    time: '14:00',
    type: 'meeting',
    isVideo: true,
    with: 'Maria Karlsson',
    description: 'Veckovis uppföljning av jobbsökande',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Sista ansökningsdag - Digital Agency',
    date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], // om 5 dagar
    time: '23:59',
    type: 'deadline',
    description: 'React-utvecklare position',
    tasks: [
      { id: 't4', eventId: '3', title: 'Skriva personligt brev', status: 'todo', order: 0 },
      { id: 't5', eventId: '3', title: 'Uppdatera portfolio', status: 'todo', order: 1 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Förberedelse inför intervju',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // imorgon
    time: '09:00',
    type: 'preparation',
    description: 'Gå igenom vanliga intervjufrågor',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const mockGoals: CalendarGoal[] = [
  { id: 'g1', type: 'applications', target: 5, period: 'week', startDate: new Date().toISOString() },
  { id: 'g2', type: 'interviews', target: 2, period: 'week', startDate: new Date().toISOString() },
  { id: 'g3', type: 'tasks', target: 10, period: 'week', startDate: new Date().toISOString() },
]

const mockMoodEntries: MoodEntry[] = [
  { date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], level: 4, energyLevel: 3, stressLevel: 2 },
  { date: new Date(Date.now() - 86400000).toISOString().split('T')[0], level: 3, energyLevel: 3, stressLevel: 3 },
  { date: new Date().toISOString().split('T')[0], level: 4, energyLevel: 4, stressLevel: 2 },
]

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>('month')
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents)
  const [goals] = useState<CalendarGoal[]>(mockGoals)
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>(mockMoodEntries)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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

  const handleSaveEvent = (event: CalendarEvent) => {
    if (selectedEvent) {
      setEvents(events.map(e => e.id === event.id ? event : e))
    } else {
      setEvents([...events, event])
    }
  }

  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter(e => e.id !== eventId))
  }

  const handleAddMood = (entry: MoodEntry) => {
    // Ta bort befintlig entry för samma dag om den finns
    const filtered = moodEntries.filter(e => e.date !== entry.date)
    setMoodEntries([...filtered, entry])
  }

  // Month view render
  const renderMonthView = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1

    const days = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']

    const getEventsForDate = (dateStr: string) => {
      return events.filter(event => event.date === dateStr)
    }

    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-7 border-b border-slate-200">
          {days.map((day) => (
            <div key={day} className="py-2 text-center text-sm font-medium text-slate-500">
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
                      <div className="text-xs text-slate-500 px-1.5">
                        +{dayEvents.length - 3} till
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
          <h3 className="font-semibold text-slate-900">Kommande händelser</h3>
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
                  <p className="text-sm text-slate-500 mt-1">
                    {date.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {' · '}
                    {event.time}
                  </p>
                  {event.location && (
                    <p className="text-sm text-slate-400 mt-1">{event.location}</p>
                  )}
                </div>
              </button>
            )
          })}
          {sortedEvents.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              Inga händelser planerade
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
            Ny händelse
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
  )
}
