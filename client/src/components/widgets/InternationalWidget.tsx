// InternationalWidget — Internationellt
// Action-oriented empty state per UI-SPEC Empty State Copy Contract
// No bare zero ("Inga" / "0 länder") — shows question + CTA instead
// NOTE: international_targets table does NOT exist in live DB (Plan 01 verified).
// Reads from context but falls through to existing empty-state (no behavior change for Phase 3).

import { Globe } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { useWidgetSize } from '@/hooks/useWidgetSize'
import { useJobsokWidgetData } from './JobsokDataContext'
import type { WidgetProps } from './types'

export default function InternationalWidget({ id, size, onSizeChange, allowedSizes, editMode, onHide }: WidgetProps) {
  const { compact } = useWidgetSize(size)
  // international slice — loader omits it since international_targets table is absent (Plan 01).
  // undefined = loading, null/absent = no data
  const intl = useJobsokWidgetData('international')

  // Filled state (future Phase 5 — if countries exist)
  if (intl && intl.countries.length > 0) {
    return (
      <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode} onHide={onHide}>
        <Widget.Header icon={Globe} title="Internationellt" />
        <Widget.Body>
          <div className="flex-1 flex flex-col justify-center">
            <span className="text-[22px] font-bold leading-[1.1] text-[var(--stone-900)]">
              {intl.countries.length}
            </span>
            <span className="text-[12px] text-[var(--stone-700)]">länder i fokus</span>
          </div>
        </Widget.Body>
        {!compact && (
          <Widget.Footer>
            <Link
              to="/international"
              className="inline-flex items-center min-h-[44px] px-3 py-1.5 text-[var(--c-text)] text-[12px] font-bold no-underline hover:underline"
            >
              Utforska möjligheter →
            </Link>
          </Widget.Footer>
        )}
      </Widget>
    )
  }

  // Empty state (Phase 3 default — table absent, or no countries saved)
  return (
    <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode} onHide={onHide}>
      <Widget.Header icon={Globe} title="Internationellt" />
      <Widget.Body>
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-1">
            Arbetar du mot utlandsjobb?
          </p>
          {!compact && (
            <p className="text-[12px] text-[var(--stone-700)] m-0">
              Hitta jobb och företag i andra länder
            </p>
          )}
        </div>
      </Widget.Body>
      {!compact && (
        <Widget.Footer>
          <Link
            to="/international"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 text-[var(--c-text)] text-[12px] font-bold no-underline hover:underline"
          >
            Utforska möjligheter →
          </Link>
        </Widget.Footer>
      )}
    </Widget>
  )
}
