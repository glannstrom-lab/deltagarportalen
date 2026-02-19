import { useState } from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Video,
  Phone,
  Plus,
  Users,
  Briefcase
} from 'lucide-react'

interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  type: 'interview' | 'meeting' | 'deadline' | 'reminder'
  location?: string
  isVideo?: boolean
  isPhone?: boolean
  description?: string
  with?: string
}

const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Jobbintervju - Tech Solutions',
    date: '2026-02-25',
    time: '10:00',
    type: 'interview',
    location: 'Stockholm, Kungsgatan 12',
    isVideo: false,
    description: 'Andra intervjun med CTO och teamlead',
    with: 'Anna Svensson, CTO'
  },
  {
    id: '2',
    title: 'Möte med arbetskonsulent',
    date: '2026-02-20',
    time: '14:00',
    type: 'meeting',
    isVideo: true,
    description: 'Veckovis uppföljning',
    with: 'Maria Karlsson'
  },
  {
    id: '3',
    title: 'Sista ansökningsdag - Digital Agency',
    date: '2026-02-28',
    time: '23:59',
    type: 'deadline',
    description: 'React-utvecklare position'
  },
]

const typeConfig = {
  interview: { label: 'Intervju', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Briefcase },
  meeting: { label: 'Möte', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Users },
  deadline: { label: 'Deadline', color: 'bg-red-100 text-red-700 border-red-200', icon: Clock },
  reminder: { label: 'Påminnelse', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock },
}

const daysOfWeek = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDay = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1

  const monthNames = [
    'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
  ]

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(new Date(year, month + (direction === 'next' ? 1 : -1), 1))
  }

  const getEventsForDate = (dateStr: string) => {
    return mockEvents.filter(event => event.date === dateStr)
  }

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kalender</h1>
          <p className="text-slate-500 mt-1">Håll koll på möten, intervjuer och deadlines</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium">
          <Plus size={18} />
          Ny händelse
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              {monthNames[month]} {year}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Idag
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-slate-200">
            {daysOfWeek.map((day) => (
              <div key={day} className="py-2 text-center text-sm font-medium text-slate-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {Array.from({ length: startingDay }).map((_, index) => (
              <div key={`empty-${index}`} className="h-24 border-b border-r border-slate-100" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const dayEvents = getEventsForDate(dateStr)
              const isToday = new Date().toISOString().split('T')[0] === dateStr
              const isSelected = selectedDate === dateStr

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`
                    h-24 border-b border-r border-slate-100 p-2 text-left transition-colors relative
                    ${isSelected ? 'bg-teal-50' : 'hover:bg-slate-50'}
                  `}
                >
                  <span className={`
                    inline-flex items-center justify-center w-7 h-7 text-sm rounded-full
                    ${isToday ? 'bg-teal-600 text-white' : 'text-slate-700'}
                  `}>
                    {day}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className={`text-xs px-1.5 py-0.5 rounded truncate ${typeConfig[event.type].color}`}
                        >
                          {event.time} {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-slate-500 px-1.5">
                          +{dayEvents.length - 2} till
                        </div>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <CalendarIcon size={18} className="text-teal-600" />
              {selectedDate 
                ? `Händelser ${new Date(selectedDate).toLocaleDateString('sv-SE')}`
                : 'Kommande händelser'
              }
            </h3>

            <div className="space-y-3">
              {(selectedDate ? selectedDateEvents : mockEvents)
                .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
                .map((event) => {
                  const TypeIcon = typeConfig[event.type].icon
                  return (
                    <div
                      key={event.id}
                      className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${typeConfig[event.type].color}`}>
                          <TypeIcon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-900 text-sm truncate">{event.title}</h4>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {event.time}
                            </span>
                            {event.isVideo && (
                              <span className="flex items-center gap-1">
                                <Video size={12} />
                                Video
                              </span>
                            )}
                            {event.isPhone && (
                              <span className="flex items-center gap-1">
                                <Phone size={12} />
                                Telefon
                              </span>
                            )}
                          </div>
                          {event.location && (
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <MapPin size={12} />
                              {event.location}
                            </p>
                          )}
                          {event.with && (
                            <p className="text-xs text-slate-500 mt-1">
                              Med: {event.with}
                            </p>
                          )}
                          {event.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}

              {(selectedDate ? selectedDateEvents : mockEvents).length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <CalendarIcon size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Inga händelser</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-4 rounded-xl text-white">
            <h3 className="font-semibold mb-3">Denna månad</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold">{mockEvents.filter(e => e.type === 'interview').length}</p>
                <p className="text-xs text-teal-100">Intervjuer</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{mockEvents.filter(e => e.type === 'meeting').length}</p>
                <p className="text-xs text-teal-100">Möten</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{mockEvents.filter(e => e.type === 'deadline').length}</p>
                <p className="text-xs text-teal-100">Deadlines</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{mockEvents.length}</p>
                <p className="text-xs text-teal-100">Totalt</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
