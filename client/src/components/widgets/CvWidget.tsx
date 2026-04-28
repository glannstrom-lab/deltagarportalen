import { FileUser, Check, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { ProgressRing } from './ProgressRing'
import { useWidgetSize } from '@/hooks/useWidgetSize'
import { useJobsokWidgetData } from './JobsokDataContext'
import type { WidgetProps } from './types'

function milestoneLabel(p: number): string {
  if (p >= 80) return 'Klar att skickas'
  if (p >= 60) return 'Nästan klart — 1 sektion kvar'
  if (p >= 30) return 'Bra start — fortsätt fylla i'
  return 'Kom igång med ditt CV'
}

export default function CvWidget({ id, size, onSizeChange, allowedSizes, editMode }: WidgetProps) {
  const { compact, minimal } = useWidgetSize(size)
  const ringSize = compact ? 48 : minimal ? 64 : 88
  const cv = useJobsokWidgetData('cv')

  // Loading: context not yet resolved
  if (cv === undefined) {
    return (
      <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode}>
        <Widget.Header icon={FileUser} title="CV" />
      </Widget>
    )
  }

  // Empty state: no CV created yet
  if (cv === null) {
    return (
      <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode}>
        <Widget.Header icon={FileUser} title="CV" />
        <Widget.Body>
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-1">Ditt CV väntar</p>
            <p className="text-[12px] text-[var(--stone-700)] m-0">Skapa ditt CV och kom igång med din jobbsökning</p>
          </div>
        </Widget.Body>
        <Widget.Footer>
          <Link
            to="/cv"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            Skapa CV
          </Link>
        </Widget.Footer>
      </Widget>
    )
  }

  const percent = cv.completion_pct ?? 0

  return (
    <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode}>
      <Widget.Header icon={FileUser} title="CV" />
      <Widget.Body>
        <div className={`flex ${compact ? 'flex-col items-center justify-center gap-2' : 'flex-row items-center gap-4'} flex-1`}>
          <ProgressRing value={percent} size={ringSize} label={`${percent}%`} />
          {!compact && (
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-[var(--c-text)] m-0 mb-1">
                {milestoneLabel(percent)}
              </p>
              <p className="text-[12px] font-normal text-[var(--stone-700)] m-0">
                Senast redigerad: {cv.updated_at}
              </p>
            </div>
          )}
        </div>
      </Widget.Body>
      {!compact && (
        <Widget.Footer>
          <Link
            to="/cv"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            Fortsätt redigera
          </Link>
          {!minimal && (
            <Link
              to="/cv"
              className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-bg)] text-[var(--c-text)] text-[12px] font-bold no-underline"
            >
              Förhandsgranska
            </Link>
          )}
        </Widget.Footer>
      )}
    </Widget>
  )
}
