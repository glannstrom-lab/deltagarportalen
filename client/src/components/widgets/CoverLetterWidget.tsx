import { FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { useWidgetSize } from '@/hooks/useWidgetSize'
import type { WidgetProps } from './types'

const MOCK = { count: 3, lastEdited: 'UX-designer hos Klarna · igår' }

export default function CoverLetterWidget({ id, size, onSizeChange, allowedSizes, editMode }: WidgetProps) {
  const { compact, minimal } = useWidgetSize(size)

  return (
    <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode}>
      <Widget.Header icon={FileText} title="Personligt brev" />
      <Widget.Body>
        <div className="flex-1 flex flex-col justify-center">
          <span className="text-[32px] font-bold leading-[1.1] text-[var(--stone-900)]">
            {MOCK.count}
          </span>
          <span className="text-[12px] text-[var(--stone-700)]">utkast</span>
          {!compact && (
            <p className="text-[12px] text-[var(--stone-700)] mt-2 m-0">
              Senast: {MOCK.lastEdited}
            </p>
          )}
        </div>
      </Widget.Body>
      {!compact && (
        <Widget.Footer>
          <Link
            to="/cover-letter"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            + Generera nytt brev
          </Link>
          {!minimal && (
            <Link
              to="/cover-letter"
              className="inline-flex items-center min-h-[44px] px-3 py-1.5 text-[var(--c-text)] text-[12px] font-bold no-underline hover:underline"
            >
              Visa alla →
            </Link>
          )}
        </Widget.Footer>
      )}
    </Widget>
  )
}
