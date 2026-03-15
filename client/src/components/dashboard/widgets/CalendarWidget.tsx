import { Link } from 'react-router-dom'
import { Calendar, Clock, ChevronRight, Video, Briefcase, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalendarWidgetProps {
  upcomingEvents?: number
  nextEvent?: {
    title: string
    date: string
    time?: string
    type: 'interview' | 'meeting' | 'deadline' | 'other'
  } | null
  events?: {
    title: string
    date: string
    time?: string
    type: 'interview' | 'meeting' | 'deadline' | 'other'
  }[]
  eventsThisWeek?: number
  size?: 'mini' | 'medium' | 'large'
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
  events = [],
  eventsThisWeek = 0,
  size = 'medium'
}: CalendarWidgetProps) {
  const hasEvents = upcomingEvents > 0

  // MINI
  if (size === 'mini') {
    return (
      <Link
        to="/calendar"
        className="group flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 hover:border-rose-300 hover:shadow-md transition-all duration-200"
      >
        <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
          <Calendar size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">Kalender</p>
          <p className="text-xs text-slate-500">
            {nextEvent ? getRelativeDate(nextEvent.date) : `${upcomingEvents} händelser`}
          </p>
        </div>
        {upcomingEvents > 0 && (
          <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded text-xs font-medium">
            {upcomingEvents}
          </span>
        )}
      </Link>
    )
  }

  // MEDIUM
  if (size === 'medium') {
    return (
      <Link
        to="/calendar"
        className="group block bg-white p-4 rounded-xl border border-slate-200 hover:border-rose-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Kalender</h3>
              <p className="text-xs text-slate-500">
                {hasEvents ? `${upcomingEvents} kommande` : 'Inga händelser'}
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-rose-500 transition-colors" />
        </div>

        {nextEvent ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-rose-600">{getRelativeDate(nextEvent.date)}</span>
            <span className="text-sm text-slate-600 truncate">{nextEvent.title}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-rose-600">
            <Plus size={16} />
            <span className="text-sm">Lägg till händelse</span>
          </div>
        )}
      </Link>
    )
  }

  // LARGE
  const config = nextEvent ? eventTypeConfig[nextEvent.type] : eventTypeConfig.other
  const Icon = config.icon

  return (
    <Link
      to="/calendar"
      className="group block bg-white p-5 rounded-xl border border-slate-200 hover:border-rose-300 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 text-rose-600 flex items-center justify-center">
            <Calendar size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Kalender</h3>
            <p className="text-sm text-slate-500">
              {hasEvents ? `${upcomingEvents} kommande händelser` : 'Inga händelser'}
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-slate-300 group-hover:text-rose-500 mt-1 transition-colors" />
      </div>

      {/* Next event card */}
      {nextEvent ? (
        <div className={cn("flex items-center gap-4 p-4 rounded-xl border mb-4", config.bg, "border-transparent")}>
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
        <div className="flex items-center gap-4 p-4 rounded-xl bg-rose-50 border border-rose-100 mb-4">
          <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center">
            <Plus size={24} className="text-rose-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-rose-800">Inga händelser</p>
            <p className="text-xs text-rose-600">Lägg till intervjuer och möten</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-rose-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-rose-500" />
            <span className="text-lg font-bold text-slate-800">{upcomingEvents}</span>
          </div>
          <p className="text-xs text-slate-500">Kommande</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-slate-500" />
            <span className="text-lg font-bold text-slate-800">{eventsThisWeek}</span>
          </div>
          <p className="text-xs text-slate-500">Denna vecka</p>
        </div>
      </div>

      {/* Action */}
      <div className="flex gap-2">
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg text-xs font-medium group-hover:bg-rose-200 transition-colors">
          <Calendar size={12} />
          Visa kalender
        </span>
      </div>
    </Link>
  )
}

export default CalendarWidget
