import { FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { useWidgetSize } from '@/hooks/useWidgetSize'
import { useJobsokWidgetData } from './JobsokDataContext'
import type { WidgetProps } from './types'

export default function CoverLetterWidget({ id, size, onSizeChange, allowedSizes, editMode }: WidgetProps) {
  const { compact, minimal } = useWidgetSize(size)
  const coverLetters = useJobsokWidgetData('coverLetters')

  // Loading: context not yet resolved
  if (coverLetters === undefined) {
    return (
      <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode}>
        <Widget.Header icon={FileText} title="Personligt brev" />
      </Widget>
    )
  }

  // Empty state: no cover letters yet
  if (coverLetters.length === 0) {
    return (
      <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode}>
        <Widget.Header icon={FileText} title="Personligt brev" />
        <Widget.Body>
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-1">Inga brev ännu</p>
            <p className="text-[12px] text-[var(--stone-700)] m-0">Generera ett anpassat brev till din nästa ansökan</p>
          </div>
        </Widget.Body>
        <Widget.Footer>
          <Link
            to="/cover-letter"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            + Generera brev
          </Link>
        </Widget.Footer>
      </Widget>
    )
  }

  const count = coverLetters.length
  const lastTitle = coverLetters[0].title ?? 'utkast'

  return (
    <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode}>
      <Widget.Header icon={FileText} title="Personligt brev" />
      <Widget.Body>
        <div className="flex-1 flex flex-col justify-center">
          <span className="text-[32px] font-bold leading-[1.1] text-[var(--stone-900)]">
            {count}
          </span>
          <span className="text-[12px] text-[var(--stone-700)]">utkast</span>
          {!compact && (
            <p className="text-[12px] text-[var(--stone-700)] mt-2 m-0">
              Senast: {lastTitle}
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
