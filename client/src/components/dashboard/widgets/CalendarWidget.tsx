import { memo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Calendar, Clock, ChevronRight, Video, Briefcase, Plus } from '@/components/ui/icons'
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
  interview: { icon: Briefcase, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/40' },
  meeting: { icon: Video, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/40' },
  deadline: { icon: Clock, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/40' },
  other: { icon: Calendar, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-700' },
}

// Helper function - uses translation keys for relative dates
const useRelativeDate = () => {
  const { t, i18n } = useTranslation()

  return (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) return t('calendarWidget.today')
    if (date.toDateString() === tomorrow.toDateString()) return t('calendarWidget.tomorrow')

    const diffDays = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 7) {
      const weekdayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
      return t(`calendarWidget.weekdays.${weekdayKeys[date.getDay()]}`)
    }

    const locale = i18n.language === 'en' ? 'en-US' : 'sv-SE'
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
  }
}

export const CalendarWidget = memo(function CalendarWidget({
  upcomingEvents = 0,
  nextEvent = null,
  events = [],
  eventsThisWeek = 0,
  size = 'medium'
}: CalendarWidgetProps) {
  const { t } = useTranslation()
  const getRelativeDate = useRelativeDate()
  const hasEvents = upcomingEvents > 0

  // MINI
  if (size === 'mini') {
    return (
      <Link
        to="/calendar"
        className="group flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-600 hover:shadow-md transition-all duration-200"
      >
        <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
          <Calendar size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t('calendarWidget.calendar')}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {nextEvent ? getRelativeDate(nextEvent.date) : t('calendarWidget.eventsCount', { count: upcomingEvents })}
          </p>
        </div>
        {upcomingEvents > 0 && (
          <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 rounded text-xs font-medium">
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
        className="group block bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{t('calendarWidget.calendar')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {hasEvents ? t('calendarWidget.upcomingCount', { count: upcomingEvents }) : t('calendarWidget.noEvents')}
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors" />
        </div>

        {nextEvent ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-rose-600 dark:text-rose-400">{getRelativeDate(nextEvent.date)}</span>
            <span className="text-sm text-slate-600 dark:text-slate-300 truncate">{nextEvent.title}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <Plus size={16} />
            <span className="text-sm">{t('calendarWidget.addEvent')}</span>
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
      className="group block bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-600 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/40 dark:to-pink-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Calendar size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('calendarWidget.calendar')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {hasEvents ? t('calendarWidget.upcomingEventsCount', { count: upcomingEvents }) : t('calendarWidget.noEvents')}
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:text-rose-500 dark:group-hover:text-rose-400 mt-1 transition-colors" />
      </div>

      {/* Next event card */}
      {nextEvent ? (
        <div className={cn("flex items-center gap-4 p-4 rounded-xl border mb-4", config.bg, "border-transparent")}>
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", config.bg)}>
            <Icon size={24} className={config.color} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{nextEvent.title}</p>
            <p className={cn("text-xs font-medium", config.color)}>
              {getRelativeDate(nextEvent.date)}
              {nextEvent.time && ` ${t('calendarWidget.at')} ${nextEvent.time}`}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 mb-4">
          <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
            <Plus size={24} className="text-rose-500 dark:text-rose-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">{t('calendarWidget.noEvents')}</p>
            <p className="text-xs text-rose-600 dark:text-rose-400">{t('calendarWidget.addInterviewsAndMeetings')}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-rose-500 dark:text-rose-400" />
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{upcomingEvents}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('calendarWidget.upcoming')}</p>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-slate-500 dark:text-slate-400" />
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{eventsThisWeek}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('calendarWidget.thisWeek')}</p>
        </div>
      </div>

      {/* Action */}
      <div className="flex gap-2">
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 rounded-lg text-xs font-medium group-hover:bg-rose-200 dark:group-hover:bg-rose-900/60 transition-colors">
          <Calendar size={12} />
          {t('calendarWidget.showCalendar')}
        </span>
      </div>
    </Link>
  )
})

export default CalendarWidget
