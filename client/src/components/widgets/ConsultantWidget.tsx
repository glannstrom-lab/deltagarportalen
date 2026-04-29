import { UserCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { useMinVardagSummary } from './MinVardagDataContext'
import type { WidgetProps } from './types'

/**
 * ConsultantWidget — Min Vardag hub (Min konsulent).
 * Reads `consultant` slice + scans `upcomingEvents` for next meeting.
 *
 * Empty state: prompt to contact arbetsförmedlingen — non-pressuring tone.
 * Filled state: consultant name (qualitative) + optional avatar; if there's an
 * `upcomingEvents` row with type='meeting', show "Nästa möte: {date}".
 *
 * Deep-link route: /my-consultant (verified in App.tsx). The empty-state CTA
 * routes to the same page where users can read about consultant coaching.
 */
export default function ConsultantWidget({
  id,
  size,
  allowedSizes,
  onSizeChange,
  editMode,
  onHide,
}: WidgetProps) {
  const summary = useMinVardagSummary()
  const consultant = summary?.consultant ?? null
  const upcomingEvents = summary?.upcomingEvents ?? []
  const nextMeeting = upcomingEvents.find(e => e.type === 'meeting') ?? null
  const isEmpty = !consultant

  if (isEmpty) {
    return (
      <Widget
        id={id}
        size={size}
        allowedSizes={allowedSizes}
        onSizeChange={onSizeChange}
        editMode={editMode}
        onHide={onHide}
      >
        <Widget.Header icon={UserCheck} title="Min konsulent" />
        <Widget.Body>
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-1">
              Ingen konsulent ännu
            </p>
            <p className="text-[12px] text-[var(--stone-700)] m-0">
              Kontakta arbetsförmedlingen för att komma igång med coachning
            </p>
          </div>
        </Widget.Body>
        {(size === 'M' || size === 'L') && (
          <Widget.Footer>
            <Link
              to="/my-consultant"
              className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
            >
              Mer om konsulentcoachning
            </Link>
          </Widget.Footer>
        )}
      </Widget>
    )
  }

  const displayName = consultant.full_name ?? 'Konsulent'

  return (
    <Widget
      id={id}
      size={size}
      allowedSizes={allowedSizes}
      onSizeChange={onSizeChange}
      editMode={editMode}
      onHide={onHide}
    >
      <Widget.Header icon={UserCheck} title="Min konsulent" />
      <Widget.Body>
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1">
            {consultant.avatar_url ? (
              <img
                src={consultant.avatar_url}
                alt=""
                aria-hidden="true"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : null}
            {/* Qualitative — name, never a number */}
            <p className="text-[22px] font-bold text-[var(--stone-900)] leading-tight m-0">
              {displayName}
            </p>
          </div>
          {!consultant.full_name && (
            <span className="sr-only">Konsulent (namn ej tillgängligt)</span>
          )}
          {nextMeeting ? (
            <p className="text-[12px] text-[var(--stone-700)] m-0">
              Nästa möte:{' '}
              <time dateTime={nextMeeting.date}>
                {new Date(nextMeeting.date).toLocaleDateString('sv-SE')}
              </time>
            </p>
          ) : (
            <p className="text-[12px] text-[var(--stone-600)] m-0">
              Inget möte inplanerat
            </p>
          )}
        </div>
      </Widget.Body>
      {(size === 'M' || size === 'L') && (
        <Widget.Footer>
          <Link
            to="/my-consultant"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            Öppna konsulentvy
          </Link>
        </Widget.Footer>
      )}
    </Widget>
  )
}
