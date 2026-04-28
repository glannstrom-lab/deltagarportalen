import { Mic } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { Sparkline } from './Sparkline'
import { useWidgetSize } from '@/hooks/useWidgetSize'
import type { WidgetProps } from './types'

const MOCK = {
  lastScore: 84,
  weeklyExercises: 3,
  trend: [62, 68, 71, 70, 76, 80, 82, 84],
}

export default function InterviewWidget({ id, size, onSizeChange, allowedSizes, editMode }: WidgetProps) {
  const { compact, minimal } = useWidgetSize(size)

  return (
    <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode}>
      <Widget.Header icon={Mic} title="Intervjuträning" />
      <Widget.Body>
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-baseline gap-2">
            <span className="text-[22px] font-bold leading-[1.1] text-[var(--stone-900)]">
              {MOCK.lastScore}
            </span>
            <span className="text-[12px] text-[var(--stone-700)]">/ 100</span>
          </div>
          <span className="text-[12px] text-[var(--stone-700)]">senaste poäng</span>
          {!compact && (
            <>
              <p className="text-[12px] text-[var(--stone-700)] mt-2 m-0">
                {MOCK.weeklyExercises} övningar denna vecka
              </p>
              {!minimal && (
                <div className="mt-2">
                  <Sparkline values={MOCK.trend} width={140} height={28} />
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
