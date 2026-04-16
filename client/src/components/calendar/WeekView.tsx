import { getWeekDates, type CalendarEvent, eventTypeConfig } from '@/services/calendarData'
import { Briefcase, Users, Clock, CheckSquare, RefreshCw, BookOpen, Bell } from '@/components/ui/icons'

interface WeekViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onDateClick: (date: Date) => void
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

const hours = Array.from({ length: 14 }, (_, i) => i + 7) // 07:00 - 20:00

export function WeekView({ currentDate, events, onEventClick, onDateClick }: WeekViewProps) {
  const weekDates = getWeekDates(currentDate)
  const days = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']

  const getEventsForDateAndHour = (date: Date, hour: number) => {
    const dateStr = date.toISOString().split('T')[0]
    const hourStr = String(hour).padStart(2, '0')
    return events.filter(event => {
      if (event.date !== dateStr) return false
      const eventHour = event.time.split(':')[0]
      return eventHour === hourStr
    })
  }

  const isToday = (date: Date) => {
    return new Date().toDateString() === date.toDateString()
  }

  return (
    <div className="bg-white dark:bg-stone-800 rounded-2xl border border-teal-100 dark:border-stone-700 overflow-hidden shadow-sm">
      {/* Header row */}
      <div className="grid grid-cols-8 border-b border-stone-200 dark:border-stone-700">
        <div className="p-3 border-r border-stone-100 dark:border-stone-700 bg-stone-50 dark:bg-stone-800" />
        {weekDates.map((date, i) => (
          <button
            key={i}
            onClick={() => onDateClick(date)}
            className={`p-3 text-center border-r border-stone-100 dark:border-stone-700 last:border-r-0 transition-colors ${
              isToday(date) ? 'bg-teal-50 dark:bg-teal-900/20' : 'hover:bg-stone-50 dark:hover:bg-stone-700'
            }`}
          >
            <p className="text-xs font-medium text-stone-700 dark:text-stone-300 uppercase">{days[i]}</p>
            <p className={`text-lg font-semibold mt-1 ${
              isToday(date) ? 'text-teal-700 dark:text-teal-400' : 'text-stone-900 dark:text-stone-100'
            }`}>
              {date.getDate()}
            </p>
          </button>
        ))}
      </div>

      {/* Time grid */}
      <div className="overflow-y-auto max-h-[600px]">
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-stone-100 dark:border-stone-700 min-h-[80px]">
            {/* Time label */}
            <div className="p-2 border-r border-stone-100 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-700 dark:text-stone-300 text-right sticky left-0">
              {String(hour).padStart(2, '0')}:00
            </div>
            
            {/* Days */}
            {weekDates.map((date, dayIndex) => {
              const dayEvents = getEventsForDateAndHour(date, hour)
              return (
                <div
                  key={dayIndex}
                  className="p-1 border-r border-stone-100 dark:border-stone-700 last:border-r-0 relative hover:bg-teal-50/50 dark:hover:bg-teal-900/20 hover:border-teal-200 dark:hover:border-teal-700 transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-inset"
                >
                  {dayEvents.map((event) => {
                    const config = eventTypeConfig[event.type]
                    const Icon = icons[config.icon]
                    return (
                      <button
                        key={event.id}
                        onClick={() => onEventClick(event)}
                        className={`w-full text-left p-2 rounded-lg mb-1 ${config.bgColor} ${config.borderColor} border hover:shadow-sm transition-all`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon size={12} className={config.color} />
                          <span className={`text-xs font-medium ${config.color} truncate`}>
                            {event.time}
                          </span>
                        </div>
                        <p className="text-xs text-stone-700 dark:text-stone-300 mt-0.5 truncate font-medium">
                          {event.title}
                        </p>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
