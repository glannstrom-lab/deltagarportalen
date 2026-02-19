import { ChevronLeft, ChevronRight } from 'lucide-react'
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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kalender</h1>
        <p className="text-slate-500 mt-1">Planera ditt jobbsökande</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Navigation */}
        <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-1">
          <button
            onClick={() => onNavigate('prev')}
            className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
          >
            <ChevronLeft size={18} className="text-slate-600" />
          </button>
          <button
            onClick={() => onNavigate('today')}
            className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          >
            Idag
          </button>
          <button
            onClick={() => onNavigate('next')}
            className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
          >
            <ChevronRight size={18} className="text-slate-600" />
          </button>
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-slate-900 px-2 min-w-[180px] text-center">
          {getTitle()}
        </h2>

        {/* View switcher */}
        <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-1">
          {(Object.keys(viewLabels) as CalendarView[]).map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                view === v
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {viewLabels[v]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
