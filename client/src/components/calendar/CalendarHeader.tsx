import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from '@/components/ui/icons'
import type { CalendarView } from '@/services/calendarData'

interface CalendarHeaderProps {
  currentDate: Date
  view: CalendarView
  onViewChange: (view: CalendarView) => void
  onNavigate: (direction: 'prev' | 'next' | 'today') => void
}

export function CalendarHeader({
  currentDate,
  view,
  onViewChange,
  onNavigate,
}: CalendarHeaderProps) {
  const { t, i18n } = useTranslation()

  const viewLabels = useMemo(() => ({
    month: t('calendar.views.month'),
    week: t('calendar.views.week'),
    day: t('calendar.views.day'),
    agenda: t('calendar.views.agenda'),
  }), [t])

  const monthNames = useMemo(() => [
    t('calendar.months.january'),
    t('calendar.months.february'),
    t('calendar.months.march'),
    t('calendar.months.april'),
    t('calendar.months.may'),
    t('calendar.months.june'),
    t('calendar.months.july'),
    t('calendar.months.august'),
    t('calendar.months.september'),
    t('calendar.months.october'),
    t('calendar.months.november'),
    t('calendar.months.december'),
  ], [t])

  const getTitle = () => {
    switch (view) {
      case 'month':
        return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
      case 'week': {
        const weekNum = getWeekNumber(currentDate)
        return t('calendar.weekNumber', { week: weekNum, year: currentDate.getFullYear() })
      }
      case 'day':
        return currentDate.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'sv-SE', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      case 'agenda':
        return t('calendar.upcomingEvents')
    }
  }

  function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-stone-800 rounded-xl border border-teal-100 dark:border-stone-700 p-4">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Navigation */}
        <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-700 rounded-lg p-1" role="group" aria-label={t('calendar.navigation.previous')}>
          <button
            onClick={() => onNavigate('prev')}
            className="p-2 hover:bg-white dark:hover:bg-stone-600 rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1"
            aria-label={t('calendar.navigation.previous')}
          >
            <ChevronLeft size={18} className="text-stone-600 dark:text-stone-300" aria-hidden="true" />
          </button>
          <button
            onClick={() => onNavigate('today')}
            className="px-3 py-2 text-sm font-medium text-stone-700 dark:text-stone-200 hover:bg-white dark:hover:bg-stone-600 rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1"
          >
            {t('calendar.navigation.today')}
          </button>
          <button
            onClick={() => onNavigate('next')}
            className="p-2 hover:bg-white dark:hover:bg-stone-600 rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1"
            aria-label={t('calendar.navigation.next')}
          >
            <ChevronRight size={18} className="text-stone-600 dark:text-stone-300" aria-hidden="true" />
          </button>
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 capitalize">
          {getTitle()}
        </h2>
      </div>

      {/* View switcher */}
      <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-700 rounded-lg p-1" role="tablist" aria-label={t('calendar.views.month')}>
        {(Object.keys(viewLabels) as CalendarView[]).map((v) => (
          <button
            key={v}
            role="tab"
            aria-selected={view === v}
            onClick={() => onViewChange(v)}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1 ${
              view === v
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-600'
            }`}
          >
            {viewLabels[v]}
          </button>
        ))}
      </div>
    </div>
  )
}
