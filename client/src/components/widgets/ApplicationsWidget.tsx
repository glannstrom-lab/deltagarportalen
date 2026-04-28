// ApplicationsWidget — Mina ansökningar
// Shows total application count + 4-segment stacked bar (closed segment de-emphasized)
// + amber alert chip for pending action (anti-shaming rule: closed count NOT primary KPI)

import { Briefcase, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Widget } from './Widget'
import { StackedBar, type StackedBarSegment } from './StackedBar'
import { useWidgetSize } from '@/hooks/useWidgetSize'
import type { WidgetProps } from './types'

const MOCK = {
  total: 12,
  segments: [
    { label: 'aktiva',        count: 4, color: 'var(--c-solid)' },
    { label: 'svar inväntas', count: 2, color: 'var(--c-accent)' },
    { label: 'intervju',      count: 1, color: '#059669' },
    // De-emphasized per anti-shaming rule (UI-SPEC): closed segment uses stone-300 + reduced opacity
    { label: 'avslutade',     count: 5, color: '#C9C6BD', deEmphasized: true },
  ] satisfies StackedBarSegment[],
  pendingAlert: '1 ansökan väntar på ditt svar',
}

export default function ApplicationsWidget({ id, size, onSizeChange, allowedSizes, editMode }: WidgetProps) {
  const { compact, minimal } = useWidgetSize(size)

  return (
    <Widget id={id} size={size} onSizeChange={onSizeChange} allowedSizes={allowedSizes} editMode={editMode}>
      <Widget.Header icon={Briefcase} title="Mina ansökningar" />
      <Widget.Body>
        <div className="flex-1 flex flex-col">
          <div className="flex items-baseline gap-2">
            <span className="text-[32px] font-bold leading-[1.1] text-[var(--stone-900)]">
              {MOCK.total}
            </span>
            <span className="text-[12px] text-[var(--stone-700)]">totalt</span>
          </div>

          {!compact && (
            <div className="mt-3">
              <StackedBar segments={MOCK.segments} showLegend={!minimal} />
            </div>
          )}

          {!compact && MOCK.pendingAlert && (
            <div
              className="mt-3 inline-flex items-center gap-2 self-start px-2 py-1 rounded-md text-[12px] font-bold"
              style={{ background: '#FEF3C7', color: '#92400E' }}
              role="status"
            >
              <AlertTriangle size={12} aria-hidden="true" />
              <span>{MOCK.pendingAlert}</span>
            </div>
          )}
        </div>
      </Widget.Body>
      {!minimal && (
        <Widget.Footer>
          <Link
            to="/applications"
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 text-[var(--c-text)] text-[12px] font-bold no-underline hover:underline"
          >
            Visa pipeline →
          </Link>
        </Widget.Footer>
      )}
    </Widget>
  )
}
