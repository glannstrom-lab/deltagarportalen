import { Link } from 'react-router-dom'
import { Calendar, Clock, ChevronRight, Video, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalendarWidgetProps {
  upcomingEvents?: number
  nextEvent?: {
    title: string
    date: string
    time?: string
    type: 'interview' | 'meeting' | 'deadline' | 'other'
  } | null
  eventsThisWeek?: number
  size?: 'small' | 'medium'
}

const eventTypeConfig = {
  interview: { icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-100' },
  meeting: { icon: Video, color: 'text-blue-600', bg: 'bg-blue-100' },
  deadline: { icon: Clock, color: 'text-red-600', bg: 'bg-red-100' },
  other: { icon: Calendar, color: 'text-slate-600', bg: 'bg-slate-100' },
}

const getRelativeDate = (dateString: string) => {
  const date = new Date(dateString)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.toDateString() === today.toDateString()) return 'Idag'
  if (date.toDateString() === tomorrow.toDateString()) return 'Imorgon'

  const diffDays = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 7) {
    const weekdays = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör']
    return weekdays[date.getDay()]
  }

  return date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
}

export function CalendarWidget({
  upcomingEvents = 0,
  nextEvent = null,
  eventsThisWeek = 0,
  size = 'small'
}: CalendarWidgetProps) {
  const hasEvents = upcomingEvents > 0

  if (size === 'small') {
    return (
      <Link
        to="/calendar"
        className={cn(
          "group block bg-white p-4 rounded-2xl border-2 transition-all duration-200",
          "hover:border-rose-300 hover:shadow-lg hover:-translate-y-0.5",
          "focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2",
          "border-slate-200"
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Calendar size={18} />
            </div>
            <h3 className="font-semibold text-slate-800 text-sm">Kalender</h3>
          </div>
          <ChevronRight
            size={16}
            className="text-slate-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-slate-800">{upcomingEvents}</span>
          <span className="text-sm text-slate-500">kommande</span>
        </div>

        {nextEvent && (
          <p className="text-xs text-rose-600 mt-2 truncate">
            {getRelativeDate(nextEvent.date)}: {nextEvent.title}
          </p>
        )}

        {!hasEvents && (
          <p className="text-xs text-rose-600 mt-2">Inga händelser</p>
        )}
      </Link>
    )
  }

  // Medium size
  const config = nextEvent ? eventTypeConfig[nextEvent.type] : eventTypeConfig.other
  const Icon = config.icon

  return (
    <Link
      to="/calendar"
      className={cn(
        "group block bg-white p-5 rounded-2xl border-2 transition-all duration-200",
        "hover:border-rose-300 hover:shadow-xl hover:-translate-y-0.5",
        "focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2",
        "border-slate-200"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 text-rose-600 flex items-center justify-center shadow-sm">
            <Calendar size={22} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Kalender</h3>
            <p className="text-xs text-slate-500">
              {hasEvents ? `${upcomingEvents} kommande händelser` : 'Inga händelser'}
            </p>
          </div>
        </div>
        <ChevronRight
          size={18}
          className="text-slate-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all mt-1"
        />
      </div>

      {/* Next event card */}
      {nextEvent ? (
        <div className={cn("flex items-center gap-4 p-4 rounded-xl border mb-3", config.bg, "border-transparent")}>
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", config.bg)}>
            <Icon size={24} className={config.color} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{nextEvent.title}</p>
            <p className={cn("text-xs font-medium", config.color)}>
              {getRelativeDate(nextEvent.date)}
              {nextEvent.time && ` kl ${nextEvent.time}`}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-rose-50 border border-rose-100 mb-3">
          <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center">
            <Calendar size={24} className="text-rose-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-rose-800">Inga händelser</p>
            <p className="text-xs text-rose-600">Lägg till intervjuer och möten</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-rose-50 rounded-xl">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-rose-500" />
            <span className="text-lg font-bold text-slate-800">{upcomingEvents}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Kommande</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-slate-500" />
            <span className="text-lg font-bold text-slate-800">{eventsThisWeek}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Denna vecka</p>
        </div>
      </div>
    </Link>
  )
}

export default CalendarWidget
