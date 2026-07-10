import { Mic } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { Sparkline } from './Sparkline'
import { useWidgetSize } from '@/hooks/useWidgetSize'
import { useJobsokWidgetData } from './JobsokDataContext'
import type { WidgetProps } from './types'

export default function InterviewWidget({ id, size, onSizeChange, allowedSizes, editMode, onHide }: WidgetProps) {
  const { compact, minimal } = useWidgetSize(size)
  const sessions = useJobsokWidgetData('interviewSessions')

  // Loading: context not yet resolved
  if (sessions === undefined) {
    return (
      <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode} onHide={onHide}>
        <Widget.Header icon={Mic} title="Intervjuträning" />
      </Widget>
    )
  }

  // Empty state: no sessions yet
  if (sessions.length === 0) {
    return (
      <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode} onHide={onHide}>
        <Widget.Header icon={Mic} title="Intervjuträning" />
        <Widget.Body>
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[13px] font-bold text-[var(--stone-900)] m-0 mb-1">Redo att öva?</p>
            <p className="text-[12px] text-[var(--stone-700)] m-0">Träna på vanliga intervjufrågor med direkt feedback</p>
          </div>
        </Widget.Body>
        <Widget.Footer>
          <Link
            to="/interview-simulator"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            Starta din första session
          </Link>
        </Widget.Footer>
      </Widget>
    )
  }

  const lastScore = sessions[0].score
  const scoreDisplay = lastScore !== null ? String(lastScore) : '—'
  // Sparkline: reverse chronological → ascending, filter nulls
  const trendValues = sessions
    .slice()
    .reverse()
    .map(s => s.score)
    .filter((n): n is number => n !== null)

  return (
    <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode} onHide={onHide}>
      <Widget.Header icon={Mic} title="Intervjuträning" />
      <Widget.Body>
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-baseline gap-2">
            <span className="text-[22px] font-bold leading-[1.1] text-[var(--stone-900)]">
              {scoreDisplay}
            </span>
            {lastScore !== null && (
              <span className="text-[12px] text-[var(--stone-700)]">/ 100</span>
            )}
          </div>
          <span className="text-[12px] text-[var(--stone-700)]">senaste poäng</span>
          {!compact && (
            <>
              <p className="text-[12px] text-[var(--stone-700)] mt-2 m-0">
                {sessions.length} {sessions.length === 1 ? 'övning' : 'övningar'} totalt
              </p>
              {!minimal && trendValues.length >= 2 && (
                <div className="mt-2">
                  <Sparkline values={trendValues} width={140} height={28} />
                </div>
              )}
            </>
          )}
        </div>
      </Widget.Body>
      {!compact && (
        <Widget.Footer>
          <Link
            to="/interview-simulator"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            Starta ny session
          </Link>
        </Widget.Footer>
      )}
    </Widget>
  )
}
