import { type CalendarEvent, eventTypeConfig, formatDuration } from '@/services/calendarData'
import { Briefcase, Users, Clock, CheckSquare, RefreshCw, BookOpen, Bell, MapPin, Video, Phone } from 'lucide-react'

interface DayViewProps {
  date: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}

const icons: Record<string, typeof Briefcase> = {
  Briefcase,
  Users,
  Clock,
  CheckSquare,
  RefreshCw,
  BookOpen,
  Bell,
}

const hours = Array.from({ length: 16 }, (_, i) => i + 6) // 06:00 - 21:00

export function DayView({ date, events, onEventClick }: DayViewProps) {
  const dateStr = date.toISOString().split('T')[0]
  const dayEvents = events.filter(e => e.date === dateStr).sort((a, b) => 
    a.time.localeCompare(b.time)
  )

  const isToday = new Date().toDateString() === date.toDateString()

  const getEventsForHour = (hour: number) => {
    const hourStr = String(hour).padStart(2, '0')
    return dayEvents.filter(event => event.time.startsWith(hourStr))
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Day header */}
      <div className={`p-4 border-b border-slate-200 ${isToday ? 'bg-teal-50' : 'bg-slate-50'}`}>
        <h2 className={`text-xl font-semibold ${isToday ? 'text-teal-900' : 'text-slate-900'}`}>
          {date.toLocaleDateString('sv-SE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </h2>
        {isToday && <span className="text-sm text-teal-700 font-medium">Idag</span>}
      </div>

      {/* Timeline */}
      <div className="overflow-y-auto max-h-[600px]">
        {hours.map((hour) => {
          const hourEvents = getEventsForHour(hour)
          return (
            <div key={hour} className="flex border-b border-slate-100 min-h-[100px]">
              {/* Time label */}
              <div className="w-20 p-3 border-r border-slate-100 bg-slate-50 text-sm text-slate-500 font-medium text-right sticky left-0">
                {String(hour).padStart(2, '0')}:00
              </div>
              
              {/* Events */}
              <div className="flex-1 p-2 space-y-2">
                {hourEvents.map((event) => {
                  const config = eventTypeConfig[event.type]
                  const Icon = icons[config.icon]
                  const duration = event.endTime 
                    ? formatDuration((parseInt(event.endTime.split(':')[0]) * 60 + parseInt(event.endTime.split(':')[1])) - (parseInt(event.time.split(':')[0]) * 60 + parseInt(event.time.split(':')[1])))
                    : '1 tim'
                  
                  return (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className={`w-full text-left p-3 rounded-xl ${config.bgColor} ${config.borderColor} border hover:shadow-md transition-all`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-white/50`}>
                          <Icon size={20} className={config.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-slate-900">{event.title}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}>
                              {config.label}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 mt-1">
                            {event.time} - {event.endTime || `${duration}`}
                          </p>
                          {event.location && (
                            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                              <MapPin size={14} />
                              {event.location}
                            </p>
                          )}
                          {(event.isVideo || event.isPhone) && (
                            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                              {event.isVideo && <><Video size={14} /> Videosamtal</>}
                              {event.isPhone && <><Phone size={14} /> Telefon</>}
                            </p>
                          )}
                          {event.description && (
                            <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
