import { Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { useMinVardagSummary } from './MinVardagDataContext'
import type { WidgetProps } from './types'

const SV_WEEKDAY = new Intl.DateTimeFormat('sv-SE', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

function formatEventLine(date: string, time: string | null): string {
  try {
    const d = new Date(date)
    const dateStr = SV_WEEKDAY.format(d)
    return time ? `${dateStr} ${time.slice(0, 5)}` : dateStr
  } catch {
    return time ? `${date} ${time}` : date
  }
}

/**
 * CalendarWidget — Min Vardag hub (Kalender).
 * Reads `upcomingEvents` slice from MinVardagDataContext.
 * Default size L per registry.
 *
 * Deep-link route: /calendar
 */
export default function CalendarWidget({
  id,
  size,
  allowedSizes,
  onSizeChange,
  editMode,
  onHide,
}: WidgetProps) {
  const summary = useMinVardagSummary()
  const events = summary?.upcomingEvents ?? []
  const isEmpty = events.length === 0

  return (
    <Widget
      id={id}
      size={size}
      allowedSizes={allowedSizes}
      onSizeChange={onSizeChange}
      editMode={editMode}
      onHide={onHide}
    >
      <Widget.Header icon={Calendar} title="Kalender" />
      <Widget.Body>
        {isEmpty ? (
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-1">
              Inga kommande möten
            </p>
            <p className="text-[12px] text-[var(--stone-700)] m-0">
              Lägg till intervjuer, möten och deadlines i din kalender
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center">
            {/* Primary slot: next event title — qualitative, no number */}
            <p className="text-[22px] font-bold text-[var(--stone-900)] leading-tight m-0 mb-1">
              {events[0].title}
            </p>
            <p className="text-[12px] text-[var(--stone-600)] m-0">
              <time dateTime={events[0].date}>
                {formatEventLine(events[0].date, events[0].time)}
              </time>
            </p>
            {(size === 'L' || size === 'M') && events.length > 1 && (
              <ul className="list-none m-0 p-0 mt-2 flex flex-col gap-1">
                {events.slice(1, 3).map(e => (
                  <li key={e.id} className="text-[12px] text-[var(--stone-700)]">
                    <span className="font-medium">{e.title}</span>
                    {' — '}
                    <time dateTime={e.date} className="text-[var(--stone-600)]">
                      {formatEventLine(e.date, e.time)}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Widget.Body>
      {(size === 'M' || size === 'L') && (
        <Widget.Footer>
          <Link
            to="/calendar"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            {isEmpty ? 'Lägg till händelse' : 'Öppna kalender'}
          </Link>
        </Widget.Footer>
      )}
    </Widget>
  )
}
