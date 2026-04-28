import { Search, Building2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { useWidgetSize } from '@/hooks/useWidgetSize'
import type { WidgetProps } from './types'

interface MatchRow {
  role: string
  company: string
  /** Qualitative label only — never raw percentage (UI-SPEC anti-shaming rule) */
  matchLabel: 'Bra match' | 'Mycket bra match'
}

const MOCK = {
  newToday: 12,
  matches: [
    { role: 'UX-designer',          company: 'Klarna',   matchLabel: 'Mycket bra match' as const },
    { role: 'Produktdesigner',      company: 'Spotify',  matchLabel: 'Bra match' as const },
    { role: 'Senior UX Researcher', company: 'iZettle',  matchLabel: 'Bra match' as const },
  ] satisfies MatchRow[],
}

export default function JobSearchWidget({ id, size, onSizeChange, allowedSizes, editMode }: WidgetProps) {
  const { compact, minimal } = useWidgetSize(size)

  return (
    <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode}>
      <Widget.Header icon={Search} title="Sök jobb" />
      <Widget.Body>
        <div className="flex-1 flex flex-col">
          <span className="text-[32px] font-bold leading-[1.1] text-[var(--stone-900)]">
            {MOCK.newToday}
          </span>
          <span className="text-[12px] text-[var(--stone-700)]">nya träffar idag</span>

          {!minimal && (
            <ul className="list-none p-0 mt-3 space-y-2">
              {MOCK.matches.map(m => (
                <li
                  key={`${m.role}-${m.company}`}
                  className="flex items-center justify-between gap-2 bg-[var(--c-bg)] rounded-[8px] px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-bold text-[var(--stone-900)] m-0 truncate">{m.role}</p>
                    <p className="text-[12px] font-normal text-[var(--stone-700)] m-0 truncate flex items-center gap-1">
                      <Building2 size={10} aria-hidden="true" />
                      {m.company}
                    </p>
                  </div>
                  <span className="text-[12px] font-bold text-[var(--c-text)] whitespace-nowrap">
                    {m.matchLabel}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Widget.Body>
      {!compact && (
        <Widget.Footer>
          <Link
            to="/job-search"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-[7px] bg-[var(--c-solid)] text-white text-[12px] font-bold no-underline"
          >
            Visa alla {MOCK.newToday} träffar
          </Link>
        </Widget.Footer>
      )}
    </Widget>
  )
}
