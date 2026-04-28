// SpontaneousWidget — Spontanansökan
// Shows pipeline company count at S-size with link CTA to add more

import { Building2, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { useWidgetSize } from '@/hooks/useWidgetSize'
import type { WidgetProps } from './types'

const MOCK = { companies: 5 }

export default function SpontaneousWidget({ id, size, onSizeChange, allowedSizes, editMode }: WidgetProps) {
  const { compact } = useWidgetSize(size)

  return (
    <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode}>
      <Widget.Header icon={Building2} title="Spontanansökan" />
      <Widget.Body>
        <div className="flex-1 flex flex-col justify-center">
          <span className="text-[22px] font-bold leading-[1.1] text-[var(--stone-900)]">
            {MOCK.companies}
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
