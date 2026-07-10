import { Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { useMinVardagSummary } from './MinVardagDataContext'
import type { WidgetProps } from './types'

/**
 * NetworkWidget — Min Vardag hub (Nätverk).
 * Reads `networkContactsCount` slice from MinVardagDataContext.
 * Default size S, allowedSizes ['S', 'M'].
 *
 * Filled-state primary KPI is a milestone label (qualitative — never a percentage).
 *
 * Deep-link route: /nätverk (Network page in App.tsx).
 */
function milestoneLabel(count: number): string {
  if (count >= 10) return 'Bra nätverk'
  if (count >= 3) return 'Bygger nätverk'
  if (count >= 1) return 'Första kontakter'
  return ''
}

export default function NetworkWidget({
  id,
  size,
  allowedSizes,
  onSizeChange,
  editMode,
  onHide,
}: WidgetProps) {
  const summary = useMinVardagSummary()
  const count = summary?.networkContactsCount ?? 0
  const isEmpty = count === 0

  return (
    <Widget
      id={id}
      size={size}
      allowedSizes={allowedSizes}
      onSizeChange={onSizeChange}
      editMode={editMode}
      onHide={onHide}
    >
      <Widget.Header icon={Users} title="Nätverk" />
      <Widget.Body>
        {isEmpty ? (
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-1">
              Bygg ditt nätverk
            </p>
            <p className="text-[12px] text-[var(--stone-700)] m-0">
              Lägg till kontakter från ditt yrkesnätverk
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center">
            {/* Milestone label — qualitative, never a percentage */}
            <p className="text-[22px] font-bold text-[var(--stone-900)] leading-tight m-0 mb-1">
              {milestoneLabel(count)}
            </p>
            <p className="text-[12px] text-[var(--stone-600)] m-0">
              {count} {count === 1 ? 'kontakt' : 'kontakter'}
            </p>
          </div>
        )}
      </Widget.Body>
      {size === 'M' && (
        <Widget.Footer>
          <Link
            to="/n%C3%A4tverk"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            {isEmpty ? 'Lägg till kontakt' : 'Öppna nätverk'}
          </Link>
        </Widget.Footer>
      )}
    </Widget>
  )
}
