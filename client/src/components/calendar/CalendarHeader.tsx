import { ChevronLeft, ChevronRight } from '@/components/ui/icons'
import type { CalendarView } from '@/services/calendarData'

interface CalendarHeaderProps {
  currentDate: Date
  view: CalendarView
  onViewChange: (view: CalendarView) => void
  onNavigate: (direction: 'prev' | 'next' | 'today') => void
}

const viewLabels: Record<CalendarView, string> = {
  month: 'Månad',
  week: 'Vecka',
  day: 'Dag',
  agenda: 'Agenda',
}

export function CalendarHeader({
  currentDate,
  view,
  onViewChange,
  onNavigate,
}: CalendarHeaderProps) {
  const monthNames = [
    'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
  ]

  const getTitle = () => {
    switch (view) {
      case 'month':
        return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
      case 'week': {
        const weekNum = getWeekNumber(currentDate)
        return `Vecka ${weekNum}, ${currentDate.getFullYear()}`
      }
      case 'day':
        return currentDate.toLocaleDateString('sv-SE', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      case 'agenda':
        return 'Kommande händelser'
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
        <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-700 rounded-lg p-1">
          <button
            onClick={() => onNavigate('prev')}
            className="p-2 hover:bg-white dark:hover:bg-stone-600 rounded-md transition-colors"
            aria-label="Föregående"
          >
            <ChevronLeft size={18} className="text-stone-600 dark:text-stone-300" />
          </button>
          <button
            onClick={() => onNavigate('today')}
            className="px-3 py-2 text-sm font-medium text-stone-700 dark:text-stone-200 hover:bg-white dark:hover:bg-stone-600 rounded-md transition-colors"
          >
            Idag
          </button>
          <button
            onClick={() => onNavigate('next')}
            className="p-2 hover:bg-white dark:hover:bg-stone-600 rounded-md transition-colors"
            aria-label="Nästa"
          >
            <ChevronRight size={18} className="text-stone-600 dark:text-stone-300" />
          </button>
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 capitalize">
          {getTitle()}
        </h2>
      </div>

      {/* View switcher */}
      <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-700 rounded-lg p-1">
        {(Object.keys(viewLabels) as CalendarView[]).map((v) => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
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
