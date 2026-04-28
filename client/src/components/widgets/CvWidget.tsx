import { FileUser, Check, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { ProgressRing } from './ProgressRing'
import { useWidgetSize } from '@/hooks/useWidgetSize'
import type { WidgetProps } from './types'

const MOCK_CV = {
  percent: 75,
  lastEdited: '2 dagar sedan',
  sections: [
    { name: 'Personlig info', status: 'done' as const },
    { name: 'Erfarenhet',     status: 'done' as const },
    { name: 'Utbildning',     status: 'done' as const },
    { name: 'Färdigheter',    status: 'warn' as const },
  ],
}

function milestoneLabel(p: number): string {
  if (p >= 80) return 'Klar att skickas'
  if (p >= 60) return 'Nästan klart — 1 sektion kvar'
  if (p >= 30) return 'Bra start — fortsätt fylla i'
  return 'Kom igång med ditt CV'
}

export default function CvWidget({ id, size, onSizeChange, allowedSizes, editMode }: WidgetProps) {
  const { compact, minimal } = useWidgetSize(size)
  const ringSize = compact ? 48 : minimal ? 64 : 88

  return (
    <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode}>
      <Widget.Header icon={FileUser} title="CV" />
      <Widget.Body>
        <div className={`flex ${compact ? 'flex-col items-center justify-center gap-2' : 'flex-row items-center gap-4'} flex-1`}>
          <ProgressRing value={MOCK_CV.percent} size={ringSize} label={`${MOCK_CV.percent}%`} />
          {!compact && (
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-[var(--c-text)] m-0 mb-1">
                {milestoneLabel(MOCK_CV.percent)}
              </p>
              <p className="text-[12px] font-normal text-[var(--stone-700)] m-0">
                Senast redigerad: {MOCK_CV.lastEdited}
              </p>
              {!minimal && (
                <ul className="list-none p-0 mt-2 space-y-1">
                  {MOCK_CV.sections.map(s => (
                    <li key={s.name} className="flex items-center gap-2 text-[12px] text-[var(--stone-700)]">
                      {s.status === 'done' ? (
                        <Check size={12} className="text-emerald-600" aria-hidden="true" />
                      ) : (
                        <AlertTriangle size={12} className="text-[var(--status-warning)]" aria-hidden="true" />
                      )}
                      <span>{s.name}</span>
                    </li>
                  ))}
                </ul>
              )}
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
