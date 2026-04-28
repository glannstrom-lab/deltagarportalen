// InternationalWidget — Internationellt
// Action-oriented empty state per UI-SPEC Empty State Copy Contract
// No bare zero ("Inga" / "0 länder") — shows question + CTA instead

import { Globe } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { useWidgetSize } from '@/hooks/useWidgetSize'
import type { WidgetProps } from './types'

export default function InternationalWidget({ id, size, onSizeChange, allowedSizes, editMode }: WidgetProps) {
  const { compact } = useWidgetSize(size)

  return (
    <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode}>
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
