// SpontaneousWidget — Spontanansökan
// Shows pipeline company count at S-size with link CTA to add more

import { Building2, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { useWidgetSize } from '@/hooks/useWidgetSize'
import { useJobsokWidgetData } from './JobsokDataContext'
import type { WidgetProps } from './types'

export default function SpontaneousWidget({ id, size, onSizeChange, allowedSizes, editMode }: WidgetProps) {
  const { compact } = useWidgetSize(size)
  const spontaneousCount = useJobsokWidgetData('spontaneousCount')

  // Loading: context not yet resolved
  if (spontaneousCount === undefined) {
    return (
      <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode}>
        <Widget.Header icon={Building2} title="Spontanansökan" />
      </Widget>
    )
  }

  // Empty state: no companies in pipeline yet
  if (spontaneousCount === 0) {
    return (
      <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode}>
        <Widget.Header icon={Building2} title="Spontanansökan" />
        <Widget.Body>
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-1">Inget i pipeline</p>
            <p className="text-[12px] text-[var(--stone-700)] m-0">Kontakta företag direkt — även utan utlyst tjänst</p>
          </div>
        </Widget.Body>
        <Widget.Footer>
          <Link
            to="/spontanansökan"
            className="inline-flex items-center gap-1 min-h-[44px] px-3 py-1.5 text-[var(--c-text)] text-[12px] font-bold no-underline hover:underline"
          >
            <Plus size={12} aria-hidden="true" />
            + Lägg till företag
          </Link>
        </Widget.Footer>
      </Widget>
    )
  }

  return (
    <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode}>
      <Widget.Header icon={Building2} title="Spontanansökan" />
      <Widget.Body>
        <div className="flex-1 flex flex-col justify-center">
          <span className="text-[22px] font-bold leading-[1.1] text-[var(--stone-900)]">
            {spontaneousCount}
          </span>
          <span className="text-[12px] text-[var(--stone-700)]">företag i pipeline</span>
        </div>
      </Widget.Body>
      {!compact && (
        <Widget.Footer>
          <Link
            to="/spontanansökan"
            className="inline-flex items-center gap-1 min-h-[44px] px-3 py-1.5 text-[var(--c-text)] text-[12px] font-bold no-underline hover:underline"
          >
            <Plus size={12} aria-hidden="true" />
            Lägg till →
          </Link>
        </Widget.Footer>
      )}
    </Widget>
  )
}
